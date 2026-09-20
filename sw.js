const CACHE_NAME = "neko-lista-v4";
const APP_SHELL = [
  "./",
  "index.html",
  "boot.js",
  "styles.css",
  "script.js",
  "i18n.js",
  "manifest.json",
  "img/logo-header.png",
  "img/neko-tools-mark.png",
  "img/favicon-32.png",
  "img/favicon-16.png",
  "img/apple-touch-icon.png",
  "img/icon-192.png",
  "img/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

// Red primero, cache como respaldo solo si no hay conexión: así cada visita
// con internet trae la versión publicada más reciente sin que haga falta
// borrar cache a mano, y offline sigue andando con lo último que se guardó.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
