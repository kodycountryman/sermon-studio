const CACHE_NAME='sermon-studio-offline-v2';
const safeAsset=url=>url.origin===self.location.origin && (url.pathname.startsWith('/assets/') || ['/','/index.html','/manifest.json','/icon-192.png','/icon-512.png'].includes(url.pathname));
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const response=await fetch('/index.html',{cache:'reload'});
    if(!response.ok)throw new Error('App shell unavailable');
    const html=await response.clone().text();
    await cache.put('/index.html',response);await cache.put('/',new Response(html,{headers:{'Content-Type':'text/html'}}));
    const assets=[...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(match=>new URL(match[1],self.location.origin)).filter(safeAsset);
    await cache.addAll([...new Set([...assets.map(url=>url.href),'/manifest.json','/icon-192.png','/icon-512.png'])]);
  })());
  // New workers activate on the next navigation, keeping an open editing session stable.
});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith('sermon-studio-') && key!==CACHE_NAME)await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('message',event=>{
  if(event.data?.type==='CACHE_ASSETS')event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await Promise.allSettled((event.data.urls || []).map(value=>new URL(value,self.location.origin)).filter(safeAsset).map(async url=>{if(!await cache.match(url.href))await cache.add(url.href);}));
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  // API, database traffic and manuscript contents never enter the app-shell cache.
  if(request.method!=='GET' || !safeAsset(url))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    if(url.pathname.startsWith('/assets/')){
      const cached=await cache.match(request);if(cached)return cached;
    }
    try{
      const response=await fetch(request);
      if(response.ok)await cache.put(request,response.clone());
      return response;
    }catch(error){
      const cached=await cache.match(request) || (request.mode==='navigate'?await cache.match('/index.html'):null);
      if(cached)return cached;throw error;
    }
  })());
});
