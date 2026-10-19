(() => {
  'use strict';

  // Zero-cost browser TTS: the Indian English model is downloaded on first use
  // and cached by the Piper library in Origin Private File System (OPFS).
  // Runtime package: @the-vedantic-coder/piper-tts-web 1.0.10
  // Voice: en_IN-spicor-medium (NavGurukul / SPICOR Indian English).
  const VOICE_ID='en_IN-spicor-medium';
  const LIB_URL='https://cdn.jsdelivr.net/npm/@the-vedantic-coder/piper-tts-web@1.0.10/+esm';
  const ENGINE_LABEL='Piper · SPICOR Indian English';

  let worker=null;
  let workerObjectUrl='';
  let sequence=0;
  let currentAudio=null;
  let currentAudioUrl='';
  let audioContext=null;
  let audioSource=null;
  const pending=new Map();

  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

  function supportsLocalAi(){
    return !!(
      window.Worker &&
      window.WebAssembly &&
      window.Blob &&
      window.URL?.createObjectURL &&
      navigator.storage?.getDirectory
    );
  }

  function emit(fn,data){
    try{if(typeof fn==='function')fn(data);}catch(e){}
  }

  function stopAudio(){
    if(currentAudio){
      try{currentAudio.pause();}catch(e){}
      currentAudio.removeAttribute('src');
      try{currentAudio.load();}catch(e){}
      currentAudio=null;
    }
    if(currentAudioUrl){
      try{URL.revokeObjectURL(currentAudioUrl);}catch(e){}
      currentAudioUrl='';
    }
    if(audioSource){
      try{audioSource.stop();}catch(e){}
      try{audioSource.disconnect();}catch(e){}
      audioSource=null;
    }
  }

  function primeAudio(){
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return null;
    try{
      if(!audioContext)audioContext=new Ctx();
      if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
      return audioContext;
    }catch(e){
      return null;
    }
  }

  function rejectPending(code='cancelled'){
    for(const [,entry] of pending){
      const err=new Error(code);
      err.code=code;
      entry.reject(err);
    }
    pending.clear();
  }

  function destroyWorker(code='worker_reset'){
    rejectPending(code);
    if(worker){
      try{worker.terminate();}catch(e){}
      worker=null;
    }
    if(workerObjectUrl){
      try{URL.revokeObjectURL(workerObjectUrl);}catch(e){}
      workerObjectUrl='';
    }
  }

  function makeWorker(){
    const source=`
const LIB_URL=${JSON.stringify(LIB_URL)};
const VOICE_ID=${JSON.stringify(VOICE_ID)};
let ttsPromise=null;
let queue=Promise.resolve();

function loadTts(){
  if(!ttsPromise)ttsPromise=import(LIB_URL);
  return ttsPromise;
}

async function synthesize(job){
  const {requestId,text}=job;
  try{
    self.postMessage({type:'state',requestId,phase:'engine'});
    const tts=await loadTts();
    let cachedModel=false;
    try{
      const stored=await tts.stored();
      cachedModel=Array.isArray(stored)&&stored.includes(VOICE_ID);
    }catch(e){}

    if(cachedModel)self.postMessage({type:'state',requestId,phase:'synth'});
    else self.postMessage({type:'state',requestId,phase:'model'});

    const audio=await tts.predict(
      {text,voiceId:VOICE_ID},
      progress=>self.postMessage({
        type:'progress',
        requestId,
        loaded:Number(progress?.loaded)||0,
        total:Number(progress?.total)||0
      })
    );
    self.postMessage({type:'result',requestId,audio,cachedModel});
  }catch(error){
    self.postMessage({
      type:'error',
      requestId,
      code:error?.code||'local_ai_failed',
      message:error?.message||String(error)
    });
  }
}

self.addEventListener('message',event=>{
  if(event.data?.type!=='synthesize')return;
  const job=event.data;
  queue=queue.then(()=>synthesize(job)).catch(()=>{});
});
`;
    const blob=new Blob([source],{type:'text/javascript'});
    workerObjectUrl=URL.createObjectURL(blob);
    const w=new Worker(workerObjectUrl,{type:'module',name:'edan-indian-tts'});
    w.addEventListener('message',event=>{
      const data=event.data||{};
      const entry=pending.get(data.requestId);
      if(!entry)return;

      if(data.type==='state'){
        emit(entry.onStatus,{phase:data.phase});
        return;
      }
      if(data.type==='progress'){
        const percent=data.total>0?Math.max(0,Math.min(100,Math.round(data.loaded*100/data.total))):null;
        emit(entry.onStatus,{phase:'model',percent,loaded:data.loaded,total:data.total});
        return;
      }
      if(data.type==='result'){
        pending.delete(data.requestId);
        entry.resolve({blob:data.audio,cachedModel:!!data.cachedModel});
        return;
      }
      if(data.type==='error'){
        pending.delete(data.requestId);
        const err=new Error(data.message||'local_ai_failed');
        err.code=data.code||'local_ai_failed';
        entry.reject(err);
      }
    });
    w.addEventListener('error',event=>{
      const err=new Error(event.message||'local_ai_worker_failed');
      err.code='local_ai_worker_failed';
      for(const [,entry] of pending)entry.reject(err);
      pending.clear();
      destroyWorker('local_ai_worker_failed');
    });
    return w;
  }

  function getWorker(){
    if(!worker)worker=makeWorker();
    return worker;
  }

  function synthesize(text,onStatus){
    return new Promise((resolve,reject)=>{
      const requestId=++sequence;
      pending.set(requestId,{resolve,reject,onStatus});
      getWorker().postMessage({type:'synthesize',requestId,text});
    });
  }

  async function playBlob(blob,rate){
    stopAudio();
    const safeRate=clamp(Number(rate)||1,.72,1.22);
    const ctx=primeAudio();
    const url=URL.createObjectURL(blob);
    const audio=new Audio(url);
    currentAudio=audio;
    currentAudioUrl=url;
    audio.preload='auto';
    audio.playbackRate=safeRate;
    audio.defaultPlaybackRate=safeRate;
    if('preservesPitch' in audio)audio.preservesPitch=true;
    if('mozPreservesPitch' in audio)audio.mozPreservesPitch=true;
    if('webkitPreservesPitch' in audio)audio.webkitPreservesPitch=true;

    const cleanup=()=>{
      if(currentAudio!==audio)return;
      currentAudio=null;
      if(currentAudioUrl===url){
        URL.revokeObjectURL(url);
        currentAudioUrl='';
      }
    };
    audio.addEventListener('ended',cleanup,{once:true});
    audio.addEventListener('error',cleanup,{once:true});

    try{
      await audio.play();
      return 'html-audio';
    }catch(error){
      cleanup();
      if(!ctx)throw error;
      if(ctx.state==='suspended')await ctx.resume();
      const bytes=await blob.arrayBuffer();
      const buffer=await ctx.decodeAudioData(bytes.slice(0));
      const source=ctx.createBufferSource();
      source.buffer=buffer;
      source.playbackRate.value=safeRate;
      source.connect(ctx.destination);
      source.onended=()=>{if(audioSource===source)audioSource=null;};
      audioSource=source;
      source.start(0);
      return 'web-audio';
    }
  }

  async function speak(text,{rate=1,onStatus=null}={}){
    const value=String(text||'').trim();
    if(!value){
      const err=new Error('empty_text');
      err.code='empty_text';
      throw err;
    }
    if(!supportsLocalAi()){
      const err=new Error('local_ai_unsupported');
      err.code='local_ai_unsupported';
      throw err;
    }

    // Prime Web Audio while the click still has user activation. The actual
    // WAV arrives later after local inference.
    primeAudio();
    stopAudio();

    // A second click while inference is running should cancel stale work
    // rather than make the user wait for two generations.
    if(pending.size)destroyWorker('superseded');

    emit(onStatus,{phase:'engine'});
    const {blob,cachedModel}=await synthesize(value,onStatus);
    emit(onStatus,{phase:'synth'});
    const playback=await playBlob(blob,rate);
    return {
      played:true,
      source:'local-ai',
      voiceName:ENGINE_LABEL,
      voiceId:VOICE_ID,
      cachedModel,
      playback
    };
  }

  function stop(){
    stopAudio();
  }

  window.EDAN_INDIAN_TTS=Object.freeze({
    speak,
    stop,
    supported:supportsLocalAi,
    voiceId:VOICE_ID,
    engineLabel:ENGINE_LABEL
  });
})();
