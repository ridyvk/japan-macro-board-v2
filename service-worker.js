const CACHE = 'jmb-v2';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE_URLS)).then(self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Network-first for API calls; cache-first for others
  if (url.origin.includes('dashboard.e-stat.go.jp')) {
    event.respondWith(
      fetch(event.request).then(response => {
        const respClone = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, respClone));
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, clone));
        return resp;
      });
    })
  );
});