/* DualisCapax seat deck — one hall, one access level.
   Country → room that spends → the line on that sheet → this device.
   Five pillars. Gift is the one quiet card. A card is not a signed deal. */
(function (root) {
  "use strict";

  function lines(back, kind, rows) {
    return {
      depth: 3,
      back: back,
      cards: rows.map(function (row) {
        return {
          id: row[0],
          keyword: row[1],
          kind: kind,
          ribbon: row[2],
          hint: row[3],
          next: row[4]
        };
      })
    };
  }

  var DECKS = {
    root: { depth: 0, back: null, cards: [
      { id: "nation", keyword: "Nation", kind: "nation", ribbon: "Public books", hint: "Treasury, health, defence, roads", next: "nation" },
      { id: "province", keyword: "Province", kind: "province", ribbon: "Public books", hint: "Schools, hospitals, the grid, city hall", next: "province" },
      { id: "corp", keyword: "Employer", kind: "employer", ribbon: "Payroll", hint: "Banks, plants, labs, software shops", next: "corp" },
      { id: "street", keyword: "Street", kind: "street", ribbon: "Local", hint: "Shop, household, club, one gift", next: "street" }
    ]},
    nation: { depth: 1, back: "root", cards: [
      { id: "canada", keyword: "Canada", kind: "nation", ribbon: "Federal", hint: "The national books", next: "nation-sector" }
    ]},
    "nation-sector": { depth: 2, back: "nation", cards: [
      { id: "treasury", keyword: "Treasury", kind: "nation", ribbon: "Finance", hint: "Transfers and buying", next: "work-treasury" },
      { id: "nat-health", keyword: "Health", kind: "nation", ribbon: "Care", hint: "Beds, paperwork, wait lists", next: "work-nat-health" },
      { id: "defence", keyword: "Defence", kind: "nation", ribbon: "Ready", hint: "Workshops, parts, stores", next: "work-defence" },
      { id: "roads", keyword: "Roads", kind: "nation", ribbon: "Works", hint: "Crews, pavement, buses", next: "work-roads" },
      { id: "crown", keyword: "National desk", kind: "nation", ribbon: "Capital", hint: "The rooms under Ottawa", next: "work-crown" }
    ]},
    province: { depth: 1, back: "root", cards: [
      { id: "ontario", keyword: "Ontario", kind: "province", ribbon: "Province", hint: "This house lives here", next: "prov-sector" },
      { id: "other-prov", keyword: "Other provinces", kind: "province", ribbon: "Map", hint: "Same desks, other capitals", next: "work-other-prov" }
    ]},
    "prov-sector": { depth: 2, back: "province", cards: [
      { id: "school", keyword: "School", kind: "province", ribbon: "Board", hint: "Overtime, buses, empty rooms", next: "work-school" },
      { id: "hospital", keyword: "Hospital", kind: "province", ribbon: "Ward", hint: "Blocked beds, night forms", next: "work-hospital" },
      { id: "grid", keyword: "Grid", kind: "province", ribbon: "Power", hint: "Peak hours, idle plant", next: "work-grid" },
      { id: "city", keyword: "City desk", kind: "province", ribbon: "City", hint: "Housing, plows, intake", next: "work-city" }
    ]},
    corp: { depth: 1, back: "root", cards: [
      { id: "bank", keyword: "Bank", kind: "employer", ribbon: "Ledger", hint: "Payroll and payments", next: "work-bank" },
      { id: "pharma", keyword: "Pharma", kind: "employer", ribbon: "Plant", hint: "Line time and cold chain", next: "work-pharma" },
      { id: "plant", keyword: "Plant", kind: "employer", ribbon: "Floor", hint: "Shift, scrap, heat", next: "work-plant" },
      { id: "tech", keyword: "High tech", kind: "employer", ribbon: "Bill", hint: "Cloud and unused licenses", next: "work-tech" }
    ]},
    street: { depth: 1, back: "root", cards: [
      { id: "shop", keyword: "Shop", kind: "street", ribbon: "Till", hint: "A counter and a light bill", next: "work-shop" },
      { id: "house", keyword: "Household", kind: "street", ribbon: "Kitchen", hint: "A letter, a bill, a clawback", next: "work-house" },
      { id: "club", keyword: "Club", kind: "street", ribbon: "Rink", hint: "Ice time and volunteer hours", next: "work-club" },
      { id: "gift", keyword: "Gift", kind: "gift", ribbon: "Quiet card", hint: "Time given so another desk can open", next: "work-gift" }
    ]},
    "work-treasury": lines("nation-sector", "nation", [
      ["tr-transfer", "Transfers", "Line", "Money already voted, moving twice", "desk-treasury"],
      ["tr-buy", "Buying", "Line", "The same order paid more than once", "desk-treasury"],
      ["tr-credit", "Credits", "Line", "A credit that never reached the street", "desk-treasury"],
      ["tr-device", "This device", "Door", "The sheet stays here. Same door as every desk.", "desk-treasury"]
    ]),
    "work-nat-health": lines("nation-sector", "nation", [
      ["nh-beds", "Beds", "Line", "A bed held by paperwork, not a patient", "desk-nat-health"],
      ["nh-forms", "Paperwork", "Line", "Night hours spent on forms", "desk-nat-health"],
      ["nh-wait", "Wait lists", "Line", "Time already paid for, still in a queue", "desk-nat-health"],
      ["nh-device", "This device", "Door", "No diagnosis. The export stays on this machine.", "desk-nat-health"]
    ]),
    "work-defence": lines("nation-sector", "nation", [
      ["df-shop", "Workshops", "Line", "A crew waiting on a part in the wrong cage", "desk-defence"],
      ["df-parts", "Parts", "Line", "The same spare on two purchase orders", "desk-defence"],
      ["df-stores", "Stores", "Line", "Stock that sat while a rush fee ran", "desk-defence"],
      ["df-device", "This device", "Door", "Bring the maintenance log you already keep.", "desk-defence"]
    ]),
    "work-roads": lines("nation-sector", "nation", [
      ["rd-crew", "Crews", "Line", "Hours standing by for a job that already paid", "desk-roads"],
      ["rd-pave", "Pavement", "Line", "A stretch that failed early", "desk-roads"],
      ["rd-bus", "Buses", "Line", "A route that ran twice for one load", "desk-roads"],
      ["rd-device", "This device", "Door", "Recovered dollars belong in the next kilometre.", "desk-roads"]
    ]),
    "work-crown": lines("nation-sector", "nation", [
      ["cr-move", "Transfers", "Line", "A transfer the receiving desk cannot add", "desk-crown"],
      ["cr-works", "Works", "Line", "A project paid, then paid to wait", "desk-crown"],
      ["cr-ben", "Benefits", "Line", "A payment that stalled in a vendor account", "desk-crown"],
      ["cr-device", "This device", "Door", "Start only with a sheet the country already files.", "desk-crown"]
    ]),
    "work-other-prov": lines("province", "province", [
      ["op-same", "Same desks", "Map", "School, hospital, grid, city — same shape", "desk-other-prov"],
      ["op-cap", "Other capitals", "Map", "Ontario is first because this house lives here", "desk-other-prov"],
      ["op-card", "A card only", "Map", "Not a signed plaque in another province", "desk-other-prov"],
      ["op-device", "This device", "Door", "The books would stay on that province's machine.", "desk-other-prov"]
    ]),
    "work-school": lines("prov-sector", "province", [
      ["sc-ot", "Overtime", "Line", "Hours that should have been a posted shift", "desk-school"],
      ["sc-bus", "Buses", "Line", "A run that left half empty", "desk-school"],
      ["sc-room", "Rooms", "Line", "Heat in a room nobody used", "desk-school"],
      ["sc-device", "This device", "Door", "Bring the export the business office already files.", "desk-school"]
    ]),
    "work-hospital": lines("prov-sector", "province", [
      ["hp-bed", "Beds", "Line", "A blocked bed that is not a diagnosis", "desk-hospital"],
      ["hp-form", "Forms", "Line", "A night shift spent on intake twice", "desk-hospital"],
      ["hp-back", "Returns", "Line", "A bounce-back admission already in the file", "desk-hospital"],
      ["hp-device", "This device", "Door", "If the number holds, it belongs on the ward.", "desk-hospital"]
    ]),
    "work-grid": lines("prov-sector", "province", [
      ["gd-peak", "Peak hours", "Line", "Plant held hot for a peak that did not come", "desk-grid"],
      ["gd-idle", "Idle plant", "Line", "Capacity paid for and sitting", "desk-grid"],
      ["gd-line", "Lines", "Line", "Heat lost on a line you already own", "desk-grid"],
      ["gd-device", "This device", "Door", "Savings belong in reliability, not a speech.", "desk-grid"]
    ]),
    "work-city": lines("prov-sector", "province", [
      ["ct-house", "Housing", "Line", "A list that costs more than a key", "desk-city"],
      ["ct-plow", "Plows", "Line", "A route that covered the same block twice", "desk-city"],
      ["ct-in", "Intake", "Line", "A file opened, closed, opened again", "desk-city"],
      ["ct-device", "This device", "Door", "The books stay in the city.", "desk-city"]
    ]),
    "work-bank": lines("corp", "employer", [
      ["bk-pay", "Payroll", "Line", "Hours keyed twice before they reach a family", "desk-bank"],
      ["bk-paym", "Payments", "Line", "A fee on a payment that already had a receipt", "desk-bank"],
      ["bk-soft", "Software", "Line", "A license nobody signed into", "desk-bank"],
      ["bk-device", "This device", "Door", "DualisCapax does not take the book home.", "desk-bank"]
    ]),
    "work-pharma": lines("corp", "employer", [
      ["ph-line", "Line time", "Line", "A line waiting on a lot that already cleared", "desk-pharma"],
      ["ph-cold", "Cold chain", "Line", "Cooling paid while a door sat open", "desk-pharma"],
      ["ph-trial", "Trials", "Line", "Operations time — not a drug claim", "desk-pharma"],
      ["ph-device", "This device", "Door", "Measure the operations line. Not a diagnosis.", "desk-pharma"]
    ]),
    "work-plant": lines("corp", "employer", [
      ["pl-shift", "Shift", "Line", "A crew held for a part that was already in receiving", "desk-plant"],
      ["pl-scrap", "Scrap", "Line", "A run that had to be started twice", "desk-plant"],
      ["pl-heat", "Heat", "Line", "Energy spent on an idle bay", "desk-plant"],
      ["pl-device", "This device", "Door", "Bring the sheet the floor already keeps.", "desk-plant"]
    ]),
    "work-tech": lines("corp", "employer", [
      ["te-cloud", "Cloud", "Line", "Instances left on after the job ended", "desk-tech"],
      ["te-lic", "Licenses", "Line", "Seats paid, never opened", "desk-tech"],
      ["te-desk", "Desk time", "Line", "Tools that do not talk to each other", "desk-tech"],
      ["te-device", "This device", "Door", "If the number does not hold, stop.", "desk-tech"]
    ]),
    "work-shop": lines("street", "street", [
      ["sh-till", "Till", "Line", "A double entry on a small counter", "desk-shop"],
      ["sh-light", "Lights", "Line", "A light left on after close", "desk-shop"],
      ["sh-del", "Deliveries", "Line", "The same order arriving twice", "desk-shop"],
      ["sh-device", "This device", "Door", "Same rule as a ministry. The sheet stays here.", "desk-shop"]
    ]),
    "work-house": lines("street", "street", [
      ["ho-letter", "Letters", "Line", "A benefit letter that does not match the deposit", "desk-house"],
      ["ho-bill", "Bills", "Line", "A utility line you already paid", "desk-house"],
      ["ho-claw", "Clawbacks", "Line", "Money taken back that should have stayed", "desk-house"],
      ["ho-device", "This device", "Door", "You do not need to speak like an agency.", "desk-house"]
    ]),
    "work-club": lines("street", "street", [
      ["cl-ice", "Ice time", "Line", "Hours booked, then billed, then empty", "desk-club"],
      ["cl-vol", "Volunteers", "Line", "Time given that never hit the books", "desk-club"],
      ["cl-grant", "Grants", "Line", "A grant that sat one desk over", "desk-club"],
      ["cl-device", "This device", "Door", "Recovered hours go back to the people who showed up.", "desk-club"]
    ]),
    "work-gift": lines("street", "gift", [
      ["gf-time", "Time", "Quiet", "Prepaid minutes so another desk can open", "desk-gift"],
      ["gf-desk", "Another desk", "Quiet", "You do not have to sit in the chair to help the chair", "desk-gift"],
      ["gf-not", "Not a share", "Quiet", "Not a coin. Not a contract with a ministry.", "desk-gift"],
      ["gf-device", "This device", "Door", "A gift still uses the same door.", "desk-gift"]
    ])
  };

  var DESKS = {
    "desk-treasury": { keyword: "Treasury", kind: "nation", story: "This is the national till. Transfers, buying, and credits already pass through here. Measure leak on the books the treasury already keeps. If money comes back, it goes back into the programs people use. If the figure will not stand on that sheet, nothing is owed." },
    "desk-nat-health": { keyword: "Health", kind: "nation", story: "The public already paid for care. A lot of that money lands in paperwork and unused block time. Count leftovers on the sheet you already file. We do not diagnose anyone. Savings belong back in beds and staff who can stay on the floor." },
    "desk-defence": { keyword: "Defence", kind: "nation", story: "A workshop, a parts cage, a long watch. Overtime and spares disappear on a line nobody reads twice. Bring the maintenance log you already keep. If the figure holds, the money goes back into readiness, not a speech." },
    "desk-roads": { keyword: "Roads", kind: "nation", story: "Crews idle, pavement that fails early, routes that run twice. That waste is already in this year's levy. Recovered dollars belong in the next kilometre and the next bus." },
    "desk-crown": { keyword: "National desk", kind: "nation", story: "This desk holds the rooms under it. Start here only if you can bring a sheet the country already files. A card is not a signed deal." },
    "desk-other-prov": { keyword: "Other provinces", kind: "province", story: "Ontario is first because this house lives here. Every other province runs the same kind of desk. A card here is a map, not a signed plaque." },
    "desk-school": { keyword: "School", kind: "province", story: "Overtime, empty classrooms, heat in July, buses that run half full. Bring the export the business office already files. If we find hours, they go back to students and the people who teach them." },
    "desk-hospital": { keyword: "Hospital", kind: "province", story: "A blocked bed, a bounce-back admission, a night shift spent on forms. We do not treat a patient. If the number holds, the savings belong on the ward." },
    "desk-grid": { keyword: "Grid", kind: "province", story: "Peak hours, idle plant, heat lost on the line. Recovered money belongs in reliability and in bills that stop climbing for no reason you can see." },
    "desk-city": { keyword: "City desk", kind: "province", story: "Housing lists, shelters, plows, rec centres, intake at the counter. The books stay in the city. Savings go back to the street that paid them." },
    "desk-bank": { keyword: "Bank", kind: "employer", story: "Payroll, payments, idle software. Count the drip on the institution's own books. DualisCapax does not take the book home." },
    "desk-pharma": { keyword: "Pharma", kind: "employer", story: "A plant line, a cold chain, trial operations. Measure the operations line. This is not a drug claim and not a diagnosis." },
    "desk-plant": { keyword: "Plant", kind: "employer", story: "A shift, scrap, heat, a line that waits on a part. Bring the sheet the floor already keeps. Savings go back into the people and the machines that still have to run tomorrow." },
    "desk-tech": { keyword: "High tech", kind: "employer", story: "Idle cloud, licenses nobody uses, desk time lost to tools that do not talk to each other. If the number holds, you can buy prepaid minutes. If it does not, stop." },
    "desk-shop": { keyword: "Shop", kind: "street", story: "A small till, a light left on, a delivery that comes twice. Same rule as a ministry. The sheet stays on this counter." },
    "desk-house": { keyword: "Household", kind: "street", story: "A kitchen table, a benefit letter, a utility bill, a clawback. You do not need to speak like an agency. If we find money, it belongs back in that house." },
    "desk-club": { keyword: "Club", kind: "street", story: "Ice time, lights, volunteer hours, a grant that never quite arrives. Recovered hours go back to the kids and the volunteers who already showed up." },
    "desk-gift": { keyword: "Gift", kind: "gift", story: "This is the one quiet idea on the table. A gift is prepaid time so another desk can open its books. You do not have to sit in the chair to help the chair. It is not a share and not a coin." }
  };

  function el(sel, rootEl) { return (rootEl || document).querySelector(sel); }
  function hall() {
    return '<span class="sky"></span><span class="glow"></span><span class="hall"><i class="p"></i><i class="p"></i><i class="p"></i><i class="p"></i><i class="p"></i></span>';
  }
  function restTalk() {
    return "Same hall. Same door. A card is not a signed deal.";
  }
  function speak(mount, card) {
    var talk = el(".seat-talk", mount);
    if (!talk) return;
    var word = card.querySelector(".seat-word");
    var hint = card.querySelector(".seat-hint");
    var w = word ? word.textContent : "";
    var h = hint ? hint.textContent : "";
    talk.textContent = w && h ? w + " — " + h : restTalk();
  }

  function paintCards(mount, deckId) {
    var deck = DECKS[deckId];
    if (!mount || !deck) return;
    mount.setAttribute("data-depth", String(deck.depth));
    var html = "";
    if (deck.back) html += '<button class="seat-back" type="button" data-back="' + deck.back + '">Back</button>';
    html += '<div class="seat-row">';
    deck.cards.forEach(function (card, i) {
      var kind = card.kind || "nation";
      html += '<button class="seat-card" type="button" data-next="' + card.next + '" data-kind="' + kind + '" style="--i:' + i + '">' +
        (card.ribbon ? '<span class="seat-ribbon">' + card.ribbon + "</span>" : "") +
        '<span class="seat-art">' + hall() + "</span>" +
        '<span class="seat-word">' + card.keyword + "</span>" +
        (card.hint ? '<span class="seat-hint">' + card.hint + "</span>" : "") +
      "</button>";
    });
    html += "</div><p class=\"seat-talk\" aria-live=\"polite\">" + restTalk() + "</p>";
    mount.innerHTML = html;
    if (root.DCTheme && DCTheme.apply) DCTheme.apply(deckId, { keyword: deckId });
  }

  function paintDesk(mount, deskId, deep) {
    var desk = DESKS[deskId];
    if (!mount || !desk) return;
    mount.hidden = false;
    if (deep) deep.hidden = false;
    var art = el(".seat-deep-art", mount);
    var word = el(".seat-deep-word", mount);
    var story = el(".seat-deep-story", mount);
    var kind = desk.kind || "nation";
    if (art) { art.setAttribute("data-kind", kind); art.innerHTML = hall(); }
    if (word) word.textContent = desk.keyword;
    if (story) story.textContent = desk.story;
    if (root.DCTheme && DCTheme.apply) DCTheme.apply(deskId, desk);
    try { localStorage.setItem("dc.seat.desk", JSON.stringify({ id: deskId, keyword: desk.keyword, ts: new Date().toISOString() })); } catch (e) {}
  }

  function go(deckId, table, deep) {
    if (DECKS[deckId]) { if (deep) deep.hidden = true; paintCards(table, deckId); history.replaceState(null, "", "#d=" + deckId); return; }
    if (DESKS[deckId]) { paintDesk(deep, deckId, deep); history.replaceState(null, "", "#d=" + deckId); }
  }

  function boot(opts) {
    var table = el(opts.table || "#seat-table");
    var deep = el(opts.deep || "#seat-deep");
    if (!table) return;
    var start = "root";
    var hash = (location.hash || "").replace(/^#/, "");
    if (hash.indexOf("d=") === 0) start = hash.slice(2);
    if (DECKS[start] || DESKS[start]) go(start, table, deep);
    else go("root", table, deep);
    table.addEventListener("click", function (ev) {
      var back = ev.target.closest("[data-back]");
      if (back) { go(back.getAttribute("data-back"), table, deep); return; }
      var card = ev.target.closest("[data-next]");
      if (card) go(card.getAttribute("data-next"), table, deep);
    });
    table.addEventListener("pointerover", function (ev) {
      var card = ev.target.closest(".seat-card");
      if (card) speak(table, card);
    });
    table.addEventListener("focusin", function (ev) {
      var card = ev.target.closest(".seat-card");
      if (card) speak(table, card);
    });
    table.addEventListener("pointerout", function (ev) {
      if (!table.contains(ev.relatedTarget)) {
        var talk = el(".seat-talk", table);
        if (talk) talk.textContent = restTalk();
      }
    });
  }

  root.DCSeatDeck = { boot: boot, decks: DECKS, desks: DESKS };
})(window);
