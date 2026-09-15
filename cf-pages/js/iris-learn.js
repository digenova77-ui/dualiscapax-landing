/**
 * IrisLearn after DCLM.
 * Friction: raw average lied; wake-remember double-counted; two origins are two books.
 * Affinity: she speaks the CHANGE on this phone, and whether the row was seed or book.
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
  function sig(row) {
    return [row.place || "", row.paid || "", row.mins, row.times, row.wage].join("|");
  }
  function remember(row, kind) {
    if (!row || !row.place) return load();
    var a = load();
    var rec = {
      place: String(row.place).slice(0, 48),
      paid: String(row.paid || "").slice(0, 80),
      mins: +row.mins || 0,
      times: +row.times || 0,
      wage: +row.wage || 0,
      kind: kind === "BOOK" ? "BOOK" : "SEED",
      t: Date.now()
    };
    var last = a[a.length - 1];
    if (last && sig(last) === sig(rec) && rec.t - last.t < 120000) return a;
    a.push(rec);
    save(a);
    return a;
  }
  function fold() {
    var a = load();
    if (!a.length) return "No leftover sketches on this phone yet.";
    var last = a[a.length - 1];
    var prev = a.length > 1 ? a[a.length - 2] : null;
    var parts = [];
    parts.push(a.length + " sketches on this origin, last " + last.kind + " at " + last.place + ".");
    if (last.kind === "SEED") parts.push("Last row is still a seed — not her book.");
    if (last.kind === "BOOK") parts.push("Last row claims a measured book.");
    if (prev && prev.place === last.place && prev.mins && last.mins) {
      var d = Math.round((last.mins - prev.mins) * 10) / 10;
      if (d > 0) parts.push("Minutes at " + last.place + " rose " + d + " since the prior save.");
      else if (d < 0) parts.push("Minutes at " + last.place + " fell " + Math.abs(d) + " since the prior save.");
      else parts.push("Minutes at " + last.place + " unchanged since the prior save.");
    }
    parts.push("This phone only. Another origin is another notebook.");
    return parts.join(" ");
  }
  w.IrisLearn = { remember: remember, fold: fold, load: load };
})(typeof window !== "undefined" ? window : globalThis);
