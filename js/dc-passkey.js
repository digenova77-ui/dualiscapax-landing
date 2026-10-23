(function () {
  "use strict";
  const unavailable = async () => ({ ok: false, available: false, reason: "passkey-verifier-not-configured" });
  window.DC_Passkey = Object.freeze({
    available: false,
    status: "unconfigured",
    verify: unavailable,
    enroll: unavailable,
    note: "No credential was created, verified, or stored by this placeholder contract."
  });
})();
