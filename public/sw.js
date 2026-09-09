const CACHE_NAME = "mahesbankers-portal-v3";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/logo.png",
  "/favicon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip API calls and websocket traffic
  if (
    url.pathname.includes("/api/") ||
    url.pathname.includes("socket.io") ||
    url.hostname !== self.location.hostname
  ) {
    return;
  }

  const acceptHeader = event.request.headers.get("accept");
  const isHtmlRequest = acceptHeader && acceptHeader.includes("text/html");

  // Handle SPA navigation requests
  if (event.request.mode === "navigate" || isHtmlRequest) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/index.html").then((response) => {
          return response || caches.match("/");
        });
      }),
    );
    return;
  }

  // Stale-while-revalidate strategy for static resources
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch new version in background
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch((err) => {
          // Return a network error response to avoid uncaught promise rejection in service worker
          return new Response("Network error", { status: 408, statusText: "Network Error" });
        });
    }),
  );
});
