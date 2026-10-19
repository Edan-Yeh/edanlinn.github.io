'use strict';

const VOICE_ID='en_US-lessac-medium';
const MODEL_BASE='https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium';
const MODEL_PATH='en_US-lessac-medium.onnx';
const MODEL_URL=MODEL_BASE+'/'+MODEL_PATH;
const CONFIG_URL=MODEL_URL+'.json';
const ORT_BASE='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/';
const ORT_SCRIPT=ORT_BASE+'ort.min.js';
const PIPER_DATA='https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.data';
const PIPER_WASM='https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.wasm';
const MODEL_CACHE='edan-north-american-piper-model-v1';

let initPromise=null;
let session=null;
let modelConfig=null;
let currentStage='boot';

function post(type,requestId,extra={}){
  self.postMessage({type,requestId,...extra});
}

function failCode(stage){
  if(stage==='ort')return 'ort_load_failed';
  if(stage==='model')return 'model_download_failed';
  if(stage==='session')return 'model_session_failed';
  if(stage==='phonemizer')return 'phonemizer_failed';
  if(stage==='inference')return 'local_ai_inference_failed';
  return 'local_ai_failed';
}

async function fetchBytes(url,requestId,{progress=false}={}){
  let cache=null;
  try{cache=await caches.open(MODEL_CACHE);}catch(e){}
  if(cache){
    try{
      const hit=await cache.match(url);
      if(hit){
        const buf=await hit.arrayBuffer();
        if(buf.byteLength)return {buffer:buf,cached:true};
      }
    }catch(e){}
  }

  const response=await fetch(url,{mode:'cors',cache:'no-cache'});
  if(!response.ok)throw new Error('HTTP '+response.status+' while downloading '+url);

  const total=Number(response.headers.get('content-length'))||0;
  if(!response.body){
    const buf=await response.arrayBuffer();
    if(cache){
      try{await cache.put(url,new Response(buf.slice(0),{headers:{'Content-Type':'application/octet-stream'}}));}catch(e){}
    }
    return {buffer:buf,cached:false};
  }

  const reader=response.body.getReader();
  const chunks=[];
  let loaded=0;
  while(true){
    const {done,value}=await reader.read();
    if(done)break;
    chunks.push(value);
    loaded+=value.byteLength;
    if(progress)post('progress',requestId,{phase:'model',loaded,total,percent:total?Math.round(loaded*100/total):null});
  }
  const bytes=new Uint8Array(loaded);
  let offset=0;
  for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}

  if(cache){
    try{await cache.put(url,new Response(bytes.slice(0),{headers:{'Content-Type':'application/octet-stream','Cache-Control':'max-age=31536000'}}));}catch(e){}
  }
  return {buffer:bytes.buffer,cached:false};
}

async function fetchJson(url){
  let cache=null;
  try{cache=await caches.open(MODEL_CACHE);}catch(e){}
  if(cache){
    try{
      const hit=await cache.match(url);
      if(hit)return await hit.json();
    }catch(e){}
  }
  const response=await fetch(url,{mode:'cors',cache:'no-cache'});
  if(!response.ok)throw new Error('HTTP '+response.status+' while downloading config');
  const text=await response.text();
  if(cache){
    try{await cache.put(url,new Response(text,{headers:{'Content-Type':'application/json','Cache-Control':'max-age=31536000'}}));}catch(e){}
  }
  return JSON.parse(text);
}

function pcm2wav(buffer,numChannels,sampleRate){
  const bufferLength=buffer.length;
  const headerLength=44;
  const view=new DataView(new ArrayBuffer(bufferLength*numChannels*2+headerLength));
  view.setUint32(0,0x46464952,true);
  view.setUint32(4,view.buffer.byteLength-8,true);
  view.setUint32(8,0x45564157,true);
  view.setUint32(12,0x20746d66,true);
  view.setUint32(16,0x10,true);
  view.setUint16(20,0x0001,true);
  view.setUint16(22,numChannels,true);
  view.setUint32(24,sampleRate,true);
  view.setUint32(28,numChannels*2*sampleRate,true);
  view.setUint16(32,numChannels*2,true);
  view.setUint16(34,16,true);
  view.setUint32(36,0x61746164,true);
  view.setUint32(40,2*bufferLength,true);
  let p=headerLength;
  for(let i=0;i<bufferLength;i++){
    const v=buffer[i];
    if(v>=1)view.setInt16(p,0x7fff,true);
    else if(v<=-1)view.setInt16(p,-0x8000,true);
    else view.setInt16(p,(v*0x8000)|0,true);
    p+=2;
  }
  return view.buffer;
}

