/**
 * The insula is the only join between brain, nerve, and gland.
 * Corpus Maximus keeps every signal the law admits, and drops none.
 * One step adds at most one. A signal that skips the insula does not enter.
 * Dreamers do not write the corpus.
 */

import { CEILING, FLOOR, SEED } from "./brain-seat.js";
import { run } from "./dclm-write.js";
import { step as dreamStep } from "./dreamer-doer.js";
import { pegOf } from "./unity-wallet.js";

function text(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 240) : "";
}

function objectOf(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value;
}

function nerveNames(value) {
  if (Array.isArray(value)) {
    const names = [];
    for (let i = 0; i < value.length; i++) {
      const inner = nerveNames(value[i]);
      for (let j = 0; j < inner.length; j++) names.push(inner[j]);
    }
    return names;
  }
  const plain = text(value);
  if (plain) return [plain];
  const src = objectOf(value);
  if (!src) return [];
  const name = text(src.sense) || text(src.name) || text(src.step);
  return name ? [name] : [];
}

function glandNames(value) {
  if (Array.isArray(value)) {
    const names = [];
    for (let i = 0; i < value.length; i++) {
      const inner = glandNames(value[i]);
      for (let j = 0; j < inner.length; j++) names.push(inner[j]);
    }
    return names;
  }
  const plain = text(value);
  if (plain) return [plain];
  const src = objectOf(value);
  if (!src) return [];
  const name = text(src.change) || text(src.name) || text(src.state);
  return name ? [name] : [];
}

function pushKind(list, kind, names) {
  for (let i = 0; i < names.length; i++) list.push({ kind: kind, name: names[i] });
}

function signalsOf(src) {
  const list = [];
  if (Object.hasOwn(src, "nerve")) pushKind(list, "nerve", nerveNames(src.nerve));
  else if (Object.hasOwn(src, "sense")) pushKind(list, "nerve", nerveNames(src.sense));
  else if (typeof src.step === "string") pushKind(list, "nerve", nerveNames(src.step));
  if (Object.hasOwn(src, "gland")) pushKind(list, "gland", glandNames(src.gland));
  else if (Object.hasOwn(src, "change")) pushKind(list, "gland", glandNames(src.change));
  return list;
}

function dreamed(src) {
  if (typeof src.dreamer === "string" && text(src.dreamer)) return true;
  if (src.dreamer === true) return true;
  if (src.role === "dreamer" || src.writer === "dreamer") return true;
  return false;
}

function taskOf(name, src) {
  const task = { name: name, what: name };
  const axioms = objectOf(src.axioms);
  const laws = objectOf(src.laws);
  if (axioms) task.axioms = axioms;
  else if (laws) task.laws = laws;
  if (src.veto === true) task.veto = true;
  if (Array.isArray(src.skipped)) task.skipped = src.skipped.slice();
  return task;
}

function outcome(fields) {
  return Object.freeze({
    joined: fields.joined === true,
    admitted: fields.admitted === true,
    reason: fields.reason,
    authority: "DCLM",
    peg: fields.peg || null,
    step: Number.isInteger(fields.step) ? fields.step : null,
    seed: SEED,
    floor: FLOOR,
    ceiling: CEILING,
    look: 0,
    joule: null
  });
}

function kept(peg, step) {
  return Object.freeze({
    peg: peg,
    step: step,
    seed: SEED,
    floor: FLOOR,
    ceiling: CEILING,
    look: 0,
    joule: null
  });
}

function refused(step, reason) {
  return Object.freeze({
    step: step,
    reason: reason,
    seed: SEED,
    floor: FLOOR,
    ceiling: CEILING,
    look: 0,
    joule: null
  });
}

function copyRows(rows) {
  return Object.freeze(rows.map(function (row) { return row; }));
}

function dreamInput(src) {
  if (dreamed(src)) return true;
  if (Array.isArray(src.seeds)) return true;
  if (objectOf(src.seed)) return true;
  return false;
}

