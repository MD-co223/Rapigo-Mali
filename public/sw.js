const CACHE_NAME = 'rapigo-mali-v2.8';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo-horizontal.png',
  '/logo-icon.png',
  '/app-icon.png',
  '/favicon.ico',
  '/favicon-32.png',
  '/favicon-16.png',
  '/apple-touch-icon.png',
  '/maskable-icon.png',
];

// Install — cache static assets (fail gracefully for missing assets)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch(() => {
            console.warn('[SW] Failed to cache:', url);
          })
        )
      )
    )
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — stale-while-revalidate for pages, network-first for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API calls and external requests
  if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) return;

  // For navigation requests (HTML pages), use network-first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/')))
    );
    return;
  }

  // For static assets, use cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Update cache in background
        fetch(request)
          .then((response) => {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
          })
          .catch(() => {});
        return cached;
      }
      return fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => new Response('Offline', { status: 503 }));
    })
  );
});