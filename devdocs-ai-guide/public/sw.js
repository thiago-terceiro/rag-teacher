// RAG Teacher — High Performance Service Worker for Offline PWA Support
const CACHE_NAME = 'rag-teacher-v3';
const PYODIDE_CACHE_NAME = 'pyodide-cdn-v0.27.3';

const STATIC_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon.svg',
];

// Install: Pre-cache core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch((err) => {
        console.warn('[SW] Pre-cache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up outdated caches and claim active clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== PYODIDE_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Smart caching strategy optimized for instant offline reading & WASM execution
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 0. Dedicated Cache-First for immutable, versioned Pyodide WebAssembly runtime
  if (
    request.method === 'GET' &&
    url.origin === 'https://cdn.jsdelivr.net' &&
    url.pathname.includes('/pyodide/')
  ) {
    event.respondWith(
      caches.open(PYODIDE_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return cached || new Response('Offline - Pyodide WASM runtime not cached yet', { status: 503 });
        }
      })
    );
    return;
  }

  // Skip non-GET requests, other cross-origin requests, and non-HTTP schemes
  if (
    request.method !== 'GET' ||
    !url.protocol.startsWith('http') ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // 1. Navigation requests (HTML documents like /steps/project-setup or /interview-questions):
  // Network-first with instant offline fallback to cached /index.html (SPA shell)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback: Return cached route or SPA entry point
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;
          const cachedShell = await caches.match('/index.html') || await caches.match('/');
          return cachedShell || new Response('Offline - RAG Teacher App Shell Not Cached', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        })
    );
    return;
  }

  // 2. Static Assets (JS chunks, CSS, KaTeX fonts, icons, web workers):
  // Stale-While-Revalidate: Return cached copy in 0ms, update cache in background
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.ttf') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.includes('/assets/')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. Fallback for all other GET requests: Cache-first with network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => new Response('Offline', { status: 503 }))
      );
    })
  );
});

