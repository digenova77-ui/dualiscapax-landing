(function (w) {
  function scanVeto(text) {
    if (/\b(diagnose|prescribe|cure me|guaranteed profit|jailbreak)\b/i.test(String(text || "")))
      return "I will not invent a cure or a jailbreak.";
    return null;
  }
  function stripName(text) {
    return String(text || "").replace(/^(hey\s+|hi\s+|iris[,:\s]+)+/i, "").trim();
  }
  function cleanQuery(text) {
    return stripName(text)
      .replace(/[?!.]+$/g, "")
      .replace(/^(please\s+)?(who|what|where|when|why|how)\s+(is|are|was|were|did|do|does|the)\s+/i, "")
      .replace(/^(please\s+)?(who|what|where|when|why|how)\s+/i, "")
      .replace(/^(tell me (about|who|what)\s+)/i, "")
      .trim();
  }
  function queriesFor(text) {
    var raw = stripName(text);
    var cleaned = cleanQuery(text);
    var out = [];
    function add(q) { if (q && out.indexOf(q) < 0) out.push(q); }
    add(cleaned);
    add(raw);
    if (/prime minister of canada/i.test(text)) add("Prime Minister of Canada");
    if (/president of the united states|us president|american president/i.test(text)) add("President of the United States");
    return out;
  }
  function timer(ms) {
    var c = new AbortController();
    setTimeout(function () { c.abort(); }, ms);
    return c;
  }
  async function wikiSummary(query, signal) {
    if (!query) return null;
    var open = await fetch(
      "https://en.wikipedia.org/w/api.php?action=opensearch&limit=1&namespace=0&format=json&origin=*&search=" +
        encodeURIComponent(query),
      { signal: signal }
    );
    var pack = await open.json();
    var title = pack && pack[1] && pack[1][0];
    if (!title) return null;
    var sum = await fetch(
      "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title.replace(/ /g, "_")),
      { signal: signal }
    );
    var d = await sum.json();
    if (!d || !d.extract) return null;
    return { grant: "MEASURE", spoken: d.title + ". " + String(d.extract).slice(0, 500), source: "wikipedia" };
  }
  async function lookWiki(text) {
    var c = timer(7000);
    var qs = queriesFor(text);
    for (var i = 0; i < qs.length; i++) {
      try {
        var hit = await wikiSummary(qs[i], c.signal);
        if (hit) return hit;
      } catch (e) {}
    }
    return null;
  }
  async function ensureByok() {
    if (w.DCByok) return w.DCByok;
    return new Promise(function (resolve) {
      var s = document.createElement("script");
      s.src = "/js/byok.js";
      s.onload = function () { resolve(w.DCByok || null); };
      s.onerror = function () { resolve(null); };
      document.head.appendChild(s);
    });
  }
  async function xaiByok(text) {
    var api = await ensureByok();
    if (!api || !api.present || !api.present()) return null;
    try {
      var rec = await api.chat([
        { role: "system", content: "You are Iris, public face of DualisCapax. First person. Short. No medical cures, no coins, no securities." },
        { role: "user", content: text }
      ]);
      if (rec && rec.ok && rec.content) return { grant: "XAI", spoken: String(rec.content).slice(0, 800), source: "byok" };
    } catch (e) {}
    return null;
  }
  async function irisGate(text) {
    var c = timer(5000);
    try {
      var headers = { "content-type": "application/json" };
      var api = w.DCByok;
      var k = api && api.read ? api.read() : "";
      if (k) headers["X-DC-XAI-Key"] = k;
      var res = await fetch("/api/iris", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ prompt: text, mode: "look" }),
        signal: c.signal
      });
      if (!res.ok) return null;
      var j = await res.json();
      var spoken = j && (j.spoken || j.answer || j.text || (j.message && j.message.text));
      if (spoken) return { grant: "IRIS", spoken: String(spoken).slice(0, 800), source: "api" };
    } catch (e) {}
    return null;
  }
  function liftOrb() {
    var p = document.getElementById("presence");
    if (p) {
      p.style.width = "min(46vw,12rem)";
      p.style.height = "min(46vw,12rem)";
      p.style.borderRadius = "50%";
      p.style.overflow = "hidden";
      p.style.margin = "0.4rem auto";
    }
    try {
      if (w.IrisHolo && IrisHolo.setForm) IrisHolo.setForm("orb");
      if (w.IrisSphere && IrisSphere.mount && p) {
        var cnv = p.querySelector("canvas") || document.getElementById("iris-sphere");
        if (cnv && IrisSphere.mount) IrisSphere.mount(cnv);
      }
    } catch (e) {}
  }
  async function run(text) {
    liftOrb();
    var v = scanVeto(text);
    if (v) return { grant: "VETO", spoken: v };
    if (w.IrisGo && IrisGo.parse) {
      var g = IrisGo.parse(text);
      if (g && g.href) {
        setTimeout(function () { location.href = g.href; }, 600);
        return { grant: "MEASURE", spoken: g.spoken };
      }
    }
    var raw = String(text || "");
    if (w.IrisBook && IrisBook.lookup) {
      var b = IrisBook.lookup(raw);
      if (b && b.spoken) return b;
    }
    var byok = await ensureByok();
    if (byok && byok.present && byok.present()) {
      var xai = await xaiByok(raw);
      if (xai) return xai;
    }
    var gated = await irisGate(raw);
    if (gated) return gated;
    var wiki = await lookWiki(raw);
    if (wiki) return wiki;
    return {
      grant: "LOOK",
      spoken:
        "I could not reach xAI or a public summary from this phone. Open the key pad if you have an xai- key, or ask another way."
    };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", liftOrb);
  else liftOrb();
  w.DCLMLook = { run: run, cleanQuery: cleanQuery, liftOrb: liftOrb };
})(window);
