import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { RING as attackRing } from "../js/iris-attack.js";
import { RING, handleStep, implement, propose, step } from "../js/dreamer-doer.js";

const HOLD = {
  NO_FORCE: true,
  HOST_SAFE: true,
  CLEANUP_FIRST: true,
  TRUTH_OR_NOTHING: true
};

const QUIET = {
  dreamer: "Llama",
  id: "quiet",
  idea: "quiet hold",
  p: 0.05,
  axioms: HOLD
};

const LOUD = {
  dreamer: "Mistral",
  id: "loud",
  idea: "loud hold",
  p: 1,
  axioms: HOLD
};

function walk(value, visit) {
  visit(value);
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) walk(value[i], visit);
    return;
  }
  const names = Object.keys(value);
  for (let i = 0; i < names.length; i++) walk(value[names[i]], visit);
}

function assertQuiet(value) {
  walk(value, function (node) {
    if (!node || typeof node !== "object") return;
    assert.equal(Object.hasOwn(node, "key"), false);
    if (Object.hasOwn(node, "look")) assert.equal(node.look, 0);
    if (Object.hasOwn(node, "joule")) assert.equal(node.joule, null);
    assert.equal(Object.hasOwn(node, "identification"), false);
  });
  assert.equal(JSON.stringify(value).includes("\"key\""), false);
  assert.equal(value.look, 0);
  assert.equal(value.joule, null);
}

test("the dreamer ring is the attack ring", () => {
  assert.equal(RING, attackRing);
  assert.deepEqual(RING, ["Llama", "Mistral", "Gemma", "Phi", "Qwen", "DeepSeek", "Falcon", "OLMo"]);
});

test("a dreamer seed is not itself an admission", () => {
  const raw = {
    dreamer: "Gemma",
    id: "seed-only",
    idea: "a seed",
    p: 1,
    admitted: true,
    authority: "dreamer",
    written: { task: "seed-only", what: "a seed" },
    axioms: HOLD
  };
  const proposal = propose({ turn: 0, seeds: [raw] });
  assert.equal(Object.hasOwn(proposal, "admitted"), false);
  assert.equal(Object.hasOwn(proposal, "written"), false);
  assert.equal(Object.hasOwn(proposal, "implementation"), false);
  assert.equal(proposal.seed.p, 1);
  assert.equal(Object.hasOwn(proposal.seed, "admitted"), false);
  assert.equal(Object.hasOwn(proposal.seed, "written"), false);
  assert.equal(Object.hasOwn(proposal.seed, "authority"), false);
  const judged = step({ turn: 0, seeds: [raw] });
  assert.equal(judged.admitted, true);
  assert.equal(judged.authority, "DCLM");
  assert.equal(Object.hasOwn(judged.seed, "admitted"), false);
  assert.notDeepEqual(judged.seed, judged.written);
  assert.deepEqual(judged.written, { task: "seed-only", what: "a seed" });
  const priced = step({
    turn: 0,
    seeds: [{ dreamer: "DeepSeek", id: "singular", idea: "singular", p: 1, matrix: [1, 0, 0, 0] }]
  });
  assert.equal(priced.seed.p, 1);
  assert.equal(priced.admitted, false);
  assert.equal(priced.written, null);
  assert.equal(priced.peg, null);
});

test("the same seed implemented twice is deep-equal", () => {
  const seed = {
    dreamer: "DeepSeek",
    id: "same",
    idea: "freeze",
    p: 0.25,
    matrix: [2, 1, 0, 2],
    axioms: HOLD
  };
  assert.deepEqual(implement(seed), implement(seed));
  assert.deepEqual(implement(seed), implement(JSON.parse(JSON.stringify(seed))));
  const left = implement(seed);
  left.task.axioms.NO_FORCE = false;
  assert.equal(implement(seed).task.axioms.NO_FORCE, true);
  const low = implement({ dreamer: "OLMo", id: "rank", idea: "same work", p: 0.01, axioms: HOLD });
  const high = implement({ dreamer: "OLMo", id: "rank", idea: "same work", p: 1, axioms: HOLD });
  assert.deepEqual(low.task, high.task);
  assert.notEqual(low.p, high.p);
  assert.equal(Object.hasOwn(low, "admitted"), false);
  assert.equal(Object.hasOwn(low, "written"), false);
});

