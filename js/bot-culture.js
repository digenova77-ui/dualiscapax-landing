/**
 * Contemplators consider. A contemplation is a named idea that is not yet uncovered.
 * Conjurers ask what if. A conjuring is one scenario joined to one contemplation.
 * A probability is not an answer. A daydream is not a rule.
 * The culture writes no law. DCLM remains the umpire.
 * An idea stays in the uncovered list until a later explicit admit passes run().
 * A veto or a skipped law leaves it there.
 * One call is one contemplation or one conjuring.
 * The culture does not retire itself. Trinity has not set the rule.
 */

import { RING } from "./iris-attack.js";
import { LAWS, run } from "./dclm-write.js";
import { propose } from "./dreamer-doer.js";

export { RING };

function text(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 240) : "";
}

function objectOf(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function probability(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) return null;
  const clean = Object.is(value, -0) ? 0 : value;
  return clean;
}

function ringName(value) {
  return RING.indexOf(value) !== -1 ? value : "";
}

function freshName(src) {
  const named = text(src.name) || text(src.idea) || text(src.what);
  if (named) return named;
  const held = src.contemplation;
  if (!held || typeof held !== "object" || Array.isArray(held)) return "";
  if (held.kind === "contemplation" || held.kind === "conjuring" || held.uncovered === true) return "";
  return text(held.name) || text(held.idea) || text(held.id);
}

function joinRef(src) {
  if (typeof src.contemplation === "string") return text(src.contemplation);
  const held = src.contemplation;
  if (held && typeof held === "object" && !Array.isArray(held)) {
    return text(held.id) || text(held.name) || text(held.idea);
  }
  return text(src.name) || text(src.idea) || text(src.what);
}

function scenarioOf(src) {
  return text(src.scenario) || text(src.whatIf) || (typeof src.daydream === "string" ? text(src.daydream) : "");
}

function axiomsOf(value) {
  const src = objectOf(value);
  const out = {};
  for (let i = 0; i < LAWS.length; i++) {
    const law = LAWS[i];
    if (src[law] === true) out[law] = true;
    else if (src[law] === false) out[law] = false;
  }
  return out;
}

function skippedOf(value) {
  if (!Array.isArray(value)) return [];
  return LAWS.filter(function (law) { return value.indexOf(law) !== -1; });
}

function explicitAdmit(src) {
  if (!src || src.admit == null || src.admit === false) return null;
  if (src.admit === true) return objectOf(src.task);
  if (typeof src.admit === "object" && !Array.isArray(src.admit)) return src.admit;
  return null;
}

function taskOf(admit) {
  const src = objectOf(admit);
  const id = text(src.id) || text(src.name) || text(src.what) || text(src.idea);
  const what = text(src.what) || text(src.idea) || id;
  const nested = axiomsOf(src.axioms);
  const axioms = Object.keys(nested).length ? nested : axiomsOf(src);
  const task = { id: id, what: what, axioms: axioms };
  if (src.veto === true) task.veto = true;
  const skipped = skippedOf(src.skipped);
  if (skipped.length) task.skipped = skipped;
  return task;
}

export function contemplate(input) {
  const src = objectOf(input);
  const name = freshName(src) || text(src.name) || text(src.idea) || text(src.what);
  const id = text(src.id) || name;
  return Object.freeze({
    id: id,
    name: name,
    idea: name,
    kind: "contemplation",
    dreamer: ringName(src.dreamer),
    p: probability(src.p),
    answer: null,
    rule: null,
    uncovered: true,
    look: 0,
    joule: null
  });
}

export function conjure(input) {
  const src = objectOf(input);
  const contemplation = joinRef(src);
  const scenario = scenarioOf(src);
  const id = text(src.id) || (contemplation && scenario ? (contemplation + ":" + scenario).slice(0, 240) : "");
  return Object.freeze({
    id: id,
    contemplation: contemplation,
    scenario: scenario,
    kind: "conjuring",
    dreamer: ringName(src.dreamer),
    p: probability(src.p),
    answer: null,
    rule: null,
    daydream: true,
    uncovered: true,
    look: 0,
    joule: null
  });
}

function heldItem(value) {
  const src = objectOf(value);
  const kind = src.kind === "conjuring" ? "conjuring" : (src.kind === "contemplation" ? "contemplation" : "");
  if (!kind) return null;
  const name = text(src.name) || text(src.idea) || text(src.scenario);
  const id = text(src.id) || name;
  if (!id) return null;
  if (kind === "conjuring") {
    const contemplation = text(src.contemplation);
    const scenario = text(src.scenario);
    if (!contemplation || !scenario) return null;
    return Object.freeze({
      id: id,
      contemplation: contemplation,
      scenario: scenario,
      kind: "conjuring",
      dreamer: ringName(src.dreamer),
      p: probability(src.p),
      answer: null,
      rule: null,
      daydream: true,
      uncovered: true,
      look: 0,
      joule: null
    });
  }
  const idea = text(src.idea) || text(src.name);
  if (!idea) return null;
  return Object.freeze({
    id: id,
    name: idea,
    idea: idea,
    kind: "contemplation",
    dreamer: ringName(src.dreamer),
    p: probability(src.p),
    answer: null,
    rule: null,
    uncovered: true,
    look: 0,
    joule: null
  });
}

