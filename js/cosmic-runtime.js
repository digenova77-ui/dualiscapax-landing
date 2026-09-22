/**
 * Browser symplectic stepper.
 * Port of 01_CORE__dclm_singularity_kernel.evaluate_state_manifold.
 * This is a harmonic oscillator step + receipt. Not a universe computer.
 */
(function (w) {
  var VERSION = "cosmic-runtime-2026-09-22";
  var C = Object.freeze({
    NO_FORCE: true,
    HOST_SAFE: true,
    CLEANUP_FIRST: true,
    TRUTH_OR_NOTHING: true,
    CHECKOUT_CLOSED: true
  });
  var S = { n: 0, q: 1, p: 0, h: 0.5, residual: 0, last: null };

  function hex(buf) {
    var b = new Uint8Array(buf);
    var s = "";
    for (var i = 0; i < b.length; i++) s += (b[i] < 16 ? "0" : "") + b[i].toString(16);
    return s;
  }

  function step(q, p, dt) {
    dt = dt == null ? 0.001 : dt;
    var t0 = (w.performance && performance.now) ? performance.now() : Date.now();
    var h0 = 0.5 * (p * p + q * q);
    var q1 = q + dt * p;
    var p1 = p - dt * q1;
    var h1 = 0.5 * (p1 * p1 + q1 * q1);
    var grad = Math.sqrt((q1 - q) * (q1 - q) + (p1 - p) * (p1 - p)) / Math.max(dt, 1e-12);
    var residual = Math.abs(h1 - h0) * dt;
    var t1 = (w.performance && performance.now) ? performance.now() : Date.now();
    var latency_ms = Math.max(0, t1 - t0);
    var trip = latency_ms >= 29;
    var rec = {
      status: trip ? "FAIL_CLOSED_CIRCUIT_TRIPPED" : "OK",
      n: ++S.n,
      q: q1,
      p: p1,
      h: h1,
      residual: residual,
      det: 1,
      grad: grad,
      route: grad >= 0.6 ? "SYSTEM_2" : "SYSTEM_1",
      latency_ms: latency_ms,
      dt: dt,
      C: C,
      note: "harmonic oscillator step; Jacobian det stated 1; not optical hardware"
    };
    S.q = q1; S.p = p1; S.h = h1; S.residual = residual; S.last = rec;
    if (w.CosmicFactory && CosmicFactory.tick) CosmicFactory.tick("step", { residual: residual, n: S.n });
    return rec;
  }

  function seal(rec) {
    rec = rec || S.last;
    if (!rec) return Promise.resolve({ hex: "", rec: null });
    var payload = JSON.stringify({ q: rec.q, p: rec.p, h: rec.h, det: rec.det });
    if (!w.crypto || !crypto.subtle) {
      rec.receipt = "no-subtle";
      return Promise.resolve({ hex: rec.receipt, rec: rec });
    }
    var bytes = new TextEncoder().encode("dualis.gate.v1|" + payload);
    return crypto.subtle.digest("SHA-256", bytes).then(function (d) {
      rec.receipt = hex(d);
      return { hex: rec.receipt, rec: rec };
    });
  }

  function reset() {
    S.n = 0; S.q = 1; S.p = 0; S.h = 0.5; S.residual = 0; S.last = null;
    return state();
  }

  function state() {
    return { n: S.n, q: S.q, p: S.p, h: S.h, residual: S.residual, last: S.last, C: C, version: VERSION };
  }

  w.CosmicRuntime = {
    version: VERSION,
    C: C,
    step: step,
    seal: seal,
    reset: reset,
    state: state
  };
})(window);
