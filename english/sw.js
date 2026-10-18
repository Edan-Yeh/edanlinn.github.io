const CACHE='edan-english-coach-v30-20261018-validated-mascot-1';
const ASSETS=['./','./index.html','./challenge.html','./styles.css?v=20261018v30-1','./app.js?v=20261018v30-1','./little-e.js?v=20261018v30-1','./question-bank.js?v=20261018v30-1','./supabase-config.js?v=20261018v30-1','./auth.js?v=20261018v30-1','./manifest.webmanifest','./icon.svg','./assets/little-e-mascot-v30.webp'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(fetch(event.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return res;}).catch(()=>caches.match(event.request)));
});