/**
 * DualisCapax client onboarding — device-local, zero PII.
 * 5-layer identity matrix + 15-minute pipeline + API v2 sleeve.
 * Posts only a salted hash when an API base exists.
 * VERSION onboard-v7-2026-09-01
 */
(function (w) {
  var VERSION = "onboard-v7-2026-09-01";
  var KEY = "dc.onboard.v7";
  var LEGACY = "dc.onboard.v6";

  var SEATS = {
    visitor: { label: "Visitor", line: "Look first. Nothing to buy.", door: "look.html" },
    shop: { label: "Shop", line: "A kitchen, a counter, a floor. Named leftover only.", door: "partners.html" },
    school: { label: "School board", line: "Measure overtime, buses, empty rooms. Bind later.", door: "hpedsb.html" },
    clinic: { label: "Clinic / hospital", line: "Coordination medium. No patient file leaves this device.", door: "qhc.html" },
    city: { label: "City / town", line: "Municipal books. $0 to look.", door: "partners.html" },
    province: { label: "Ontario", line: "Broader public sector. Gain-share after a number holds.", door: "ontario.html" },
    country: { label: "Canada", line: "Federal door. Same law floor.", door: "canada.html" },
    firm: { label: "Firm", line: "Enterprise seat. Deposit credits future work. Not a share.", door: "finance.html" }
  };

  function bytesToHex(buf) {
    return Array.from(new Uint8Array(buf)).map(function (b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
  }

  async function sha256(text) {
    var enc = new TextEncoder().encode(String(text || ""));
    var buf = await crypto.subtle.digest("SHA-256", enc);
    return bytesToHex(buf);
  }

  function load() {
    try {
      var row = JSON.parse(localStorage.getItem(KEY) || "null");
      if (row) return row;
      var old = JSON.parse(localStorage.getItem(LEGACY) || "null");
      if (old) {
        old.v = VERSION;
        save(old);
        return old;
      }
      return null;
    } catch (e) { return null; }
  }

  function save(row) {
    localStorage.setItem(KEY, JSON.stringify(row));
    return row;
  }

  function clear() {
    localStorage.removeItem(KEY);
    localStorage.removeItem(LEGACY);
  }

  function layers() {
    return [
      { id: "L1", name: "Statutory name", hint: "The legal name of the house. We keep a hash, not the name." },
      { id: "L2", name: "Wire proof", hint: "A domain you control. It plugs or it stays a hole. Not optional-maybe." },
      { id: "L3", name: "This device", hint: "Eight-word phrase and optional passkey. No password file." },
      { id: "L4", name: "Treasury", hint: "Stripe, Interac, or crypto — only if you choose Bind." },
      { id: "L5", name: "Seal", hint: "A Merkle hash of this seat. You can copy it. We cannot read you back from it." }
    ];
  }

  function seatFromQuery() {
    try {
      var q = new URLSearchParams(location.search).get("seat");
      if (q && SEATS[q]) return q;
    } catch (e) {}
    return null;
  }

  function hasVault() {
    try {
      if (w.DCVault && DCVault.hasVault) return !!DCVault.hasVault();
      return !!localStorage.getItem("dc_vault_v1");
    } catch (e) { return false; }
  }

  function fuelBalance() {
    try {
      if (w.DCFuel && typeof DCFuel.balance === "function") return Number(DCFuel.balance()) || 0;
    } catch (e) {}
    return 0;
  }

  function layerStatus(row) {
    row = row || load() || {};
    return {
      L1: !!row.hasName || !!row.hash,
      L2: !!row.hasDomain,
      L3: !!row.passkey || hasVault() || row.state === "SIGNED" || row.state === "DISPATCHED" || row.state === "HASH_SEALED",
      L4: fuelBalance() > 0 || !!row.treasury,
      L5: row.state === "HASH_SEALED" && !!row.seal
    };
  }

  async function merkle(parts) {
    var acc = "";
    for (var i = 0; i < parts.length; i++) {
      acc = await sha256(acc + "|" + String(parts[i] || ""));
    }
    return acc;
  }

  async function attest(opt) {
    opt = opt || {};
    var seat = opt.seat || seatFromQuery() || "visitor";
    var name = String(opt.name || "").trim();
    var domain = String(opt.domain || "").trim().toLowerCase();
    if (!SEATS[seat]) seat = "visitor";
    var salt = (w.crypto && crypto.randomUUID) ? crypto.randomUUID() : ("dc-" + Date.now());
    var material = [seat, name, domain, salt, location.host].join("|");
    var hash = await sha256(material);
    var row = {
      v: VERSION,
      seat: seat,
      label: SEATS[seat].label,
      hash: hash,
      hasName: !!name,
      hasDomain: !!domain,
      passkey: false,
      treasury: fuelBalance() > 0,
      ts: new Date().toISOString(),
      state: "PROPOSED",
      law: ["NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING"]
    };
    save(row);
    postRemote(row);
    return row;
  }

  function sign(row) {
    if (!row) row = load();
    if (!row) return null;
    row.state = "SIGNED";
    row.signed_at = new Date().toISOString();
    row.device = hasVault() ? "vault" : "hash";
    return save(row);
  }

  function dispatch(row) {
    if (!row) row = load();
    if (!row) return null;
    if (row.state !== "SIGNED") return row;
    row.state = "DISPATCHED";
    row.dispatched_at = new Date().toISOString();
    return save(row);
  }

  async function seal(row) {
    if (!row) row = load();
    if (!row) return null;
    if (row.state !== "DISPATCHED") return row;
    row.state = "HASH_SEALED";
    row.sealed_at = new Date().toISOString();
    row.seal = await merkle([row.hash, row.signed_at, row.dispatched_at, row.sealed_at, row.seat]);
    save(row);
    postRemote(row);
    return row;
  }

  async function passkey() {
    var row = load();
    if (!row) return { ok: false, reason: "NO_SEAT" };
    if (!w.PublicKeyCredential || !navigator.credentials || !navigator.credentials.create) {
      return { ok: false, reason: "NO_WEBAUTHN" };
    }
    try {
      var challenge = crypto.getRandomValues(new Uint8Array(32));
      var idBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(row.hash));
      var cred = await navigator.credentials.create({
        publicKey: {
          challenge: challenge,
          rp: { name: "DualisCapax", id: location.hostname },
          user: {
            id: new Uint8Array(idBuf).slice(0, 16),
            name: "seat-" + row.seat,
            displayName: row.label
          },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
          timeout: 60000,
          authenticatorSelection: { residentKey: "preferred", userVerification: "preferred" },
          attestation: "none"
        }
      });
      row.passkey = true;
      row.passkey_id = cred && cred.id ? String(cred.id).slice(0, 24) : "ok";
      save(row);
      return { ok: true, row: row };
    } catch (e) {
      return { ok: false, reason: "CANCELLED" };
    }
  }

  function postRemote(row) {
    var base = (w.DC_API_BASE || "https://dualiscapax-depth.digenova77.workers.dev").replace(/\/$/, "");
    if (!base || !row) return;
    var body = {
      api_version: "2",
      type: "onboard.attest",
      seat: row.seat,
      hash: row.hash,
      state: row.state,
      ts: row.ts,
      seal: row.seal || null
    };
    fetch(base + "/v2/onboard/attest", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-DC-Client": "onboard-v7" },
      body: JSON.stringify(body)
    }).catch(function () {});
  }

  w.DCOnboard = {
    version: VERSION,
    seats: SEATS,
    layers: layers,
    layerStatus: layerStatus,
    seatFromQuery: seatFromQuery,
    load: load,
    save: save,
    clear: clear,
    attest: attest,
    sign: sign,
    dispatch: dispatch,
    seal: seal,
    passkey: passkey,
    hasVault: hasVault,
    fuelBalance: fuelBalance
  };
})(window);
