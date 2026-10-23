(function () {
  "use strict";
  function initialize() {
    const seat = document.getElementById("seatChip");
    const dev = document.getElementById("iceDevFlag");
    const gate = document.getElementById("icePassGate");
    const message = document.getElementById("icePassMsg");
    const unlock = document.getElementById("btnIceUnlock");
    const makeKey = document.getElementById("btnIceMakeKey");
    if (dev) {
      dev.disabled = true;
      dev.title = "Development bypass is intentionally unavailable.";
      dev.setAttribute("aria-disabled", "true");
    }
    if (unlock) {
      unlock.disabled = true;
      unlock.textContent = "Passkey unavailable";
    }
    if (makeKey) {
      makeKey.disabled = true;
      makeKey.hidden = false;
      makeKey.textContent = "Enrollment unavailable";
    }
    if (message) message.textContent = "Passkey verification is not connected. No seat or identity has been claimed.";
    if (seat) {
      seat.textContent = "Seat unavailable";
      seat.addEventListener("click", () => {
        if (gate) gate.hidden = false;
        if (message) message.textContent = "Closed by default: the passkey verifier and TeamSnap adapter are not configured. No bypass is available.";
      });
    }
    document.querySelectorAll("[data-ice-protected-action]").forEach((control) => {
      control.disabled = true;
      control.setAttribute("aria-disabled", "true");
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
