/** Client correlation stamp — NOT a server session.
 *  CLIENT_CORRELATION_ID != SERVER_AUTHENTICATED_SESSION
 *  localStorage here never establishes authentication, authorization,
 *  Fuel, entitlement, or verification.
 */
(function (g) {
  var KEY = 'dc_session_v1';

  function uuid() {
    if (g.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'dc-' + Date.now().toString(16) + '-' + Math.random().toString(16).slice(2);
  }

  g.DCSession = {
    kind: 'CLIENT_CORRELATION_ID',
    authoritative: false,
    read: function () {
      try {
        var raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },
    stamp: function () {
      var prev = this.read();
      var s = {
        kind: 'CLIENT_CORRELATION_ID',
        authoritative: false,
        authority_effect: 'NONE',
        id: (prev && prev.id) || uuid(),
        at: new Date().toISOString(),
        v: 2,
      };
      try {
        localStorage.setItem(KEY, JSON.stringify(s));
      } catch (e) {}
      g.DC_SESSION = s.id;
      g.DC_SESSION_KIND = 'CLIENT_CORRELATION_ID';
      return s;
    },
    id: function () {
      var s = this.read();
      return s ? s.id : null;
    },
  };

  var existing = g.DCSession.read();
  if (existing) {
    g.DC_SESSION = existing.id;
    g.DC_SESSION_KIND = 'CLIENT_CORRELATION_ID';
  }
})(typeof window !== 'undefined' ? window : globalThis);
