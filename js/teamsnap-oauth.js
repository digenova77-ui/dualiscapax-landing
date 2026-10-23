(function () {
  "use strict";
  const unavailable = async () => ({ ok: false, available: false, reason: "teamsnap-provider-not-configured" });
  window.DC_TeamSnap = Object.freeze({
    available: false,
    status: "unconfigured",
    beginAuthorization: unavailable,
    getRoster: unavailable,
    getSchedule: unavailable,
    note: "No OAuth redirect, token exchange, roster request, or schedule request is performed."
  });
})();
