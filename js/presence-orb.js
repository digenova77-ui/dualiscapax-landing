/** Presence as a glowing orb. Twig on presence wave. Does not delete the wave. */
(function (w) {
  var VERSION = "presence-orb-2026-09-01";

  function mount() {
    if (w.IrisHolo && IrisHolo.setForm) IrisHolo.setForm("orb");
    return VERSION;
  }

  w.DCOrb = {
    version: VERSION,
    law: "PRESENCE_ORB",
    mount: mount
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})(typeof window !== "undefined" ? window : globalThis);
