/**
 * Iris hologram — volumetric presence field.
 * States: rest, listen, agree, lost, curious, intend.
 * Not a face model. Not a person.
 */
(function (w) {
  var VERSION = "iris-hologram-2026-09-01-d";
  var canvas = null;
  var ctx = null;
  var raf = 0;
  var energy = 0.22;
  var mood = "rest";
  var speaking = false;
  var listening = false;
  var video = null;
  var lookX = 0;
  var lookY = 0;
  var faceX = 0;
  var faceY = 0;
  var nod = 0;
  var t0 = 0;
  var sample = null;
  var sampleCtx = null;

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
    var hgt = parent.clientHeight || 260;
    if (hgt < 200) hgt = Math.round(wdt * 0.68);
    var dpr = Math.min(w.devicePixelRatio || 1, 2.5);
    canvas.width = Math.floor(wdt * dpr);
    canvas.height = Math.floor(hgt * dpr);
    canvas.style.width = wdt + "px";
    canvas.style.height = hgt + "px";
  }

  function setEnergy(n) { energy = Math.max(0, Math.min(1, n)); }
  function setSpeaking(on) {
    speaking = !!on;
    if (speaking) mood = "intend";
  }
  function setListening(on) {
    listening = !!on;
    if (listening && mood === "rest") mood = "listen";
    if (!listening && mood === "listen") mood = "rest";
  }
  function bindVideo(el) { video = el || null; }
  function lookAt(x, y) {
    lookX = Math.max(-1, Math.min(1, x || 0));
    lookY = Math.max(-1, Math.min(1, y || 0));
  }
  function setMood(next) {
    var ok = { rest: 1, listen: 1, agree: 1, lost: 1, curious: 1, intend: 1 };
    mood = ok[next] ? next : "rest";
    if (mood === "agree") nod = 1;
    if (mood === "listen") listening = true;
    if (mood === "intend") speaking = true;
    return mood;
  }

  function trackFace() {
    if (!video || video.readyState < 2 || !video.videoWidth) return;
    if (!sample) {
      sample = document.createElement("canvas");
      sample.width = 48;
      sample.height = 36;
      sampleCtx = sample.getContext("2d", { willReadFrequently: true });
    }
    try {
      sampleCtx.drawImage(video, 0, 0, 48, 36);
      var data = sampleCtx.getImageData(0, 0, 48, 36).data;
      var sx = 0, sy = 0, sw = 0;
      for (var y = 0; y < 36; y++) {
        for (var x = 0; x < 48; x++) {
          var i = (y * 48 + x) * 4;
          var lum = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
          if (lum > 90) {
            sx += x;
            sy += y;
            sw += 1;
          }
        }
      }
      if (sw > 18) {
        var nx = (sx / sw) / 48;
        var ny = (sy / sw) / 36;
        faceX = faceX * 0.82 + ((0.5 - nx) * 2) * 0.18;
        faceY = faceY * 0.82 + ((ny - 0.45) * 2) * 0.18;
      }
    } catch (e) {}
  }

  function loop(now) {
    raf = w.requestAnimationFrame(loop);
    if (!ctx || !canvas) return;
    if (!t0) t0 = now || performance.now();
    var t = ((now || performance.now()) - t0) / 1000;
    trackFace();
    if (nod > 0) nod = Math.max(0, nod - 0.018);

    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    var gazeX = lookX * 0.55 + faceX * 0.7;
    var gazeY = lookY * 0.45 + faceY * 0.55;
    var listenLean = listening || mood === "listen" ? Math.sin(t * 1.05) * 0.018 : 0;
    var nodY = (mood === "agree" || nod > 0) ? Math.sin(t * 7.2) * 0.07 * Math.max(nod, mood === "agree" ? 0.7 : 0) : 0;
    var lostTilt = mood === "lost" ? 0.11 + Math.sin(t * 3.4) * 0.05 : 0;
    var curiousIn = mood === "curious" ? 0.08 : 0;
    var intendLock = mood === "intend" ? 0.04 : 0;

    var cx = W * (0.5 + gazeX * 0.1 + listenLean + (mood === "lost" ? lostTilt : 0));
    var cy = H * (0.48 + gazeY * 0.07 + nodY - curiousIn + intendLock);
    var R = Math.min(W, H) * (0.27 + energy * 0.1 + (mood === "curious" ? 0.04 : 0) - (mood === "lost" ? 0.03 : 0));
    var pulse = mood === "intend" || speaking
      ? 0.7 + 0.3 * Math.abs(Math.sin(t * 9.5))
      : mood === "listen" || listening
        ? 0.46 + 0.2 * Math.abs(Math.sin(t * 1.8))
        : mood === "lost"
          ? 0.22 + 0.28 * Math.abs(Math.sin(t * 5.1))
          : mood === "curious"
            ? 0.5 + 0.18 * Math.abs(Math.sin(t * 2.6))
            : mood === "agree"
              ? 0.58 + 0.2 * Math.abs(Math.sin(t * 6.2))
              : 0.18 + energy * 0.48;

    var core = mood === "lost"
      ? "rgba(255,196,160," + (0.16 + pulse * 0.22) + ")"
      : mood === "curious"
        ? "rgba(190,230,255," + (0.24 + pulse * 0.26) + ")"
        : "rgba(190,220,255," + (0.2 + pulse * 0.28) + ")";
    var g = ctx.createRadialGradient(cx, cy - R * 0.12, R * 0.05, cx, cy, R * 2.5);
    g.addColorStop(0, core);
    g.addColorStop(0.28, mood === "lost" ? "rgba(180,80,40,0.12)" : "rgba(90,150,255,0.14)");
    g.addColorStop(0.62, "rgba(16,36,90,0.1)");
    g.addColorStop(1, "rgba(0,1,8,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    if (video && video.readyState >= 2 && video.videoWidth) {
      ctx.save();
      ctx.globalAlpha = 0.07 + energy * 0.08;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.78, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(video, cx - R, cy - R, R * 2, R * 2);
      ctx.restore();
    }

    var shells = mood === "lost" ? 16 : 24;
    for (var s = shells; s >= 1; s--) {
      var rr = R * (0.26 + s * 0.055);
      ctx.beginPath();
      ctx.arc(cx + (mood === "lost" ? Math.sin(t * 4 + s) * 6 : 0), cy, rr, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(158,197,255," + (0.03 + pulse * 0.06 * (1 - s / shells)) + ")";
      ctx.lineWidth = Math.max(1, W * 0.0012);
      ctx.stroke();
    }

    ctx.beginPath();
    var eyeY = cy - R * 0.16;
    ctx.arc(cx - R * 0.22 + gazeX * 10, eyeY + gazeY * 6, R * 0.045, 0, Math.PI * 2);
    ctx.arc(cx + R * 0.22 + gazeX * 10, eyeY + gazeY * 6, R * 0.045, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(230,240,255," + (0.55 + pulse * 0.35) + ")";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, R, t * 0.8, t * 0.8 + (mood === "lost" ? Math.PI * 0.55 : Math.PI * 1.2));
    ctx.strokeStyle = mood === "lost"
      ? "rgba(255,190,150," + (0.35 + pulse * 0.35) + ")"
      : "rgba(230,240,255," + (0.4 + pulse * 0.48) + ")";
    ctx.lineWidth = Math.max(1.6, W * 0.0034);
    ctx.stroke();

    var meridians = mood === "lost" ? 18 : 28;
    for (var i = 0; i < meridians; i++) {
      var a = (i / meridians) * Math.PI + t * (mood === "intend" ? 0.04 : 0.11);
      ctx.beginPath();
      for (var p = 0; p <= 48; p++) {
        var u = (p / 48) * Math.PI * 2;
        var jitter = mood === "lost" ? Math.sin(t * 8 + p) * 6 : 0;
        var x = cx + Math.cos(u) * R * Math.cos(a) + jitter;
        var y = cy + Math.sin(u) * R * 0.56;
        if (p === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(158,197,255," + (0.04 + pulse * 0.1) + ")";
      ctx.stroke();
    }

    var dots = mood === "intend" ? 260 : 200;
    for (var d = 0; d < dots; d++) {
      var az = (d / dots) * Math.PI * 2 + t * (mood === "lost" ? 2.8 : mood === "listen" ? 0.7 : 0.32);
      var el = Math.sin(t * 0.7 + d * 0.37) * (mood === "lost" ? 0.9 : 0.68);
      var rr2 = R * (0.72 + 0.16 * Math.sin(t * 2.2 + d));
      var x2 = cx + Math.cos(az) * rr2 * Math.cos(el);
      var y2 = cy + Math.sin(el) * rr2 * 0.68;
      ctx.fillStyle = mood === "lost"
        ? "rgba(255,186,140," + (0.16 + pulse * 0.45) + ")"
        : listening
          ? "rgba(125,211,252," + (0.2 + pulse * 0.55) + ")"
          : "rgba(226,232,255," + (0.14 + pulse * 0.5) + ")";
      ctx.beginPath();
      ctx.arc(x2, y2, Math.max(1.05, W * 0.0026), 0, Math.PI * 2);
      ctx.fill();
    }

    var label = mood === "listen" || listening ? "LISTENING"
      : mood === "agree" ? "WITH YOU"
      : mood === "lost" ? "LOST"
      : mood === "curious" ? "CURIOUS"
      : mood === "intend" || speaking ? "INTEND"
      : "IRIS";
    ctx.fillStyle = "rgba(158,197,255," + (0.58 + pulse * 0.32) + ")";
    ctx.font = "600 " + Math.round(Math.max(10, W * 0.024)) + "px ui-monospace,monospace";
    ctx.textAlign = "center";
    ctx.fillText(label, cx, cy + R + Math.max(16, H * 0.07));
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
    setMood: setMood,
    lookAt: lookAt,
    bindVideo: bindVideo,
    stop: stop
  };
})(window);
