/**
 * Cosmic Factory bus. S_t --T,C--> S_{t+1}
 * Thin receipt layer. Does not invent a second lander.
 */
(function (w) {
  var VERSION = "cosmic-factory-2026-09-22";
  var C = Object.freeze({
    NO_FORCE: true,
    HOST_SAFE: true,
    CLEANUP_FIRST: true,
    TRUTH_OR_NOTHING: true,
    SINGLE_FACE: true,
    CHECKOUT_CLOSED: true
  });
  var S = {
    t: 0,
    woken: false,
    iris: "dark",
    dsap: "asleep",
    beat: "01",
    sha: "",
    at: 0
  };
  var receipts = [];

  function now() {
    return (w.performance && performance.now) ? performance.now() : Date.now();
  }

  function snapshot() {
    return {
      t: S.t,
      woken: S.woken,
      iris: S.iris,
      dsap: S.dsap,
      beat: S.beat,
      q: w.IrisSphere && IrisSphere.pose ? IrisSphere.pose() : null,
      wave: !!(w.DSAP && DSAP.wave && DSAP.wave()),
      at: S.at
    };
  }

  function allowed(T) {
    if (C.NO_FORCE && T === "autoplay") return false;
    if (C.CHECKOUT_CLOSED && T === "checkout-open") return false;
    if (C.SINGLE_FACE && T === "second-lander") return false;
    return true;
  }

  function tick(T, extra) {
    if (!allowed(T)) {
      return { ok: false, reason: "constraint", T: T, C: C };
    }
    var before = snapshot();
    S.t += 1;
    S.at = now();
    if (T === "wake") {
      S.woken = true;
      S.dsap = "live";
      S.iris = "live";
    } else if (T === "speak") {
      S.iris = "speak";
    } else if (T === "hear") {
      S.iris = "hear";
    } else if (T === "beat" && extra && extra.beat) {
      S.beat = extra.beat;
    }
    var after = snapshot();
    var rec = { n: S.t, T: T, before: before, after: after, extra: extra || null };
    receipts.push(rec);
    if (receipts.length > 32) receipts.shift();
    w.dispatchEvent(new CustomEvent("dc:factory", { detail: rec }));
    return rec;
  }

  function state() {
    return snapshot();
  }

  w.CosmicFactory = {
    version: VERSION,
    C: C,
    tick: tick,
    state: state,
    receipts: function () { return receipts.slice(); }
  };
})(window);
