/** DualisCapax leaf archive: buy outright vs explore with fuel.
 *  Completing a leaf on fuel is never cheaper than buying it.
 *  Default premium 10%. Burn is exponential in completion x in [0,1].
 *  10k prices = f(leaf, x), not 10k Stripe links.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.DualisFuelCurve = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var PREMIUM = 0.10;
  var K = 3;
  var CAD_PER_FUEL = 0.35;
  var OPEN = false;
  function clamp01(x) {
    x = Number(x);
    if (!(x > 0)) return 0;
    if (x > 1) return 1;
    return x;
  }
  function r0(P, k, premium) {
    k = k == null ? K : k;
    premium = premium == null ? PREMIUM : premium;
    if (!(P > 0) || !(k > 0)) return 0;
    return (P * (1 + premium) * k) / (Math.exp(k) - 1);
  }
  function costAt(P, x, k, premium) {
    k = k == null ? K : k;
    premium = premium == null ? PREMIUM : premium;
    x = clamp01(x);
    if (!(P > 0) || x === 0) return 0;
    return (r0(P, k, premium) / k) * (Math.exp(k * x) - 1);
  }
  function rateAt(P, x, k, premium) {
    k = k == null ? K : k;
    x = clamp01(x);
    return r0(P, k, premium) * Math.exp(k * x);
  }
  function crossover(P, k, premium) {
    k = k == null ? K : k;
    premium = premium == null ? PREMIUM : premium;
    if (!(P > 0)) return 1;
    var target = 1 / (1 + premium);
    return Math.log(1 + target * (Math.exp(k) - 1)) / k;
  }
  function quote(input) {
    input = input || {};
    var P = Number(input.P || input.cad_depth || input.buy || input.leaf_cad);
    if (!(P > 0)) {
      return { ok: false, saleable: false, status: "needs_path", reason: "missing_leaf_price", note: "P is the archive/path price, not SKU-017 $49 format." };
    }
    var k = input.k == null ? K : Number(input.k);
    var premium = input.premium == null ? PREMIUM : Number(input.premium);
    var x = input.x == null ? null : clamp01(input.x);
    var mode = String(input.mode || (x == null ? "outright" : "fuel"));
    var xStar = crossover(P, k, premium);
    var fullFuel = costAt(P, 1, k, premium);
    var cadPerFuel = Number(input.cad_per_fuel || CAD_PER_FUEL);
    if (mode === "outright") {
      return { ok: true, saleable: false, status: "closed", mode: "outright", leaf: input.leaf || input.indication || null, class: input.class || null, P: P, cad: P, premium: premium, full_fuel_cad: Math.round(fullFuel * 100) / 100, crossover_x: Math.round(xStar * 1000) / 1000, open: OPEN, note: "Buy the leaf. Completing the same archive on fuel costs ~" + Math.round(premium * 100) + "% more." };
    }
    var cad = costAt(P, x, k, premium);
    var fuelUnits = cadPerFuel > 0 ? cad / cadPerFuel : null;
    return { ok: true, saleable: false, status: "closed", mode: "fuel", leaf: input.leaf || input.indication || null, class: input.class || null, P: P, x: x, cad: Math.round(cad * 100) / 100, rate: Math.round(rateAt(P, x, k, premium) * 100) / 100, fuel_units: fuelUnits != null ? Math.round(fuelUnits * 10) / 10 : null, cad_per_fuel: cadPerFuel, cheaper_than_buy: cad < P, full_fuel_cad: Math.round(fullFuel * 100) / 100, crossover_x: Math.round(xStar * 1000) / 1000, open: OPEN, note: x >= 1 ? "Whole archive on fuel. Never cheaper than buy." : cad < P ? "Partial explore. Still under buy price." : "Past crossover. Buying the leaf is cheaper than continuing on fuel." };
  }
  function ladder(P, steps, k, premium) {
    steps = steps || [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];
    return steps.map(function (x) { return quote({ P: P, mode: "fuel", x: x, k: k, premium: premium }); });
  }
  return { PREMIUM: PREMIUM, K: K, CAD_PER_FUEL: CAD_PER_FUEL, r0: r0, costAt: costAt, rateAt: rateAt, crossover: crossover, quote: quote, ladder: ladder };
});
