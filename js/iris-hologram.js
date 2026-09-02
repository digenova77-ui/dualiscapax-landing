/**
 * Iris hologram — wave, sun-orb, sprite, or field.
 * Depth AGAINST the glass: layer 1 at the pane, then down into the volume.
 * Nothing rises off the glass. Not a person. Not a projector.
 */
(function (w) {
  var VERSION = "iris-hologram-2026-09-01-depth-down";
  var canvas = null;
  var ctx = null;
  var raf = 0;
  var energy = 0.22;
  var mood = "rest";
  var form = "orb";
  var observer = "agent";
  var speaking = false;
  var listening = false;
  var lookX = 0;
  var lookY = 0;
  var nod = 0;
  var t0 = 0;
  var reduced = false;

  function mount(target) {
    reduced = !!(w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (reduced) return null;
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
    var hgt = parent.clientHeight || 220;
    if (hgt < 36) hgt = 36;
    var dpr = Math.min(w.devicePixelRatio || 1, 2.5);
    canvas.width = Math.floor(wdt * dpr);
    canvas.height = Math.floor(hgt * dpr);
    canvas.style.width = wdt + "px";
    canvas.style.height = hgt + "px";
  }

  function setEnergy(n) { energy = Math.max(0, Math.min(1, n)); }
  function setForm(next) {
    form = next === "wave" || next === "field" || next === "orb" || next === "sprite" ? next : form;
    return form;
  }
  function setObserver(who) { observer = who === "person" ? "person" : "agent"; return observer; }
  function setSpeaking(on) { speaking = !!on; if (speaking) mood = "intend"; }
  function setListening(on) {
    listening = !!on;
    if (listening && mood === "rest") mood = "listen";
    if (!listening && mood === "listen") mood = "rest";
  }
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
  function bindVideo() { return null; }

  function labelFor() {
    var body = form === "orb" ? "ORB" : form === "sprite" ? "SPRITE" : form === "field" ? "FIELD" : "WAVE";
    if (observer !== "person") return "SIM · " + body + " · " + String(mood || "rest").toUpperCase();
    if (mood === "listen" || listening) return "LISTENING";
    if (mood === "agree") return "WITH YOU";
    if (mood === "lost") return "LOST";
    if (mood === "curious") return "CURIOUS";
    if (mood === "intend" || speaking) return "INTEND";
    return body;
  }

  function drawWave(t, W, H) {
    var mid = H * (0.52 + lookY * 0.04 + (nod > 0 ? Math.sin(t * 8) * 0.04 : 0));
    var amp = H * (0.08 + energy * 0.18);
    ctx.lineWidth = Math.max(1.4, W * 0.003);
    ctx.beginPath();
    for (var x = 0; x <= W; x += 2) {
      var y = mid + Math.sin(x / W * Math.PI * 4 + t * 1.8 + lookX) * amp;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(180,215,255,0.75)";
    ctx.stroke();
  }

  function drawFarField(t, W, H, par) {
    var cx = W * (0.5 + lookX * 0.02 * par);
    var cy = H * (0.5 + lookY * 0.015 * par);
    var R = Math.min(W, H) * 0.42;
    var s;
    for (s = 7; s >= 3; s--) {
      ctx.beginPath();
      ctx.arc(cx, cy, R * s / 8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(158,197,255," + (0.045 + energy * 0.04) + ")";
      ctx.stroke();
    }
  }

  function drawOrb(t, W, H) {
    drawFarField(t, W, H, 1);
    var cx = W * (0.5 + lookX * 0.06);
    var cy = H * (0.48 + lookY * 0.05 + (nod > 0 ? Math.sin(t * 7.4) * 0.05 : 0));
    var R = Math.min(W, H) * (0.28 + energy * 0.14) * (1 + Math.sin(t * 1.4) * 0.03);
    var g = ctx.createRadialGradient(cx, cy, R * 0.15, cx, cy, R * 2.4);
    g.addColorStop(0, "rgba(255,244,210,0.96)");
    g.addColorStop(0.22, "rgba(255,196,90,0.8)");
    g.addColorStop(1, "rgba(0,1,8,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = mood === "lost" ? "rgba(255,170,110,0.9)" : "rgba(255,210,90,0.95)";
    ctx.fill();
  }

  function drawSprite(t, W, H) {
    var u = Math.min(W, H) * 0.08;
    var cx = W * (0.5 + lookX * 0.08);
    var cy = H * (0.5 + lookY * 0.05 + (nod > 0 ? Math.sin(t * 8) * 0.06 : Math.sin(t * 2) * 0.015));
    ctx.fillStyle = mood === "lost" ? "rgba(255,186,140,0.9)" : "rgba(180,220,255,0.95)";
    ctx.fillRect(cx - u, cy - u * 1.4, u * 2, u * 2.2);
    ctx.fillStyle = "rgba(8,12,24,0.9)";
    ctx.fillRect(cx - u * 0.55 + lookX * u * 0.2, cy - u * 0.7, u * 0.35, u * 0.35);
    ctx.fillRect(cx + u * 0.2 + lookX * u * 0.2, cy - u * 0.7, u * 0.35, u * 0.35);
    if (mood === "agree" || nod > 0) ctx.fillRect(cx - u * 0.35, cy + u * 0.15, u * 0.7, u * 0.18);
  }

  function drawField(t, W, H) {
    var cx = W * 0.5, cy = H * 0.5, R = Math.min(W, H) * 0.28;
    var s, i, a;
    for (s = 8; s >= 1; s--) {
      ctx.beginPath();
      ctx.arc(cx, cy, R * s / 8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(158,197,255,0.12)";
      ctx.stroke();
    }
    for (i = 0; i < 36; i++) {
      a = i / 36 * Math.PI * 2 + t * 0.2;
      ctx.fillStyle = "rgba(226,232,255,0.55)";
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.55, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop(now) {
    raf = w.requestAnimationFrame(loop);
    if (!ctx || !canvas || reduced) return;
    if (!t0) t0 = now || performance.now();
    var t = ((now || performance.now()) - t0) / 1000;
    if (w.DCObserver && DCObserver.watcher) observer = DCObserver.watcher();
    if (nod > 0) nod = Math.max(0, nod - 0.018);
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    if (form === "wave") drawWave(t, W, H);
    else if (form === "sprite") drawSprite(t, W, H);
    else if (form === "field") drawField(t, W, H);
    else drawOrb(t, W, H);
    if (H > 160) {
      ctx.fillStyle = "rgba(255,224,170,0.78)";
      ctx.font = "600 " + Math.round(Math.max(10, W * 0.024)) + "px ui-monospace,monospace";
      ctx.textAlign = "center";
      ctx.fillText(labelFor(), W * 0.5, H * 0.9);
    }
  }

  function stop() {
    if (raf) w.cancelAnimationFrame(raf);
    raf = 0;
    speaking = false;
    listening = false;
    energy = 0.18;
    mood = "rest";
  }

  w.IrisHolo = {
    version: VERSION,
    get form() { return form; },
    mount: mount,
    setEnergy: setEnergy,
    setForm: setForm,
    setObserver: setObserver,
    setSpeaking: setSpeaking,
    setListening: setListening,
    setMood: setMood,
    lookAt: lookAt,
    bindVideo: bindVideo,
    stop: stop
  };
})(window);
