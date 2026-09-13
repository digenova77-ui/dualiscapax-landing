/**
 * DualisCapax ice portal — one rink, one stage at a time.
 * Claim is identity (TeamSnap / Spordle demo bind). Pay stays closed.
 * Founder/dev flag skips PAY only — never auto-injects a seat.
 */
(function (g) {
  var SEAT_KEY = "dc.ice.seat";
  var HOME_KEY = "dc.ice.home";
  var RINK_KEY = "dc.ice.rink";
  var ETA_KEY = "dc.ice.eta";
  var ENROUTE_KEY = "dc.ice.enroute"; /* { startedAt, etaMin } — pasted Maps ETA only */
  var BIND_PFX = "dc.ice.binds.";
  var FOUND_KEY = "dc.founder.dev";
  var SAW_KEY = "dc.ice.saw";
  var TAPE_STREAM_KEY = "dc.ice.tape_stream"; /* BYO / Falcon team URL */
  var TAPE_AUTH_KEY = "dc.ice.tape_auth"; /* { user, pass } on-device only */
  var NUTRITION_KEY = "dc.ice.nutrition"; /* athlete paste / note — never invent */
  var STAY_KEY = "dc.ice.stays"; /* on-device Airbnb/stay echoes — never invent */
  var WORKOUT_KEY = "dc.ice.workout";
  var ME_ARCH_KEY = "dc.ice.me.archetype"; /* household claims — never invent */
  var ME_ROLE_KEY = "dc.ice.me.nhl_role"; /* claimed NHL role model — never invent */
  /* Hardcoded style cells by position bucket — never invent free text styles on face. */
  var ME_STYLE_BY_POS = {
    F: ["Power F", "Sniper", "Playmaker", "2-Way"],
    D: ["Offensive", "Defensive", "Hybrid"],
    G: ["Athletic", "Butterfly", "Positional"]
  };
  function mePosBucket(pos) {
    var p = String(pos || "").toUpperCase();
    if (p === "G" || p.indexOf("G") === 0 && p.length <= 2) return "G";
    if (p === "D" || p === "LD" || p === "RD" || p.indexOf("D") === 0) return "D";
    /* LW/RW/C/F and anything else treated as forward bucket */
    return "F";
  }
  function meStyleOptionsHtml(pos, selected) {
    var bucket = mePosBucket(pos);
    var opts = ME_STYLE_BY_POS[bucket] || ME_STYLE_BY_POS.F;
    var sel = String(selected || "");
    var html = '<select id="meStyle" aria-label="Style">';
    html += '<option value="">—</option>';
    for (var i = 0; i < opts.length; i++) {
      var o = opts[i];
      html += '<option value="' + esc(o) + '"' + (o === sel ? " selected" : "") + ">" + esc(o) + "</option>";
    }
    /* Keep prior value if it was free-text Power forward / old G Reflex → map */
    if (sel && opts.indexOf(sel) < 0) {
      var mapped = sel;
      if (/power\s*f/i.test(sel)) mapped = "Power F";
      if (/^reflex$/i.test(sel)) mapped = "Athletic";
      if (opts.indexOf(mapped) >= 0 && mapped !== sel) {
        html = meStyleOptionsHtml(pos, mapped);
        return html;
      }
      html += '<option value="' + esc(sel) + '" selected>' + esc(sel) + "</option>";
    }
    html += "</select>";
    return html;
  }

  var SCHOOL_PHOTO_KEY = "dc.ice.school_photo"; /* data URL on-device — echo only */
  var SCHOOL_GPA_KEY = "dc.ice.school_gpa"; /* claimed GPA echo */
  var TAPE_PIPE_KEY = "dc.ice.tape_pipe"; /* livebarn|hudl|byo */
  var DEFAULT_RINK = "Quinte CAA Arena Belleville";
  var INDEX_URL = "research/ontario-aaa/omha-u16.2026-2027.index.json";
  var PACK_URL = "research/ontario-aaa/rosters/";

  var STAGES = [
    { id: "seat", label: "Seat" },
    { id: "game", label: "Game" },
    { id: "cal", label: "Cal" },
    { id: "go", label: "Go" },
    { id: "tape", label: "Tape" },
    { id: "me", label: "Me" },
    { id: "school", label: "School" },
    { id: "apps", label: "Apps" }
  ];

  var ICONS = {
    seat: '<circle cx="12" cy="8" r="3"/><path d="M5 19c1.4-3.2 3.6-5 7-5s5.6 1.8 7 5"/>',
    game: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 11h16"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 14h2M12 14h2M16 14h2"/>',
    go: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    tape: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M10 9l6 3-6 3z"/>',
    me: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5M9 14h6"/>',
    school: '<path d="M3 10l9-5 9 5-9 5-9-5z"/><path d="M7 12v5c2 1.2 4 1.8 5 1.8S15 18.2 17 17v-5"/>',
    apps: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>'
  };

  var BINDS = [
    {
      id: "teamsnap",
      name: "TeamSnap",
      short: "TS",
      job: "Roster + RSVP + schedule. Open their login. Dualis cannot see that login until partner OAuth exists.",
      loginUrl: "https://go.teamsnap.com/",
      loginLabel: "Open TeamSnap login",
      altLoginUrl: "https://identity.teamsnap.com/",
      altLoginLabel: "TeamSnap ONE sign-in"
    },
    {
      id: "spordle",
      name: "Spordle / HCR",
      short: "SP",
      job: "Hockey Canada identity (HCR 3.0). Prove the seat. Preferred Ontario AAA proof.",
      loginUrl: "https://myaccount.spordle.com/dashboard",
      loginLabel: "Open Spordle My Account"
    },
    {
      id: "gamesheet",
      name: "GameSheet",
      short: "GS",
      job: "Score pull. Never paste a scoresheet into Dualis. League Team App login.",
      loginUrl: "https://teams.gamesheet.app/",
      loginLabel: "Open GameSheet Teams"
    },
    {
      id: "livebarn",
      name: "LiveBarn",
      short: "LB",
      job: "Tape pointer under their sub. Dualis does not host clips.",
      loginUrl: "https://watch.livebarn.com/en/signin",
      loginLabel: "Open LiveBarn sign-in"
    },
    {
      id: "hudl",
      name: "Hudl",
      short: "HD",
      job: "Coach clips / Instat ice. Their meter. Optional.",
      loginUrl: "https://www.hudl.com/logins",
      loginLabel: "Open Hudl logins"
    },
    {
      id: "workout",
      name: "Workout",
      short: "WO",
      job: "Off-ice training bind. Fitbit / Google Health login now; activity API pull later. Dualis never invents a workout log. Me runs DCLM — not a notes pad.",
      loginUrl: "https://www.fitbit.com/login",
      loginLabel: "Open Fitbit login",
      altLoginUrl: "https://accounts.google.com/",
      altLoginLabel: "Google account (Health later)",
      landStage: "me"
    },
    {
      id: "nutrition",
      name: "Nutrition",
      short: "NU",
      job: "Fuel bind. Open their food app now; API later (MFP partner closed; Cronometer no public consumer API — bind/login first). Dualis never invents a meal plan.",
      loginUrl: "https://www.myfitnesspal.com/account/login",
      loginLabel: "Open MyFitnessPal login",
      altLoginUrl: "https://cronometer.com/login/",
      altLoginLabel: "Open Cronometer login",
      landStage: "me"
    }
  ];

  /* Legacy stub board — Game Day uses TeamSnap cache only (no invented opponents). */
  var GAMES = [];

  var NCAA = [
    { k: "D1 core GPA floor", v: "2.3" },
    { k: "D2 core GPA floor", v: "2.2" },
    { k: "NCAA core courses", v: "16" },
    { k: "Amateurism", v: "Eligibility Center" }
  ];

  /* Echo of research/ontario-aaa/rosters/quinte-red-devils.u16.2026-2027.json — USER_VALIDATED. */
  var EMPTY_PACK = {
    team_id: "",
    team_slug: "",
    age: "",
    season: "2026-2027",
    tier: "AAA",
    soft_for_user_check: false,
    roster: []
  };

  var FALLBACK_PACK = {
    team_id: "on.aaa.omha.quinte-red-devils.u16.2026-2027",
    team_slug: "quinte-red-devils",
    age: "u16",
    tier: "AAA",
    season: "2026-2027",
    soft_for_user_check: false,
    roster: [
      { jersey: 32, last: "Armstrong", initial: "N", pos: "G", display_name: "N. Armstrong" },
      { jersey: 31, last: "Gibson", initial: "E", pos: "G", display_name: "E. Gibson" },
      { jersey: 7, last: "Brown", initial: "L", pos: "D", display_name: "L. Brown" },
      { jersey: 11, last: "Cousins", initial: "R", pos: "D", display_name: "R. Cousins" },
      { jersey: 10, last: "Gervais", initial: "T", pos: "D", display_name: "T. Gervais" },
      { jersey: 13, last: "Illingworth", initial: "D", pos: "D", display_name: "D. Illingworth" },
      { jersey: 8, last: "Jones", initial: "J", pos: "D", display_name: "J. Jones" },
      { jersey: 96, last: "Vincent", initial: "D", pos: "D", display_name: "D. Vincent" },
      { jersey: 17, last: "Crawford", initial: "C", pos: "F", display_name: "C. Crawford" },
      { jersey: 29, last: "Di Genova", initial: "D", pos: "LW", display_name: "D. Di Genova", seat_note: "USER_VALIDATED household LW #29" },
      { jersey: 16, last: "Dupont", initial: "L", pos: "F", display_name: "L. Dupont" },
      { jersey: 73, last: "Helmer", initial: "C", pos: "F", display_name: "C. Helmer" },
      { jersey: 18, last: "Hoar", initial: "M", pos: "F", display_name: "M. Hoar" },
      { jersey: 19, last: "Kellar", initial: "O", pos: "F", display_name: "O. Kellar" },
      { jersey: 27, last: "Mercer", initial: "C", pos: "F", display_name: "C. Mercer" },
      { jersey: 22, last: "Patterson", initial: "K", pos: "F", display_name: "K. Patterson" },
      { jersey: 23, last: "Prinzen", initial: "W", pos: "F", display_name: "W. Prinzen" }
    ]
  };

  var FALLBACK_TEAMS = [
    { slug: "ajax-pickering-raiders", division: "east", soft_for_user_check: false },
    { slug: "barrie-jr-colts", division: "east", soft_for_user_check: false },
    { slug: "central-ontario-wolves", division: "east", soft_for_user_check: false },
    { slug: "greater-kingston-gaels", division: "east", soft_for_user_check: true },
    { slug: "markham-waxers", division: "east", soft_for_user_check: false },
    { slug: "north-central-predators", division: "east", soft_for_user_check: false },
    { slug: "north-shore-whitecaps", division: "east", soft_for_user_check: false },
    { slug: "peterborough-petes", division: "east", soft_for_user_check: false },
    { slug: "quinte-red-devils", division: "east", soft_for_user_check: false },
    { slug: "whitby-wildcats", division: "east", soft_for_user_check: false },
    { slug: "york-simcoe-express", division: "east", soft_for_user_check: false },
    { slug: "burlington-eagles", division: "west", soft_for_user_check: false },
    { slug: "credit-river-capitals", division: "west", soft_for_user_check: false },
    { slug: "grey-bruce-highlanders", division: "west", soft_for_user_check: false },
    { slug: "guelph-jr-gryphons", division: "west", soft_for_user_check: false },
    { slug: "halton-hurricanes", division: "west", soft_for_user_check: false },
    { slug: "hamilton-steel", division: "west", soft_for_user_check: false },
    { slug: "niagara-north-stars", division: "west", soft_for_user_check: false },
    { slug: "oakville-rangers", division: "west", soft_for_user_check: false },
    { slug: "southern-tier-admirals", division: "west", soft_for_user_check: false }
  ];

  var PRIORS = {
    F: { shift_s: 42, bench_s: 90, bursts: 6, peak_kmh: 32, mean_kmh: 16.5 },
    D: { shift_s: 48, bench_s: 110, bursts: 5, peak_kmh: 28, mean_kmh: 15 },
    G: { shift_s: 1200, bench_s: 0, bursts: 2, peak_kmh: 12, mean_kmh: 4 }
  };

  var state = {
    stage: "seat",
    teams: FALLBACK_TEAMS.slice(),
    pack: EMPTY_PACK,
    teamSlug: "",
    role: "F",
    moreGames: false,
    showProve: false,
    pickedJersey: null,
    showEta: false,
    showMap: false,
    showAdjust: false,
    tapeDemo: false,
    pendingBind: null,
    calAnchor: null, /* Date — Monday of visible week */
    calDayFocus: null /* YYYY-MM-DD selected day */
  };

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  function lsGet(k) {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }
  function lsSet(k, v) {
    try { localStorage.setItem(k, v); } catch (e) {}
  }
  function lsJson(k) {
    try { var r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; }
  }
  function titleFromSlug(slug) {
    return String(slug || "").split("-").map(function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(" ");
  }
  function shortTeam(slug) {
    var map = {
      "quinte-red-devils": "Quinte",
      "greater-kingston-gaels": "Kingston",
      "whitby-wildcats": "Whitby",
      "peterborough-petes": "Peterborough"
    };
    return map[slug] || titleFromSlug(slug).split(" ")[0];
  }
  /** Next Games face: city / place only — never arena, never full club name. Echo-only map + strip. */
  function oppCityFace(raw) {
    var s = String(raw || "").trim().replace(/^vs\s+/i, "");
    if (!s || s === "—" || s === "-") return "—";
    var key = s.toLowerCase().replace(/\s+/g, " ");
    var map = {
      "greater kingston jr gaels": "Greater Kingston",
      "kingston gaels": "Greater Kingston",
      "ajax-pickering raiders": "Ajax-Pickering",
      "ajax pickering raiders": "Ajax-Pickering",
      "north central predators": "North Central",
      "peterborough petes": "Peterborough",
      "barrie jr colts": "Barrie",
      "york-simcoe express": "York-Simcoe",
      "york simcoe express": "York-Simcoe",
      "whitby wildcats": "Whitby",
      "central ontario wolves": "Central Ontario",
      "markham waxers": "Markham",
      "north shore whitecaps": "North Shore",
      "quinte red devils": "Quinte"
    };
    if (map[key]) return map[key];
    /* Strip common mascot / Jr tails — leave the place words */
    var stripped = s.replace(/\s+(Jr\.?\s+)?(Gaels|Raiders|Petes|Wildcats|Predators|Colts|Express|Waxers|Wolves|Whitecaps|Devils|Knights|Canadians)$/i, "").trim();
    stripped = stripped.replace(/\s+Jr\.?$/i, "").trim();
    return stripped || s;
  }
  function privacyName(p) {
    if (!p) return "";
    var ini = (p.initial || (p.display_name || "").charAt(0) || "?").toString().replace(/\.$/, "");
    return ini + ". " + (p.last || p.display_name || "Seat");
  }
  function seatLabel(p) {
    if (!p) return "";
    return "#" + p.jersey + " " + privacyName(p);
  }

  /**
   * Roster pos → card detail + clock bucket.
   * Empty / unknown → no detail, no bucket (do not pretend).
   * LW/C/RW/F → known short form on face; bucket F for clocks only when known forward.
   * D/LD/RD → bucket D; G → bucket G.
   */
  function normalizePos(raw) {
    var p = String(raw || "").trim().toUpperCase().replace(/\s+/g, " ");
    if (!p || p === "?" || p === "-" || p === "—" || p === "N/A" || p === "NA" || p === "UNKNOWN") {
      return { detail: "", bucket: "" };
    }
    if (p === "G" || p === "GOALIE" || p === "GK" || p === "GOALTENDER") return { detail: "G", bucket: "G" };
    if (p === "D" || p === "LD" || p === "RD" || p === "DEF" || p === "DEFENCE" || p === "DEFENSE" || p.indexOf("DEFEN") === 0) {
      return { detail: "D", bucket: "D" };
    }
    if (p === "LW" || p === "LEFT WING" || p === "LEFTWING" || p === "L.W.") return { detail: "LW", bucket: "F" };
    if (p === "RW" || p === "RIGHT WING" || p === "RIGHTWING" || p === "R.W.") return { detail: "RW", bucket: "F" };
    if (p === "C" || p === "CENTER" || p === "CENTRE") return { detail: "C", bucket: "F" };
    if (p === "F" || p === "FORWARD" || p === "FW" || p === "W" || p === "WING") return { detail: "", bucket: "F" };
    /* Unclassified: name only on face, no bucket pretend */
    return { detail: "", bucket: "" };
  }
  function roleFromPos(raw) {
    return normalizePos(raw).bucket || "";
  }
  /** Prefer roster wing/centre over a seat that only stored bucket F. Never invent. */
  function resolvePosRaw(seat, player) {
    var p = player || {};
    var seatPos = (seat && seat.pos) ? String(seat.pos).trim() : "";
    var packPos = p.pos ? String(p.pos).trim() : "";
    var nSeat = normalizePos(seatPos);
    var nPack = normalizePos(packPos);
    if (nPack.detail && nPack.detail !== "F") return packPos;
    if (nSeat.detail && nSeat.detail !== "F") return seatPos;
    if (nPack.detail) return packPos;
    if (nSeat.detail) return seatPos;
    return packPos || seatPos || "";
  }
  /** Face tokens only: LW | C | RW | D | G. Never F, never invent. */
  function facePosLabel(seat, player) {
    var det = normalizePos(resolvePosRaw(seat, player)).detail;
    if (det === "LW" || det === "C" || det === "RW" || det === "D" || det === "G") return det;
    return "";
  }
  /** Card face: "LW - D. Di Genova" when known; bare name when unknown. Number stays above. */
  function cardNameLine(seat, player) {
    var p = player || {};
    var det = facePosLabel(seat, p);
    var name = privacyName({
      last: (seat && seat.last) || p.last,
      initial: (seat && seat.initial) || p.initial,
      display_name: (seat && seat.display_name) || p.display_name || (seat && seat.display)
    });
    if (det) return det + " - " + name;
    return name;
  }
  function cardMetaPos(seat, player) {
    return facePosLabel(seat, player);
  }


  /** Me title chip: full-ish name when seat/player has it; Dom household → Dom Di Genova; else privacy. */
  function meFaceName(seat, player) {
    var p = player || {};
    var first = String((seat && (seat.first || seat.given || seat.given_name)) || p.first || p.given || p.given_name || "").trim();
    var last = String((seat && seat.last) || p.last || "").trim();
    if (first && last) return first + " " + last;
    var isDom = !!(seat && Number(seat.jersey) === 29 &&
      String(seat.last || "").toLowerCase().indexOf("di genova") !== -1);
    if (isDom && last) return "Dom Di Genova";
    return privacyName({
      last: last,
      initial: (seat && seat.initial) || p.initial,
      display_name: (seat && seat.display_name) || p.display_name || (seat && seat.display)
    });
  }


  /** Card meta: "Quinte Red Devils · U-16 AAA" — Team · U-age tier; no pos on this line. */
  function formatAgeBand(age) {
    var a = String(age || (state.pack && state.pack.age) || "u16").trim().toLowerCase();
    var m = a.match(/u\s*-?\s*(\d{1,2})/);
    if (m) return "U-" + m[1];
    if (/^\d{1,2}$/.test(a)) return "U-" + a;
    return "U-16";
  }
  function cardTeamLine(seat) {
    var slug = (seat && seat.team_slug) || state.teamSlug || (state.pack && state.pack.team_slug) || "";
    var team = titleFromSlug(slug);
    var age = (seat && seat.age) || (state.pack && state.pack.age) || "u16";
    var band = formatAgeBand(age);
    /* OMHA ice portal packs are AAA; do not invent other tiers */
    var tier = (seat && seat.tier) || (state.pack && state.pack.tier) || "AAA";
    return team + " · " + band + " " + tier;
  }


  var SEASON_STATS_KEY = "dc.ice.season_stats";
  /** GameSheet (or future) season line — never invent numbers. */
  function getSeasonStats(jersey) {
    try {
      var row = JSON.parse(localStorage.getItem(SEASON_STATS_KEY) || "null");
      if (!row || !row.by_jersey) return null;
      var hit = row.by_jersey[String(jersey)];
      if (!hit) return null;
      return {
        gp: hit.gp, g: hit.g, a: hit.a, p: hit.p, pim: hit.pim,
        source: row.source || hit.source || "gamesheet",
        at: row.at || hit.at || ""
      };
    } catch (e) { return null; }
  }
  function dashNum(v) {
    if (v === 0 || v === "0") return "0";
    if (v == null || v === "") return "—";
    return String(v);
  }
  /** Player landing card line: GP  G  A  P  PIM — cite-only; Dualis never invents. */
  function hockeyCardStatLine(jersey) {
    var st = getSeasonStats(jersey);
    var gp = dashNum(st && st.gp);
    var g = dashNum(st && st.g);
    var a = dashNum(st && st.a);
    var p = dashNum(st && st.p);
    var pim = dashNum(st && st.pim);
    var src = (st && st.source) ? String(st.source) : "gamesheet";
    var note = ""; /* face stays quiet — define GameSheet pull elsewhere */
    return '<div class="ice-card-line" aria-label="Season stats">' +
      '<span class="ice-card-line-cell"><span class="ice-card-line-v">' + esc(gp) + '</span><span class="ice-card-line-k">GP</span></span>' +
      '<span class="ice-card-line-sep" aria-hidden="true"></span>' +
      '<span class="ice-card-line-cell"><span class="ice-card-line-v">' + esc(g) + '</span><span class="ice-card-line-k">G</span></span>' +
      '<span class="ice-card-line-sep" aria-hidden="true"></span>' +
      '<span class="ice-card-line-cell"><span class="ice-card-line-v">' + esc(a) + '</span><span class="ice-card-line-k">A</span></span>' +
      '<span class="ice-card-line-sep" aria-hidden="true"></span>' +
      '<span class="ice-card-line-cell"><span class="ice-card-line-v">' + esc(p) + '</span><span class="ice-card-line-k">P</span></span>' +
      '<span class="ice-card-line-sep" aria-hidden="true"></span>' +
      '<span class="ice-card-line-cell"><span class="ice-card-line-v">' + esc(pim) + '</span><span class="ice-card-line-k">PIM</span></span>' +
      '</div>' +
      (note ? ('<p class="ice-card-line-note">' + esc(note) + '</p>') : '');
  }

  function isFounder() {
    if (lsGet(FOUND_KEY) === "1") return true;
    try {
      var u = lsJson("dc.unity.session") || lsJson("dc.unity.id") || {};
      var blob = JSON.stringify(u).toLowerCase();
      if (/operator_first|founder|efuse|cosmogenesis|digenova|di genova/.test(blob)) return true;
      if (u.seat === "operator_first" || u.human === "U1" || u.human === "U0") return true;
    } catch (e) {}
    return false;
  }
  function ensureFounderPaySkip() {
    /* First ice visit: skip PAY only. Never claims a seat. */
    if (!lsGet(SAW_KEY)) lsSet(SAW_KEY, "1");
    if (lsGet(FOUND_KEY) == null) lsSet(FOUND_KEY, "1");
  }
  function payLabel() {
    return isFounder() ? "Coming soon — founder testing" : "Coming soon — founder testing";
  }

  function getSeat() { return lsJson(SEAT_KEY); }
  var PENDING_KEY = "dc.ice.pending_claim";
  function getPendingClaim() {
    try { return JSON.parse(localStorage.getItem(PENDING_KEY) || "null"); } catch (e) { return null; }
  }
  function setPendingClaim(obj) {
    try {
      if (!obj || obj.jersey == null) return;
      localStorage.setItem(PENDING_KEY, JSON.stringify(obj));
      state.pickedJersey = Number(obj.jersey);
    } catch (e) {}
  }
  function clearPendingClaim() {
    try { localStorage.removeItem(PENDING_KEY); } catch (e) {}
  }
  /** Pending is Connect intent only — never a sealed seat. */
  function writePendingClaimFromPlayer(p, extra) {
    if (!p || p.jersey == null) return null;
    var seatNow = getSeat();
    var row = {
      jersey: Number(p.jersey),
      via: "teamsnap",
      team_slug: (extra && extra.team_slug) || state.teamSlug || (state.pack && state.pack.team_slug) || (seatNow && seatNow.team_slug) || "",
      team_id: (extra && extra.team_id) || (state.pack && state.pack.team_id) || "",
      display: (extra && extra.display) || seatLabel(p),
      last: p.last || "",
      initial: p.initial || "",
      pos: p.pos || "",
      at: Date.now()
    };
    setPendingClaim(row);
    paintChip();
    return row;
  }
  function chipText(seat) {
    if (!seat) {
      var pend = getPendingClaim();
      if (pend && pend.jersey != null) {
        return "Connecting · #" + pend.jersey;
      }
      return "Claim seat";
    }
    if (seat.how === "oauth") {
      return "Bound · #" + seat.jersey + " " + (seat.last || "");
    }
    /* Non-oauth seat rows are legacy — chip still shows jersey but not as bound */
    return shortTeam(seat.team_slug) + " U16 · #" + seat.jersey + " " + (seat.last || "");
  }
  function paintChip() {
    var el = $("seatChip");
    if (!el) return;
    var s = getSeat();
    var pend = getPendingClaim();
    if (!seatIsBound() && pend && pend.jersey != null) {
      el.textContent = "Connecting · #" + pend.jersey;
      el.classList.toggle("is-empty", false);
      el.classList.add("is-pending");
      return;
    }
    el.classList.remove("is-pending");
    el.textContent = chipText(s);
    el.classList.toggle("is-empty", !seatIsBound());
  }
  function paintBanner() {
    var el = $("iceDevFlag");
    if (el) el.textContent = isFounder() ? "Dev · pay skipped" : "Dev unlock";
  }
  function bindOn(id) {
    var v = lsGet(BIND_PFX + id);
    return !!(v && v !== "0" && v !== "false");
  }
  function bindHow(id) {
    return lsGet(BIND_PFX + id) || "";
  }
  function setBind(id, how) {
    lsSet(BIND_PFX + id, how || "attested");
  }

  function teamMeta(slug) {
    for (var i = 0; i < state.teams.length; i++) {
      if (state.teams[i].slug === slug) return state.teams[i];
    }
    return { slug: slug, soft_for_user_check: slug.indexOf("kingston") !== -1 };
  }

  function loadIndex() {
    return fetch(INDEX_URL, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("index");
      return r.json();
    }).then(function (j) {
      var list = j.teams || [];
      if (!list.length && j.divisions) {
        list = (j.divisions.east || []).concat(j.divisions.west || []);
      }
      if (list.length) state.teams = list;
    }).catch(function () {
      state.teams = FALLBACK_TEAMS.slice();
    });
  }

  function loadPack(slug) {
    /* No default team — caller must pick. Quinte FALLBACK only when Quinte is chosen and pack fetch fails. */
    if (!slug) {
      state.teamSlug = "";
      state.pack = EMPTY_PACK;
      state.pickedJersey = null;
      return Promise.resolve(state.pack);
    }
    state.teamSlug = slug;
    var url = PACK_URL + state.teamSlug + ".u16.2026-2027.json";
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("pack");
      return r.json();
    }).then(function (j) {
      state.pack = {
        team_id: j.team_id,
        team_slug: j.team_slug || state.teamSlug,
        age: j.age || "u16",
        season: j.season || "2026-2027",
        tier: j.tier || "AAA",
        soft_for_user_check: !!(j.soft_for_user_check || teamMeta(state.teamSlug).soft_for_user_check),
        roster: (j.roster || []).slice()
      };
      if (!state.pack.roster.length && state.teamSlug === "quinte-red-devils") state.pack = FALLBACK_PACK;
    }).catch(function () {
      if (state.teamSlug === "quinte-red-devils") state.pack = FALLBACK_PACK;
      else {
        state.pack = {
          team_slug: state.teamSlug,
          age: "u16",
          season: "2026-2027",
          tier: "AAA",
          soft_for_user_check: !!teamMeta(state.teamSlug).soft_for_user_check,
          roster: []
        };
      }
    });
  }

  function formatTsWhen(iso) {
    if (!iso) return "TBD";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    try {
      return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    } catch (e) {
      return d.toISOString();
    }
  }

  function formatTsTime(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    try {
      return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  }

  function tsNextBundle() {
    if (!(window.DCTeamSnap && DCTeamSnap.nextPracticeAndGame)) {
      return { practice: null, game: null, tournament: null, hasCache: false, upcoming: [], recent: [] };
    }
    return DCTeamSnap.nextPracticeAndGame();
  }

  function boardFromTsEvent(ev, kind) {
    if (!ev) return null;
    var who;
    if (kind === "game") {
      who = ev.opponent ? ("vs " + ev.opponent) : (ev.name || "Game");
    } else if (kind === "tournament") {
      who = ev.name || "Tournament";
    } else {
      who = ev.name || "Practice";
    }
    return {
      when: formatTsWhen(ev.start),
      who: who,
      where: ev.location || "TBD",
      note: "teamsnap",
      startISO: ev.start,
      kind: kind
    };
  }

  /** Hub prefers next game, else next practice — never invents stub opponents. */
  /* League cites (OMHA-AAA + twin confirms) — never invent; only echo cited next game. */
  var OMHA_NEXT_URL = "data/omha-quinte-u16-next.json";
  var OMHA_SCHEDULE_URL = "data/omha-quinte-u16-schedule.json";
  var omhaNextCache = null;
  var omhaNextTried = false;
  var omhaSchedCache = null;
  var omhaSchedTried = false;

  function omhaCitedNextGame() {
    if (omhaNextCache) return omhaNextCache;
    if (omhaNextTried) return null;
    omhaNextTried = true;
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", OMHA_NEXT_URL, false);
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        var row = JSON.parse(xhr.responseText || "{}");
        var evs = row.events || [];
        if (evs.length) omhaNextCache = evs[0];
      }
    } catch (e) { omhaNextCache = null; }
    return omhaNextCache;
  }

  /** Full OMHA-cited Quinte U16 slate — paints Cal before TeamSnap catches up. Never invent. */
  function omhaCitedSchedule() {
    if (omhaSchedCache) return omhaSchedCache;
    if (omhaSchedTried) return [];
    omhaSchedTried = true;
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", OMHA_SCHEDULE_URL, false);
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        var row = JSON.parse(xhr.responseText || "{}");
        omhaSchedCache = Array.isArray(row.events) ? row.events : [];
      } else {
        omhaSchedCache = [];
      }
    } catch (e) { omhaSchedCache = []; }
    return omhaSchedCache || [];
  }

  var KMHA_TOURNEY_URL = "data/kmha-blueline-u16-next.json";
  var TOURNEY_PACK_URL = "data/quinte-u16-tournaments.json";
  var kmhaTourneyCache = null;
  var kmhaTourneyTried = false;
  var tourneyPackCache = null;
  var tourneyPackTried = false;
  function kmhaCitedTournament() {
    if (kmhaTourneyCache) return kmhaTourneyCache;
    if (kmhaTourneyTried) return null;
    kmhaTourneyTried = true;
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", KMHA_TOURNEY_URL, false);
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        var row = JSON.parse(xhr.responseText || "{}");
        var evs = row.events || [];
        if (evs.length) kmhaTourneyCache = evs[0];
      }
    } catch (e) { kmhaTourneyCache = null; }
    return kmhaTourneyCache;
  }
  /** Cited tournament list for Game Day — pack first, else Blueline single. Never invent. */
  function citedTournaments() {
    if (tourneyPackCache) return tourneyPackCache;
    if (!tourneyPackTried) {
      tourneyPackTried = true;
      try {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", TOURNEY_PACK_URL, false);
        xhr.send(null);
        if (xhr.status >= 200 && xhr.status < 300) {
          var row = JSON.parse(xhr.responseText || "{}");
          tourneyPackCache = Array.isArray(row.events) ? row.events : [];
        } else {
          tourneyPackCache = [];
        }
      } catch (e) { tourneyPackCache = []; }
    }
    if (tourneyPackCache && tourneyPackCache.length) return tourneyPackCache;
    var one = kmhaCitedTournament();
    return one ? [one] : [];
  }

  function boardFromCitedTournament(ev) {
    if (!ev) return null;
    var start = ev.start ? new Date(ev.start) : null;
    var end = ev.end ? new Date(ev.end) : null;
    var when = "—";
    if (start && !isNaN(start.getTime()) && end && !isNaN(end.getTime())) {
      when = start.toLocaleString(undefined, { month: "short", day: "numeric" }) +
        "–" + end.toLocaleString(undefined, { month: "short", day: "numeric" });
    } else if (start && !isNaN(start.getTime())) {
      when = start.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric" });
    }
    return {
      when: when,
      who: ev.name || "Tournament",
      where: ev.location || "—",
      note: "tourney",
      startISO: ev.start,
      kind: "tournament",
      confirms: ev.confirms || 0,
      source: ev.source || "cite"
    };
  }

    function boardFromOmhaEvent(ev) {
    if (!ev) return null;
    var start = ev.start ? new Date(ev.start) : null;
    var when = (start && !isNaN(start.getTime()))
      ? start.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
      : "—";
    return {
      when: when,
      who: ev.opponent ? ("vs " + ev.opponent) : (ev.name || "Game"),
      where: ev.location || "TBD",
      note: "omha",
      startISO: ev.start,
      kind: ev.home_away === "away" ? "away" : "home",
      confirms: ev.confirms || 0,
      source: "OMHA-AAA"
    };
  }

  function preferredHubBoard() {
    var n = tsNextBundle();
    if (n.game) return boardFromTsEvent(n.game, "game");
    var og = omhaCitedNextGame();
    if (og) return boardFromOmhaEvent(og);
    if (n.practice) return boardFromTsEvent(n.practice, "practice");
    return null;
  }

  function nextTileHtml(label, board) {
    if (board) {
      return '<div class="ice-hub-tile">' +
        '<div class="ice-hub-k">' + esc(label) + "</div>" +
        '<div class="ice-hub-place">' + esc(board.when) + "</div>" +
        (function () {
          var who = String(board.who || "");
          var m = who.match(/^vs\s+(.+)$/i);
          if (m) {
            return '<div class="who ice-who-hang">' +
              '<span class="ice-vs">vs&nbsp;</span>' +
              '<span class="ice-opp">' + esc(m[1]) + "</span></div>";
          }
          return '<div class="who" style="font-size:0.95rem;font-weight:800;margin-top:0.2rem;text-align:left;">' + esc(who) + "</div>";
        })() +
        '<div class="ice-hub-place">' + esc(board.where) + "</div>" +
      "</div>";
    }
    return '<div class="ice-hub-tile">' +
      '<div class="ice-hub-k">' + esc(label) + "</div>" +
      '<div class="ice-hub-place">—</div>' +
    "</div>";
  }

  /**
   * Cited / household matchup packs by opponent slug — never invent.
   * Face = verb bullets + Edge; expand = full You/Them/Edge cite sheet.
   */
  function matchupPlanForOpponent(oppRaw) {
    var opp = String(oppRaw || "");
    var low = opp.toLowerCase();
    /* Greater Kingston Jr Gaels / Kingston Gaels — Oct 8 appointment + every rematch */
    if (/kingston|gaels/.test(low)) {
      return {
        label: opp || "Greater Kingston Jr Gaels",
        edge: "Size + set-shot vs light puck-movers",
        edge2: "don’t ego friends",
        dos: [
          "Seal Dekeyser (#9) on the wall — 5′8″/143 puckhandler (EP)",
          "Traffic net-front / set one-timer — NCSA Power F identity",
          "Board Uppal (D · 6′0″/157 mobile puck-mover) when he carries",
          "Don’t ego Gunter (#93) — physical twin + Bulls friend (household)",
          "Know KP (#73) — playmaker/PP/sniper; friend, not a mystery"
        ],
        you: [
          { t: "Power F · 5′11″/185 · L · LW", s: "cited NCSA" },
          { t: "Puck protection · shot in traffic · heads-up physical", s: "cited NCSA" },
          { t: "Dangerous when set / one-timer · boards · not volume sniper", s: "household" },
          { t: "U16 league lines vs Gaels", s: "awaiting" }
        ],
        them: [
          { t: "Dekeyser #9 — Offensive C / Playmaker / Puckhandler · 5′8″/143", s: "cited EP" },
          { t: "Gunter #93 — Physical F / Playmaker / 2-Way C · 5′11″/170 · Napanee", s: "cited EP" },
          { t: "Patterson #73 — Playmaker / PP Specialist / Sniper · L", s: "cited EP" },
          { t: "Uppal — D · Mobile / Puck-Moving · 6′0″/157 (club F#96 conflict)", s: "cited EP/PR" },
          { t: "Constantinidis #51 D — Defensive + Puck-Moving · 5′10″/168", s: "cited EP" },
          { t: "Team avg ~5′10″/159 · Trueman compete/culture (no system cite)", s: "cited" },
          { t: "Weak-side breakout / who overhandles", s: "awaiting" }
        ],
        avoid: [
          "Open-ice skill race vs Dekeyser",
          "Physical 1v1 slugfest vs Gunter",
          "Invent a system exploit Dualis hasn’t cited"
        ]
      };
    }
    return null;
  }

  /** Game Day matchup lane — hybrid face + expand cite sheet. Every next game. */
  function matchupLaneHtml(board) {
    var opp = "";
    if (board && board.who) {
      var m = String(board.who).match(/^vs\s+(.+)$/i);
      opp = m ? m[1] : String(board.who);
    }
    var plan = matchupPlanForOpponent(opp);
    var title = opp ? ("Matchup · " + opp) : "Matchup";

    if (!plan) {
      return '<div class="ice-matchup" aria-label="DCLM matchup">' +
        '<div class="ice-matchup-k">' + esc(title) + ' · live</div>' +
        '<ul class="ice-matchup-dos">' +
          '<li class="ice-matchup-dash">— awaiting cites for this appointment</li>' +
        "</ul>" +
        '<div class="ice-matchup-edge"><span class="ice-matchup-lab">Edge</span> —</div>' +
        '' +
      "</div>";
    }

    var dos = plan.dos.map(function (d) {
      return "<li>" + esc(d) + "</li>";
    }).join("");

    return '<div class="ice-matchup is-live" aria-label="DCLM matchup">' +
      '<div class="ice-matchup-k">' + esc(title) + ' · live</div>' +
      '<ul class="ice-matchup-dos">' + dos + "</ul>" +
      '<div class="ice-matchup-edge">' +
        '<div class="ice-matchup-edge-line"><span class="ice-matchup-lab">Edge</span> <span class="ice-matchup-edge-main">' + esc(plan.edge) + "</span></div>" +
        (plan.edge2
          ? ('<div class="ice-matchup-edge-sub">' + esc(plan.edge2) + "</div>")
          : "") +
      "</div>" +
    "</div>";
  }

  function seatNextOneLiner() {
    var n = tsNextBundle();
    var bits = [];
    if (n.practice) bits.push("Practice " + formatTsWhen(n.practice.start));
    if (n.game) bits.push("Game " + formatTsWhen(n.game.start));
    if (n.tournament) bits.push("Tournament " + formatTsWhen(n.tournament.start));
    if (!bits.length) return "";
    return '<p class="ice-note">Next: ' + esc(bits.join(" · ")) + "</p>";
  }

  /** Directions to dest from wherever the phone is (no typed Home). */
  function mapsDir(dest) {
    return "https://www.google.com/maps/dir/?api=1&destination=" +
      encodeURIComponent(dest || DEFAULT_RINK);
  }

  function parseEtaMinutes(raw) {
    var t = String(raw || "").trim().toLowerCase();
    if (!t) return null;
    var hm = t.match(/^(\d+)\s*h(?:ours?)?\s*(?:(\d+)\s*m(?:in(?:utes?)?)?)?$/);
    if (hm) return (parseInt(hm[1], 10) * 60) + (hm[2] ? parseInt(hm[2], 10) : 0);
    var m = t.match(/(\d+(?:\.\d+)?)\s*(?:min|mins|minutes|m)\b/);
    if (m) return Math.round(parseFloat(m[1]));
    var bare = t.match(/^(\d+(?:\.\d+)?)$/);
    if (bare) return Math.round(parseFloat(bare[1]));
    return null;
  }

  function formatDuration(ms) {
    if (ms == null || !isFinite(ms)) return "—";
    if (ms <= 0) return "0:00";
    var total = Math.floor(ms / 1000);
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var sec = total % 60;
    if (h > 0) return h + ":" + String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
    return m + ":" + String(sec).padStart(2, "0");
  }

  function nextPuckAt(g) {
    if (g && g.startISO) {
      var d0 = new Date(g.startISO);
      if (!isNaN(d0.getTime())) return d0;
    }
    if (!g || g.dow == null || !g.hhmm) return null;
    var parts = String(g.hhmm).split(":");
    var hh = parseInt(parts[0], 10);
    var mm = parseInt(parts[1] || "0", 10);
    var now = new Date();
    var d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0);
    var guard = 0;
    while ((d.getDay() !== g.dow || d.getTime() <= now.getTime()) && guard < 14) {
      d.setDate(d.getDate() + 1);
      d.setHours(hh, mm, 0, 0);
      guard++;
    }
    return d;
  }

  function getEnroute() {
    return lsJson(ENROUTE_KEY);
  }

  function clearEnroute() {
    try { localStorage.removeItem(ENROUTE_KEY); } catch (e) {}
  }

  function startEnroute(etaMin) {
    var n = Number(etaMin);
    if (!isFinite(n) || n <= 0) return false;
    lsSet(ENROUTE_KEY, JSON.stringify({ startedAt: Date.now(), etaMin: n }));
    return true;
  }

  function enrouteRemainingMs(er) {
    if (!er || !er.startedAt || !er.etaMin) return null;
    var end = Number(er.startedAt) + Number(er.etaMin) * 60000;
    return end - Date.now();
  }

  var hubTickTimer = null;
  function stopHubTick() {
    if (hubTickTimer) {
      clearInterval(hubTickTimer);
      hubTickTimer = null;
    }
  }
  function startHubTick() {
    stopHubTick();
    hubTickTimer = setInterval(function () {
      if (state.stage !== "game") { stopHubTick(); return; }
      paintHubClocks();
    }, 1000);
  }

  function paintHubClocks() {
    var puckEl = $("hubPuckClock");
    var statusEl = $("hubStatus");
    var subEl = $("hubPuckSub");
    var g = preferredHubBoard();
    var puck = nextPuckAt(g);
    var now = Date.now();
    if (puckEl) {
      if (puck) puckEl.textContent = formatDuration(puck.getTime() - now);
      else puckEl.textContent = "—";
    }
    if (subEl) {
      if (g) {
        var kindLabel = g.kind === "practice" ? "Next practice" : "Next game";
        subEl.textContent = kindLabel + " · " + g.when;
      } else {
        subEl.textContent = "—";
      }
    }
    if (statusEl) {
      statusEl.textContent = "";
      statusEl.hidden = true;
    }
  }


  function runClocks(role) {
    var p = PRIORS[role] || PRIORS.F;
    var LN2 = Math.log(2);
    var raw = Math.min(0.8, 0.1 * p.bursts + 0.006 * p.shift_s);
    var af = 0.62 * raw, as = 0.38 * raw;
    var hole = af * Math.exp(-LN2 * p.bench_s / 22) + as * Math.exp(-LN2 * p.bench_s / 170);
    var pcr = Math.max(0, Math.min(1, 1 - hole));
    var lo = 0, hi = 900;
    for (var i = 0; i < 40; i++) {
      var mid = 0.5 * (lo + hi);
      var h = af * Math.exp(-LN2 * mid / 22) + as * Math.exp(-LN2 * mid / 170);
      if ((1 - h) >= 0.8) hi = mid; else lo = mid;
    }
    var flag = pcr >= 0.8 ? "OPTIMAL_BURST" : pcr >= 0.7 ? "PARTIAL_PCR_REFILL" : "FATIGUE_MANAGED";
    return {
      pcr: (pcr * 100).toFixed(1) + "%",
      to80: Math.round(hi * 10) / 10 + " s",
      flag: flag
    };
  }

  function lockedHtml() {
    return '<h1 class="ice-h">Claim a seat first</h1>' +
      '<p class="ice-p">Pick a team, pick your jersey, prove with TeamSnap or Spordle. Free. No pay.</p>' +
      '<button type="button" class="ice-btn" data-go="seat">Claim seat →</button>';
  }

  function renderSeatBoundCard(seat) {
    var p = findPlayer(seat.jersey) || {};
    var display = cardNameLine(seat, p);
    /* Bound = one-screen card: drop intro + TeamSnap explainer (still true, just not needed on face). */
    return '<div class="ice-seat-bound">' +
      '<h1 class="ice-h ice-seat-bound-h">Your card</h1>' +
      '<div class="ice-player-card">' +
        '<div class="ice-player-card-k">Bound · TeamSnap</div>' +
        '<div class="ice-player-card-num">#' + esc(String(seat.jersey)) + "</div>" +
        '<div class="ice-player-card-name">' + esc(display) + "</div>" +
        '<div class="ice-player-card-meta">' + esc(cardTeamLine(seat)) + "</div>" +
        hockeyCardStatLine(seat.jersey) +
      "</div>" +
      seatNextOneLiner() +
      '<div class="ice-hub-actions ice-seat-bound-actions">' +
        '<button type="button" class="ice-btn" data-go="game">Game Day →</button>' +
        '<button type="button" class="ice-btn ghost" data-go="me">Me · fuel & train</button>' +
      "</div>" +
      '<button type="button" class="ice-btn ghost" id="btnResetIce">Reset ice on this phone</button>' +
      '<p class="ice-note ice-seat-bound-note">Clears this seat + TeamSnap on <strong>this device only</strong>.</p>' +
    "</div>";
  }

  function renderSeat() {
    if (seatIsBound()) {
      var bound = getSeat();
      if (bound) return renderSeatBoundCard(bound);
    }
    var teams = '<option value="">' + (state.teamSlug ? "Pick a team…" : "Pick a team…") + "</option>" +
      state.teams.map(function (t) {
      var soft = t.soft_for_user_check ? " · soft" : "";
      return '<option value="' + esc(t.slug) + '"' + (t.slug === state.teamSlug ? " selected" : "") + ">" +
        esc(titleFromSlug(t.slug)) + (t.division ? " · " + t.division : "") + esc(soft) + "</option>";
    }).join("");
    var roster = (state.pack.roster || []).slice().sort(function (a, b) {
      return (a.jersey || 0) - (b.jersey || 0);
    });
    var keepJ = state.pickedJersey;
    if (keepJ == null) {
      var pend0 = getPendingClaim();
      if (pend0 && pend0.jersey != null) keepJ = pend0.jersey;
    }
    if (keepJ == null) {
      var existing = getSeat();
      if (existing && existing.jersey != null) keepJ = existing.jersey;
    }
    var seats = '<option value="">' + (roster.length ? "Pick a jersey…" : "Pick a team first") + "</option>" +
      roster.map(function (p) {
      var sel = (keepJ != null && Number(p.jersey) === Number(keepJ)) ? " selected" : "";
      var posBit = p.pos ? (" · " + esc(p.pos)) : "";
      return '<option value="' + esc(String(p.jersey)) + '"' + sel + '>' + esc(seatLabel(p)) + posBit + "</option>";
    }).join("");
    var soft = state.pack.soft_for_user_check
      ? '<p class="ice-soft">Kingston · soft check — confirm with the club.</p>' : "";
    var empty = !roster.length
      ? '<p class="ice-note">No roster seats loaded for that team yet — Dualis does not invent names.</p>' : "";
    var prove = state.showProve ? (
      '<p class="ice-note">Keep the seat above, then continue. TeamSnap Connect binds that seat on this phone.</p>' +
      '<button type="button" class="ice-btn" data-prove="teamsnap">Continue with TeamSnap</button>' +
      '<button type="button" class="ice-btn ghost" data-prove="spordle">Continue with Spordle</button>'
    ) : '<button type="button" class="ice-btn ghost" id="btnShowProve">Prove it’s you</button>';

    var pendNote = "";
    var pend = getPendingClaim();
    if (!seatIsBound() && pend && pend.jersey != null) {
      pendNote = '<p class="ice-soft">Connecting TeamSnap for #' + esc(String(pend.jersey)) +
        " — seat seals only after Allow. Not bound yet.</p>";
    }
    return '<h1 class="ice-h">Your seat</h1>' +
      '<p class="ice-p">Team, then jersey. Same for every player.</p>' +
      pendNote +
      '<div class="ice-field"><label for="teamSelect">Team</label>' +
      '<select id="teamSelect">' + teams + "</select></div>" +
      soft + empty +
      '<div class="ice-field"><label for="seatSelect">Seat</label>' +
      '<select id="seatSelect"' + (roster.length ? "" : " disabled") + ">" +
      (seats || '<option value="">No seats</option>') + "</select></div>" +
      prove +
      '<p class="ice-note">First + last initial only. Pay is ' + esc(payLabel()) + ".</p>" +
      '<button type="button" class="ice-btn ghost" id="btnResetIce" style="margin-top:0.85rem;">Reset ice on this phone</button>' +
      '<p class="ice-note">Clears demo binds, TeamSnap token, and seat on <strong>this device only</strong> — use before a clean Connect test.</p>';
  }


  /** Next N cited games (OMHA slate + TeamSnap cache), soonest first. Never invent. */
  function upcomingGameBoards(limit, skipHubNext) {
    /* limit <= 0 → full cited slate (scroll viewport clips the face) */
    var lim = (limit == null || limit === undefined) ? 3 : limit;
    if (lim <= 0) lim = 999;
    var now = Date.now();
    var hub = preferredHubBoard();
    var hubIso = hub && hub.startISO ? String(hub.startISO) : "";
    var rows = [];
    var seen = {};
    function pushEv(ev, kindHint) {
      if (!ev || !ev.start) return;
      var t = new Date(ev.start).getTime();
      if (isNaN(t) || t < now - 60 * 60 * 1000) return; /* drop past */
      if (ev.is_tournament || ev.event_type === "Tournament") return;
      if (!(ev.is_game || ev.event_type === "Game" || kindHint === "game" || ev.opponent)) return;
      var key = String(ev.start) + "|" + String(ev.opponent || ev.name || "");
      if (seen[key]) return;
      seen[key] = 1;
      if (skipHubNext && hubIso && String(ev.start) === hubIso) return;
      var board = null;
      if (ev.source === "omha-aaa" || ev.source === "omha" || ev.game_no) board = boardFromOmhaEvent(ev);
      else board = boardFromTsEvent(ev, "game");
      if (board) rows.push({ t: t, board: board });
    }
    var omha = omhaCitedSchedule() || [];
    for (var i = 0; i < omha.length; i++) pushEv(omha[i], "game");
    var bundle = tsNextBundle();
    var up = (bundle && bundle.upcoming) || [];
    for (var j = 0; j < up.length; j++) pushEv(up[j], "game");
    if (bundle && bundle.game) pushEv(bundle.game, "game");
    rows.sort(function (a, b) { return a.t - b.t; });
    var out = [];
    for (var k = 0; k < rows.length && out.length < lim; k++) out.push(rows[k].board);
    return out;
  }

  function shortWhere(where) {
    var w = String(where || "").trim();
    if (!w || w === "TBD") return w || "—";
    /* Drop parenthetical pad noise for one-liners */
    w = w.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
    if (w.length > 36) w = w.slice(0, 34) + "…";
    return w;
  }

  function upcomingGamesListHtml(boards) {
    var list = boards || [];
    var rows = "";
    if (!list.length) {
      rows = '<div class="ice-up-row ice-up-empty">— awaiting cited games</div>';
    } else {
      for (var i = 0; i < list.length; i++) {
        var b = list[i];
        var who = String(b.who || "");
        var m = who.match(/^vs\s+(.+)$/i);
        var opp = m ? m[1] : who;
        var ha = b.kind === "away" ? "A" : (b.kind === "home" ? "H" : "·");
        var haCls = "ice-up-ha" + (b.kind === "away" ? " ice-up-ha-away" : (b.kind === "home" ? " ice-up-ha-home" : ""));
        var city = oppCityFace(opp);
        rows += '<div class="ice-up-row ice-up-row-city">' +
          '<span class="ice-up-when">' + esc(b.when || "—") + "</span>" +
          '<span class="' + haCls + '" title="' + esc(b.kind || "") + '">' + esc(ha) + "</span>" +
          '<span class="ice-up-opp">' + esc(city) + "</span>" +
        "</div>";
      }
    }
    return '<div class="ice-up-block" aria-label="Next games">' +
      '<div class="ice-hub-k">Next games</div>' +
      '<div class="ice-up-scroll" role="region" aria-label="Scroll all upcoming games">' +
        '<div class="ice-up-list">' + rows + "</div>" +
      "</div>" +
    "</div>";
  }

  function boardFromTourneyPackEv(ev) {
    if (!ev) return null;
    var when = ev.when_face || "—";
    if ((!when || when === "—") && ev.start) {
      var start = new Date(ev.start);
      var end = ev.end ? new Date(ev.end) : null;
      if (!isNaN(start.getTime()) && end && !isNaN(end.getTime())) {
        when = start.toLocaleString(undefined, { month: "short", day: "numeric" }) +
          "–" + end.toLocaleString(undefined, { month: "short", day: "numeric" });
      } else if (!isNaN(start.getTime())) {
        when = start.toLocaleString(undefined, { month: "short", day: "numeric" });
      }
    }
    var who = ev.name || "Tournament";
    var city = ev.city_face || ev.location || "—";
    if (!city) city = "—";
    return {
      when: when,
      who: who,
      where: city,
      kind: "tournament",
      cite_status: ev.cite_status || "",
      note: "tourney"
    };
  }
  function tournamentOneLinerHtml(board) {
    /* One row — same weight as Next Games. */
    var when = board ? (board.when || "—") : "—";
    var who = board ? String(board.who || "").trim() : "";
    if (!who) who = "Tournament";
    var whereRaw = board ? String(board.where || "").trim() : "";
    var city = whereRaw;
    if (city && city.length > 42) city = shortWhere(city);
    if (!city) city = "—";
    return '<div class="ice-tourney-row">' +
      '<span class="ice-tourney-when">' + esc(when) + "</span>" +
      '<span class="ice-tourney-who">' + esc(who) + "</span>" +
      '<span class="ice-tourney-city">' + esc(city) + "</span>" +
    "</div>";
  }
  function tournamentsBlockHtml(boards) {
    var list = boards || [];
    var rows = "";
    if (!list.length) {
      rows = '<div class="ice-tourney-row ice-up-empty">— awaiting cited tournaments</div>';
    } else {
      for (var i = 0; i < list.length; i++) rows += tournamentOneLinerHtml(list[i]);
    }
    return '<div class="ice-tourney-line ice-tourney-card" aria-label="Upcoming tournaments">' +
      '<div class="ice-tourney-k">Tournaments</div>' +
      '<div class="ice-tourney-list">' + rows + "</div>" +
    "</div>";
  }

  function renderGame() {
    if (!seatIsBound()) return lockedHtml();
    var bundle = tsNextBundle();
    /* Matchup cite sheet lives on Cal — Game Day keeps countdown + who + where + games list. */
    var packEvs = citedTournaments();
    var tourneyBoards = [];
    for (var ti = 0; ti < packEvs.length; ti++) {
      var pb = boardFromTourneyPackEv(packEvs[ti]);
      if (pb) tourneyBoards.push(pb);
    }
    if (!tourneyBoards.length) {
      var one = boardFromTsEvent(bundle.tournament, "tournament") || boardFromCitedTournament(kmhaCitedTournament());
      if (one) tourneyBoards.push(one);
    }
    var hub = preferredHubBoard();
    var hubK = "Next";
    var hubSub = "—";
    var hubWhere = "—";
    var hubWho = "";
    var hubOpp = "—";
    if (hub) {
      hubK = hub.kind === "practice" ? "Practice starts" : "Puck drop";
      hubSub = hub.when;
      hubWhere = hub.where;
      hubWho = String(hub.who || "");
      var hm = hubWho.match(/^vs\s+(.+)$/i);
      hubOpp = hm ? hm[1] : (hubWho || "—");
    }
    /* Sleek hub: time → vs → arena Maps chip (no WHERE label). */
    var mapsHref = mapsDir(hubWhere && hubWhere !== "—" ? hubWhere : (lsGet(RINK_KEY) || DEFAULT_RINK || ""));
    var arenaFace = (hubWhere && hubWhere !== "—") ? hubWhere : "—";
    var arenaChip = (arenaFace !== "—")
      ? ('<a class="ice-hub-arena" id="hubArenaMaps" target="_blank" rel="noopener" href="' + esc(mapsHref) + '" aria-label="Open Maps to arena">' +
          '<span class="ice-hub-arena-place">' + esc(arenaFace) + "</span>" +
        "</a>")
      : '<div class="ice-hub-arena is-empty" id="hubArenaMaps"><span class="ice-hub-arena-place">—</span></div>';
    return '<div class="ice-game-compact ice-game-roomy">' +
      '<h1 class="ice-h ice-game-h">Game day</h1>' +
      '<div class="ice-hub">' +
        '<div class="ice-hub-main">' +
          '<div class="ice-hub-k">' + esc(hubK) + "</div>" +
          '<div class="ice-hub-v" id="hubPuckClock">…</div>' +
          '<div class="ice-hub-sub" id="hubPuckSub">' + esc(hubSub) + "</div>" +
          '<div class="ice-hub-vs" id="hubOppLine" aria-label="Opponent">' +
            '<span class="ice-hub-vs-lab">vs</span>' +
            '<span class="ice-hub-opp">' + esc(hubOpp) + "</span>" +
          "</div>" +
          arenaChip +
        "</div>" +
        '<p class="ice-hub-status" id="hubStatus"' + (hub ? "" : " hidden") + '></p>' +
      "</div>" +
      '<div class="ice-game-up-grow">' +
        upcomingGamesListHtml(upcomingGameBoards(0, false)) +
      "</div>" +
      '<div class="ice-game-tourney-wrap">' +
        tournamentsBlockHtml(tourneyBoards) +
      "</div>" +
      renderLeagueStub() +
    "</div>";
  }

  /** League view under Game — no new dock tab. Shells only until GameSheet/OMHA cites land. Never invent. */
  function renderLeagueStub() {
    var seat = getSeat() || {};
    var league = String(seat.league || seat.league_id || "OMHA").toUpperCase();
    if (league.indexOf("OMHA") !== -1) league = "OMHA";
    return (
      '<section class="ice-league" id="iceLeague" aria-label="League view">' +
        '<div class="ice-league-head">' +
          '<div class="ice-league-k">League</div>' +
          '<div class="ice-league-name">' + esc(league) + " · U16 AAA</div>" +
        "</div>" +
        '<div class="ice-league-tabs" role="tablist">' +
          '<button type="button" class="ice-league-tab on" data-league-pane="scores" role="tab" aria-selected="true">Scores</button>' +
          '<button type="button" class="ice-league-tab" data-league-pane="standings" role="tab" aria-selected="false">Standings</button>' +
          '<button type="button" class="ice-league-tab" data-league-pane="scorers" role="tab" aria-selected="false">Scorers</button>' +
        "</div>" +
        '<div class="ice-league-pane on" data-league-body="scores">' +
          '<p class="ice-league-empty">Out-of-town scores — awaiting GameSheet / league cite. Dualis never invents a score.</p>' +
        "</div>" +
        '<div class="ice-league-pane" data-league-body="standings" hidden>' +
          '<p class="ice-league-empty">Standings — awaiting OMHA / GameSheet cite. Dash until real.</p>' +
        "</div>" +
        '<div class="ice-league-pane" data-league-body="scorers" hidden>' +
          '<p class="ice-league-empty">Leading scorers — GameSheet when connected. Never invent a points race.</p>' +
        "</div>" +
      "</section>"
    );
  }


  var CAL_KINDS = {
    home: { label: "Home", cls: "ice-cal-home" },
    away: { label: "Away", cls: "ice-cal-away" },
    game: { label: "Game", cls: "ice-cal-game" },
    practice: { label: "Practice", cls: "ice-cal-prac" },
    tournament: { label: "Tourny", cls: "ice-cal-tourney" },
    office: { label: "Off-ice", cls: "ice-cal-office" }
  };
  var CAL_YEAR_MIN = 2026;
  var CAL_YEAR_MAX = 2027;
  /* 2026–27 AAA season: forward through May for OMHA/peer + OHF championships (very end). */
  var CAL_SEASON_END = new Date(2027, 4, 31); /* May 31, 2027 */
  var CAL_SEASON_START_FALLBACK = new Date(2026, 8, 1); /* Sep 1, 2026 if cache empty */
  var CAL_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  function calKindOf(ev) {
    if (!ev) return null;
    if (ev.is_tournament || ev.source === "kmha-blueline") return "tournament";
    if (ev.source === "omha-aaa" || ev.source === "omha") {
      if (ev.home_away === "away") return "away";
      if (ev.home_away === "home") return "home";
      return "game";
    }
    if (window.DCTeamSnap && DCTeamSnap.calendarKind) return DCTeamSnap.calendarKind(ev);
    if (window.DCTeamSnap && DCTeamSnap.classifyEvent) {
      var k = DCTeamSnap.classifyEvent(ev);
      return k || null;
    }
    return null;
  }

  function startOfWeekMon(d) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var day = x.getDay(); /* 0 Sun */
    var diff = day === 0 ? -6 : 1 - day;
    x.setDate(x.getDate() + diff);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function seasonBounds() {
    var lo = null;
    var all = (window.DCTeamSnap && DCTeamSnap.getCachedEvents) ? DCTeamSnap.getCachedEvents() : [];
    all = all.concat(omhaCitedSchedule());
    for (var i = 0; i < all.length; i++) {
      if (!all[i] || !all[i].start) continue;
      var ed = new Date(all[i].start);
      if (isNaN(ed.getTime())) continue;
      ed = new Date(ed.getFullYear(), ed.getMonth(), ed.getDate());
      if (!lo || ed < lo) lo = ed;
    }
    /* Past: only as far as cited rows exist — no empty decade. */
    if (!lo) lo = new Date(Math.max(CAL_SEASON_START_FALLBACK.getTime(), new Date().setHours(0,0,0,0)));
    if (lo.getFullYear() < CAL_YEAR_MIN) lo = new Date(CAL_YEAR_MIN, 0, 1);
    var hi = new Date(CAL_SEASON_END.getTime());
    if (hi < lo) hi = new Date(lo.getTime());
    return { lo: lo, hi: hi };
  }

  function clampCalDate(d) {
    var b = seasonBounds();
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (x < b.lo) return new Date(b.lo.getTime());
    if (x > b.hi) return new Date(b.hi.getTime());
    return x;
  }

  function ensureCalAnchor() {
    /* Month-grid Cal: anchor = 1st of visible month (season-clamped). */
    if (state.calAnchor instanceof Date && !isNaN(state.calAnchor.getTime())) {
      var c = clampCalDate(state.calAnchor);
      state.calAnchor = new Date(c.getFullYear(), c.getMonth(), 1);
      return state.calAnchor;
    }
    var now = clampCalDate(new Date());
    state.calAnchor = new Date(now.getFullYear(), now.getMonth(), 1);
    return state.calAnchor;
  }

  function ymd(d) {
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
  }

  function eventsForDay(dayDate) {
    var ts = (window.DCTeamSnap && DCTeamSnap.getCachedEvents) ? DCTeamSnap.getCachedEvents() : [];
    var omha = omhaCitedSchedule();
    var tourneyEv = kmhaCitedTournament();
    var key = ymd(dayDate);
    var out = [];
    var seen = {};
    function pushEv(ev) {
      if (!ev || !ev.start) return;
      var ed = new Date(ev.start);
      if (isNaN(ed.getTime())) return;
      /* Multi-day tourney: paint each day from start..end */
      var endD = ev.end ? new Date(ev.end) : ed;
      if (isNaN(endD.getTime())) endD = ed;
      var day0 = new Date(ed.getFullYear(), ed.getMonth(), ed.getDate());
      var day1 = new Date(endD.getFullYear(), endD.getMonth(), endD.getDate());
      var focus = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
      if (focus < day0 || focus > day1) return;
      var id = ev.game_no || (String(ev.start) + "|" + String(ev.opponent || ev.name || ""));
      if (seen[id]) return;
      seen[id] = true;
      out.push(ev);
    }
    /* OMHA + cited tourney paint first; TeamSnap overlays later. */
    for (var i = 0; i < omha.length; i++) pushEv(omha[i]);
    if (tourneyEv) pushEv(tourneyEv);
    for (var j = 0; j < ts.length; j++) pushEv(ts[j]);
    out.sort(function (a, b) { return String(a.start).localeCompare(String(b.start)); });
    return out;
  }

  function primaryKindForDay(evs) {
    var order = ["tournament", "home", "away", "game", "practice", "office"];
    var seen = {};
    for (var i = 0; i < evs.length; i++) {
      var k = calKindOf(evs[i]);
      if (k) seen[k] = true;
    }
    for (var j = 0; j < order.length; j++) {
      if (seen[order[j]]) return order[j];
    }
    return null;
  }

  function renderCal() {
    if (!seatIsBound()) return lockedHtml();
    var anchor = ensureCalAnchor();
    var y = anchor.getFullYear();
    var m = anchor.getMonth();
    var first = new Date(y, m, 1);
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    /* Sunday-first column index 0..6 (household Cal) */
    var lead = first.getDay();

    var focus = state.calDayFocus;
    if (!focus || Number(focus.slice(0, 4)) !== y || Number(focus.slice(5, 7)) !== (m + 1)) {
      var today = clampCalDate(new Date());
      if (today.getFullYear() === y && today.getMonth() === m) focus = ymd(today);
      else focus = ymd(first);
      state.calDayFocus = focus;
    }

    var dows = ["S", "M", "T", "W", "T", "F", "S"];
    var head = '<div class="ice-cal-month-dows">' + dows.map(function (d) {
      return '<span>' + d + "</span>";
    }).join("") + "</div>";

    var cells = "";
    var total = lead + daysInMonth;
    var rows = Math.ceil(total / 7) * 7;
    for (var i = 0; i < rows; i++) {
      var dayNum = i - lead + 1;
      if (dayNum < 1 || dayNum > daysInMonth) {
        cells += '<div class="ice-cal-mday is-pad" aria-hidden="true"></div>';
        continue;
      }
      var d = new Date(y, m, dayNum);
      var key = ymd(d);
      var evs = eventsForDay(d);
      var dayStays = staysForDay(d);
      var pk = primaryKindForDay(evs);
      var cls = "ice-cal-mday" + (pk ? " " + CAL_KINDS[pk].cls : "") + (dayStays.length ? " has-stay" : "") + (key === focus ? " is-on" : "");
      var dot = (evs.length || dayStays.length) ? '<span class="ice-cal-dot" aria-hidden="true"></span>' : "";
      var stayDot = dayStays.length ? '<span class="ice-cal-stay-dot" title="Stay" aria-hidden="true"></span>' : "";
      cells += '<button type="button" class="' + cls + '" data-cal-day="' + esc(key) + '" aria-label="' +
        esc(CAL_MONTHS[m] + " " + dayNum) + (evs.length ? (" · " + evs.length + " events") : "") + (dayStays.length ? (" · " + dayStays.length + " stay") : "") + '">' +
        '<span class="ice-cal-num">' + dayNum + "</span>" + dot + stayDot + "</button>";
    }

    var focusDate = new Date(Number(focus.slice(0, 4)), Number(focus.slice(5, 7)) - 1, Number(focus.slice(8, 10)));
    var focusEvs = eventsForDay(focusDate);
    var tray = "";
    var matchupBoard = null;
    for (var gi = 0; gi < focusEvs.length; gi++) {
      var gk = calKindOf(focusEvs[gi]);
      if (gk === "home" || gk === "away" || gk === "game" || gk === "tournament") {
        var gev = focusEvs[gi];
        matchupBoard = {
          who: gev.opponent ? ("vs " + gev.opponent) : (gev.name || "Game"),
          when: formatTsWhen(gev.start),
          where: gev.location || "",
          kind: gk
        };
        break;
      }
    }
    var focusStays = staysForDay(focusDate);
    if (!focusEvs.length && !focusStays.length) {
      tray = '<div class="ice-cal-tray-empty">—</div>';
    } else {
      var dateFace = CAL_MONTHS[focusDate.getMonth()].slice(0, 3).toUpperCase() + " " + focusDate.getDate();
      tray = focusEvs.length
        ? ('<ul class="ice-cal-list ice-cal-tray-list">' + focusEvs.map(function (ev, ei) {
        var k = calKindOf(ev) || "office";
        var meta = CAL_KINDS[k] || CAL_KINDS.office;
        var timeFace = formatTsTime(ev.start);
        var who;
        if (ev.opponent) who = "vs " + ev.opponent;
        else who = ev.name || ev.event_type || "Event";
        var arena = (ev.location || "").trim();
        var dateBit = (ei === 0)
          ? ('<span class="ice-cal-tray-k ice-cal-ev-date">' + esc(dateFace) + "</span>")
          : '<span class="ice-cal-ev-date ice-cal-ev-date-pad" aria-hidden="true"></span>';
        return '<li class="' + meta.cls + '">' +
          '<div class="ice-cal-ev-main">' +
            dateBit +
            '<span class="ice-cal-pill">' + esc(meta.label) + "</span>" +
            '<strong class="ice-cal-ev-who">' + esc(who) + "</strong>" +
            (timeFace ? ('<span class="ice-cal-ev-time">' + esc(timeFace) + "</span>") : "") +
          "</div>" +
          (arena ? ('<div class="ice-cal-ev-arena ice-soft">' + esc(arena) + "</div>") : "") +
        "</li>";
      }).join("") + "</ul>")
        : "";
      if (matchupBoard) {
        tray += '<div class="ice-cal-matchup">' + matchupLaneHtml(matchupBoard) + "</div>";
      }
      if (focusStays.length) {
        var tripDay = false;
        for (var ti = 0; ti < focusEvs.length; ti++) {
          var tk = calKindOf(focusEvs[ti]);
          if (tk === "away" || tk === "tournament") { tripDay = true; break; }
        }
        tray += '<div class="ice-cal-stays" aria-label="Stays this day">' +
          focusStays.map(function (row) {
            var s = row.s;
            var hasUrl = !!(s.url && /^https?:\/\//i.test(s.url));
            var bindLab = tripDay
              ? '<span class="ice-cal-pill ice-cal-stay-bind">Bound · this trip</span>'
              : (s.tripTitle
                ? ('<span class="ice-cal-pill ice-cal-stay-bind">bound · ' + esc(s.tripTitle) + "</span>")
                : "");
            return '<div class="ice-cal-stay-row">' +
              '<span class="ice-cal-pill ice-cal-stay-pill">Stay</span>' +
              bindLab +
              '<strong>' + esc(s.title || "Stay") + '</strong>' +
              '<span class="ice-soft">' + esc(s.checkInLabel || s.checkIn || "") + " → " + esc(s.checkOutLabel || s.checkOut || "") + "</span>" +
              (hasUrl
                ? ('<a class="ice-btn" target="_blank" rel="noopener" href="' + esc(s.url) + '">Open stay →</a>')
                : '<span class="ice-soft">No link yet</span>') +
            "</div>";
          }).join("") +
        "</div>";
      }
    }

    var legend = '<p class="ice-cal-legend" aria-label="Color legend">' +
      '<span class="ice-cal-home"><i></i>Home</span>' +
      '<span class="ice-cal-away"><i></i>Away</span>' +
      '<span class="ice-cal-prac"><i></i>Practice</span>' +
      '<span class="ice-cal-tourney"><i></i>Tourny</span>' +
      '<span class="ice-cal-office"><i></i>Off-ice</span>' +
      '<span class="ice-cal-stay-leg"><i></i>Stay</span>' +
      "</p>";

    return '<div class="ice-cal-month-shell">' +
      '<div class="ice-cal-month-top">' +
        '<div class="ice-cal-month-head">' +
          '<h1 class="ice-h ice-cal-h">Cal</h1>' +
          '<div class="ice-cal-month-nav">' +
            '<button type="button" class="ice-cal-chev" id="calPrev" aria-label="Previous month">‹</button>' +
            '<div class="ice-cal-month-title">' + esc(CAL_MONTHS[m] + " " + y) + "</div>" +
            '<button type="button" class="ice-cal-chev" id="calNext" aria-label="Next month">›</button>' +
          "</div>" +
        "</div>" +
        legend +
        head +
        '<div class="ice-cal-month" role="grid">' + cells + "</div>" +
      "</div>" +
      '<div class="ice-cal-tray" aria-label="Events for selected day">' +
        tray +
      "</div>" +
    "</div>";
  }


  /** Next out-of-town seed for Go — OMHA/TeamSnap away first, then cited tourney. Never invent. */
  function nextAwayTrip() {
    var now = Date.now() - 3 * 60 * 60 * 1000;
    function earliestUpcoming(list, wantKinds) {
      var best = null, bestT = null;
      for (var i = 0; i < (list || []).length; i++) {
        var ev = list[i];
        if (!ev || !ev.start) continue;
        var t = new Date(ev.start).getTime();
        if (isNaN(t) || t < now) continue;
        var k = calKindOf(ev);
        if (wantKinds.indexOf(k) < 0) continue;
        if (bestT == null || t < bestT) {
          best = ev;
          bestT = t;
        }
      }
      return best;
    }
    var tsList = [];
    try {
      if (window.DCTeamSnap && DCTeamSnap.upcomingAndRecent) {
        tsList = (DCTeamSnap.upcomingAndRecent().upcoming) || [];
      } else if (window.DCTeamSnap && DCTeamSnap.getCachedEvents) {
        tsList = DCTeamSnap.getCachedEvents() || [];
      }
    } catch (e0) { tsList = []; }
    var omha = omhaCitedSchedule() || [];
    var tourneyEv = kmhaCitedTournament();
    var away = earliestUpcoming(tsList.concat(omha), ["away"]);
    var tourney = earliestUpcoming(
      (tourneyEv ? [tourneyEv] : []).concat(tsList).concat(omha),
      ["tournament"]
    );
    var pick = away || tourney || null;
    if (!pick) return null;
    var title = pick.opponent
      ? ("vs " + pick.opponent)
      : (pick.name || pick.event_type || "Away");
    var cite = "";
    if (pick.source === "omha-aaa" || pick.source === "omha") cite = "OMHA-AAA";
    else if (pick.source === "kmha-blueline") cite = "KMHA";
    else if (pick.source) cite = String(pick.source);
    return {
      title: title,
      when: formatTsWhen(pick.start),
      location: pick.location || "",
      kind: calKindOf(pick) || "away",
      start: pick.start || "",
      end: pick.end || "",
      cite: cite,
      name: pick.name || ""
    };
  }

  /** Suggest lodging nights around a trip — Fri before → Mon after when dates known. Never invent the trip. */
  function stayDatesFromTrip(trip) {
    if (!trip || !trip.start) return null;
    var start = new Date(trip.start);
    if (isNaN(start.getTime())) return null;
    var end = trip.end ? new Date(trip.end) : new Date(start);
    if (isNaN(end.getTime())) end = new Date(start);
    /* Check-in: day before first event (or same day if already Fri/Sat travel) */
    var cin = new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1);
    var cout = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);
    function ymdLocal(d) {
      var m = d.getMonth() + 1, day = d.getDate();
      return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
    }
    return {
      checkIn: ymdLocal(cin),
      checkOut: ymdLocal(cout),
      label: (trip.kind === "tournament" ? "Tourny stay" : "Away stay") +
        (trip.title ? (" · " + trip.title) : ""),
      tripKind: trip.kind || "",
      tripTitle: trip.title || "",
      tripStart: trip.start || ""
    };
  }


  /* Stays are on-device only — paste Airbnb/hotel link. NEVER seed Dom/household trips as product defaults. */
  var HOUSEHOLD_STAY_SCRUB = {
    ids: { "stay-hmzhe3ett": 1 },
    confs: { "HMAZHE3ETT": 1, "HMY24DWNYZ": 1 },
    phones: { "+15482556105": 1, "5482556105": 1 }
  };
  function isHouseholdStayLeak(s) {
    if (!s) return false;
    if (s.id && HOUSEHOLD_STAY_SCRUB.ids[s.id]) return true;
    if (s.conf && HOUSEHOLD_STAY_SCRUB.confs[String(s.conf).toUpperCase()]) return true;
    if (s.conf2 && HOUSEHOLD_STAY_SCRUB.confs[String(s.conf2).toUpperCase()]) return true;
    var tel = String(s.phone || "").replace(/[^0-9]/g, "");
    if (tel && HOUSEHOLD_STAY_SCRUB.phones[tel]) return true;
    if (String(s.host || "").toLowerCase() === "somya" && /kitchener/i.test(String(s.address || ""))) return true;
    return false;
  }
  function scrubHouseholdStays(list) {
    return (list || []).filter(function (s) { return !isHouseholdStayLeak(s); });
  }
  function loadStays() {
    try {
      var row = JSON.parse(lsGet(STAY_KEY) || "[]");
      if (!Array.isArray(row)) row = [];
      var cleaned = scrubHouseholdStays(row);
      if (cleaned.length !== row.length) {
        try { lsSet(STAY_KEY, JSON.stringify(cleaned)); } catch (e0) {}
      }
      return cleaned;
    } catch (e) { return []; }
  }

  /** Preferred hotel affiliate for a dest — cite/affiliation only. Empty = Maps hotel search. Never invent Dom stays. */
  function preferredHotelForDest(dest) {
    /* Fill only when Dualis has a real hotel affiliation for that market. */
    var map = {
      /* e.g. "Kitchener": { name: "…", url: "https://…", cite: "team rate · manager" } */
    };
    var key = String(dest || "").trim();
    if (!key) return null;
    if (map[key]) return map[key];
    /* soft city match */
    var lower = key.toLowerCase();
    for (var k in map) {
      if (!Object.prototype.hasOwnProperty.call(map, k)) continue;
      if (lower.indexOf(String(k).toLowerCase()) !== -1) return map[k];
    }
    return null;
  }

  function saveStays(list) {
    lsSet(STAY_KEY, JSON.stringify(list || []));
  }

  /** Parse check-in / check-out from stay fields. Never invent dates. */
  function stayParseDay(s) {
    if (!s) return null;
    var raw = String(s.checkIn || s.check_in || s.start || "").trim();
    if (!raw && s.checkInLabel) {
      /* Try labels like "Nov 5" / "Nov 5, 2026" / "2026-11-05" */
      raw = String(s.checkInLabel).trim();
    }
    if (!raw) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      var p = raw.slice(0, 10).split("-");
      return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    }
    var d = new Date(raw);
    if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return null;
  }
  function stayParseOut(s) {
    if (!s) return null;
    var raw = String(s.checkOut || s.check_out || s.end || "").trim();
    if (!raw && s.checkOutLabel) raw = String(s.checkOutLabel).trim();
    if (!raw) {
      /* If only check-in known, treat as same-day envelope until checkout pasted */
      return stayParseDay(s);
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      var p = raw.slice(0, 10).split("-");
      return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    }
    var d = new Date(raw);
    if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return null;
  }
  function stayStartMs(s) {
    var d = stayParseDay(s);
    return d ? d.getTime() : Number.POSITIVE_INFINITY;
  }
  function stayEndMs(s) {
    var d = stayParseOut(s);
    if (!d) return stayStartMs(s);
    /* inclusive checkout morning — active through end of checkout day */
    return d.getTime() + 24 * 3600000 - 1;
  }
  /** Next stay for Go face: soonest check-in that is not fully past checkout. One card only. */
  function nextUpcomingStay(now) {
    now = now || new Date();
    var n = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    var list = loadStays().slice();
    var live = [];
    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      if (!s) continue;
      var end = stayEndMs(s);
      if (end < n) continue; /* expired — hide from Go */
      live.push({ s: s, idx: i, start: stayStartMs(s) });
    }
    live.sort(function (a, b) { return a.start - b.start; });
    return live.length ? live[0] : null;
  }
  /** Stays overlapping a calendar day (for Cal tags / tray links). */
  function staysForDay(d) {
    if (!d) return [];
    var day0 = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    var day1 = day0 + 24 * 3600000 - 1;
    var out = [];
    var list = loadStays();
    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      var a = stayStartMs(s);
      var b = stayEndMs(s);
      if (a === Number.POSITIVE_INFINITY) continue;
      if (b < day0 || a > day1) continue;
      out.push({ s: s, idx: i });
    }
    return out;
  }

  function renderStayCard(s, idx, opts) {
    opts = opts || {};
    var mapsStay = mapsDir(s.address || "");
    var hasUrl = !!(s.url && /^https?:\/\//i.test(s.url));
    var tel = String(s.phone || "").replace(/[^0-9+]/g, "");
    var hostName = s.host || "";
    var hostBtn = "";
    if (hostName && tel) {
      hostBtn =
        '<button type="button" class="ice-go-host-name" data-host-sheet="' + idx + '" aria-haspopup="dialog">' +
          esc(hostName) +
        "</button>";
    } else if (hostName) {
      hostBtn = "<strong>" + esc(hostName) + "</strong>";
    }
    var hostRow = hostName
      ? ('<div class="ice-go-stay-host">' +
          '<span class="ice-go-stay-host-lab">Host</span> ' +
          hostBtn +
        "</div>")
      : "";
    var sheet = (hostName && tel)
      ? ('<div class="ice-go-host-sheet" id="hostSheet' + idx + '" hidden>' +
          '<div class="ice-go-host-sheet-card" role="dialog" aria-label="Contact ' + esc(hostName) + '">' +
            '<div class="ice-go-host-sheet-title">' + esc(hostName) + "</div>" +
            '<div class="ice-soft">' + esc(s.phone) + "</div>" +
            '<div class="ice-go-host-sheet-acts">' +
              '<a class="ice-btn" href="tel:' + esc(tel) + '">Call</a>' +
              '<a class="ice-btn" href="sms:' + esc(tel) + '">Text</a>' +
              (hasUrl
                ? '<a class="ice-btn ghost" target="_blank" rel="noopener" href="' + esc(s.url) + '">Message on Airbnb</a>'
                : "") +
              '<button type="button" class="ice-btn ghost" data-host-close="' + idx + '">Close</button>' +
            "</div>" +
          "</div>" +
        "</div>")
      : "";
    var confLine = [];
    if (s.conf) confLine.push(s.conf);
    if (s.conf2) confLine.push(s.conf2);
    var confHtml = confLine.length
      ? ('<div class="ice-soft">Conf · ' + esc(confLine.join(" · ")) +
          (s.guests ? (" · " + esc(String(s.guests)) + " guests") : "") + "</div>")
      : "";
    var actions = "";
    var paste = "";
    if (hasUrl) {
      actions =
        '<div class="ice-hub-actions ice-go-stay-actions">' +
          '<a class="ice-btn" target="_blank" rel="noopener" href="' + esc(s.url) + '">Open stay →</a>' +
          (s.address
            ? '<a class="ice-btn ghost" target="_blank" rel="noopener" href="' + esc(mapsStay) + '">Directions →</a>'
            : "") +
        "</div>";
    } else {
      actions =
        '<div class="ice-hub-actions ice-go-stay-actions">' +
          (s.address
            ? '<a class="ice-btn ghost" target="_blank" rel="noopener" href="' + esc(mapsStay) + '">Directions →</a>'
            : "") +
        "</div>";
      paste =
        '<div class="ice-field"><label for="stayUrl' + idx + '">Airbnb reservation link</label>' +
          '<input id="stayUrl' + idx + '" data-stay-url="' + idx + '" value="" placeholder="https://www.airbnb.com/trips/…" inputmode="url" autocomplete="off"></div>' +
        '<button type="button" class="ice-btn" data-stay-save="' + idx + '">Save link</button>';
    }
    var addMore = opts.showAddMore
      ? ('<div class="ice-go-stay-more">' +
          '<button type="button" class="ice-btn ghost" data-stay-add-link>Add stay</button>' +
          '<div id="stayAddPanel" hidden>' +
            '<p class="ice-note" style="margin:0.35rem 0 0.55rem;">Dates required — they bind this stay onto Cal for the trip weekend. Prefills from next away/tourny when known.</p>' +
            '<div class="ice-field"><label for="stayUrlNew">Reservation link</label>' +
              '<input id="stayUrlNew" data-stay-url-new value="" placeholder="https://www.airbnb.com/trips/…" inputmode="url" autocomplete="off"></div>' +
            '<div class="ice-field"><label for="stayInNew">Check-in (YYYY-MM-DD)</label>' +
              '<input id="stayInNew" data-stay-in-new value="" placeholder="2026-11-05" inputmode="text" autocomplete="off"></div>' +
            '<div class="ice-field"><label for="stayOutNew">Check-out (YYYY-MM-DD)</label>' +
              '<input id="stayOutNew" data-stay-out-new value="" placeholder="2026-11-07" inputmode="text" autocomplete="off"></div>' +
            '<div class="ice-field"><label for="stayTitleNew">Label (optional)</label>' +
              '<input id="stayTitleNew" data-stay-title-new value="" placeholder="Peterborough · TOC" autocomplete="off"></div>' +
            '<button type="button" class="ice-btn" id="btnStayAdd">Save stay</button>' +
          "</div>" +
        "</div>")
      : "";
    return '<div class="ice-go-stay" data-stay-id="' + esc(s.id || ("stay-" + idx)) + '">' +
      '<div class="ice-go-stay-k">Stay · next</div>' +
      '<div class="ice-go-stay-title">' + esc(s.title || "Stay") + "</div>" +
      '<div class="ice-go-stay-when">' + esc(s.checkInLabel || s.checkIn || "") + " → " + esc(s.checkOutLabel || s.checkOut || "") + "</div>" +
      '<div class="ice-go-stay-loc">' + esc(s.address || "") + "</div>" +
      hostRow +
      sheet +
      confHtml +
      actions +
      paste +
      addMore +
    "</div>";
  }

  function renderStayEmpty() {
    return '<div class="ice-go-stay ice-go-stay-empty">' +
      '<div class="ice-go-stay-k">Stay</div>' +
      '<p class="ice-soft" style="margin:0.35rem 0 0.55rem;">Paste link + check-in/out. Dates bake it onto Cal for that trip weekend — tap the day, Open stay. Next stay shows on Go.</p>' +
      '<div class="ice-field"><label for="stayUrlNew">Reservation link</label>' +
        '<input id="stayUrlNew" data-stay-url-new value="" placeholder="https://www.airbnb.com/trips/…" inputmode="url" autocomplete="off"></div>' +
      '<div class="ice-field"><label for="stayInNew">Check-in (YYYY-MM-DD)</label>' +
        '<input id="stayInNew" data-stay-in-new value="" placeholder="2026-11-05" inputmode="text" autocomplete="off"></div>' +
      '<div class="ice-field"><label for="stayOutNew">Check-out (YYYY-MM-DD)</label>' +
        '<input id="stayOutNew" data-stay-out-new value="" placeholder="2026-11-07" inputmode="text" autocomplete="off"></div>' +
      '<div class="ice-field"><label for="stayTitleNew">Label (optional)</label>' +
        '<input id="stayTitleNew" data-stay-title-new value="" placeholder="Peterborough · TOC" autocomplete="off"></div>' +
      '<button type="button" class="ice-btn" id="btnStayAdd">Save stay</button>' +
    "</div>";
  }

  function renderGo() {
    if (!seatIsBound()) return lockedHtml();
    var trip = nextAwayTrip();
    var dest = (trip && trip.location) ? trip.location : (lsGet(RINK_KEY) || "");
    if (trip && trip.location) {
      try { lsSet(RINK_KEY, trip.location); } catch (eSeed) {}
    }
    var tripCard = "";
    if (trip) {
      var kindLab = trip.kind === "tournament" ? "Next tournament" : "Next away";
      var citeBit = trip.cite ? (" · " + esc(trip.cite)) : "";
      tripCard =
        '<div class="ice-go-trip">' +
          '<div class="ice-go-trip-k">' + esc(kindLab) + citeBit + (trip.when ? (" · " + esc(trip.when)) : "") + "</div>" +
          '<div class="ice-go-trip-title">' + esc(trip.title) + "</div>" +
          (trip.location
            ? '<div class="ice-go-trip-loc">' + esc(trip.location) + "</div>"
            : '<div class="ice-go-trip-loc ice-go-muted">Location waits on TeamSnap</div>') +
        "</div>";
    } else {
      tripCard =
        '<div class="ice-go-trip is-empty">' +
          '<div class="ice-go-trip-k">Next away</div>' +
          '<div class="ice-go-trip-title">—</div>' +
          '<div class="ice-go-trip-loc ice-go-muted">—</div>' +
        "</div>";
    }

    var mapsRink = mapsDir(dest || DEFAULT_RINK);
    var q = encodeURIComponent(dest || "hockey rink");
    var fuelHref = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("gas station near " + (dest || ""));
    var prefHotel = preferredHotelForDest(dest);
    var hotelHref = prefHotel && prefHotel.url
      ? prefHotel.url
      : ("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("hotels near " + (dest || "")));
    var hotelLab = prefHotel && prefHotel.name ? "Hotel · preferred" : "Hotel";
    var airHref = "https://www.airbnb.com/s/" + q + "/homes";
    var foodHref = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("restaurants near " + (dest || ""));
    var icons =
      '<div class="ice-go-icons ice-go-icons-head" role="group" aria-label="Trip connects">' +
        '<a class="ice-go-icon" id="goFuel" target="_blank" rel="noopener" href="' + esc(fuelHref) + '">' +
          '<span class="ice-go-icon-glyph" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9">' +
              '<path d="M7 20V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14"/>' +
              '<path d="M7 12h8M15 8h2.5a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2H22"/>' +
              '<path d="M5 20h12"/>' +
            "</svg></span>" +
          '<span class="ice-go-icon-lab">Fuel</span></a>' +
        '<a class="ice-go-icon" id="goHotel" target="_blank" rel="noopener" href="' + esc(hotelHref) + '">' +
          '<span class="ice-go-icon-glyph" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8">' +
              '<path d="M3 20V9l9-5 9 5v11"/>' +
              '<path d="M7 20v-6h10v6M7 11h.01M12 11h.01M17 11h.01"/>' +
            "</svg></span>" +
          '<span class="ice-go-icon-lab">' + esc(hotelLab) + "</span></a>" +
        '<a class="ice-go-icon" id="goAirbnb" target="_blank" rel="noopener" href="' + esc(airHref) + '">' +
          '<span class="ice-go-icon-glyph" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8">' +
              '<path d="M12 21s-7-5.2-7-11a7 7 0 1 1 14 0c0 5.8-7 11-7 11z"/>' +
              '<circle cx="12" cy="10" r="2.2"/>' +
            "</svg></span>" +
          '<span class="ice-go-icon-lab">Airbnb</span></a>' +
        '<a class="ice-go-icon" id="goFood" target="_blank" rel="noopener" href="' + esc(foodHref) + '">' +
          '<span class="ice-go-icon-glyph" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8">' +
              '<path d="M8 3v8M8 11c0 2-1.5 3-3 3M8 7H5M16 3v18M16 8c2.5 0 4-1.5 4-4"/>' +
            "</svg></span>" +
          '<span class="ice-go-icon-lab">Food</span></a>' +
      "</div>";

    /* One Stay face only — next upcoming by check-in; expired roll off; empty = default. */
    var nextStay = nextUpcomingStay(new Date());
    var stayBits = nextStay
      ? renderStayCard(nextStay.s, nextStay.idx, { showAddMore: true })
      : renderStayEmpty();

    return '<div class="ice-go-compact ice-go-tight">' +
      '<div class="ice-go-head">' +
        '<h1 class="ice-h ice-go-h">Go</h1>' +
        icons +
      "</div>" +
      tripCard +
      '<a class="ice-btn" id="btnMaps" target="_blank" rel="noopener" href="' + esc(mapsRink) + '">Maps to rink →</a>' +
      (stayBits || "") +
    "</div>";
  }

  function openTapeWindow(url, title) {
    var u = String(url || "");
    if (!u) return null;
    /* Prefer a real tab. Feature-string popups often do nothing on phone Chrome. */
    var win = null;
    try { win = window.open(u, "_blank"); } catch (e0) { win = null; }
    if (win) {
      try { win.opener = null; } catch (e1) {}
      return win;
    }
    /* Gesture-safe fallback: synthetic <a target=_blank> */
    try {
      var a = document.createElement("a");
      a.href = u;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      return null;
    } catch (e2) {}
    location.href = u;
    return null;
  }


  /** Prefer TeamSnap event Notes URL (team posts stream link there) — never invent. */

  function getTapeAuth() {
    try {
      var row = JSON.parse(lsGet(TAPE_AUTH_KEY) || "null");
      if (!row) return { user: "", pass: "" };
      return { user: String(row.user || ""), pass: String(row.pass || "") };
    } catch (e) { return { user: "", pass: "" }; }
  }
  function setTapeAuth(user, pass) {
    user = String(user || "").trim();
    pass = String(pass || "");
    if (!user && !pass) {
      try { localStorage.removeItem(TAPE_AUTH_KEY); } catch (e0) {}
      return;
    }
    lsSet(TAPE_AUTH_KEY, JSON.stringify({ user: user, pass: pass }));
  }
  function tapeUrlWithAuth(rawUrl, user, pass) {
    var u = String(rawUrl || "").trim();
    if (!u || !user) return u;
    try {
      var parsed = new URL(u);
      if (parsed.username) return u;
      parsed.username = user;
      if (pass) parsed.password = pass;
      return parsed.toString();
    } catch (e) { return u; }
  }

  function streamUrlFromTeamSnap(opts) {
    opts = opts || {};
    var preferLb = !!opts.preferLiveBarn;
    try {
      if (!(window.DCTeamSnap && DCTeamSnap.getCachedEvents)) return "";
      var list = DCTeamSnap.getCachedEvents() || [];
      var now = Date.now();
      var fallback = "";
      for (var i = 0; i < list.length; i++) {
        var ev = list[i];
        if (!ev) continue;
        var t = ev.start ? new Date(ev.start).getTime() : 0;
        if (t && t + 6 * 3600000 < now) continue;
        var raw = String(ev.stream_url || "").trim();
        if (!raw) {
          var blob = [ev.notes, ev.name, ev.location].join(" ");
          var m = String(blob).match(/https?:\/\/[^\s<>"']+/i);
          raw = m ? m[0] : "";
        }
        if (!raw) continue;
        var low = raw.toLowerCase();
        var isLb = low.indexOf("livebarn.com") !== -1 || low.indexOf("watch.livebarn") !== -1;
        if (preferLb && isLb) return raw;
        if (!preferLb && isLb && !fallback) fallback = raw;
        if (!preferLb && !isLb) return raw;
        if (!fallback) fallback = raw;
      }
      return fallback;
    } catch (e) { return ""; }
  }

  /** Known watch target: saved URL → TeamSnap notes (LiveBarn preferred) → empty. Never invent. */
  function resolveKnownTapeStream(preferLiveBarn) {
    var saved = getTapeStream();
    if (saved) return saved;
    return streamUrlFromTeamSnap({ preferLiveBarn: !!preferLiveBarn }) || "";
  }

  function isLiveBarnUrl(u) {
    var low = String(u || "").toLowerCase();
    return low.indexOf("livebarn.com") !== -1 || low.indexOf("watch.livebarn") !== -1;
  }

  var LB_SIGNIN = "https://watch.livebarn.com/en/signin";

  /**
   * LiveBarn epiphany: Dualis IS the session. Families already have LB (~most of the roster).
   * We don't need their API — we craft the playground; their login/stream opens in a paired window.
   * CSP iframe deny is fine — the product is our chrome + scoreboard around their session, not embedding LB.
   */
  function liveBarnBlocksIframe(u) {
    return isLiveBarnUrl(u) || String(u || "") === LB_SIGNIN || getTapePipe() === "livebarn";
  }

  /** In-ice playground shell — Dualis chrome stays; vendor fills the hole when framing allows. */
  function openTapePlayground(url, label) {
    var u = String(url || "").trim();
    if (!u) return false;
    if (isLiveBarnUrl(u) || u === LB_SIGNIN || getTapePipe() === "livebarn") {
      if (isLiveBarnUrl(u) && u !== LB_SIGNIN) lsSet(TAPE_STREAM_KEY, u);
      setTapePipe("livebarn");
    } else {
      lsSet(TAPE_STREAM_KEY, getTapeStream() || u);
      setTapePipe("byo");
    }
    goStage("tape", true);
    setTimeout(function () {
      if (liveBarnBlocksIframe(u)) {
        /* Portrait-first: upright Tape invite stays; paired window for their login.
           Do NOT arm landscape shell / orientation.lock yet — that was going landscape too early. */
        applyTapeLiveEvents();
        openTapeWindow(u, label || "dualis_livebarn");
        return;
      }
      var shell = document.getElementById("tapeLandShell");
      if (shell) {
        if (tapeIsLandscape()) {
          shell.classList.add("active");
          document.documentElement.classList.add("ice-tape-land-lock");
          tryLockTapeLandscape();
        }
        applyTapeLiveEvents();
        var frame = shell.querySelector("iframe.ice-tape-frame");
        if (frame) {
          try { frame.src = u; } catch (e0) {}
        }
      } else {
        openTapeWindow(u, label || "dualis_tape");
      }
    }, 80);
    return true;
  }

  function getTapeStream() {
    return (lsGet(TAPE_STREAM_KEY) || "").trim();
  }

  function setTapePipe(id) {
    lsSet(TAPE_PIPE_KEY, id || "");
  }

  function getTapePipe() {
    return lsGet(TAPE_PIPE_KEY) || "";
  }


  var TAPE_LIVE_KEY = "dc.ice.gamesheet_live"; /* GameSheet live echo — cite only; API or watch */
  var TAPE_TICKER_MS = 16000;

  /** GameSheet live board — never invent scores or scorers. */
  function getTapeLiveBoard() {
    try {
      var row = JSON.parse(lsGet(TAPE_LIVE_KEY) || "null");
      if (!row || typeof row !== "object") return null;
      return row;
    } catch (e) { return null; }
  }

  function tapeScoreFace(v) {
    if (v === 0 || v === "0") return "0";
    if (v == null || v === "") return "—";
    return String(v);
  }

  /** Visitor left · Home right. Team names on board only — never in the goal ticker. */
  function tapeBoardTeams() {
    var seat = getSeat() || {};
    var live = getTapeLiveBoard() || {};
    var home = String(live.home || live.home_short || "").trim();
    var visitor = String(live.visitor || live.away || live.away_short || "").trim();
    if (!home) {
      var slug = seat.team_slug || state.teamSlug || (state.pack && state.pack.team_slug) || "";
      home = titleFromSlug(slug) || "Home";
      if (/quinte/i.test(home)) home = "Quinte";
    }
    if (!visitor) {
      try {
        var boards = typeof upcomingGameBoards === "function" ? upcomingGameBoards(1) : [];
        var g0 = boards && boards[0];
        visitor = (g0 && (g0.oppCityFace || g0.oppCity || g0.opponent)) || "";
      } catch (e0) { visitor = ""; }
    }
    if (!visitor) visitor = "Visitor";
    return { home: home, visitor: visitor };
  }

  /**
   * Which board side gets the goal roll.
   * GameSheet team → left=visitor / right=home. Never print team name in the ticker.
   */
  function tapeGoalSide(ev, live) {
    live = live || getTapeLiveBoard() || {};
    var teams = tapeBoardTeams();
    var side = String((ev && (ev.side || ev.board_side)) || "").toLowerCase();
    if (side === "visitor" || side === "away" || side === "left" || side === "v") return "visitor";
    if (side === "home" || side === "right" || side === "h") return "home";
    var team = String((ev && (ev.team || ev.team_name || ev.club)) || "").toLowerCase();
    if (!team) return "";
    var home = String(teams.home || live.home || "").toLowerCase();
    var visitor = String(teams.visitor || live.visitor || live.away || "").toLowerCase();
    if (home && team.indexOf(home) !== -1) return "home";
    if (visitor && team.indexOf(visitor) !== -1) return "visitor";
    if (live.home_id != null && ev.team_id != null && String(ev.team_id) === String(live.home_id)) return "home";
    if (live.visitor_id != null && ev.team_id != null && String(ev.team_id) === String(live.visitor_id)) return "visitor";
    if (live.away_id != null && ev.team_id != null && String(ev.team_id) === String(live.away_id)) return "visitor";
    return "";
  }

  /** #29 Name (3) — jersey + name; bracket = season goals from GameSheet when known. */
  function tapePlayerFace(p) {
    if (!p) return "";
    if (typeof p === "string") return String(p).trim();
    var num = p.jersey != null ? String(p.jersey) : (p.number != null ? String(p.number) : "");
    var name = String(p.name || p.player || p.last || "").trim();
    var seasonG = p.season_g != null ? p.season_g : (p.g != null ? p.g : p.goals);
    var face = "";
    if (num) face += "#" + num;
    if (name) face += (face ? " " : "") + name;
    if (seasonG != null && seasonG !== "" && face) face += " (" + String(seasonG) + ")";
    return face.trim();
  }

  /**
   * Goal ticker copy — no team name. Scorer + up to 2 assists (GameSheet whatever it has).
   * Example: #29 Di Genova (3) · #12 Smith (1) · #7 Jones (2)
   */
  function formatTapeGoalTicker(ev) {
    ev = ev || {};
    var parts = [];
    var scorer = tapePlayerFace(ev.scorer || {
      jersey: ev.jersey, number: ev.number, name: ev.scorer_name || ev.player,
      season_g: ev.season_g != null ? ev.season_g : ev.scorer_season_g
    });
    if (scorer) parts.push(scorer);
    var assists = ev.assists;
    if (!assists && (ev.a1 || ev.assist1 || ev.a2 || ev.assist2)) {
      assists = [];
      if (ev.a1 || ev.assist1) assists.push(ev.a1 || ev.assist1);
      if (ev.a2 || ev.assist2) assists.push(ev.a2 || ev.assist2);
    }
    if (Array.isArray(assists)) {
      for (var i = 0; i < assists.length && i < 2; i++) {
        var af = tapePlayerFace(assists[i]);
        if (af) parts.push(af);
      }
    } else if (typeof assists === "string" && assists.trim()) {
      parts.push(assists.trim());
    }
    return parts.join(" · ");
  }

  function renderTapeScoreboard() {
    var live = getTapeLiveBoard() || {};
    var teams = tapeBoardTeams();
    /* Visitor left, home right; mid = period + clock */
    var vs = tapeScoreFace(live.vs != null ? live.vs : (live.as != null ? live.as : live.away_score));
    var hs = tapeScoreFace(live.hs != null ? live.hs : live.home_score);
    var period = live.period != null && live.period !== "" ? String(live.period) : "—";
    var clock = live.clock != null && live.clock !== "" ? String(live.clock) : "—";
    var cite = live.source ? String(live.source) : "awaiting GameSheet";
    return (
      '<div class="ice-tape-sb" id="tapeScoreboard">' +
        '<div class="ice-tape-sb-row">' +
          '<span class="ice-tape-sb-side visitor">' +
            '<span class="ice-tape-sb-team">' + esc(teams.visitor) + '</span>' +
            '<span class="ice-tape-sb-score" id="tapeSbVs">' + esc(vs) + '</span>' +
          '</span>' +
          '<span class="ice-tape-sb-mid">' +
            '<span class="ice-tape-sb-clock" id="tapeSbClock">' + esc(clock) + '</span>' +
            '<span class="ice-tape-sb-period" id="tapeSbPeriod">P' + esc(period) + '</span>' +
          '</span>' +
          '<span class="ice-tape-sb-side home">' +
            '<span class="ice-tape-sb-score" id="tapeSbHs">' + esc(hs) + '</span>' +
            '<span class="ice-tape-sb-team">' + esc(teams.home) + '</span>' +
          '</span>' +
        '</div>' +
        '<div class="ice-tape-ticker-row" id="tapeTickerRow" aria-live="polite">' +
          '<div class="ice-tape-ticker visitor" id="tapeTickerVisitor"><div class="ice-tape-ticker-inner" id="tapeTickerVisitorInner"></div></div>' +
          '<div class="ice-tape-ticker-gap" aria-hidden="true"></div>' +
          '<div class="ice-tape-ticker home" id="tapeTickerHome"><div class="ice-tape-ticker-inner" id="tapeTickerHomeInner"></div></div>' +
        '</div>' +
        '<p class="ice-tape-sb-cite">' + esc(cite) + '</p>' +
      '</div>'
    );
  }

  var _tapeTickerTimer = null;
  function hideTapeTicker() {
    ["tapeTickerVisitor", "tapeTickerHome"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.remove("open");
    });
    if (_tapeTickerTimer) {
      clearTimeout(_tapeTickerTimer);
      _tapeTickerTimer = null;
    }
  }

  /**
   * Pro roll under the matching board side (visitor left / home right).
   * Team is a side variable only — never printed in the ticker.
   */
  function showTapeTicker(side, line, ms) {
    hideTapeTicker();
    var text = String(line || "").trim();
    if (!text) return;
    var which = side === "home" ? "home" : "visitor";
    var tick = document.getElementById(which === "home" ? "tapeTickerHome" : "tapeTickerVisitor");
    var inner = document.getElementById(which === "home" ? "tapeTickerHomeInner" : "tapeTickerVisitorInner");
    if (!tick || !inner) return;
    inner.textContent = text;
    tick.classList.add("open");
    _tapeTickerTimer = setTimeout(hideTapeTicker, ms || TAPE_TICKER_MS);
  }

  function refreshTapeScoreboardDom() {
    var live = getTapeLiveBoard() || {};
    var vsEl = document.getElementById("tapeSbVs");
    var hsEl = document.getElementById("tapeSbHs");
    var pEl = document.getElementById("tapeSbPeriod");
    var cEl = document.getElementById("tapeSbClock");
    if (vsEl) vsEl.textContent = tapeScoreFace(live.vs != null ? live.vs : (live.as != null ? live.as : live.away_score));
    if (hsEl) hsEl.textContent = tapeScoreFace(live.hs != null ? live.hs : live.home_score);
    if (pEl) {
      var period = live.period != null && live.period !== "" ? String(live.period) : "—";
      pEl.textContent = "P" + period;
    }
    if (cEl) cEl.textContent = live.clock != null && live.clock !== "" ? String(live.clock) : "—";
  }

  /** Diff GameSheet live goals → side ticker. API or watch — Dualis only echoes. */
  function applyTapeLiveEvents() {
    refreshTapeScoreboardDom();
    var live = getTapeLiveBoard();
    if (!live || !Array.isArray(live.events) || !live.events.length) return;
    var seenKey = "dc.ice.tape_ticker_seen";
    var seen = {};
    try { seen = JSON.parse(lsGet(seenKey) || "{}") || {}; } catch (e0) { seen = {}; }
    for (var i = live.events.length - 1; i >= 0; i--) {
      var ev = live.events[i] || {};
      var id = String(ev.id || (ev.at + "|" + (ev.scorer || ev.scorer_name || "") + "|" + (ev.period || "")));
      if (!id || seen[id]) continue;
      var kind = String(ev.kind || "goal").toLowerCase();
      if (kind !== "goal" && kind !== "g") continue;
      var side = tapeGoalSide(ev, live);
      if (!side) continue;
      var line = formatTapeGoalTicker(ev);
      if (!line) continue;
      seen[id] = 1;
      lsSet(seenKey, JSON.stringify(seen));
      showTapeTicker(side, line);
      break;
    }
  }

  function tapeIsLandscape() {
    try {
      if (screen.orientation && screen.orientation.type) {
        return String(screen.orientation.type).indexOf("landscape") === 0;
      }
    } catch (e0) {}
    return (window.innerWidth || 0) > (window.innerHeight || 0);
  }
  function tryLockTapeLandscape() {
    /* Never fight portrait. Lock only after the phone is already landscape (user rotated). */
    try {
      if (!tapeIsLandscape()) return;
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock("landscape").catch(function () {});
      }
    } catch (e) {}
  }
  function unlockTapeLandscape() {
    try {
      if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
    } catch (e) {}
  }

  function renderTape() {
    if (!seatIsBound()) return lockedHtml();
    var known = resolveKnownTapeStream(true) || resolveKnownTapeStream(false);
    var byo = known;
    var pipe = getTapePipe();
    var fromTs = !getTapeStream() && !!streamUrlFromTeamSnap({ preferLiveBarn: true });
    var tapeAuth = getTapeAuth();
    var playUrl = tapeUrlWithAuth(byo, tapeAuth.user, tapeAuth.pass);
    var lbOn = bindOn("livebarn") || pipe === "livebarn";
    var hdOn = bindOn("hudl") || pipe === "hudl";
    var lbHole = (pipe === "livebarn") ? (playUrl || byo || LB_SIGNIN) : "";
    var byoOn = (pipe === "byo" && !!byo) || (pipe === "livebarn" && !!lbHole);
    var frameSrc = pipe === "livebarn" ? (playUrl || byo || LB_SIGNIN) : (playUrl || byo);
    var frameTitle = pipe === "livebarn" ? "LiveBarn playground" : "Team stream";
    var knownNote = "";
    if (fromTs && isLiveBarnUrl(byo)) knownNote = "LiveBarn from TeamSnap Notes — Dualis session opens that hole in the paired window.";
    else if (fromTs) knownNote = "Stream URL from TeamSnap event Notes.";
    else if (byo && isLiveBarnUrl(byo)) knownNote = "Saved LiveBarn hole — Dualis session + scoreboard here; their stream in the paired window.";

    var stageInner = "";
    if (byoOn && frameSrc) {
      var isLb = pipe === "livebarn" || isLiveBarnUrl(frameSrc);
      /* Portrait-first: upright invite (clickable). Landscape shell arms only after rotate / playground. */
      var lbInvite = isLb
        ? ('<div class="ice-tape-lb-invite" id="tapeLbInvite">' +
            '<p class="ice-tape-lb-kicker">Dualis session</p>' +
            '<p class="ice-tape-lb-title">LiveBarn · your login</p>' +
            '<p class="ice-tape-lb-copy">One button. Opens their LiveBarn in a new tab — Dualis scoreboard stays here. Rotate later for playground chrome if you want it.</p>' +
            '<a class="ice-btn" id="btnTapeLbWindow" href="' + esc(frameSrc) + '" target="_blank" rel="noopener noreferrer">Open LiveBarn →</a>' +
            '<p class="ice-note ice-tape-lb-note">Phone-friendly link (not a popup). No early rotate.</p>' +
          '</div>')
        : "";
      var landHole = isLb
        ? ('<div class="ice-tape-lb-hole" id="tapeLbHole">' +
            '<p class="ice-tape-lb-kicker">Dualis playground</p>' +
            '<p class="ice-tape-lb-title">LiveBarn stream window</p>' +
            '<p class="ice-tape-lb-copy">Scoreboard stays here. Stream is in their tab — same hole, their login.</p>' +
            '<a class="ice-btn" id="btnTapeLbWindowLand" href="' + esc(frameSrc) + '" target="_blank" rel="noopener noreferrer">Open LiveBarn →</a>' +
          '</div>')
        : ('<iframe class="ice-tape-frame land" title="' + esc(frameTitle) + '" src="' + esc(frameSrc) + '" allow="autoplay; fullscreen; picture-in-picture; clipboard-read; clipboard-write" referrerpolicy="no-referrer-when-downgrade"></iframe>');
      stageInner =
        lbInvite +
        '<div class="ice-tape-land" id="tapeLandShell">' +
          '<div class="ice-tape-land-inner">' +
            renderTapeScoreboard() +
            '<div class="ice-tape-land-video' + (isLb ? " is-lb-shell" : "") + '">' +
              landHole +
            '</div>' +
            '<div class="ice-tape-land-bar">' +
              '<button type="button" class="ice-btn ghost" id="btnTapeLandClose">← Ice</button>' +
              '<span class="ice-tape-land-label">' + esc(isLb ? "LiveBarn · Dualis session" : "Team cam") + "</span>" +
              '<a class="ice-btn ghost" id="btnTapeOpenByo" target="_blank" rel="noopener" href="' + esc(frameSrc) + '">Break out →</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="ice-tape-stage is-byo is-land-armed">' +
          (isLb
            ? '<button type="button" class="ice-btn ghost" id="btnTapeLandOpen">Dualis playground (landscape) →</button>'
            : '<button type="button" class="ice-btn" id="btnTapeLandOpen">Watch in playground →</button>') +
          (knownNote ? '<p class="ice-note">' + knownNote + "</p>" : "") +
        '</div>';
    } else {
      stageInner = "";
    }

    function srcCard(id, short, name, blurb, status) {
      return '<button type="button" class="ice-tape-src' + (status === "on" ? " on" : "") + '" data-tape-src="' + esc(id) + '">' +
        '<div class="mark">' + esc(short) + "</div>" +
        '<div class="nm">' + esc(name) + "</div>" +
        '<div class="st">' + esc(blurb) + "</div></button>";
    }

    var sources =
      '<div class="ice-tape-sources">' +
        /* Bound ≠ selected — never paint LB/Hudl as active; only Team when in-pane */
        srcCard("livebarn", "LB", "LiveBarn", (byo && isLiveBarnUrl(byo)) ? "Known hole · Dualis session" : (lbOn ? "Bound · Dualis session" : "Your login · paired window"), "") +
        srcCard("hudl", "HD", "Hudl", hdOn ? "Bound · opens their window" : "Coach clips · their login", "") +
        srcCard("byo", "CAM", "Team", byo ? "URL saved · in-pane when allowed" : "Falcon / arena Wi‑Fi URL", byoOn ? "on" : "") +
      "</div>";

    var byoBox =
      '<div class="ice-field" id="tapeByoWrap">' +
        '<label for="tapeStreamIn">Paste team stream URL</label>' +
        '<input id="tapeStreamIn" value="' + esc(getTapeStream() || streamUrlFromTeamSnap()) + '" placeholder="https://… or TeamSnap event Notes link" autocomplete="off" inputmode="url">' +
        (fromTs || knownNote ? '<p class="ice-note">' + (knownNote || "Picked up from TeamSnap event Notes — refresh schedule on Apps if missing.") + '</p>' : '') +
        '<div class="ice-tape-auth">' +
          '<div class="ice-field"><label for="tapeUserIn">Username</label>' +
            '<input id="tapeUserIn" value="' + esc(tapeAuth.user) + '" placeholder="" autocomplete="username"></div>' +
          '<div class="ice-field"><label for="tapePassIn">Password</label>' +
            '<input id="tapePassIn" type="password" value="' + esc(tapeAuth.pass) + '" placeholder="" autocomplete="current-password"></div>' +
        "</div>" +
        '<button type="button" class="ice-btn ghost" id="btnTapeSaveByo" style="margin-top:0.55rem;">Save · show here</button>' +
        '<button type="button" class="ice-btn" id="btnTapeOpenAuth" style="margin-top:0.4rem;">Open with login →</button>' +
        '<p class="ice-note">User/pass stay on this phone only. Dualis binds them into the stream URL — never posts them to TeamSnap.</p>' +
      "</div>";

    return '<h1 class="ice-h">Tape</h1>' +
      '' +
      stageInner +
      sources +
      byoBox +
      '';
  }

  function loadMeArch() {
    try {
      var row = JSON.parse(lsGet(ME_ARCH_KEY) || "{}");
      if (!row || typeof row !== "object") row = {};
      /* Seed NCSA echo only for Dom test seat #29 Di Genova — never product defaults for other seats. */
      var seat = getSeat();
      var isDom = !!(seat && Number(seat.jersey) === 29 &&
        String(seat.last || "").toLowerCase().indexOf("di genova") !== -1);
      if (isDom && !row._ncsa_seeded) {
        if (!row.size) row.size = "5'11\" / 185";
        if (!row.shot) row.shot = "L";
        if (!row.style) row.style = "Power F";
        if (!row.pos) row.pos = seat.pos || "LW";
        if (!row.age) row.age = "2011";
        /* NCSA public personal-statement echo — cite only, may be months old. Never invent for other seats. */
        if (!row.blurb) {
          row.blurb = "Size and above-average shot; developing power forward — puck protection, shot in traffic, heads-up physical style.";
          row.blurb_source = "ncsa";
        }
        row._ncsa_seeded = "1";
        row._ncsa_note = "echo NCSA public · may be months old";
        try { lsSet(ME_ARCH_KEY, JSON.stringify(row)); } catch (e0) {}
      }
      return row;
    } catch (e) { return {}; }
  }

  function saveMeArch(row) {
    /* Player cannot rewrite defined dims — merge only into empty keys; never overwrite locked echo. */
    try {
      var cur = {};
      try { cur = JSON.parse(lsGet(ME_ARCH_KEY) || "{}") || {}; } catch (e0) { cur = {}; }
      var next = row || {};
      var keys = ["size", "shot", "style", "pos", "age"];
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (String(cur[k] || "").trim()) continue; /* locked once defined */
        if (String(next[k] || "").trim()) cur[k] = String(next[k]).trim();
      }
      if (cur._ncsa_seeded) { /* keep seed flags */ }
      else if (next._ncsa_seeded) cur._ncsa_seeded = next._ncsa_seeded;
      if (cur._ncsa_note || next._ncsa_note) cur._ncsa_note = cur._ncsa_note || next._ncsa_note;
      if (String(cur.blurb || "").trim()) { /* locked once defined */ }
      else if (String(next.blurb || "").trim()) {
        cur.blurb = String(next.blurb).trim();
        if (next.blurb_source) cur.blurb_source = next.blurb_source;
      }
      if (cur.blurb_source || next.blurb_source) cur.blurb_source = cur.blurb_source || next.blurb_source;
      lsSet(ME_ARCH_KEY, JSON.stringify(cur));
    } catch (e) {}
  }

  /** NHL archetype triad: size + shot (L/R) + style. Never invent % alike or a named player. */
  function meParseSize(sizeStr) {
    var s = String(sizeStr || "").replace(/\u2032/g, "'").replace(/\u2033/g, '"');
    var ht = null, wt = null;
    var m = s.match(/(\d)\s*['\u2032]\s*(\d{1,2})/);
    if (m) ht = parseInt(m[1], 10) * 12 + parseInt(m[2], 10);
    var wm = s.match(/(\d{2,3})\s*(?:lbs?|lb)?\s*$/i) || s.match(/\/\s*(\d{2,3})/);
    if (wm) wt = parseInt(wm[1], 10);
    return { htIn: ht, wtLb: wt };
  }
  function meAlikePct(arch, seat, player) {
    var dims = {
      pos: resolvePosRaw(seat, player) || arch.pos || "",
      size: arch.size || "",
      shot: arch.shot || "",
      style: arch.style || "",
      age: arch.age || (player && player.birth_year ? String(player.birth_year) : "")
    };
    var sh = String(dims.shot || "").trim().toUpperCase();
    if (sh === "LEFT" || sh === "LH" || sh.indexOf("LEFT") === 0) dims.shot = "L";
    else if (sh === "RIGHT" || sh === "RH" || sh.indexOf("RIGHT") === 0) dims.shot = "R";
    else if (sh === "L" || sh === "R") dims.shot = sh;
    else dims.shot = String(dims.shot || "").trim();
    var triad = ["size", "shot", "style"];
    var filled = 0;
    for (var i = 0; i < triad.length; i++) {
      if (String(dims[triad[i]] || "").trim()) filled++;
    }
    if (filled < 3) {
      return { pct: null, filled: filled, need: 3, dims: dims, triad: triad };
    }
    /* Corpus = prototypical mid-size NHL Power F band (size·shot·style only). Never invent a name. */
    var sz = meParseSize(dims.size);
    var sizeScore = 0;
    if (sz.htIn != null && sz.wtLb != null) {
      /* mid-size PF window ~70–74 in · 175–205 lb */
      var htIdeal = 71; /* 5'11" */
      var wtIdeal = 195;
      var htN = Math.max(0, 1 - Math.abs(sz.htIn - htIdeal) / 6);
      var wtN = Math.max(0, 1 - Math.abs(sz.wtLb - wtIdeal) / 40);
      sizeScore = 0.55 * htN + 0.45 * wtN;
    } else if (sz.htIn != null || sz.wtLb != null) {
      sizeScore = 0.55; /* partial size echo */
    } else {
      sizeScore = 0.4; /* size string present but unparsed — weak */
    }
    var shotScore = (dims.shot === "L" || dims.shot === "R") ? 1 : 0.5;
    var sty = String(dims.style || "");
    var styleScore = /power\s*f/i.test(sty) ? 1
      : /2-?way|two-?way/i.test(sty) ? 0.72
      : /sniper|playmaker/i.test(sty) ? 0.62
      : 0.5;
    var pct = Math.round(100 * (0.40 * sizeScore + 0.30 * shotScore + 0.30 * styleScore));
    if (pct < 1) pct = 1;
    if (pct > 99) pct = 99; /* never claim 100 — corpus soft */
    /* Face: NHL Power F class likeness — current soft mirrors separately; never invent / never destiny. */
    var corpusNote = "alike NHL Power F class";
    if (/power\s*f/i.test(sty)) corpusNote = "alike NHL Power F class";
    return {
      pct: pct,
      filled: filled,
      need: 3,
      dims: dims,
      triad: triad,
      corpus_note: corpusNote,
      size_parsed: sz
    };
  }

  function meShotOptionsHtml(selected) {
    var sel = String(selected || "").toUpperCase();
    if (sel.indexOf("LEFT") === 0 || sel === "LH") sel = "L";
    if (sel.indexOf("RIGHT") === 0 || sel === "RH") sel = "R";
    var opts = ["L", "R"];
    var html = '<select id="meShot" aria-label="Shot L or R">';
    html += '<option value="">—</option>';
    for (var i = 0; i < opts.length; i++) {
      html += '<option value="' + opts[i] + '"' + (opts[i] === sel ? " selected" : "") + ">" + opts[i] + "</option>";
    }
    html += "</select>";
    return html;
  }


  /** Echo-only dim cell: once defined, locked. Never player-rewrite size/shot/height/weight/style/pos/age. */
  function meDimLocked(val) {
    return !!(String(val || "").trim());
  }
  function meDimCellHtml(label, id, value, triad) {
    var v = String(value || "").trim();
    var cls = "ice-me-dim ice-me-dim-ro" + (triad ? " ice-me-dim-triad" : "") + (v ? " ice-me-dim-locked" : " ice-me-dim-await");
    /* Plain readout — not a control. No select / no input chrome. */
    var face = v
      ? ('<div class="ice-me-dim-face" id="' + id + 'Face" role="text" aria-readonly="true" aria-label="' + label + ' locked echo">' + esc(v) + '</div>' +
         '')
      : ('<div class="ice-me-dim-face ice-me-dim-dash" id="' + id + 'Face" role="text" aria-readonly="true" aria-label="' + label + ' awaiting cite">—</div>' +
         '<div class="ice-me-dim-lock">—</div>');
    return '<div class="' + cls + '" aria-disabled="true">' +
      '<span class="ice-me-dim-lab">' + label + '</span>' + face + '</div>';
  }


  /** Minimum style-of-play line under dims. Every seat. Sharpens as cites land — never invent. */
  function meStyleBlurb(arch, seat, player, alike) {
    var style = String((alike && alike.dims && alike.dims.style) || arch.style || "").trim();
    var shot = String((alike && alike.dims && alike.dims.shot) || arch.shot || "").trim().toUpperCase();
    var pos = String((alike && alike.dims && alike.dims.pos) || (seat && seat.pos) || "").trim();
    var size = String((alike && alike.dims && alike.dims.size) || arch.size || "").trim();
    var soft = String(arch.style_blurb || arch.play_blurb || "").trim(); /* household/cite soft — never invent */
    var cites = 0;
    if (style) cites++;
    if (shot === "L" || shot === "R") cites++;
    if (pos) cites++;
    if (size) cites++;
    if (soft) cites += 2;
    if (arch._ncsa_seeded) cites++;
    /* Dom soft dims (household) — only when this seat; never product default */
    var isDom = !!(seat && Number(seat.jersey) === 29 &&
      String(seat.last || "").toLowerCase().indexOf("di genova") !== -1);
    if (isDom && /power\s*f/i.test(style)) {
      /* NCSA + household soft — echo only */
      soft = soft || "Puck protection · shot in traffic · heads-up physical. Two-way, controlled compete. Leader in the mix.";
    }
    if (!style && !soft) {
      return { text: "Style of play locks when size · shot · style land.", tier: 0 };
    }
    if (soft) {
      return { text: soft, tier: Math.min(3, 1 + (cites >= 5 ? 2 : cites >= 3 ? 1 : 0)) };
    }
    /* Generic minimum from locked style cell — every player */
    var base = "";
    if (/power\s*f/i.test(style)) base = "Net-front / board battle Power F — physical lane, shot in traffic.";
    else if (/sniper/i.test(style)) base = "Sniper lane — release and finish when the look is there.";
    else if (/playmaker/i.test(style)) base = "Playmaker lane — create, dish, find the late man.";
    else if (/2-?way|two-?way/i.test(style)) base = "Two-way forward — both ends, detail first.";
    else if (/offensive/i.test(style)) base = "Offensive D — join, move pucks, activate.";
    else if (/defensive/i.test(style)) base = "Defensive D — gap, box out, first clear.";
    else if (/hybrid/i.test(style)) base = "Hybrid D — both sides of the puck.";
    else if (/athletic|butterfly|positional/i.test(style)) base = "Crease style locked — detail grows with tape + cites.";
    else base = style + " — detail grows as cites land.";
    var bits = [];
    if (shot === "L" || shot === "R") bits.push(shot + "-shot");
    if (pos) bits.push(pos);
    if (bits.length) base = bits.join(" · ") + ". " + base;
    return { text: base, tier: cites >= 3 ? 1 : 0 };
  }


  /** Dual forward syntax: LW/RW · C/LW · C/RW (uncommon, valid). Bucket always F. Never invent. */
  function parsePositions(raw) {
    var s = String(raw == null ? "" : raw).trim().toUpperCase().replace(/\s+/g, "");
    if (!s) return { pos: "", positions: [], bucket: "" };
    var parts = s.split(/[\/|,+]+/).map(function (p) { return p.trim(); }).filter(Boolean);
    var ok = { C: 1, LW: 1, RW: 1, LD: 1, RD: 1, D: 1, F: 1, G: 1, W: 1 };
    var positions = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (p === "LEFTWING" || p === "LEFT") p = "LW";
      if (p === "RIGHTWING" || p === "RIGHT") p = "RW";
      if (p === "CENTER") p = "C";
      if (p === "DEFENSE" || p === "DEFENCE" || p === "DEFENSEMAN") p = "D";
      if (p === "GOALIE" || p === "GOALTENDER" || p === "GK") p = "G";
      /* Prefer explicit LW/RW — bare Winger/W is too vague (everyone is a winger). */
      if (p === "WINGER" || p === "WING" || p === "W") {
        continue; /* never stamp face as W — await LW or RW cite */
      }
      if (!ok[p]) continue;
      if (positions.indexOf(p) === -1) positions.push(p);
    }
    if (!positions.length) return { pos: "", positions: [], bucket: "", face: "" };
    var pos = positions[0];
    var bucket = "F";
    if (positions.indexOf("G") !== -1 && positions.length === 1) bucket = "G";
    else if (positions.every(function (x) { return x === "D" || x === "LD" || x === "RD"; })) bucket = "D";
    else bucket = "F"; /* C · LW · RW · C/LW · C/RW · LW/RW all F */
    return { pos: pos, positions: positions, bucket: bucket, face: positions.join("/") };
  }


  /** Soft Me blurb under Age — NCSA / parent / news when cited; else quiet generic for this seat on this team; blank if nothing honest. Never invent history. */
  function meFaceBlurb(arch, seat, player, posFace) {
    var cited = String((arch && arch.blurb) || "").trim();
    if (cited) {
      var src = String((arch && arch.blurb_source) || "").toLowerCase();
      var tag = src === "ncsa" ? "NCSA" : (src === "parent" || src === "household" ? "Household" : (src === "news" ? "News" : "Cited"));
      return { text: cited, tag: tag };
    }
    var jersey = seat && seat.jersey != null ? String(seat.jersey) : "";
    var pos = String(posFace || (seat && seat.pos) || "").trim();
    var team = "";
    try { team = titleFromSlug((seat && seat.team_slug) || state.teamSlug || (state.pack && state.pack.team_slug) || ""); } catch (e) {}
    if (!jersey && !pos && !team) return { text: "", tag: "" };
    var bits = [];
    if (jersey) bits.push("#" + jersey);
    if (pos) bits.push(pos);
    var who = bits.join(" ");
    if (team && who) return { text: who + " on " + team + " this season.", tag: "" };
    if (team) return { text: "On " + team + " this season.", tag: "" };
    if (who) return { text: who + " this season.", tag: "" };
    return { text: "", tag: "" };
  }

  function renderMe() {
    if (!seatIsBound()) return lockedHtml();
    var seat = getSeat();
    var p = findPlayer(seat.jersey) || {};
    var nutOn = bindOn("nutrition");
    var woOn = bindOn("workout");
    var arch = loadMeArch();
    /* ME_ROLE_KEY retired — DCLM determines likeness; no player role-model claim. */
    var alike = meAlikePct(arch, seat, p);
    /* POS face = wing/centre detail (LW|C|RW). Bucket F stays for F/D/G clocks — never show bare F here.
     * facePosLabel(seat, player) — do NOT pass a raw string (that forgets LW). */
    var posRawResolved = resolvePosRaw(seat, p) || alike.dims.pos || arch.pos || "";
    var posN = normalizePos(posRawResolved);
    var posParsed = parsePositions(posRawResolved || posN.detail || "");
    /* Explicit LW · RW · C · duals (LW/RW, C/LW, C/RW). Never face "Winger". */
    var posFace = posParsed.face
      || ((posN.detail === "LW" || posN.detail === "C" || posN.detail === "RW" || posN.detail === "D" || posN.detail === "G")
        ? posN.detail
        : "");
    if (posFace === "W" || posFace === "Winger") posFace = "";
    var posBucket = posParsed.bucket || posN.bucket || roleFromPos(alike.dims.pos) || "";
    if (alike && alike.dims) {
      alike.dims.pos = posFace || posRawResolved || alike.dims.pos;
      alike.dims.positions = posParsed.positions || [];
      alike.dims.pos_bucket = posBucket; /* F underneath — clocks only */
    }
    var posEcho = posFace || (posBucket === "D" || posBucket === "G" ? posBucket : "—");
    /* No NCSA essay under the % — dims column owns the echo. */
    var shotCad = String(alike.dims.shot || arch.shot || "L").toUpperCase();
    if (shotCad !== "L" && shotCad !== "R") shotCad = "L";
    var cadSrc = "assets/me-dclm-cad-lshot.png";
    var cadFlip = shotCad === "R" ? " ice-me-cad-flip" : "";
    var sizeChip = String(alike.dims.size || "").trim() || "—";
    var styleChip = String(alike.dims.style || "").trim() || "—";
    /* Style blurb / pro-analysis copy off Me face — define elsewhere when they go looking. */

    var faceName = meFaceName(seat, p);
    var teamShort = "";
    try {
      var tl = cardTeamLine(seat);
      /* Brackets want team affiliation — drop age-band if too long; keep team name. */
      teamShort = titleFromSlug((seat && seat.team_slug) || state.teamSlug || (state.pack && state.pack.team_slug) || "") || tl;
    } catch (e1) { teamShort = ""; }
    var chipBits = [faceName];
    if (seat.jersey != null && String(seat.jersey) !== "") chipBits.push("#" + String(seat.jersey));
    if (posFace) chipBits.push(posFace);
    var chipLine = chipBits.join(" · ");
    if (teamShort) chipLine += " (" + teamShort + ")";
    var blurb = meFaceBlurb(arch, seat, p, posFace);
    /* HockeyDB is peer lookup — never prefill seated kid (often not on HDB yet). */
    var hdbPrefill = "";

    return '<div class="ice-me-env ice-me-dclm">' +
      '<div class="ice-me-head">' +
        '<h1 class="ice-h ice-me-h">Me</h1>' +
        '<span class="ice-me-name-chip" title="' + esc(chipLine) + '">' + esc(chipLine) + "</span>" +
      "</div>" +
      '<div class="ice-me-grid" aria-label="Fuel and train apps">' +
        '<button type="button" class="ice-me-tile' + (woOn ? " on" : "") + '" data-open-bind="workout">' +
          '<span class="mark">FB</span><span class="nm">Fitbit</span><span class="st">Workout</span></button>' +
        '<button type="button" class="ice-me-tile' + (woOn ? " on" : "") + '" data-open-bind="workout">' +
          '<span class="mark">GH</span><span class="nm">Google Health</span><span class="st">Workout</span></button>' +
        '<button type="button" class="ice-me-tile' + (nutOn ? " on" : "") + '" data-open-bind="nutrition">' +
          '<span class="mark">MF</span><span class="nm">MyFitnessPal</span><span class="st">Nutrition</span></button>' +
        '<button type="button" class="ice-me-tile' + (nutOn ? " on" : "") + '" data-open-bind="nutrition">' +
          '<span class="mark">CR</span><span class="nm">Cronometer</span><span class="st">Nutrition</span></button>' +
      "</div>" +
      '' +
      '<div class="ice-me-measure ice-me-measure-cad ice-me-measure-min" role="group" aria-label="DCLM">' +
        '<div class="ice-me-cad-col">' +
          '<div class="ice-me-cad-stage" aria-hidden="true">' +
            '<div class="ice-me-cad-spin' + cadFlip + '">' +
              '<img class="ice-me-cad-img" src="' + cadSrc + '" alt="" width="220" height="280" loading="lazy">' +
            "</div>" +
            '<div class="ice-me-cad-ring"></div>' +
          "</div>" +
        "</div>" +
        '<div class="ice-me-measure-div" aria-hidden="true"></div>' +
        '<div class="ice-me-dims">' +
          '<div class="ice-me-dim-grid">' +
            meDimCellHtml("Size", "meSize", arch.size || alike.dims.size || "", true) +
            meDimCellHtml("Shot", "meShot", arch.shot || alike.dims.shot || "", true) +
            meDimCellHtml("Style", "meStyle", arch.style || alike.dims.style || "", true) +
            meDimCellHtml("Pos", "mePos", posFace || "", false) +
            meDimCellHtml("Age", "meAge", alike.dims.age || arch.age || "", false) +
          "</div>" +
          (blurb.text
            ? ('<p class="ice-me-age-blurb">' +
                (blurb.tag ? ('<span class="ice-me-age-blurb-tag">' + esc(blurb.tag) + "</span> ") : "") +
                esc(blurb.text) +
              "</p>")
            : "") +
        "</div>" +
      "</div>" +
      '<form class="ice-me-hdb" id="meHdbForm" action="https://www.hockeydb.com/ihdb/stats/find_player.php" method="get" target="_blank" rel="noopener">' +
        '<label class="ice-me-hdb-lab" for="meHdbQ">HockeyDB</label>' +
        '<div class="ice-me-hdb-row">' +
          '<input id="meHdbQ" class="ice-me-hdb-input" name="full_name" type="search" autocomplete="off" spellcheck="false" placeholder="Search player" value="" aria-label="HockeyDB player search">' +
          '<button type="submit" class="ice-me-hdb-go" id="meHdbGo">Search</button>' +
        "</div>" +
      "</form>" +
    "</div>";
  }

  function renderSchool() {
    if (!seatIsBound()) return lockedHtml();
    var pasted = state.schoolEcho || "";
    var score = state.schoolScore || "";
    var photo = lsGet(SCHOOL_PHOTO_KEY) || "";
    var gpaClaim = lsGet(SCHOOL_GPA_KEY) || "";
    var hasDoc = !!(photo || (state.schoolText && String(state.schoolText).length > 8));
    var fileHint = photo ? "Photo on phone" : "No file chosen";
    var photoBit = photo
      ? '<div class="ice-school-photo"><img src="' + esc(photo) + '" alt="Transcript photo"></div>'
      : "";
    /* Echo the claimed GPA in good faith. Asterisk only while unverified; transcript clears *. Never call it false. */
    var starBit = hasDoc ? "" : '<span class="ice-school-gpa-star" title="Not Dualis-verified">*</span>';
    var pendingBit = hasDoc
      ? '<div class="ice-school-pending ice-school-pending-ok">verified on this phone</div>'
      : '<div class="ice-school-pending">not yet verified</div>';

    var schoolName = lsGet("dc.ice.school_name") || "Nicholson Catholic College";
    return '<div class="ice-school-compact ice-school-dclm">' +
      '<div class="ice-school-head">' +
        '<div class="ice-school-head-main">' +
          '<p class="ice-school-kicker">School · echoed</p>' +
          '<h1 class="ice-h ice-school-h">' + esc(schoolName) + '</h1>' +
        '</div>' +
        '<a class="ice-school-ncsa-chip" target="_blank" rel="noopener" href="https://www.ncsasports.org/mens-ice-hockey-recruiting/international/can/domenic-di-genova">NCSA</a>' +
      "</div>" +
      '<div class="ice-school-measure" role="group" aria-label="GPA claim and transcript">' +
        '<div class="ice-school-gpa-col">' +
          '<div class="ice-school-measure-k">GPA <span class="ice-school-gpa-scale">/ 4.0</span></div>' +
          '<div class="ice-school-gpa-row">' +
            '<input id="schoolGpa" class="ice-school-gpa-face" inputmode="decimal" value="' + esc(gpaClaim) + '" placeholder="—" aria-label="GPA claim">' +
            starBit +
          "</div>" +
          pendingBit +
        "</div>" +
        '<div class="ice-school-measure-div" aria-hidden="true"></div>' +
        '<div class="ice-school-upload">' +
          '<div class="ice-school-measure-k">Transcript</div>' +
          '<div class="ice-school-upload-row">' +
            '<button type="button" class="ice-school-cam-btn" id="btnSchoolCam" aria-label="Take a photo">' +
              '<span class="ice-school-cam-ico" aria-hidden="true">' +
                '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                  '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>' +
                  '<circle cx="12" cy="13" r="4"></circle>' +
                '</svg>' +
              '</span>' +
              '<span>Photo</span>' +
            '</button>' +
            '<div class="ice-school-file-slot">' +
              '<label class="ice-school-pick" for="schoolFile">File' +
                '<input id="schoolFile" type="file" accept=".txt,.csv,.pdf,text/*,image/*">' +
              '</label>' +
              '<div class="ice-school-file-name" id="schoolFileName">' + esc(fileHint) + '</div>' +
            '</div>' +
            '<input id="schoolCam" class="ice-school-cam-hidden" type="file" accept="image/*" capture="environment">' +
          "</div>" +
        "</div>" +
      "</div>" +
      '<div class="ice-school-meta" aria-label="School facts echoed from NCSA">' +
        '<span class="ice-school-chip">Class of 2029</span>' +
        '<span class="ice-school-chip">Ontario</span>' +
        '<span class="ice-school-chip">Varsity hockey #27</span>' +
        '<span class="ice-school-chip ice-school-chip-soft">Grades · NCSA locked</span>' +
      '</div>' +
      '<p class="ice-school-meta-note">NCSA public · club #29 Quinte</p>' +
      photoBit +
      '<div class="ice-school-portals">' +
        '<div class="ice-school-file-lab">School apps</div>' +
        '<div class="ice-me-grid ice-school-app-grid" aria-label="School portal apps">' +
          '<a class="ice-me-tile" target="_blank" rel="noopener" href="https://www.edsby.com/">' +
            '<span class="mark">ED</span><span class="nm">Edsby</span><span class="st">Homework</span></a>' +
          '<a class="ice-me-tile" target="_blank" rel="noopener" href="https://www.d2l.com/">' +
            '<span class="mark">BS</span><span class="nm">Brightspace</span><span class="st">Homework</span></a>' +
          '<a class="ice-me-tile" target="_blank" rel="noopener" href="https://classroom.google.com/">' +
            '<span class="mark">GC</span><span class="nm">Classroom</span><span class="st">Homework</span></a>' +
          '<a class="ice-me-tile" target="_blank" rel="noopener" href="https://www.powerschool.com/">' +
            '<span class="mark">PS</span><span class="nm">PowerSchool</span><span class="st">Grades</span></a>' +
        "</div>" +
        '<p class="ice-note ice-me-grid-note ice-school-apps-note">Letter marks · bind later if board allows</p>' +
      "</div>" +
      /* Check labels retired — full-width ice-btn forced scroll on one-screen School. */
      (pasted ? '<div class="ice-echo">' + esc(pasted) + "</div>" : "") +
      (score ? '<p class="ice-note">' + score + "</p>" : "") +
    "</div>";
  }

  function renderApps() {
    if (!seatIsBound()) return lockedHtml();
    var cards = BINDS.map(function (b) {
      var on = (b.id === "teamsnap") ? seatIsBound() : bindOn(b.id);
      var st = on ? "Bound" : (b.id === "gamesheet" ? "Pull when partnered" : "Bind available");
      return '<button type="button" class="ice-app' + (on ? " on" : "") + '" data-open-bind="' + esc(b.id) + '">' +
        '<div class="mark">' + esc(b.short) + "</div>" +
        '<div class="nm">' + esc(b.name) + "</div>" +
        '<div class="st">' + st + "</div></button>";
    }).join("");
    /* School portals also live on School — mirrored here so Apps fills out. Letter marks only. */
    var schoolApps = [
      { short: "ED", name: "Edsby", st: "Homework", href: "https://www.edsby.com/" },
      { short: "BS", name: "Brightspace", st: "Homework", href: "https://www.d2l.com/" },
      { short: "GC", name: "Classroom", st: "Homework", href: "https://classroom.google.com/" },
      { short: "PS", name: "PowerSchool", st: "Grades", href: "https://www.powerschool.com/" }
    ];
    var schoolCards = schoolApps.map(function (a) {
      return '<a class="ice-app ice-app-ext" target="_blank" rel="noopener" href="' + esc(a.href) + '">' +
        '<div class="mark">' + esc(a.short) + "</div>" +
        '<div class="nm">' + esc(a.name) + "</div>" +
        '<div class="st">' + esc(a.st) + "</div></a>";
    }).join("");
    return '<div class="ice-apps-page">' +
      '<h1 class="ice-h">Apps</h1>' +
      '<p class="ice-p">Hockey binds + school portals. Partner path — not a fake login.</p>' +
      '<div class="ice-hub-k">Hockey</div>' +
      '<div class="ice-apps">' + cards + "</div>" +
      '<div class="ice-hub-k ice-apps-school-k">School</div>' +
      '<div class="ice-apps ice-apps-school">' + schoolCards + "</div>" +
      '<p class="ice-note">GameSheet is never paste. School apps = letter marks only. Pay is ' + esc(payLabel()) + ".</p>" +
    "</div>";
  }

  function renderStage(id) {
    if (id === "seat") return renderSeat();
    if (id === "game") return renderGame();
    if (id === "cal") return renderCal();
    if (id === "go") return renderGo();
    if (id === "tape") return renderTape();
    if (id === "me") return renderMe();
    if (id === "school") return renderSchool();
    if (id === "apps") return renderApps();
    return renderSeat();
  }

  function paintRail() {
    var rail = $("iceRail");
    if (!rail) return;
    rail.innerHTML = STAGES.map(function (s) {
      return '<button type="button" class="ice-rail-btn' + (s.id === state.stage ? " on" : "") + '" data-stage="' + s.id + '">' +
        '<span class="dot"><svg viewBox="0 0 24 24">' + ICONS[s.id] + "</svg></span>" +
        "<span>" + esc(s.label) + "</span></button>";
    }).join("");
  }

  function goStage(id, skipHash) {
    if (!STAGES.some(function (s) { return s.id === id; })) id = "seat";
    state.stage = id;
    var stage = $("iceStage");
    if (!stage) return;
    stage.classList.add("is-out");
    setTimeout(function () {
      try {
        stage.innerHTML = renderStage(id);
      } catch (err) {
        try { console.error("ice renderStage", id, err); } catch (e0) {}
        stage.innerHTML = '<h1 class="ice-h">Cal hiccup</h1><p class="ice-p">Could not paint this stage. Try Seat, then Cal again.</p>' +
          '<button type="button" class="ice-btn" data-go="seat">Back to Seat →</button>';
      }
      stage.classList.remove("is-out");
      paintRail();
      paintChip();
      try { wireStage(id); } catch (e1) {}
    }, 160);
    if (!skipHash) {
      try {
        var u = new URL(location.href);
        u.hash = id;
        history.replaceState(null, "", u);
      } catch (e) {}
    }
  }

  function findPlayer(jersey) {
    var n = Number(jersey);
    var r = state.pack.roster || [];
    for (var i = 0; i < r.length; i++) {
      if (Number(r[i].jersey) === n) return r[i];
    }
    return null;
  }

  function claimSeat(jersey, via) {
    var p = findPlayer(jersey);
    if (!p) return Promise.resolve();
    var seat = {
      team_slug: state.pack.team_slug || state.teamSlug,
      team_id: state.pack.team_id || "",
      jersey: p.jersey,
      last: p.last,
      initial: p.initial,
      pos: p.pos,
      display: privacyName(p),
      via: via || "demo",
      claimed_at: new Date().toISOString()
    };
    lsSet(SEAT_KEY, JSON.stringify(seat));
    paintChip();
    if (!via) {
      goStage("game");
      return Promise.resolve(seat);
    }
    return bindWithHandshake(via, {
      display: seat.display,
      jersey: seat.jersey,
      purpose: "seat_claim"
    }).then(function (ok) {
      if (ok) goStage("game");
      return seat;
    });
  }



  function bakSeatCookie(seat) {
    try {
      if (!seat || seat.how !== "oauth") return;
      var v = encodeURIComponent(JSON.stringify({
        jersey: seat.jersey,
        last: seat.last || "",
        team_slug: seat.team_slug || "",
        via: seat.via || "",
        how: "oauth"
      }));
      document.cookie = "dc_ice_seat_bak=" + v + "; path=/; max-age=604800; SameSite=Lax";
    } catch (e) {}
  }
  function readSeatBakCookie() {
    try {
      var m = document.cookie.match(/(?:^|; )dc_ice_seat_bak=([^;]*)/);
      if (!m) return null;
      return JSON.parse(decodeURIComponent(m[1]));
    } catch (e) { return null; }
  }

  /** Lock seat immediately (before OAuth hop). Survives phone redirects. */
  function lockSeatNow(jersey, via, how) {
    var p = findPlayer(jersey);
    if (!p && jersey != null) {
      /* still write a minimal seat so chip locks */
      var seatMin = {
        team_slug: state.teamSlug || (state.pack && state.pack.team_slug) || "",
        jersey: Number(jersey),
        last: "",
        initial: "",
        pos: "",
        display: "#" + jersey,
        via: via || "teamsnap",
        how: how || "pending_oauth",
        claimed_at: new Date().toISOString()
      };
      lsSet(SEAT_KEY, JSON.stringify(seatMin));
      bakSeatCookie(seatMin);
      state.pickedJersey = Number(jersey);
      paintChip();
      return seatMin;
    }
    if (!p) return null;
    var seat = {
      team_slug: state.pack.team_slug || state.teamSlug,
      team_id: state.pack.team_id || "",
      jersey: p.jersey,
      last: p.last,
      initial: p.initial,
      pos: p.pos,
      display: privacyName(p),
      via: via || "teamsnap",
      how: how || "pending_oauth",
      claimed_at: new Date().toISOString()
    };
    lsSet(SEAT_KEY, JSON.stringify(seat));
    bakSeatCookie(seat);
    state.pickedJersey = Number(p.jersey);
    paintChip();
    return seat;
  }

  function bindWithHandshake(id, claims) {
    claims = claims || {};
    if (!window.DCPasskey || !DCPasskey.handshake) {
      setBind(id, "attested");
      return Promise.resolve(true);
    }
    return DCPasskey.handshake(id, claims).then(function (res) {
      if (!res || !res.ok) {
        var msg = (res && res.reason) || "handshake failed";
        if (typeof alert === "function") {
          alert(DCPasskey.identityCritical(id)
            ? ("Passkey handshake required for " + id + " (" + msg + ").")
            : ("Could not finish bind: " + msg));
        }
        return false;
      }
      setBind(id, res.receipt && res.receipt.how === "handshake" ? "handshake" : "attested");
      return true;
    });
  }

  function openBind(id) {
    var b = null;
    for (var i = 0; i < BINDS.length; i++) if (BINDS[i].id === id) b = BINDS[i];
    if (!b) return;
    var sheet = $("iceSheet");
    if (!sheet) return;
    var on = bindOn(id);
    var how = bindHow(id);
    var howLabel = how === "handshake" ? "Bound · passkey handshake receipt on this phone."
      : how === "attested" ? "Marked bound on this phone (you attested after login)."
      : how === "demo" ? "Demo bound on this phone."
      : how === "oauth" ? "Partner OAuth bound."
      : "Not bound yet.";
    var proof = (window.DCPasskey && DCPasskey.getProof) ? DCPasskey.getProof(id) : null;
    var proofPill = proof && proof.receipt_hash
      ? '<div class="ice-proof-pill">receipt ' + esc(String(proof.receipt_hash).slice(0, 12)) + "… · " + esc(proof.how || "") + "</div>"
      : "";
    var loginBtns = "";
    if (b.loginUrl) {
      loginBtns += '<a class="ice-btn ghost" target="_blank" rel="noopener" href="' + esc(b.loginUrl) + '">' +
        esc(b.loginLabel || ("Open " + b.name)) + "</a>";
    }
    if (b.altLoginUrl) {
      loginBtns += '<a class="ice-btn ghost" target="_blank" rel="noopener" href="' + esc(b.altLoginUrl) + '">' +
        esc(b.altLoginLabel || "Alt login") + "</a>";
    }
    var oauthBlock = "";
    if (id === "teamsnap" && window.DCTeamSnap) {
      var hasTs = DCTeamSnap.hasToken();
      var cid = DCTeamSnap.clientId() || "";
      oauthBlock =
        '<div class="ice-explain" style="margin-top:0.75rem;">' +
          '<p><strong>Real connect (OAuth)</strong></p>' +
          '<p>Pulls schedule · practices · games onto this phone. Secret stays on the worker.</p>' +
          (hasTs
            ? '<p class="ice-note">TeamSnap token on this phone.</p>' +
              '<button type="button" class="ice-btn" id="btnTsRefresh">Refresh schedule</button>' +
              '<button type="button" class="ice-btn ghost" id="btnTsDisconnect">Disconnect TeamSnap</button>'
            : '<div class="ice-field"><label for="tsClientId">TeamSnap Client ID</label>' +
              '<input id="tsClientId" value="' + esc(cid) + '" placeholder="from auth.teamsnap.com" autocomplete="off"></div>' +
              '<button type="button" class="ice-btn" id="btnTsConnect">Connect TeamSnap →</button>') +
          '<p class="ice-note">Redirect: ' + esc((window.DCTeamSnap && DCTeamSnap.redirectUri()) || (location.origin + "/oauth/teamsnap.html")) + "</p>" +
        "</div>";
    }
    sheet.hidden = false;
    sheet.innerHTML = '<div class="ice-bind-card">' +
      "<h3>" + esc(b.name) + "</h3>" +
      '<p class="ice-p">' + esc(b.job) + "</p>" +
      (id === "gamesheet" ? '<p class="ice-note">Never paste GameSheet scores into Dualis.</p>' : "") +
      '<p class="ice-note">' + howLabel + "</p>" + proofPill +
      ((id === "workout" || id === "nutrition")
        ? '<p class="ice-note">Marks bound on this phone, then opens <strong>Me</strong> (fuel & train environment). Partner API / Google Health later — no invented logs.</p>'
        : '<p class="ice-note">TeamSnap / Spordle: mark bound runs a <strong>passkey handshake</strong> (signed receipt). LiveBarn is softer. Partner OAuth later upgrades the same receipt.</p>') +
      '<div class="ice-hub-actions">' + loginBtns + "</div>" + oauthBlock +
      (on
        ? '<button type="button" class="ice-btn ghost" data-clear-bind="' + esc(id) + '">Unbind on this phone</button>'
        : '<button type="button" class="ice-btn" data-demo-bind="' + esc(id) + '">' +
          (window.DCPasskey && DCPasskey.identityCritical && DCPasskey.identityCritical(id)
            ? "I signed in — passkey handshake"
            : "I signed in — mark bound on this phone") + "</button>") +
      '<button type="button" class="ice-btn ghost" id="btnCloseBind">Close</button>' +
      '<button type="button" class="ice-btn ghost" disabled>' + esc(payLabel()) + "</button>" +
      "</div>";
    setTimeout(wireTeamSnapSheet, 0);
  }

  function wireTeamSnapSheet() {
    if (!window.DCTeamSnap) return;
    var connect = $("btnTsConnect");
    if (connect) connect.addEventListener("click", function () {
      var inp = $("tsClientId");
      var cid = inp && inp.value ? inp.value.trim() : "";
      if (cid) DCTeamSnap.setClientId(cid);
      try {
        var seatNow = getSeat();
        var jPick = state.pickedJersey != null ? state.pickedJersey : (seatNow && seatNow.jersey);
        var pl = jPick != null ? findPlayer(jPick) : null;
        if (pl) {
          writePendingClaimFromPlayer(pl);
        } else if (seatNow && seatNow.jersey != null) {
          setPendingClaim({
            jersey: Number(seatNow.jersey),
            via: "teamsnap",
            team_slug: seatNow.team_slug || state.teamSlug || "",
            team_id: seatNow.team_id || "",
            display: seatNow.display || ("#" + seatNow.jersey),
            last: seatNow.last || "",
            initial: seatNow.initial || "",
            pos: seatNow.pos || "",
            at: Date.now()
          });
          paintChip();
        }
      } catch (ePend) {}
      var res = DCTeamSnap.startAuth({ returnTo: location.origin + "/ice.html#seat" });
      if (!res.ok) alert(res.message || res.reason || "Need Client ID");
    });
    var refresh = $("btnTsRefresh");
    if (refresh) refresh.addEventListener("click", function () {
      refresh.disabled = true;
      DCTeamSnap.refreshMeAndSchedule().then(function () {
        refresh.disabled = false;
        setBind("teamsnap", "oauth");
        closeBind();
        goStage("game", true);
      }).catch(function (e) {
        refresh.disabled = false;
        alert("Refresh failed: " + (e && e.message));
      });
    });
    var disc = $("btnTsDisconnect");
    if (disc) disc.addEventListener("click", function () {
      DCTeamSnap.clearToken();
      try { localStorage.removeItem(BIND_PFX + "teamsnap"); } catch (e) {}
      if (window.DCPasskey && DCPasskey.clearProof) DCPasskey.clearProof("teamsnap");
      closeBind();
      goStage(state.stage, true);
    });
  }


  function finalizePendingTeamSnapClaim() {
    var pending = getPendingClaim();
    var hasTs = window.DCTeamSnap && DCTeamSnap.hasToken && DCTeamSnap.hasToken();
    var cur = getSeat();
    /* No token yet: pending stays pending — do not write a fake seat */
    if (!hasTs) {
      if (pending && pending.jersey != null) {
        state.pickedJersey = Number(pending.jersey);
        paintChip();
      }
      return false;
    }
    /* Token present: seal oauth once from pending, else upgrade an existing jersey row */
    if (!pending || pending.jersey == null) {
      if (cur && cur.jersey != null) {
        cur.via = "teamsnap";
        cur.how = "oauth";
        lsSet(SEAT_KEY, JSON.stringify(cur));
        bakSeatCookie(cur);
        setBind("teamsnap", "oauth");
        clearPendingClaim();
        paintChip();
        return true;
      }
      return false;
    }
    var seat = {
      team_slug: pending.team_slug || state.teamSlug || "",
      team_id: pending.team_id || "",
      jersey: Number(pending.jersey),
      last: pending.last || "",
      initial: pending.initial || "",
      pos: pending.pos || "",
      display: pending.display || ("#" + pending.jersey),
      via: "teamsnap",
      how: "oauth",
      claimed_at: new Date().toISOString()
    };
    var pl = findPlayer(seat.jersey);
    if (pl) {
      if (!seat.last) seat.last = pl.last || "";
      if (!seat.initial) seat.initial = pl.initial || "";
      if (pl && pl.pos) {
        var richer = normalizePos(pl.pos).detail;
        var seatDet = normalizePos(seat.pos).detail;
        if (!seatDet || (seatDet === "F" && richer && richer !== "F") || !seat.pos) {
          seat.pos = pl.pos;
        }
      } else if (!seat.pos) {
        seat.pos = "";
      }
      if (!seat.display || seat.display.indexOf("#") === 0) seat.display = privacyName(pl);
    }
    lsSet(SEAT_KEY, JSON.stringify(seat));
    bakSeatCookie(seat);
    setBind("teamsnap", "oauth");
    clearPendingClaim();
    state.pickedJersey = seat.jersey;
    paintChip();
    return true;
  }

  function closeBind() {
    var sheet = $("iceSheet");
    if (!sheet) return;
    sheet.hidden = true;
    sheet.innerHTML = "";
  }

  function openProve(via) {
    var sel = $("seatSelect");
    var jersey = sel && sel.value;
    var p = findPlayer(jersey);
    if (!p) return;
    var sheet = $("iceSheet");
    if (!sheet) return;
    var b = null;
    for (var i = 0; i < BINDS.length; i++) if (BINDS[i].id === via) b = BINDS[i];
    var name = (via === "spordle") ? "Spordle / HCR" : "TeamSnap";

    /* TeamSnap: real OAuth bind (not a dead login tab) */
    if (via === "teamsnap" && window.DCTeamSnap && DCTeamSnap.clientId()) {
      writePendingClaimFromPlayer(p);
      sheet.hidden = false;
      sheet.innerHTML = '<div class="ice-bind-card">' +
        "<h3>Prove seat · TeamSnap</h3>" +
        '<p class="ice-p">Claim ' + esc(seatLabel(p)) + " · " + esc(titleFromSlug(state.teamSlug)) + " U16</p>" +
        '<p class="ice-note">Connect opens TeamSnap OAuth. After you Allow, Dualis claims this seat and pulls schedule on this phone.</p>' +
        '<button type="button" class="ice-btn" id="btnTsProveConnect">Connect TeamSnap →</button>' +
        '<button type="button" class="ice-btn ghost" id="btnCloseBind">Back</button>' +
        "</div>";
      setTimeout(function () {
        var btn = $("btnTsProveConnect");
        if (!btn) return;
        btn.addEventListener("click", function () {
          btn.disabled = true;
          writePendingClaimFromPlayer(p);
          var res = DCTeamSnap.startAuth({ returnTo: location.origin + "/ice.html#seat" });
          if (!res || !res.ok) {
            btn.disabled = false;
            sheet.querySelector(".ice-note").textContent = (res && res.message) || "Could not start TeamSnap Connect.";
          }
        });
      }, 0);
      return;
    }

    var login = (b && b.loginUrl)
      ? '<a class="ice-btn" target="_blank" rel="noopener" href="' + esc(b.loginUrl) + '">' +
        esc(b.loginLabel || ("Open " + name)) + "</a>"
      : "";
    var alt = (b && b.altLoginUrl)
      ? '<a class="ice-btn ghost" target="_blank" rel="noopener" href="' + esc(b.altLoginUrl) + '">' +
        esc(b.altLoginLabel || "Alt login") + "</a>"
      : "";
    sheet.hidden = false;
    sheet.innerHTML = '<div class="ice-bind-card">' +
      "<h3>Prove seat · " + esc(name) + "</h3>" +
      '<p class="ice-p">Claim ' + esc(seatLabel(p)) + " · " + esc(titleFromSlug(state.teamSlug)) + " U16</p>" +
      '<p class="ice-note">1) Open ' + esc(name) + " and sign in. 2) Come back and claim. Partner verify later upgrades this.</p>" +
      '<div class="ice-hub-actions">' + login + alt + "</div>" +
      '<button type="button" class="ice-btn" id="btnConfirmClaim" data-via="' + esc(via) + '" data-jersey="' + esc(String(p.jersey)) + '">I signed in — claim this seat</button>' +
      '<button type="button" class="ice-btn ghost" id="btnCloseBind">Back</button>' +
      "</div>";
  }

  function scoreSchool(text) {
    var raw = String(text || "").trim();
    if (!raw) return { echo: "", score: "Nothing pasted. Dualis will not invent a GPA." };
    var echo = raw.length > 600 ? raw.slice(0, 600) + "…" : raw;
    var labels = NCAA.map(function (x) { return x.k + ": " + x.v; }).join(" · ");
    var m = raw.match(/(\d\.\d{1,2})/);
    var extra;
    if (m) {
      extra = "You pasted " + m[1] + ". D1 published floor is 2.3 — echo only, not a cert.";
    } else {
      extra = "No GPA found in what you pasted. Dualis will not invent one.";
    }
    return { echo: echo, score: labels + " — " + extra };
  }

  function wireStage(id) {
    var stage = $("iceStage");
    if (!stage) return;

    stage.querySelectorAll("[data-go]").forEach(function (el) {
      el.addEventListener("click", function () { goStage(el.getAttribute("data-go")); });
    });
    stage.querySelectorAll("[data-open-bind]").forEach(function (el) {
      el.addEventListener("click", function () { openBind(el.getAttribute("data-open-bind")); });
    });

    if (id === "seat") {
      var ts = $("teamSelect");
      if (ts) ts.addEventListener("change", function () {
        loadPack(ts.value || "").then(function () {
          state.showProve = false;
          state.pickedJersey = null;
          goStage("seat", true);
        });
      });
      var seatSel = $("seatSelect");
      if (seatSel) {
        if (state.pickedJersey != null) seatSel.value = String(state.pickedJersey);
        seatSel.addEventListener("change", function () {
          state.pickedJersey = seatSel.value ? Number(seatSel.value) : null;
        });
      }
      var prove = $("btnShowProve");
      if (prove) prove.addEventListener("click", function () {
        if (seatSel && seatSel.value) state.pickedJersey = Number(seatSel.value);
        state.showProve = true;
        goStage("seat", true);
      });
      stage.querySelectorAll("[data-prove]").forEach(function (el) {
        el.addEventListener("click", function () {
          if (seatSel && seatSel.value) state.pickedJersey = Number(seatSel.value);
          openProve(el.getAttribute("data-prove"));
        });
      });
      var rst = $("btnResetIce");
      if (rst) rst.addEventListener("click", function () {
        if (typeof confirm === "function" && !confirm("Clear seat + TeamSnap binds on this phone?")) return;
        resetIceLocal();
      });
    }

    if (id === "game") {
      paintHubClocks();
      startHubTick();
    } else {
      stopHubTick();
    }


    if (id === "cal") {
      var cp = $("calPrev");
      if (cp) cp.addEventListener("click", function (ev) {
        ev.preventDefault();
        var a = ensureCalAnchor();
        var n = clampCalDate(new Date(a.getFullYear(), a.getMonth() - 1, 1));
        state.calAnchor = new Date(n.getFullYear(), n.getMonth(), 1);
        state.calDayFocus = ymd(state.calAnchor);
        goStage("cal", true);
      });
      var cn = $("calNext");
      if (cn) cn.addEventListener("click", function (ev) {
        ev.preventDefault();
        var a = ensureCalAnchor();
        var n = clampCalDate(new Date(a.getFullYear(), a.getMonth() + 1, 1));
        state.calAnchor = new Date(n.getFullYear(), n.getMonth(), 1);
        state.calDayFocus = ymd(state.calAnchor);
        goStage("cal", true);
      });
      stage.querySelectorAll("[data-cal-day]").forEach(function (el) {
        el.addEventListener("click", function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          var key = el.getAttribute("data-cal-day");
          if (!key) return;
          state.calDayFocus = key;
          goStage("cal", true);
        });
      });

    }

    if (id === "go") {
      stage.querySelectorAll("[data-stay-add-link]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var pan = stage.querySelector("#stayAddPanel");
          if (!pan) return;
          pan.hidden = false;
          /* Prefill nights from next away/tourny so Cal can bind the weekend */
          var sug = stayDatesFromTrip(nextAwayTrip());
          if (sug) {
            var cinEl = stage.querySelector("[data-stay-in-new]");
            var coutEl = stage.querySelector("[data-stay-out-new]");
            var titleEl = stage.querySelector("[data-stay-title-new]");
            if (cinEl && !cinEl.value) cinEl.value = sug.checkIn;
            if (coutEl && !coutEl.value) coutEl.value = sug.checkOut;
            if (titleEl && !titleEl.value) titleEl.value = sug.label;
            pan.setAttribute("data-trip-bind", JSON.stringify({
              tripTitle: sug.tripTitle,
              tripKind: sug.tripKind,
              tripStart: sug.tripStart
            }));
          }
          var inp = stage.querySelector("[data-stay-url-new]");
          if (inp) setTimeout(function () { try { inp.focus(); } catch (e) {} }, 50);
        });
      });
      var btnStayAdd = stage.querySelector("#btnStayAdd");
      if (btnStayAdd) {
        btnStayAdd.addEventListener("click", function () {
          var inp = stage.querySelector("[data-stay-url-new]");
          var url = (inp && inp.value || "").trim();
          if (!url || !/^https?:\/\//i.test(url)) {
            if (typeof alert === "function") alert("Paste the Airbnb / hotel link first.");
            return;
          }
          var cin = ((stage.querySelector("[data-stay-in-new]") || {}).value || "").trim();
          var cout = ((stage.querySelector("[data-stay-out-new]") || {}).value || "").trim();
          var title = ((stage.querySelector("[data-stay-title-new]") || {}).value || "").trim() || "Stay";
          if (!cin || !/^\d{4}-\d{2}-\d{2}$/.test(cin)) {
            if (typeof alert === "function") alert("Check-in required (YYYY-MM-DD) so Cal can show this stay.");
            return;
          }
          if (!cout || !/^\d{4}-\d{2}-\d{2}$/.test(cout)) {
            if (typeof alert === "function") alert("Check-out required (YYYY-MM-DD) so Cal covers the trip weekend.");
            return;
          }
          var bind = null;
          try {
            var pan = stage.querySelector("#stayAddPanel");
            bind = pan && pan.getAttribute("data-trip-bind")
              ? JSON.parse(pan.getAttribute("data-trip-bind"))
              : null;
          } catch (eB) { bind = null; }
          var list = loadStays();
          var row = {
            id: "stay-" + Date.now(),
            title: title,
            url: url,
            checkIn: cin,
            checkOut: cout,
            checkInLabel: cin,
            checkOutLabel: cout,
            tripTitle: (bind && bind.tripTitle) || "",
            tripKind: (bind && bind.tripKind) || "",
            tripStart: (bind && bind.tripStart) || "",
            note: "pasted on-device · Dualis does not invent stays"
          };
          list.push(row);
          saveStays(list);
          /* Land on Cal at check-in so the stay is visible on the trip weekend */
          try {
            state.calAnchor = new Date(Number(cin.slice(0, 4)), Number(cin.slice(5, 7)) - 1, 1);
            state.calDayFocus = cin;
          } catch (eC) {}
          goStage("cal", true);
        });
      }
      /* Empty Stay form on Go — same trip weekend prefill */
      (function () {
        var sug = stayDatesFromTrip(nextAwayTrip());
        if (!sug) return;
        var cinEl = stage.querySelector("[data-stay-in-new]");
        var coutEl = stage.querySelector("[data-stay-out-new]");
        var titleEl = stage.querySelector("[data-stay-title-new]");
        if (cinEl && !cinEl.value) cinEl.value = sug.checkIn;
        if (coutEl && !coutEl.value) coutEl.value = sug.checkOut;
        if (titleEl && !titleEl.value) titleEl.value = sug.label;
        var pan = stage.querySelector("#stayAddPanel") || stage.querySelector(".ice-go-stay-empty");
        if (pan) pan.setAttribute("data-trip-bind", JSON.stringify({
          tripTitle: sug.tripTitle, tripKind: sug.tripKind, tripStart: sug.tripStart
        }));
      })();
      stage.querySelectorAll("[data-stay-save]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var idx = Number(btn.getAttribute("data-stay-save"));
          var inp = stage.querySelector('[data-stay-url="' + idx + '"]');
          var url = (inp && inp.value || "").trim();
          if (!url || !/^https?:\/\//i.test(url)) return;
          var list = loadStays();
          if (!list[idx]) return;
          list[idx].url = url;
          saveStays(list);
          goStage("go", true);
        });
      });
      stage.querySelectorAll("[data-host-sheet]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var idx = btn.getAttribute("data-host-sheet");
          var sheet = $("hostSheet" + idx);
          if (sheet) sheet.hidden = false;
        });
      });
      stage.querySelectorAll("[data-host-close]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var idx = btn.getAttribute("data-host-close");
          var sheet = $("hostSheet" + idx);
          if (sheet) sheet.hidden = true;
        });
      });
      stage.querySelectorAll(".ice-go-host-sheet").forEach(function (sheet) {
        sheet.addEventListener("click", function (ev) {
          if (ev.target === sheet) sheet.hidden = true;
        });
      });
    }

    if (id === "game") {
      stage.querySelectorAll("[data-league-pane]").forEach(function (tab) {
        tab.addEventListener("click", function () {
          var pane = tab.getAttribute("data-league-pane");
          stage.querySelectorAll("[data-league-pane]").forEach(function (b) {
            var on = b.getAttribute("data-league-pane") === pane;
            b.classList.toggle("on", on);
            b.setAttribute("aria-selected", on ? "true" : "false");
          });
          stage.querySelectorAll("[data-league-body]").forEach(function (body) {
            var show = body.getAttribute("data-league-body") === pane;
            body.hidden = !show;
            body.classList.toggle("on", show);
          });
        });
      });
    }

    if (id === "tape") {
      stage.querySelectorAll("[data-tape-src]").forEach(function (el) {
        el.addEventListener("click", function () {
          var id = el.getAttribute("data-tape-src");
          if (id === "livebarn") {
            setTapePipe("livebarn");
            setBind("livebarn", "deeplink");
            var knownLb = resolveKnownTapeStream(true);
            if (knownLb && isLiveBarnUrl(knownLb)) {
              lsSet(TAPE_STREAM_KEY, knownLb);
              openTapePlayground(knownLb, "dualis_livebarn");
            } else if (knownLb) {
              /* Non-LB URL in notes — still open playground hole */
              lsSet(TAPE_STREAM_KEY, knownLb);
              openTapePlayground(knownLb, "dualis_livebarn");
            } else {
              /* No known stream — sign-in in playground; after login they browse; save stream URL when found */
              openTapePlayground(LB_SIGNIN, "dualis_livebarn");
            }
            return;
          }
          if (id === "hudl") {
            setTapePipe("hudl");
            setBind("hudl", "deeplink");
            openTapeWindow("https://www.hudl.com/logins", "dualis_hudl");
            goStage("tape", true);
            return;
          }
          if (id === "byo") {
            setTapePipe("byo");
            /* Do NOT goStage — remount dismisses the mobile keyboard and eats paste. */
            stage.querySelectorAll("[data-tape-src]").forEach(function (btn) {
              btn.classList.toggle("on", btn.getAttribute("data-tape-src") === "byo");
            });
            var wrap = $("tapeByoWrap");
            if (wrap) wrap.scrollIntoView({ block: "center", behavior: "smooth" });
            var inp = $("tapeStreamIn");
            if (inp) {
              setTimeout(function () {
                try { inp.focus({ preventScroll: true }); } catch (eF) { inp.focus(); }
              }, 120);
            }
          }
        });
      });
      var saveByo = $("btnTapeSaveByo");
      if (saveByo) saveByo.addEventListener("click", function () {
        var v = (($("tapeStreamIn") && $("tapeStreamIn").value) || "").trim();
        if (v && !/^https?:\/\//i.test(v)) {
          if (typeof alert === "function") alert("Paste a full https:// stream URL from the team cam.");
          return;
        }
        var user = (($("tapeUserIn") && $("tapeUserIn").value) || "").trim();
        var pass = (($("tapePassIn") && $("tapePassIn").value) || "");
        lsSet(TAPE_STREAM_KEY, v);
        setTapeAuth(user, pass);
        setTapePipe(v ? "byo" : "");
        goStage("tape", true);
      });
      var openAuth = $("btnTapeOpenAuth");
      if (openAuth) openAuth.addEventListener("click", function () {
        var v = (($("tapeStreamIn") && $("tapeStreamIn").value) || "").trim() || getTapeStream() || streamUrlFromTeamSnap();
        if (!v) {
          if (typeof alert === "function") alert("Paste the team stream URL first.");
          return;
        }
        var user = (($("tapeUserIn") && $("tapeUserIn").value) || "").trim() || getTapeAuth().user;
        var pass = (($("tapePassIn") && $("tapePassIn").value) || "") || getTapeAuth().pass;
        lsSet(TAPE_STREAM_KEY, v);
        setTapeAuth(user, pass);
        setTapePipe("byo");
        /* Prefer Dualis landscape shell (we control overlay) over raw popup */
        goStage("tape", true);
        setTimeout(function () {
          var shell = document.getElementById("tapeLandShell");
          if (shell) {
            shell.classList.add("active");
            document.documentElement.classList.add("ice-tape-land-lock");
            tryLockTapeLandscape();
            applyTapeLiveEvents();
          } else {
            openTapeWindow(tapeUrlWithAuth(v, user, pass), "dualis_teamcam");
          }
        }, 80);
      });

      function armTapeLand() {
        var shell = document.getElementById("tapeLandShell");
        if (!shell) return;
        if (!tapeIsLandscape() && liveBarnBlocksIframe(frameSrc || byo || LB_SIGNIN)) {
          /* Portrait: keep invite clickable — ask rotate, do not fake 90° or lock yet */
          var inv = document.getElementById("tapeLbInvite");
          if (inv) {
            var tip = inv.querySelector(".ice-tape-rotate-tip");
            if (!tip) {
              tip = document.createElement("p");
              tip.className = "ice-note ice-tape-rotate-tip";
              tip.textContent = "Rotate your phone to landscape, then tap Enter playground.";
              inv.appendChild(tip);
            }
          } else if (typeof alert === "function") {
            alert("Rotate to landscape, then tap Enter playground.");
          }
          return;
        }
        shell.classList.add("active");
        document.documentElement.classList.add("ice-tape-land-lock");
        tryLockTapeLandscape();
        applyTapeLiveEvents();
      }
      function disarmTapeLand() {
        var shell = document.getElementById("tapeLandShell");
        if (shell) shell.classList.remove("active");
        document.documentElement.classList.remove("ice-tape-land-lock");
        hideTapeTicker();
        unlockTapeLandscape();
      }
      var landOpen = $("btnTapeLandOpen");
      if (landOpen) landOpen.addEventListener("click", function () {
        armTapeLand();
        /* LB stream stays in paired window — opened from invite, not forced here */
      });
      /* LB CTAs are <a target=_blank> — no JS open needed. Keep ids for analytics/hooks. */
      /* If user rotates to landscape while on Tape LB, offer lock only then — never early */
      if (!window._tapeOrientWired) {
        window._tapeOrientWired = true;
        window.addEventListener("orientationchange", function () {
          setTimeout(function () {
            var shell = document.getElementById("tapeLandShell");
            if (!shell || !shell.classList.contains("active")) return;
            if (tapeIsLandscape()) tryLockTapeLandscape();
          }, 250);
        });
      }
      var landClose = $("btnTapeLandClose");
      if (landClose) landClose.addEventListener("click", disarmTapeLand);
      /* Auto-arm when Save remounted with byo on */
      if (document.getElementById("tapeLandShell") && getTapePipe() === "byo" && getTapeStream() && tapeIsLandscape()) {
        setTimeout(armTapeLand, 60);
      }
      /* Poll GameSheet live echo while landscape is up — never invent */
      if (window._tapeLivePoll) clearInterval(window._tapeLivePoll);
      window._tapeLivePoll = setInterval(function () {
        if (!document.getElementById("tapeLandShell") ||
            !document.getElementById("tapeLandShell").classList.contains("active")) return;
        applyTapeLiveEvents();
      }, 4000);
    }

    if (id === "me") {
      /* Me archetype dims are echo-locked — no player Save claims rewrite. */
      /* NHL role model claim removed — DCLM only. */
      var hdbForm = $("meHdbForm");
      if (hdbForm) {
        hdbForm.addEventListener("submit", function (ev) {
          ev.preventDefault();
          var inp = $("meHdbQ");
          var q = (inp && String(inp.value || "").trim()) || "";
          if (!q) {
            var seat0 = getSeat() || {};
            q = String(seat0.last || "").trim();
            if (inp && q) inp.value = q;
          }
          if (!q) return;
          /* Live HockeyDB find uses full_name (verified on players.html form). */
          var url = "https://www.hockeydb.com/ihdb/stats/find_player.php?full_name=" + encodeURIComponent(q);
          window.open(url, "_blank", "noopener,noreferrer");
        });
      }
    }

    if (id === "school") {
      function readSchoolTextFile(f) {
        var reader = new FileReader();
        reader.onload = function () {
          state.schoolText = String(reader.result || "").slice(0, 8000);
          goStage("school", true);
        };
        reader.readAsText(f);
      }
      function readSchoolPhoto(f) {
        if (!f || !/^image\//.test(f.type || "")) {
          if (typeof alert === "function") alert("Pick a photo of the transcript.");
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          var data = String(reader.result || "");
          /* Keep modest — phone storage */
          if (data.length > 2.5e6) {
            if (typeof alert === "function") alert("Photo too large for this phone save. Try a closer crop.");
            return;
          }
          lsSet(SCHOOL_PHOTO_KEY, data);
          goStage("school", true);
        };
        reader.readAsDataURL(f);
      }
      function setSchoolFileSlot(f) {
        var nameEl = $("schoolFileName");
        var fileIn = $("schoolFile");
        if (nameEl) nameEl.textContent = f && f.name ? f.name : "No file chosen";
        if (fileIn && f && typeof DataTransfer !== "undefined") {
          try {
            var dt = new DataTransfer();
            dt.items.add(f);
            fileIn.files = dt.files;
          } catch (e) { /* some browsers block programmatic files; photo still saves */ }
        }
      }
      if ($("schoolFile")) $("schoolFile").addEventListener("change", function (ev) {
        var f = ev.target.files && ev.target.files[0];
        if (!f) return;
        setSchoolFileSlot(f);
        if (/^image\//.test(f.type || "")) readSchoolPhoto(f);
        else readSchoolTextFile(f);
      });
      if ($("btnSchoolCam") && $("schoolCam")) {
        $("btnSchoolCam").addEventListener("click", function () {
          $("schoolCam").click();
        });
      }
      if ($("schoolCam")) $("schoolCam").addEventListener("change", function (ev) {
        var f = ev.target.files && ev.target.files[0];
        if (!f) return;
        setSchoolFileSlot(f);
        readSchoolPhoto(f);
        try { ev.target.value = ""; } catch (e) {}
      });
      if ($("btnSchool")) $("btnSchool").addEventListener("click", function () {
        var gpa = (($("schoolGpa") && $("schoolGpa").value) || "").trim();
        lsSet(SCHOOL_GPA_KEY, gpa);
        var blob = gpa ? ("GPA " + gpa) : "";
        if (state.schoolText) blob = (blob ? blob + "\n" : "") + state.schoolText;
        state.schoolText = blob || state.schoolText || "";
        var scored = scoreSchool(state.schoolText || gpa);
        state.schoolEcho = scored.echo;
        state.schoolScore = scored.score;
        goStage("school", true);
      });
      if ($("schoolGpa")) $("schoolGpa").addEventListener("change", function () {
        lsSet(SCHOOL_GPA_KEY, (($("schoolGpa") && $("schoolGpa").value) || "").trim());
      });
    }
  }

  function wireChrome() {
    var chip = $("seatChip");
    if (chip) chip.addEventListener("click", function () {
      try { location.hash = "seat"; } catch (e) {}
      goStage("seat");
    });
    var rail = $("iceRail");
    if (rail) rail.addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-stage]");
      if (btn) goStage(btn.getAttribute("data-stage"));
    });
    var sheet = $("iceSheet");
    if (sheet) sheet.addEventListener("click", function (ev) {
      if (ev.target === sheet || ev.target.id === "btnCloseBind") { closeBind(); return; }
      var demo = ev.target.closest("[data-demo-bind]");
      if (demo) {
        var vid = demo.getAttribute("data-demo-bind");
        demo.disabled = true;
        bindWithHandshake(vid, { purpose: "apps_bind" }).then(function (ok) {
          if (ok) {
            closeBind();
            var land = "me";
            for (var bi = 0; bi < BINDS.length; bi++) {
              if (BINDS[bi].id === vid && BINDS[bi].landStage) { land = BINDS[bi].landStage; break; }
            }
            goStage((vid === "workout" || vid === "nutrition") ? land : state.stage, true);
          } else if (demo) demo.disabled = false;
        });
        return;
      }
      var clear = ev.target.closest("[data-clear-bind]");
      if (clear) {
        var cid = clear.getAttribute("data-clear-bind");
        try { localStorage.removeItem(BIND_PFX + cid); } catch (e) {}
        if (window.DCPasskey && DCPasskey.clearProof) DCPasskey.clearProof(cid);
        closeBind();
        goStage(state.stage, true);
        return;
      }
      var claim = ev.target.closest("#btnConfirmClaim");
      if (claim) {
        claim.disabled = true;
        claimSeat(claim.getAttribute("data-jersey"), claim.getAttribute("data-via")).then(function () {
          closeBind();
        });
      }
    });
    var dev = $("iceDevFlag");
    if (dev) dev.addEventListener("click", function () {
      lsSet(FOUND_KEY, "1");
      paintBanner();
    });
    window.addEventListener("hashchange", function () {
      var h = (location.hash || "").replace("#", "");
      if (h && h !== state.stage) goStage(h, true);
    });
  }


  function resetIceLocal() {
    var keys = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && (k.indexOf("dc.ice.") === 0 || k.indexOf("dc.teamsnap") === 0 || k === "dc.founder.dev" || k.indexOf("dc.identity.") === 0)) {
          keys.push(k);
        }
      }
    } catch (e0) {}
    keys.forEach(function (k) { try { localStorage.removeItem(k); } catch (e1) {} });
    clearPendingClaim();
    try {
      if (window.DCTeamSnap && DCTeamSnap.clearToken) DCTeamSnap.clearToken();
    } catch (e2) {}
    try {
      document.cookie = "dc_ice_seat_bak=; path=/; max-age=0; SameSite=Lax";
    } catch (e3) {}
    try { sessionStorage.clear(); } catch (e4) {}
    state.pickedJersey = null;
    state.showProve = false;
    paintChip();
    location.href = location.pathname + "?pack=hockey#seat";
    location.reload();
  }

  function seatIsBound() {
    var s = getSeat();
    if (!s || s.jersey == null) return false;
    /* Demo / attested / pending are NOT a real TeamSnap lock */
    if (s.how === "pending_oauth" || s.how === "attested" || s.how === "demo" || !s.how) {
      if (s.how !== "oauth") {
        /* Only oauth how on the seat counts — ignore leftover Apps bind flags */
        return false;
      }
    }
    if (s.how === "oauth") return true;
    return false;
  }

  function qsStage() {
    try {
      var q = new URLSearchParams(location.search);
      var s = q.get("stage") || (location.hash || "").replace("#", "");
      /* Explicit hash/stage always wins (Connect returnTo #game after bind). */
      if (STAGES.some(function (x) { return x.id === s; })) {
        if (s === "game" && !seatIsBound() && !getSeat()) return "seat";
        if (s === "game" && !seatIsBound()) return "seat";
        return s;
      }
    } catch (e) {}
    /* Default: Seat until bound; Game only after bind. */
    return seatIsBound() ? "game" : "seat";
  }

  function hidePassGate() {
    var g = $("icePassGate");
    if (g) g.hidden = true;
  }
  function showPassGate(mode) {
    var g = $("icePassGate");
    if (!g) return;
    g.hidden = false;
    var mk = $("btnIceMakeKey");
    if (mk) mk.hidden = mode !== "create";
    var msg = $("icePassMsg");
    if (msg) {
      msg.textContent = mode === "create"
        ? "No passkey yet. Make one to lock ice + sign TeamSnap/Spordle binds."
        : "Passkey found. Unlock to open the rink.";
    }
  }
  function wirePassGate() {
    var unlock = $("btnIceUnlock");
    var make = $("btnIceMakeKey");
    if (unlock) unlock.addEventListener("click", function () {
      if (!window.DCPasskey) return;
      unlock.disabled = true;
      DCPasskey.unlock().then(function (res) {
        unlock.disabled = false;
        if (res && res.ok) {
          hidePassGate();
          continueBoot();
        } else {
          var msg = $("icePassMsg");
          if (msg) msg.textContent = "Unlock cancelled or failed (" + ((res && res.reason) || "?") + ").";
        }
      });
    });
    if (make) make.addEventListener("click", function () {
      if (!window.DCPasskey) return;
      make.disabled = true;
      DCPasskey.register({ name: "ice", displayName: "Dualis ice" }).then(function (res) {
        make.disabled = false;
        if (res && res.ok) {
          hidePassGate();
          continueBoot();
        } else {
          var msg = $("icePassMsg");
          if (msg) msg.textContent = "Passkey not created (" + ((res && res.reason) || "?") + ").";
        }
      });
    });
  }
  var bootStarted = false;
  function continueBoot() {
    if (bootStarted) return;
    bootStarted = true;
    /* Stale #game from an earlier OAuth return — don't honor until bound */
    try {
      if ((location.hash || "").replace("#", "") === "game" && !seatIsBound()) {
        history.replaceState(null, "", location.pathname + location.search + "#seat");
      }
    } catch (eHash) {}
    var start = qsStage();
    loadIndex().then(function () {
      var seat = getSeat();
      /* Bound/pending keep their team; unbound starts with no team — no Quinte bias */
      var slug = (seat && seat.team_slug) || "";
      try {
        var pend = JSON.parse(localStorage.getItem("dc.ice.pending_claim") || "null");
        if (pend && pend.team_slug) slug = pend.team_slug;
      } catch (e0) {}
      return loadPack(slug);
    }).then(function () {
      /* Drop ghost seats that were written as pending_oauth / demo / attested */
      try {
        var ghost = getSeat();
        if (ghost && ghost.how !== "oauth") {
          localStorage.removeItem(SEAT_KEY);
        }
      } catch (eGhost) {}
      if (!getSeat()) {
        var bak = readSeatBakCookie();
        /* Cookie bak is oauth-only now; never revive pending as a seat */
        if (bak && bak.jersey != null && bak.how === "oauth") {
          lockSeatNow(bak.jersey, bak.via || "teamsnap", "oauth");
        }
      }
      finalizePendingTeamSnapClaim();
      var seat2 = getSeat();
      if (seat2 && window.DCTeamSnap && DCTeamSnap.hasToken && DCTeamSnap.hasToken()) {
        setBind("teamsnap", "oauth");
        if (seat2.how !== "oauth") {
          seat2.how = "oauth";
          seat2.via = "teamsnap";
          lsSet(SEAT_KEY, JSON.stringify(seat2));
          paintChip();
        }
      }
      /* Re-resolve default after finalize — never force Game before bind */
      if (!location.hash && !new URLSearchParams(location.search).get("stage")) {
        start = seatIsBound() ? "game" : "seat";
      } else if (start === "game" && !seatIsBound()) {
        start = "seat";
      }
      goStage(start);
    });
  }
  function boot() {
    ensureFounderPaySkip();
    paintBanner();
    paintChip();
    paintRail();
    wireChrome();
    wirePassGate();
    if (window.DCPasskey && DCPasskey.requiresIceUnlock()) {
      showPassGate("unlock");
      return;
    }
    /* Founder tip: offer create if none — do not block browse; critical binds will demand it */
    if (window.DCPasskey && !DCPasskey.hasPasskey()) {
      var mk = $("btnIceMakeKey");
      if (mk) mk.hidden = false;
    }
    continueBoot();
  }

  g.DCIce = {
    goStage: goStage,
    getSeat: getSeat,
    resetIceLocal: resetIceLocal,
    isFounder: isFounder,
    FALLBACK_PACK: FALLBACK_PACK
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(typeof window !== "undefined" ? window : globalThis);
