const CACHE_NAME = 'landscaping-app-v1';

// Cache all fetched assets on the fly (cache-first for same-origin assets)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only cache GET requests for same-origin assets (JS, CSS, HTML, images, fonts)
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // Skip API/backend calls and Vite dev server paths — never cache those
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/functions/')) return;
  if (url.pathname.startsWith('/src/') || url.pathname.startsWith('/node_modules/') ||
      url.pathname.startsWith('/@vite') || url.pathname.startsWith('/@react-refresh')) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        });
      })
    )
  );
});
