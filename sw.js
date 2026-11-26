const CACHE_NAME = 'prospace-cache-v0.7.1';
const urlsToCache = [
  './',
  './index.html',
  'index.html',
  './css/style.css',
  './css/style.css?v=0.4.9',
  './js/app.js',
  './js/app.js?v=0.4.9',
  './js/grid.js',
  './js/storage.js',
  './js/hub.js',
  './js/wallpapers.js',
  './widgets/base.js',
  './widgets/shortcut.js',
  './widgets/search.js',
  './widgets/folder.js',
  './widgets/checklist.js',
  './widgets/clock.js',
  './widgets/notes.js',
  './widgets/community/quote.js',
  './widgets/community/pomodoro.js',
  './widgets/community/finance.js',
  './widgets/community/weather.js',
  './widgets/registry.json',
  './favicon.svg',
  './icons/app-icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-icon-192.png',
  './icons/maskable-icon-512.png',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // Safely cache core assets, handling potential single failures
      await Promise.allSettled(urlsToCache.map(url => cache.add(url)));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Allow cross-origin live API requests (CoinGecko, Binance, Unsplash) to pass directly
  if (url.origin !== self.location.origin) {
    return;
  }

  // 1. Navigation Requests: Cache-Resilient Offline-First Document Delivery
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      (async () => {
        // Try network first if online
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
            cache.put('./index.html', networkResponse.clone());
            return networkResponse;
          }
        } catch (err) {
          // Network failed (offline)
        }

        // Offline fallback: match exact request, or relative aliases
        const cached = await caches.match(event.request, { ignoreSearch: true })
          || await caches.match('./index.html', { ignoreSearch: true })
          || await caches.match('index.html', { ignoreSearch: true })
          || await caches.match('./', { ignoreSearch: true });

        if (cached) return cached;

        return new Response('<!DOCTYPE html><html><body><h1>ProSpace Offline</h1></body></html>', {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      })()
    );
    return;
  }

  // 2. Local Assets (JS, CSS, JSON, Images): Network-First when online, Cache fallback offline
  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        }
      } catch (err) {
        // Offline or network error: use cache
      }

      const cachedResponse = await caches.match(event.request)
        || await caches.match(event.request, { ignoreSearch: true });

      if (cachedResponse) return cachedResponse;
      return new Response('', { status: 404, statusText: 'Not Found' });
    })()
  );
});
