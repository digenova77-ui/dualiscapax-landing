/**
 * One boot. Splash (logo) → muted reel → mission base.
 * Sound never starts here. Reduced-motion and ?skip=1 jump to base.
 * Returning visitors skip unless ?boot=1.
 * Reel: video#boot-reel if src exists, else canvas stage.
 */
(function (w) {
  var VERSION = "iris-boot-2026-09-23b";
  var PHASE = { SPLASH: "splash", REEL: "reel", BASE: "base" };
  var phase = PHASE.SPLASH;
  var KEY = "dc.boot.v1";
  var SPLASH_MS = 1700;
  var REEL_CAP_MS = 10000;
  var LINES = [
    "You just walked in.",
    "This is DualisCapax. Rooms you can look through.",
    "That's Iris. She'll meet you."
  ];
  function reduced() { return !!(w.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function seen() { try { return w.localStorage.getItem(KEY) === "1"; } catch (e) { return false; } }
  function mark() { try { w.localStorage.setItem(KEY, "1"); } catch (e) {} }
  function wantBoot() { return /[?&]boot=1/.test(String(w.location.search || "")); }
  function wantSkip() { return /[?&]skip=1/.test(String(w.location.search || "")); }
  function setPhase(next) {
    phase = next;
    var root = w.document && document.documentElement;
    if (root) root.setAttribute("data-boot", next);
    var boot = w.document && document.getElementById("boot");
    if (boot) { boot.setAttribute("data-phase", next); boot.hidden = next === PHASE.BASE; }
    if (next === PHASE.BASE) {
      mark();
      if (w.dispatchEvent) w.dispatchEvent(new CustomEvent("iris:boot", { detail: { phase: next } }));
    }
    return phase;
  }
  function drawStage(canvas, t) {
    var ctx = canvas.getContext("2d"); if (!ctx) return;
    var dpr = Math.min(2, w.devicePixelRatio || 1);
    var wdt = canvas.clientWidth || w.innerWidth;
    var hgt = canvas.clientHeight || w.innerHeight;
    if (canvas.width !== wdt * dpr) { canvas.width = wdt * dpr; canvas.height = hgt * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#07090d"; ctx.fillRect(0, 0, wdt, hgt);
    var cx = wdt * 0.52, cy = hgt * 0.46, pulse = 1 + Math.sin(t / 400) * 0.04;
    function orb(x, y, r, c0, c1) {
      var g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
      g.addColorStop(0, c0); g.addColorStop(1, c1);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    }
    orb(cx, cy, 78 * pulse, "rgba(56,189,248,.95)", "rgba(8,47,73,.2)");
    orb(cx + 70, cy - 58, 28, "rgba(192,132,252,.95)", "rgba(76,29,149,.15)");
    orb(cx + 54, cy + 62, 22, "rgba(167,139,250,.9)", "rgba(76,29,149,.12)");
    ctx.fillStyle = "rgba(248,250,252,.92)"; ctx.font = "600 15px ui-sans-serif,system-ui,sans-serif"; ctx.textAlign = "center";
    ctx.fillText("DualisCapax", wdt / 2, 48);
    var idx = Math.min(LINES.length - 1, Math.floor(t / 2800));
    ctx.fillStyle = "rgba(226,232,240,.92)"; ctx.font = "600 22px ui-sans-serif,system-ui,sans-serif";
    ctx.fillText(LINES[idx], wdt / 2, hgt * 0.82);
  }
  function playCanvasReel() {
    var canvas = w.document && document.getElementById("boot-stage");
    var cap = w.document && document.getElementById("boot-caption");
    if (!canvas) return setPhase(PHASE.BASE);
    setPhase(PHASE.REEL); canvas.hidden = false;
    var t0 = (w.performance && performance.now) ? performance.now() : Date.now();
    function tick(now) {
      if (phase !== PHASE.REEL) return;
      var t = now - t0; drawStage(canvas, t);
      if (cap) cap.textContent = LINES[Math.min(LINES.length - 1, Math.floor(t / 2800))];
      if (t >= REEL_CAP_MS) return setPhase(PHASE.BASE);
      w.requestAnimationFrame(tick);
    }
    w.requestAnimationFrame(tick);
    w.setTimeout(function () { if (phase === PHASE.REEL) setPhase(PHASE.BASE); }, REEL_CAP_MS + 80);
  }
  function playReel() {
    var reel = w.document && document.getElementById("boot-reel");
    var src = reel && (reel.getAttribute("src") || (reel.currentSrc || ""));
    if (reel && src) {
      setPhase(PHASE.REEL);
      var done = function () { setPhase(PHASE.BASE); };
      reel.addEventListener("ended", done, { once: true });
      reel.addEventListener("error", function () { playCanvasReel(); }, { once: true });
      reel.muted = true; reel.playsInline = true; reel.hidden = false;
      var p = reel.play(); if (p && p.catch) p.catch(function () { playCanvasReel(); });
      w.setTimeout(function () { if (phase === PHASE.REEL) done(); }, REEL_CAP_MS);
      return;
    }
    playCanvasReel();
  }
  function start() {
    if (reduced() || wantSkip() || (seen() && !wantBoot())) return setPhase(PHASE.BASE);
    setPhase(PHASE.SPLASH);
    var splash = w.document && document.getElementById("boot-splash");
    if (splash) splash.hidden = false;
    w.setTimeout(function () { if (phase !== PHASE.SPLASH) return; playReel(); }, SPLASH_MS);
  }
  function skip() { setPhase(PHASE.BASE); }
  if (w.document) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
    document.addEventListener("click", function (e) {
      var t = e.target; if (!t) return;
      if (t.id === "boot-skip" || (t.closest && t.closest("#boot-skip"))) skip();
      if (t.id === "boot-enter" || (t.closest && t.closest("#boot-enter"))) {
        if (phase === PHASE.SPLASH) playReel(); else skip();
      }
    });
  }
  w.IrisBoot = { version: VERSION, PHASE: PHASE, phase: function () { return phase; }, skip: skip, start: start, playReel: playReel };
})(window);
