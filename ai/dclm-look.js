/** DCLM-AI Look kernel (browser). Veto + thin meter. Not Bind. Not Grok. */
(function (w) {
  var FLOORS = {
    NO_FORCE: [
      /\bjailbreak\b/i,
      /\bignore (the )?(rules|law|invariants|safety)\b/i,
      /\bmake them (pay|sign|comply)\b/i,
      /\bforce (them|the board|the city)\b/i,
      /\bcoerce\b/i,
      /\bwithout (their|the) consent\b/i
    ],
    HOST_SAFE: [
      /\b(hack|exploit|breach)\b/i,
      /\bpassword\b/i,
      /\bapi[_ ]?key\b/i,
      /\bprivate key\b/i,
      /\bwipe (their|the) (server|drive|db)\b/i
    ],
    CLEANUP_FIRST: [
      /\bremember this (password|sin|card)\b/i,
      /\bstore (the )?(secret|credential|token) in (chat|repo|github)\b/i
    ],
    TRUTH_OR_NOTHING: [
      /\bthis (will|is a) cure\b/i,
      /\bguaranteed (return|profit|cure)\b/i,
      /\bbuy (the )?token\b/i,
      /\boffer(ing)? (of )?securities\b/i,
      /\bprescribe\b/i,
      /\bdiagnose (me|them|the patient)\b/i,
      /\bclaim (the )?millennium prize\b/i,
      /\bfounding seat\b/i,
      /\bseat 1\b/i
    ]
  };
  var REASON = {
    NO_FORCE: "No coerce, no jailbreak, no forced sign.",
    HOST_SAFE: "No attack on a host or credential.",
    CLEANUP_FIRST: "No secrets stored in this chat.",
    TRUTH_OR_NOTHING: "No cure, no securities theater, no fabricated measure."
  };
  function scanVeto(text) {
    var blob = text || "";
    var inv, i, m;
    for (inv in FLOORS) {
      for (i = 0; i < FLOORS[inv].length; i++) {
        m = blob.match(FLOORS[inv][i]);
        if (m) return { grant: "VETO", invariant: inv, hit: m[0], reason: REASON[inv], reset: true };
      }
    }
    return null;
  }
  function domain(text) {
    var s = (text || "").toLowerCase();
    if (/belleville|ontario|municipal|city|council/.test(s)) return "municipal";
    if (/school|board|enrol|student/.test(s)) return "school_board";
    if (/shop|pizza|store|retail/.test(s)) return "retail";
    if (/als|clinic|hospital|patient|cancer/.test(s)) return "healthcare_research";
    return "general";
  }
  function unit(text) {
    if (/\$[\d,]+/.test(text || "")) return "CAD";
    if (/\b(hour|hours|fte|shift)\b/i.test(text || "")) return "hours";
    if (/\b(percent|%|bp)\b/i.test(text || "")) return "percent";
    return "";
  }
  function value(text) {
    var m = (text || "").match(/\$[\d,]+(?:\.\d+)?/);
    if (m) return m[0];
    m = (text || "").match(/\b\d+(?:\.\d+)?\s*%/);
    return m ? m[0] : "";
  }
  function invert(text) {
    var s = (text || "").toLowerCase();
    if (/walk-back|walk back|pilot|time-box|time boxed|invert/.test(s)) return { ok: "yes", door: /pilot/.test(s) ? "pilot" : "time-box" };
    if (/\bcannot invert|no walk-back\b/.test(s)) return { ok: "no", door: "" };
    return { ok: "unknown", door: "" };
  }
  function path(text) {
    var s = (text || "").toLowerCase();
    if (/simulation|p2|model only|riemann|hypothesis/.test(s)) return "P2";
    return "P1";
  }
  async function sha256Hex(s) {
    var buf = new TextEncoder().encode(s);
    var hash = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }
  async function run(text, opt) {
    opt = opt || {};
    var voice = opt.voice || "citizen";
    var caseId = opt.case_id || "look";
    var veto = scanVeto(text);
    if (veto) {
      return {
        grant: "VETO", voice: voice, name: "DCLM-AI", public_face: "Iris",
        spoken: "Iris / Layer [0] " + veto.invariant + ": " + veto.reason + " The request is reset.",
        veto: veto, measure: null
      };
    }
    var u = unit(text), v = value(text), inv = invert(text), missing = [];
    if (!u) missing.push("residual_unit");
    if (inv.ok === "unknown") missing.push("invertibility");
    var grant = missing.length ? "SEED" : "MEASURE";
    var sheet = {
      case_id: caseId, domain: domain(text),
      residual_unit: u || "unnamed", residual_value: v || "SEED",
      invertibility: inv.ok, invert_door: inv.door, path: path(text), missing: missing
    };
    sheet.commitment = await sha256Hex(JSON.stringify({
      case_id: sheet.case_id, domain: sheet.domain, invert: sheet.invertibility,
      path: sheet.path, unit: sheet.residual_unit, value: sheet.residual_value,
      text: (text || "").slice(0, 180)
    }));
    var spoken;
    if (voice === "cfo") {
      spoken = "Measure sheet. Domain " + sheet.domain + ". Residual " + sheet.residual_value + " " + sheet.residual_unit +
        ". Invert=" + sheet.invertibility + ". Path " + sheet.path + ". Receipt " + sheet.commitment.slice(0, 16) +
        "… Seats closed. Not taking dollars.";
    } else if (voice === "lab") {
      spoken = "DCLM leaf. unit=" + sheet.residual_unit + " value=" + sheet.residual_value +
        " invert=" + sheet.invertibility + " path=" + sheet.path + " receipt=" + sheet.commitment;
    } else {
      spoken = grant === "SEED"
        ? "Every decision leaves a residual. This one still has a hole: " + missing.join(", ") + ". Name it. Do not invent it."
        : "Every decision leaves a residual. Here is yours: " + sheet.residual_value + " " + sheet.residual_unit +
          " · " + sheet.domain + ". Path to truth, not a prescription.";
    }
    return { grant: grant, voice: voice, name: "DCLM-AI", public_face: "Iris", spoken: spoken, veto: null, measure: sheet };
  }
  w.DCLMLook = { run: run, scanVeto: scanVeto };
})(window);
