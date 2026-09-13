/** DualisCapax pricing engine · jacket access.dual.v8
 *  Access CAD = how far you sit.
 *  Value weight = novelty × scarcity × criticality of the BYTES.
 *  Unique Dualis-only data quotes as invoice depth. Atlas is an index.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.DualisPricing = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var CURRENCY = "CAD";
  var JACKET = "access.dual.v8";
  var OPEN = false;
  var SKUS = {
    look: { sku: null, kind: "look", cad: 0, cents: 0, layer: "look", opens_room: false, status: "open" },
    measure: { sku: null, kind: "look", cad: 0, cents: 0, layer: "measure", opens_room: false, status: "open" },
    fuel_10: { sku: "SKU-001", kind: "fuel", cad: 5, cents: 500, units: 10, layer: "fuel", opens_room: false, status: "closed" },
    depth_s: { sku: "SKU-002", kind: "fuel", cad: 20, cents: 2000, units: 40, layer: "fuel", opens_room: false, status: "closed" },
    depth_m: { sku: "SKU-003", kind: "fuel", cad: 50, cents: 5000, units: 120, layer: "fuel", opens_room: false, status: "closed" },
    depth_l: { sku: "SKU-004", kind: "fuel", cad: 120, cents: 12000, units: 320, layer: "fuel", opens_room: false, status: "closed" },
    fuel_1000: { sku: "SKU-005", kind: "fuel", cad: 350, cents: 35000, units: 1000, layer: "fuel", opens_room: false, status: "closed" },
    edu_leaf: { sku: "SKU-016", kind: "seat", cad: 19, cents: 1900, term_months: 1, layer: "leaf", opens_room: false, status: "closed" },
    leaf: { sku: "SKU-017", kind: "seat", cad: 49, cents: 4900, term_months: 12, layer: "leaf", opens_room: true, status: "closed" },
    branch: { sku: "SKU-018", kind: "seat", cad: 299, cents: 29900, allowed_cents: [29900, 14900], term_months: 12, layer: "branch", opens_room: true, status: "closed" },
    trunk: { sku: "SKU-019", kind: "seat", cad: 499, cents: 49900, term_months: 12, layer: "trunk", opens_room: true, status: "closed" },
    library: { sku: "SKU-029", kind: "seat", cad: 1499, cents: 149900, perpetual: true, layer: "atlas", opens_room: false, status: "closed" },
    crown: { sku: "SKU-030", kind: "crown", cad: null, cents: null, layer: "crown", opens_room: false, status: "wet_ink" }
  };
  var LAYER_KEY = { look: "look", measure: "measure", leaf: "leaf", branch: "branch", trunk: "trunk", atlas: "library", library: "library", fuel: "depth_s", kernel: "leaf", invert: "leaf", depth: "leaf", crown: "crown" };
  var NEVER = ["ALS program as SKU-017", "MS program as SKU-017", "sealed vault bodies on a Payment Link", "both kingdoms for $1,499", "instant cryptographic unlock of a PK model", "117-indication master compendium as the $1,499 SKU", "Fuel as an IP license"];
  function clamp01(n) { n = Number(n); if (!(n >= 0)) return 0; if (n > 1) return 1; return n; }
  function norm(s) { return String(s || "").trim().toLowerCase().replace(/[\s-]+/g, "_"); }
  function grantsFor(domain, layer, skuRow) {
    var d = domain === "engineering" ? "engineering" : "medical";
    var out = ["look:" + d];
    if (layer === "measure") out.push("measure:" + d);
    if (skuRow && skuRow.opens_room) out.push("seat:" + d + ":" + layer);
    if (layer === "atlas") out.push("atlas:" + d + ":index");
    if (skuRow && skuRow.kind === "fuel") out.push("fuel:runtime");
    return out;
  }
  function isSealed(input) {
    var layer = norm(input && input.layer);
    var ip = norm(input && (input.ip || input.id || input.doc_id));
    if (input && (input.sealed === true || input.vault === true)) return true;
    if (layer === "sealed" || layer === "vault") return true;
    if (layer === "crown") return "crown";
    if (/als|ms_vault|counsel_sealed|vault/.test(ip) && layer !== "look" && layer !== "atlas") return true;
    return false;
  }
  function noveltyOf(input) {
    if (typeof input.novelty === "number") return clamp01(input.novelty);
    if (input.otherwise_available === true) return 0.04;
    if (input.otherwise_available === false) return 0.82;
    var layer = norm(input.layer);
    if (input.sealed || input.vault || layer === "crown" || layer === "vault") return 1;
    if (layer === "kernel" || layer === "invert" || layer === "depth") return 0.8;
    if (layer === "look" || layer === "measure") return 0.05;
    if (layer === "fuel") return 0;
    if (layer === "atlas" || layer === "library") return 0.14;
    if (layer === "leaf") return 0.22;
    if (layer === "branch") return 0.3;
    if (layer === "trunk") return 0.34;
    return 0.2;
  }
  function scarcityOf(input) {
    if (typeof input.scarcity === "number") return clamp01(input.scarcity);
    var layer = norm(input.layer);
    if (input.sealed || input.vault || layer === "crown") return 1;
    if (layer === "kernel" || layer === "invert") return 0.92;
    if (layer === "atlas" || layer === "library") return 0.18;
    if (layer === "look" || layer === "measure" || layer === "fuel") return 0.05;
    if (layer === "leaf") return 0.28;
    if (layer === "branch") return 0.36;
    if (layer === "trunk") return 0.4;
    return 0.25;
  }
  function criticalityOf(input) {
    if (typeof input.criticality === "number") return clamp01(input.criticality);
    var layer = norm(input.layer);
    if (layer === "look" || layer === "measure" || layer === "fuel") return 0.05;
    if (layer === "leaf") return 0.25;
    if (layer === "branch") return 0.4;
    if (layer === "trunk") return 0.45;
    if (layer === "atlas" || layer === "library") return 0.2;
    if (layer === "kernel" || layer === "invert" || layer === "depth") return 0.85;
    if (layer === "crown" || input.sealed || input.vault) return 1;
    return 0.2;
  }
  function bandOf(novelty, sealed) {
    if (sealed === "crown" || novelty >= 0.85 || sealed === true) return "W4";
    if (novelty >= 0.7) return "W3";
    if (novelty <= 0.1) return "W0";
    return "W1";
  }
  function score(input) {
    input = input || {};
    var novelty = noveltyOf(input);
    var scarcity = scarcityOf(input);
    var criticality = criticalityOf(input);
    var weight = novelty * scarcity * (0.25 + 0.75 * criticality);
    var sealed = isSealed(input);
    return { novelty: Math.round(novelty * 1000) / 1000, scarcity: Math.round(scarcity * 1000) / 1000, criticality: Math.round(criticality * 1000) / 1000, weight: Math.round(weight * 1000) / 1000, band: bandOf(novelty, sealed), sealed: Boolean(sealed) };
  }
  function depthInvoice(accessCad, criticality) {
    if (!(accessCad > 0)) return null;
    var mult = 10 + 90 * clamp01(criticality);
    return { multiplier: Math.round(mult * 10) / 10, cad: Math.round(accessCad * mult), status: "invoice", note: "Named-program percent (0.01 / 0.1 / 1) may replace this floor when a Phase-3 or plant budget is named. Not a Payment Link." };
  }
  function quote(input) {
    input = input || {};
    var domain = norm(input.class || input.domain);
    if (domain !== "medical" && domain !== "engineering") {
      return { ok: false, saleable: false, reason: "unknown_domain", status: "reject", never: NEVER };
    }
    var layer = norm(input.layer || "look");
    var sealed = isSealed(input);
    var w = score(input);
    var key = LAYER_KEY[layer] || (w.band === "W4" ? "crown" : "look");
    var row = SKUS[key] || SKUS.look;
    if (w.band === "W4" || sealed === "crown" || sealed === true) {
      return { ok: true, saleable: false, reason: layer === "crown" ? "wet_ink" : "not_on_plane", status: "wet_ink", domain: domain, layer: layer === "crown" ? "crown" : "sealed", sku: "SKU-030", cad_access: null, cad_depth: null, cad: null, cents: null, unit: CURRENCY, weight: w, grants: [], never: NEVER, open: OPEN, jacket: JACKET, pane: "half", note: "Highest value: Dualis-only sealed engines. Crown / wet-ink. Not SKU-017/018/019/029." };
    }
    if (w.band === "W3") {
      var inv = depthInvoice(row.cad || 49, w.criticality);
      return { ok: true, saleable: false, reason: "invoice_depth", status: "invoice", domain: domain, layer: layer, sku: null, cad_access: row.cad || 0, cad_depth: inv && inv.cad, depth: inv, cad: null, cents: null, unit: CURRENCY, weight: w, grants: [], never: NEVER, open: OPEN, jacket: JACKET, pane: "half", note: "New Dualis-derived bytes. Invoice only. Access ladder is not this price." };
    }
    var saleable = row.status === "closed" && row.kind === "seat" && (row.opens_room || row.layer === "atlas");
    return { ok: true, saleable: saleable, reason: row.cad === 0 ? "look_free" : "priced_access", status: row.status, domain: domain, layer: row.layer, sku: row.sku, code: key, cad: row.cad, cad_access: row.cad, cad_depth: null, cents: row.cents, allowed_cents: row.allowed_cents || (row.cents != null ? [row.cents] : []), unit: CURRENCY, term_months: row.term_months || 0, perpetual: Boolean(row.perpetual), opens_room: Boolean(row.opens_room), cad_flag: Boolean(input.cad), weight: w, grants: grantsFor(domain, row.layer, row), never: NEVER, open: OPEN, jacket: JACKET, pane: "half", note: row.layer === "atlas" ? "Low novelty map of names. Taxonomic index — not ALS, not MS, not the vault." : row.layer === "trunk" ? "Name list for one class. Not sealed engines." : row.kind === "fuel" ? "Runtime credit. Fuel is not data and is not multiplied." : row.layer === "leaf" ? "Seat format. Not an ALS program. Unique kernels are W3/W4." : "Look is free. Public residual is not Dualis-only IP." };
  }
  function quoteMany(docs) {
    return (docs || []).map(function (d) { return { id: d && (d.id || d.doc_id), title: d && d.title, class: d && d.class, quote: quote(d) }; });
  }
  function amountToSku(cents) {
    var map = { 0: "look", 500: "fuel_10", 1900: "edu_leaf", 2000: "depth_s", 4900: "leaf", 5000: "depth_m", 12000: "depth_l", 14900: "branch", 29900: "branch", 35000: "fuel_1000", 49900: "trunk", 149900: "library" };
    return map[cents] || null;
  }
  function assertClass(a, b) { return norm(a) === norm(b); }
  function rank(docs) {
    return quoteMany(docs).sort(function (a, b) {
      var wa = (a.quote.weight && a.quote.weight.weight) || 0;
      var wb = (b.quote.weight && b.quote.weight.weight) || 0;
      return wb - wa;
    });
  }
  return { JACKET: JACKET, OPEN: OPEN, CURRENCY: CURRENCY, SKUS: SKUS, NEVER: NEVER, score: score, quote: quote, quoteMany: quoteMany, rank: rank, amountToSku: amountToSku, assertClass: assertClass };
});
