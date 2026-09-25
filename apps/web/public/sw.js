/*
 * My COD service worker.
 *
 * Strategy:
 *  - Static build output + icons -> cache-first (they are content-hashed).
 *  - Page navigations           -> network-first, falling back to cache, then
 *                                  to the precached /offline page.
 *  - Everything else (the API on :4000, Supabase auth/storage, any non-GET,
 *    any cross-origin request) is deliberately NOT intercepted, so listings,
 *    chat and auth are never served stale.
 *
 * Bump CACHE_VERSION to invalidate previously cached assets.
 */
const CACHE_VERSION = "v1";
const STATIC_CACHE = `my-cod-static-${CACHE_VERSION}`;
const PAGE_CACHE = `my-cod-pages-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/logo-cod.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      // Individual failures must not abort the whole install.
      .then((cache) => Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("my-cod-") && key !== STATIC_CACHE && key !== PAGE_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico|woff2?)$/i.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Only same-origin traffic; the REST API and Supabase live elsewhere.
  if (url.origin !== self.location.origin) return;

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) ?? (await caches.match(OFFLINE_URL)) ?? Response.error()),
    );
  }
});
