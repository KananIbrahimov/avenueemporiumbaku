// Basit service worker: önce internet, internet yoksa önbellek.
const ONBELLEK = "avenuebaku-v5";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(
  caches.keys().then((k) => Promise.all(k.filter((x) => x !== ONBELLEK).map((x) => caches.delete(x))))
    .then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => { const kopya = r.clone(); caches.open(ONBELLEK).then((c) => c.put(e.request, kopya)); return r; })
      .catch(() => caches.match(e.request)));
});
