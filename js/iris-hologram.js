/**
 * Iris hologram — volumetric field.
 * Presence is geometry driven by energy. Not a face model.
 */
(function (w) {
  var VERSION = "iris-hologram-2026-09-01-c";
  var canvas = null;
  var ctx = null;
  var raf = 0;
  var energy = 0.2;
  var speaking = false;
  var listening = false;
  var video = null;
  var lookX = 0;
  var lookY = 0;
  var t0 = 0;

  function mount(target) {
    var host = typeof target === "string" ? document.querySelector(target) : target;
    if (!host) return null;
    canvas = host.tagName === "CANVAS" ? host : host.querySelector("canvas") || document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = (canvas.className + " iris-holo").trim();
    if (canvas.parentNode !== host && host.tagName !== "CANVAS") host.insertBefore(canvas, host.firstChild);
    ctx = canvas.getContext("2d", { alpha: true });
    size();
    if (!raf) loop();
    w.addEventListener("resize", size);
    return canvas;
  }

  function size() {
    if (!canvas) return;
    var parent = canvas.parentElement || canvas;
    var wdt = parent.clientWidth || 320;
    var hgt = parent.clientHeight || 240;
    if (hgt < 180) hgt = Math.round(wdt * 0.62);
    var dpr = Math.min(w.devicePixelRatio || 1, 2.5);
    canvas.width = Math.floor(wdt * dpr);
    canvas.height = Math.floor(hgt * dpr);
    canvas.style.width = wdt + "px";
    canvas.style.height = hgt + "px";
  }

  function setEnergy(n) { energy = Math.max(0, Math.min(1, n)); }
  function setSpeaking(on) { speaking = !!on; }
  function setListening(on) { listening = !!on; }
  function bindVideo(el) { video = el || null; }
  function lookAt(x, y) {
    lookX = Math.max(-1, Math.min(1, x || 0));
    lookY = Math.max(-1, Math.min(1, y || 0));
  }

  function loop(now) {
    raf = w.requestAnimationFrame(loop);
    if (!ctx || !canvas) return;
    if (!t0) t0 = now || performance.now();
    var t = ((now || performance.now()) - t0) / 1000;
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    var lean = (listening ? Math.sin(t * 1.15) * 0.04 : 0) + lookX * 0.08;
    var lift = (speaking ? -0.03 : 0.02) + lookY * 0.05;
    var cx = W * (0.5 + lean);
    var cy = H * (0.5 + lift);
    var R = Math.min(W, H) * (0.28 + energy * 0.11);
    var pulse = speaking
      ? 0.66 + 0.34 * Math.abs(Math.sin(t * 10))
      : listening
        ? 0.42 + 0.24 * Math.abs(Math.sin(t * 2.05))
        : 0.18 + energy * 0.52;

    var g = ctx.createRadialGradient(cx, cy, R * 0.06, cx, cy, R * 2.6);
    g.addColorStop(0, "rgba(190,220,255," + (0.22 + pulse * 0.28) + ")");
    g.addColorStop(0.22, "rgba(90,150,255," + (0.12 + pulse * 0.1) + ")");
    g.addColorStop(0.55, "rgba(20,50,120,0.1)");
    g.addColorStop(1, "rgba(0,1,8,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    if (video && video.readyState >= 2 && video.videoWidth) {
      ctx.save();
      ctx.globalAlpha = 0.1 + energy * 0.12;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.72, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(video, cx - R, cy - R, R * 2, R * 2);
      ctx.restore();
    }

    var shells = 24;
    for (var s = shells; s >= 1; s--) {
      var rr = R * (0.28 + s * 0.055);
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(158,197,255," + (0.03 + pulse * 0.065 * (1 - s / shells)) + ")";
      ctx.lineWidth = Math.max(1, W * 0.0012);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, R, t * 0.85, t * 0.85 + Math.PI * 1.25);
    ctx.strokeStyle = "rgba(230,240,255," + (0.42 + pulse * 0.48) + ")";
    ctx.lineWidth = Math.max(1.6, W * 0.0036);
    ctx.stroke();

    var meridians = 28;
    for (var i = 0; i < meridians; i++) {
      var a = (i / meridians) * Math.PI + t * 0.11;
      ctx.beginPath();
      for (var p = 0; p <= 48; p++) {
        var u = (p / 48) * Math.PI * 2;
        var x = cx + Math.cos(u) * R * Math.cos(a);
        var y = cy + Math.sin(u) * R * 0.56;
        if (p === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(158,197,255," + (0.045 + pulse * 0.11) + ")";
      ctx.stroke();
    }

    var dots = 220;
    for (var d = 0; d < dots; d++) {
      var az = (d / dots) * Math.PI * 2 + t * (speaking ? 2.2 : listening ? 0.85 : 0.32);
      var el = Math.sin(t * 0.7 + d * 0.37) * 0.72;
      var rr2 = R * (0.74 + 0.16 * Math.sin(t * 2.4 + d));
      var x2 = cx + Math.cos(az) * rr2 * Math.cos(el);
      var y2 = cy + Math.sin(el) * rr2 * 0.68;
      ctx.fillStyle = listening
        ? "rgba(125,211,252," + (0.2 + pulse * 0.55) + ")"
        : "rgba(226,232,255," + (0.14 + pulse * 0.52) + ")";
      ctx.beginPath();
      ctx.arc(x2, y2, Math.max(1.05, W * 0.0028), 0, Math.PI * 2);
      ctx.fill();
    }

    var sweep = (t * 0.42) % 1;
    ctx.fillStyle = "rgba(180,210,255," + (0.05 + pulse * 0.07) + ")";
    ctx.fillRect(0, H * sweep, W, Math.max(2, H * 0.018));
    ctx.fillStyle = "rgba(180,210,255," + (0.03 + pulse * 0.04) + ")";
    ctx.fillRect(W * sweep, 0, Math.max(2, W * 0.01), H);

    ctx.fillStyle = "rgba(158,197,255," + (0.58 + pulse * 0.35) + ")";
    ctx.font = "600 " + Math.round(Math.max(10, W * 0.024)) + "px ui-monospace,monospace";
    ctx.textAlign = "center";
    ctx.fillText(speaking ? "IRIS LIVE" : listening ? "LISTENING" : "IRIS", cx, cy + R + Math.max(16, H * 0.075));
  }

  function stop() {
    if (raf) w.cancelAnimationFrame(raf);
    raf = 0;
  }

  w.IrisHolo = {
    version: VERSION,
    mount: mount,
    setEnergy: setEnergy,
    setSpeaking: setSpeaking,
    setListening: setListening,
    lookAt: lookAt,
    bindVideo: bindVideo,
    stop: stop
  };
})(window);
