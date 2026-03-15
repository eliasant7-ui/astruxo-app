// astruXo Service Worker - NO CACHE MODE
const CACHE_VERSION = '5';

// Install event - skip waiting immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v5 - NO CACHE MODE');
  self.skipWaiting();
});

// Activate event - DELETE ALL OLD CACHES
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v5 - Deleting all old caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[SW] All caches deleted - Running in NO CACHE mode');
    })
  );
  self.clients.claim();
});

// Fetch event - NETWORK ONLY (no caching at all)
self.addEventListener('fetch', (event) => {
  // Pass everything through to network, no caching
  event.respondWith(fetch(event.request));
});
