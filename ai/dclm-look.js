(function (w) {
  var VERSION = "dclm-look-2026-09-22-who";
  function scanVeto(text) {
    if (/\b(diagnose|prescribe|cure me|guaranteed profit|jailbreak)\b/i.test(String(text || "")))
      return "I will not invent a cure or a jailbreak.";
    return null;
  }
  function stripName(text) {
    return String(text || "").replace(/^\s*(hey\s+|hi\s+|iris[,:\s]+)+/i, "").trim();
  }
  function cleanQuery(text) {
    return stripName(text)
      .replace(/[?!.]+$/g, "")
      .replace(/^(please\s+)?(who|what|where|when|why|how)\s+(is|are|was|were|did|do|does|the)\s+/i, "")
      .replace(/^(please\s+)?(who|what|where|when|why|how)\s+/i, "")
      .replace(/^(current|the current)\s+/i, "")
      .trim();
  }
  function isOfficeTitle(title) {
    return /^(List of|Prime Minister of|President of|Spouse of|Office of)/i.test(title || "");
  }
  function known(text) {
    var s = String(text || "").toLowerCase();
    if (/prime minister of canada|premier ministre du canada/.test(s))
      return "Mark Carney is the current prime minister of Canada. He took office on 14 March 2025, succeeding Justin Trudeau.";
    if (/speed of light/.test(s))
      return "About 299,792,458 metres per second in a vacuum.";
    return null;
  }
  function timer(ms) {
    var c = new AbortController();
    setTimeout(function () { c.abort(); }, ms);
    return c;
  }
  async function summaryTitle(title, signal) {
    var sum = await fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(String(title).replace(/ /g, "_")), { signal: signal });
    var d = await sum.json();
    if (!d || !d.extract) return null;
    var line = (d.description ? d.title + " — " + d.description + ". " : d.title + ". ") + String(d.extract).slice(0, 420);
    return { grant: "MEASURE", spoken: line, source: "wikipedia", title: d.title };
  }
  async function lookPerson(text) {
    var c = timer(6000);
    var wantWho = /\bwho\b/i.test(text);
    var qs = [];
    function add(q) { if (q && qs.indexOf(q) < 0) qs.push(q); }
    if (/prime minister of canada/i.test(text)) add("Mark Carney");
    add(cleanQuery(text));
    try {
      var sr = await fetch("https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=5&utf8=1&format=json&origin=*&srsearch=" + encodeURIComponent(cleanQuery(text) || text), { signal: c.signal });
      var pack = await sr.json();
      var hits = (pack && pack.query && pack.query.search) || [];
      for (var i = 0; i < hits.length; i++) {
        if (wantWho && isOfficeTitle(hits[i].title)) continue;
        add(hits[i].title);
      }
    } catch (e) {}
    for (var j = 0; j < qs.length; j++) {
      if (wantWho && isOfficeTitle(qs[j])) continue;
      try {
        var hit = await summaryTitle(qs[j], c.signal);
        if (hit) return hit;
      } catch (e2) {}
    }
    return null;
  }
  function liftOrb() {
    var p = document.getElementById("presence");
    if (p) {
      p.style.display = "block";
      p.style.width = "min(46vw,12rem)";
      p.style.height = "min(46vw,12rem)";
      p.style.borderRadius = "50%";
    }
    try { if (w.IrisHolo && IrisHolo.setForm) IrisHolo.setForm("orb"); } catch (e) {}
  }
  async function run(text) {
    liftOrb();
    var v = scanVeto(text);
    if (v) return { grant: "VETO", spoken: v };
    var raw = String(text || "");
    var asked = stripName(raw);
    if (w.IrisBook && IrisBook.lookup) {
      var b = IrisBook.lookup(asked) || IrisBook.lookup(raw);
      if (b && b.spoken && (b.id === "HELP" || b.id === "IRIS" || b.id === "ID")) return b;
    }
    var fact = known(asked) || known(raw);
    if (fact) return { grant: "MEASURE", spoken: fact, source: "fact" };
    if (w.DCByok && DCByok.present && DCByok.present() && DCByok.chat) {
      try {
        var rec = await DCByok.chat([{ role: "user", content: asked || raw }]);
        if (rec && rec.ok && rec.content) return { grant: "XAI", spoken: rec.content.slice(0, 800), source: "byok" };
      } catch (e) {}
    }
    var wiki = await lookPerson(raw);
    if (wiki) return wiki;
    return { grant: "LOOK", spoken: "I could not finish a live look on this phone. Ask again with the person's name." };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", liftOrb);
  else liftOrb();
  w.DCLMLook = { version: VERSION, run: run, cleanQuery: cleanQuery, liftOrb: liftOrb };
})(window);
