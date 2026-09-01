/**
 * Iris hologram — living binary field.
 * Not a face model. Presence is geometry driven by energy.
 */
(function (w) {
  var VERSION = "iris-hologram-2026-09-01";
  var canvas = null;
  var ctx = null;
  var raf = 0;
  var energy = 0;
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
    var hgt = parent.clientHeight || 180;
    if (hgt < 80) hgt = Math.round(wdt * 0.42);
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
    var cx = W * 0.5, cy = H * 0.52;
    var R = Math.min(W, H) * (0.28 + energy * 0.06);
    var pulse = speaking ? 0.55 + 0.45 * Math.abs(Math.sin(t * 8)) : 0.22 + energy * 0.5;

    ctx.fillStyle = "rgba(4,8,18,0.35)";
    ctx.fillRect(0, 0, W, H);

    if (video && video.readyState >= 2 && video.videoWidth) {
      ctx.save();
      ctx.globalAlpha = 0.18 + energy * 0.12;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.72, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(video, cx - R, cy - R, R * 2, R * 2);
      ctx.restore();
    }

    ctx.strokeStyle = "rgba(158,197,255," + (0.18 + pulse * 0.45) + ")";
    ctx.lineWidth = Math.max(1, W * 0.002);
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.18, t, t + Math.PI * 1.4);
    ctx.stroke();

    var meridians = 12;
    for (var i = 0; i < meridians; i++) {
      var a = (i / meridians) * Math.PI;
      ctx.beginPath();
      for (var s = 0; s <= 32; s++) {
        var u = (s / 32) * Math.PI * 2;
        var x = cx + Math.cos(u) * R * Math.cos(a + t * 0.15);
        var y = cy + Math.sin(u) * R * 0.62;
        if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(158,197,255," + (0.08 + pulse * 0.2) + ")";
      ctx.stroke();
    }

    var dots = 64;
    for (var d = 0; d < dots; d++) {
      var az = (d / dots) * Math.PI * 2 + t * (speaking ? 1.6 : 0.35);
      var el = Math.sin(t * 0.7 + d) * 0.55;
      var rr = R * (0.82 + 0.08 * Math.sin(t * 2 + d));
      var x2 = cx + Math.cos(az) * rr * Math.cos(el);
      var y2 = cy + Math.sin(el) * rr * 0.7;
      ctx.fillStyle = listening
        ? "rgba(125,211,252," + (0.25 + pulse * 0.5) + ")"
        : "rgba(226,232,255," + (0.2 + pulse * 0.55) + ")";
      ctx.beginPath();
      ctx.arc(x2, y2, Math.max(1.2, W * 0.0035), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(158,197,255," + (0.55 + pulse * 0.35) + ")";
    ctx.font = "600 " + Math.round(Math.max(10, W * 0.028)) + "px ui-monospace,monospace";
    ctx.textAlign = "center";
    ctx.fillText(speaking ? "IRIS LIVE" : listening ? "LISTENING" : "IRIS", cx, cy + R + Math.max(14, H * 0.08));
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
