const CACHE_NAME = 'progrid-cache-v0.1.7';
const urlsToCache = [
  './',
  './index.html',
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
  './widgets/community/calculator.js',
  './widgets/community/quote.js',
  './widgets/community/pomodoro.js',
  './widgets/registry.json',
  './favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of urlsToCache) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn('PWA Cache item failed:', url, err);
        }
      }
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Allow cross-origin requests (e.g. Unsplash images, search engines) to bypass Service Worker without interception
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
      // Stale-While-Revalidate / Cache-First strategy for local assets:
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(async () => {
        // If network failed and navigating, return cached home
        if (event.request.mode === 'navigate') {
          const fallback = await caches.match('./index.html') || await caches.match('./');
          if (fallback) return fallback;
        }
        // If already cached, return that
        if (cachedResponse) return cachedResponse;
        // Never return undefined (which causes browser connection reset / SSL error page)
        return new Response('Network offline. Please check connection.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      });

      // If cached response exists, return instantly (0ms load time), while updating cache in background
      return cachedResponse || fetchPromise;
    })
  );
});
