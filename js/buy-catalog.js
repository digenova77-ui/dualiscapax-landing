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
      look: { name: 'Look', cad: 0, status: 'open', tab: 'free' },
      basic: { name: 'Basic measure', cad: 0, status: 'open', tab: 'free' },
      leaf: { name: 'Single leaf pack 12 mo', cad: 49, crypto_equal_cad: true, status: 'priced_closed', tab: 'seats' },
      branch: { name: 'Branch access 12 mo', cad: 149, crypto_equal_cad: true, status: 'priced_closed', tab: 'seats' },
      library: { name: 'Domain library 12 mo', cad: 499, crypto_equal_cad: true, status: 'priced_closed', tab: 'seats' },
      depth_s: { name: 'Depth 40 Fuel', cad: 20, crypto_equal_cad: true, status: 'priced_closed', tab: 'fuel' },
      depth_m: { name: 'Depth 120 Fuel', cad: 50, crypto_equal_cad: true, status: 'priced_closed', tab: 'fuel' },
      depth_l: { name: 'Depth 320 Fuel', cad: 120, crypto_equal_cad: true, status: 'priced_closed', tab: 'fuel' },
      hockey_game: { name: 'Hockey gameplan', cad: 19, crypto_equal_cad: true, status: 'priced_closed', tab: 'alacarte' },
      hockey_mo: { name: 'Hockey tournament pack', cad: 59, crypto_equal_cad: true, status: 'priced_closed', tab: 'alacarte' },
      hockey_season: { name: 'Hockey season campaign', cad: 249, crypto_equal_cad: true, status: 'priced_closed', tab: 'alacarte' },
      golf_round: { name: 'Golf 18-hole caddie', cad: 9.99, crypto_equal_cad: true, status: 'priced_closed', tab: 'alacarte' },
      golf_mo: { name: 'Golf unlimited monthly pass', cad: 39, crypto_equal_cad: true, status: 'priced_closed', tab: 'alacarte' },
      golf_season: { name: 'Golf 6-month season pass', cad: 149, crypto_equal_cad: true, status: 'priced_closed', tab: 'alacarte' },
      med_mono: { name: 'Medical monograph', cad: 49, crypto_equal_cad: true, status: 'priced_closed', tab: 'alacarte' },
      med_lab: { name: 'Medical lab pass (10 models)', cad: 149, crypto_equal_cad: true, status: 'priced_closed', tab: 'alacarte' },
      med_compendium: { name: 'Medical master compendium', cad: 1499, crypto_equal_cad: true, status: 'priced_closed', tab: 'alacarte' },
      kitchen_mo: { name: 'Kitchen operations pack', cad: 79, crypto_equal_cad: true, status: 'priced_closed', tab: 'alacarte' },
      kitchen_year: { name: 'Kitchen commercial charter', cad: 699, crypto_equal_cad: true, status: 'priced_closed', tab: 'alacarte' }
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
    },
    tabKeys: function (tab) {
      var j = g.DCBuy.jacket || FALLBACK;
      return Object.keys(j.skus || {}).filter(function (k) {
        return (j.skus[k] && j.skus[k].tab) === tab;
      });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
