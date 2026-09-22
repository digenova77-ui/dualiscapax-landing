(function (w) {
  function scanVeto(text) {
    if (/\b(diagnose|prescribe|cure me|guaranteed profit|jailbreak)\b/i.test(String(text || "")))
      return "I will not invent a cure or a jailbreak.";
    return null;
  }

  function cleanQuery(text) {
    return String(text || "")
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

  async function irisGate(text, signal) {
    try {
      var res = await fetch("/api/iris", {
        method: "POST",
        headers: { "content-type": "application/json" },
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
    var s = raw.toLowerCase();
    if (/speed of light/.test(s)) return { grant: "MEASURE", spoken: "About 299,792,458 metres per second in a vacuum." };
    if (w.IrisBook && IrisBook.lookup) {
      var b = IrisBook.lookup(raw);
      if (b && b.spoken) return { grant: "MEASURE", spoken: b.spoken };
    }
    var c = new AbortController();
    setTimeout(function () { c.abort(); }, 6000);
    var cleaned = cleanQuery(raw);
    try {
      var hit = await wikiSummary(cleaned, c.signal);
      if (!hit && cleaned !== raw) hit = await wikiSummary(raw, c.signal);
      if (hit) return hit;
    } catch (e) {}
    var gated = await irisGate(raw, c.signal);
    if (gated) return gated;
    return {
      grant: "LOOK",
      spoken:
        "I could not fetch a public summary from this phone. I can still open Dualis rooms — say go to pay, law, compute, study, or rooms — or ask the question another way."
    };
  }
  w.DCLMLook = { run: run, cleanQuery: cleanQuery };
})(window);
