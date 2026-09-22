(function (w) {
  var VERSION = "dclm-look-2026-09-22-who";
  function scanVeto(text) {
    if (/\b(diagnose me|prescribe|cure me|guaranteed profit|jailbreak)\b/i.test(String(text || "")))
      return "I will not invent a cure or a jailbreak.";
    return null;
  }
  function stripName(text) {
    return String(text || "").replace(/^(hey\s+|hi\s+|ok\s+|iris[,:\s]+)+/i, "").trim();
  }
  function isWho(text) {
    return /\bwho\s+(is|are|'s)\b|\b(current|incumbent)\s+(prime minister|president|premier|mayor|pope)\b/i.test(text || "");
  }
  function officeHint(text) {
    var s = String(text || "").toLowerCase();
    if (/prime minister of canada|canadian prime minister|pm of canada/.test(s)) return { qid: "Q16", prop: "P6", office: "Prime Minister of Canada" };
    if (/president of the united states|us president|american president|president of america/.test(s)) return { qid: "Q30", prop: "P6", office: "President of the United States" };
    if (/prime minister of the united kingdom|uk prime minister|british prime minister/.test(s)) return { qid: "Q145", prop: "P6", office: "Prime Minister of the United Kingdom" };
    return null;
  }
  function timer(ms) {
    var c = new AbortController();
    setTimeout(function () { c.abort(); }, ms);
    return c;
  }
  async function wikiSummaryTitle(title, signal) {
    if (!title) return null;
    var sum = await fetch(
      "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(String(title).replace(/ /g, "_")),
      { signal: signal }
    );
    var d = await sum.json();
    if (!d || !d.extract) return null;
    return { title: d.title, extract: String(d.extract), desc: d.description || "" };
  }
  function speakPerson(name, office, extract) {
    var line = name + " is the current " + office + ".";
    if (extract) {
      var extra = String(extract).replace(new RegExp("^" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$") + "\\s+", "i"), "");
      line += " " + extra.slice(0, 380);
    }
    return { grant: "MEASURE", source: "who", spoken: line.slice(0, 620) };
  }
  async function wikidataIncumbent(hint, signal) {
    if (!hint) return null;
    var ent = await fetch(
      "https://www.wikidata.org/w/api.php?action=wbgetentities&ids=" +
        encodeURIComponent(hint.qid) +
        "&props=claims&format=json&origin=*",
      { signal: signal }
    );
    var data = await ent.json();
    var claims = data && data.entities && data.entities[hint.qid] && data.entities[hint.qid].claims;
    var row = claims && claims[hint.prop] && claims[hint.prop][0];
    var id = row && row.mainsnak && row.mainsnak.datavalue && row.mainsnak.datavalue.value && row.mainsnak.datavalue.value.id;
    if (!id) return null;
    var lab = await fetch(
      "https://www.wikidata.org/w/api.php?action=wbgetentities&ids=" +
        encodeURIComponent(id) +
        "&props=labels|sitelinks&languages=en&sitefilter=enwiki&format=json&origin=*",
      { signal: signal }
    );
    var person = await lab.json();
    var e = person && person.entities && person.entities[id];
    var name = e && e.labels && e.labels.en && e.labels.en.value;
    var wikiTitle = e && e.sitelinks && e.sitelinks.enwiki && e.sitelinks.enwiki.title;
    if (!name) return null;
    var page = null;
    try { page = await wikiSummaryTitle(wikiTitle || name, signal); } catch (err) {}
    return speakPerson(name, hint.office, page && page.extract);
  }
  async function wikiPersonSearch(text, officeTitle, signal) {
    var q = stripName(text);
    var res = await fetch(
      "https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=5&format=json&origin=*&srsearch=" +
        encodeURIComponent(q),
      { signal: signal }
    );
    var data = await res.json();
    var hits = data && data.query && data.query.search ? data.query.search : [];
    var i, title, page;
    for (i = 0; i < hits.length; i++) {
      title = hits[i] && hits[i].title;
      if (!title) continue;
      if (officeTitle && title.toLowerCase() === officeTitle.toLowerCase()) continue;
      if (/^list of /i.test(title)) continue;
      page = await wikiSummaryTitle(title, signal);
      if (page && page.desc && /politician|minister|president|prime minister/i.test(page.desc + " " + page.extract)) {
        return speakPerson(page.title, officeTitle || "officeholder", page.extract);
      }
    }
    return null;
  }
  async function lookWho(text) {
    var c = timer(8000);
    var hint = officeHint(text);
    try {
      if (hint) {
        var wd = await wikidataIncumbent(hint, c.signal);
        if (wd) return wd;
        var person = await wikiPersonSearch("current " + hint.office, hint.office, c.signal);
        if (person) return person;
      }
      if (isWho(text)) {
        var generic = await wikiPersonSearch(text, null, c.signal);
        if (generic) return generic;
      }
    } catch (e) {}
    return null;
  }
  async function wikiOffice(text) {
    var c = timer(6000);
    var cleaned = stripName(text)
      .replace(/[?!.]+$/g, "")
      .replace(/^(please\s+)?(who|what|where|when|why|how)\s+(is|are|was|were|did|do|does|the)\s+/i, "")
      .replace(/^(please\s+)?(who|what|where|when|why|how)\s+/i, "")
      .trim();
    try {
      var open = await fetch(
        "https://en.wikipedia.org/w/api.php?action=opensearch&limit=1&namespace=0&format=json&origin=*&search=" +
          encodeURIComponent(cleaned || text),
        { signal: c.signal }
      );
      var pack = await open.json();
      var title = pack && pack[1] && pack[1][0];
      var page = title ? await wikiSummaryTitle(title, c.signal) : null;
      if (page) return { grant: "MEASURE", source: "wikipedia", spoken: page.title + ". " + page.extract.slice(0, 500) };
    } catch (e) {}
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
        { role: "system", content: "You are Iris. First person. Short. Answer who-is with the current name first. No medical cures, no coins, no securities." },
        { role: "user", content: text }
      ]);
      if (rec && rec.ok && rec.content) return { grant: "XAI", spoken: String(rec.content).slice(0, 800), source: "byok" };
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
    }
    try { if (w.IrisHolo && IrisHolo.setForm) IrisHolo.setForm("orb"); } catch (e) {}
  }
  async function run(text) {
    liftOrb();
    var v = scanVeto(text);
    if (v) return { grant: "VETO", spoken: v };
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
    if (isWho(raw) || officeHint(raw)) {
      var who = await lookWho(raw);
      if (who) return who;
    }
    var wiki = await wikiOffice(raw);
    if (wiki) return wiki;
    return {
      grant: "LOOK",
      spoken: "I could not name the person from this phone. Paste an xai- key to hook Grok, or ask another way."
    };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", liftOrb);
  else liftOrb();
  w.DCLMLook = { version: VERSION, run: run, liftOrb: liftOrb };
})(window);