function seedsOf(src) {
  if (Array.isArray(src.seeds)) return src.seeds;
  if (objectOf(src.seed)) return [src.seed];
  const signals = signalsOf(src);
  const idea = signals.length === 1 ? signals[0].name : text(src.idea) || text(src.what);
  const seed = {};
  const dreamer = text(src.dreamer);
  if (dreamer) seed.dreamer = dreamer;
  if (idea) seed.idea = idea;
  if (typeof src.p === "number") seed.p = src.p;
  if (objectOf(src.axioms)) seed.axioms = src.axioms;
  else if (objectOf(src.laws)) seed.laws = src.laws;
  if (src.veto === true) seed.veto = true;
  if (Array.isArray(src.skipped)) seed.skipped = src.skipped.slice();
  if (Array.isArray(src.matrix)) seed.matrix = src.matrix.slice();
  if (!seed.dreamer && !seed.idea) return [];
  return [seed];
}

export function open() {
  const body = [];
  const memory = [];
  let count = 0;
  let chain = Promise.resolve();
  let dreamMemory = { turn: 0, seeds: [], peg: null, unknown: [] };

  function empty(reason) {
    return outcome({ joined: true, admitted: false, reason: reason });
  }

  function remember(reason) {
    count += 1;
    memory.push(refused(count, reason));
    return outcome({ joined: true, admitted: false, reason: reason, step: count });
  }

  async function keep(kind, name) {
    const peg = await pegOf(kind + ":" + name);
    if (!peg) return remember("EMPTY");
    for (let i = 0; i < body.length; i++) {
      if (body[i].peg === peg) {
        return outcome({
          joined: true,
          admitted: true,
          reason: "ADMIT",
          peg: body[i].peg,
          step: body[i].step
        });
      }
    }
    count += 1;
    const row = kept(peg, count);
    body.push(row);
    return outcome({
      joined: true,
      admitted: true,
      reason: "ADMIT",
      peg: row.peg,
      step: row.step
    });
  }

  async function admitDream(src) {
    const signals = signalsOf(src);
    if (signals.length > 1) return remember("STEP");
    const host = src.stop === true ? { stop: true } : {};
    const held = dreamStep({
      turn: dreamMemory.turn,
      seeds: seedsOf(src),
      peg: dreamMemory.peg,
      unknown: dreamMemory.unknown
    }, host);
    dreamMemory = {
      turn: held.turn,
      peg: held.peg,
      unknown: held.unknown,
      seeds: []
    };
    if (held.reason === "RECALL") {
      return outcome({ joined: true, admitted: false, reason: "RECALL" });
    }
    const name = held.written ? text(held.written.what) : "";
    if (held.admitted !== true || !name) {
      if (!held.reason || held.reason === "EMPTY") return empty("EMPTY");
      return remember(held.reason);
    }
    const kind = signals.length === 1 ? signals[0].kind : "signal";
    return keep(kind, name);
  }

  async function admit(input) {
    const src = objectOf(input);
    if (!src) return empty("EMPTY");
    if (dreamInput(src)) return admitDream(src);
    const signals = signalsOf(src);
    if (signals.length === 0) return empty("EMPTY");
    if (signals.length > 1) return remember("STEP");
    const one = signals[0];
    const record = run(taskOf(one.name, src));
    const agreed = record.admitted === true
      && record.write
      && record.write.ok === true
      && record.audit
      && record.audit.ok === true
      && record.reason === "ADMIT";
    if (!agreed) return remember(record.reason || "VETO");
    return keep(one.kind, one.name);
  }

  function join(input) {
    const pending = chain.then(function () { return admit(input); });
    chain = pending.then(function () { return null; }, function () { return null; });
    return pending;
  }

  function skip() {
    return outcome({ joined: false, admitted: false, reason: "SKIP" });
  }

  return Object.freeze({
    join: join,
    skip: skip,
    corpus: function () { return copyRows(body); },
    unknown: function () { return copyRows(memory); }
  });
}
