/** DualisCapax Fuel ledger — local demo stub until server + xAI API */
(function (g) {
  var KEY = 'dc_fuel_balance_v1';
  var START = 25; // demo credits for beta

  function read() {
    try {
      var v = localStorage.getItem(KEY);
      if (v === null || v === '') {
        localStorage.setItem(KEY, String(START));
        return START;
      }
      return Math.max(0, parseInt(v, 10) || 0);
    } catch (e) {
      return START;
    }
  }

  function write(n) {
    try {
      localStorage.setItem(KEY, String(Math.max(0, n)));
    } catch (e) {}
  }

  g.DCFuel = {
    balance: read,
    burn: function (units) {
      units = Math.max(1, units || 1);
      var b = read();
      if (b < units) return { ok: false, balance: b };
      b -= units;
      write(b);
      return { ok: true, balance: b, burned: units };
    },
    grant: function (units) {
      var b = read() + Math.max(0, units || 0);
      write(b);
      return b;
    },
    resetDemo: function () {
      write(START);
      return START;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
