/**
 * Preemptive theme engine.
 * A targeted seat walks into a room that was already themed.
 * Theme is not a deal. Targeted is not signed. Plaques stay dark.
 * Current as of: 2026-09-01
 */
(function (g) {
  var VERSION = "theme-engine-v1-20260901";
  var STORE = "dc.theme.live.v1";

  var HOUSE = {
    ink: "#e8f1ff",
    glass: "#02040c",
    line: "rgba(158,197,255,.28)"
  };

  var CLASS = {
    nation:      { accent: "#9ec5ff", wash: "rgba(158,197,255,.16)", tone: "country" },
    province:    { accent: "#c9d7ff", wash: "rgba(201,215,255,.14)", tone: "province" },
    sector:      { accent: "#7fd4c8", wash: "rgba(127,212,200,.14)", tone: "room" },
    bank:        { accent: "#d4a017", wash: "rgba(212,160,23,.16)",  tone: "till" },
    pharma:      { accent: "#8fd0e8", wash: "rgba(143,208,232,.16)", tone: "line" },
    plant:       { accent: "#d4a017", wash: "rgba(212,160,23,.12)",  tone: "floor" },
    tech:        { accent: "#6ea8ff", wash: "rgba(110,168,255,.16)", tone: "desk" },
    street:      { accent: "#e2c27a", wash: "rgba(226,194,122,.12)", tone: "counter" }
  };

  var SEAT = {
    nation: "nation", canada: "nation",
    treasury: "bank", "nat-health": "sector", defence: "nation", roads: "sector", crown: "nation",
    province: "province", ontario: "province", "other-prov": "province",
    school: "sector", hospital: "sector", grid: "sector", city: "sector",
    bank: "bank", pharma: "pharma", plant: "plant", tech: "tech", corp: "plant",
    shop: "street", house: "street", club: "street", gift: "street", street: "street",
    "desk-treasury": "bank", "desk-nat-health": "sector", "desk-defence": "nation",
    "desk-roads": "sector", "desk-crown": "nation", "desk-other-prov": "province",
    "desk-school": "sector", "desk-hospital": "sector", "desk-grid": "sector", "desk-city": "sector",
    "desk-bank": "bank", "desk-pharma": "pharma", "desk-plant": "plant", "desk-tech": "tech",
    "desk-shop": "street", "desk-house": "street", "desk-club": "street", "desk-gift": "street"
  };

  var VOICE = {
    nation: "A country till leaks the way a pipe leaks. Count the drip on the books you already keep.",
    province: "Ontario is the first room because this house lives here. Other rooms use the same step.",
    sector: "The books stay with the desk. We measure leftover. We do not invent a diagnosis.",
    bank: "A house of money already knows the drip. Dualis does not take the book home.",
    pharma: "Plant line, cold chain, trial ops. Measure the line. Not a drug. Not a diagnosis.",
    plant: "A shift, scrap, heat. Bring the sheet the floor already keeps.",
    tech: "Idle cloud, license waste, desk time. If the number holds, prepaid minutes. If it does not, stop.",
    street: "A small till and a light left on. Same invert rule as a ministry."
  };

  function klass(id) {
    return SEAT[String(id || "")] || "street";
  }

  function packet(id, extra) {
    extra = extra || {};
    var k = klass(id);
    var skin = CLASS[k] || CLASS.street;
    return {
      v: VERSION,
      id: id || "visitor",
      class: k,
      keyword: extra.keyword || k,
      accent: skin.accent,
      wash: skin.wash,
      tone: skin.tone,
      voice: extra.story || VOICE[k],
      public_claim: false,
      signed: false,
      house_state: "HOUSE_SIGNED",
      counterparty: "UNBOUND",
      instruments: ["AGR-LOOK", "AGR-DATA-STAY", "AGR-BIND", "AGR-SEAT", "AGR-INVERT"],
      note: "Theme prepared ahead of time. Targeted is not a signed deal."
    };
  }

  function paint(node, theme) {
    if (!node || !theme) return;
    node.style.setProperty("--seat-accent", theme.accent);
    node.style.setProperty("--seat-wash", theme.wash);
    node.setAttribute("data-theme", theme.class);
    node.setAttribute("data-signed", "false");
  }

  function apply(id, extra) {
    var theme = packet(id, extra);
    try { localStorage.setItem(STORE, JSON.stringify(theme)); } catch (e) {}
    paint(document.documentElement, theme);
    paint(document.getElementById("seat-deep"), theme);
    return theme;
  }

  function current() {
    try {
      var raw = localStorage.getItem(STORE);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  g.DCTheme = {
    version: VERSION,
    house: HOUSE,
    packet: packet,
    apply: apply,
    current: current,
    klass: klass
  };
})(typeof window !== "undefined" ? window : globalThis);
