import { OPEN_DECISION, published } from "./merit-align.js";

export const SENTENCES = Object.freeze([
  "Welcome to the sandbox protocol.",
  "Welcome to the era of autonomy.",
  "Every node computes the same math the same way from scratch.",
  "A cryptocurrency network is not required.",
  "Fixed laws. Fluid circulation. Verified value. Minimal friction.",
  "UniFi³ is identity.",
  "EFUSE is resource and energy accounting.",
  "Merit is the intended exchange.",
  "They are named. They are not live.",
  "They are not required for the math.",
  "The 50/50 Merit split is not finalized.",
  "The 90/9/1 profile and the 99/1 profile are candidates.",
  "The published joule is null, so the Merit gate stays shut.",
  "No early-adopter seat is named.",
  "No founder-board seat is named."
]);

export const MOTTO = "Fixed laws. Fluid circulation. Verified value. Minimal friction.";

export const COINS = Object.freeze(["UniFi³", "EFUSE", "Merit"]);

export const ROLES = Object.freeze({
  "UniFi³": "identity",
  "EFUSE": "resource",
  "Merit": "exchange"
});

export const COIN_NOTE = "The coins are not required for the math. They would only restate this law.";

export const STATES = Object.freeze(["proposed", "configured", "deployed", "verified"]);

export const PROFILE_A = Object.freeze({
  name: "90/9/1",
  state: "proposed",
  base: 100,
  primary: 90,
  secondary: 9,
  integrity: 1
});

export const PROFILE_B = Object.freeze({
  name: "99/1",
  state: "proposed",
  base: 100,
  primary: 99,
  integrity: 1
});

export const ILLUSTRATION = Object.freeze({
  final: false,
  base: 100,
  fifty: Object.freeze([50, 50]),
  profile: "90/9/1",
  on: 50,
  portions: Object.freeze([45, 4.5, 0.5]),
  ordering: null,
  rounding: null,
  minimum: null
});

export const INTEGRITY = Object.freeze({
  portion: 1,
  burn: false,
  profit: false,
  operator: null
});

export const UNCHECKED = Object.freeze([
  "Maximum or otherwise authorized token supply",
  "Issuance and distribution rules",
  "Burning, if any",
  "Transfer and redemption rights",
  "Fees and reserve ownership",
  "Valuation and any energy-cost reference formula",
  "Liquidity and settlement mechanisms",
  "Governance and rule-version controls",
  "Accounting, audit, and reconciliation procedures",
  "What the two 50% portions represent",
  "When the 50/50 split is applied",
  "Whether 50/50 governs issuance, transaction proceeds, revenue, rewards, or another defined economic base",
  "Whether the sap allocation applies before the 50/50 division, after it, or independently",
  "Ordering",
  "Rounding rules",
  "Minimum units",
  "Destination of every portion",
  "Definitive recipients and permitted uses of the 90/9/1 profile",
  "Definitive recipients and permitted uses of the 99/1 profile",
  "A separate explicit economic rule converting commercial revenue, verified savings, or contractual payments into Merit",
  "Credential format, privacy protections, recovery rules, and revocation mechanisms",
  "Early-adopter cap, price, and seat",
  "Founder-board seats, names, and cap"
]);

function quiet() {
  return {
    look: 0,
    joule: null,
    minted: false,
    live: false
  };
}

export function statesEquivalent(left, right) {
  return left === right && STATES.includes(left);
}

export function fifty() {
  return {
    principle: "50/50",
    finalized: false,
    state: "unresolved",
    portions: null,
    purposes: null,
    recipients: null,
    accounting: null,
    supplyHalf: false,
    burnHalf: false,
    reserveHalf: false,
    payUsers: false,
    price: null,
    ...quiet()
  };
}

export function commercial() {
  return {
    contract: true,
    merit: false,
    upfront: 0,
    days: 90,
    participation: 10,
    unit: "operating-income",
    conversion: "unresolved",
    separate: true,
    ...quiet()
  };
}

export function books() {
  return {
    revenue: null,
    issuance: null,
    fees: null,
    reserves: null,
    holders: null,
    merged: false,
    ...quiet()
  };
}

