import { run } from "./dclm-write.js";
import { read as senseJoule } from "./joule-sensor.js";

const HOLD = Object.freeze({
  NO_FORCE: true,
  HOST_SAFE: true,
  CLEANUP_FIRST: true,
  TRUTH_OR_NOTHING: true
});

const DROP = new Set([
  "identification",
  "raw",
  "rawid",
  "unityid",
  "body",
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
  "screenpixels",
  "frame",
  "dark",
  "darkledger",
  "ledger",
  "secret",
  "token",
  "dreamer",
  "probability",
  "sentence",
  "spoken",
  "say",
  "coin",
  "android",
  "override",
  "minted",
  "ping"
]);

const memory = new Map();
let last = null;

export const HOLD_LINE = "Iris speaks the reading the servers already hold.";

function text(value, max) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : "";
}

function keyOf(key) {
  return String(key).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function secretsOf(src) {
  const found = [];
  if (!src || typeof src !== "object") return found;
  const keys = Object.keys(src);
  for (let i = 0; i < keys.length; i++) {
    if (!DROP.has(keyOf(keys[i]))) continue;
    const value = src[keys[i]];
    if (typeof value === "string" && value.trim()) found.push(value.trim());
  }
  return found;
}

function clean(value, secrets, max) {
  const line = text(value, max);
  if (!line) return "";
  for (let i = 0; i < secrets.length; i++) {
    if (line.includes(secrets[i])) return "";
  }
  return line;
}

function hexPeg(value) {
  return /^[0-9a-f]{64}$/i.test(value);
}

export function identify(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { known: false, peg: null };
  }
  const secrets = secretsOf(input);
  const peg = clean(input.peg, secrets, 240);
  if (peg) return { known: true, peg: peg };
  const mark = clean(input.id, secrets, 64);
  if (mark && hexPeg(mark)) return { known: true, peg: mark };
  return { known: false, peg: null };
}

function marksOf(input) {
  let admitted = false;
  let refused = false;
  if (input.write === "admitted") admitted = true;
  if (input.write === "refused") refused = true;
  if (input.admitted === true) admitted = true;
  if (input.admitted === false) admitted = false;
  if (input.refused === true) refused = true;
  if (input.refused === false) refused = false;
  if (admitted) refused = false;
  return { admitted: admitted, refused: refused };
}

function readingOf(input, peg) {
  const secrets = secretsOf(input);
  const sensed = senseJoule(input);
  const joule = sensed.joule;
  const place = clean(input.place, secrets, 80) || null;
  const step = finite(input.step) ? input.step : null;
  const marks = marksOf(input);
  const gate = sensed.gate;
  return Object.freeze({
    peg: peg,
    step: step,
    place: place,
    gate: gate,
    joule: joule,
    look: 0,
    admitted: marks.admitted,
    refused: marks.refused
  });
}

function placeName(place) {
  if (place === "amsterdam") return "Amsterdam";
  if (place === "new-jersey") return "New Jersey";
  return place;
}

export function sentenceOf(reading) {
  if (!reading) return "";
  const parts = [];
  const place = reading.place ? placeName(reading.place) : "";
  if (place && reading.step !== null && reading.step !== undefined) {
    parts.push(place + " holds step " + reading.step + ".");
  } else if (place) {
    parts.push(place + " holds the reading.");
  } else if (reading.step !== null && reading.step !== undefined) {
    parts.push("Step " + reading.step + ".");
  }
  if (reading.gate === "open" || reading.gate === "shut") {
    parts.push("The gate is " + reading.gate + ".");
  }
  if (Object.hasOwn(reading, "joule")) {
    parts.push("The joule is " + (reading.joule === null ? "null" : String(reading.joule)) + ".");
  }
  if (reading.admitted === true) parts.push("It is admitted.");
  else if (reading.refused === true) parts.push("It is refused.");
  return parts.join(" ");
}

export const EMPTY_SPOKEN = sentenceOf(Object.freeze({
  step: null,
  place: null,
  gate: "shut",
  joule: null,
  look: 0,
  admitted: false,
  refused: false
}));

function axiomsOf(input) {
  const task = input && input.task && typeof input.task === "object" ? input.task : null;
  const src = input && input.axioms && typeof input.axioms === "object" ? input.axioms : null;
  const fromTask = task && task.axioms && typeof task.axioms === "object" ? task.axioms : null;
  return src || fromTask || HOLD;
}

function taskOf(input) {
  const task = {
    id: "learn-reading",
    what: "learn the public reading",
    axioms: axiomsOf(input)
  };
  const nested = input && input.task && typeof input.task === "object" ? input.task : null;
  if ((input && input.veto === true) || (nested && nested.veto === true)) task.veto = true;
  const skipped = input && Array.isArray(input.skipped) ? input.skipped : (nested && Array.isArray(nested.skipped) ? nested.skipped : null);
  if (skipped && skipped.length) task.skipped = skipped;
  return task;
}

function voice(reading, recalled, admitted, written) {
  return {
    spoken: reading ? sentenceOf(reading) : "",
    known: !!reading,
    peg: reading ? reading.peg : null,
    place: reading ? reading.place : null,
    step: reading ? reading.step : null,
    gate: reading ? reading.gate : "shut",
    joule: reading ? reading.joule : null,
    look: reading ? reading.look : 0,
    admitted: admitted,
    refused: reading ? reading.refused === true : false,
    recalled: recalled,
    asked: false,
    written: written,
    reading: reading
  };
}

function quiet() {
  return {
    spoken: "",
    known: false,
    peg: null,
    place: null,
    step: null,
    gate: "shut",
    joule: null,
    look: 0,
    admitted: false,
    refused: false,
    recalled: false,
    asked: false,
    written: null,
    reading: null
  };
}

function heldVoice(reading) {
  return voice(reading, true, true, null);
}

export function learned() {
  if (!last || !memory.has(last)) return null;
  return heldVoice(memory.get(last));
}

function touch(input) {
  const found = identify(input);
  if (!found.known) return quiet();
  const held = memory.get(found.peg);
  if (held) {
    last = found.peg;
    return heldVoice(held);
  }
  const record = run(taskOf(input));
  if (!record.admitted) {
    return {
      spoken: "",
      known: true,
      peg: found.peg,
      place: null,
      step: null,
      gate: "shut",
      joule: null,
      look: 0,
      admitted: false,
      refused: false,
      recalled: false,
      asked: false,
      written: null,
      reading: null
    };
  }
  const reading = readingOf(input, found.peg);
  memory.set(found.peg, reading);
  last = found.peg;
  return voice(reading, false, true, record.written);
}

export function learn(input) {
  return touch(input);
}

export function speak(input) {
  return touch(input);
}
