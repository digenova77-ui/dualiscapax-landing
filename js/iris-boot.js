/**
 * One boot. Splash (logo) → optional reel → mission base.
 * Sound never starts without a gesture. Reduced-motion and ?skip=1 jump to base.
 * Returning visitors skip the film unless ?boot=1.
 */
(function (w) {
  var VERSION = "iris-boot-2026-09-23";
  var PHASE = { SPLASH: "splash", REEL: "reel", BASE: "base" };
  var phase = PHASE.SPLASH;
  var KEY = "dc.boot.v1";
  var SPLASH_MS = 1600;
  var REEL_CAP_MS = 12000;

  function reduced() {
    return !!(w.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  function seen() {
    try { return w.localStorage.getItem(KEY) === "1"; } catch (e) { return false; }
  }
  function mark() {
    try { w.localStorage.setItem(KEY, "1"); } catch (e) {}
  }
  function wantBoot() {
    return /[?&]boot=1/.test(String(w.location.search || ""));
  }
  function wantSkip() {
    return /[?&]skip=1/.test(String(w.location.search || ""));
  }

  function setPhase(next) {
    phase = next;
    var root = w.document && document.documentElement;
    if (root) root.setAttribute("data-boot", next);
    var boot = w.document && document.getElementById("boot");
    if (boot) boot.setAttribute("data-phase", next);
    if (next === PHASE.BASE) {
      mark();
      if (boot) boot.hidden = true;
      if (w.dispatchEvent) w.dispatchEvent(new CustomEvent("iris:boot", { detail: { phase: next } }));
    }
    return phase;
  }

  function playReel() {
    var reel = w.document && document.getElementById("boot-reel");
    if (!reel || !reel.play) return setPhase(PHASE.BASE);
    setPhase(PHASE.REEL);
    var done = function () { setPhase(PHASE.BASE); };
    reel.addEventListener("ended", done, { once: true });
    reel.addEventListener("error", done, { once: true });
    reel.muted = true;
    reel.playsInline = true;
    var p = reel.play();
    if (p && p.catch) p.catch(done);
    w.setTimeout(function () {
      if (phase === PHASE.REEL) done();
    }, REEL_CAP_MS);
  }

  function start() {
    if (reduced() || wantSkip() || (seen() && !wantBoot())) {
      return setPhase(PHASE.BASE);
    }
    setPhase(PHASE.SPLASH);
    var splash = w.document && document.getElementById("boot-splash");
    if (splash) splash.hidden = false;
    w.setTimeout(function () {
      if (phase !== PHASE.SPLASH) return;
      var reel = w.document && document.getElementById("boot-reel");
      if (reel && reel.getAttribute("src")) playReel();
      else setPhase(PHASE.BASE);
    }, SPLASH_MS);
  }

  function skip() { setPhase(PHASE.BASE); }

  if (w.document) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (!t) return;
      if (t.id === "boot-skip" || (t.closest && t.closest("#boot-skip"))) skip();
      if (t.id === "boot-enter" || (t.closest && t.closest("#boot-enter"))) {
        if (phase === PHASE.SPLASH) playReel();
        else skip();
      }
    });
  }

  w.IrisBoot = {
    version: VERSION,
    PHASE: PHASE,
    phase: function () { return phase; },
    skip: skip,
    start: start,
    playReel: playReel
  };
})(window);
