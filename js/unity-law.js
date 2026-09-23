/**
 * Unity framework law is published, not a privilege of U1.
 * DEMO: U1 may test packs. LIVE: U1 cannot flip core procedure alone.
 * Consensus before a change. Not a Dualis coin. Pay stays Stripe CAD.
 */
(function (w) {
  var VERSION = "unity-law-2026-09-22";
  var LAW = ["NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING"];

  function isLive() {
    if (w.DC_LIVE === true) return true;
    try { return w.localStorage.getItem("dc.unity.live") === "1"; } catch (e) { return false; }
  }

  function canAmend() {
    return false;
  }

  function spoken() {
    if (!isLive()) {
      return "Demo: this tag can test rooms. It cannot rewrite Unity law.";
    }
    return "Unity rules don't move on one ID. A core change needs consensus. I don't flip house law from a tag.";
  }

  w.UnityLaw = {
    version: VERSION,
    law: LAW,
    isLive: isLive,
    canAmend: canAmend,
    spoken: spoken
  };
})(window);
