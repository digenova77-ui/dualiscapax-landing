/**
 * Iris sphere. Quaternion pose. 64 seats. Picture listens to DSAP.wave.
 * No Three.js. Not a person. Root copy so GH Pages can actually draw.
 */
(function (w) {
  var VERSION = "iris-sphere-2026-09-22-q";
  var canvas, ctx, raf = 0, reduced = false;
  var energy = 0.18, speaking = false, listening = false, woken = false;
  var lookX = 0, lookY = 0, nod = 0, t0 = 0, last = 0;
  var q = { w: 1, x: 0, y: 0, z: 0 };
  var seats = [];
  var amp = [];

  function qmul(a, b) {
    return {
      w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
      x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
      y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
      z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w
    };
  }
  function qaxis(ax, ay, az, th) {
    var n = Math.sqrt(ax * ax + ay * ay + az * az) || 1;
    var s = Math.sin(th * 0.5);
    return { w: Math.cos(th * 0.5), x: ax / n * s, y: ay / n * s, z: az / n * s };
  }
  function qrot(v) {
    var p = { w: 0, x: v.x, y: v.y, z: v.z };
    var c = { w: q.w, x: -q.x, y: -q.y, z: -q.z };
    var r = qmul(qmul(q, p), c);
    return { x: r.x, y: r.y, z: r.z };
  }
  function mkSeats() {
    seats = []; amp = [];
    for (var i = 0; i < 64; i++) {
      var a = (i / 64) * Math.PI * 2;
      var y = 1 - (2 * ((i + 0.5) / 64));
      var r = Math.sqrt(Math.max(0, 1 - y * y));
      seats.push({ x: Math.cos(a) * r, y: y, z: Math.sin(a) * r, i: i });
      amp.push(0);
    }
  }
  function size() {
    if (!canvas) return;
    var parent = canvas.parentElement || canvas;
    var wdt = parent.clientWidth || canvas.clientWidth || 160;
    var hgt = parent.clientHeight || canvas.clientHeight || 160;
    if (hgt < 64) hgt = wdt;
    var dpr = Math.min(w.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(wdt * dpr);
    canvas.height = Math.floor(hgt * dpr);
    canvas.style.width = wdt + "px";
    canvas.style.height = hgt + "px";
  }
  function tapWave() {
    if (!w.DSAP || !DSAP.wave) return;
    var bins = DSAP.wave();
    if (!bins || !bins.length) return;
    var sum = 0;
    for (var i = 0; i < bins.length; i++) {
      var d = Math.abs(bins[i] - 128) / 128;
      sum += d;
      amp[i % 64] = Math.max(amp[i % 64], d);
    }
    energy = Math.max(0.12, Math.min(1, sum / bins.length * 2.4));
  }
  function draw(now) {
    raf = w.requestAnimationFrame(draw);
    if (!ctx || !canvas) return;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    if (!t0) t0 = now;
    tapWave();
    if (nod > 0) nod = Math.max(0, nod - dt * 1.8);
    if (!reduced) {
      var spin = 0.55 + energy * 1.1;
      q = qmul(q, qaxis(0.18, 1, 0.12, spin * dt));
      if (lookX || lookY) q = qmul(qaxis(1, 0, 0, lookY * 0.012), qmul(qaxis(0, 1, 0, lookX * 0.016), q));
    }
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    var cx = W * 0.5, cy = H * 0.5, R = Math.min(W, H) * (0.36 + energy * 0.06);
    var g = ctx.createRadialGradient(cx, cy, R * 0.12, cx, cy, R * 2.1);
    g.addColorStop(0, speaking ? "rgba(255,183,3,0.42)" : "rgba(56,189,248,0.28)");
    g.addColorStop(0.45, "rgba(167,139,250,0.12)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 2.05, 0, Math.PI * 2);
    ctx.fill();
    var pts = [];
    for (var i = 0; i < 64; i++) {
      var s = seats[i];
      var v = qrot(s);
      pts.push({ x: cx + v.x * R, y: cy + v.y * R * 0.92 + Math.sin(nod * 8) * R * 0.04, z: v.z, a: amp[i], i: i });
      amp[i] *= 0.9;
    }
    pts.sort(function (A, B) { return A.z - B.z; });
    for (var j = 0; j < pts.length; j++) {
      var p = pts[j];
      var depth = (p.z + 1) * 0.5;
      var rr = Math.max(1.2, (1.6 + p.a * 4.2) * (W / 280) * (0.45 + depth));
      ctx.beginPath();
      ctx.arc(p.x, p.y, rr, 0, Math.PI * 2);
      ctx.fillStyle = p.a > 0.22
        ? "rgba(255,183,3," + (0.35 + p.a * 0.55) + ")"
        : "rgba(56,189,248," + (0.18 + depth * 0.55) + ")";
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, R * (0.12 + energy * 0.08), 0, Math.PI * 2);
    ctx.fillStyle = speaking ? "rgba(255,183,3,0.9)" : listening ? "rgba(52,211,153,0.85)" : "rgba(167,139,250,0.7)";
    ctx.fill();
    if (H > 90) {
      ctx.fillStyle = "rgba(226,232,240,0.72)";
      ctx.font = "600 " + Math.round(Math.max(9, W * 0.045)) + "px ui-monospace,monospace";
      ctx.textAlign = "center";
      ctx.fillText(speaking ? "IRIS · SPEAK" : listening ? "IRIS · HEAR" : woken ? "IRIS · LIVE" : "IRIS · TAP", cx, H * 0.92);
    }
  }
  function mount(target) {
    reduced = !!(w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var host = typeof target === "string" ? document.querySelector(target) : target;
    if (!host) return null;
    canvas = host.tagName === "CANVAS" ? host : host.querySelector("canvas") || document.createElement("canvas");
    canvas.id = canvas.id || "iris-sphere";
    canvas.className = (canvas.className + " iris-sphere-plate").trim();
    canvas.setAttribute("aria-label", "Iris sphere");
    if (canvas.parentNode !== host && host.tagName !== "CANVAS") host.appendChild(canvas);
    ctx = canvas.getContext("2d", { alpha: true });
    mkSeats();
    size();
    w.addEventListener("resize", size);
    if (!raf) raf = w.requestAnimationFrame(draw);
    return canvas;
  }
  function lookAt(x, y) {
    lookX = Math.max(-1, Math.min(1, x || 0));
    lookY = Math.max(-1, Math.min(1, y || 0));
  }
  w.IrisSphere = {
    version: VERSION,
    mount: mount,
    pose: function () { return { w: q.w, x: q.x, y: q.y, z: q.z }; },
    setEnergy: function (n) { energy = Math.max(0, Math.min(1, n)); },
    setSpeaking: function (on) { speaking = !!on; if (speaking) energy = Math.max(energy, 0.55); },
    setListening: function (on) { listening = !!on; },
    setWoken: function (on) { woken = !!on; },
    lookAt: lookAt,
    pulse: function (i) { i = ((i % 64) + 64) % 64; amp[i] = 1; amp[(i + 8) % 64] = Math.max(amp[(i + 8) % 64], 0.45); },
    canvas: function () { return canvas; }
  };
})(window);