async function initialize(requestId){
  if(session&&modelConfig)return {cachedModel:true};
  if(initPromise)return initPromise;

  initPromise=(async()=>{
    currentStage='ort';
    post('state',requestId,{phase:'engine'});
    if(typeof self.ort==='undefined')importScripts(ORT_SCRIPT);
    if(!self.ort)throw new Error('ONNX Runtime did not expose global ort');

    self.ort.env.allowLocalModels=false;
    self.ort.env.wasm.numThreads=1;
    self.ort.env.wasm.wasmPaths=ORT_BASE;

    currentStage='model';
    post('state',requestId,{phase:'model'});
    modelConfig=await fetchJson(CONFIG_URL);
    const model=await fetchBytes(MODEL_URL,requestId,{progress:true});

    currentStage='session';
    post('state',requestId,{phase:'engine'});
    session=await self.ort.InferenceSession.create(model.buffer,{
      executionProviders:['wasm'],
      graphOptimizationLevel:'all'
    });
    return {cachedModel:model.cached};
  })();

  try{return await initPromise;}
  catch(error){
    session=null;modelConfig=null;initPromise=null;
    error.code=error.code||failCode(currentStage);
    throw error;
  }
}

async function phonemeIds(text){
  currentStage='phonemizer';
  if(typeof self.createPiperPhonemize!=='function')importScripts('./piper-phonemize.js');
  return await new Promise(async(resolve,reject)=>{
    try{
      let settled=false;
      const module=await self.createPiperPhonemize({
        print:data=>{
          if(settled)return;
          try{
            const parsed=JSON.parse(data);
            if(parsed?.phoneme_ids){settled=true;resolve(parsed.phoneme_ids);}
          }catch(e){}
        },
        printErr:message=>{
          if(settled)return;
          settled=true;
          reject(new Error(String(message||'phonemizer error')));
        },
        locateFile:url=>{
          if(url.endsWith('.wasm'))return PIPER_WASM;
          if(url.endsWith('.data'))return PIPER_DATA;
          return url;
        }
      });
      module.callMain([
        '-l',
        modelConfig.espeak.voice,
        '--input',
        JSON.stringify([{text:text.trim()}]),
        '--espeak_data',
        '/espeak-ng-data'
      ]);
    }catch(error){reject(error);}
  });
}

async function synthesize(text,requestId){
  const init=await initialize(requestId);
  post('state',requestId,{phase:'synth'});
  const ids=await phonemeIds(text);

  currentStage='inference';
  const sampleRate=modelConfig.audio.sample_rate;
  const feeds={
    input:new self.ort.Tensor('int64',ids,[1,ids.length]),
    input_lengths:new self.ort.Tensor('int64',[ids.length],[1]),
    scales:new self.ort.Tensor('float32',[
      modelConfig.inference.noise_scale,
      modelConfig.inference.length_scale,
      modelConfig.inference.noise_w
    ],[3])
  };
  if(Object.keys(modelConfig.speaker_id_map||{}).length){
    feeds.sid=new self.ort.Tensor('int64',[0],[1]);
  }

  const result=await session.run(feeds);
  const output=result.output;
  const wav=pcm2wav(output.data,1,sampleRate);
  return {audio:new Blob([wav],{type:'audio/wav'}),cachedModel:!!init.cachedModel};
}

self.addEventListener('message',async event=>{
  const data=event.data||{};
  if(data.type!=='synthesize')return;
  const requestId=data.requestId;
  try{
    const result=await synthesize(String(data.text||''),requestId);
    post('result',requestId,result);
  }catch(error){
    post('error',requestId,{
      code:error?.code||failCode(currentStage),
      message:error?.message||String(error),
      stage:currentStage
    });
  }
});
