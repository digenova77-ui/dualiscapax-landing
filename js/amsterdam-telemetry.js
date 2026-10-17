import { run } from "./dclm-write.js";
import { align, published } from "./merit-align.js";

export const PLACES = Object.freeze(["amsterdam", "new-jersey"]);

export const SENTENCES = Object.freeze([
  "Real-time telemetry offloads to Amsterdam.",
  "New Jersey takes the same object only when Amsterdam is down.",
  "The coins are not in this pipe."
]);

export const EXPLORERS = Object.freeze({
  Unity: null,
  Merit: null,
  eFuse: null
});

export const PING = null;

const HEX = "0123456789abcdef";

const SEALED = Object.freeze([
  "identification",
  "passphrase",
  "password",
  "passkey",
  "mail",
  "email",
  "audio",
  "video",
  "pixels",
  "pixel",
  "screen",
  "dark",
  "darkLedger",
  "ledger",
  "secret",
  "token"
]);

function hostOf(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function urlOf(host) {
  if (!host || !/^https?:\/\//i.test(host)) return null;
  return host;
}

export function pingOf() {
  const names = Object.keys(EXPLORERS);
  for (let i = 0; i < names.length; i++) {
    if (EXPLORERS[names[i]]) return EXPLORERS[names[i]];
  }
  return null;
}

function lawOf(input) {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    if (input.decision && typeof input.decision === "object" && !Array.isArray(input.decision)) {
      return align(input.decision);
    }
    if (Object.hasOwn(input, "joule")) return align({ joule: input.joule });
  }
  return published();
}

function taskOf(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const src = input.task && typeof input.task === "object" && !Array.isArray(input.task) ? input.task : input;
  if (!src.axioms && !src.laws && !src.what && !src.id && src.veto !== true) return null;
  const task = {};
  if (typeof src.id === "string") task.id = src.id;
  if (typeof src.what === "string") task.what = src.what;
  if (src.axioms && typeof src.axioms === "object" && !Array.isArray(src.axioms)) task.axioms = src.axioms;
  if (src.laws) task.laws = src.laws;
  if (src.veto === true) task.veto = true;
  if (Array.isArray(src.skipped)) task.skipped = src.skipped;
  return task;
}

function thirdPlace(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return false;
  if (!Object.hasOwn(input, "place")) return false;
  return input.place !== "amsterdam" && input.place !== "new-jersey";
}

function pairOf(roles) {
  const src = roles && typeof roles === "object" && !Array.isArray(roles) ? roles : {};
  const amsterdam = src.amsterdam && typeof src.amsterdam === "object" ? src.amsterdam : null;
  const jersey = src["new-jersey"] && typeof src["new-jersey"] === "object" ? src["new-jersey"] : null;
  return { amsterdam: amsterdam, "new-jersey": jersey };
}

function choose(pair) {
  if (pair.amsterdam && pair.amsterdam.up === true) {
    return { place: "amsterdam", role: pair.amsterdam };
  }
  return { place: "new-jersey", role: pair["new-jersey"] };
}

async function digest(text) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    hex += HEX[byte >> 4] + HEX[byte & 15];
  }
  return hex;
}

function leaked(input, object) {
  if (!input || typeof input !== "object") return false;
  const blob = JSON.stringify(object);
  const keys = Object.keys(input);
  for (let i = 0; i < keys.length; i++) {
    if (SEALED.indexOf(keys[i]) === -1) continue;
    const value = input[keys[i]];
    if (typeof value === "string" && value && blob.indexOf(value) !== -1) return true;
  }
  if (input.task && input.task !== input) return leaked(input.task, object);
  return false;
}

async function hand(role, object) {
  const host = hostOf(role && role.host);
  if (!host) return false;
  if (typeof role.take === "function") {
    const result = await role.take(object);
    return result !== false;
  }
  const url = urlOf(host);
  if (!url || typeof fetch !== "function") return false;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(object)
    });
    return !!response && response.ok === true;
  } catch (err) {
    return false;
  }
}

function reading(peg, recalled, sent, place, reason, law, write) {
  return Object.freeze({
    recalled: recalled,
    peg: peg,
    sent: sent,
    place: place,
    reason: reason,
    look: 0,
    joule: law.joule,
    gate: law.open === true ? "open" : "shut",
    write: write,
    minted: false,
    ping: pingOf()
  });
}

export function rolesFrom(env) {
  const src = env && typeof env === "object" ? env : {};
  const up = src.AMSTERDAM_UP === true || src.AMSTERDAM_UP === "up" || src.AMSTERDAM_UP === "1" || src.AMSTERDAM_UP === "true";
  return {
    amsterdam: { host: hostOf(src.AMSTERDAM_HOST), up: up },
    "new-jersey": { host: hostOf(src.NEW_JERSEY_HOST), up: false }
  };
}

export function tunnel(roles) {
  const pair = pairOf(roles);
  let peg = null;
  let count = 0;
  return {
    memory: function () {
      return Object.freeze({ peg: peg });
    },
    step: async function (input) {
      const law = lawOf(input);
      const recalled = peg;
      if (thirdPlace(input)) {
        return reading(peg, recalled, false, null, "refused", law, "refused");
      }
      const record = run(taskOf(input));
      const write = record.admitted === true ? "admitted" : "refused";
      const choice = choose(pair);
      const place = choice.place;
      const role = choice.role;
      if (!hostOf(role && role.host)) {
        return reading(peg, recalled, false, place, "unsent", law, write);
      }
      const gate = law.open === true ? "open" : "shut";
      const mark = await digest([count + 1, gate, law.joule === null ? "null" : String(law.joule), write].join("|"));
      const object = Object.freeze({
        id: mark,
        step: count + 1,
        place: place,
        gate: gate,
        joule: law.joule,
        look: 0,
        write: write
      });
      if (leaked(input, object)) {
        return reading(peg, recalled, false, null, "refused", law, "refused");
      }
      const sent = await hand(role, object);
      if (!sent) return reading(peg, recalled, false, place, "unsent", law, write);
      count += 1;
      peg = await digest(JSON.stringify(object));
      return reading(peg, recalled, true, place, "sent", law, write);
    }
  };
}

function idle() {
  const law = published();
  return reading(null, null, false, null, "idle", law, "refused");
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*"
    }
  });
}

export async function handleStep(request, env) {
  const method = request && request.method;
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "Content-Type",
        "access-control-max-age": "86400"
      }
    });
  }
  if (method === "GET") return json(200, idle());
  if (method !== "POST") return json(405, idle());
  let body = null;
  try {
    body = await request.json();
  } catch (err) {
    body = null;
  }
  const result = await tunnel(rolesFrom(env)).step(body);
  return json(200, result);
}
