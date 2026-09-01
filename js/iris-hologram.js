/**
 * Iris hologram — volumetric field.
 * Presence is geometry driven by energy. Not a face model.
 */
(function (w) {
  var VERSION = "iris-hologram-2026-09-01-b";
  var canvas = null;
  var ctx = null;
  var raf = 0;
  var energy = 0.2;
  var speaking = false;
  var listening = false;
  var video = null;
  var t0 = 0;

  function mount(target) {
    var host = typeof target === "string" ? document.querySelector(target) : target;
    if (!host) return null;
    canvas = host.tagName === "CANVAS" ? host : host.querySelector("canvas") || document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = (canvas.className + " iris-holo").trim();
    if (canvas.parentNode !== host && host.tagName !== "CANVAS") host.insertBefore(canvas, host.firstChild);
    ctx = canvas.getContext("2d");
    size();
    if (!raf) loop();
    w.addEventListener("resize", size);
    return canvas;
  }

  function size() {
    if (!canvas) return;
    var parent = canvas.parentElement || canvas;
    var wdt = parent.clientWidth || 320;
    var hgt = parent.clientHeight || 220;
    if (hgt < 140) hgt = Math.round(wdt * 0.56);
    var dpr = Math.min(w.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(wdt * dpr);
    canvas.height = Math.floor(hgt * dpr);
    canvas.style.width = wdt + "px";
    canvas.style.height = hgt + "px";
  }

  function setEnergy(n) { energy = Math.max(0, Math.min(1, n)); }
  function setSpeaking(on) { speaking = !!on; }
  function setListening(on) { listening = !!on; }
  function bindVideo(el) { video = el || null; }

  function loop(now) {
    raf = w.requestAnimationFrame(loop);
    if (!ctx || !canvas) return;
    if (!t0) t0 = now || performance.now();
    var t = ((now || performance.now()) - t0) / 1000;
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    var lean = listening ? Math.sin(t * 1.3) * 0.03 : 0;
    var cx = W * (0.5 + lean);
    var cy = H * (0.5 + (speaking ? -0.02 : 0.02));
    var R = Math.min(W, H) * (0.26 + energy * 0.08);
    var pulse = speaking ? 0.62 + 0.38 * Math.abs(Math.sin(t * 9)) : listening ? 0.4 + 0.2 * Math.abs(Math.sin(t * 2.2)) : 0.2 + energy * 0.45;

    var g = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 2.1);
    g.addColorStop(0, "rgba(160,200,255," + (0.16 + pulse * 0.18) + ")");
    g.addColorStop(0.45, "rgba(40,80,160,0.08)");
    g.addColorStop(1, "rgba(2,4,12,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    if (video && video.readyState >= 2 && video.videoWidth) {
      ctx.save();
      ctx.globalAlpha = 0.12 + energy * 0.1;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.7, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(video, cx - R, cy - R, R * 2, R * 2);
      ctx.restore();
    }

    var shells = 11;
    for (var s = shells; s >= 1; s--) {
      var rr = R * (0.42 + s * 0.08);
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(158,197,255," + (0.04 + pulse * 0.07 * (1 - s / shells)) + ")";
      ctx.lineWidth = Math.max(1, W * 0.0014);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, R, t * 0.7, t * 0.7 + Math.PI * 1.15);
    ctx.strokeStyle = "rgba(210,230,255," + (0.35 + pulse * 0.4) + ")";
    ctx.lineWidth = Math.max(1.4, W * 0.003);
    ctx.stroke();

    var meridians = 16;
    for (var i = 0; i < meridians; i++) {
      var a = (i / meridians) * Math.PI + t * 0.08;
      ctx.beginPath();
      for (var p = 0; p <= 40; p++) {
        var u = (p / 40) * Math.PI * 2;
        var x = cx + Math.cos(u) * R * Math.cos(a);
        var y = cy + Math.sin(u) * R * 0.58;
        if (p === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(158,197,255," + (0.05 + pulse * 0.12) + ")";
      ctx.stroke();
    }

    var dots = 96;
    for (var d = 0; d < dots; d++) {
      var az = (d / dots) * Math.PI * 2 + t * (speaking ? 1.8 : listening ? 0.7 : 0.28);
      var el = Math.sin(t * 0.6 + d * 0.4) * 0.62;
      var rr2 = R * (0.78 + 0.1 * Math.sin(t * 2.1 + d));
      var x2 = cx + Math.cos(az) * rr2 * Math.cos(el);
      var y2 = cy + Math.sin(el) * rr2 * 0.66;
      ctx.fillStyle = listening
        ? "rgba(125,211,252," + (0.22 + pulse * 0.5) + ")"
        : "rgba(226,232,255," + (0.16 + pulse * 0.5) + ")";
      ctx.beginPath();
      ctx.arc(x2, y2, Math.max(1.1, W * 0.0032), 0, Math.PI * 2);
      ctx.fill();
    }

    var sweep = (t * 0.35) % 1;
    ctx.fillStyle = "rgba(180,210,255," + (0.04 + pulse * 0.05) + ")";
    ctx.fillRect(0, H * sweep, W, Math.max(2, H * 0.012));

    ctx.fillStyle = "rgba(158,197,255," + (0.55 + pulse * 0.35) + ")";
    ctx.font = "600 " + Math.round(Math.max(10, W * 0.026)) + "px ui-monospace,monospace";
    ctx.textAlign = "center";
    ctx.fillText(speaking ? "IRIS LIVE" : listening ? "LISTENING" : "IRIS", cx, cy + R + Math.max(16, H * 0.08));
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
    bindVideo: bindVideo,
    stop: stop
  };
})(window);
