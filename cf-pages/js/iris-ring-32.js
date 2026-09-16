/**
 * 32 angles on the same taught time. Not 32 minds.
 */
(function (w) {
  var ANGLES = [
    "Smash the leftover sky first.",
    "Clerk: no swing unless this blow is closer.",
    "Center-out: the bang is still expanding.",
    "Flight-back: name this photon.",
    "Yin: aimed and slow.",
    "Yang: the room can have a chest.",
    "L0 stays dense. Do not diet the floor.",
    "Friction until this hole closes.",
    "Fold this phone. Last row plus change.",
    "Seed fence is policy, not a CI.",
    "Book kills the fence.",
    "Missing plate is a hole. Keep the work.",
    "Speak the flatten. An id is not a name.",
    "Five under OHF. No invented roster.",
    "Stadium sleeve. Same Iris.",
    "Invoke on tap. Not on load.",
    "They measured the shift. Dualis read it.",
    "Against X only if X is stored.",
    "Availability is not in this notebook.",
    "One wake. Twins. Wave is the room.",
    "V2 or hole. No second brain.",
    "Look is free. Paid is closed until Stripe lives.",
    "SKU-029 is an atlas.",
    "Factory shelf is names. No Drive dump.",
    "Apex lag is a clock.",
    "Thirty-two kitchens. One species.",
    "Next smash depends on this one.",
    "Two poles or not Dualis.",
    "Simulation is not treatment.",
    "Missing route is a hole.",
    "No force. First gesture.",
    "Answer the last mouth."
  ];
  function at(i) {
    var n = ((i % 32) + 32) % 32;
    return ANGLES[n];
  }
  function all() {
    return ANGLES.join(" ");
  }
  function now() {
    return ANGLES[Math.floor(Date.now() / 1000) % 32];
  }
  w.IrisRing32 = { at: at, all: all, now: now, n: 32 };
})(typeof window !== "undefined" ? window : globalThis);
