/* DCLM Look — cache this folder only. Not Bind. */
var CACHE = "dclm-look-v6";
var ASSETS = [
  "./app.html",
  "./dclm-look.js",
  "./icon.svg",
  "./icon-maskable.svg",
  "./manifest-dclm.json"
];

function cacheMetrics() {
  return caches.keys().then(function (names) {
    return Promise.all(names.map(function (name) {
      return caches.open(name).then(function (cache) {
        return cache.keys().then(function (reqs) {
          return Promise.all(reqs.map(function (req) {
            return cache.match(req).then(function (res) {
              if (!res) return { url: req.url, bytes: 0 };
              return res.clone().blob().then(function (b) {
                return { url: req.url, bytes: b.size || 0 };
              }).catch(function () {
                return { url: req.url, bytes: 0 };
              });
            });
          })).then(function (rows) {
            var bytes = 0;
            for (var i = 0; i < rows.length; i++) bytes += rows[i].bytes;
            return { name: name, entries: rows.length, bytes: bytes, urls: rows };
          });
        });
      });
    }));
  }).then(function (cachesList) {
    var bytes = 0, entries = 0;
    for (var i = 0; i < cachesList.length; i++) {
      bytes += cachesList[i].bytes;
      entries += cachesList[i].entries;
    }
    return { ok: true, cache: CACHE, stores: cachesList.length, entries: entries, bytes: bytes, caches: cachesList };
  }).catch(function (err) {
    return { ok: false, error: String(err && err.message ? err.message : err) };
  });
}

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
  if (e.data === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (e.data === "METRICS") {
    var port = e.ports && e.ports[0];
    cacheMetrics().then(function (m) {
      if (port) port.postMessage(m);
    });
  }
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
