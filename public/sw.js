const CACHE_NAME = 'landscaping-app-v3';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // Never cache API calls, Vite dev paths, or JS/CSS chunks
  // JS/CSS are handled by the browser via Vite content-hash URLs
  const skip = ['/api/', '/functions/', '/src/', '/node_modules/', '/@vite', '/@react-refresh'];
  if (skip.some(p => url.pathname.startsWith(p))) return;
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) return;

  // Only cache the app shell: HTML, manifest, images, fonts
  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(request).then(cached => {
        const networkFetch = fetch(request).then(response => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        });
        return cached || networkFetch;
      })
    )
  );
});
