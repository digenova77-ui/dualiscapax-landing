(function (w) {
  var VERSION = "dclm-look-2026-09-22-clerk";
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
    if (/prime minister of canada|canadian prime minister|pm of canada/.test(s)) return { qid: "Q16", prop: "P6", office: "prime minister of Canada" };
    if (/president of the united states|us president|american president|president of america/.test(s)) return { qid: "Q30", prop: "P6", office: "president of the United States" };
    if (/prime minister of the united kingdom|uk prime minister|british prime minister/.test(s)) return { qid: "Q145", prop: "P6", office: "prime minister of the United Kingdom" };
    return null;
  }
  function timer(ms) {
    var c = new AbortController();
    setTimeout(function () { c.abort(); }, ms);
    return c;
  }
  function pickClaim(list) {
    if (!list || !list.length) return null;
    var i, row, open = [], pref = [];
    for (i = 0; i < list.length; i++) {
      row = list[i];
      if (!row || row.rank === "deprecated") continue;
      var ended = !!(row.qualifiers && row.qualifiers.P582);
      if (row.rank === "preferred" && !ended) pref.push(row);
      if (!ended) open.push(row);
    }
    return pref[0] || open[open.length - 1] || open[0] || null;
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
  function speakPerson(name, office) {
    var n = String(name || "").replace(/\s+\(.+\)\s*$/, "");
    return { grant: "MEASURE", source: "who", spoken: n + " is the " + office + ".", lane: "LOOK" };
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
    var row = pickClaim(claims && claims[hint.prop]);
    var id = row && row.mainsnak && row.mainsnak.datavalue && row.mainsnak.datavalue.value && row.mainsnak.datavalue.value.id;
    if (!id) return null;
    var lab = await fetch(
      "https://www.wikidata.org/w/api.php?action=wbgetentities&ids=" +
        encodeURIComponent(id) +
        "&props=labels&languages=en&format=json&origin=*",
      { signal: signal }
    );
    var person = await lab.json();
    var e = person && person.entities && person.entities[id];
    var name = e && e.labels && e.labels.en && e.labels.en.value;
    if (!name) return null;
    return speakPerson(name, hint.office);
  }
  async function lookWho(text) {
    var c = timer(8000);
    var hint = officeHint(text);
    try {
      if (hint) {
        var wd = await wikidataIncumbent(hint, c.signal);
        if (wd) return wd;
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
      if (page) return { grant: "MEASURE", source: "wikipedia", spoken: page.title + ". " + String(page.extract).slice(0, 280), lane: "LOOK" };
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
        { role: "system", content: "You are Iris. First person. Short. Current officeholders only. No medical cures, no coins. Do not invent incumbents." },
        { role: "user", content: text }
      ]);
      if (rec && rec.ok && rec.content) return { grant: "XAI", spoken: String(rec.content).slice(0, 400), source: "byok", lane: "DEPTH" };
    } catch (e) {}
    return null;
  }
  function ticketOf(text, ticket) {
    if (ticket && ticket.grade) return ticket;
    if (w.IrisFuel && IrisFuel.admit) return IrisFuel.admit(text);
    return { ok: true, paid: false, grade: { lane: "LOOK", burn: 0, grant: "LOOK" } };
  }
  async function run(text, ticket) {
    var v = scanVeto(text);
    if (v) return { grant: "VETO", spoken: v, lane: "VETO" };
    var raw = String(text || "");
    if (w.IrisPage && IrisPage.explain) {
      var here = IrisPage.explain(raw);
      if (here) { here.lane = here.lane || "HERE"; return here; }
    }
    if (w.IrisBook && IrisBook.lookup) {
      var b = IrisBook.lookup(raw);
      if (b && b.spoken) { b.lane = b.lane || "BOOK"; return b; }
    }
    if (isWho(raw) || officeHint(raw)) {
      var who = await lookWho(raw);
      if (who) return who;
    }
    var wiki = await wikiOffice(raw);
    if (wiki) return wiki;
    var pass = ticketOf(raw, ticket);
    var lane = pass.grade && pass.grade.lane;
    if (lane === "DEPTH") {
      if (!pass.ok && pass.deny) return pass.deny;
      var xai = await xaiByok(raw);
      if (xai) {
        xai.ticket = pass;
        if (w.CosmicRuntime && CosmicRuntime.step) {
          try { xai.runtime = CosmicRuntime.step(); } catch (e) {}
        }
        return xai;
      }
      return {
        grant: "DEPTH",
        lane: "DEPTH",
        spoken: "Depth is open but I have no model key on this tab. Add an xAI key or ask another way.",
        ticket: pass
      };
    }
    return {
      grant: "LOOK",
      lane: "LOOK",
      spoken: "I could not get that from here. Ask another way."
    };
  }
  w.DCLMLook = { version: VERSION, run: run };
})(window);
