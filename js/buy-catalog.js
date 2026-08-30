/**
 * DualisCapax buy catalog helper.
 * Loads research/payment-links.json and exposes SKUs for any front-end.
 * Current as of: 2026-08-30
 * No sk_ keys. open flag comes from jacket only.
 */
(function (g) {
  var FALLBACK = {
    open: false,
    list_currency: 'CAD',
    skus: {
      look: { name: 'Look', cad: 0, status: 'open' },
      basic: { name: 'Basic measure', cad: 0, status: 'open' },
      leaf: { name: 'Single leaf pack 12 mo', cad: 49, crypto_equal_cad: true, status: 'priced_closed' },
      branch: { name: 'Branch access 12 mo', cad: 149, crypto_equal_cad: true, status: 'priced_closed' },
      library: { name: 'Full residual library 12 mo', cad: 499, crypto_equal_cad: true, status: 'priced_closed' },
      depth_s: { name: 'Depth 40 Fuel', cad: 20, crypto_equal_cad: true, status: 'priced_closed' },
      depth_m: { name: 'Depth 120 Fuel', cad: 50, crypto_equal_cad: true, status: 'priced_closed' },
      depth_l: { name: 'Depth 320 Fuel', cad: 120, crypto_equal_cad: true, status: 'priced_closed' }
    }
  };

  g.DCBuy = {
    jacket: null,
    load: function (url) {
      url = url || 'research/payment-links.json';
      return fetch(url, { cache: 'no-store' })
        .then(function (r) {
          if (!r.ok) throw new Error('catalog ' + r.status);
          return r.json();
        })
        .then(function (j) {
          g.DCBuy.jacket = j;
          return j;
        })
        .catch(function () {
          g.DCBuy.jacket = FALLBACK;
          return FALLBACK;
        });
    },
    isCheckoutOpen: function () {
      return !!(g.DCBuy.jacket && g.DCBuy.jacket.open);
    },
    sku: function (key) {
      var j = g.DCBuy.jacket || FALLBACK;
      return (j.skus && j.skus[key]) || null;
    },
    list: function (keys) {
      var j = g.DCBuy.jacket || FALLBACK;
      return (keys || Object.keys(j.skus || {})).map(function (k) {
        return Object.assign({ key: k }, j.skus[k] || {});
      });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
