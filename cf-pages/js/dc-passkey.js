/**
 * DualisCapax passkey vault + identity handshake receipts.
 * Passkey = Dualis home door (WebAuthn). Partner OAuth later upgrades receipts.
 * Law: credential never leaves device; Dualis does not store vendor passwords.
 */
(function (w) {
  "use strict";

  var CRED_KEY = "dc.passkey.cred";
  var SESSION_KEY = "dc.passkey.session";
  var PROOF_PFX = "dc.ice.proof.";
  var RP_NAME = "DualisCapax";
  var SESSION_MS = 12 * 60 * 60 * 1000; /* 12h unlock on this device */

  function b64u(buf) {
    var bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
    var s = "";
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function b64uToBuf(str) {
    var s = String(str).replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    var bin = atob(s);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out.buffer;
  }
  function lsGet(k) {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }
  function lsSet(k, v) {
    try { localStorage.setItem(k, v); } catch (e) {}
  }
  function lsJson(k) {
    try {
      var r = lsGet(k);
      return r ? JSON.parse(r) : null;
    } catch (e) { return null; }
  }
  function supported() {
    return !!(w.PublicKeyCredential && navigator.credentials && navigator.credentials.create);
  }
  function rpId() {
    try {
      var h = location.hostname;
      if (!h || h === "localhost" || h === "127.0.0.1") return h || "localhost";
      return h;
    } catch (e) {
      return "localhost";
    }
  }
  function getCred() {
    return lsJson(CRED_KEY);
  }
  function hasPasskey() {
    var c = getCred();
    return !!(c && c.rawId);
  }
  function sessionOk() {
    var s = lsJson(SESSION_KEY);
    if (!s || !s.until) return false;
    return Date.now() < Number(s.until);
  }
  function markSession(meta) {
    lsSet(SESSION_KEY, JSON.stringify({
      until: Date.now() + SESSION_MS,
      at: new Date().toISOString(),
      via: (meta && meta.via) || "webauthn"
    }));
  }
  function clearSession() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
  }
  function saveCredFromCredential(cred, extra) {
    if (!cred || !cred.rawId) return null;
    var row = {
      id: cred.id,
      rawId: b64u(cred.rawId),
      type: cred.type || "public-key",
      rpId: rpId(),
      at: new Date().toISOString()
    };
    if (extra) {
      for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) row[k] = extra[k];
    }
    lsSet(CRED_KEY, JSON.stringify(row));
    markSession({ via: "register" });
    return row;
  }

  async function register(opts) {
    opts = opts || {};
    if (!supported()) return { ok: false, reason: "NO_WEBAUTHN" };
    var challenge = crypto.getRandomValues(new Uint8Array(32));
    var userId = crypto.getRandomValues(new Uint8Array(16));
    try {
      var cred = await navigator.credentials.create({
        publicKey: {
          challenge: challenge,
          rp: { name: RP_NAME, id: rpId() },
          user: {
            id: userId,
            name: opts.name || "unity",
            displayName: opts.displayName || "Dualis Unity"
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 }
          ],
          timeout: 90000,
          authenticatorSelection: {
            userVerification: "required",
            residentKey: "preferred",
            requireResidentKey: false
          },
          attestation: "none"
        }
      });
      var row = saveCredFromCredential(cred, { userName: opts.name || "unity" });
      return { ok: true, cred: row };
    } catch (e) {
      return { ok: false, reason: (e && e.name) || "CANCELLED", error: e };
    }
  }

  async function unlock(opts) {
    opts = opts || {};
    if (!supported()) return { ok: false, reason: "NO_WEBAUTHN" };
    var stored = getCred();
    var challenge = crypto.getRandomValues(new Uint8Array(32));
    var allow = [];
    if (stored && stored.rawId) {
      allow.push({ type: "public-key", id: b64uToBuf(stored.rawId) });
    }
    try {
      var assertion = await navigator.credentials.get({
        publicKey: {
          challenge: challenge,
          rpId: rpId(),
          allowCredentials: allow.length ? allow : undefined,
          userVerification: "required",
          timeout: 90000
        }
      });
      if (!assertion) return { ok: false, reason: "NO_ASSERTION" };
      /* Persist id if discoverable and we had none */
      if (!stored && assertion.rawId) saveCredFromCredential(assertion, {});
      markSession({ via: "unlock" });
      return {
        ok: true,
        assertion: {
          id: assertion.id,
          rawId: b64u(assertion.rawId),
          challenge: b64u(challenge),
          clientDataJSON: assertion.response && assertion.response.clientDataJSON
            ? b64u(assertion.response.clientDataJSON) : null,
          authenticatorData: assertion.response && assertion.response.authenticatorData
            ? b64u(assertion.response.authenticatorData) : null,
          signature: assertion.response && assertion.response.signature
            ? b64u(assertion.response.signature) : null
        }
      };
    } catch (e) {
      return { ok: false, reason: (e && e.name) || "CANCELLED", error: e };
    }
  }

  function identityCritical(vendor) {
    return vendor === "teamsnap" || vendor === "spordle";
  }

  async function sha256hex(str) {
    var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(str)));
    return Array.prototype.map.call(new Uint8Array(buf), function (b) {
      return ("0" + b.toString(16)).slice(-2);
    }).join("");
  }

  /**
   * Handshake: WebAuthn assertion signs a bind challenge.
   * Critical for TeamSnap / Spordle. Soft vendors may skip (attested only).
   */
  async function handshake(vendor, claims) {
    vendor = String(vendor || "");
    claims = claims || {};
    var need = identityCritical(vendor);

    if (need) {
      if (!hasPasskey()) {
        var reg = await register({
          name: (claims && claims.email) || "unity",
          displayName: (claims && claims.display) || "Dualis Unity"
        });
        if (!reg.ok) {
          return { ok: false, reason: reg.reason || "NEED_PASSKEY", needPasskey: true };
        }
        /* register already UV-gated; still ask assertion for bind signature */
      }
      var u = await unlock({ purpose: "handshake:" + vendor });
      if (!u.ok) {
        return { ok: false, reason: u.reason || "UNLOCK_REQUIRED", needPasskey: true };
      }
      return sealReceipt(vendor, claims, u.assertion, "handshake");
    }

    /* Soft vendors (LiveBarn, Hudl): attest OK; handshake if passkey already unlocked */
    if (hasPasskey()) {
      var soft = sessionOk() ? { ok: true, assertion: null } : await unlock({ purpose: "handshake:" + vendor });
      if (soft.ok) {
        return sealReceipt(vendor, claims, soft.assertion || null, soft.assertion ? "handshake" : "attested");
      }
    }
    return sealReceipt(vendor, claims, null, "attested");
  }

  async function sealReceipt(vendor, claims, assertion, how) {
    var seat = null;
    try { seat = JSON.parse(lsGet("dc.ice.seat") || "null"); } catch (e) {}
    var unity = null;
    try { unity = JSON.parse(lsGet("dc.unity.id") || "null"); } catch (e) {}
    var body = {
      schema: "dc.identity.handshake.v1",
      vendor: vendor,
      how: how,
      at: new Date().toISOString(),
      host: location.host,
      seat: seat ? {
        team_slug: seat.team_slug,
        jersey: seat.jersey,
        display: seat.display,
        via: seat.via
      } : null,
      unity_public: unity && unity.public ? unity.public : null,
      claims: claims,
      assertion: assertion ? {
        id: assertion.id,
        challenge: assertion.challenge,
        signature: assertion.signature,
        authenticatorData: assertion.authenticatorData,
        clientDataJSON: assertion.clientDataJSON
      } : null
    };
    body.receipt_hash = await sha256hex(JSON.stringify({
      vendor: body.vendor,
      how: body.how,
      at: body.at,
      seat: body.seat,
      sig: assertion && assertion.signature
    }));
    lsSet(PROOF_PFX + vendor, JSON.stringify(body));
    return { ok: true, receipt: body };
  }

  function getProof(vendor) {
    return lsJson(PROOF_PFX + vendor);
  }

  function clearProof(vendor) {
    try { localStorage.removeItem(PROOF_PFX + vendor); } catch (e) {}
  }

  function requiresIceUnlock() {
    return hasPasskey() && !sessionOk();
  }

  w.DCPasskey = {
    supported: supported,
    hasPasskey: hasPasskey,
    sessionOk: sessionOk,
    requiresIceUnlock: requiresIceUnlock,
    register: register,
    unlock: unlock,
    markSession: markSession,
    clearSession: clearSession,
    saveCredFromCredential: saveCredFromCredential,
    handshake: handshake,
    identityCritical: identityCritical,
    getProof: getProof,
    clearProof: clearProof,
    getCred: getCred
  };
})(window);
