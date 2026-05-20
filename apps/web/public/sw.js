// TEDU Pass — minimal service worker.
// App-shell cache + offline fallback for the student wallet page.

const CACHE = "tedu-pass-v1";
const SHELL = ["/", "/student", "/offline", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Never cache API or auth.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/data/")) return;

  // Network-first for HTML, cache-first for static assets.
  if (req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r ?? caches.match("/offline")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) =>
      cached ??
      fetch(req).then((res) => {
        if (res.ok && (url.origin === location.origin)) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => cached)
    )
  );
});
