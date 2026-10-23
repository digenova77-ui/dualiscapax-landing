/**
 * Client-side local audit chain.
 * Receipts provide local integrity checks only: they are not signed, remote, or tamper-proof.
 * Version 2 binds recursively canonicalized JSON. Legacy v1 receipts are retained but not trusted.
 */
(function (g) {
  var KEY = "dc_audit_chain_v1";
  var MAX_ENTRIES = 200;
  var storageError = null;

  function uuid() {
    if (g.crypto && typeof g.crypto.randomUUID === "function") return g.crypto.randomUUID();
    return "aud-" + Date.now().toString(16) + "-" + Math.random().toString(16).slice(2);
  }

  function toHex(buf) {
    return Array.from(new Uint8Array(buf)).map(function (b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
  }

  function normalizeJson(value, seen, inArray) {
    if (value === null || typeof value === "string" || typeof value === "boolean") return value;
    if (typeof value === "number") {
      if (!Number.isFinite(value)) throw new TypeError("non-finite-number");
      return value;
    }
    if (value === undefined) {
      if (inArray) throw new TypeError("undefined-array-value");
      return undefined;
    }
    if (typeof value !== "object") throw new TypeError("unsupported-json-value");
    if (seen.indexOf(value) !== -1) throw new TypeError("cyclic-json-value");
    seen.push(value);
    var result;
    if (Array.isArray(value)) {
      result = value.map(function (item) { return normalizeJson(item, seen, true); });
    } else {
      if (Object.prototype.toString.call(value) !== "[object Object]") throw new TypeError("unsupported-json-object");
      result = Object.create(null);
      Object.keys(value).sort().forEach(function (key) {
        if (value[key] === undefined) return;
        result[key] = normalizeJson(value[key], seen, false);
      });
    }
    seen.pop();
    return result;
  }

  function canonicalJson(value) {
    return JSON.stringify(normalizeJson(value, [], false));
  }

  async function sha256(text) {
    if (!g.crypto || !g.crypto.subtle || typeof g.crypto.subtle.digest !== "function") {
      throw new Error("crypto-unavailable");
    }
    var data = new TextEncoder().encode(text);
    var dig = await g.crypto.subtle.digest("SHA-256", data);
    return toHex(dig);
  }

  function load() {
    storageError = null;
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error("audit-storage-not-array");
      return parsed;
    } catch (e) {
      storageError = "audit-storage-unreadable";
      return [];
    }
  }

  function save(chain) {
    try {
      var kept = chain.slice(-MAX_ENTRIES);
      localStorage.setItem(KEY, JSON.stringify(kept));
      var check = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!Array.isArray(check) || !check.length || check[check.length - 1].receipt !== kept[kept.length - 1].receipt) {
        storageError = "audit-storage-write-unconfirmed";
        return false;
      }
      storageError = null;
      return true;
    } catch (e) {
      storageError = "audit-storage-write-failed";
      return false;
    }
  }

  function bodyOf(entry) {
    return {
      version: entry.version,
      id: entry.id,
      at: entry.at,
      session: entry.session,
      parent: entry.parent,
      payload: entry.payload,
    };
  }

  async function verifyChain() {
    var chain = load();
    if (storageError) return { ok: false, reason: storageError };
    if (!chain.length) return { ok: false, reason: "empty" };

    for (var i = 0; i < chain.length; i++) {
      var entry = chain[i];
      if (!entry || entry.version !== 2) {
        return { ok: false, reason: "legacy-receipt-format-unbound-payload", index: i };
      }
      if (entry.algo !== "SHA-256") {
        return { ok: false, reason: "unsupported-receipt-algorithm", index: i };
      }
      if (typeof entry.receipt !== "string" || !/^[a-f0-9]{64}$/.test(entry.receipt)) {
        return { ok: false, reason: "invalid-receipt-hash", index: i };
      }
      if (i > 0 && entry.parent !== chain[i - 1].receipt) {
        return { ok: false, reason: "parent-link-mismatch", index: i };
      }
      var expected;
      try { expected = await sha256(canonicalJson(bodyOf(entry))); }
      catch (e) { return { ok: false, reason: e instanceof Error ? e.message : "verification-error", index: i }; }
      if (expected !== entry.receipt) return { ok: false, reason: "receipt-hash-mismatch", index: i };
    }

    var truncated = !!chain[0].parent;
    return {
      ok: true,
      count: chain.length,
      complete: !truncated,
      truncated: truncated,
      reason: truncated ? "stored-segment-verifies-prefix-truncated" : "stored-chain-verifies",
      receipt: chain[chain.length - 1].receipt,
      algo: "SHA-256",
    };
  }

  g.DCAudit = {
    version: 2,
    canonicalJson: canonicalJson,
    hash: async function (value) { return sha256(String(value)); },
    status: function () { load(); return { ok: !storageError, reason: storageError }; },
    chain: load,

    tip: function () {
      var c = load();
      return c.length ? c[c.length - 1] : null;
    },

    /** Append a v2 receipt. Crypto and durable local storage are mandatory. */
    commit: async function (payload) {
      var chain = load();
      if (storageError) throw new Error(storageError);
      if (chain.length) {
        var existing = await verifyChain();
        if (!existing.ok) throw new Error("existing-audit-chain-invalid:" + existing.reason);
        chain = load();
        if (storageError) throw new Error(storageError);
      }
      var parent = chain.length ? chain[chain.length - 1] : null;
      var body = {
        version: 2,
        id: uuid(),
        at: new Date().toISOString(),
        session: (g.DCSession && typeof g.DCSession.id === "function") ? g.DCSession.id() : null,
        parent: parent ? parent.receipt : null,
        payload: payload || {},
      };
      var receipt = await sha256(canonicalJson(body));
      var entry = {
        version: 2,
        id: body.id,
        at: body.at,
        session: body.session,
        parent: body.parent,
        receipt: receipt,
        payload: body.payload,
        algo: "SHA-256",
      };
      chain.push(entry);
      if (!save(chain)) throw new Error(storageError || "audit-storage-write-unconfirmed");
      return entry;
    },

    verifyChain: verifyChain,

    /** Backward-compatible name; verifies every retained receipt and parent link. */
    verifyTip: async function () {
      var result = await verifyChain();
      var tip = this.tip();
      return Object.assign({}, result, {
        receipt: tip ? tip.receipt : null,
        algo: tip ? tip.algo : result.algo,
      });
    },

    clear: function () {
      try {
        localStorage.removeItem(KEY);
        storageError = null;
        return true;
      } catch (e) {
        storageError = "audit-storage-clear-failed";
        return false;
      }
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
