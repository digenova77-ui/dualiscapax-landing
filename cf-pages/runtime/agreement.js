/**
 * Dualis agreement bind.
 * Local smart-contract receipt. Public chain write is WAIT_GRANT.
 * Operators never receive books. Models may compute after bind.
 */
(function (root) {
  var VERSION = "agreement-2026-09-01";
  var KEY = "dc.runtime.agreement.v1";
  var TERMS = [
    "INVITE_ONLY",
    "BOOKS_STAY",
    "OPERATORS_BLIND",
    "MODELS_MAY_COMPUTE",
    "SILENCE_IS_HOLE",
    "NO_NEW_PASSWORD",
    "NO_SIGNED_PARTNER_CLAIM"
  ];

  function now() {
    return new Date().toISOString();
  }

  function hole(reason) {
    return {
      id: "HOLE",
      year: String(now()).slice(0, 4),
      source: "agreement",
      stamp: now(),
      status: "HOLE",
      hash: "",
      reason: reason || "HOLE_NOT_ZERO",
      scientific_validation: false,
      chain: "WAIT_GRANT"
    };
  }

  function hex(buf) {
    return Array.from(new Uint8Array(buf)).map(function (b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
  }

  function sha256(text) {
    var enc = new TextEncoder().encode(String(text || ""));
    if (typeof crypto !== "undefined" && crypto.subtle) {
      return crypto.subtle.digest("SHA-256", enc).then(hex);
    }
    return Promise.resolve("");
  }

  function load() {
    try {
      if (typeof localStorage === "undefined") return null;
      return JSON.parse(localStorage.getItem(KEY) || "null");
    } catch (e) {
      return null;
    }
  }

  function save(row) {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(KEY, JSON.stringify(row));
    }
    return row;
  }

  function termsText() {
    return TERMS.join("|");
  }

  async function bind(input) {
    input = input || {};
    if (!input.invite) return hole("NO_INVITE");
    if (input.books && input.books.raw) return hole("RAW_BOOKS_REFUSED");
    var booksHash = String(input.booksHash || "");
    if (!booksHash) return hole("NO_BOOKS_HASH");
    var agreementHash = await sha256(termsText());
    var stamp = now();
    var body = [
      VERSION,
      agreementHash,
      booksHash,
      input.host || "unknown",
      stamp
    ].join("|");
    var hash = await sha256(body);
    var row = {
      id: "AGR-" + hash.slice(0, 12).toUpperCase(),
      year: stamp.slice(0, 4),
      source: input.source || "device",
      stamp: stamp,
      status: "BOUND",
      hash: hash,
      agreement_hash: agreementHash,
      books_hash: booksHash,
      host: input.host || "unknown",
      terms: TERMS.slice(),
      operators_see: false,
      models_may_compute: true,
      raw_payload: false,
      chain: "WAIT_GRANT",
      scientific_validation: false,
      v: VERSION
    };
    return save(row);
  }

  function receipt(row) {
    if (!row || row.status !== "BOUND") return hole((row && row.reason) || "NO_BIND");
    return {
      id: row.id,
      year: row.year,
      source: row.source,
      stamp: row.stamp,
      status: row.status,
      hash: row.hash,
      agreement_hash: row.agreement_hash,
      books_hash: row.books_hash,
      host: row.host,
      operators_see: false,
      models_may_compute: true,
      chain: row.chain,
      scientific_validation: false
    };
  }

  function clear() {
    if (typeof localStorage !== "undefined") localStorage.removeItem(KEY);
  }

  var api = {
    version: VERSION,
    law: "DATA_STAYS_BIND_SEES_OPERATORS_BLIND",
    terms: TERMS,
    bind: bind,
    load: load,
    receipt: receipt,
    clear: clear,
    hole: hole
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.DCAgreement = api;
})(typeof window !== "undefined" ? window : globalThis);
