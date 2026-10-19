importScripts('./version.js');
// Refresh shell when navigation or locale-sensitive speech behavior changes.
const CACHE=self.EDAN_APP_VERSION.cache;
const ASSETS=['./','./index.html','./challenge.html','./version.js','./styles.css','./app.js','./indian-tts.js','./indian-tts-worker.js','./piper-phonemize.js','./little-e-core.js','./little-e.js','./question-bank.js','./supabase-config.js','./auth.js','./manifest.webmanifest','./icon.svg','./assets/little-e-mascot-v30.webp','./assets/little-e-blink-v31.webp','./assets/little-e-happy-v31.webp','./assets/little-e-thinking-v31.webp','./assets/little-e-reading-v31.webp','./assets/little-e-eat-v34.webp','./assets/little-e-sit-v34.webp','./assets/little-e-sleep-v34.webp'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  // Piper model bytes are cached by indian-tts-worker.js. Do not duplicate
  // large cross-origin AI/CDN assets inside the app-shell cache.
  if(url.origin!==self.location.origin)return;
  event.respondWith(fetch(event.request).then(res=>{
    if(res.ok){
      const copy=res.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy));
    }
    return res;
  }).catch(()=>caches.match(event.request)));
});
