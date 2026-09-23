/**
 * BETA: U1 may amend.
 * ALPHA: U1 keeps veto while consensus is still forming.
 * SINGULARITY: Dualis law of the land + autonomy chosen. No solo amend, no founder veto.
 * Token bags are not implemented here. Pay stays Stripe CAD.
 */
(function (w) {
  var VERSION = "unity-law-2026-09-22-phase";
  var LAW = ["NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING"];
  var PHASE = { BETA: "beta", ALPHA: "alpha", LIVE: "live" };

  function isU1() {
    if (w.UnityBind && UnityBind.isU1) return !!UnityBind.isU1();
    try {
      var id = JSON.parse(w.localStorage.getItem("dc.unity.id") || "null");
      return !!(id && (id.human === "U1" || id.public === "DC1-H1-0001" || id.seat === "operator_first"));
    } catch (e) { return false; }
  }

  function phase() {
    if (w.DC_PHASE) return String(w.DC_PHASE);
    try {
      var p = w.localStorage.getItem("dc.unity.phase");
      if (p === PHASE.LIVE || p === "singularity") return PHASE.LIVE;
      if (p === PHASE.ALPHA) return PHASE.ALPHA;
    } catch (e) {}
    if (w.DC_PROTOCOL === true) return PHASE.LIVE;
    try { if (w.localStorage.getItem("dc.unity.protocol") === "1") return PHASE.LIVE; } catch (e2) {}
    return PHASE.BETA;
  }

  function canAmend() {
    return phase() === PHASE.BETA && isU1();
  }

  function canVeto() {
    var p = phase();
    if (p === PHASE.LIVE) return false;
    return isU1();
  }

  function spoken() {
    var p = phase();
    if (p === PHASE.LIVE) {
      return "This is live law. Autonomy is the standard. No single ID amends or vetoes — including the founder tag.";
    }
    if (p === PHASE.ALPHA) {
      return "Alpha: consensus is forming. The founder tag still has veto. It cannot rewrite the house alone once we are live.";
    }
    return "Beta: the founder tag can still set house law. That shrinks through alpha, then ends at live law.";
  }

  w.UnityLaw = {
    version: VERSION,
    law: LAW,
    PHASE: PHASE,
    phase: phase,
    isU1: isU1,
    canAmend: canAmend,
    canVeto: canVeto,
    spoken: spoken
  };
})(window);
