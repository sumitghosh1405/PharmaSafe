// ===== Monetag ad network integration =====
// Zone 1
self.options = {
  "domain": "5gvci.com",
  "zoneId": 11734792
}
self.lary = ""
importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw')

// Zone 2 (Multi Tag)
self.options = {
  "domain": "5gvci.com",
  "zoneId": 11829963
}
self.lary = ""
importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw')

// ===== PWA app shell caching =====
// Update strategy: network-first for every same-origin HTML/JS/CSS asset.
// This means an installed PWA checks the deployed site whenever it opens or
// returns to the foreground, while the cache remains an offline fallback.
// No manual cache-version bump is required for normal site deployments.
const CACHE = 'pharmasafe-shell-v14';
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
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  // Never intercept external resources or live data calls. This preserves
  // Monetag/Firebase/openFDA behavior exactly as before.
  if (url.origin !== self.location.origin ||
      url.hostname.includes('api.fda.gov') ||
      url.hostname.includes('allorigins') ||
      url.hostname.includes('corsproxy') ||
      url.hostname.includes('codetabs')) {
    return;
  }

  const isDocument = e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/';
  const isAppAsset = /\.(?:js|css)$/i.test(url.pathname);

  if (isDocument || isAppAsset) {
    // Bypass the browser HTTP cache so a newly deployed file is used as soon
    // as the app is opened. The previous response remains the offline copy.
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).then(res => {
        if (res.ok) {
          const copy = res.clone();
          e.waitUntil(caches.open(CACHE).then(c => c.put(e.request, copy)));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Stable assets (icons/manifest/etc.) stay cache-first for fast startup,
  // with a network fallback for anything not cached yet.
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const copy = res.clone();
          e.waitUntil(caches.open(CACHE).then(c => c.put(e.request, copy)));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
