/**
 * Iris cluster — three spheres on one quaternion pose.
 * Core + two companions. Z-sort. Contact shadow. Perspective scale.
 * Same mount/pose API. Not a person. No Three.js.
 */
(function (w) {
  var VERSION = "iris-sphere-2026-09-22-cluster3";
  var canvas, ctx, raf = 0, reduced = false;
  var energy = 0.2, speaking = false, listening = false, woken = false;
  var lookX = 0, lookY = 0, nod = 0, t0 = 0, last = 0;
  var q = { w: 1, x: 0, y: 0, z: 0 };
  var seats = [];
  var amp = [];
  var BODIES = [
    { id: "core", x: 0, y: 0, z: 0, r: 1, kind: "core" },
    { id: "hear", x: 1.18, y: 0.22, z: 0.42, r: 0.38, kind: "sat" },
    { id: "see", x: -0.92, y: 0.58, z: -0.62, r: 0.26, kind: "sat" }
  ];

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
    return { w: Math.cos(th * 0.5), x: (ax / n) * s, y: (ay / n) * s, z: (az / n) * s };
  }
  function qrot(v) {
    var p = { w: 0, x: v.x, y: v.y, z: v.z };
    var c = { w: q.w, x: -q.x, y: -q.y, z: -q.z };
    var r = qmul(qmul(q, p), c);
    return { x: r.x, y: r.y, z: r.z };
  }
  function mkSeats() {
    seats = []; amp = [];
    for (var i = 0; i < 48; i++) {
      var a = (i / 48) * Math.PI * 2;
      var y = 1 - (2 * ((i + 0.5) / 48));
      var r = Math.sqrt(Math.max(0, 1 - y * y));
      seats.push({ x: Math.cos(a) * r, y: y, z: Math.sin(a) * r, i: i });
      amp.push(0);
    }
  }
  function size() {
    if (!canvas) return;
    var parent = canvas.parentElement || canvas;
    var wdt = parent.clientWidth || canvas.clientWidth || 180;
    var hgt = parent.clientHeight || canvas.clientHeight || 180;
    if (hgt < 80) hgt = wdt;
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
      amp[i % 48] = Math.max(amp[i % 48], d);
    }
    energy = Math.max(0.14, Math.min(1, (sum / bins.length) * 2.4));
  }
  function project(v, cx, cy, R) {
    var zc = 2.35;
    var s = zc / (zc - v.z);
    return {
      x: cx + v.x * R * s,
      y: cy + v.y * R * 0.9 * s,
      z: v.z,
      s: s
    };
  }
  function drawBall(p, radius, kind) {
    var depth = (p.z + 1) * 0.5;
    var hx = p.x - radius * 0.32;
    var hy = p.y - radius * 0.38;
    var glow = ctx.createRadialGradient(p.x, p.y + radius * 0.15, radius * 0.2, p.x, p.y, radius * 2.1);
    glow.addColorStop(0, kind === "core"
      ? (speaking ? "rgba(255,183,3,0.28)" : "rgba(56,189,248,0.2)")
      : "rgba(167,139,250,0.16)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius * 2.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(p.x + radius * 0.08, p.y + radius * 0.72, radius * 0.72, radius * 0.22, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0," + (0.18 + (1 - depth) * 0.22) + ")";
    ctx.fill();
    ctx.restore();

    var body = ctx.createRadialGradient(hx, hy, radius * 0.08, p.x, p.y, radius);
    if (kind === "core") {
      if (speaking) {
        body.addColorStop(0, "rgba(255,244,210,0.98)");
        body.addColorStop(0.35, "rgba(255,196,64,0.95)");
        body.addColorStop(0.75, "rgba(180,90,12,0.92)");
        body.addColorStop(1, "rgba(40,16,4,0.96)");
      } else if (listening) {
        body.addColorStop(0, "rgba(220,255,236,0.96)");
        body.addColorStop(0.4, "rgba(52,211,153,0.9)");
        body.addColorStop(1, "rgba(6,40,28,0.95)");
      } else {
        body.addColorStop(0, "rgba(236,248,255,0.96)");
        body.addColorStop(0.38, "rgba(56,189,248,0.88)");
        body.addColorStop(0.78, "rgba(29,78,216,0.9)");
        body.addColorStop(1, "rgba(8,16,42,0.96)");
      }
    } else {
      body.addColorStop(0, "rgba(246,240,255,0.95)");
      body.addColorStop(0.4, "rgba(167,139,250,0.82)");
      body.addColorStop(1, "rgba(24,12,48,0.94)");
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = body;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(hx, hy, radius * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255," + (0.18 + depth * 0.22) + ")";
    ctx.fill();
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
      var spin = 0.42 + energy * 0.9;
      q = qmul(q, qaxis(0.16, 1, 0.22, spin * dt));
      q = qmul(q, qaxis(0.7, 0.1, 0.3, 0.12 * dt));
      if (lookX || lookY) q = qmul(qaxis(1, 0, 0, lookY * 0.014), qmul(qaxis(0, 1, 0, lookX * 0.018), q));
    }
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    var cx = W * 0.5, cy = H * 0.5;
    var R = Math.min(W, H) * (0.28 + energy * 0.04);

    var worlds = [];
    var i;
    for (i = 0; i < BODIES.length; i++) {
      var b = BODIES[i];
      var v = qrot({ x: b.x, y: b.y, z: b.z });
      var p = project(v, cx, cy, R);
      worlds.push({ id: b.id, kind: b.kind, r: b.r * R * p.s, p: p, z: v.z });
    }
    worlds.sort(function (a, c) { return a.z - c.z; });

    for (i = 0; i < worlds.length; i++) {
      if (worlds[i].kind === "core") {
        var j, s, pr;
        for (j = 0; j < seats.length; j++) {
          s = qrot(seats[j]);
          if (s.z > 0.05) continue;
          pr = project({ x: s.x * 0.96, y: s.y * 0.96, z: s.z * 0.96 }, cx, cy, R);
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, Math.max(0.8, 1.1 * pr.s), 0, Math.PI * 2);
          ctx.fillStyle = "rgba(56,189,248," + (0.12 + amp[j] * 0.5) + ")";
          ctx.fill();
          amp[j] *= 0.9;
        }
      }
      drawBall(worlds[i].p, worlds[i].r, worlds[i].kind);
      if (worlds[i].kind === "core") {
        for (j = 0; j < seats.length; j++) {
          s = qrot(seats[j]);
          if (s.z <= 0.05) continue;
          pr = project({ x: s.x * 0.96, y: s.y * 0.96, z: s.z * 0.96 }, cx, cy, R);
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, Math.max(0.9, 1.4 * pr.s), 0, Math.PI * 2);
          ctx.fillStyle = amp[j] > 0.22
            ? "rgba(255,183,3," + (0.35 + amp[j] * 0.5) + ")"
            : "rgba(186,230,253," + (0.2 + s.z * 0.35) + ")";
          ctx.fill();
        }
      }
    }

    if (H > 88) {
      ctx.fillStyle = "rgba(226,232,240,0.72)";
      ctx.font = "600 " + Math.round(Math.max(9, W * 0.04)) + "px ui-monospace,monospace";
      ctx.textAlign = "center";
      ctx.fillText(speaking ? "IRIS · SPEAK" : listening ? "IRIS · HEAR" : woken ? "IRIS · CLUSTER" : "IRIS · TAP", cx, H * 0.94);
    }
  }
  function mount(target) {
    reduced = !!(w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var host = typeof target === "string" ? document.querySelector(target) : target;
    if (!host) return null;
    canvas = host.tagName === "CANVAS" ? host : host.querySelector("canvas") || document.createElement("canvas");
    canvas.id = canvas.id || "iris-sphere";
    canvas.className = (canvas.className + " iris-sphere-plate").trim();
    canvas.setAttribute("aria-label", "Iris three-sphere cluster");
    if (canvas.parentNode !== host && host.tagName !== "CANVAS") {
      host.innerHTML = "";
      host.appendChild(canvas);
    }
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
    cluster: 3,
    mount: mount,
    pose: function () { return { w: q.w, x: q.x, y: q.y, z: q.z, cluster: 3 }; },
    setEnergy: function (n) { energy = Math.max(0, Math.min(1, n)); },
    setSpeaking: function (on) { speaking = !!on; if (speaking) energy = Math.max(energy, 0.55); },
    setListening: function (on) { listening = !!on; },
    setWoken: function (on) { woken = !!on; },
    lookAt: lookAt,
    pulse: function (i) { i = ((i % 48) + 48) % 48; amp[i] = 1; amp[(i + 8) % 48] = Math.max(amp[(i + 8) % 48], 0.45); },
    canvas: function () { return canvas; }
  };
})(window);
