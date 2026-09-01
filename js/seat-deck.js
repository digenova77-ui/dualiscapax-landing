/* DualisCapax seat deck — pictures first, words later.
   A card is not a signed deal. No org names on shallow faces. */
(function (root) {
  "use strict";

  var ART = "brand/deck/";

  var DECKS = {
    root: {
      depth: 0,
      back: null,
      cards: [
        { id: "nation", keyword: "Nation", art: "nation.jpg", next: "nation" },
        { id: "province", keyword: "Province", art: "province.jpg", next: "province" },
        { id: "corp", keyword: "Employer", art: "plant.jpg", next: "corp" },
        { id: "street", keyword: "Street", art: "street.jpg", next: "street" }
      ]
    },
    nation: {
      depth: 1,
      back: "root",
      cards: [
        { id: "canada", keyword: "Canada", art: "nation.jpg", next: "nation-sector" }
      ]
    },
    "nation-sector": {
      depth: 2,
      back: "nation",
      cards: [
        { id: "treasury", keyword: "Treasury", art: "bank.jpg", next: "desk-treasury" },
        { id: "nat-health", keyword: "Health", art: "prov-sector.jpg", next: "desk-nat-health" },
        { id: "defence", keyword: "Defence", art: "nation-sector.jpg", next: "desk-defence" },
        { id: "roads", keyword: "Roads", art: "city.jpg", next: "desk-roads" },
        { id: "crown", keyword: "National desk", art: "nation-sector.jpg", next: "desk-crown" }
      ]
    },
    province: {
      depth: 1,
      back: "root",
      cards: [
        { id: "ontario", keyword: "Ontario", art: "province.jpg", next: "prov-sector" },
        { id: "other-prov", keyword: "Other provinces", art: "provinces.jpg", next: "desk-other-prov" }
      ]
    },
    "prov-sector": {
      depth: 2,
      back: "province",
      cards: [
        { id: "school", keyword: "School", art: "school.jpg", next: "desk-school" },
        { id: "hospital", keyword: "Hospital", art: "prov-sector.jpg", next: "desk-hospital" },
        { id: "grid", keyword: "Grid", art: "prov-sector.jpg", next: "desk-grid" },
        { id: "city", keyword: "City desk", art: "city.jpg", next: "desk-city" }
      ]
    },
    corp: {
      depth: 1,
      back: "root",
      cards: [
        { id: "bank", keyword: "Bank", art: "bank.jpg", next: "desk-bank" },
        { id: "pharma", keyword: "Pharma", art: "pharma.jpg", next: "desk-pharma" },
        { id: "plant", keyword: "Plant", art: "plant.jpg", next: "desk-plant" },
        { id: "tech", keyword: "High tech", art: "tech.jpg", next: "desk-tech" }
      ]
    },
    street: {
      depth: 1,
      back: "root",
      cards: [
        { id: "shop", keyword: "Shop", art: "shop.jpg", next: "desk-shop" },
        { id: "house", keyword: "Household", art: "street.jpg", next: "desk-house" },
        { id: "club", keyword: "Club", art: "school.jpg", next: "desk-club" },
        { id: "gift", keyword: "Gift seat", art: "street.jpg", next: "desk-gift" }
      ]
    }
  };

  var DESKS = {
    "desk-treasury": { keyword: "Treasury", art: "bank.jpg", story: "This is the national till. Tax credits, transfers, and procurement all pass through here. DualisCapax measures leak on the books the treasury already keeps — duplicate payments, idle contracts, programs that spend without a result you can point to. Recovered dollars go back into the programs people actually use. If the figure will not stand on that sheet, nothing is owed." },
    "desk-nat-health": { keyword: "Health", art: "prov-sector.jpg", story: "The public already paid for care. A lot of that money lands in paperwork, unused block time, and patients who bounce back because the discharge never finished. We count those leftovers on the hospital or ministry sheet you already file. We do not diagnose anyone. Savings belong back in beds, homecare hours, and staff who can stay on the floor." },
    "desk-defence": { keyword: "Defence", art: "nation-sector.jpg", story: "A workshop, a parts cage, a long watch. Fuel, overtime, and spares disappear the same way they do in a city yard — quietly, on a line item nobody reads twice. Bring the maintenance log you already keep. One figure you can read out loud. If it holds, the money goes back into readiness, not a speech. We will not invent a contract we do not have." },
    "desk-roads": { keyword: "Roads", art: "city.jpg", story: "Crews idle, pavement that fails early, snow routes that run twice because the first pass was booked wrong. That waste is already in this year's levy. Write the number down before another season is spent. Recovered dollars belong in the next kilometre, the next bus, the next repair that actually happens." },
    "desk-crown": { keyword: "National desk", art: "nation-sector.jpg", story: "This desk holds the rooms under it: health transfers, infrastructure, defence, benefits. If the national books cannot show a leak, the rooms below do not pretend they can. Start here only if you can bring a sheet the country already files." },
    "desk-other-prov": { keyword: "Other provinces", art: "provinces.jpg", story: "Ontario is first because this house lives here. Every other province runs the same kind of desk — health, schools, housing, hydro. A card here is a map, not a signed plaque on a legislature wall." },
    "desk-school": { keyword: "School", art: "school.jpg", story: "Overtime, empty classrooms, heat in July, buses that run half full. A board already pays for that leftover. Bring the export the business office already files. The file stays on this device. If we find hours, they go back to students and the people who teach them." },
    "desk-hospital": { keyword: "Hospital", art: "prov-sector.jpg", story: "A blocked bed, a bounce-back admission, a night shift spent on forms. We count leftover time and leftover dollars on the record this hospital already keeps. We do not treat a patient and we do not claim a clinical result. If the number holds, the savings belong on the ward, not in a slogan." },
    "desk-grid": { keyword: "Grid", art: "prov-sector.jpg", story: "Peak hours, idle plant, heat lost on the line. Name the waste in the dollars ratepayers already send. Recovered money belongs in reliability and in bills that stop climbing for no reason you can see. If the figure will not hold, we stop." },
    "desk-city": { keyword: "City desk", art: "city.jpg", story: "This is the room that spends under the province: housing lists, shelters, plows, rec centres, welfare intake at the counter. One leak. One bill. The books stay in the city. Savings go back to the street that paid them." },
    "desk-bank": { keyword: "Bank", art: "bank.jpg", story: "Branches, payment systems, idle software, benefits that move through a ledger before they reach a family. Count the drip on the institution's own books. DualisCapax does not take the book home. If money is recovered, it should lower the cost of the service, not vanish into a new product name." },
    "desk-pharma": { keyword: "Pharma", art: "pharma.jpg", story: "A plant line, a cold chain, trial operations. Time and heat leave like water. Measure the operations line. This is not a drug claim and not a diagnosis. Recovered minutes belong in the work the floor already does." },
    "desk-plant": { keyword: "Plant", art: "plant.jpg", story: "A shift, scrap, heat, a line that waits on a part. The leftover is already in the year. Bring the sheet the floor already keeps. If the number holds, the savings go back into the people and the machines that still have to run tomorrow." },
    "desk-tech": { keyword: "High tech", art: "tech.jpg", story: "Idle cloud, licenses nobody uses, desk time lost to tools that do not talk to each other. The bill is already there. If the number holds, you can buy prepaid minutes. If it does not, stop." },
    "desk-shop": { keyword: "Shop", art: "shop.jpg", story: "A small till, a light left on, a delivery that comes twice. Same rule as a ministry: measure the leak on the book you already keep. The sheet stays on this counter. Savings stay in the shop and the street around it." },
    "desk-house": { keyword: "Household", art: "street.jpg", story: "A kitchen table, a benefit letter, a utility bill, a clawback. Count one leak. You do not need to speak like an agency. Other households keep their own books. If we find money, it belongs back in that house." },
    "desk-club": { keyword: "Club", art: "school.jpg", story: "Ice time, lights, volunteer hours, a grant that never quite arrives. A club is a small public desk. Measure first. Recovered hours go back to the kids and the volunteers who already showed up." },
    "desk-gift": { keyword: "Gift seat", art: "street.jpg", story: "A gift is prepaid time so someone else can run their sheet. It is not a share and not a coin. Names go up after a completed join, not before." }
  };

  function el(sel, rootEl) {
    return (rootEl || document).querySelector(sel);
  }

  function paintCards(mount, deckId) {
    var deck = DECKS[deckId];
    if (!mount || !deck) return;
    mount.setAttribute("data-depth", String(deck.depth));
    var html = "";
    if (deck.back) {
      html += '<button class="seat-back" type="button" data-back="' + deck.back + '">Back</button>';
    }
    html += '<div class="seat-row">';
    deck.cards.forEach(function (card) {
      html +=
        '<button class="seat-card" type="button" data-next="' + card.next + '">' +
          '<span class="seat-art" style="background-image:url(\'' + ART + card.art + '\')"></span>' +
          '<span class="seat-word">' + card.keyword + "</span>" +
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
    if (art) art.style.backgroundImage = "url('" + ART + desk.art + "')";
    if (word) word.textContent = desk.keyword;
    if (story) story.textContent = desk.story;
    if (root.DCTheme && DCTheme.apply) DCTheme.apply(deskId, desk);
    try {
      localStorage.setItem("dc.seat.desk", JSON.stringify({ id: deskId, keyword: desk.keyword, ts: new Date().toISOString() }));
    } catch (e) {}
  }

  function go(deckId, table, deep) {
    if (DECKS[deckId]) {
      if (deep) deep.hidden = true;
      paintCards(table, deckId);
      history.replaceState(null, "", "#d=" + deckId);
      return;
    }
    if (DESKS[deckId]) {
      paintDesk(deep, deckId, deep);
      history.replaceState(null, "", "#d=" + deckId);
    }
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
      if (back) {
        go(back.getAttribute("data-back"), table, deep);
        return;
      }
      var card = ev.target.closest("[data-next]");
      if (card) go(card.getAttribute("data-next"), table, deep);
    });
  }

  root.DCSeatDeck = { boot: boot, decks: DECKS, desks: DESKS };
})(window);
