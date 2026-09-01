/* DualisCapax seat deck — pictures first, words later.
   Targeted is not signed. No org names on shallow faces. */
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
        { id: "corp", keyword: "Major house", art: "plant.jpg", next: "corp" },
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
        { id: "crown", keyword: "Crown desk", art: "nation-sector.jpg", next: "desk-crown" }
      ]
    },
    province: {
      depth: 1,
      back: "root",
      cards: [
        { id: "ontario", keyword: "Ontario", art: "province.jpg", next: "prov-sector" },
        { id: "other-prov", keyword: "Other rooms", art: "provinces.jpg", next: "desk-other-prov" }
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
    "desk-treasury": { keyword: "Treasury", art: "bank.jpg", story: "A country till leaks the way a pipe leaks. Count the drip on the books you already keep. If the number will not walk back to a line, nothing is owed." },
    "desk-nat-health": { keyword: "Health", art: "prov-sector.jpg", story: "The public already paid. The leftover is already a cost. We measure the line. We do not invent a diagnosis. Simulation is not treatment." },
    "desk-defence": { keyword: "Defence", art: "nation-sector.jpg", story: "A long watch burns time, fuel, and parts. One leak. One figure you can read out loud. Bind only if it inverts." },
    "desk-roads": { keyword: "Roads", art: "city.jpg", story: "Pavement, delays, empty crews. The waste is already in the year. Write the figure down before another season is spent." },
    "desk-crown": { keyword: "Crown desk", art: "nation-sector.jpg", story: "A crown desk holds the rooms below it. If the country cannot sit, the rooms do not pretend they can." },
    "desk-other-prov": { keyword: "Other rooms", art: "provinces.jpg", story: "Ontario is the first room because this house lives here. Other provinces use the same step. A card here is a map, not a signed plaque." },
    "desk-school": { keyword: "School", art: "school.jpg", story: "Overtime, empty rooms, heat, buses. A board already pays for the leftover. Bring the sheet you already file. The book stays on this device." },
    "desk-hospital": { keyword: "Hospital", art: "prov-sector.jpg", story: "A shift, a bed that cannot move, a bounce-back stay. We count leftover. We do not treat a patient. The record stays with the desk." },
    "desk-grid": { keyword: "Grid", art: "prov-sector.jpg", story: "Peak hours and idle plant. Name the waste in dollars you already pay. If the figure will not invert, the door closes clean." },
    "desk-city": { keyword: "City desk", art: "city.jpg", story: "A city desk is the room that spends under the province. One leak. One bill. The books stay in the city." },
    "desk-bank": { keyword: "Bank", art: "bank.jpg", story: "Till leak, branch energy, payment waste. A house of money already knows the drip. Count it on their own ledger. Dualis does not take the book home." },
    "desk-pharma": { keyword: "Pharma", art: "pharma.jpg", story: "Plant line, cold chain, trial ops. Time and heat leave like water. Measure the line. Not a drug. Not a diagnosis." },
    "desk-plant": { keyword: "Plant", art: "plant.jpg", story: "A shift, scrap, heat. The leftover is already in the year. Bring the sheet the floor already keeps." },
    "desk-tech": { keyword: "High tech", art: "tech.jpg", story: "Idle cloud, license waste, desk time. The bill is already there. If the number holds, prepaid minutes. If it does not, stop." },
    "desk-shop": { keyword: "Shop", art: "shop.jpg", story: "A small till and a light left on. Same invert rule as a ministry. The sheet stays on this counter." },
    "desk-house": { keyword: "Household", art: "street.jpg", story: "A kitchen table and a bill. Count one leak. Other people pay their own seat." },
    "desk-club": { keyword: "Club", art: "school.jpg", story: "Ice time, lights, volunteer hours. A club is a small public desk. Measure first." },
    "desk-gift": { keyword: "Gift seat", art: "street.jpg", story: "A gift is prepaid time for the work, not a share. Names go up after a completed join." }
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
