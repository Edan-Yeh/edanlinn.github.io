(function(root,factory){
  'use strict';
  const version=factory();
  if(typeof module==='object'&&module.exports)module.exports=version;
  if(root)root.EDAN_APP_VERSION=version;

  if(root&&root.document&&root.navigator){
    let waitingWorker=null,reloading=false;

    function hideBanner(){
      root.document.getElementById('appUpdateBanner')?.classList.add('hidden');
    }

    function showBanner(worker){
      if(!worker)return;
      waitingWorker=worker;
      const text=root.document.getElementById('appUpdateText');
      if(text)text.textContent='新版本 '+version.release+' 已準備完成';
      root.document.getElementById('appUpdateBanner')?.classList.remove('hidden');
    }

    async function setupUpdateUX(){
      if(!('serviceWorker' in root.navigator)||!root.location?.protocol?.startsWith('http'))return;
      try{
        const reg=await root.navigator.serviceWorker.register('sw.js');
        if(reg.waiting&&root.navigator.serviceWorker.controller)showBanner(reg.waiting);

        reg.addEventListener('updatefound',()=>{
          const worker=reg.installing;
          if(!worker)return;
          worker.addEventListener('statechange',()=>{
            if(worker.state==='installed'&&root.navigator.serviceWorker.controller)showBanner(worker);
          });
        });

        root.document.getElementById('appUpdateNow')?.addEventListener('click',()=>{
          if(waitingWorker)waitingWorker.postMessage({type:'SKIP_WAITING'});
          else reg.update().catch(()=>{});
        });
        root.document.getElementById('appUpdateLater')?.addEventListener('click',hideBanner);

        root.navigator.serviceWorker.addEventListener('controllerchange',()=>{
          if(reloading)return;
          reloading=true;
          root.location.reload();
        });

        setTimeout(()=>reg.update().catch(()=>{}),1200);
      }catch(err){
        console.warn('Service worker update UX unavailable',err);
      }
    }

    if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',setupUpdateUX,{once:true});
    else setupUpdateUX();
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  return Object.freeze({
    release:'2026.10.29-v79',
    date:'2026-10-28',
    assetTag:'20261029v79',
    cache:'edan-english-coach-20261029-v79'
  });
});
