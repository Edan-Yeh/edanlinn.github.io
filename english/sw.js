const CACHE='edan-english-coach-v33-20261018-unified-pet-1';
const ASSETS=['./','./index.html','./challenge.html','./styles.css?v=20261018v33-1','./app.js?v=20261018v33-1','./little-e.js?v=20261018v33-1','./question-bank.js?v=20261018v33-1','./supabase-config.js?v=20261018v33-1','./auth.js?v=20261018v33-1','./manifest.webmanifest','./icon.svg','./assets/little-e-mascot-v30.webp','./assets/little-e-blink-v31.webp','./assets/little-e-happy-v31.webp','./assets/little-e-thinking-v31.webp','./assets/little-e-reading-v31.webp','./assets/little-e-sleep-v31.webp'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(fetch(event.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return res;}).catch(()=>caches.match(event.request)));
});