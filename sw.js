/* Uloží hru do tabletu, aby fungovala i při výpadku Wi-Fi. Při změně souborů zvyšte číslo verze. */
var CACHE = 'phishula-v4';
var FILES = ['./', 'index.html', 'style.css', 'fonts.css', 'data.js', 'game.js', 'jsqr.js', 'qrcode.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'tisk.html'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  // Nejdřív zkusí internet (aby se projevily úpravy), při výpadku použije uloženou kopii.
  e.respondWith(fetch(e.request).then(function (r) {
    var copy = r.clone();
    caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
    return r;
  }).catch(function () {
    return caches.match(e.request, { ignoreSearch: true });
  }));
});
