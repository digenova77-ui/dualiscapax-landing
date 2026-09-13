(function (w) {
  function scanVeto(text) {
    if (/\b(diagnose|prescribe|cure me|guaranteed profit|jailbreak)\b/i.test(String(text || "")))
      return "I will not invent a cure or a jailbreak.";
    return null;
  }
  async function run(text) {
    var v = scanVeto(text);
    if (v) return { grant: "VETO", spoken: v };
    if (w.IrisGo && IrisGo.parse) {
      var g = IrisGo.parse(text);
      if (g && g.href) {
        setTimeout(function () { location.href = g.href; }, 600);
        return { grant: "MEASURE", spoken: g.spoken };
      }
    }
    var s = String(text || "").toLowerCase();
    if (/speed of light/.test(s)) return { grant: "MEASURE", spoken: "About 299,792,458 metres per second in a vacuum." };
    if (w.IrisBook && IrisBook.lookup) {
      var b = IrisBook.lookup(text);
      if (b && b.spoken) return { grant: "MEASURE", spoken: b.spoken };
    }
    try {
      var c = new AbortController();
      setTimeout(function () { c.abort(); }, 2500);
      var open = await fetch("https://en.wikipedia.org/w/api.php?action=opensearch&limit=1&namespace=0&format=json&origin=*&search=" + encodeURIComponent(text), { signal: c.signal });
      var pack = await open.json();
      var title = pack && pack[1] && pack[1][0];
      if (title) {
        var sum = await fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title.replace(/ /g, "_")), { signal: c.signal });
        var d = await sum.json();
        if (d && d.extract) return { grant: "MEASURE", spoken: d.title + ". " + String(d.extract).slice(0, 500) };
      }
    } catch (e) {}
    return { grant: "MEASURE", spoken: "I only open rooms we can explain. Say go to pay, law, compute, study, or rooms." };
  }
  w.DCLMLook = { run: run };
})(window);
