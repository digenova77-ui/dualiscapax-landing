/* DCLM Look — cache this folder only. Not Bind. */
var CACHE = "dclm-look-v13";
var ASSETS = ["./app","./dclm-look.js","./icon.svg","./icon-maskable.svg","./manifest-dclm.json","./room","./nursery"];
function pretty(url) {
  try { var u = new URL(url); if (u.pathname.slice(-5) === ".html") u.pathname = u.pathname.slice(0, -5); return u.toString(); }
  catch (e) { return url; }
}
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (cache) {
    return Promise.all(ASSETS.map(function (url) { return cache.add(url).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("message", function (e) { if (e.data === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  var dest = pretty(e.request.url);
  var live = /dclm-look\.js|app\.html|\/app$/.test(url.pathname);
  if (live) {
    e.respondWith(fetch(e.request, { cache: "no-store" }).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (cache) { cache.put(dest, copy); });
      return res;
    }).catch(function () { return caches.match(dest).then(function (hit) { return hit || caches.match(e.request); }); }));
    return;
  }
  e.respondWith(caches.match(dest).then(function (hit) {
    if (hit) return hit;
    return fetch(dest, { redirect: "follow" });
  }).catch(function () { return caches.match("./app"); }));
});
