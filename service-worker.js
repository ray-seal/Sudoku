// Versioned cache name to ensure updates are picked up on deploy
const CACHE_VERSION = 'sudoku-v2'; // bump this on future releases
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/sudoku-generator.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  // Activate new service worker as soon as it's finished installing
  self.skipWaiting();
  // Pre-cache core assets so app works offline
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', event => {
  // Take control of uncontrolled clients immediately
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map(k => {
          if (k !== CACHE_VERSION) return caches.delete(k);
        })
      );
      await self.clients.claim();
    })()
  );
});

// Utility to respond network-first for navigation and core assets
async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const response = await fetch(request);
    // Update cache with fresh response
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Network failed, try cache
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

// Cache-first strategy for other assets
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.status === 200) {
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin requests for core assets
  if (req.method !== 'GET') return;

  // Network-first for navigation requests (index) and core assets
  if (req.mode === 'navigate' ||
      CORE_ASSETS.includes(url.pathname) ||
      url.pathname.endsWith('/index.html') ||
      url.pathname === '/' ) {
    event.respondWith(
      networkFirst(req).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // For other requests, use cache-first to improve offline performance
  event.respondWith(
    cacheFirst(req).catch(() => fetch(req))
  );
});
