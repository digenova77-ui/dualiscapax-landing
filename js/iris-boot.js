/**
 * One boot. Splash → optional reel → mission base.
 * Not four pages glued. Missions are realm packs.
 */
(function (w) {
  var VERSION = "iris-boot-2026-09-22";
  var PHASE = { SPLASH: "splash", REEL: "reel", BASE: "base" };
  var phase = PHASE.SPLASH;
  var KEY = "dc.boot.v1";

  function reduced() {
    return !!(w.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function seen() {
    try { return w.localStorage.getItem(KEY) === "1"; } catch (e) { return false; }
  }

  function mark() {
    try { w.localStorage.setItem(KEY, "1"); } catch (e) {}
  }

  function missions() {
    var out = [];
    var R = (w.IrisRealm && IrisRealm.realms) || {};
    var order = ["house", "rink", "clinic", "lab", "desk", "court"];
    for (var i = 0; i < order.length; i++) {
      var p = R[order[i]];
      if (p) out.push({
        id: p.id,
        label: p.room || p.id,
        spoken: p.spoken,
        href: (p.menu && p.menu[0] && p.menu[0].href) || "/rte?realm=" + p.id
      });
    }
    return out;
  }

  function setPhase(next) {
    phase = next;
    var root = w.document && document.documentElement;
    if (root) root.setAttribute("data-boot", next);
    if (next === PHASE.BASE) {
      mark();
      if (w.IrisRTE && IrisRTE.attach) {
        try { IrisRTE.attach("#rte") || IrisRTE.attach("body"); } catch (e) {}
      }
      if (w.IrisAV && IrisAV.speak && w.IrisPage && IrisPage.here) {
        try { IrisAV.speak(IrisPage.here().spoken); } catch (e2) {}
      }
    }
    return phase;
  }

  function start() {
    if (reduced() || seen() || /[?&]skip=1/.test(String(location.search || ""))) {
      return setPhase(PHASE.BASE);
    }
    setPhase(PHASE.SPLASH);
    var splashMs = 1400;
    w.setTimeout(function () {
      var reel = w.document && document.querySelector("#boot-reel");
      if (reel && reel.play) {
        setPhase(PHASE.REEL);
        var done = function () { setPhase(PHASE.BASE); };
        reel.addEventListener("ended", done, { once: true });
        reel.play().catch(done);
        w.setTimeout(done, 28000);
      } else {
        setPhase(PHASE.BASE);
      }
    }, splashMs);
  }

  function skip() { setPhase(PHASE.BASE); }

  if (w.document) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
  }

  w.IrisBoot = {
    version: VERSION,
    PHASE: PHASE,
    phase: function () { return phase; },
    missions: missions,
    skip: skip,
    start: start
  };
})(window);
