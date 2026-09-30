/*
 * StudyHub Malawi service worker.
 *
 * Deliberately conservative about caching: this is an authenticated app, so we
 * never cache HTML documents or API responses. Caching those would let one
 * user's dashboard be served to another person on a shared device. Only
 * immutable build output and public static assets are cached.
 */

const VERSION = 'v1';
const STATIC_CACHE = `studyhub-static-${VERSION}`;
const RUNTIME_CACHE = `studyhub-runtime-${VERSION}`;

// Only cacheable, non-personal assets. No HTML, no API, no routes.
const PRECACHE_URLS = [
  '/site.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon.svg',
  '/favicon.ico',
];

// Anything under these prefixes is dynamic and must never be cached.
const NEVER_CACHE = ['/api/', '/auth/', '/_next/webpack-hmr'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      // addAll is atomic: one 404 would discard the whole precache.
      .then((cache) => Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('studyhub-') && key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isCacheableStatic(url) {
  if (url.origin !== self.location.origin) return false;
  if (NEVER_CACHE.some((prefix) => url.pathname.startsWith(prefix))) return false;
  // Hashed build output is immutable and safe to serve from cache.
  if (url.pathname.startsWith('/_next/static/')) return true;
  return /\.(?:png|jpg|jpeg|svg|webp|ico|woff2?|css|js)$/i.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Navigations and API traffic always go to the network so users never see
  // a stale or someone else's authenticated page.
  if (request.mode === 'navigate' || url.pathname.startsWith('/api/')) {
    return;
  }

  if (!isCacheableStatic(url)) return;

  // Cache-first: hashed assets never change under the same URL.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match('/favicon.ico'));
    })
  );
});