export function launch() {
  return {
    live: false,
    minted: false,
    network: false,
    coinsRequiredForMath: false,
    joule: null,
    look: 0,
    unchecked: UNCHECKED
  };
}

function profilesAsked(src) {
  const names = [];
  if (src.profile === "90/9/1" || src.profile === "99/1") names.push(src.profile);
  if (Array.isArray(src.profiles)) {
    for (let i = 0; i < src.profiles.length; i++) {
      const item = src.profiles[i];
      if ((item === "90/9/1" || item === "99/1") && names.indexOf(item) === -1) names.push(item);
    }
  }
  return names;
}

function portionsOf(profile) {
  if (profile === "90/9/1") return { primary: 90, secondary: 9, integrity: 1 };
  return { primary: 99, integrity: 1 };
}

function sumOf(portions) {
  return portions.primary + (portions.secondary || 0) + portions.integrity;
}

export function allocate(input) {
  const src = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const base = {
    state: "unresolved",
    active: false,
    live: false,
    minted: false,
    profile: null,
    gross: null,
    portions: null,
    recipients: null,
    ledger: null,
    reconciled: false,
    ruleVersion: null,
    reason: "missing",
    look: 0,
    joule: null
  };
  const names = profilesAsked(src);
  const wantsFifty = src.fifty === true || src.split === "50/50";
  if (names.length > 1 || (wantsFifty && names.length > 0)) {
    return { ...base, reason: "both" };
  }
  if (wantsFifty) {
    return { ...base, reason: "unspecified", fifty: fifty() };
  }
  if (names.length !== 1) return base;
  const profile = names[0];
  const type = typeof src.transaction === "string" ? src.transaction.trim() : "";
  const version = typeof src.ruleVersion === "string" ? src.ruleVersion.trim() : "";
  const hasDeductions = Object.hasOwn(src, "deductions");
  const hasFees = Object.hasOwn(src, "fees");
  if (!type || !version || !hasDeductions || !hasFees || typeof src.gross !== "number") {
    return { ...base, profile: profile, reason: "missing" };
  }
  if (src.deductions !== 0 || src.fees !== 0) {
    return { ...base, profile: profile, reason: "unspecified" };
  }
  if (src.gross !== 100) {
    return { ...base, profile: profile, gross: src.gross, reason: "rounding" };
  }
  const portions = portionsOf(profile);
  const reconciled = sumOf(portions) === 100;
  return {
    state: "proposed",
    active: false,
    live: false,
    minted: false,
    profile: profile,
    gross: 100,
    portions: portions,
    recipients: null,
    ledger: null,
    reconciled: reconciled,
    ruleVersion: version,
    reason: "candidate",
    look: 0,
    joule: null
  };
}

export function run(input) {
  const gate = published();
  return {
    protocol: "sandbox",
    sentences: SENTENCES,
    motto: MOTTO,
    coins: COINS,
    roles: ROLES,
    required: false,
    note: COIN_NOTE,
    coin: null,
    live: false,
    sovereign: "Trinity",
    gate: "shut",
    open: gate.open,
    minted: false,
    transfer: false,
    airdrop: false,
    efuse: OPEN_DECISION.efuse,
    look: 0,
    joule: gate.joule,
    network: null,
    ledger: null,
    block: null,
    gas: null,
    chain: null,
    states: STATES,
    profiles: { a: PROFILE_A, b: PROFILE_B },
    integrity: INTEGRITY,
    illustration: ILLUSTRATION,
    allocation: allocate(input),
    fifty: fifty(),
    commercial: commercial(),
    books: books(),
    launch: launch()
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function sandbox() {
  const seen = new Map();
  return {
    run: function (input) {
      const src = input && typeof input === "object" && !Array.isArray(input) ? input : {};
      const job = typeof src.job === "string" ? src.job : "";
      if (job && seen.has(job)) {
        const prior = clone(seen.get(job));
        prior.duplicate = true;
        prior.minted = false;
        prior.look = 0;
        prior.joule = null;
        return prior;
      }
      const result = run(input);
      result.duplicate = false;
      if (job) seen.set(job, clone(result));
      return result;
    }
  };
}
