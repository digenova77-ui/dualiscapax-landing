import { OPEN_DECISION, published } from "./merit-align.js";

export const SENTENCES = Object.freeze([
  "Welcome to the sandbox protocol.",
  "Welcome to the era of autonomy.",
  "Every node computes the same math the same way from scratch.",
  "A cryptocurrency network is not required."
]);

export const COINS = Object.freeze(["Unity", "Merit", "eFuse"]);

export const COIN_NOTE = "The coins are not required for the math. They would only restate this law.";

function plain(value) {
  if (Array.isArray(value)) return value.map(plain);
  if (!value || typeof value !== "object") return value;
  const out = {};
  const names = Object.keys(value).sort();
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (name === "key" || name === "secret") continue;
    out[name] = plain(value[name]);
  }
  return out;
}

function canon(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canon).join(",") + "]";
  const names = Object.keys(value).sort();
  return "{" + names.map(function (name) {
    return JSON.stringify(name) + ":" + canon(value[name]);
  }).join(",") + "}";
}

function mathOf(value) {
  const text = canon(plain(value));
  let n = 0;
  for (let i = 0; i < text.length; i++) n = (n + text.charCodeAt(i) * (i + 1)) % 1000003;
  return n;
}

export function run(input) {
  const gate = published();
  return {
    protocol: "sandbox",
    sentences: SENTENCES,
    math: mathOf(input),
    coins: COINS,
    required: false,
    note: COIN_NOTE,
    coin: null,
    sovereign: "Trinity",
    gate: "shut",
    open: gate.open,
    minted: false,
    efuse: OPEN_DECISION.efuse,
    look: 0,
    joule: gate.joule,
    network: null,
    ledger: null,
    block: null,
    gas: null
  };
}
