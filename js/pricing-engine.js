/** DualisCapax pricing engine · jacket access.dual.v8
 *  quote({ class, layer }) for medical + engineering documents.
 *  Same CAD both classes. Grants do not cross class.
 *  Atlas $1499 = taxonomic index. Not ALS, not MS, not the vault.
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
    look: { sku: null, code: "LOOK", kind: "look", cad: 0, cents: 0, layer: "look", opens_room: false, status: "open" },
    measure: { sku: null, code: "MEASURE", kind: "look", cad: 0, cents: 0, layer: "measure", opens_room: false, status: "open" },
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

  var LAYER_KEY = {
    look: "look",
    measure: "measure",
    leaf: "leaf",
    branch: "branch",
    trunk: "trunk",
    atlas: "library",
    library: "library",
    fuel: "depth_s",
    crown: "crown"
  };

  var NEVER = [
    "ALS program",
    "MS program",
    "sealed vault bodies",
    "both kingdoms",
    "instant cryptographic unlock of a PK model",
    "117-indication master compendium as the $1,499 SKU"
  ];

  function norm(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
  }

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

  function quote(input) {
    input = input || {};
    var domain = norm(input.class || input.domain);
    if (domain !== "medical" && domain !== "engineering") {
      return { ok: false, saleable: false, reason: "unknown_domain", status: "reject", never: NEVER };
    }
    var layer = norm(input.layer || "look");
    var sealed = isSealed(input);
    if (sealed === "crown") {
      return {
        ok: true,
        saleable: false,
        reason: "wet_ink",
        status: "wet_ink",
        domain: domain,
        layer: "crown",
        sku: "SKU-030",
        cad: null,
        cents: null,
        unit: CURRENCY,
        grants: [],
        never: NEVER,
        open: OPEN,
        jacket: JACKET,
        pane: "half",
        note: "Crown is wet-ink only. Not a Payment Link."
      };
    }
    if (sealed) {
      return {
        ok: true,
        saleable: false,
        reason: "not_on_plane",
        status: "invoice",
        domain: domain,
        layer: "sealed",
        sku: null,
        cad: null,
        cents: null,
        unit: CURRENCY,
        grants: [],
        never: NEVER,
        open: OPEN,
        jacket: JACKET,
        pane: "half",
        note: "Sealed medical/engineering bodies are not SKU-017/018/019/029."
      };
    }
    var key = LAYER_KEY[layer];
    if (!key || !SKUS[key]) {
      return { ok: false, saleable: false, reason: "unknown_layer", layer: layer, domain: domain, never: NEVER };
    }
    var row = SKUS[key];
    var saleable = row.status === "closed" && row.kind === "seat" && (row.opens_room || layer === "atlas" || row.layer === "atlas");
    return {
      ok: true,
      saleable: saleable,
      reason: row.cad === 0 ? "look_free" : "priced",
      status: row.status,
      domain: domain,
      layer: row.layer,
      sku: row.sku,
      code: key,
      cad: row.cad,
      cents: row.cents,
      allowed_cents: row.allowed_cents || (row.cents != null ? [row.cents] : []),
      unit: CURRENCY,
      term_months: row.term_months || 0,
      perpetual: Boolean(row.perpetual),
      opens_room: Boolean(row.opens_room),
      cad_flag: Boolean(input.cad),
      grants: grantsFor(domain, row.layer, row),
      never: NEVER,
      open: OPEN,
      jacket: JACKET,
      pane: "half",
      note:
        row.layer === "atlas"
          ? "Taxonomic index only — not ALS, not MS, not the vault, not both kingdoms."
          : row.layer === "trunk"
            ? "One super-trunk name list for one class, 12 mo — not sealed engines."
            : row.kind === "fuel"
              ? "Runtime credit. Fuel does not open a gated room."
              : row.layer === "leaf"
                ? "Seat format for one room — not an ALS program."
                : "Look is free. Bind still required before a room opens."
    };
  }

  function quoteMany(docs) {
    return (docs || []).map(function (d) {
      return { id: d && (d.id || d.doc_id), title: d && d.title, class: d && d.class, quote: quote(d) };
    });
  }

  function amountToSku(cents) {
    var map = {
      0: "look",
      500: "fuel_10",
      1900: "edu_leaf",
      2000: "depth_s",
      4900: "leaf",
      5000: "depth_m",
      12000: "depth_l",
      14900: "branch",
      29900: "branch",
      35000: "fuel_1000",
      49900: "trunk",
      149900: "library"
    };
    return map[cents] || null;
  }

  function assertClass(grantClass, docClass) {
    return norm(grantClass) === norm(docClass);
  }

  return {
    JACKET: JACKET,
    OPEN: OPEN,
    CURRENCY: CURRENCY,
    SKUS: SKUS,
    NEVER: NEVER,
    quote: quote,
    quoteMany: quoteMany,
    amountToSku: amountToSku,
    assertClass: assertClass
  };
});
