// Sermon Studio Service Worker — Offline support + caching
const CACHE_NAME = "sermon-studio-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/js/config.js",
  "/js/prompts.js",
  "/js/utils.js",
  "/js/app.jsx",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

// CDN assets to cache on first use
const CDN_ASSETS = [
  "https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.2/babel.min.js",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never cache API calls or streaming responses
  if (url.pathname.startsWith("/api/") || event.request.method !== "GET") {
    return;
  }

  // CDN assets: cache-first
  if (CDN_ASSETS.some((a) => event.request.url.startsWith(a))) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          return res;
        });
      })
    );
    return;
  }

  // Static assets: network-first with cache fallback (so updates arrive immediately)
  if (url.origin === location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
});
