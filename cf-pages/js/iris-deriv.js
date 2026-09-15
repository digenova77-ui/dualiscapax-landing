/**
 * Derivatives of leftover learning. English, not Hampel.
 * dCAD/d(times) owns the year. Fold moves only when remember() appends.
 */
(function (w) {
  function product(row) {
    if (!row) return 0;
    return ((+row.mins || 0) * (+row.times || 0) / 60) * (+row.wage || 0);
  }
  function sense(row) {
    var m = +row.mins || 0, t = +row.times || 0, w0 = +row.wage || 0;
    var cad = (m * t / 60) * w0;
    if (!m || !t || !w0) return "HOLE: a field is missing, so no derivative of a year.";
    var dm = (t / 60) * w0;
    var dt = (m / 60) * w0;
    var dw = (m * t / 60);
    var loud = "times";
    if (dm * 1 > dt * 1000 && dm * 1 > dw * 1) loud = "minutes";
    if (dw >= dm && dw >= dt) loud = "wage";
    if (dt * 1000 >= dm && dt >= dw / 1000) loud = "times-per-year";
    return (
      "SEED product " + Math.round(cad) +
      ". One extra minute moves the year about $" + Math.round(dm) +
      ". One extra time-per-year moves it about $" + Math.round(dt) +
      ". One extra dollar of wage moves it about $" + Math.round(dw) +
      ". Loud field: " + loud +
      ". Policy fence still 0.5–1.5. Not a CI. Unpublished if silent product."
    );
  }
  function foldMove(before, after) {
    if ((after || []).length === (before || []).length) return "Fold did not move (twin tap or empty)." ;
    return "Fold moved: last row is now the new sketch. Prior last is the change baseline.";
  }
  w.IrisDeriv = { product: product, sense: sense, foldMove: foldMove };
})(typeof window !== "undefined" ? window : globalThis);
