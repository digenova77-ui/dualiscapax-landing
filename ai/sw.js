/* DCLM Look — cache this folder only. Not Bind. */
var CACHE = "dclm-look-v5";
var ASSETS = [
  "./app.html",
  "./dclm-look.js",
  "./icon.svg",
  "./icon-maskable.svg",
  "./manifest-dclm.json"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return Promise.all(
        ASSETS.map(function (url) {
          return cache.add(url).catch(function (err) {
            console.warn("Look cache skip", url, err && err.message ? err.message : err);
          });
        })
      );
    }).then(function () {
      return self.skipWaiting();
    }).catch(function (err) {
      console.warn("Look cache open failed", err && err.message ? err.message : err);
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) {
          return caches.delete(k);
        })
      );
    }).catch(function (err) {
      console.warn("Look cache activate", err && err.message ? err.message : err);
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("message", function (e) {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request);
    }).catch(function () {
      return caches.match("./app.html");
    })
  );
});
