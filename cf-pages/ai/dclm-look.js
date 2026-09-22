(function (w) {
  var VERSION = "dclm-look-2026-09-22-incumbent";
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
    return { grant: "MEASURE", source: "who", spoken: name + " is the " + hint.office + "." };
  }
  async function run(text) {
    var v = scanVeto(text);
    if (v) return { grant: "VETO", spoken: v };
    var raw = String(text || "");
    var hint = officeHint(raw);
    if (isWho(raw) || hint) {
      try {
        var who = await wikidataIncumbent(hint || officeHint(raw), timer(8000).signal);
        if (who) return who;
      } catch (e) {}
    }
    return { grant: "LOOK", spoken: "I could not get that from here. Ask another way." };
  }
  w.DCLMLook = { version: VERSION, run: run };
})(window);
