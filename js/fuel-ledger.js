/**
 * DualisCapax Fuel ledger (client demo + interface for future API)
 * Production debits must happen server-side after payment verification.
 */
(function (global) {
  var KEY = 'dc_fuel_balance_v1';
  var DEFAULT_DEMO = 25; // starter demo credits for beta UX

  function read() {
    try {
      var v = localStorage.getItem(KEY);
      if (v === null || v === '') return DEFAULT_DEMO;
      var n = parseInt(v, 10);
      return isNaN(n) ? DEFAULT_DEMO : Math.max(0, n);
    } catch (e) {
      return DEFAULT_DEMO;
    }
  }

  function write(n) {
    try { localStorage.setItem(KEY, String(Math.max(0, n | 0))); } catch (e) {}
  }

  var Fuel = {
    balance: function () { return read(); },
    /** @returns {{ok:boolean, balance:number, reason?:string}} */
    burn: function (units) {
      units = units || 1;
      var b = read();
      if (b < units) return { ok: false, balance: b, reason: 'insufficient_fuel' };
      b -= units;
      write(b);
      return { ok: true, balance: b };
    },
    grant: function (units) {
      var b = read() + (units || 0);
      write(b);
      return b;
    },
    /** Future: exchange Stripe session / server token for credits */
    redeemServerGrant: function (token) {
      console.info('Fuel.redeemServerGrant: wire to Dualis API when live', token);
      return read();
    }
  };

  global.DCFuel = Fuel;
})(typeof window !== 'undefined' ? window : globalThis);