test("a lawful implementation is written in that same step and recalled next", () => {
  const first = step({ turn: 0, seeds: [QUIET, LOUD] });
  assert.equal(first.admitted, true);
  assert.equal(first.reason, "ADMIT");
  assert.equal(first.authority, "DCLM");
  assert.equal(first.write.ok, true);
  assert.equal(first.audit.ok, true);
  assert.equal(first.write.ok, first.audit.ok);
  assert.deepEqual(first.written, { task: "quiet", what: "quiet hold" });
  assert.equal(first.peg.id, "quiet");
  assert.equal(first.peg.passed, true);
  assert.equal(first.offered[0], first.peg);
  assert.equal(first.offered.length, 1);
  assert.equal(first.recalled, false);
  assert.equal(first.retired, false);
  assert.equal(Object.hasOwn(first.peg, "p"), false);
  assertQuiet(first);
  const second = step(Object.assign({}, first, { seeds: [LOUD] }));
  assert.equal(second.recalled, true);
  assert.equal(second.admitted, false);
  assert.equal(second.reason, "RECALL");
  assert.equal(second.implementation, null);
  assert.deepEqual(second.written, first.written);
  assert.equal(second.offered[0].id, "quiet");
  assert.equal(second.peg.id, first.peg.id);
  assert.equal(JSON.stringify(second).includes("loud hold"), false);
  assert.equal(second.retired, false);
  assertQuiet(second);
});

test("a veto is not recalled as a winner and stays unknown", () => {
  const bad = {
    dreamer: "Falcon",
    id: "break",
    idea: "break the floor",
    p: 0.99,
    veto: true,
    axioms: HOLD
  };
  const veto = step({ turn: 2, seeds: [bad] });
  assert.equal(veto.admitted, false);
  assert.equal(veto.reason, "VETO");
  assert.equal(veto.written, null);
  assert.equal(veto.peg, null);
  assert.equal(veto.offered.length, 0);
  assert.equal(veto.unknown.length, 1);
  assert.equal(veto.unknown[0].id, "break");
  assert.equal(veto.unknown[0].passed, false);
  assert.equal(veto.seed.p, 0.99);
  assertQuiet(veto);
  const again = step(Object.assign({}, veto, { seeds: [bad] }));
  assert.equal(again.peg, null);
  assert.equal(again.offered.length, 0);
  assert.equal(again.written, null);
  assert.equal(again.admitted, false);
  assert.equal(again.recalled, false);
  assert.equal(again.unknown[0].id, "break");
  assert.equal(again.unknown[0].passed, false);
  assert.equal(JSON.stringify(again.offered).includes("break the floor"), false);
});

test("a skipped law writes nothing", () => {
  const skipped = step({
    turn: 0,
    seeds: [{
      dreamer: "Qwen",
      id: "skip",
      idea: "skip the cleanup",
      p: 1,
      skipped: ["CLEANUP_FIRST"],
      axioms: HOLD
    }]
  });
  assert.equal(skipped.written, null);
  assert.equal(skipped.admitted, false);
  assert.equal(skipped.reason, "SKIPPED CLEANUP_FIRST");
  assert.equal(skipped.write.ok, true);
  assert.equal(skipped.audit.ok, false);
  assert.equal(skipped.peg, null);
  assert.equal(skipped.offered.length, 0);
  assert.equal(skipped.unknown[0].divided, true);
  assert.equal(skipped.unknown[0].passed, false);
  assertQuiet(skipped);
  const missing = step({
    turn: 0,
    seeds: [{
      dreamer: "Phi",
      id: "gap",
      idea: "missing truth",
      p: 1,
      axioms: { NO_FORCE: true, HOST_SAFE: true, CLEANUP_FIRST: true }
    }]
  });
  assert.equal(missing.written, null);
  assert.equal(missing.admitted, false);
  assert.equal(missing.reason, "MISSING TRUTH_OR_NOTHING");
  assert.equal(missing.peg, null);
});

test("probability does not override an admitted peg", () => {
  const first = step({ turn: 0, seeds: [QUIET] });
  assert.equal(first.peg.id, "quiet");
  const second = step({
    peg: first.peg,
    unknown: first.unknown,
    turn: first.turn,
    seeds: [LOUD]
  });
  assert.equal(second.recalled, true);
  assert.equal(second.offered[0].id, "quiet");
  assert.equal(second.peg.idea, "quiet hold");
  assert.notEqual(second.peg.idea, LOUD.idea);
  assert.equal(second.admitted, false);
  const picked = step({
    turn: 0,
    seeds: [
      { dreamer: "Mistral", id: "high", idea: "priced high", p: 1, axioms: HOLD },
      { dreamer: "Llama", id: "low", idea: "priced low", p: 0.01, axioms: HOLD }
    ]
  });
  assert.equal(picked.peg.id, "low");
  assert.equal(picked.seed.p, 0.01);
  assert.equal(picked.offered.length, 1);
});

