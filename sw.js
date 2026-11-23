const CACHE_NAME = 'progrid-cache-v0.5.4';
const urlsToCache = [
  './',
  './index.html',
  'index.html',
  './css/style.css',
  './js/app.js',
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

        return new Response('<!DOCTYPE html><html><body><h1>ProGrid Offline</h1></body></html>', {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      })()
    );
    return;
  }

  // 2. Local Assets (JS, CSS, JSON, Images): Stale-While-Revalidate with search query tolerance
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(event.request, { ignoreSearch: true });

      const fetchPromise = fetch(event.request)
        .then(async networkResponse => {
          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => cachedResponse || new Response('', { status: 404, statusText: 'Not Found' }));

      return cachedResponse || fetchPromise;
    })()
  );
});
