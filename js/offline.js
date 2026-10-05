// Development uses Vite's live modules. Production caches the built application.
if('serviceWorker' in navigator){
  if(import.meta.env.PROD){
    navigator.serviceWorker.register('/sw.js').then(registration=>{
      const tellWorker=()=>registration.active?.postMessage({type:'CACHE_ASSETS',urls:[...performance.getEntriesByType('resource').map(entry=>entry.name),...document.querySelectorAll('script[src],link[href]')].map(entry=>typeof entry==='string'?entry:entry.src || entry.href)});
      tellWorker();navigator.serviceWorker.addEventListener('controllerchange',tellWorker);
      window.addEventListener('load',tellWorker,{once:true});
    }).catch(error=>console.warn('Offline app cache unavailable:',error.message));
  }else{
    navigator.serviceWorker.getRegistrations().then(registrations=>Promise.all(registrations.filter(registration=>registration.active?.scriptURL===new URL('/sw.js',location.origin).href).map(registration=>registration.unregister())));
  }
}
