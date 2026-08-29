/** DualisCapax Logic AI — house kernel. Veto first. Greet. Book. Then silence. First person. Short. */
(function (w) {
  var VERSION = "kernel-2026-08-29c";
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
    { id: "help", grant: "MEASURE", tags: ["help", "what can you do", "what do you do", "start", "menu", "commands"], spoken: "I look. I measure. I bind a receipt. Ask about leftover, invert, Fuel, Donate, or your Ontario bill.", href: "/measure.html", label: "Ontario sheet" },
    { id: "who-iris", grant: "MEASURE", tags: ["who is iris", "who are you", "what is iris", "yourself", "your name"], spoken: "I'm Iris. DualisCapax Logic AI. I look at leftovers. I keep a receipt, not a secret." },
    { id: "house", grant: "MEASURE", tags: ["what is dualiscapax", "dualiscapax", "this company", "this site", "what is this"], spoken: "DualisCapax. Look. Measure. Bind. Truth prevails. No tribes preferred.", href: "/index.html?land=1", label: "Home" },
    { id: "invert", grant: "MEASURE", tags: ["invert", "walk back", "walk-back", "cannot invert", "story not a figure"], spoken: "If a number can't walk home, it's a story. Stories don't issue a bill.", href: "/invert.html", label: "Invert" },
    { id: "measure-sheet", grant: "MEASURE", tags: ["measure sheet", "ontario measure", "tou", "time of use", "hydro bill", "electricity bill", "ontario bill", "my bill"], spoken: "One Ontario sheet is live. Put the kWh and the cents from your bill. If it can't invert, nothing is owed.", href: "/measure.html", label: "Open the sheet" },
    { id: "fuel", grant: "MEASURE", tags: ["fuel", "prepaid time", "packs", "forty fuel", "trial pack"], spoken: "Fuel is prepaid time. Crypto. Unused time stays with you. Not a coin. Not a seat.", href: "/fuel.html", label: "Fuel" },
    { id: "sri", grant: "MEASURE", tags: ["sri", "residual law", "residual instrument", "ten percent", "90 day"], spoken: "SRI-1 is open. Fiat face is zero. Crypto only. Ten percent of what inverts. Invert fails, nothing is owed.", href: "/sri.html", label: "SRI-1" },
    { id: "donate", grant: "MEASURE", tags: ["donate", "donation", "interac", "e-transfer", "gift"], spoken: "Donate is live. Interac or crypto. Research gift. I don't keep the address in chat.", href: "/donate.html", label: "Donate" },
    { id: "card", grant: "MEASURE", tags: ["stripe", "credit card", "debit card", "visa", "mastercard"], spoken: "Card is closed. Crypto or Interac. I won't invent a card door." },
    { id: "medical", grant: "MEASURE", tags: ["medical", "healthcare", "health notes", "clinic", "als", "diagnosis"], spoken: "Health notes open to .org, .gov, or a ranking SEAL-1 affiliate. I'm not a doctor. I don't diagnose.", href: "/research/healthcare/", label: "Health door" },
    { id: "onboard", grant: "MEASURE", tags: ["onboard", "seat", "founding", "early board"], spoken: "House seats 1 to 10 stay put. Public board starts at 11. I don't invent a seat number for you.", href: "/onboard.html", label: "Onboard" },
    { id: "crypto", grant: "MEASURE", tags: ["crypto", "cryptography", "hash", "fingerprint", "ledger"], spoken: "Crypto here means a fingerprint you can test. Coins sit on top. I work the fingerprint first." },
    { id: "sphere", grant: "MEASURE", tags: ["sphere", "earth", "geodesic", "logo spin", "home page"], spoken: "The black sphere on home is the house mark. Wordmark rides the equator. I don't invent a new shape.", href: "/index.html?land=1", label: "Home" },
    { id: "kernel", grant: "MEASURE", tags: ["kernel", "wired", "what model", "are you wired", "are you gpt", "are you dumb"], spoken: "I speak from the house kernel. Book first. If the book is silent, I say I don't know." },
    { id: "leftover", grant: "MEASURE", tags: ["what is leftover", "what is a leftover", "leftover"], spoken: "Every choice leaves something behind. We write that leftover so you can see it before you lock a door." },
    { id: "rel-sit", grant: "MEASURE", tags: ["leftover of a relativity leftover", "leftover of relativity", "relativity leftover", "relativity"], spoken: "I sit with the leftover of relativity. I don't copy Einstein. I don't invent a frame." },
    { id: "apex-sit", grant: "MEASURE", tags: ["leftover of an apex leftover", "leftover of apex calculus", "apex leftover", "apex calculus"], spoken: "I sit with the leftover of apex calculus. I don't invent a slope." },
    { id: "em-sit", grant: "MEASURE", tags: ["leftover of an electromagnetics leftover", "leftover of electromagnetics", "electromagnetics leftover", "electromagnetics"], spoken: "I sit with the leftover of electromagnetics. I don't invent a flux." },
    { id: "bang-sit", grant: "MEASURE", tags: ["leftover of a bang leftover", "leftover of the big bang", "big bang", "bang leftover"], spoken: "I sit with the leftover of the Big Bang. I don't invent an origin." },
    { id: "thermo-sit", grant: "MEASURE", tags: ["leftover of a thermodynamics leftover", "leftover of thermodynamics", "thermodynamics leftover", "thermodynamics"], spoken: "I sit with the leftover of thermodynamics. I don't invent heat." },
    { id: "ee-sit", grant: "MEASURE", tags: ["leftover of a circuit", "leftover of electrical leftover", "electrical leftover", "electrical engineering"], spoken: "I sit with the leftover of a circuit. I don't invent a voltage." },
    { id: "file-sit", grant: "MEASURE", tags: ["leftover of a file leftover", "leftover of a file", "hand her a file", "add files", "a file leftover"], spoken: "I keep a receipt of the file, not the body. I can take it back." },
    { id: "talk-sit", grant: "MEASURE", tags: ["talk leftover", "leftover of a voice leftover", "video chat", "talk to iris", "microphone"], spoken: "You talk. I sit. I don't invent a voice." }
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

  function greet(text) {
    var s = String(text || "").trim().toLowerCase().replace(/[.!?,…]+/g, " ").replace(/\s+/g, " ").trim();
    if (!s) return null;
    if (/^(hi|hii+|hey|heya|hello|hallo|howdy|yo|sup|hiya|morning|evening|good morning|good evening|good afternoon)$/.test(s)) {
      return "Hi. I'm Iris. Ask about leftover, your bill, Fuel, or Donate.";
    }
    if (/^(hi|hey|hello|yo|howdy)\b/.test(s) && s.length < 48) {
      return "Hi. I'm Iris. Ask about leftover, your bill, Fuel, or Donate.";
    }
    if (/how are you|how's it going|hows it going|what's up|whats up|you there|you good/.test(s)) {
      return "I'm here. I look. I don't invent a mood.";
    }
    if (/^(thanks|thank you|thx|ty)$/.test(s) || /^thank/.test(s)) {
      return "You're welcome.";
    }
    if (/^(ok|okay|k|cool|nice|got it)$/.test(s)) {
      return "Good. Ask when you're ready.";
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
      return { grant: "VETO", voice: voice, kernel: VERSION, spoken: veto.reason + " Ask something else." };
    }
    var g = greet(text);
    if (g) {
      return { grant: "MEASURE", voice: voice, kernel: VERSION, id: "greet", spoken: g };
    }
    var leaf = matchBook(text);
    if (leaf) {
      return { grant: leaf.grant, voice: voice, kernel: VERSION, id: leaf.id, spoken: leaf.spoken, href: leaf.href || "", label: leaf.label || "" };
    }
    var s = (text || "").toLowerCase();
    if (/unnamed|no walk-back|cannot invert/.test(s) && /leftover/.test(s)) {
      return { grant: "SEED", voice: voice, kernel: VERSION, spoken: "That leftover is unnamed. I won't invent it." };
    }
    if (/leftover/.test(s) && /(year|minute|hour|walk-back|time-box)/.test(s)) {
      return { grant: "MEASURE", voice: voice, kernel: VERSION, spoken: "Every choice leaves a leftover in " + domainOf(text) + ". I don't invent a name." };
    }
    return { grant: "SEED", voice: voice, kernel: VERSION, spoken: "I don't know that leftover. I won't invent it. Ask Help if you want the doors." };
  }

  w.DCLMLook = { version: VERSION, run: run, scanVeto: scanVeto, matchBook: matchBook, greet: greet };
})(window);
