const CACHE_NAME = 'sampling-analyzer-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './assets/images/favicon.svg',
  './assets/images/icon-192.png',
  './assets/images/icon-512.png',
  './assets/vendor/chart.min.js',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Noto+Sans+TC:wght@400;700&display=swap'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching Assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cacheResponse = await caches.match(event.request);
      if (cacheResponse) return cacheResponse;
      // Fallback if both network and cache fail (optional, but prevents the TypeError)
      return new Response('Network error occurred', {
        status: 408,
        headers: { 'Content-Type': 'text/plain' }
      });
    })
  );
});
