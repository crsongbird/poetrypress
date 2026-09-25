/*
 * sw.js — the service worker. Keeps Unfixable Vellum working offline.
 *
 *   The page first, from the network if it can be reached, so an update
 *   arrives the next time you open the app; from the cache when it can't.
 *   Everything else — icons, fonts, the colour picker's script — from the
 *   cache, refreshed quietly in the background.
 *
 * VERSION is stamped by build.mjs from the page's contents, so a new build
 * gets a new cache and the old one is cleared out.
 */
const VERSION = '6da4690bddf0';
const CACHE = 'vellum-' + VERSION;
const SHELL = ['./', './index.html', './manifest.webmanifest',
               './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('vellum-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if(req.method !== 'GET') return;

  // the page itself: network first, so updates arrive; cache when offline
  if(req.mode === 'navigate'){
    event.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // everything else: answer from the cache, refresh it behind the scenes.
  // Fonts and the picker script come from other origins; they are cached
  // after the first successful load, so the app keeps its type offline.
  event.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(req).then(hit => {
        const fresh = fetch(req).then(res => {
          if(res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
          return res;
        }).catch(() => hit);
        return hit || fresh;
      })
    )
  );
});
