/** DualisCapax Logic AI — house kernel. Veto first. Greet. Look. Live model. House facts only if the rail is down. */
(function (w) {
  var VERSION = "kernel-2026-09-01a";
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
      return "Hi. I'm Iris. Ask me like you would a person at the table — Fuel, Bind, a bill, the firm.";
    }
    if (/^(hi|hey|hello|yo|howdy)\b/.test(s) && s.length < 48) {
      return "Hi. I'm Iris. What do you need?";
    }
    if (/how are you|how's it going|hows it going|what's up|whats up|you there|you good/.test(s)) {
      return "I'm here. Ask a real question and I'll answer in full, not in slogans.";
    }
    if (/^(thanks|thank you|thx|ty)$/.test(s) || /^thank/.test(s)) return "You're welcome.";
    if (/^(ok|okay|k|cool|nice|got it)$/.test(s)) return "Good. Ask when you're ready.";
    if (/who are you|what are you|your name/.test(s)) {
      return "I'm Iris. Public face of DualisCapax. I speak in first person. I don't invent cures or seats.";
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

  function house(text) {
    var s = String(text || "").toLowerCase();
    if (/\bfuel\b|prepaid time|how much|price|cost|pack/.test(s) && !/fuelled|fueled/.test(s)) {
      return { spoken: "Fuel is prepaid time, like a transit pass you load before the ride. Packs: CAD $20 \u2192 40 Fuel, $50 \u2192 120, $120 \u2192 320. Unused stays with you.", href: "/payments.html", label: "Bind" };
    }
    if (/pay|stripe|card|checkout|bind|buy/.test(s)) {
      return { spoken: "Bind is the checkout counter. You pay first, then the time is yours. Not a share. Not a coin.", href: "/payments.html", label: "Open Bind" };
    }
    if (/donat|gift|interac|give/.test(s)) {
      return { spoken: "Donate is a gift with no ticket back. Interac e-transfer and listed crypto. No bank numbers on the page.", href: "/donate.html", label: "Donate" };
    }
    return null;
  }

  async function remoteWorker(text) {
    var base = (w.DC_API_BASE || "https://dualiscapax-depth.digenova77.workers.dev").replace(/\/$/, "");
    try {
      var res = await fetch(base + "/v2/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-DC-Fuel": "1" },
        body: JSON.stringify({
          api_version: "2",
          max_tokens: 220,
          messages: [{ role: "user", content: text }]
        })
      });
      var data = await res.json();
      if (data && data.ok && (data.content || data.response_text)) {
        return String(data.content || data.response_text).trim().slice(0, 900);
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
    var remote = await remoteWorker(text);
    if (remote) return { grant: "MEASURE", voice: voice, kernel: VERSION, id: "ai-depth", spoken: remote };
    var h = house(text);
    if (h) {
      return { grant: "MEASURE", voice: voice, kernel: VERSION, id: "house", spoken: h.spoken, href: h.href || null, label: h.label || null };
    }
    return { grant: "SEED", voice: voice, kernel: VERSION, spoken: "The live rail did not answer. Ask DualisCapax, Fuel, Donate, Bind, or Measure and I will use the house line until credit is back." };
  }

  w.DCLMLook = { version: VERSION, run: run, scanVeto: scanVeto, greet: greet, lookSpoken: lookSpoken };
})(window);
