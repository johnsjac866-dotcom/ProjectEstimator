const CACHE_NAME = 'landscaping-app-v4';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  // Delete all old cache versions
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // Never cache API / backend function calls
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/functions/')) return;
  // Skip Vite dev server internals (safety — SW only runs in PROD)
  if (url.pathname.startsWith('/node_modules/') || url.pathname.startsWith('/@')) return;

  const isHTML = request.headers.get('accept')?.includes('text/html')
    || url.pathname === '/'
    || url.pathname.endsWith('.html');

  if (isHTML) {
    // Network-first for HTML so app updates are picked up immediately
    event.respondWith(
      fetch(request)
        .then(res => {
          caches.open(CACHE_NAME).then(c => c.put(request, res.clone()));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for all other assets (JS chunks, CSS, images, fonts)
  // Vite content-hashes JS/CSS filenames so stale-while-revalidate is safe
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