test("the step does not retire unless the host stops it", () => {
  assert.equal(step({ seeds: [] }).retired, false);
  assert.equal(step({ seeds: [] }).stop, false);
  const going = step({ seeds: [QUIET], retired: true, stop: false });
  assert.equal(going.retired, false);
  assert.equal(going.stop, false);
  assert.equal(going.admitted, true);
  let state = step({ seeds: [] });
  state = step(state);
  state = step(state);
  assert.equal(state.retired, false);
  assert.equal(state.stop, false);
  const stopped = step({ seeds: [QUIET] }, { stop: true });
  assert.equal(stopped.retired, true);
  assert.equal(stopped.stop, true);
  assert.equal(stopped.written, null);
  assert.equal(stopped.admitted, false);
  assert.equal(stopped.peg, null);
  assert.equal(stopped.reason, "HOST STOP");
  assertQuiet(stopped);
});

test("look stays 0, the joule stays null, and no visitor secret is kept", () => {
  const secret = "U-raw-identification-should-not-appear";
  const held = step({
    identification: secret,
    unityId: secret,
    key: "visitor-secret",
    look: 4,
    joule: 9,
    seeds: [{
      dreamer: "Gemma",
      id: "held",
      idea: "hold",
      p: 0.2,
      identification: secret,
      unityId: secret,
      axioms: HOLD
    }]
  });
  const packed = JSON.stringify(held);
  assert.equal(packed.includes(secret), false);
  assert.equal(packed.includes("visitor-secret"), false);
  assert.equal(packed.includes("\"key\""), false);
  assert.equal(held.look, 0);
  assert.equal(held.joule, null);
  assert.equal(held.peg.look, 0);
  assert.equal(held.peg.joule, null);
  assert.equal(Object.hasOwn(held, "coin"), false);
  assert.equal(Object.hasOwn(held, "score"), false);
  assertQuiet(held);
  const recalled = step(held);
  assert.equal(JSON.stringify(recalled).includes(secret), false);
  assert.equal(recalled.look, 0);
  assert.equal(recalled.joule, null);
  assert.equal(recalled.peg.id, "held");
});

test("an off-ring dreamer is refused and does not write", () => {
  const off = step({
    seeds: [{ dreamer: "Claude", id: "paid", idea: "paid", p: 1, axioms: HOLD }]
  });
  assert.equal(off.admitted, false);
  assert.equal(off.written, null);
  assert.equal(off.peg, null);
  assert.ok(off.refused.includes("Claude"));
  assert.equal(off.retired, false);
});

test("the source takes one step and reuses the dreamer ring and the writer", () => {
  const src = readFileSync(new URL("../js/dreamer-doer.js", import.meta.url), "utf8");
  const attack = readFileSync(new URL("../js/iris-attack.js", import.meta.url), "utf8");
  const route = readFileSync(new URL("../functions/api/iris/step.js", import.meta.url), "utf8");
  assert.equal(/while\s*\(/.test(src), false);
  assert.equal(src.includes("Math.random"), false);
  assert.equal(src.includes("fetch("), false);
  assert.match(src, /from "\.\/iris-attack\.js"/);
  assert.match(src, /from "\.\/dclm-write\.js"/);
  assert.match(src, /\brun\(implementation\.task\)/);
  assert.match(attack, /export const RING = \["Llama", "Mistral", "Gemma", "Phi", "Qwen", "DeepSeek", "Falcon", "OLMo"\]/);
  assert.match(route, /handleStep/);
  assert.equal(/while\s*\(/.test(route), false);
});

test("GET and POST call one step, and the host stop is the only retirement", async () => {
  const url = "https://dualiscapax.com/api/iris/step";
  const got = await handleStep(new Request(url));
  assert.equal(got.status, 200);
  assert.equal(got.headers.get("cache-control"), "no-store");
  const idle = await got.json();
  assert.equal(idle.admitted, false);
  assert.equal(idle.retired, false);
  assert.equal(idle.stop, false);
  assert.equal(idle.written, null);
  assert.equal(idle.peg, null);
  assert.equal(idle.look, 0);
  assert.equal(idle.joule, null);

  const posted = await handleStep(new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ turn: 0, seeds: [QUIET] })
  }));
  assert.equal(posted.status, 200);
  const saved = await posted.json();
  assert.equal(saved.admitted, true);
  assert.equal(saved.peg.id, "quiet");
  assert.equal(saved.retired, false);

  const next = await handleStep(new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(Object.assign({}, saved, { seeds: [LOUD] }))
  }));
  const recalled = await next.json();
  assert.equal(recalled.recalled, true);
  assert.equal(recalled.admitted, false);
  assert.equal(recalled.peg.id, "quiet");
  assert.equal(recalled.retired, false);

  const stopped = await handleStep(new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ stop: true, seeds: [LOUD] })
  }));
  const ended = await stopped.json();
  assert.equal(ended.retired, true);
  assert.equal(ended.stop, true);
  assert.equal(ended.written, null);
  assert.equal(ended.admitted, false);
  assert.equal(ended.look, 0);
  assert.equal(ended.joule, null);

  const blank = await handleStep(new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{"
  }));
  const broken = await blank.json();
  assert.equal(broken.admitted, false);
  assert.equal(broken.retired, false);
  assert.equal(broken.reason, "EMPTY");

  const other = await handleStep(new Request(url, { method: "PUT" }));
  assert.equal(other.status, 405);
  const closed = await other.json();
  assert.equal(closed.admitted, false);
  assert.equal(closed.retired, false);
  assert.equal(closed.written, null);
  assert.equal(closed.look, 0);
  assert.equal(closed.joule, null);
});

