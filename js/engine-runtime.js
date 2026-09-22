/**
 * EngineRuntime. What this origin can actually run in a browser.
 * Symplectic Euler on H = (q^2 + p^2) / 2.
 * Not FPGA. Not optical. Not a mind. Checkout stays closed.
 */
(function (w) {
  var VERSION = "engine-runtime-2026-09-22";
  var LANDAUER_MS = 4.20;
  var state = {
    q: 1, p: 0, dt: 0.016, t: 0,
    H0: 0.5, H: 0.5, residual: 0,
    lastMs: 0, tripped: false, reason: "",
    running: false
  };
  var raf = 0;
  var ears = [];

  function Hqp(q, p) { return 0.5 * (q * q + p * p); }

  function reset(q, p) {
    state.q = typeof q === "number" ? q : 1;
    state.p = typeof p === "number" ? p : 0;
    state.t = 0;
    state.H0 = Hqp(state.q, state.p);
    state.H = state.H0;
    state.residual = 0;
    state.tripped = false;
    state.reason = "";
    return snapshot();
  }

  function step(dt) {
    var t0 = (w.performance && performance.now) ? performance.now() : Date.now();
    dt = typeof dt === "number" ? dt : state.dt;
    if (!isFinite(dt) || dt <= 0 || dt > 0.25) {
      trip("BAD_DT");
      return snapshot();
    }
    var q1 = state.q + dt * state.p;
    var p1 = state.p - dt * q1;
    if (!isFinite(q1) || !isFinite(p1)) {
      trip("NAN");
      return snapshot();
    }
    state.q = q1;
    state.p = p1;
    state.t += 1;
    state.H = Hqp(state.q, state.p);
    state.residual = Math.abs(state.H - state.H0);
    var t1 = (w.performance && performance.now) ? performance.now() : Date.now();
    state.lastMs = t1 - t0;
    if (state.lastMs > LANDAUER_MS) trip("LATENCY");
    if (w.CosmicFactory && CosmicFactory.tick) {
      try { CosmicFactory.tick("step", { energy: Math.min(1, state.residual * 1e6 + 0.12), t: state.t }); } catch (e) {}
    }
    emit();
    return snapshot();
  }

  function trip(why) {
    state.tripped = true;
    state.reason = why;
    state.running = false;
    if (raf) { w.cancelAnimationFrame(raf); raf = 0; }
    emit();
  }

  function snapshot() {
    return {
      version: VERSION,
      q: state.q, p: state.p, t: state.t, dt: state.dt,
      H: state.H, H0: state.H0, residual: state.residual,
      lastMs: state.lastMs, tripped: state.tripped, reason: state.reason,
      running: state.running,
      law: ["NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING"],
      not: ["FPGA", "optical", "clinic", "checkout", "mind"]
    };
  }

  function emit() {
    for (var i = 0; i < ears.length; i++) {
      try { ears[i](snapshot()); } catch (e) {}
    }
  }

  function listen(fn) { if (typeof fn === "function") ears.push(fn); }

  function loop() {
    if (!state.running) return;
    step(state.dt);
    raf = w.requestAnimationFrame(loop);
  }

  function start() {
    if (state.tripped) reset();
    state.running = true;
    if (!raf) raf = w.requestAnimationFrame(loop);
    return snapshot();
  }

  function stop() {
    state.running = false;
    if (raf) { w.cancelAnimationFrame(raf); raf = 0; }
    return snapshot();
  }

  function injectLatency() {
    var t0 = (w.performance && performance.now) ? performance.now() : Date.now();
    var n = 0;
    while (((w.performance && performance.now) ? performance.now() : Date.now()) - t0 < 6) n++;
    state.lastMs = 6;
    trip("LATENCY");
    return snapshot();
  }

  reset();
  w.EngineRuntime = {
    version: VERSION,
    reset: reset,
    step: step,
    start: start,
    stop: stop,
    snapshot: snapshot,
    listen: listen,
    injectLatency: injectLatency,
    trip: trip
  };
})(window);
