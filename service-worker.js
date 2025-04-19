const CACHE_NAME = "loto-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/inventory.html",
  "/history.html",
  "/style.css",
  "/app.js",
  "/manifest.json",
  "/assets/loto1.png",
  "/assets/loto2.png",
  "/assets/icon-192.png",
  "/assets/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
