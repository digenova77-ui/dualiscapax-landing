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
  function wikiTitle(pack) {
    return pack && pack[1] && pack[1][0] ? pack[1][0] : "";
  }
  async function wikiSummary(query, signal) {
    if (!query) return null;
    var open = await fetch(
      "https://en.wikipedia.org/w/api.php?action=opensearch&limit=1&namespace=0&format=json&origin=*&search=" +
        encodeURIComponent(query),
      { signal: signal }
    );
    var pack = await open.json();
    var title = wikiTitle(pack);
    if (!title) return null;
    var sum = await fetch(
      "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title.replace(/ /g, "_")),
      { signal: signal }
    );
    var d = await sum.json();
    if (!d || !d.extract) return null;
    return { grant: "MEASURE", spoken: d.title + ". " + String(d.extract).slice(0, 500), source: "wikipedia" };
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
  async function irisGate(text, signal) {
    try {
      var headers = { "content-type": "application/json" };
      var api = w.DCByok;
      var k = api && api.read ? api.read() : "";
      if (k) headers["X-DC-XAI-Key"] = k;
      var res = await fetch("/api/iris", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ prompt: text, mode: "look" }),
        signal: signal
      });
      if (!res.ok) return null;
      var j = await res.json();
      var spoken = j && (j.spoken || j.answer || j.text || (j.message && j.message.text));
      if (spoken) return { grant: "IRIS", spoken: String(spoken).slice(0, 800), source: "api" };
    } catch (e) {}
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
    var raw = String(text || "");
    if (w.IrisBook && IrisBook.lookup) {
      var b = IrisBook.lookup(raw);
      if (b && b.spoken) return b;
    }
    var c = new AbortController();
    setTimeout(function () { c.abort(); }, 8000);
    var xai = await xaiByok(raw);
    if (xai) return xai;
    var gated = await irisGate(raw, c.signal);
    if (gated) return gated;
    try {
      var cleaned = cleanQuery(raw);
      var hit = await wikiSummary(cleaned, c.signal);
      if (!hit && cleaned !== raw) hit = await wikiSummary(stripName(raw), c.signal);
      if (hit) return hit;
    } catch (e) {}
    return {
      grant: "LOOK",
      spoken:
        "No xAI key in this tab and the house rail did not answer. I also missed a public summary. Add a key on the lab, or ask another way. Dualis rooms: pay, law, compute, study."
    };
  }
  w.DCLMLook = { run: run, cleanQuery: cleanQuery };
})(window);
