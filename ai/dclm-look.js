/** DCLM: veto → house book → house worker → public free text API → last book line. */
(function (w) {
  var VERSION = "kernel-2026-09-04-public-rail";
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
    if (/^(hi|hey|hello|yo)\b/.test(s) && s.length < 48) return "Hi. I'm Iris. House first. Public text rail if the house is locked.";
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
  async function publicRail(text) {
    var sys = "You are Iris for DualisCapax. Looking is free. Unity ID is free. Engine time is paid. Do not invent cures, patient files, live webhooks, or contract addresses. Short plain speech.";
    try {
      var res = await fetch(PUBLIC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai",
          messages: [
            { role: "system", content: sys },
            { role: "user", content: String(text).slice(0, 1200) }
          ]
        })
      });
      var data = await res.json().catch(function () { return {}; });
      var spoken = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (spoken) return String(spoken).trim().slice(0, 900);
    } catch (e) {}
    try {
      var res2 = await fetch("https://text.pollinations.ai/" + encodeURIComponent(sys + "\n\nUser: " + String(text).slice(0, 800)));
      if (res2.ok) {
        var t = (await res2.text()).trim();
        if (t && t.length > 2 && t.length < 2000) return t.slice(0, 900);
      }
    } catch (e2) {}
    return null;
  }
  async function run(text, opt) {
    var veto = scanVeto(text);
    if (veto) return { grant: "VETO", spoken: veto.reason + " Ask something else." };
    var g = greet(text);
    if (g) return { grant: "MEASURE", id: "greet", spoken: g };
    var b = book(text);
    if (b) return b;
    var house = await houseWorker(text);
    if (house) return { grant: "MEASURE", id: "house-worker", spoken: house };
    var pub = await publicRail(text);
    if (pub) return { grant: "MEASURE", id: "public-rail", spoken: pub };
    return {
      grant: "MEASURE",
      id: "house-fallback",
      spoken: "House worker is locked and the public text rail did not answer. Open Get ID, Pay, Study, or Engine on this site.",
      href: "/works.html",
      label: "What works"
    };
  }
  w.DCLMLook = { version: VERSION, run: run, scanVeto: scanVeto };
})(window);
