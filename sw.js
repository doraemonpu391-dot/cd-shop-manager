// Kill-switch service worker for the public shop repo root (/cd-shop-manager/).
//
// The old management PWA (previously served at this repo's root) registered a
// cache-first service worker whose scope covers /shop/. When the root was
// converted to a plain redirect and sw.js was removed, that old SW became an
// orphan: its script URL 404s, so the browser can't update it, and it keeps
// serving stale cached pages forever.
//
// This file restores sw.js at that URL with a SW that does the opposite of
// caching: on activation it purges every cache, unregisters itself, and reloads
// any open pages so they refetch fresh from the network. After this runs once,
// the shop has no service worker at all and relies on normal HTTP cache-busting.
self.addEventListener('install', function () { self.skipWaiting(); });

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    try {
      var keys = await caches.keys();
      await Promise.all(keys.map(function (k) { return caches.delete(k); }));
    } catch (e) {}
    try { await self.registration.unregister(); } catch (e) {}
    try {
      var clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(function (c) { try { c.navigate(c.url); } catch (e) {} });
    } catch (e) {}
  })());
});
// No fetch handler on purpose → all requests go straight to the network.
