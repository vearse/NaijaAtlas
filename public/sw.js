/**
 * NaijaAtlas service worker (production only).
 * Caches hashed Next static assets; keeps geo, data shards, and search index network-first.
 */
const STATIC_CACHE = "naija-atlas-static-v1";

const NETWORK_FIRST = [
  /^\/geo\//,
  /^\/data\//,
  /^\/search-index\.json$/,
];

function isNetworkFirst(pathname) {
  return NETWORK_FIRST.some((re) => re.test(pathname));
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("naija-atlas-") && k !== STATIC_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isNetworkFirst(url.pathname)) {
    event.respondWith(fetch(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      })
    );
  }
});
