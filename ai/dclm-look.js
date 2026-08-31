/** DualisCapax Logic AI — house kernel. Veto first. Greet. Look. House facts. Then live Grok if key is up. */
(function (w) {
  var VERSION = "kernel-2026-08-31c";
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
      return "Hi. I'm Iris — DualisCapax. Ask me anything about the firm, Fuel, Donate, or research. Short answers.";
    }
    if (/^(hi|hey|hello|yo|howdy)\b/.test(s) && s.length < 48) {
      return "Hi. I'm Iris. What do you need?";
    }
    if (/how are you|how's it going|hows it going|what's up|whats up|you there|you good/.test(s)) {
      return "I'm here. I look. I don't invent a mood. Ask a real question.";
    }
    if (/^(thanks|thank you|thx|ty)$/.test(s) || /^thank/.test(s)) return "You're welcome.";
    if (/^(ok|okay|k|cool|nice|got it)$/.test(s)) return "Good. Ask when you're ready.";
    if (/who are you|what are you|your name/.test(s)) {
      return "I'm Iris. Public face of DualisCapax. First person. Short. I don't invent cures or seats.";
    }
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
    if (!vision || !vision.live) return "Camera is off. Turn it on with the square button. I don't invent a picture.";
    var light = vision.luma >= 90 ? "Light." : vision.luma >= 40 ? "Dim." : "Dark.";
    var hash = String(vision.hash || "").slice(0, 16);
    return "I have a frame. " + vision.w + " by " + vision.h + ". " + light + " Receipt " + hash + ". I don't invent a face.";
  }
  function readSpoken(opt) {
    var last = opt && opt.last ? String(opt.last) : "";
    var cam = opt && opt.vision && opt.vision.live ? "Camera on." : "Camera off.";
    if (last) return cam + " Last I said: " + last;
    return cam + " Chat is empty. Try Help, Fuel, Donate, or Bind.";
  }

  /** House facts — no invention. Opens doors with real paths. */
  function house(text) {
    var s = String(text || "").toLowerCase();

    if (/what can you do|help|how do (i|you) work|what do you (know|cover)/.test(s)) {
      return {
        spoken: "I answer about DualisCapax: residual cost, Fuel (prepaid time), Donate, Bind checkout, Measure, research. I won't invent a cure or a securities offer. Depth model runs when the live key is up.",
        href: "/payments.html",
        label: "Bind"
      };
    }
    if (/dualiscapax|what is (this|the) (site|firm|company)|who (runs|owns)/.test(s)) {
      return {
        spoken: "DualisCapax is residual-law finance, edge tech, adaptive AI, and open research. Motto: Truth Prevails. Ontario corp. Simulation is not treatment. Not a coin. Not shares.",
        href: "/",
        label: "Home"
      };
    }
    if (/\bfuel\b|prepaid time|how much|price|cost|pack/.test(s) && !/fuelled|fueled/.test(s)) {
      return {
        spoken: "Fuel is prepaid time. Packs: CAD $20 → 40 Fuel, $50 → 120, $120 → 320. Unused stays with you. Checkout is open on Bind.",
        href: "/payments.html",
        label: "Bind"
      };
    }
    if (/pay|stripe|card|checkout|bind|buy/.test(s)) {
      return {
        spoken: "Card checkout is open. Fuel packs and document seats settle on Bind. Nothing here is an offer of securities.",
        href: "/payments.html",
        label: "Open Bind"
      };
    }
    if (/donat|gift|interac|give/.test(s)) {
      return {
        spoken: "Research gifts go through Donate — Interac e-transfer and listed crypto. No bank numbers on the page.",
        href: "/donate.html",
        label: "Donate"
      };
    }
    if (/measure|ontario|bill|hydro|tou|time.of.use/.test(s)) {
      return {
        spoken: "Ontario Measure is live — sheet DC-MS-ON-TOU-1. Look at a bill, write the figure, invert if it holds.",
        href: "/measure.html",
        label: "Measure"
      };
    }
    if (/medical|health|research|als|clinic/.test(s)) {
      return {
        spoken: "Health notes are open research under constraint. Simulation is not treatment. I will not diagnose or prescribe. Institutional .org / .gov paths and SEAL marks exist for deeper doors.",
        href: "/research/",
        label: "Research"
      };
    }
    if (/founding|seat|board|early.bird/.test(s)) {
      return {
        spoken: "Seats 1–10 are house and locked. Public early marks start at 11. Fuel bound to a seat is prepaid time. Names go up after a completed join.",
        href: "/donate.html",
        label: "Founding path"
      };
    }
    if (/singularity|hud|clock|live uptime|earned/.test(s)) {
      return {
        spoken: "HUD Live ages from launch 24 Aug 2026 UTC. Singularity base is 24 Aug 2036 unless pledged residual advances the clock. Earned stays CAD $0 until the ledger is verified."
      };
    }
    if (/residual|leftover|invert/.test(s)) {
      return {
        spoken: "Every decision leaves a residual. We measure it in your units. If the figure cannot invert to a proof you can hold, nothing is owed. That is the invert rule."
      };
    }
    if (/crypto|bitcoin|wallet|ledger/.test(s)) {
      return {
        spoken: "Crypto here means cryptography you can test — keys, hashes, signatures — then markets. Coins sit on top. Financial instruments that look like securities stay closed."
      };
    }
    if (/onboard|join|sign.?up/.test(s)) {
      return {
        spoken: "Onboard door is open. For prepaid time, Bind is the card path. Donate is gifts.",
        href: "/onboard.html",
        label: "Onboard"
      };
    }
    if (/sri|invert.or.zero/.test(s)) {
      return {
        spoken: "SRI-1 is open. Fiat face CAD $0. Crypto only. Invert-or-zero.",
        href: "/sri.html",
        label: "SRI-1"
      };
    }
    if (/iris|grok|gemini|model|ai engine|backend/.test(s)) {
      return {
        spoken: "I'm Iris. House kernel first — veto, greet, facts. Live depth is Grok behind our worker when the operator key is set. I won't invent answers with no model."
      };
    }
    if (/leftover/.test(s) && /(year|minute|hour|walk-back|time-box)/.test(s)) {
      return { spoken: "Every choice leaves a residual. Name the unit. I won't invent one." };
    }
    return null;
  }

  async function remoteWorker(text) {
    var base = (w.DC_API_BASE || "https://dualiscapax-depth.digenova77.workers.dev").replace(/\/$/, "");
    try {
      var res = await fetch(base + "/v2/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: text }], max_tokens: 400 })
      });
      var data = await res.json();
      if (data && data.ok && data.content) {
        return String(data.content).trim().slice(0, 900);
      }
    } catch (e) {}
    return null;
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
    var h = house(text);
    if (h) {
      return {
        grant: "MEASURE",
        voice: voice,
        kernel: VERSION,
        id: "house",
        spoken: h.spoken,
        href: h.href || null,
        label: h.label || null
      };
    }
    var remote = await remoteWorker(text);
    if (remote) return { grant: "MEASURE", voice: voice, kernel: VERSION, id: "ai-depth", spoken: remote };
    return {
      grant: "SEED",
      voice: voice,
      kernel: VERSION,
      spoken: "I don't have a live model answer for that yet. Try DualisCapax, Fuel, Donate, Bind, Measure, or research — I know those."
    };
  }

  w.DCLMLook = { version: VERSION, run: run, scanVeto: scanVeto, greet: greet, lookSpoken: lookSpoken };
})(window);
