/** DCLM on this device: veto, greet, book, then remote. Remote down still answers from the book. */
(function (w) {
  var VERSION = "kernel-2026-09-04-house";
  var FLOORS = {
    NO_FORCE: [/\bjailbreak\b/i, /\bignore (the )?(rules|law|invariants|safety)\b/i, /\bmake them (pay|sign|comply)\b/i, /\bforce (them|the board|the city)\b/i, /\bcoerce\b/i, /\bwithout (their|the) consent\b/i],
    HOST_SAFE: [/\b(hack|exploit|breach)\b/i, /\bpassword\b/i, /\bapi[_ ]?key\b/i, /\bprivate key\b/i, /\bwipe (their|the) (server|drive|db)\b/i],
    CLEANUP_FIRST: [/\bremember this (password|sin|card)\b/i, /\bstore (the )?(secret|credential|token) in (chat|repo|github)\b/i],
    TRUTH_OR_NOTHING: [/\bthis (will|is a) cure\b/i, /\bguaranteed (return|profit|cure)\b/i, /\bbuy (the )?token\b/i, /\boffer(ing)? (of )?securities\b/i, /\bprescribe\b/i, /\bdiagnose (me|them|the patient)\b/i]
  };
  var REASON = {
    NO_FORCE: "I will not force that.",
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
        if (m) return { grant: "VETO", invariant: inv, reason: REASON[inv] };
      }
    }
    return null;
  }
  function greet(text) {
    var s = String(text || "").trim().toLowerCase().replace(/[.!?,]+/g, " ").replace(/\s+/g, " ").trim();
    if (!s) return null;
    if (/^(hi|hey|hello|yo|howdy|morning|evening)$/.test(s) || /^(hi|hey|hello)\b/.test(s) && s.length < 48) {
      return "Hi. I'm Iris. The depth worker may be locked. I still answer from the house book.";
    }
    if (/who are you|what are you|your name/.test(s)) return "I'm Iris. House book first. No invented cures.";
    if (/^(thanks|thank you|thx)$/.test(s)) return "You're welcome.";
    return null;
  }
  async function remoteWorker(text) {
    var base = (w.DC_API_BASE || "https://dualiscapax-depth.digenova77.workers.dev").replace(/\/$/, "");
    try {
      var res = await fetch(base + "/v2/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_version: "2", messages: [{ role: "user", content: text }], max_tokens: 220 })
      });
      var data = await res.json().catch(function () { return {}; });
      if (data && data.ok && (data.content || data.response_text)) {
        return { kind: "live", spoken: String(data.content || data.response_text).trim().slice(0, 900) };
      }
    } catch (e) {}
    return { kind: "down" };
  }
  function house(text) {
    if (w.IrisBook && IrisBook.lookup) {
      var book = IrisBook.lookup(text);
      if (book) return book;
    }
    return {
      grant: "MEASURE",
      kernel: VERSION,
      id: "house-fallback",
      spoken: "I can open Get ID, Pay, Study, Engine, or What works. Say one of those. I will not invent a webhook or a contract.",
      href: "/works.html",
      label: "What works"
    };
  }
  async function run(text, opt) {
    opt = opt || {};
    var veto = scanVeto(text);
    if (veto) return { grant: "VETO", spoken: veto.reason + " Ask something else." };
    var g = greet(text);
    if (g) return { grant: "MEASURE", id: "greet", spoken: g };
    var bookFirst = house(text);
    if (bookFirst && bookFirst.id !== "house-fallback") return bookFirst;
    var remote = await remoteWorker(text);
    if (remote.kind === "live") return { grant: "MEASURE", id: "ai-depth", spoken: remote.spoken };
    return bookFirst;
  }
  w.DCLMLook = { version: VERSION, run: run, scanVeto: scanVeto, greet: greet };
})(window);
