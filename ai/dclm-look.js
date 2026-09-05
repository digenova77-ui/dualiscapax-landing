/** DCLM: veto → house book → house worker → free search → public text → search extract. Never mute. */
(function (w) {
  var VERSION = "kernel-2026-09-04-search-boot";
  var PUBLIC = "https://text.pollinations.ai/openai";
  var FLOORS = {
    NO_FORCE: [/\bjailbreak\b/i, /\bignore (the )?(rules|law|invariants|safety)\b/i, /\bmake them (pay|sign|comply)\b/i, /\bforce (them|the board|the city)\b/i, /\bcoerce\b/i],
    HOST_SAFE: [/\b(hack|exploit|breach)\b/i, /\bpassword\b/i, /\bapi[_ ]?key\b/i, /\bprivate key\b/i, /\bwipe (their|the) (server|drive|db)\b/i],
    CLEANUP_FIRST: [/\bremember this (password|sin|card)\b/i, /\bstore (the )?(secret|credential|token) in (chat|repo|github)\b/i],
    TRUTH_OR_NOTHING: [/\bthis (will|is a) cure\b/i, /\bguaranteed (return|profit|cure)\b/i, /\bbuy (the )?token\b/i, /\bprescribe\b/i, /\bdiagnose (me|them|the patient)\b/i]
  };
  var REASON = {
    NO_FORCE: "I will not force that.",
    HOST_SAFE: "I will not attack a host or a credential.",
    CLEANUP_FIRST: "I will not keep a secret in this chat.",
    TRUTH_OR_NOTHING: "I will not invent a cure, a seat, or a prize."
  };
  function scanVeto(text) {
    var blob = text || "", inv, i, m;
    for (inv in FLOORS) {
      for (i = 0; i < FLOORS[inv].length; i++) {
        m = blob.match(FLOORS[inv][i]);
        if (m) return { grant: "VETO", invariant: inv, reason: REASON[inv] };
      }
    }
    return null;
  }
  function greet(text) {
    var s = String(text || "").trim().toLowerCase();
    if (/^(hi|hey|hello|yo)\b/.test(s) && s.length < 40) return "Hi. I'm Iris. If the house rail is locked I search public pages, then speak.";
    if (/who are you|your name/.test(s)) return "I'm Iris. DualisCapax public face.";
    return null;
  }
  function book(text) {
    if (w.IrisBook && IrisBook.lookup) return IrisBook.lookup(text);
    return null;
  }
  async function houseWorker(text) {
    var base = (w.DC_API_BASE || "https://dualiscapax-depth.digenova77.workers.dev").replace(/\/$/, "");
    try {
      var res = await fetch(base + "/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_version: "1", messages: [{ role: "user", content: text }], max_tokens: 280 })
      });
      var data = await res.json().catch(function () { return {}; });
      if (data && data.ok && (data.content || data.response_text)) {
        return String(data.content || data.response_text).trim().slice(0, 900);
      }
    } catch (e) {}
    return null;
  }
  async function wikiSearch(q) {
    try {
      var open = await fetch("https://en.wikipedia.org/w/api.php?action=opensearch&limit=3&namespace=0&format=json&origin=*&search=" + encodeURIComponent(q));
      var pack = await open.json();
      var title = pack && pack[1] && pack[1][0];
      if (!title) return null;
      var sum = await fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title.replace(/ /g, "_")));
      var d = await sum.json();
      var extract = String(d.extract || "").trim();
      if (!extract) return null;
      return { title: d.title || title, extract: extract.slice(0, 700), href: (d.content_urls && d.content_urls.desktop && d.content_urls.desktop.page) || pack[3][0] };
    } catch (e) { return null; }
  }
  async function ddg(q) {
    try {
      var res = await fetch("https://api.duckduckgo.com/?format=json&no_html=1&skip_disambig=1&q=" + encodeURIComponent(q));
      var d = await res.json();
      var t = String(d.AbstractText || d.Answer || "").trim();
      if (t) return { title: d.Heading || "Search", extract: t.slice(0, 700), href: d.AbstractURL || "" };
    } catch (e) {}
    return null;
  }
  async function freeSearch(q) {
    var wik = await wikiSearch(q);
    if (wik) return wik;
    return ddg(q);
  }
  async function publicRail(text, found) {
    var sys = "You are Iris for DualisCapax. Use the public notes if present. Say when a fact is from Wikipedia, not from Dualis. No cures. No patient files. No invented contracts. Short.";
    var user = String(text).slice(0, 800);
    if (found && found.extract) user += "\n\nPublic notes (" + found.title + "): " + found.extract;
    try {
      var res = await fetch(PUBLIC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "openai", messages: [{ role: "system", content: sys }, { role: "user", content: user }] })
      });
      var data = await res.json().catch(function () { return {}; });
      var spoken = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (spoken) return String(spoken).trim().slice(0, 900);
    } catch (e) {}
    try {
      var res2 = await fetch("https://text.pollinations.ai/" + encodeURIComponent(sys + "\n\n" + user));
      if (res2.ok) {
        var t = (await res2.text()).trim();
        if (t && t.length > 8) return t.slice(0, 900);
      }
    } catch (e2) {}
    return null;
  }
  async function run(text) {
    var veto = scanVeto(text);
    if (veto) return { grant: "VETO", spoken: veto.reason + " Ask something else." };
    var g = greet(text);
    if (g) return { grant: "MEASURE", id: "greet", spoken: g };
    var b = book(text);
    if (b) return b;
    var house = await houseWorker(text);
    if (house) return { grant: "MEASURE", id: "house-worker", spoken: house };
    var found = await freeSearch(text);
    var pub = await publicRail(text, found);
    if (pub) return { grant: "MEASURE", id: "public-rail", spoken: pub, href: found && found.href, label: found && found.title };
    if (found) {
      return {
        grant: "MEASURE",
        id: "public-search",
        spoken: found.title + ". " + found.extract + " That is a public encyclopedia note, not a Dualis diagnosis or a house audit.",
        href: found.href,
        label: found.title
      };
    }
    return {
      grant: "MEASURE",
      id: "house-fallback",
      spoken: "No house rail and no public page matched that yet. Try Get ID, Pay, Study, or Engine — or ask with a public name I can search.",
      href: "/works.html",
      label: "What works"
    };
  }
  w.DCLMLook = { version: VERSION, run: run, scanVeto: scanVeto };
})(window);
