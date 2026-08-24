// Offline service worker for the shop-floor calculators, scoped to
// /tools/. The three calculators are pure client-side math, so once the
// page HTML and its hashed chunks are cached they work with no wifi at
// the machine. Strategy:
//   - navigations: network-first, fall back to cache when offline
//   - /_next/static assets: cache-first (content-hashed, immutable)
//   - everything else same-origin GET: stale-while-revalidate
// The SW's own scope (/tools/) confines it — it never controls the
// reference pages or search.
const VERSION = "tools-sw-v1";
const PRECACHE = [
  "/tools",
  "/tools/slot-ramp",
  "/tools/chord",
  "/tools/wear-comp",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req, { ignoreSearch: true }).then(
            (hit) => hit || caches.match("/tools"),
          ),
        ),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => {
      const refresh = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => hit);
      return hit || refresh;
    }),
  );
});
