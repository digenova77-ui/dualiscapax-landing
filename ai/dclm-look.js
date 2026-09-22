/**
 * Iris look. Public questions must work with no key.
 * Wiki has its own clock. xAI is an upgrade when a tab key exists.
 */
(function (w) {
  function scanVeto(text) {
    if (/\b(diagnose|prescribe|cure me|guaranteed profit|jailbreak)\b/i.test(String(text || "")))
      return "I will not invent a cure or a jailbreak.";
    return null;
  }
  function stripName(text) {
    return String(text || "")
      .replace(/^(hey\s+|hi\s+|hello\s+|iris)\s*[,:\-]?\s+/i, "")
      .trim();
  }
  function cleanQuery(text) {
    return stripName(text)
      .replace(/[?!.]+$/g, "")
      .replace(/^(please\s+)?(who|what|where|when|why|how)\s+(is|are|was|were|did|do|does|the)\s+/i, "")
      .replace(/^(please\s+)?(who|what|where|when|why|how)\s+/i, "")
      .replace(/^(tell me (about|who|what)\s+)/i, "")
      .trim();
  }
  function clock(ms) {
    var c = new AbortController();
    setTimeout(function () { try { c.abort(); } catch (e) {} }, ms);
    return c;
  }
  function wikiTitle(pack) {
    return pack && pack[1] && pack[1][0] ? pack[1][0] : "";
  }
  async function wikiSummary(query) {
    if (!query) return null;
    var c = clock(8000);
    var open = await fetch(
      "https://en.wikipedia.org/w/api.php?action=opensearch&limit=1&namespace=0&format=json&origin=*&search=" +
        encodeURIComponent(query),
      { signal: c.signal }
    );
    var pack = await open.json();
    var title = wikiTitle(pack);
    if (!title) return null;
    var sum = await fetch(
      "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title.replace(/ /g, "_")),
      { signal: c.signal }
    );
    var d = await sum.json();
    if (!d || !d.extract) return null;
    return { grant: "MEASURE", spoken: d.title + ". " + String(d.extract).slice(0, 520), source: "wikipedia" };
  }
  async function lookPublic(raw) {
    var cleaned = cleanQuery(raw);
    var tries = [];
    if (cleaned) tries.push(cleaned);
    var stripped = stripName(raw);
    if (stripped && tries.indexOf(stripped) < 0) tries.push(stripped);
    if (/prime minister/i.test(raw) && /canada/i.test(raw)) tries.unshift("Prime Minister of Canada");
    for (var i = 0; i < tries.length; i++) {
      try {
        var hit = await wikiSummary(tries[i]);
        if (hit) return hit;
      } catch (e) {}
    }
    return null;
  }
  async function xaiByok(text) {
    if (!(w.DCByok && DCByok.present && DCByok.present())) return null;
    try {
      var rec = await DCByok.chat([{ role: "user", content: text }], { max_tokens: 400 });
      if (rec && rec.ok && rec.content) return { grant: "XAI", spoken: String(rec.content).slice(0, 800), source: "byok" };
    } catch (e) {}
    return null;
  }
  async function irisGate(text) {
    try {
      var headers = { "content-type": "application/json", "X-DC-Client": "iris-lab" };
      var k = w.DCByok && DCByok.read ? DCByok.read() : "";
      if (k) headers.Authorization = "Bearer " + k;
      var c = clock(2500);
      var res = await fetch("/api/iris", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ prompt: text }),
        signal: c.signal
      });
      if (!res.ok) return null;
      var j = await res.json();
      var spoken = (j && (j.output || j.spoken || j.answer || j.text)) || "";
      if (spoken) return { grant: "IRIS", spoken: String(spoken).slice(0, 800), source: "api.iris" };
    } catch (e) {}
    return null;
  }
  async function run(text) {
    var v = scanVeto(text);
    if (v) return { grant: "VETO", spoken: v };
    var raw = String(text || "");
    var asked = stripName(raw);
    var isNav = /\b(go to|take me to|open|show)\s+[a-z]+/i.test(asked) || /^[a-z]+$/.test(asked.toLowerCase());
    if (isNav && w.IrisGo && IrisGo.parse) {
      var g = IrisGo.parse(asked);
      if (g && g.href) {
        setTimeout(function () { location.href = g.href; }, 600);
        return { grant: "MEASURE", spoken: g.spoken };
      }
    }
    if (w.IrisBook && IrisBook.lookup) {
      var b = IrisBook.lookup(asked);
      if (b && b.spoken) return b;
    }
    try {
      var fromXai = await xaiByok(asked);
      if (fromXai) return fromXai;
    } catch (e0) {}
    try {
      var fromGate = await irisGate(asked);
      if (fromGate) return fromGate;
    } catch (e1) {}
    try {
      var fromWiki = await lookPublic(raw);
      if (fromWiki) return fromWiki;
    } catch (e2) {}
    return {
      grant: "LOOK",
      spoken: "I could not reach Wikipedia from this phone and no xAI key is in this tab. Open wifi, or tap Key to paste an xai- key that stays in the browser."
    };
  }
  w.DCLMLook = { run: run, cleanQuery: cleanQuery, stripName: stripName, version: "look-wiki-first-2026-09-22" };
})(window);
