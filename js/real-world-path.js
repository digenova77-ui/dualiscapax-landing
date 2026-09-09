/** Real-world value-equivalent path.
 *  Access CAD is not a cap. Depth = named_path × share × novelty.
 *  Missing peg → invoice, not an invented $50M.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.DualisPath = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var SHARES = { look: 0, measure: 0, design_look: 0.0001, protocol: 0.001, sponsor_sim: 0.01, co_dev: 0.1 };
  var PEGS = {
    ALS: { cad: 27000000, unit: "CAD", source: "pricing.html HEALEY-class late-stage ~USD 20M (~CAD 27M)", class: "medical" },
    ONCOLOGY_P3_LO: { cad: 67500000, unit: "CAD", source: "pricing.html oncology Phase-3 neighborhood ~USD 50M (~CAD 67.5M)", class: "medical" },
    ONCOLOGY_P3_HI: { cad: 202500000, unit: "CAD", source: "pricing.html oncology Phase-3 neighborhood ~USD 150M (~CAD 202.5M)", class: "medical" }
  };
  function shareOf(depth) {
    var k = String(depth || "sponsor_sim").toLowerCase().replace(/[\s-]+/g, "_");
    if (k === "kernel" || k === "invert" || k === "depth") k = "sponsor_sim";
    if (k === "crown" || k === "vault") k = "co_dev";
    return Object.prototype.hasOwnProperty.call(SHARES, k) ? SHARES[k] : null;
  }
  function pegOf(name) {
    if (!name) return null;
    var k = String(name).toUpperCase().replace(/[\s-]+/g, "_");
    if (k === "ALS_HEALEY" || k === "HEALEY" || k === "NEURO_ALS") k = "ALS";
    if (k === "ONCOLOGY" || k === "P3" || k === "ONCO") k = "ONCOLOGY_P3_LO";
    return PEGS[k] || null;
  }
  function pathQuote(input) {
    input = input || {};
    var novelty = input.otherwise_available === true ? 0 : (typeof input.novelty === "number" ? input.novelty : 1);
    if (novelty < 0) novelty = 0;
    if (novelty > 1) novelty = 1;
    var named = pegOf(input.peg || input.indication);
    var pathCad = Number(input.path_cad || input.peg_cad || (named && named.cad));
    var source = input.peg_source || (named && named.source) || null;
    var shareKey = input.share_key || input.depth || input.layer || "sponsor_sim";
    var share = typeof input.share === "number" ? input.share : shareOf(shareKey);
    if (!(pathCad > 0) || !source) {
      return { ok: true, saleable: false, status: "invoice", reason: "missing_named_path", cad_depth: null, path_cad: pathCad > 0 ? pathCad : null, peg_source: source, note: "Name the real-world replacement cost. Do not invent $50M." };
    }
    if (share == null) return { ok: false, saleable: false, reason: "unknown_share", status: "reject" };
    if (novelty === 0) {
      return { ok: true, saleable: false, status: "look_or_literature", reason: "otherwise_available", path_cad: pathCad, peg_source: source, share: share, novelty: 0, cad_depth: 0, note: "Bytes exist outside Dualis. Access ladder only." };
    }
    var cad = Math.round(pathCad * share * novelty);
    var crown = share >= 0.1 || cad >= 27000;
    return { ok: true, saleable: false, status: crown ? "wet_ink" : "invoice", reason: "real_world_path", class: input.class || (named && named.class) || null, indication: input.indication || input.peg || null, path_cad: pathCad, peg_source: source, share: share, novelty: novelty, cad_depth: cad, unit: "CAD", open: false, note: crown ? "At or above SKU-030 neighborhood. Crown / wet-ink. Not a Payment Link." : "Invoice against named path. Not capped at $499 or $1,499." };
  }
  function table(indication, pegKey) {
    var named = pegOf(pegKey || indication);
    if (!named) return [];
    return ["design_look", "protocol", "sponsor_sim"].map(function (k) {
      return pathQuote({ indication: indication, peg: pegKey || indication, share_key: k, novelty: 1 });
    });
  }
  return { SHARES: SHARES, PEGS: PEGS, pathQuote: pathQuote, pegOf: pegOf, shareOf: shareOf, table: table };
});
