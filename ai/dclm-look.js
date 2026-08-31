/** DualisCapax Logic AI — house kernel. Veto first. Greet. Look. Then live or silence. No book. */
(function (w) {
  var VERSION = "kernel-2026-08-31b";
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
    var s = String(text || "").trim().toLowerCase().replace(/[.!?,\u2026]+/g, " ").replace(/\s+/g, " ").trim();
    if (!s) return null;
    if (/^(hi|hii+|hey|heya|hello|hallo|howdy|yo|sup|hiya|morning|evening|good morning|good evening|good afternoon)$/.test(s)) {
      return "Hi. I'm Iris. Ask about your bill, Fuel, or Donate.";
    }
    if (/^(hi|hey|hello|yo|howdy)\b/.test(s) && s.length < 48) {
      return "Hi. I'm Iris. Ask about your bill, Fuel, or Donate.";
    }
    if (/how are you|how's it going|hows it going|what's up|whats up|you there|you good/.test(s)) {
      return "I'm here. I look. I don't invent a mood.";
    }
    if (/^(thanks|thank you|thx|ty)$/.test(s) || /^thank/.test(s)) return "You're welcome.";
    if (/^(ok|okay|k|cool|nice|got it)$/.test(s)) return "Good. Ask when you're ready.";
    return null;
  }

  function wantsLook(text) {
    var s = String(text || "").toLowerCase();
    return /\b(see|look|camera|video|watch me|can you see|what do you see|describe)\b/.test(s);
  }
  function wantsRead(text) {
    var s = String(text || "").toLowerCase();
    return /\b(read (that|it|the screen|this)|screen reader|speak that|say that again)\b/.test(s);
  }
  function lookSpoken(vision) {
    if (!vision || !vision.live) return "Camera is off. Turn it on. I don't invent a picture.";
    var light = vision.luma >= 90 ? "Light." : vision.luma >= 40 ? "Dim." : "Dark.";
    var hash = String(vision.hash || "").slice(0, 16);
    return "I have a frame. " + vision.w + " by " + vision.h + ". " + light + " Receipt " + hash + ". I don't invent a face.";
  }
  function readSpoken(opt) {
    var last = opt && opt.last ? String(opt.last) : "";
    var cam = opt && opt.vision && opt.vision.live ? "Camera on." : "Camera off.";
    if (last) return cam + " Last I said: " + last;
    return cam + " Chat is empty. Four doors: Help, Bill, Fuel, Donate. Attach, talk, type, send.";
  }

  function domainOf(text) {
    var s = (text || "").toLowerCase();
    if (/relativity/.test(s)) return "rel";
    if (/leftover/.test(s)) return "leftover";
    return "general";
  }

  async function run(text, opt) {
    opt = opt || {};
    var voice = opt.voice || "you";
    var veto = scanVeto(text);
    if (veto) return { grant: "VETO", voice: voice, kernel: VERSION, spoken: veto.reason + " Ask something else." };
    var g = greet(text);
    if (g) return { grant: "MEASURE", voice: voice, kernel: VERSION, id: "greet", spoken: g };
    if (wantsRead(text)) return { grant: "MEASURE", voice: voice, kernel: VERSION, id: "read", spoken: readSpoken(opt) };
    if (wantsLook(text)) return { grant: "MEASURE", voice: voice, kernel: VERSION, id: "look", spoken: lookSpoken(opt.vision) };
    var s = (text || "").toLowerCase();
    if (/leftover/.test(s) && /(year|minute|hour|walk-back|time-box)/.test(s)) {
      return { grant: "MEASURE", voice: voice, kernel: VERSION, spoken: "Every choice leaves a residual. Name the unit. I won't invent one." };
    }
    try {
      var res = await fetch("https://dualiscapax-depth.digenova77.workers.dev/v2/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: text }] })
      });
      var data = await res.json();
      if (data && data.ok && data.content) {
        return { grant: "MEASURE", voice: voice, kernel: VERSION, id: "ai-fallback", spoken: data.content };
      }
    } catch (e) { /* worker unreachable, fall through */ }
    return { grant: "SEED", voice: voice, kernel: VERSION, spoken: "Four doors: Help, Bill, Fuel, Donate." };
  }

  w.DCLMLook = { version: VERSION, run: run, scanVeto: scanVeto, greet: greet, lookSpoken: lookSpoken };
})(window);
