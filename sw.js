const CACHE_NAME = 'progrid-cache-v0.2.3';
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
  './icons/app-icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // Safely cache core assets
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

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Allow cross-origin requests (e.g. Unsplash, search engines) to run natively
  if (url.origin !== self.location.origin) return;

  // 1. Navigation Requests: Cache-First for instant 0ms launch & resilience against network drops
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      caches.match('./index.html').then(cachedHtml => {
        // Background revalidation
        const networkUpdate = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put('./index.html', clone));
          }
          return networkResponse;
        }).catch(() => null);

        if (cachedHtml) {
          // Serve from cache instantly
          return cachedHtml;
        }

        // If not yet in cache, await network
        return networkUpdate.then(async netResp => {
          if (netResp) return netResp;
          return (await caches.match('./index.html')) || (await caches.match('./')) || new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>ProGrid</title></head><body style="background:#1e2126;color:#fff;font-family:sans-serif;text-align:center;padding:50px;"><h2>ProGrid Workspace</h2><p>Please check your connection and refresh.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        });
      })
    );
    return;
  }

  // 2. Local Assets (JS, CSS, JSON, Images): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.ok) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => {
        return cachedResponse || new Response('', { status: 404, statusText: 'Not Found' });
      });

      return cachedResponse || fetchPromise;
    })
  );
});
