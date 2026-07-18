const CACHE_NAME = 'rapigo-mali-v2.7';
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
  '/android-chrome-192.png',
  '/android-chrome-512.png',
  '/maskable-icon.png',
];

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET and API calls
  if (request.method !== 'GET' || request.url.includes('/api/')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});