/**
 * Real-time crypto audit ledger — client-side SHA-256 receipts.
 * Parent-chained. Anytime. No appointment.
 * Current as of: 2026-08-30
 */
(function (g) {
  var KEY = 'dc_audit_chain_v1';

  function uuid() {
    if (g.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'aud-' + Date.now().toString(16) + '-' + Math.random().toString(16).slice(2);
  }

  function toHex(buf) {
    return Array.from(new Uint8Array(buf))
      .map(function (b) {
        return b.toString(16).padStart(2, '0');
      })
      .join('');
  }

  async function sha256(text) {
    if (g.crypto && crypto.subtle) {
      var data = new TextEncoder().encode(text);
      var dig = await crypto.subtle.digest('SHA-256', data);
      return toHex(dig);
    }
    // Fallback: not cryptographic strength — label as weak
    var h = 0;
    for (var i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
    return 'weak_' + (h >>> 0).toString(16).padStart(8, '0') + '_' + text.length.toString(16);
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function save(chain) {
    try {
      localStorage.setItem(KEY, JSON.stringify(chain.slice(-200)));
    } catch (e) {}
  }

  g.DCAudit = {
    chain: load,

    tip: function () {
      var c = load();
      return c.length ? c[c.length - 1] : null;
    },

    /** Append a measure/audit receipt. payload is plain object. */
    commit: async function (payload) {
      var parent = this.tip();
      var body = {
        id: uuid(),
        at: new Date().toISOString(),
        session: (g.DCSession && DCSession.id()) || null,
        parent: parent ? parent.receipt : null,
        payload: payload || {},
      };
      var canonical = JSON.stringify(body, Object.keys(body).sort());
      var receipt = await sha256(canonical);
      var entry = {
        id: body.id,
        at: body.at,
        session: body.session,
        parent: body.parent,
        receipt: receipt,
        payload: body.payload,
        algo: receipt.indexOf('weak_') === 0 ? 'weak-fallback' : 'SHA-256',
      };
      var chain = load();
      chain.push(entry);
      save(chain);
      return entry;
    },

    verifyTip: async function () {
      var tip = this.tip();
      if (!tip) return { ok: false, reason: 'empty' };
      var body = {
        id: tip.id,
        at: tip.at,
        session: tip.session,
        parent: tip.parent,
        payload: tip.payload,
      };
      var canonical = JSON.stringify(body, Object.keys(body).sort());
      var again = await sha256(canonical);
      return {
        ok: again === tip.receipt,
        receipt: tip.receipt,
        recomputed: again,
        algo: tip.algo,
      };
    },

    clear: function () {
      try {
        localStorage.removeItem(KEY);
      } catch (e) {}
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