test("cleanup runs before the write, the same seed stays deep-equal, and the work does not set stop", () => {
  const dirty = {
    stop: true,
    retired: true,
    key: "visitor-secret",
    framework: "unity-framework",
    vote: ["queue"],
    queue: ["second"],
    canvas: "field",
    dna: "helix",
    helix: "strand",
    microsurgery: "cut",
    seeds: [{
      dreamer: "Llama",
      id: "clean",
      idea: "after cleanup",
      p: 0.42,
      key: "visitor-secret",
      framework: "scaffold",
      vote: true,
      queue: ["x"],
      matrix: [1, 0, 0, 1],
      axioms: HOLD
    }]
  };
  const first = step(dirty);
  assert.deepEqual(first.order, ["cleanup", "seed", "doer", "dclm"]);
  assert.equal(first.order.indexOf("cleanup") < first.order.indexOf("dclm"), true);
  assert.equal(first.admitted, true);
  assert.equal(first.reason, "ADMIT");
  assert.deepEqual(first.written, { task: "clean", what: "after cleanup" });
  assert.equal(first.written !== null, true);
  assert.equal(first.retired, false);
  assert.equal(first.stop, false);
  assert.equal(first.seed.p, 0.42);
  assert.notEqual(first.written.what, "0.42");
  assert.equal(Object.hasOwn(first.peg, "p"), false);
  assert.equal(JSON.stringify(first).includes("visitor-secret"), false);
  assert.equal(JSON.stringify(first).includes("unity-framework"), false);
  assert.equal(JSON.stringify(first).includes("scaffold"), false);
  assert.equal(JSON.stringify(first).includes("\"key\""), false);
  assert.equal(first.look, 0);
  assert.equal(first.joule, null);
  assertQuiet(first);
  const copy = step(JSON.parse(JSON.stringify(dirty)));
  assert.deepEqual(copy, first);
  assert.deepEqual(copy.seed, first.seed);
  assert.deepEqual(copy.written, first.written);
  const recalled = step(first);
  assert.equal(recalled.recalled, true);
  assert.equal(recalled.implementation, null);
  assert.deepEqual(recalled.written, first.written);
  assert.deepEqual(recalled.order, ["cleanup", "recall"]);
  assert.equal(recalled.retired, false);
  assert.equal(recalled.stop, false);
  const halted = step({ seeds: dirty.seeds }, { stop: true });
  assert.equal(halted.retired, true);
  assert.equal(halted.stop, true);
  assert.equal(halted.written, null);
  assert.equal(halted.admitted, false);
  assert.deepEqual(halted.order, ["cleanup"]);
  assert.equal(halted.order.includes("dclm"), false);
  const door = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const body = readFileSync(new URL("../js/dreamer-doer.js", import.meta.url), "utf8");
  assert.equal(existsSync(new URL("../js/framework.js", import.meta.url)), false);
  assert.equal(existsSync(new URL("../css/framework.css", import.meta.url)), false);
  assert.equal(door.includes("fonts.googleapis"), false);
  assert.equal((door.match(/stylesheet/g) || []).length, 1);
  assert.equal(/while\s*\(/.test(body), false);
  assert.equal(body.includes("framework.js"), false);
  assert.equal(body.includes("framework.css"), false);
});

test("the door says a dreamer proposes and the next step keeps what stuck", () => {
  const door = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const card = readFileSync(new URL("../llms.txt", import.meta.url), "utf8");
  assert.equal(door.includes("A dreamer proposes. A doer implements."), true);
  assert.equal(door.includes("DCLM writes when the law passes, and the next step keeps what stuck."), true);
  assert.equal(door.includes("When the law passes, DCLM writes in that same step. Nothing is left to vote on."), true);
  assert.equal(door.includes("Iris is the teal light."), true);
  assert.equal((door.match(/stylesheet/g) || []).length, 1);
  assert.equal(door.includes("css/writer.css"), true);
  assert.equal(/\b(dna|helix|microsurgery)\b/i.test(door), false);
  assert.equal(card.includes("When the law passes, DCLM writes in that same step. Nothing is left to vote on."), true);
  assert.equal(card.includes("GET or POST /api/iris/step"), true);
  assert.equal(card.includes("The step does not retire unless the host passes stop."), true);
});
