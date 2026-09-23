/**
 * NaijaAtlas service worker (production only).
 *
 * App-shell strategy:
 *   - install  : precache the app shell (HTML), manifest and icon set.
 *   - navigate : serve cached shell instantly (stale-while-revalidate),
 *                refresh it in the background, fall back to it offline.
 *   - _next/static + /images : cache-first runtime cache.
 *   - /geo, /data, /search-index.json : network-first (fresh political/location data).
 *
 * Bump APP_VERSION whenever deploys change the shell/assets so old caches recycle.
 */
const APP_VERSION = "v2";
const STATIC_CACHE = `naija-atlas-static-${APP_VERSION}`;
const SHELL_CACHE = `naija-atlas-shell-${APP_VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-icon.png",
];

const NETWORK_FIRST = [
  /^\/geo\//,
  /^\/data\//,
  /^\/search-index\.json$/,
];

function isNetworkFirst(pathname) {
  return NETWORK_FIRST.some((re) => re.test(pathname));
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && (response.ok || response.type === "opaque")) {
    // Ignore failures; not fatal.
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

async function handleNavigation(event, request) {
  const cache = await caches.open(SHELL_CACHE);
  const cachedShell = await cache.match("/", { ignoreSearch: true });

  const refresh = fetch(request)
    .then(async (response) => {
      if (response && response.ok) {
        // Update the canonical shell so every route reuses it.
        await cache.put("/", response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cachedShell) {
    // Serve instantly; refresh in the background.
    event.waitUntil(refresh);
    return cachedShell;
  }

  const networkResponse = await refresh;
  if (networkResponse) return networkResponse;

  const fallback = await cache.match("/", { ignoreSearch: true });
  return fallback ?? Response.error();
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([STATIC_CACHE, SHELL_CACHE]);
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("naija-atlas-") && !keep.has(k))
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

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(event, request));
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/images/")
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  }
});