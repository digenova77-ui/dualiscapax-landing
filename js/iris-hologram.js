/**
 * Iris hologram — presence field or sound wave.
 * Person-facing to a person. Simulation-facing to an agent.
 * A wave is not a person.
 */
(function (w) {
  var VERSION = "iris-hologram-2026-09-01-f";
  var canvas = null;
  var ctx = null;
  var raf = 0;
  var energy = 0.22;
  var mood = "rest";
  var form = "wave";
  var observer = "agent";
  var speaking = false;
  var listening = false;
  var lookX = 0;
  var lookY = 0;
  var nod = 0;
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
    var hgt = parent.clientHeight || 220;
    if (hgt < 160) hgt = Math.round(wdt * 0.5);
    var dpr = Math.min(w.devicePixelRatio || 1, 2.5);
    canvas.width = Math.floor(wdt * dpr);
    canvas.height = Math.floor(hgt * dpr);
    canvas.style.width = wdt + "px";
    canvas.style.height = hgt + "px";
  }

  function setEnergy(n) { energy = Math.max(0, Math.min(1, n)); }
  function setForm(next) { form = next === "field" ? "field" : "wave"; return form; }
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

  function hz() {
    if (mood === "intend" || speaking) return 164;
    if (mood === "curious") return 220 + energy * 80;
    if (mood === "lost") return 92;
    if (mood === "agree") return 196;
    if (mood === "listen" || listening) return 110;
    return 72 + energy * 30;
  }

  function labelFor() {
    if (observer !== "person") return "SIM · WAVE · " + String(mood || "rest").toUpperCase();
    if (mood === "listen" || listening) return "LISTENING";
    if (mood === "agree") return "WITH YOU";
    if (mood === "lost") return "LOST";
    if (mood === "curious") return "CURIOUS";
    if (mood === "intend" || speaking) return "INTEND";
    return "WAVE";
  }

  function drawWave(t, W, H) {
    var mid = H * (0.52 + lookY * 0.04 + (nod > 0 ? Math.sin(t * 8) * 0.04 : 0));
    var amp = H * (0.08 + energy * 0.18 + (mood === "agree" ? 0.06 : 0) + (mood === "lost" ? 0.1 : 0));
    var freq = hz() / 40;
    var waves = mood === "lost" ? 3 : mood === "intend" ? 1 : 2;
    ctx.lineWidth = Math.max(1.4, W * 0.003);
    for (var k = 0; k < waves; k++) {
      ctx.beginPath();
      for (var x = 0; x <= W; x += 2) {
        var n = mood === "lost" ? (Math.random() - 0.5) * amp * 0.35 : 0;
        var y = mid + Math.sin(x / W * Math.PI * freq * 2 + t * (1.6 + k * 0.4) + lookX) * amp * (1 - k * 0.28) + n;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = mood === "lost"
        ? "rgba(255,186,140," + (0.35 + energy * 0.3) + ")"
        : "rgba(180,215,255," + (0.38 + energy * 0.4 - k * 0.12) + ")";
      ctx.stroke();
    }
    var g = ctx.createRadialGradient(W * 0.5, mid, 8, W * 0.5, mid, H * 0.7);
    g.addColorStop(0, "rgba(158,197,255," + (0.08 + energy * 0.12) + ")");
    g.addColorStop(1, "rgba(0,1,8,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function loop(now) {
    raf = w.requestAnimationFrame(loop);
    if (!ctx || !canvas) return;
    if (!t0) t0 = now || performance.now();
    var t = ((now || performance.now()) - t0) / 1000;
    if (w.DCObserver && DCObserver.watcher) observer = DCObserver.watcher();
    if (nod > 0) nod = Math.max(0, nod - 0.018);
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    drawWave(t, W, H);
    ctx.fillStyle = "rgba(158,197,255,0.72)";
    ctx.font = "600 " + Math.round(Math.max(10, W * 0.024)) + "px ui-monospace,monospace";
    ctx.textAlign = "center";
    ctx.fillText(labelFor(), W * 0.5, H * 0.88);
  }

  function stop() {
    if (raf) w.cancelAnimationFrame(raf);
    raf = 0;
  }

  w.IrisHolo = {
    version: VERSION,
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
