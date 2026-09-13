/**
 * DualisCapax DCLM à la carte sport shell
 * Same lander theme. Hockey is the first live pack; any major sport plugs in
 * when meters + priors exist (tweak.sport.*). LOOK/MEASURE free. Jacket CLOSED.
 * Law: NO_FORCE · sim ≠ treatment · no named-minor PII · residual only if measured.
 * Hockey: Household seat (Leaf $49, family included) vs Org seat (Bench $299 /
 * Club $499 weapon) — see research/HOCKEY-SEAT-SPLIT.md V2.
 */
(function (g) {
  var SEAT_KEY = "dc.alacarte.seatMode";

  var LADDER = {
    look: { cad: 0, ticks: 0, label: "Look", note: "Browse free" },
    measure: { cad: 0, ticks: 1, label: "Measure", note: "One free try" },
    leaf: { cad: 49, ticks: 8, label: "Leaf", sku: "SKU-017", note: "Household · family included" },
    bench: { cad: 299, ticks: 40, label: "Bench", sku: "SKU-018", note: "Coach · team view" },
    club: { cad: 499, ticks: 160, label: "Club", sku: "SKU-019", note: "Org weapon · full roster 16–18 · $499" }
  };

  /** Pack registry — hockey live; others WAIT until meters dropped */
  var PACKS = {
    hockey: {
      id: "hockey",
      tweak: "tweak.sport.ice_hockey",
      status: "live_template",
      title: "Hockey SEC-01",
      headline: "Stop 3rd-period fatigue collapses.",
      one_liner: "TeamSnap knows who showed up. GameSheet is the score (never paste). LiveBarn is the tape. Hudl/Sportlogiq optional. Dualis names the leftover.",
      pipe: [
        { who: "TeamSnap", job: "Roster / RSVP / consent door" },
        { who: "GameSheet", job: "Score pull · never paste when league has GameSheet" },
        { who: "LiveBarn", job: "Tape pointer (not hosted by Dualis)" },
        { who: "Hudl / Sportlogiq", job: "Optional shift cuts / tags — their meter" },
        { who: "Dualis", job: "Clocks + receipt on measured_tape[]" }
      ],
      their_meter_note: "Sportlogiq LiveBarn PA ≈ USD $14.95 / game / player — their bill, not wrapped into Leaf $49. GameSheet auto-pull — never paste.",
      roles: [
        { id: "F", label: "Forward (F)" },
        { id: "D", label: "Defence (D)" },
        { id: "G", label: "Goalie (G) · prior only" }
      ],
      fields: [
        { id: "shift_s", label: "shift_s", type: "number", priorKey: "shift_s" },
        { id: "bench_s", label: "bench_s", type: "number", priorKey: "bench_s" },
        { id: "bursts", label: "bursts", type: "number", priorKey: "bursts_per_shift" },
        { id: "peak_kmh", label: "peak_kmh", type: "number", priorKey: "peak_kmh" },
        { id: "mean_kmh", label: "mean_kmh", type: "number", priorKey: "mean_kmh" },
        { id: "hr_peak", label: "hr_peak", type: "number", default: 185 },
        { id: "hr_bench", label: "hr_bench", type: "number", default: 110 }
      ],
      priors: {
        F: { shift_s: 42, bench_s: 90, bursts_per_shift: 6, peak_kmh: 32, mean_kmh: 16.5 },
        D: { shift_s: 48, bench_s: 110, bursts_per_shift: 5, peak_kmh: 28, mean_kmh: 15 },
        G: { shift_s: 1200, bench_s: 0, bursts_per_shift: 2, peak_kmh: 12, mean_kmh: 4 }
      },
      bout_noun: "shift",
      seatModes: true,
      run: runHockey
    },
    golf: {
      id: "golf",
      tweak: "tweak.sport.golf",
      status: "wait_meters",
      title: "Golf · 18-hole caddie",
      headline: "The caddie that knows the physics of every yard.",
      one_liner: "Course / wind / green speed stay on their stack. Dualis names the leftover energy and decision residual.",
      pipe: [
        { who: "Tee sheet / club app", job: "Who plays · when" },
        { who: "Launch monitor / watch", job: "Ball / club numbers (paste)" },
        { who: "Dualis", job: "Bout clocks + receipt when meters land" }
      ],
      their_meter_note: "Do not invent launch-monitor SKUs. Paste-first when the pack goes live.",
      roles: [
        { id: "SCRATCH", label: "Scratch / low single" },
        { id: "MID", label: "Mid handicap" },
        { id: "HIGH", label: "High handicap" }
      ],
      fields: [
        { id: "hole", label: "hole", type: "number", default: 1 },
        { id: "carry_m", label: "carry_m", type: "number", default: 200 },
        { id: "club_speed", label: "club_speed_mph", type: "number", default: 90 },
        { id: "wind_kmh", label: "wind_kmh", type: "number", default: 8 },
        { id: "temp_c", label: "temp_c", type: "number", default: 18 }
      ],
      priors: {
        SCRATCH: { hole: 1, carry_m: 240, club_speed: 105, wind_kmh: 8, temp_c: 18 },
        MID: { hole: 1, carry_m: 200, club_speed: 90, wind_kmh: 8, temp_c: 18 },
        HIGH: { hole: 1, carry_m: 160, club_speed: 78, wind_kmh: 8, temp_c: 18 }
      },
      bout_noun: "shot / hole",
      run: runGolfStub
    },
    soccer: {
      id: "soccer",
      tweak: "tweak.sport.soccer",
      status: "wait_meters",
      title: "Soccer / football",
      headline: "Same DCLM shell — meters WAIT.",
      one_liner: "Drop distance / HR / half splits when the tweak lands. Dualis does not invent a league feed.",
      pipe: [{ who: "Club ops", job: "Roster / consent" }, { who: "Wearable / tape", job: "Paste meters" }, { who: "Dualis", job: "Clocks + receipt" }],
      their_meter_note: "Pack WAIT until HK-equivalent soccer meters are declared.",
      roles: [{ id: "MF", label: "Midfield" }, { id: "FW", label: "Forward" }, { id: "DF", label: "Defence" }],
      fields: [
        { id: "bout_s", label: "bout_s", type: "number", default: 90 },
        { id: "distance_km", label: "distance_km", type: "number", default: 1.2 },
        { id: "hr_peak", label: "hr_peak", type: "number", default: 180 }
      ],
      priors: { MF: { bout_s: 90, distance_km: 1.4, hr_peak: 180 }, FW: { bout_s: 70, distance_km: 1.1, hr_peak: 185 }, DF: { bout_s: 95, distance_km: 1.0, hr_peak: 175 } },
      bout_noun: "bout",
      run: runWaitStub
    },
    basketball: {
      id: "basketball",
      tweak: "tweak.sport.basketball",
      status: "wait_meters",
      title: "Basketball",
      headline: "Same DCLM shell — meters WAIT.",
      one_liner: "Shift/stint clocks when the tweak lands. No invented tracking feed.",
      pipe: [{ who: "Club ops", job: "Roster / consent" }, { who: "Wearable / film", job: "Paste meters" }, { who: "Dualis", job: "Clocks + receipt" }],
      their_meter_note: "Pack WAIT.",
      roles: [{ id: "G", label: "Guard" }, { id: "F", label: "Forward" }, { id: "C", label: "Centre" }],
      fields: [
        { id: "stint_s", label: "stint_s", type: "number", default: 90 },
        { id: "bench_s", label: "bench_s", type: "number", default: 120 },
        { id: "hr_peak", label: "hr_peak", type: "number", default: 185 }
      ],
      priors: { G: { stint_s: 80, bench_s: 100, hr_peak: 188 }, F: { stint_s: 90, bench_s: 120, hr_peak: 185 }, C: { stint_s: 70, bench_s: 140, hr_peak: 180 } },
      bout_noun: "stint",
      run: runWaitStub
    }
  };

  var LN2 = Math.log(2);
  var T_FAST = 22;
  var T_SLOW = 170;

  var ROSTER_STUBS = [
    "A.K", "B.M", "C.R", "D.L", "E.S", "F.T", "G.N", "H.W", "I.P",
    "J.V", "K.Q", "L.Y", "M.Z", "N.B", "O.C", "P.D", "Q.E"
  ];

  function pcrRem(t, af, as, tau) {
    var hole = af * Math.exp(-LN2 * t / tau) + as * Math.exp(-LN2 * t / T_SLOW);
    return Math.max(0, Math.min(1, 1 - hole));
  }
  function secTo(af, as, target, tau) {
    var lo = 0, hi = 900;
    for (var i = 0; i < 40; i++) {
      var mid = 0.5 * (lo + hi);
      if (pcrRem(mid, af, as, tau) >= target) hi = mid; else lo = mid;
    }
    return hi;
  }
  function num(v, d) { var n = Number(v); return isFinite(n) && n >= 0 ? n : d; }
  function r1(n) { return Math.round(n * 10) / 10; }
  function r3(n) { return Math.round(n * 1000) / 1000; }

  function getSeatMode() {
    try {
      var v = localStorage.getItem(SEAT_KEY);
      if (v === "org" || v === "household") return v;
    } catch (e) {}
    return "household";
  }
  function setSeatMode(mode) {
    var m = mode === "org" ? "org" : "household";
    try { localStorage.setItem(SEAT_KEY, m); } catch (e) {}
    return m;
  }

  function runHockey(input, pack) {
    var role = input.role || "F";
    var prior = (pack.priors && pack.priors[role]) || pack.priors.F;
    var shift_s = num(input.shift_s, prior.shift_s);
    var bench_s = num(input.bench_s, prior.bench_s);
    var bursts = num(input.bursts, prior.bursts_per_shift);
    var peak = num(input.peak_kmh, prior.peak_kmh);
    var mean = num(input.mean_kmh, prior.mean_kmh);
    var hr_peak = num(input.hr_peak, 185);
    var raw = Math.min(0.8, 0.1 * bursts + 0.006 * shift_s);
    var af = 0.62 * raw, as = 0.38 * raw;
    var pcr = pcrRem(bench_s, af, as, T_FAST);
    var to80 = secTo(af, as, 0.8, T_FAST);
    var q = (shift_s / 45) * (hr_peak / 185);
    var glyc = 0.012 * (shift_s / 45) * (1 + 0.08 * bursts);
    if (role === "D") glyc *= 1.15;
    var flag = pcr >= 0.8 && q < 1.1 ? "OPTIMAL_BURST" : pcr >= 0.7 ? "PARTIAL_PCR_REFILL" : "FATIGUE_MANAGED";
    return {
      ok: true,
      evidence: input.tape_present ? "MEASURED_TAPE" : "LITERATURE_PRIOR",
      clocks: [
        { label: "PCr after bench", value: (pcr * 100).toFixed(1) + "%" },
        { label: "Seconds to 80% PCr", value: r1(to80) + " s" },
        { label: "Peak − mean", value: r1(peak - mean) + " km/h" },
        { label: "Glycogen leak", value: (glyc * 100).toFixed(2) + "%" }
      ],
      flag: flag,
      note: "Residual $ only if ice-waste is in a signed book — not on a prior."
    };
  }

  function runHockeyTeamGrain(modelMode, pack) {
    var pf = pack.priors.F;
    var pd = pack.priors.D;
    var mode = modelMode || "full";
    var lineupResidual = mode === "full" ? 11.4 : mode === "lines" ? 8.2 : mode === "pppk" ? 6.1 : 7.5;
    var iceWaste = mode === "full" ? 4.8 : mode === "lines" ? 3.6 : mode === "pppk" ? 2.9 : 3.2;
    var periodFD = r1((pd.shift_s / pf.shift_s) * 1.08);
    var evidence = mode === "full" || mode === "lines" ? "TEAM_GRAIN" : "LITERATURE_PRIOR";
    return {
      ok: true,
      evidence: evidence,
      grain: "team",
      modelMode: mode,
      clocks: [
        { label: "Lineup residual", value: lineupResidual.toFixed(1) + "%" },
        { label: "Ice-waste stub", value: iceWaste.toFixed(1) + "%" },
        { label: "Period F|D ratio", value: String(periodFD) },
        { label: "Units modeled", value: mode === "full" ? "17 seats" : mode === "lines" ? "L1/L2/D/G" : mode === "pppk" ? "PP·PK" : "Custom" }
      ],
      flag: "TEAM_GRAIN_STUB",
      note: "Org weapon · team-grain heuristic from priors. Not a signed book. No named-minor PII. CLOSED — request grant."
    };
  }

  function runGolfStub(input, pack) {
    return {
      ok: false,
      wait: true,
      evidence: "ABSENT",
      clocks: [],
      flag: "WAIT_METERS",
      note: "Golf pack is scaffolded. Same shell as hockey — declare meters before scoring a bout. CLOSED — request grant."
    };
  }
  function runWaitStub(input, pack) {
    return {
      ok: false,
      wait: true,
      evidence: "ABSENT",
      clocks: [],
      flag: "WAIT_METERS",
      note: (pack.title || "Pack") + " WAIT. Drop tweak meters before Dualis prints clocks. No invented league feed."
    };
  }

  async function sha256Hex(str) {
    var dig = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(dig)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function qsPack() {
    try {
      var p = new URLSearchParams(location.search).get("pack") || new URLSearchParams(location.search).get("sport");
      if (p && PACKS[p]) return p;
    } catch (e) {}
    if (/hockey/i.test(location.pathname)) return "hockey";
    return "hockey";
  }

  function ladderCard(t, p, n) {
    return '<div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:10px;padding:0.7rem;">' +
      '<div style="font-weight:800;font-size:0.92rem;">' + esc(t) + '</div>' +
      '<div style="font-size:0.85rem;color:var(--accent-mint);font-weight:800;">' + esc(p) + '</div>' +
      '<div style="font-size:0.72rem;color:var(--text-muted);">' + esc(n) + "</div></div>";
  }

  function seatToggleHtml(mode) {
    var hh = mode === "household";
    return '<div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-top:0.85rem;align-items:center;">' +
      '<span style="font-size:0.68rem;font-family:var(--font-mono);color:var(--text-muted);margin-right:0.25rem;">Seat mode</span>' +
      '<button type="button" class="action-pill" id="btnSeatHousehold" style="font-size:0.75rem;padding:0.4rem 0.75rem;' +
        (hh ? "border-color:var(--accent-cyan);color:var(--text-primary);" : "") + '">Household</button>' +
      '<button type="button" class="action-pill" id="btnSeatOrg" style="font-size:0.75rem;padding:0.4rem 0.75rem;' +
        (!hh ? "border-color:var(--accent-cyan);color:var(--text-primary);" : "") + '">Org</button>' +
      '</div>';
  }

  function connectorChip(name, on) {
    return '<button type="button" class="action-pill dc-conn-chip" data-conn="' + esc(name) + '" style="font-size:0.72rem;padding:0.35rem 0.65rem;' +
      (on ? "border-color:var(--accent-mint);color:var(--accent-mint);" : "opacity:0.55;") + '">' +
      esc(name) + (on ? " · on" : " · off") + "</button>";
  }

  function householdPanelHtml(pack) {
    /* Explainer subsection under pricing — no connectors, no clock fields. */
    void pack;
    return '<div id="panelHousehold" style="margin-top:0.65rem;padding:0.85rem 0.9rem;background:var(--bg-main);border:1px solid var(--border-subtle);border-radius:12px;">' +
      '<div style="font-family:var(--font-mono);font-size:0.68rem;font-weight:800;color:var(--accent-cyan);letter-spacing:0.03em;text-transform:uppercase;">Household seat · Leaf $49 · Family included</div>' +
      '<h3 style="font-size:1.1rem;font-weight:800;margin:0.35rem 0 0;color:var(--text-primary);">Own games + itinerary</h3>' +
      '<p style="font-size:0.86rem;color:var(--text-secondary);line-height:1.55;margin:0.4rem 0 0;">One athlete seat. The family shares the same login — no separate family price. Travel is part of the household seat. If the league uses GameSheet, Dualis pulls the score; you never paste it in.</p>' +
    "</div>";
  }

  function orgRosterGridHtml() {
    return ROSTER_STUBS.map(function (ini, i) {
      var consent = i % 5 !== 4;
      return '<div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:8px;padding:0.45rem 0.35rem;text-align:center;">' +
        '<div style="font-weight:800;font-size:0.82rem;font-family:var(--font-mono);">' + esc(ini) + "</div>" +
        '<div style="font-size:0.6rem;color:' + (consent ? "var(--accent-mint)" : "var(--accent-orange)") + ';margin-top:0.15rem;">' +
        (consent ? "● consent" : "○ pending") + "</div></div>";
    }).join("");
  }

  function orgPanelHtml(pack) {
    /* Explainer only — no model modes, roster grid, or compute controls on this face. */
    void pack;
    return '<div id="panelOrg" style="margin-top:0.65rem;padding:0.85rem 0.9rem;background:var(--bg-main);border:1px solid var(--border-subtle);border-radius:12px;">' +
      '<div style="font-family:var(--font-mono);font-size:0.68rem;font-weight:800;color:var(--accent-mint);letter-spacing:0.03em;text-transform:uppercase;">Org seat · Club $499 · Bench $299</div>' +
      '<h3 style="font-size:1.1rem;font-weight:800;margin:0.35rem 0 0;color:var(--text-primary);">The whole team as one picture</h3>' +
      '<p style="font-size:0.86rem;color:var(--text-secondary);line-height:1.55;margin:0.4rem 0 0;">A club or coach seat looks at the full roster together — lines and special teams when the coach sets them — instead of eighteen separate family calendars. Kids\' private details stay off the public card. Deeper tools come later.</p>' +
    "</div>";
  }

  function lineToggle(label, on) {
    return '<label style="display:inline-flex;align-items:center;gap:0.3rem;font-size:0.78rem;color:var(--text-secondary);cursor:pointer;border:1px solid var(--border-subtle);border-radius:8px;padding:0.35rem 0.55rem;">' +
      '<input type="checkbox" class="org-line-tog" data-line="' + esc(label) + '"' + (on ? " checked" : "") + "> " + esc(label) + "</label>";
  }

  function pasteDoorHtml(pack) {
    /* Clock door parked — not on sport face. */
    void pack;
    return "";
  }

  function renderShell(packId) {
    var pack = PACKS[packId] || PACKS.hockey;
    var root = $("dclmSportApp");
    if (!root) return;

    var seatMode = pack.seatModes ? getSeatMode() : null;

    var statusPill = pack.status === "live_template"
      ? '<span class="badge-pill badge-cyan">Live template · DCLM pack</span>'
      : '<span class="badge-pill" style="border-color:var(--accent-orange);color:var(--accent-orange);">WAIT · meters not dropped</span>';

    var pipe = (pack.pipe || []).map(function (p) {
      return '<li><strong>' + esc(p.who) + "</strong> — " + esc(p.job) + "</li>";
    }).join("");

    var packSwitcher = Object.keys(PACKS).map(function (id) {
      var p = PACKS[id];
      var on = id === pack.id;
      return '<a href="sport.html?pack=' + encodeURIComponent(id) + '" class="action-pill" style="text-decoration:none;font-size:0.75rem;padding:0.4rem 0.7rem;' +
        (on ? "border-color:var(--accent-cyan);color:var(--text-primary);" : "") + '">' + esc(p.title) +
        (p.status === "live_template" ? "" : " · WAIT") + "</a>";
    }).join("");

    var ladderHtml;
    if (pack.seatModes) {
      ladderHtml =
        ladderCard("Look / Measure", "CAD $0", "Free to try") +
        ladderCard("Leaf", "CAD $49", LADDER.leaf.note) +
        ladderCard("Bench", "CAD $299", LADDER.bench.note) +
        ladderCard("Club", "CAD $499", LADDER.club.note);
    } else {
      ladderHtml =
        ladderCard("Look / Measure", "CAD $0", "Free to try") +
        ladderCard("Leaf", "CAD $49", "Household seat") +
        ladderCard("Bench", "CAD $299", "Coach seat") +
        ladderCard("Club", "CAD $499", "Club team seat");
    }

    /* Pure explain: both seat stories, no toggle / field chrome. */
    var doorHtml = pack.seatModes
      ? (householdPanelHtml(pack) + orgPanelHtml(pack))
      : pasteDoorHtml(pack);

    /* Face order: intro → free onboard → paid pricing → explainers → other services.
       Pure explain — no pack switcher, seat toggle, fields, or compute chrome. */
    var introHtml;
    var icePortalHtml;
    var pricingHtml;
    var thirdPeriodHtml;

    if (pack.id === "hockey") {
      introHtml =
        '<section class="pillar-section border-cyan" style="padding-top:0.85rem;padding-bottom:0.9rem;">' +
          '<div class="badge-pill badge-cyan">À la carte · hockey framework</div>' +
          '<h2 class="section-headline" style="font-size:1.35rem;margin:0.4rem 0 0;">Hockey is how we show the seat. Same idea for other sports later.</h2>' +
          '<p class="section-body" style="margin-top:0.55rem;line-height:1.55;">' +
            'We are Canadian. Dualis builds one place for the athlete — next game, travel, tape, school — instead of ten logins. TeamSnap still knows who showed up. GameSheet still has the score. LiveBarn still has the tape. Dualis is the seat that sits with them.' +
          "</p>" +
          '<p class="section-body" style="margin-top:0.55rem;line-height:1.55;">' +
            'This page explains the hockey seat in plain words. No forms. No fake clocks. Deeper tools come later, when the seat is ready for them.' +
          "</p>" +
        "</section>";

      icePortalHtml =
        '<section class="pillar-section border-cyan" style="margin-top:0.55rem;">' +
          '<div class="badge-pill badge-cyan">Free to try</div>' +
          '<h2 class="section-headline" style="font-size:1.25rem;margin-top:0.4rem;">Claim a roster seat. Pay stays closed.</h2>' +
          '<p class="section-body" style="margin-top:0.45rem;line-height:1.55;">' +
            'Pick the team, pick the jersey, prove who you are with TeamSnap or Spordle. Ontario AAA is open for founder testing — all ages. Other provinces later.' +
          "</p>" +
          '<p style="margin-top:0.75rem;">' +
            '<a class="nav-btn-solid" href="ice.html?pack=hockey#seat" style="text-decoration:none;font-size:0.9rem;padding:0.6rem 1.1rem;">Enter ice portal →</a>' +
          "</p>" +
        "</section>";

      pricingHtml =
        '<section class="pillar-section border-mint" style="margin-top:0.75rem;border-color:var(--accent-mint);">' +
          '<div class="badge-pill" style="border-color:var(--accent-mint);color:var(--accent-mint);">When it is not free</div>' +
          '<h2 class="section-headline" style="font-size:1.15rem;margin-top:0.4rem;">Seats you can understand.</h2>' +
          '<p class="section-body" style="margin-top:0.4rem;line-height:1.55;">' +
            'Looking around stays free. Leaf is the household seat — one athlete, family on the same login. Bench is for a coach. Club is for the whole team as one picture. Prices in Canadian dollars.' +
          "</p>" +
          '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0.45rem;margin-top:0.7rem;">' +
            ladderHtml +
          "</div>" +
        "</section>";

      thirdPeriodHtml =
        '<div style="margin-top:0.65rem;padding:0.85rem 0.9rem;background:var(--bg-main);border:1px solid var(--border-subtle);border-radius:12px;">' +
          '<div style="font-size:0.86rem;font-weight:800;color:var(--accent-cyan);">Why parents care</div>' +
          '<h3 style="font-size:1.1rem;font-weight:800;margin:0.35rem 0 0;color:var(--text-primary);">Late-game fade is real — we do not invent it.</h3>' +
          '<p style="font-size:0.86rem;color:var(--text-secondary);line-height:1.55;margin:0.4rem 0 0;">' +
            'Parents see kids look strong early and empty late. Dualis helps you see that from real games and real tape when the seat is real — never destiny, never fake numbers on this page.' +
          "</p>" +
        "</div>";

    } else {
      introHtml =
        '<section class="pillar-section border-cyan" style="padding-top:0.85rem;padding-bottom:0.75rem;">' +
          '<div class="badge-pill badge-cyan">À la carte · ' + esc(pack.title || pack.id) + "</div>" +
          '<h2 class="section-headline" style="font-size:1.25rem;margin:0.35rem 0 0;">' + esc(pack.headline || pack.title) + "</h2>" +
          '<p class="section-body" style="margin-top:0.4rem;line-height:1.55;">' + esc(pack.one_liner || "") + "</p>" +
          '<p class="section-body" style="margin-top:0.45rem;line-height:1.55;">This pack is scaffolded. Meters are not live. No fields here — explain first, measure later.</p>' +
        "</section>";
      icePortalHtml = "";
      pricingHtml =
        '<section class="pillar-section border-mint" style="margin-top:0.75rem;border-color:var(--accent-mint);">' +
          '<div class="badge-pill" style="border-color:var(--accent-mint);color:var(--accent-mint);">Pricing · same ladder</div>' +
          '<p class="section-body" style="margin-top:0.4rem;">Same seat ladder as hockey when this pack goes live. Look / Measure free until then.</p>' +
          '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0.45rem;margin-top:0.55rem;">' +
            ladderHtml +
          "</div>" +
        "</section>";
      thirdPeriodHtml = "";
    }

    function otherServiceCard(title, status, body, href) {
      var live = status === "live";
      var border = live ? "var(--accent-mint)" : "var(--border-subtle)";
      var badge = live
        ? '<span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--accent-mint);">LIVE</span>'
        : '<span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted);">AWAITING</span>';
      var cta = href
        ? ('<a href="' + href + '" class="action-pill" style="text-decoration:none;font-size:0.75rem;padding:0.4rem 0.7rem;margin-top:0.55rem;display:inline-block;">Open →</a>')
        : '<span style="font-size:0.72rem;color:var(--text-muted);margin-top:0.55rem;display:inline-block;">Not shipped yet</span>';
      return '<div style="background:var(--bg-main);border:1px solid ' + border + ';border-radius:12px;padding:0.9rem 1rem;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:0.35rem;">' +
          '<strong style="font-size:0.95rem;">' + esc(title) + "</strong>" + badge +
        "</div>" +
        '<p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.45;margin:0.4rem 0 0;">' + body + "</p>" +
        cta +
      "</div>";
    }

    /* Other à la carte services after explainers (golf before team sports). */
    var otherServicesHtml =
      '<section class="pillar-section border-cyan" style="margin-top:0.85rem;">' +
        '<div class="badge-pill badge-cyan">Other à la carte services</div>' +
        '<h2 class="section-headline" style="font-size:1.15rem;margin-top:0.35rem;">Hockey first. Other sports when ready.</h2>' +
        '<p class="section-body" style="margin-top:0.4rem;line-height:1.55;">' +
          'Hockey is the live framework. Golf may come next because it does not need a roster. Football, soccer, basketball, and more use the same seat idea when they are actually built — never before.' +
        "</p>" +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0.65rem;margin-top:0.75rem;">' +
          otherServiceCard("Golf", "wait", "Individual path. No roster required. Not live yet.", "sport.html?pack=golf") +
          otherServiceCard("Football / NCAA", "wait", "Same seat idea as hockey once ready. Roster-based.", null) +
          otherServiceCard("Soccer", "wait", "Same seat idea. We will not invent a league feed.", "sport.html?pack=soccer") +
          otherServiceCard("Basketball", "wait", "Same seat idea when ready — not before.", "sport.html?pack=basketball") +
        "</div>" +
      "</section>";

    var explainersHtml =
      '<section class="pillar-section border-cyan" style="margin-top:0.75rem;">' +
        '<div class="badge-pill badge-cyan">Explainers</div>' +
        '<h2 class="section-headline" style="font-size:1.15rem;margin-top:0.35rem;">What the seats mean.</h2>' +
        '<p class="section-body" style="margin-top:0.4rem;line-height:1.55;">Household first, then club and coach. No switches. No forms on this page.</p>' +
        doorHtml +
        thirdPeriodHtml +
      "</section>";

    root.innerHTML =
      introHtml +
      icePortalHtml +
      pricingHtml +
      explainersHtml +
      otherServicesHtml +
      '<p id="pipeStatus" style="font-size:0.72rem;color:var(--text-muted);font-family:var(--font-mono);margin:0.65rem 0 0;"></p>';

    wire(pack, seatMode);
    if (seatMode !== "org" && document.getElementById("f_shift_s")) fillPriors(pack);
    var st = $("pipeStatus");
    if (st) {
      st.textContent = "";
      st.style.display = "none";
    }
  }

  function fillPriors(pack) {
    var role = ($("roleSelect") && $("roleSelect").value) || (pack.roles[0] && pack.roles[0].id);
    var prior = (pack.priors && pack.priors[role]) || {};
    (pack.fields || []).forEach(function (f) {
      var el = $("f_" + f.id);
      if (!el) return;
      if (f.priorKey && prior[f.priorKey] != null) el.value = prior[f.priorKey];
      else if (prior[f.id] != null) el.value = prior[f.id];
      else if (f.default != null) el.value = f.default;
    });
  }

  function readInput(pack) {
    var o = {
      role: ($("roleSelect") && $("roleSelect").value) || "",
      tape_present: !!( $("tapePresent") && $("tapePresent").checked ),
      seat: ($("seatId") && $("seatId").value.trim()) || "SEAT-DEID-01"
    };
    (pack.fields || []).forEach(function (f) {
      var el = $("f_" + f.id);
      if (el) o[f.id] = el.value;
    });
    return o;
  }

  function paintResult(box, out, receipt) {
    if (!box) return;
    box.style.display = "block";
    var clocks = (out.clocks || []).map(function (c) {
      return '<div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:10px;padding:0.65rem;">' +
        '<div style="font-size:0.65rem;font-family:var(--font-mono);color:var(--text-muted);">' + esc(c.label) + "</div>" +
        '<div style="font-size:1.1rem;font-weight:900;color:var(--accent-mint);">' + esc(c.value) + "</div></div>";
    }).join("");

    box.innerHTML =
      '<div style="display:flex;flex-wrap:wrap;gap:0.35rem;margin-bottom:0.65rem;">' +
        '<span style="font-size:0.68rem;font-family:var(--font-mono);border:1px solid var(--accent-cyan);color:var(--accent-cyan);padding:0.15rem 0.4rem;border-radius:4px;">' + esc(out.evidence || "") + "</span>" +
        '<span style="font-size:0.68rem;font-family:var(--font-mono);border:1px solid var(--accent-orange);color:var(--accent-orange);padding:0.15rem 0.4rem;border-radius:4px;">' + esc(out.flag || "") + "</span>" +
        (out.grain ? '<span style="font-size:0.68rem;font-family:var(--font-mono);border:1px solid var(--accent-mint);color:var(--accent-mint);padding:0.15rem 0.4rem;border-radius:4px;">' + esc(out.grain) + "</span>" : "") +
      "</div>" +
      (clocks ? '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:0.5rem;margin-bottom:0.75rem;">' + clocks + "</div>" : "") +
      '<p style="font-size:0.84rem;color:var(--text-secondary);line-height:1.5;">' + esc(out.note || "") + "</p>" +
      '<div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--text-muted);margin:0.5rem 0 0.75rem;word-break:break-all;">receipt ' + receipt.slice(0, 32) + "…</div>" +
      '<button type="button" class="nav-btn-solid" style="font-size:0.8rem;padding:0.5rem 0.85rem;opacity:0.85;" disabled>CLOSED — request grant</button>';
  }

  async function onRun(pack) {
    var input = readInput(pack);
    if (/^[A-Z][a-z]+ [A-Z]/.test(input.seat)) {
      alert("Use a de-identified seat id. No named-minor PII.");
      return;
    }
    var out = typeof pack.run === "function" ? pack.run(input, pack) : runWaitStub(input, pack);
    var receipt = await sha256Hex([pack.id, input.seat, input.role, out.flag || "", Date.now().toString().slice(0, 10)].join("|"));
    try {
      localStorage.setItem("dc.alacarte.lastReceipt", JSON.stringify({ pack: pack.id, input: input, out: out, receipt: receipt, seatMode: getSeatMode() }));
    } catch (e) {}
    paintResult($("resultBox"), out, receipt);
    var st = $("pipeStatus");
    if (st) {
      st.textContent = out.wait
        ? "WAIT_METERS · UI only"
        : (input.tape_present ? "measured_tape path · household" : "literature prior · tape_present false · household");
    }
  }

  async function onModelUnits(pack) {
    var mode = "full";
    var active = document.querySelector(".org-model-btn[style*='accent-cyan']");
    var btns = document.querySelectorAll(".org-model-btn");
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].style.borderColor && btns[i].style.borderColor.indexOf("cyan") !== -1) {
        mode = btns[i].getAttribute("data-mode") || "full";
        break;
      }
      if (btns[i].getAttribute("data-active") === "1") {
        mode = btns[i].getAttribute("data-mode") || "full";
        break;
      }
    }
    // Prefer data-active marker
    for (var j = 0; j < btns.length; j++) {
      if (btns[j].getAttribute("data-active") === "1") {
        mode = btns[j].getAttribute("data-mode") || "full";
        break;
      }
    }
    void active;
    var out = runHockeyTeamGrain(mode, pack);
    var receipt = await sha256Hex([pack.id, "TEAM", mode, out.flag || "", Date.now().toString().slice(0, 10)].join("|"));
    try {
      localStorage.setItem("dc.alacarte.lastReceipt", JSON.stringify({ pack: pack.id, seatMode: "org", modelMode: mode, out: out, receipt: receipt }));
    } catch (e) {}
    paintResult($("orgResultBox"), out, receipt);
    var st = $("pipeStatus");
    if (st) st.textContent = "org · team-grain · model=" + mode + " · " + (out.evidence || "");
  }

  function wireSeatToggle(pack) {
    function go(mode) {
      setSeatMode(mode);
      renderShell(pack.id);
    }
    if ($("btnSeatHousehold")) $("btnSeatHousehold").onclick = function () { go("household"); };
    if ($("btnSeatOrg")) $("btnSeatOrg").onclick = function () { go("org"); };
  }

  function wireHousehold(pack) {
    if ($("roleSelect")) $("roleSelect").onchange = function () { fillPriors(pack); };
    if ($("btnPriors")) $("btnPriors").onclick = function () { fillPriors(pack); };
    if ($("btnRun")) $("btnRun").onclick = function () { onRun(pack); };
    var chips = document.querySelectorAll(".dc-conn-chip");
    for (var i = 0; i < chips.length; i++) {
      chips[i].onclick = function (ev) {
        var btn = ev.currentTarget;
        var name = btn.getAttribute("data-conn") || "";
        var on = btn.textContent.indexOf("· on") === -1;
        // GameSheet stays conceptually on for never-paste messaging when toggled on
        btn.style.borderColor = on ? "var(--accent-mint)" : "";
        btn.style.color = on ? "var(--accent-mint)" : "";
        btn.style.opacity = on ? "1" : "0.55";
        btn.textContent = name + (on ? " · on" : " · off");
      };
    }
  }

  function wireOrg(pack) {
    var btns = document.querySelectorAll(".org-model-btn");
    function setMode(mode) {
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        var on = b.getAttribute("data-mode") === mode;
        b.setAttribute("data-active", on ? "1" : "0");
        b.style.borderColor = on ? "var(--accent-cyan)" : "";
        b.style.color = on ? "var(--text-primary)" : "";
      }
      var lines = $("orgLinesUi");
      if (lines) lines.style.display = mode === "lines" ? "block" : "none";
    }
    for (var i = 0; i < btns.length; i++) {
      btns[i].onclick = function (ev) {
        setMode(ev.currentTarget.getAttribute("data-mode") || "full");
      };
    }
    setMode("full");
    if ($("btnModelUnits")) $("btnModelUnits").onclick = function () { onModelUnits(pack); };
    if ($("btnOrgTravel")) {
      $("btnOrgTravel").onclick = function () {
        var row = $("orgTravelRow");
        if (!row) return;
        var open = row.style.display === "none" || !row.style.display;
        row.style.display = open ? "block" : "none";
        $("btnOrgTravel").textContent = open ? "Travel · optional for org ▴" : "Travel · optional for org ▾";
      };
    }
  }

  function wire(pack, seatMode) {
    if (pack.seatModes) {
      wireSeatToggle(pack);
      if (seatMode === "org") wireOrg(pack);
      else wireHousehold(pack);
    } else {
      if ($("roleSelect")) $("roleSelect").onchange = function () { fillPriors(pack); };
      if ($("btnPriors")) $("btnPriors").onclick = function () { fillPriors(pack); };
      if ($("btnRun")) $("btnRun").onclick = function () { onRun(pack); };
    }
  }

  function boot() {
    renderShell(qsPack());
  }

  g.DCAlacarte = {
    PACKS: PACKS,
    LADDER: LADDER,
    renderShell: renderShell,
    qsPack: qsPack,
    getSeatMode: getSeatMode,
    setSeatMode: setSeatMode,
    runHockeyTeamGrain: runHockeyTeamGrain
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(typeof window !== "undefined" ? window : globalThis);
