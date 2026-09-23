/** Logo + spinning geodesic while the room caches. Not a movie. */
(function (w) {
  var VERSION = "iris-preload-2026-09-23";
  var CACHE = "dc-iris-v1";
  var FILES = [
    "js/iris-sphere.js",
    "js/iris-av.js",
    "js/iris-wav.js",
    "js/iris-ring.js",
    "js/iris-voice.js",
    "audio/iris-greet.mp3"
  ];
  var raf = 0;
  var running = false;

  function icosa() {
    var t = (1 + Math.sqrt(5)) / 2;
    var raw = [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
    ];
    var v = raw.map(function (p) {
      var n = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]) || 1;
      return [p[0] / n, p[1] / n, p[2] / n];
    });
    var faces = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
    ];
    var edges = {};
    var list = [];
    faces.forEach(function (f) {
      [[f[0], f[1]], [f[1], f[2]], [f[2], f[0]]].forEach(function (e) {
        var a = Math.min(e[0], e[1]), b = Math.max(e[0], e[1]);
        var k = a + ":" + b;
        if (!edges[k]) { edges[k] = 1; list.push([a, b]); }
      });
    });
    return { v: v, e: list };
  }

  function spin(canvas) {
    if (!canvas || running) return;
    var g = icosa();
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    running = true;
    canvas.hidden = false;
    var t0 = (w.performance && performance.now()) ? performance.now() : Date.now();
    function frame(now) {
      if (!running) return;
      var wdt = canvas.clientWidth || w.innerWidth;
      var hgt = canvas.clientHeight || w.innerHeight;
      var dpr = Math.min(2, w.devicePixelRatio || 1);
      if (canvas.width !== wdt * dpr || canvas.height !== hgt * dpr) {
        canvas.width = wdt * dpr; canvas.height = hgt * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, wdt, hgt);
      var t = ((now || Date.now()) - t0) / 1000;
      var ay = t * 0.9, ax = 0.35 + Math.sin(t * 0.4) * 0.12;
      var cx = wdt / 2, cy = hgt * 0.46, r = Math.min(wdt, hgt) * 0.18;
      function rot(p) {
        var x = p[0], y = p[1] * Math.cos(ax) - p[2] * Math.sin(ax), z = p[1] * Math.sin(ax) + p[2] * Math.cos(ax);
        var x2 = x * Math.cos(ay) + z * Math.sin(ay), z2 = -x * Math.sin(ay) + z * Math.cos(ay);
        return [cx + x2 * r, cy + y * r, z2];
      }
      var pts = g.v.map(rot);
      ctx.strokeStyle = "rgba(125,211,252,.82)";
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      g.e.forEach(function (e) {
        var a = pts[e[0]], b = pts[e[1]];
        ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
      });
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(56,189,248,.9)";
      ctx.fill();
      raf = w.requestAnimationFrame(frame);
    }
    raf = w.requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) { try { w.cancelAnimationFrame(raf); } catch (e) {} raf = 0; }
  }

  function cacheWarm() {
    if (!w.caches || !w.caches.open) return Promise.resolve(false);
    return caches.open(CACHE).then(function (c) {
      return Promise.all(FILES.map(function (src) {
        return c.add(src).catch(function () { return null; });
      }));
    }).then(function () { return true; }).catch(function () { return false; });
  }

  function fontsReady() {
    if (w.document && document.fonts && document.fonts.ready) return document.fonts.ready.then(function () { return true; });
    return Promise.resolve(true);
  }

  function sphereReady() {
    return new Promise(function (resolve) {
      if (w.IrisSphere) return resolve(true);
      var n = 0;
      var id = setInterval(function () {
        n += 1;
        if (w.IrisSphere || n > 24) { clearInterval(id); resolve(!!w.IrisSphere); }
      }, 50);
    });
  }

  function warm(opts) {
    opts = opts || {};
    var canvas = opts.canvas || (w.document && document.getElementById("boot-stage"));
    var cap = opts.caption || (w.document && document.getElementById("boot-caption"));
    if (cap) cap.textContent = "Warming the room.";
    if (canvas) spin(canvas);
    var capMs = opts.capMs || 4000;
    var done = false;
    return new Promise(function (resolve) {
      function fin(ok) {
        if (done) return;
        done = true;
        stop();
        resolve(!!ok);
      }
      setTimeout(function () { fin(true); }, capMs);
      Promise.all([cacheWarm(), fontsReady(), sphereReady()]).then(function () { fin(true); });
    });
  }

  w.IrisPreload = { version: VERSION, warm: warm, stop: stop, cache: CACHE };
})(window);
