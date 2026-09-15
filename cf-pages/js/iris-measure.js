/**
 * Two measures. Floor is deterministic. Seed leftover wears an interval.
 * Not a second mind. Not "all the math."
 */
(function (w) {
  function leftover(mins, times, wage) {
    mins = +mins || 0; times = +times || 0; wage = +wage || 0;
    var hrs = (mins * times) / 60;
    var cad = hrs * wage;
    if (!mins || !times) return { status: "HOLE", text: "No minutes or count. Cannot fold." };
    var lo = cad * 0.5, hi = cad * 1.5;
    return {
      status: "SEED",
      hrs: hrs,
      cad: cad,
      lo: lo,
      hi: hi,
      text: "Seed midpoint $" + Math.round(cad) + " CAD/yr. Until her book measures, speak the band $" + Math.round(lo) + "–$" + Math.round(hi) + ". Not an invoice."
    };
  }
  w.IrisMeasure = { leftover: leftover };
})(typeof window !== "undefined" ? window : globalThis);
