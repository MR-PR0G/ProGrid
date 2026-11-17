const CACHE_NAME = 'progrid-cache-v0.1.3';
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
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
