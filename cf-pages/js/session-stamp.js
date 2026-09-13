/** Preemptive local session — one click, no server required. */
(function (g) {
  var KEY = 'dc_session_v1';

  function uuid() {
    if (g.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'dc-' + Date.now().toString(16) + '-' + Math.random().toString(16).slice(2);
  }

  g.DCSession = {
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
        id: (prev && prev.id) || uuid(),
        at: new Date().toISOString(),
        v: 1,
      };
      try {
        localStorage.setItem(KEY, JSON.stringify(s));
      } catch (e) {}
      g.DC_SESSION = s.id;
      return s;
    },
    id: function () {
      var s = this.read();
      return s ? s.id : null;
    },
  };

  var existing = g.DCSession.read();
  if (existing) g.DC_SESSION = existing.id;
})(typeof window !== 'undefined' ? window : globalThis);
