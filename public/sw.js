const CACHE_NAME = "aegis-airspace-v9";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/styles.css?v=9",
  "/app.js?v=9",
  "/manifest.json",
  "/assets/fighter.webp",
  "/assets/helicopter.webp",
  "/assets/earth-orbit.webp",
  "/assets/logo.png"
];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put("/", response.clone());
          await cache.put("/index.html", response.clone());
        }
        return response;
      } catch (_) {
        return (await caches.match(event.request)) || (await caches.match("/index.html")) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch (_) {
      return (await caches.match("/index.html")) || Response.error();
    }
  })());
});
