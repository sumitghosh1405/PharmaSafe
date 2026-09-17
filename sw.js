// v1 used cache-first for index.html itself, so once installed, an updated
// site never reached devices that already had the app cached (installed
// home-screen icon included) until this file's own bytes changed enough
// for the browser to notice. Two fixes: (1) the HTML document now uses
// network-first, so any online open always gets the current deployed
// version, falling back to cache only when genuinely offline; (2) the
// cache name below is versioned, so bumping it on every deployment forces
// every existing install to detect, install, and activate the new worker
// immediately instead of silently keeping the old one.
//
// HOW TO USE: every time you push a change to the site, bump the number
// in CACHE below (v5 -> v6 -> v7 ...) and bump the matching ?v= query
// string on the <script src="app.js?v=..."> tag in index.html to the same
// number. That one-line change is what tells both the service worker and
// the browser's own HTTP cache that this is a new version, so visitors —
// including anyone with the app already installed to their home screen —
// get the current version instead of an old cached one.
const CACHE = 'pharmasafe-shell-v7';
const SHELL = [
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Never cache live data calls — openFDA and CORS proxies must always hit the network.
  if (url.includes('api.fda.gov') || url.includes('allorigins') || url.includes('corsproxy') || url.includes('codetabs')) {
    return; // let the browser handle it normally
  }

  const isDocument = e.request.mode === 'navigate' || url.endsWith('/index.html') || url.endsWith('.html');

  if (isDocument) {
    // Network-first: always try to get the current live page when online.
    // Only fall back to the last cached copy if the network request fails
    // (genuinely offline), which is the actual point of caching it at all.
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Everything else (icons, manifest — rarely change): cache-first is fine,
  // prioritizing instant load over freshness.
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok && e.request.method === 'GET') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
