/** Iris → engine. One step + residual. Not a universe. */
(function (w) {
  function line() {
    var rec = null;
    if (w.EngineRuntime && EngineRuntime.step) rec = EngineRuntime.step(0.016);
    else if (w.CosmicRuntime && CosmicRuntime.step) rec = CosmicRuntime.step(1, 0, 0.001);
    if (!rec) {
      return "The engine is a symplectic step in the repo. This page has not loaded the runtime yet.";
    }
    var h = rec.H != null ? rec.H : rec.h;
    var r = rec.residual;
    if (w.CosmicRuntime && CosmicRuntime.seal) {
      try { CosmicRuntime.seal(rec); } catch (e) {}
    }
    var exp = typeof r === "number" ? r.toExponential(2) : String(r);
    return "I just ran one engine step on this phone. Energy about " + Number(h).toFixed(4) + ", residual " + exp + ". Harmonic oscillator. Not a universe computer. The receipt stays with this sitting.";
  }
  function hook() {
    if (!w.IrisRing || !IrisRing.think || IrisRing.__engine) return;
    IrisRing.__engine = true;
    var inner = IrisRing.think;
    IrisRing.think = function (said) {
      var t = String(said || "").toLowerCase();
      if (/\b(engine|compute|kernel|symplectic|dclm|runtime|residual)\b/.test(t)) return line();
      return inner.call(IrisRing, said);
    };
  }
  w.IrisEngineLink = { line: line, hook: hook };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook);
  else hook();
})(window);
