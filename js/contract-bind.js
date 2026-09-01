/**
 * Contract bind jacket — fail-closed.
 * Law: ED-GOV-20260901-DCLM-L0-MASTER-V2
 * BIND: data stays on the device. Simulation is not treatment.
 * Silence is HOLE not zero. No password file. No seed phrase.
 * Current as of: 2026-09-01
 */
(function (g) {
  var VERSION = "contract-bind-v1-20260901";
  var STORE = "dc.contract.bind.v1";
  var USED = "dc.contract.nullifiers.v1";
  var TERMS =
    "Your books stay on this device. Dualis does not take the file. " +
    "A targeted seat is not a signed deal. Prepaid time is prepaid time. " +
    "If the figure cannot be inverted, nothing is owed. " +
    "The eight-word phrase and the passkey never leave this device. " +
    "Crown wet-ink is the only wet-ink. Ack is a second bind.";

  function hex(buf) {
    return Array.from(new Uint8Array(buf)).map(function (b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
  }

  async function sha256(text) {
    var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(text || "")));
    return hex(buf);
  }

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
    return val;
  }

  function usedMap() {
    var row = readJSON(USED, {});
    return row && typeof row === "object" ? row : {};
  }

  function hasVault() {
    try {
      return !!(g.DCVault && DCVault.hasVault && DCVault.hasVault());
    } catch (e) {
      return false;
    }
  }

  function fuelOn() {
    try {
      if (g.DCFuel && typeof DCFuel.balance === "function") return Number(DCFuel.balance()) > 0;
    } catch (e) {}
    try {
      var row = readJSON("dc.onboard.v7", null) || readJSON("dc.onboard.v6", null);
      return !!(row && row.treasury);
    } catch (e) {}
    return false;
  }

  function onboardRow() {
    if (g.DCOnboard && DCOnboard.load) return DCOnboard.load() || {};
    return readJSON("dc.onboard.v7", {}) || {};
  }

  function layersNow() {
    var row = onboardRow();
    var L3 = !!(row.passkey || hasVault());
    return {
      L1: { name: "Statutory name", ok: !!(row.hasName || row.hash), fail: "FAIL_CLOSED_REGISTRY_UNVERIFIED" },
      L2: { name: "Wire proof", ok: !!row.hasDomain, fail: "FAIL_CLOSED_WIRE_SPOOF" },
      L3: { name: "Device enclave", ok: L3, fail: "FAIL_CLOSED_ENCLAVE_ABSENT" },
      L4: { name: "Treasury", ok: fuelOn() || !!row.treasury, fail: "FAIL_CLOSED_TREASURY_MISMATCH" },
      L5: { name: "Merkle seal", ok: row.state === "HASH_SEALED" && !!row.seal, fail: "FAIL_CLOSED_MERKLE_REJECT" }
    };
  }

  function missing(need) {
    var st = layersNow();
    var holes = [];
    for (var i = 0; i < need.length; i++) {
      var id = need[i];
      if (!st[id] || !st[id].ok) holes.push({ layer: id, reason: st[id] ? st[id].fail : "HOLE" });
    }
    return holes;
  }

  async function termsHash() {
    return sha256(TERMS);
  }

  async function bind(opt) {
    opt = opt || {};
    var holes = missing(["L3"]);
    if (holes.length) {
      return { ok: false, state: "HOLE", holes: holes, law: "TRUTH_OR_NOTHING" };
    }
    var row = onboardRow();
    var terms = await termsHash();
    var device = (row.passkey_id || (hasVault() ? "vault" : "none")) + "|" + (row.hash || "none");
    var nullifier = await sha256([terms, device, row.seat || "visitor", Date.now().toString()].join("|"));
    var rec = {
      v: VERSION,
      at: new Date().toISOString(),
      seat: row.seat || opt.seat || "visitor",
      terms_hash: terms,
      contract_nullifier: nullifier,
      device_class: row.passkey ? "webauthn" : "vault",
      books_local: !!readJSON("dc.books.local", null),
      state: "BOUND_LOCAL",
      law: ["NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING"],
      note: "Hashes only. Phrase never stored. Targeted is not signed."
    };
    writeJSON(STORE, rec);
    if (g.DCAudit && DCAudit.commit) {
      DCAudit.commit({ type: "contract.bind", terms_hash: terms, nullifier: nullifier, seat: rec.seat });
    }
    return { ok: true, record: rec };
  }

  function current() {
    return readJSON(STORE, null);
  }

  async function settle(sku, sessionId) {
    var rec = current();
    if (!rec || !rec.contract_nullifier) {
      return { ok: false, state: "HOLE", reason: "FAIL_CLOSED_ENCLAVE_ABSENT" };
    }
    var used = usedMap();
    if (used[rec.contract_nullifier]) {
      return { ok: false, state: "HOLE", reason: "FAIL_CLOSED_NULLIFIER_REPLAY" };
    }
    var seatLike = /^(leaf|branch|trunk|library|edu_leaf)$/.test(String(sku || ""));
    if (seatLike && missing(["L4"]).length) {
      return { ok: false, state: "HOLE", reason: "FAIL_CLOSED_TREASURY_MISMATCH", hold: true };
    }
    rec.sku = sku || rec.sku || null;
    rec.session_id = sessionId || rec.session_id || null;
    rec.state = seatLike && !fuelOn() ? "HELD" : "SETTLED";
    rec.settled_at = new Date().toISOString();
    writeJSON(STORE, rec);
    return { ok: true, record: rec, metadata: { sku: rec.sku, contract_nullifier: rec.contract_nullifier } };
  }

  function consume(nullifier) {
    var n = String(nullifier || "");
    if (!n) return { ok: false, reason: "HOLE" };
    var used = usedMap();
    if (used[n]) return { ok: false, reason: "FAIL_CLOSED_NULLIFIER_REPLAY" };
    used[n] = { at: new Date().toISOString() };
    writeJSON(USED, used);
    var rec = current();
    if (rec && rec.contract_nullifier === n) {
      rec.state = "CONSUMED";
      rec.consumed_at = new Date().toISOString();
      writeJSON(STORE, rec);
    }
    return { ok: true };
  }

  function cleanup() {
    try { if (g.DCVault && DCVault.lock) DCVault.lock(); } catch (e) {}
    try { sessionStorage.removeItem("dc.portal.open"); } catch (e) {}
    return { ok: true, wiped: "session" };
  }

  function publicView() {
    var rec = current();
    if (!rec) return { bound: false, layers: layersNow() };
    return {
      bound: true,
      v: rec.v,
      state: rec.state,
      seat: rec.seat,
      terms_hash: rec.terms_hash,
      contract_nullifier: rec.contract_nullifier,
      device_class: rec.device_class,
      layers: layersNow()
    };
  }

  g.DCContract = {
    version: VERSION,
    TERMS: TERMS,
    termsHash: termsHash,
    layers: layersNow,
    missing: missing,
    bind: bind,
    current: current,
    settle: settle,
    consume: consume,
    cleanup: cleanup,
    publicView: publicView
  };
})(typeof window !== "undefined" ? window : globalThis);
