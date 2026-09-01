/**
 * DualisCapax buy catalog helper.
 * Loads research/payment-links.json and exposes SKUs for any front-end.
 * Current as of: 2026-09-01
 * Jacket: access.dual.v8 · ED-PRC-20260901-120-TIER-MASTER-V8
 * No sk_ keys. open flag comes from jacket only.
 */
(function (g) {
  var FALLBACK = {
    open: false,
    list_currency: 'CAD',
    jacket: 'access.dual.v8',
    current_as_of: '2026-09-01',
    skus: {
      look: { name: 'Look', cad: 0, status: 'open', tab: 'free' },
      basic: { name: 'Basic measure', cad: 0, status: 'open', tab: 'free' },
      fuel_10: { sku: 'SKU-001', name: 'Fuel 10', cad: 5, crypto_equal_cad: true, status: 'closed', tab: 'fuel' },
      depth_s: { sku: 'SKU-002', name: 'Fuel 40', cad: 20, crypto_equal_cad: true, status: 'closed', tab: 'fuel' },
      depth_m: { sku: 'SKU-003', name: 'Fuel 120', cad: 50, crypto_equal_cad: true, status: 'closed', tab: 'fuel' },
      depth_l: { sku: 'SKU-004', name: 'Fuel 320', cad: 120, crypto_equal_cad: true, status: 'closed', tab: 'fuel' },
      fuel_1000: { sku: 'SKU-005', name: 'Fuel 1,000', cad: 350, crypto_equal_cad: true, status: 'closed', tab: 'fuel' },
      edu_leaf: { sku: 'SKU-016', name: 'Educational indication leaf', cad: 19, crypto_equal_cad: true, status: 'closed', tab: 'seats' },
      leaf: { sku: 'SKU-017', name: 'Single leaf pack 12 mo', cad: 49, crypto_equal_cad: true, status: 'closed', tab: 'seats' },
      branch: { sku: 'SKU-018', name: 'Branch clade pack 12 mo', cad: 299, crypto_equal_cad: true, status: 'closed', tab: 'seats' },
      trunk: { sku: 'SKU-019', name: 'Super-Trunk domain pack 12 mo', cad: 499, crypto_equal_cad: true, status: 'closed', tab: 'seats' },
      library: { sku: 'SKU-029', name: 'Master library perpetual', cad: 1499, crypto_equal_cad: true, status: 'closed', tab: 'seats' },
      hockey_game: { sku: 'SKU-081', name: 'Hockey matchup monograph', cad: 19, crypto_equal_cad: true, status: 'priced_closed', tab: 'alacarte' },
      hockey_season: { sku: 'SKU-083', name: 'Youth team season pacing', cad: 149, crypto_equal_cad: true, status: 'priced_closed', tab: 'alacarte' },
      golf_round: { sku: 'SKU-079', name: 'Golf 18-hole pass', cad: 9.99, crypto_equal_cad: true, status: 'priced_closed', tab: 'alacarte' },
      golf_season: { sku: 'SKU-080', name: 'Golf full-season pass', cad: 149, crypto_equal_cad: true, status: 'priced_closed', tab: 'alacarte' },
      med_mono: { sku: 'SKU-017', name: 'Medical monograph', cad: 49, crypto_equal_cad: true, status: 'priced_closed', tab: 'alacarte' },
      med_lab: { sku: 'SKU-018', name: 'Medical clade branch', cad: 299, crypto_equal_cad: true, status: 'priced_closed', tab: 'alacarte' },
      med_compendium: { sku: 'SKU-029', name: 'Medical master library', cad: 1499, crypto_equal_cad: true, status: 'priced_closed', tab: 'alacarte' },
      kitchen_mo: { sku: 'SKU-036', name: 'Kitchen 5-vector pack', cad: 79, crypto_equal_cad: true, status: 'priced_closed', tab: 'alacarte' },
      kitchen_fleet: { sku: 'SKU-037', name: 'Kitchen fleet 10 units', cad: 349, crypto_equal_cad: true, status: 'priced_closed', tab: 'alacarte' }
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
