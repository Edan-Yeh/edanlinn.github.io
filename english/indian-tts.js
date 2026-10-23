(() => {
  'use strict';

  const VOICE_ID='en_IN-spicor-medium';
  const ENGINE_LABEL='Piper · SPICOR Indian English';
  const WORKER_URL='indian-tts-worker.js';

  let worker=null;
  let sequence=0;
  let currentAudio=null;
  let currentAudioUrl='';
  let audioContext=null;
  let audioSource=null;
  const pending=new Map();
  let engineStatus={state:'idle',cachedModel:null,updatedAt:null};

  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

  function supportsLocalAi(){
    return !!(window.Worker&&window.WebAssembly&&window.Blob&&window.URL?.createObjectURL);
  }

  function emit(fn,data){
    try{if(typeof fn==='function')fn(data);}catch(e){}
  }
  function setEngineStatus(next){
    engineStatus={...engineStatus,...next,updatedAt:new Date().toISOString()};
    try{window.dispatchEvent(new CustomEvent('edan:tts-status',{detail:{engine:'india',...engineStatus}}));}catch(e){}
    return engineStatus;
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
    }catch(e){return null;}
  }

  function rejectPending(code='cancelled'){
    for(const [,entry] of pending){
      const err=new Error(code);err.code=code;entry.reject(err);
    }
    pending.clear();
  }

  function destroyWorker(code='worker_reset'){
    rejectPending(code);
    if(worker){try{worker.terminate();}catch(e){} worker=null;}
  }

  function makeWorker(){
    const w=new Worker(WORKER_URL,{name:'edan-indian-tts'});
    w.addEventListener('message',event=>{
      const data=event.data||{};
      const entry=pending.get(data.requestId);
      if(!entry)return;

      if(data.type==='state'){
        emit(entry.onStatus,{phase:data.phase});
        return;
      }
      if(data.type==='progress'){
        emit(entry.onStatus,{
          phase:data.phase||'model',
          percent:Number.isFinite(data.percent)?data.percent:null,
          loaded:data.loaded,
          total:data.total
        });
        return;
      }
      if(data.type==='warmup-result'){
        pending.delete(data.requestId);
        setEngineStatus({state:data.ready?'ready':'not-cached',cachedModel:!!data.cachedModel});
        entry.resolve({ready:!!data.ready,cachedModel:!!data.cachedModel});
        return;
      }
      if(data.type==='result'){
        pending.delete(data.requestId);
        setEngineStatus({state:'ready',cachedModel:!!data.cachedModel});
        entry.resolve({blob:data.audio,cachedModel:!!data.cachedModel});
        return;
      }
      if(data.type==='error'){
        pending.delete(data.requestId);
        setEngineStatus({state:'error',errorCode:data.code||'local_ai_failed'});
        const err=new Error(data.message||'local_ai_failed');
        err.code=data.code||'local_ai_failed';
        err.stage=data.stage||'';
        entry.reject(err);
      }
    });
    w.addEventListener('error',event=>{
      const err=new Error(event.message||'local_ai_worker_failed');
      err.code='local_ai_worker_failed';
      for(const [,entry] of pending)entry.reject(err);
      pending.clear();
      if(worker===w){try{w.terminate();}catch(e){} worker=null;}
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
      setEngineStatus({state:'loading'});
      getWorker().postMessage({type:'synthesize',requestId,text});
    });
  }
  function warmup(){
    if(!supportsLocalAi())return Promise.resolve({ready:false,cachedModel:false,unsupported:true});
    return new Promise((resolve,reject)=>{
      const requestId=++sequence;
      pending.set(requestId,{resolve,reject,onStatus:null});
      setEngineStatus({state:'checking'});
      getWorker().postMessage({type:'warmup',requestId});
    });
  }
  function getStatus(){return {...engineStatus};}

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
      if(currentAudioUrl===url){URL.revokeObjectURL(url);currentAudioUrl='';}
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
    if(!value){const err=new Error('empty_text');err.code='empty_text';throw err;}
    if(!supportsLocalAi()){const err=new Error('local_ai_unsupported');err.code='local_ai_unsupported';throw err;}

    primeAudio();
    stopAudio();
    if(pending.size)destroyWorker('superseded');

    emit(onStatus,{phase:'engine'});
    const {blob,cachedModel}=await synthesize(value,onStatus);
    emit(onStatus,{phase:'synth'});
    const playback=await playBlob(blob,rate);
    return {played:true,source:'local-ai',voiceName:ENGINE_LABEL,voiceId:VOICE_ID,cachedModel,playback};
  }

  window.EDAN_INDIAN_TTS=Object.freeze({
    speak,
    warmup,
    getStatus,
    stop:stopAudio,
    supported:supportsLocalAi,
    voiceId:VOICE_ID,
    engineLabel:ENGINE_LABEL
  });
})();
