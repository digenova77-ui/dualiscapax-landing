import { run } from "./dclm-write.js";

export const SEED = -1;
export const FLOOR = 0;
export const CEILING = 1;

const brain = {
  status: "seated",
  seat: null
};

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function clean(value) {
  return Object.is(value, -0) ? 0 : value;
}

function readingsOf(input) {
  if (Array.isArray(input)) return input.slice(0, 2);
  if (!input || typeof input !== "object") return [];
  if (Array.isArray(input.readings)) return input.readings.slice(0, 2);
  if (Object.hasOwn(input, "reading") || Object.hasOwn(input, "second")) {
    const pair = [];
    if (Object.hasOwn(input, "reading")) pair.push(input.reading);
    if (Object.hasOwn(input, "second")) pair.push(input.second);
    return pair;
  }
  return [];
}

function diamond(readings) {
  if (readings.length < 2) return null;
  const left = readings[0];
  const right = readings[1];
  if (!finite(left) || !finite(right)) return null;
  return clean(right - left);
}

function taskOf(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const task = {};
  if (Object.hasOwn(input, "id")) task.id = input.id;
  if (Object.hasOwn(input, "name")) task.name = input.name;
  if (Object.hasOwn(input, "what")) task.what = input.what;
  if (Object.hasOwn(input, "axioms")) task.axioms = input.axioms;
  if (Object.hasOwn(input, "laws")) task.laws = input.laws;
  if (Object.hasOwn(input, "skipped")) task.skipped = input.skipped;
  if (Object.hasOwn(input, "veto")) task.veto = input.veto;
  return task;
}

function place(input) {
  return {
    seed: SEED,
    floor: FLOOR,
    ceiling: CEILING,
    tree: [SEED, FLOOR],
    derivative: diamond(readingsOf(input))
  };
}

export function seat(input) {
  const record = run(taskOf(input));
  brain.seat = place(input);
  return {
    brain: brain.status,
    seat: brain.seat,
    admitted: record.admitted,
    authority: "DCLM",
    written: record.written,
    look: 0,
    joule: null
  };
}
