/**
 * Iris learn — SIMA desk only.
 * Facts stay on this origin. No chart. No upload.
 * Fold is what she may say she has seen.
 */
(function (w) {
  var KEY = "dc.sima.learn";
  var MAX = 24;
  function load() {
    try {
      var a = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(a) ? a : [];
    } catch (e) { return []; }
  }
  function save(a) {
    try { localStorage.setItem(KEY, JSON.stringify(a.slice(-MAX))); } catch (e) {}
  }
  function remember(row) {
    if (!row || !row.place) return load();
    var a = load();
    a.push({
      place: String(row.place).slice(0, 48),
      paid: String(row.paid || "").slice(0, 80),
      mins: +row.mins || 0,
      times: +row.times || 0,
      wage: +row.wage || 0,
      t: Date.now()
    });
    save(a);
    return a;
  }
  function fold() {
    var a = load();
    if (!a.length) return "No leftover sketches on this phone yet.";
    var by = {};
    a.forEach(function (r) {
      var k = r.place || "?";
      if (!by[k]) by[k] = { n: 0, mins: 0, times: 0 };
      by[k].n += 1;
      by[k].mins += r.mins;
      by[k].times += r.times;
    });
    var parts = ["Seen " + a.length + " leftover sketches on this phone."];
    Object.keys(by).forEach(function (k) {
      var x = by[k];
      parts.push(k + ": " + x.n + " saves, last-avg minutes " + (Math.round((x.mins / x.n) * 10) / 10) + ".");
    });
    parts.push("Estimates only. Not her book. Not a chart.");
    return parts.join(" ");
  }
  w.IrisLearn = { remember: remember, fold: fold, load: load };
})(typeof window !== "undefined" ? window : globalThis);
