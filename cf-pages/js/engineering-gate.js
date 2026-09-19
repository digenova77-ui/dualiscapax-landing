/**
 * Engineering depth gate — mirrors medical-gate identity line.
 * data-eng-depth="1" pages require grant. Public floor stays open.
 *
 * CLIENT_LOCAL_UI_MARK only — device localStorage unlock for depth UI.
 * NOT SeatLaw. NOT Iris AUTHORIZED. NOT economic authority.
 * ok:true opens depth pages locally; claim_authority stays CLAIM_ONLY.
 * Current as of: 2026-09-19
 */
(function (g) {
  var KEY = 'dc_eng_grant_v1';
  var RANKING = ['SEAL-1', 'SEAL-T1', 'DC-SEAL-1'];

  function domainOk(email) {
    var m = String(email || '').toLowerCase().trim();
    var at = m.lastIndexOf('@');
    if (at < 0) return false;
    var host = m.slice(at + 1);
    if (/\.(edu|org|gov)$/.test(host)) return true;
    if (host.endsWith('.gc.ca') || host === 'gc.ca') return true;
    return false;
  }

  function sealOk(mark) {
    var s = String(mark || '').toUpperCase().trim();
    return RANKING.indexOf(s) >= 0;
  }

  /** Stamp / normalize: never elevate a local UI mark to seat/Iris/economic. */
  function asClientLocalUiMark(gnt) {
    if (!gnt || typeof gnt !== 'object') return gnt;
    gnt.claim_authority = 'CLAIM_ONLY';
    gnt.authority_effect = 'NONE';
    gnt.seat_authority = false;
    gnt.iris_kernel_authorized = false;
    gnt.economic_authority = false;
    gnt.state = 'CLIENT_LOCAL_UI_MARK';
    return gnt;
  }

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      var gnt = raw ? JSON.parse(raw) : null;
      if (gnt && gnt.ok) asClientLocalUiMark(gnt);
      return gnt;
    } catch (e) {
      return null;
    }
  }

  function write(gnt) {
    try {
      localStorage.setItem(KEY, JSON.stringify(gnt));
    } catch (e) {}
  }

  g.DCEngGate = {
    granted: function () {
      var gnt = read();
      return !!(gnt && gnt.ok && gnt.at);
    },
    grant: function (email, seal) {
      if (domainOk(email) || sealOk(seal)) {
        var gnt = asClientLocalUiMark({
          ok: true,
          at: new Date().toISOString(),
          via: domainOk(email) ? 'domain' : 'seal',
        });
        write(gnt);
        return gnt;
      }
      return null;
    },
    clear: function () {
      try {
        localStorage.removeItem(KEY);
      } catch (e) {}
    },
    enforce: function () {
      if (document.documentElement.getAttribute('data-eng-depth') !== '1') return;
      if (this.granted()) return;
      var next = encodeURIComponent(location.pathname + location.search);
      location.replace('/research/engineering/locked.html?next=' + next);
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      g.DCEngGate.enforce();
    });
  } else {
    g.DCEngGate.enforce();
  }
})(typeof window !== 'undefined' ? window : globalThis);
