/* DualisCapax seat deck — civic hall under a night sky.
   Five pillars. Government and business first.
   Gift is the one quiet philosophical card. A card is not a signed deal. */
(function (root) {
  "use strict";
  var ART = "brand/deck/";
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
      { id: "treasury", keyword: "Treasury", kind: "nation", ribbon: "Finance", hint: "Transfers and procurement", next: "desk-treasury" },
      { id: "nat-health", keyword: "Health", kind: "nation", ribbon: "Care", hint: "Beds, paperwork, wait lists", next: "desk-nat-health" },
      { id: "defence", keyword: "Defence", kind: "nation", ribbon: "Ready", hint: "Workshops, parts, fuel", next: "desk-defence" },
      { id: "roads", keyword: "Roads", kind: "nation", ribbon: "Works", hint: "Crews, pavement, buses", next: "desk-roads" },
      { id: "crown", keyword: "National desk", kind: "nation", ribbon: "Capital", hint: "The rooms under Ottawa", next: "desk-crown" }
    ]},
    province: { depth: 1, back: "root", cards: [
      { id: "ontario", keyword: "Ontario", kind: "province", ribbon: "Province", hint: "This house lives here", next: "prov-sector" },
      { id: "other-prov", keyword: "Other provinces", kind: "province", ribbon: "Map", hint: "Same desks, other capitals", next: "desk-other-prov" }
    ]},
    "prov-sector": { depth: 2, back: "province", cards: [
      { id: "school", keyword: "School", kind: "province", ribbon: "Board", hint: "Overtime, buses, empty rooms", next: "desk-school" },
      { id: "hospital", keyword: "Hospital", kind: "province", ribbon: "Ward", hint: "Blocked beds, night forms", next: "desk-hospital" },
      { id: "grid", keyword: "Grid", kind: "province", ribbon: "Power", hint: "Peak hours, idle plant", next: "desk-grid" },
      { id: "city", keyword: "City desk", kind: "province", ribbon: "City", hint: "Housing, plows, intake", next: "desk-city" }
    ]},
    corp: { depth: 1, back: "root", cards: [
      { id: "bank", keyword: "Bank", kind: "employer", ribbon: "Ledger", hint: "Payroll and payments", next: "desk-bank" },
      { id: "pharma", keyword: "Pharma", kind: "employer", ribbon: "Plant", hint: "Line time and cold chain", next: "desk-pharma" },
      { id: "plant", keyword: "Plant", kind: "employer", ribbon: "Floor", hint: "Shift, scrap, heat", next: "desk-plant" },
      { id: "tech", keyword: "High tech", kind: "employer", ribbon: "Bill", hint: "Cloud and unused licenses", next: "desk-tech" }
    ]},
    street: { depth: 1, back: "root", cards: [
      { id: "shop", keyword: "Shop", kind: "street", ribbon: "Till", hint: "A counter and a light bill", next: "desk-shop" },
      { id: "house", keyword: "Household", kind: "street", ribbon: "Kitchen", hint: "A letter, a bill, a clawback", next: "desk-house" },
      { id: "club", keyword: "Club", kind: "street", ribbon: "Rink", hint: "Ice time and volunteer hours", next: "desk-club" },
      { id: "gift", keyword: "Gift", kind: "gift", ribbon: "Philosophy", hint: "Time given so another desk can open", next: "desk-gift" }
    ]}
  };

  var DESKS = {
    "desk-treasury": { keyword: "Treasury", kind: "nation", story: "This is the national till. Tax credits, transfers, and procurement all pass through here. DualisCapax measures leak on the books the treasury already keeps. Recovered dollars go back into the programs people actually use. If the figure will not stand on that sheet, nothing is owed." },
    "desk-nat-health": { keyword: "Health", kind: "nation", story: "The public already paid for care. A lot of that money lands in paperwork and unused block time. We count leftovers on the sheet you already file. We do not diagnose anyone. Savings belong back in beds and staff who can stay on the floor." },
    "desk-defence": { keyword: "Defence", kind: "nation", story: "A workshop, a parts cage, a long watch. Fuel, overtime, and spares disappear on a line item nobody reads twice. Bring the maintenance log you already keep. If the figure holds, the money goes back into readiness, not a speech." },
    "desk-roads": { keyword: "Roads", kind: "nation", story: "Crews idle, pavement that fails early, snow routes that run twice. That waste is already in this year's levy. Recovered dollars belong in the next kilometre and the next bus." },
    "desk-crown": { keyword: "National desk", kind: "nation", story: "This desk holds the rooms under it: health transfers, infrastructure, defence, benefits. Start here only if you can bring a sheet the country already files." },
    "desk-other-prov": { keyword: "Other provinces", kind: "province", story: "Ontario is first because this house lives here. Every other province runs the same kind of desk. A card here is a map, not a signed plaque." },
    "desk-school": { keyword: "School", kind: "province", story: "Overtime, empty classrooms, heat in July, buses that run half full. Bring the export the business office already files. If we find hours, they go back to students and the people who teach them." },
    "desk-hospital": { keyword: "Hospital", kind: "province", story: "A blocked bed, a bounce-back admission, a night shift spent on forms. We do not treat a patient. If the number holds, the savings belong on the ward." },
    "desk-grid": { keyword: "Grid", kind: "province", story: "Peak hours, idle plant, heat lost on the line. Recovered money belongs in reliability and in bills that stop climbing for no reason you can see." },
    "desk-city": { keyword: "City desk", kind: "province", story: "Housing lists, shelters, plows, rec centres, welfare intake at the counter. The books stay in the city. Savings go back to the street that paid them." },
    "desk-bank": { keyword: "Bank", kind: "employer", story: "Branches, payment systems, idle software, benefits that move through a ledger before they reach a family. Count the drip on the institution's own books. DualisCapax does not take the book home." },
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
  function faceSrc(kind) { return ART + (kind === "gift" ? "five-pillars-gift.svg" : "five-pillars.svg"); }

  function paintCards(mount, deckId) {
    var deck = DECKS[deckId];
    if (!mount || !deck) return;
    mount.setAttribute("data-depth", String(deck.depth));
    var html = "";
    if (deck.back) html += '<button class="seat-back" type="button" data-back="' + deck.back + '">Back</button>';
    html += '<div class="seat-row">';
    deck.cards.forEach(function (card) {
      var kind = card.kind || "nation";
      html += '<button class="seat-card" type="button" data-next="' + card.next + '" data-kind="' + kind + '">' +
        (card.ribbon ? '<span class="seat-ribbon">' + card.ribbon + "</span>" : "") +
        '<span class="seat-art">' + hall() + "</span>" +
        '<span class="seat-word">' + card.keyword + "</span>" +
        (card.hint ? '<span class="seat-hint">' + card.hint + "</span>" : "") +
      "</button>";
    });
    html += "</div>";
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
  }

  root.DCSeatDeck = { boot: boot, decks: DECKS, desks: DESKS };
})(window);
