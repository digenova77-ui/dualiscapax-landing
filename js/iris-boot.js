/**
 * Splash → warm geodesic (cache) → base.
 * No 10s empty reel. Sound never starts here.
 */
(function (w) {
  var VERSION = "iris-boot-2026-09-23-warm";
  var PHASE = { SPLASH: "splash", WARM: "warm", BASE: "base" };
  var phase = PHASE.SPLASH;
  var KEY = "dc.boot.v1";
  var SPLASH_MS = 900;

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
      if (w.IrisPreload && IrisPreload.stop) IrisPreload.stop();
      if (w.dispatchEvent) w.dispatchEvent(new CustomEvent("iris:boot", { detail: { phase: next } }));
    }
    return phase;
  }

  function warmThenBase() {
    setPhase(PHASE.WARM);
    if (w.IrisPreload && IrisPreload.warm) {
      return IrisPreload.warm({ capMs: 4000 }).then(function () { setPhase(PHASE.BASE); });
    }
    return setPhase(PHASE.BASE);
  }

  function start() {
    if (reduced() || wantSkip()) return setPhase(PHASE.BASE);
    var boot = w.document && document.getElementById("boot");
    if (!boot) return setPhase(PHASE.BASE);
    if (seen() && !wantBoot()) {
      if (w.IrisPreload && IrisPreload.warm) IrisPreload.warm({ capMs: 900, canvas: null });
      return setPhase(PHASE.BASE);
    }
    setPhase(PHASE.SPLASH);
    var splash = w.document && document.getElementById("boot-splash");
    if (splash) splash.hidden = false;
    w.setTimeout(function () { if (phase !== PHASE.SPLASH) return; warmThenBase(); }, SPLASH_MS);
  }

  function skip() { setPhase(PHASE.BASE); }

  if (w.document) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
    document.addEventListener("click", function (e) {
      var t = e.target; if (!t) return;
      if (t.id === "boot-skip" || (t.closest && t.closest("#boot-skip"))) skip();
      if (t.id === "boot-enter" || (t.closest && t.closest("#boot-enter"))) skip();
    });
  }

  w.IrisBoot = { version: VERSION, PHASE: PHASE, phase: function () { return phase; }, skip: skip, start: start };
})(window);