function remember(state) {
  const src = objectOf(state);
  const raw = Array.isArray(src.uncovered) ? src.uncovered : [];
  const uncovered = [];
  const seen = new Set();
  for (let i = 0; i < raw.length; i++) {
    const item = heldItem(raw[i]);
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    uncovered.push(item);
  }
  return {
    uncovered: uncovered,
    turn: Number.isInteger(src.turn) ? src.turn : 0
  };
}

function findContemplation(list, ref) {
  if (!ref) return null;
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (item.kind !== "contemplation") continue;
    if (item.id === ref || item.name === ref || item.idea === ref) return item;
  }
  return null;
}

function findHeld(list, task) {
  const names = [task.id, task.what];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (names.indexOf(item.id) !== -1) return item;
    if (item.kind === "contemplation" && (names.indexOf(item.name) !== -1 || names.indexOf(item.idea) !== -1)) return item;
    if (item.kind === "conjuring" && names.indexOf(item.scenario) !== -1) return item;
  }
  return null;
}

function addUncovered(list, item) {
  if (!item || !item.id) return list;
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === item.id) return list;
  }
  return list.concat([item]);
}

function dropHeld(list, id) {
  const out = [];
  for (let i = 0; i < list.length; i++) {
    if (list[i].id !== id) out.push(list[i]);
  }
  return out;
}

function view(memory, fields) {
  return {
    contemplation: fields.contemplation || null,
    conjuring: fields.conjuring || null,
    uncovered: memory.uncovered.slice(),
    admitted: fields.admitted === true,
    written: fields.written || null,
    reason: fields.reason || "",
    authority: "DCLM",
    write: fields.write || null,
    audit: fields.audit || null,
    rule: null,
    law: null,
    trinity: null,
    answer: null,
    dreamer: fields.dreamer || null,
    seed: fields.seed || null,
    refused: fields.refused ? fields.refused.slice() : [],
    gate: "shut",
    open: false,
    coin: null,
    retired: false,
    stop: false,
    look: 0,
    joule: null
  };
}

function hold(memory, fields) {
  return view(memory, fields || {});
}

function seedOf(proposal) {
  if (!proposal || !proposal.seed) return null;
  return Object.freeze({
    dreamer: proposal.seed.dreamer,
    id: proposal.seed.id,
    idea: proposal.seed.idea,
    p: proposal.seed.p
  });
}

export function consider(state) {
  const src = objectOf(state);
  const memory = remember(src);
  const scenario = scenarioOf(src);
  const fresh = freshName(src);
  const ref = joinRef(src);
  if (scenario && ref) {
    const joined = findContemplation(memory.uncovered, ref);
    if (!joined) return hold(memory, { reason: "UNJOINED" });
    const asked = text(src.id);
    const made = conjure({
      contemplation: joined.id,
      scenario: scenario,
      id: asked && asked !== joined.id ? asked : "",
      dreamer: src.dreamer,
      p: src.p
    });
    if (!made.id || !made.scenario) return hold(memory, { reason: "UNJOINED" });
    return hold({
      uncovered: addUncovered(memory.uncovered, made),
      turn: memory.turn
    }, {
      conjuring: made,
      reason: "DAYDREAM",
      dreamer: made.dreamer || null
    });
  }
  if (fresh) {
    const made = contemplate({
      name: fresh,
      id: text(src.id),
      dreamer: src.dreamer,
      p: src.p
    });
    if (!made.id || !made.idea) return hold(memory);
    return hold({
      uncovered: addUncovered(memory.uncovered, made),
      turn: memory.turn
    }, {
      contemplation: made,
      reason: "CONSIDER",
      dreamer: made.dreamer || null
    });
  }
  if (Array.isArray(src.seeds)) {
    const proposal = propose({
      turn: memory.turn,
      seeds: src.seeds,
      unknown: []
    });
    const seed = seedOf(proposal);
    if (!seed || !seed.id || !seed.idea) {
      return hold(memory, {
        dreamer: proposal.dreamer || null,
        refused: proposal.refused,
        reason: proposal.refused.length ? "REFUSED" : "EMPTY"
      });
    }
    const made = contemplate({
      name: seed.idea,
      id: seed.id,
      dreamer: seed.dreamer,
      p: seed.p
    });
    return hold({
      uncovered: addUncovered(memory.uncovered, made),
      turn: memory.turn
    }, {
      contemplation: made,
      reason: "CONSIDER",
      dreamer: seed.dreamer || proposal.dreamer || null,
      seed: seed,
      refused: proposal.refused
    });
  }
  const admit = explicitAdmit(src);
  if (admit && Object.keys(admit).length) {
    const task = taskOf(admit);
    const hit = findHeld(memory.uncovered, task);
    if (!hit) return hold(memory, { reason: "UNCOVERED" });
    const record = run(task);
    if (record.admitted === true && record.written) {
      return hold({
        uncovered: dropHeld(memory.uncovered, hit.id),
        turn: memory.turn
      }, {
        admitted: true,
        written: record.written,
        reason: record.reason,
        write: record.write,
        audit: record.audit
      });
    }
    return hold(memory, {
      admitted: false,
      written: null,
      reason: record.reason,
      write: record.write,
      audit: record.audit
    });
  }
  return hold(memory);
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

export async function handleCulture(request) {
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
  if (method === "GET") return json(200, consider(null));
  if (method === "POST") {
    let body = null;
    try {
      body = await request.json();
    } catch (err) {
      body = null;
    }
    return json(200, consider(body));
  }
  return json(405, consider(null));
}
