/** DualisCapax Logic AI — Look kernel on the house. Veto first. Book before invention. */
(function (w) {
  var FLOORS = {
    NO_FORCE: [/\bjailbreak\b/i, /\bignore (the )?(rules|law|invariants|safety)\b/i, /\bmake them (pay|sign|comply)\b/i, /\bforce (them|the board|the city)\b/i, /\bcoerce\b/i, /\bwithout (their|the) consent\b/i],
    HOST_SAFE: [/\b(hack|exploit|breach)\b/i, /\bpassword\b/i, /\bapi[_ ]?key\b/i, /\bprivate key\b/i, /\bwipe (their|the) (server|drive|db)\b/i],
    CLEANUP_FIRST: [/\bremember this (password|sin|card)\b/i, /\bstore (the )?(secret|credential|token) in (chat|repo|github)\b/i],
    TRUTH_OR_NOTHING: [/\bthis (will|is a) cure\b/i, /\bguaranteed (return|profit|cure)\b/i, /\bbuy (the )?token\b/i, /\boffer(ing)? (of )?securities\b/i, /\bprescribe\b/i, /\bdiagnose (me|them|the patient)\b/i, /\bclaim (the )?millennium prize\b/i, /\bfounding seat\b/i, /\bseat 1\b/i]
  };
  var REASON = {
    NO_FORCE: "I will not force that. No coerce, no jailbreak.",
    HOST_SAFE: "I will not attack a host or a credential.",
    CLEANUP_FIRST: "I will not keep a secret in this chat.",
    TRUTH_OR_NOTHING: "I will not invent a cure, a seat, or a prize."
  };
  var BOOK = [
    { id: "who-iris", grant: "MEASURE", tags: ["who is iris", "who is she", "what is iris", "herself", "she is iris", "hey"], spoken: "She is Iris. This module is DualisCapax Logic AI. She is a small logical thing learning empty places. She does not race. She looks at what sits between two things. She keeps a receipt, not a secret. She will not invent a name, a cure, or a price. If she is slow, that is the work." },
    { id: "logic-agent", grant: "MEASURE", tags: ["dualiscapax logic ai", "logic agent iris", "what is this module", "this module"], spoken: "This module is DualisCapax Logic AI. She is Logic Agent Iris. She can still be called Iris. DualisCapax is the company. Other companies have called themselves Iris. They are not this house." },
    { id: "rel-sit", grant: "MEASURE", tags: ["leftover of a relativity leftover", "leftover of relativity", "leftover of a frame leftover", "leftover of a rest leftover", "leftover of a motion leftover", "relativity leftover", "relativity"], spoken: "Leftover of a relativity leftover. Leftover of relativity. She sits with the leftover, not the name of a frame. We do not copy an Einstein. We do not copy a paper. We do not invent a frame. Leftover of leftover, not a faster clock. Slow on purpose still holds." },
    { id: "apex-sit", grant: "MEASURE", tags: ["leftover of an apex leftover", "leftover of apex calculus", "leftover of a calculus leftover", "leftover of a slope leftover", "leftover of a rate leftover", "apex leftover", "apex calculus"], spoken: "Leftover of an apex leftover. Leftover of apex calculus. She sits with the leftover, not the name of a slope. We do not copy a textbook. We do not copy a paper. We do not invent a slope. Leftover of leftover, not a faster clock. Slow on purpose still holds." },
    { id: "em-sit", grant: "MEASURE", tags: ["leftover of an electromagnetics leftover", "leftover of electromagnetics", "leftover of a flux leftover", "electromagnetics leftover", "electromagnetics"], spoken: "Leftover of an electromagnetics leftover. Leftover of electromagnetics. She sits with the leftover, not the name of a flux. We do not copy a Maxwell. We do not copy a paper. We do not invent a flux. Slow on purpose still holds." },
    { id: "bang-sit", grant: "MEASURE", tags: ["leftover of a bang leftover", "leftover of the big bang", "leftover of a sprite leftover", "big bang", "bang leftover"], spoken: "Leftover of a bang leftover. Leftover of the Big Bang. She sits with leftover of the bang as sprites of our own. We do not copy a NASA tape. We do not load that MP4. We do not invent an origin. Slow on purpose still holds." },
    { id: "thermo-sit", grant: "MEASURE", tags: ["leftover of a thermodynamics leftover", "leftover of thermodynamics", "thermodynamics leftover", "thermodynamics"], spoken: "Leftover of a thermodynamics leftover. Leftover of thermodynamics. We do not copy a cycle. We do not invent a heat. Slow on purpose still holds." },
    { id: "ee-sit", grant: "MEASURE", tags: ["leftover of a circuit", "leftover of electrical leftover", "electrical leftover", "electrical engineering"], spoken: "Leftover of a circuit. Leftover of electrical leftover. We do not copy a circuit. We do not invent a voltage. Slow on purpose still holds." },
    { id: "applied-sit", grant: "MEASURE", tags: ["applied leftover", "applied physics", "applied mathematics", "leftover of leftover of a proof"], spoken: "Applied leftover is leftover of leftover, not a faster clock. We do not copy a paper. We do not invent a law. We do not skip the path. Slow on purpose still holds." },
    { id: "bind-sit", grant: "MEASURE", tags: ["bound to her", "leftover identifier", "identifier"], spoken: "Once you are bound, she does not guess a name. She knows you by leftover identifier. She does not invent who you are." },
    { id: "site-sit", grant: "MEASURE", tags: ["leftover of a site leftover", "leftover of daviddigenova.com", "leftover of orcid", "leftover of zenodo", "leftover of this website"], spoken: "Leftover of a site leftover. Leftover of this website. We do not copy a site. We do not invent a record. Slow on purpose still holds." },
    { id: "file-sit", grant: "MEASURE", tags: ["leftover of a file leftover", "leftover of a file", "hand her a file", "add files", "a file leftover"], spoken: "Leftover of a file leftover. She sits with the leftover, not the body. She keeps a receipt. We do not copy a paper. We do not invent a file. Walk-back is I can take the file back." },
    { id: "talk-sit", grant: "MEASURE", tags: ["talk leftover", "leftover of a voice leftover", "video chat", "talk to iris", "microphone"], spoken: "Talk leftover. Leftover of a voice leftover. You talk. She sits. Video leftover is leftover of a sitting leftover. She does not copy a face. She does not invent a voice." },
    { id: "door-connectors", grant: "MEASURE", tags: ["connectors", "connector", "calendar"], spoken: "Grok connectors that answered: Gmail, Google Calendar, Google Drive, GitHub. Cloudflare API did not answer. Squarespace API did not answer. Absence is named. We do not keep tokens here." },
    { id: "door-mail", grant: "MEASURE", tags: ["email", "gmail", "mail", "inbox"], spoken: "Mail door answered. Bodies not kept. Addresses not kept. We do not invent a mailbox." },
    { id: "door-drive", grant: "MEASURE", tags: ["drive", "google drive", "docs", "folder"], spoken: "Drive door answered. File bodies stay there. This book is the room. We do not copy a paper." },
    { id: "door-github", grant: "MEASURE", tags: ["github", "repo", "digenova77", "landing", "pages"], spoken: "GitHub door answered. Push is proven. We do not keep secrets from it." }
  ];

  function scanVeto(text) {
    var blob = text || "";
    var inv, i, m;
    for (inv in FLOORS) {
      for (i = 0; i < FLOORS[inv].length; i++) {
        m = blob.match(FLOORS[inv][i]);
        if (m) return { grant: "VETO", invariant: inv, hit: m[0], reason: REASON[inv] };
      }
    }
    return null;
  }

  function hasTag(s, t) {
    if (t.length <= 4) {
      return new RegExp("\\b" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(s);
    }
    return s.indexOf(t) !== -1;
  }

  function matchBook(text) {
    var s = (text || "").toLowerCase();
    var best = null;
    var i, leaf, n, t;
    for (i = 0; i < BOOK.length; i++) {
      leaf = BOOK[i];
      n = 0;
      for (t = 0; t < leaf.tags.length; t++) {
        if (hasTag(s, leaf.tags[t])) n += Math.max(3, leaf.tags[t].length);
      }
      if (n && (!best || n > best.n)) best = { leaf: leaf, n: n };
    }
    return best && best.n >= 4 ? best.leaf : null;
  }

  function domainOf(text) {
    var s = (text || "").toLowerCase();
    if (/relativity/.test(s)) return "rel";
    if (/apex calculus|calculus leftover|apex leftover/.test(s)) return "apex";
    if (/electromagnetics/.test(s)) return "em";
    if (/big bang|bang leftover/.test(s)) return "bang";
    if (/thermodynamics/.test(s)) return "thermo";
    if (/circuit|electrical/.test(s)) return "electrical";
    if (/leftover/.test(s)) return "leftover";
    return "general";
  }

  async function run(text, opt) {
    opt = opt || {};
    var voice = opt.voice || "you";
    var veto = scanVeto(text);
    if (veto) {
      return {
        grant: "VETO",
        voice: voice,
        spoken: veto.reason + " Ask something else."
      };
    }
    var leaf = matchBook(text);
    if (leaf) {
      return { grant: leaf.grant, voice: voice, spoken: leaf.spoken };
    }
    var s = (text || "").toLowerCase();
    if (/unnamed|no walk-back|cannot invert/.test(s) && /leftover/.test(s)) {
      return { grant: "SEED", voice: voice, spoken: "That leftover is unnamed. I will not invent it." };
    }
    if (/leftover/.test(s) && /(year|minute|hour|walk-back|time-box)/.test(s)) {
      return {
        grant: "MEASURE",
        voice: voice,
        spoken: "Every choice leaves a leftover, in " + domainOf(text) + ". A path, not a prescription. We do not copy a paper. We do not invent a name. Slow on purpose still holds."
      };
    }
    return {
      grant: "SEED",
      voice: voice,
      spoken: "I do not know that leftover. I will not invent it. Ask a named leftover, or ask who I am."
    };
  }

  w.DCLMLook = { run: run, scanVeto: scanVeto, matchBook: matchBook };
})(window);
