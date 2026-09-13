/**
 * LOOK receipt. Not a coin. Not a share. Not a mint.
 * A look-token is a device-local receipt that you looked.
 * If a chain receipt is ever issued it is this same instrument.
 */
(function (w) {
  var VERSION = "look-receipt-20260901j";
  var KEY = "dc.look.receipts";
  var TERMS =
    "A look-token is a receipt that you looked. It is not a coin. It is not a share. It does not trade. It stays on this device. Onboard remains the goal of the seat you looked at.";

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function save(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list.slice(-24)));
    } catch (e2) {}
  }

  async function digest(text) {
    if (!w.crypto || !crypto.subtle) {
      return "local-" + String(text).length + "-" + Date.now().toString(16);
    }
    var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf))
      .map(function (b) {
        return b.toString(16).padStart(2, "0");
      })
      .join("");
  }

  async function issue(seat) {
    var stamp = new Date().toISOString();
    var body = [TERMS, seat || "look", stamp, location.origin].join("|");
    var hash = await digest(body);
    var slip = {
      kind: "LOOK",
      not: ["coin", "share", "nft-market"],
      seat: seat || "look",
      stamp: stamp,
      hash: hash,
      stays: "this device"
    };
    var list = load();
    list.push(slip);
    save(list);
    return slip;
  }

  function last() {
    var list = load();
    return list[list.length - 1] || null;
  }

  w.DCLookReceipt = {
    version: VERSION,
    terms: TERMS,
    issue: issue,
    last: last,
    all: load
  };
})(typeof window !== "undefined" ? window : globalThis);
