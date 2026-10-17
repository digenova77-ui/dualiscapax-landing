export const LINK = "Merit price is Unity through UniFi³. UniFi³ connects to eFuse.";

export function unifiCubed(unity) {
  if (typeof unity !== "number" || !Number.isFinite(unity)) return null;
  return unity * unity * unity;
}

function reading(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function align(input) {
  const src = input || {};
  const unity = reading(src.unity);
  const factor = src.unifi === undefined ? unity : reading(src.unifi);
  const meritPrice = reading(src.meritPrice);
  const efuse = reading(src.efuse);
  const cubed = unifiCubed(factor);
  const linked = cubed !== null
    && meritPrice === unity
    && meritPrice === cubed
    && efuse === cubed;
  const jouleRead = reading(src.joule) !== null;
  const aligned = linked && jouleRead;
  const open = aligned && unity === 1;
  let reason = "misaligned";
  if (linked && !jouleRead) reason = "joule-null";
  else if (linked && unity !== 1) reason = "not-one";
  else if (open) reason = "aligned";
  return {
    link: LINK,
    aligned,
    open,
    usage: open ? "admit" : "closed",
    joule: jouleRead ? src.joule : null,
    reason,
    chain: {
      meritPrice,
      unity,
      unifiCubed: cubed,
      efuse
    }
  };
}

export function published() {
  return align({ unity: null, unifi: null, meritPrice: null, efuse: null, joule: null });
}

export const OPEN_DECISION = { unity: 1, unifi: 1, meritPrice: 1, efuse: 1, joule: 1 };

function amountOf(amount) {
  if (typeof amount === "number" && Number.isFinite(amount)) return amount;
  if (typeof amount === "string" && /^(?:0|[1-9]\d*)$/.test(amount)) return Number(amount);
  return null;
}

export function quotePrice(input) {
  const src = input || {};
  const gate = src.decision === undefined ? published() : align(src.decision);
  const amount = amountOf(src.amount);
  const energy = gate.open === true ? gate.joule : null;
  if (amount === 0) {
    return { priced: true, charge: false, open: true, reason: "look", joule: gate.joule, energy: null, unit: "joule", amount: 0 };
  }
  if (gate.open !== true) {
    return { priced: false, charge: false, open: false, reason: gate.reason, joule: gate.joule, energy: null, unit: "joule", amount: amount };
  }
  if (amount === null || amount < 0) {
    return { priced: false, charge: false, open: true, reason: "no-amount", joule: gate.joule, energy: energy, unit: "joule", amount: null };
  }
  return { priced: true, charge: true, open: true, reason: "aligned", joule: gate.joule, energy: energy, unit: "joule", amount: amount };
}

export function energyCost(input) {
  const src = input || {};
  const gate = src.decision === undefined ? published() : align(src.decision);
  if (gate.joule === null || gate.open !== true) {
    return { unit: "joule", joule: gate.joule, cost: null, reason: gate.reason };
  }
  return { unit: "joule", joule: gate.joule, cost: gate.joule, reason: "aligned" };
}

export const SPLIT = Object.freeze({ drive: 81, fee: 10, room: 9, basis: 100 });
export const GATEWAYS = Object.freeze(["pay", "pricing", "fuel", "engine"]);

function sideOf(side) {
  if (side === undefined || side === "buy") return "buy";
  if (side === "sell") return "sell";
  return null;
}

export function meritExchange(input) {
  const src = input || {};
  const side = sideOf(src.side);
  const energy = energyCost(src);
  const offered = side !== null && energy.cost !== null;
  return {
    coin: "Merit",
    side: side,
    offered: offered,
    exchanged: false,
    open: offered,
    joule: energy.joule,
    energy: energy.cost,
    unit: "joule",
    merit: offered ? 1 : null,
    reason: side === null ? "no-side" : energy.reason,
    split: SPLIT
  };
}

export function pricingGateway(name, input) {
  if (!GATEWAYS.includes(name)) {
    return { gateway: null, coin: "Merit", priced: false, open: false, energy: null, unit: "joule", joule: null, reason: "no-gateway", look: 0 };
  }
  const book = meritExchange(input || {});
  return {
    gateway: name,
    coin: "Merit",
    priced: book.offered,
    open: book.open,
    energy: book.energy,
    unit: book.unit,
    joule: book.joule,
    merit: book.merit,
    reason: book.reason,
    look: 0
  };
}

export function exchangeStatus(method, book) {
  if (method === "GET") return 200;
  if (method === "POST") return book && book.offered === true ? 200 : 403;
  return 405;
}

export function publishedResponse() {
  return new Response(JSON.stringify(published()), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
