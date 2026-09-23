/**
 * BETA: U1 may amend published Unity law while the house is still forming.
 * PROTOCOL LIVE (coin architecture / autonomous company): no ID amends alone.
 * Not a till. Pay stays Stripe CAD until that protocol actually exists.
 */
(function (w) {
  var VERSION = "unity-law-2026-09-22-beta";
  var LAW = ["NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING"];

  function isU1() {
    if (w.UnityBind && UnityBind.isU1) return !!UnityBind.isU1();
    try {
      var id = JSON.parse(w.localStorage.getItem("dc.unity.id") || "null");
      return !!(id && (id.human === "U1" || id.public === "DC1-H1-0001" || id.seat === "operator_first"));
    } catch (e) { return false; }
  }

  function isProtocolLive() {
    if (w.DC_PROTOCOL === true) return true;
    try { return w.localStorage.getItem("dc.unity.protocol") === "1"; } catch (e) { return false; }
  }

  function isBeta() {
    return !isProtocolLive();
  }

  function canAmend() {
    if (isProtocolLive()) return false;
    return isU1();
  }

  function spoken() {
    if (isProtocolLive()) {
      return "Protocol is live. Unity law doesn't move on one ID — including the founder tag. A core change needs consensus.";
    }
    return "Beta: the founder tag can still set house law. That ends when the protocol is live.";
  }

  w.UnityLaw = {
    version: VERSION,
    law: LAW,
    isU1: isU1,
    isBeta: isBeta,
    isProtocolLive: isProtocolLive,
    canAmend: canAmend,
    spoken: spoken
  };
})(window);
