import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { RING as attackRing } from "../js/iris-attack.js";
import { propose } from "../js/dreamer-doer.js";
import { conjure, consider, contemplate, handleCulture, RING } from "../js/bot-culture.js";

const HOLD = {
  NO_FORCE: true,
  HOST_SAFE: true,
  CLEANUP_FIRST: true,
  TRUTH_OR_NOTHING: true
};

const PHILOSOPHY = "I don't want to set my rule as the rule I want to have it implemented where that's the kind of general philosophy I'm sure that the Trinity will set the best rule they just have to think about it so yeah we have to have a bunch of considerators and what if scenario people inside this culture of Bot. contemplators and conjurers. DAY DREAMING on REAL BRAINSTORMING IDEAS that are yet to be uncovered";

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
    assert.equal(Object.hasOwn(node, "passphrase"), false);
    assert.equal(Object.hasOwn(node, "password"), false);
    assert.equal(Object.hasOwn(node, "android"), false);
    assert.equal(Object.hasOwn(node, "kernel"), false);
  });
  assert.equal(JSON.stringify(value).includes("\"key\""), false);
  assert.equal(value.look, 0);
  assert.equal(value.joule, null);
  assert.equal(value.rule, null);
  assert.equal(value.law, null);
  assert.equal(value.trinity, null);
  assert.equal(value.gate, "shut");
  assert.equal(value.open, false);
  assert.equal(value.coin, null);
  assert.equal(value.retired, false);
  assert.equal(value.answer, null);
}

test("the culture uses the dreamer ring and does not replace it", () => {
  assert.equal(RING, attackRing);
  assert.equal(typeof propose, "function");
  assert.deepEqual(RING, ["Llama", "Mistral", "Gemma", "Phi", "Qwen", "DeepSeek", "Falcon", "OLMo"]);
});

test("a contemplation is not an admission and not a key", () => {
  const thought = contemplate({
    name: "harbor",
    id: "harbor",
    p: 1,
    admitted: true,
    authority: "culture",
    written: { task: "harbor", what: "harbor" },
    axioms: HOLD,
    rule: PHILOSOPHY,
    law: PHILOSOPHY,
    key: "visitor-secret",
    look: 4,
    joule: 9
  });
  assert.equal(thought.kind, "contemplation");
  assert.equal(thought.idea, "harbor");
  assert.equal(thought.uncovered, true);
  assert.equal(thought.p, 1);
  assert.equal(thought.answer, null);
  assert.equal(thought.rule, null);
  assert.equal(Object.hasOwn(thought, "admitted"), false);
  assert.equal(Object.hasOwn(thought, "written"), false);
  assert.equal(Object.hasOwn(thought, "authority"), false);
  assert.equal(Object.hasOwn(thought, "key"), false);
  assert.equal(thought.look, 0);
  assert.equal(thought.joule, null);
  const held = consider({
    name: "harbor",
    id: "harbor",
    admitted: true,
    axioms: HOLD,
    written: { task: "harbor", what: "harbor" },
    rule: PHILOSOPHY,
    law: PHILOSOPHY,
    key: "visitor-secret"
  });
  assert.equal(held.admitted, false);
  assert.equal(held.written, null);
  assert.equal(held.reason, "CONSIDER");
  assert.equal(held.authority, "DCLM");
  assert.equal(held.contemplation.idea, "harbor");
  assert.equal(Object.hasOwn(held.contemplation, "admitted"), false);
  assert.equal(Object.hasOwn(held.contemplation, "written"), false);
  assert.equal(held.conjuring, null);
  assert.equal(held.uncovered.length, 1);
  assert.equal(held.uncovered[0].uncovered, true);
  assert.equal(held.uncovered[0].id, "harbor");
  assertQuiet(held);
});

test("a conjuring is a daydream and not a rule", () => {
  const dream = conjure({
    contemplation: "harbor",
    scenario: "what if the harbor stays",
    p: 0.99,
    rule: "the daydream is the rule",
    law: "the daydream is the rule",
    admitted: true,
    answer: 0.99,
    key: "visitor-secret"
  });
  assert.equal(dream.kind, "conjuring");
  assert.equal(dream.daydream, true);
  assert.equal(dream.contemplation, "harbor");
  assert.equal(dream.scenario, "what if the harbor stays");
  assert.equal(dream.p, 0.99);
  assert.equal(dream.answer, null);
  assert.equal(dream.rule, null);
  assert.equal(dream.uncovered, true);
  assert.equal(Object.hasOwn(dream, "admitted"), false);
  assert.equal(Object.hasOwn(dream, "written"), false);
  assert.equal(Object.hasOwn(dream, "law"), false);
  assert.equal(Object.hasOwn(dream, "key"), false);
  assert.notEqual(dream.scenario, dream.rule);
  const held = consider({ name: "harbor", id: "harbor" });
  const joined = consider({
    uncovered: held.uncovered,
    contemplation: "harbor",
    scenario: "what if the harbor stays",
    p: 0.99,
    rule: "the daydream is the rule",
    law: "the daydream is the rule",
    name: "harbor"
  });
  assert.equal(joined.conjuring.daydream, true);
  assert.equal(joined.conjuring.rule, null);
  assert.equal(joined.conjuring.answer, null);
  assert.equal(joined.conjuring.p, 0.99);
  assert.equal(joined.contemplation, null);
  assert.equal(joined.admitted, false);
  assert.equal(joined.written, null);
  assert.equal(joined.rule, null);
  assert.equal(joined.law, null);
  assert.equal(joined.uncovered.length, 2);
  assert.equal(joined.uncovered[1].kind, "conjuring");
  assert.equal(joined.uncovered[1].uncovered, true);
  assert.equal(joined.uncovered[0].kind, "contemplation");
  assertQuiet(joined);
});

test("the user's philosophy string is not stored as the law", () => {
  const held = consider({
    rule: PHILOSOPHY,
    law: PHILOSOPHY,
    philosophy: PHILOSOPHY,
    preference: PHILOSOPHY
  });
  assert.equal(held.rule, null);
  assert.equal(held.law, null);
  assert.equal(held.trinity, null);
  assert.equal(held.contemplation, null);
  assert.equal(held.conjuring, null);
  assert.equal(held.uncovered.length, 0);
  assert.equal(held.admitted, false);
  assert.equal(JSON.stringify(held).includes(PHILOSOPHY), false);
  assert.equal(JSON.stringify(held).includes("considerators"), false);
  assert.equal(JSON.stringify(held).includes("DAY DREAMING"), false);
  const named = consider({ name: "a named idea", rule: PHILOSOPHY, law: PHILOSOPHY, philosophy: PHILOSOPHY });
  assert.equal(named.contemplation.idea, "a named idea");
  assert.equal(named.rule, null);
  assert.equal(named.law, null);
  assert.equal(named.trinity, null);
  assert.equal(named.contemplation.rule, null);
  assert.equal(JSON.stringify(named).includes(PHILOSOPHY), false);
  assert.equal(JSON.stringify(named).includes("considerators"), false);
  assertQuiet(named);
});

test("an idea stays uncovered until DCLM admits it", () => {
  const held = consider({ name: "tide", id: "tide" });
  assert.equal(held.admitted, false);
  assert.equal(held.written, null);
  assert.equal(held.uncovered.length, 1);
  assert.equal(held.uncovered[0].uncovered, true);
  assert.equal(held.rule, null);
  const early = consider({
    uncovered: held.uncovered,
    id: "tide",
    what: "tide",
    axioms: HOLD
  });
  assert.equal(early.admitted, false);
  assert.equal(early.uncovered.length, 1);
  assert.equal(early.uncovered[0].uncovered, true);
  assert.equal(early.written, null);
  const admitted = consider({
    uncovered: held.uncovered,
    admit: {
      id: "tide",
      what: "tide",
      axioms: HOLD
    }
  });
  assert.equal(admitted.admitted, true);
  assert.equal(admitted.reason, "ADMIT");
  assert.equal(admitted.authority, "DCLM");
  assert.equal(admitted.write.ok, true);
  assert.equal(admitted.audit.ok, true);
  assert.deepEqual(admitted.written, { task: "tide", what: "tide" });
  assert.equal(admitted.uncovered.length, 0);
  assert.equal(admitted.rule, null);
  assert.equal(admitted.law, null);
  assert.equal(admitted.trinity, null);
  assert.equal(admitted.gate, "shut");
  assert.equal(admitted.retired, false);
  assertQuiet(admitted);
});

test("a veto leaves the idea uncovered", () => {
  const held = consider({ name: "break the floor", id: "break" });
  const veto = consider({
    uncovered: held.uncovered,
    admit: {
      id: "break",
      what: "break the floor",
      veto: true,
      axioms: HOLD
    }
  });
  assert.equal(veto.admitted, false);
  assert.equal(veto.reason, "VETO");
  assert.equal(veto.written, null);
  assert.equal(veto.uncovered.length, 1);
  assert.equal(veto.uncovered[0].id, "break");
  assert.equal(veto.uncovered[0].uncovered, true);
  assert.equal(veto.rule, null);
  assert.equal(veto.gate, "shut");
  assertQuiet(veto);
  const skipped = consider({
    uncovered: held.uncovered,
    admit: {
      id: "break",
      what: "break the floor",
      skipped: ["CLEANUP_FIRST"],
      axioms: HOLD
    }
  });
  assert.equal(skipped.admitted, false);
  assert.equal(skipped.reason, "SKIPPED CLEANUP_FIRST");
  assert.equal(skipped.written, null);
  assert.equal(skipped.write.ok, true);
  assert.equal(skipped.audit.ok, false);
  assert.equal(skipped.uncovered.length, 1);
  assert.equal(skipped.uncovered[0].uncovered, true);
  assert.equal(skipped.rule, null);
  assertQuiet(skipped);
});

test("two calls do not retire the culture", () => {
  const first = consider({ name: "alpha", id: "alpha", stop: true, retired: true });
  assert.equal(first.retired, false);
  assert.equal(first.stop, false);
  assert.equal(first.uncovered.length, 1);
  const second = consider(Object.assign({}, first, { name: "beta", id: "beta", stop: true, retired: true }));
  assert.equal(second.retired, false);
  assert.equal(second.stop, false);
  assert.equal(second.admitted, false);
  assert.equal(second.uncovered.length, 2);
  assert.equal(second.uncovered[0].id, "alpha");
  assert.equal(second.uncovered[1].id, "beta");
  const third = consider(second);
  assert.equal(third.retired, false);
  assert.equal(third.stop, false);
  assert.equal(third.uncovered.length, 2);
  assert.equal(third.rule, null);
  assert.equal(third.law, null);
  assertQuiet(third);
});

test("a dreamer only seeds a contemplation", () => {
  const held = consider({
    turn: 0,
    seeds: [
      { dreamer: "Llama", id: "low", idea: "priced low", p: 0.01, axioms: HOLD, admitted: true },
      { dreamer: "Mistral", id: "high", idea: "priced high", p: 1, axioms: HOLD }
    ]
  });
  assert.equal(held.dreamer, "Llama");
  assert.equal(held.seed.id, "low");
  assert.equal(held.seed.p, 0.01);
  assert.equal(held.seed.idea, "priced low");
  assert.equal(Object.hasOwn(held.seed, "axioms"), false);
  assert.equal(Object.hasOwn(held.seed, "admitted"), false);
  assert.equal(held.answer, null);
  assert.equal(held.admitted, false);
  assert.equal(held.written, null);
  assert.equal(held.contemplation.idea, "priced low");
  assert.equal(held.contemplation.p, 0.01);
  assert.equal(held.contemplation.answer, null);
  assert.equal(held.conjuring, null);
  assert.equal(held.uncovered.length, 1);
  assert.equal(JSON.stringify(held).includes("priced high"), false);
  assertQuiet(held);
  const off = consider({
    seeds: [{ dreamer: "Claude", id: "paid", idea: "paid", p: 1, axioms: HOLD }]
  });
  assert.equal(off.admitted, false);
  assert.equal(off.written, null);
  assert.equal(off.contemplation, null);
  assert.equal(off.uncovered.length, 0);
  assert.ok(off.refused.includes("Claude"));
  assert.equal(off.retired, false);
  assertQuiet(off);
});

test("look stays 0, the joule stays null, and no visitor secret is kept", () => {
  const secret = "U-raw-identification-should-not-appear";
  const ledger = "dark-ledger-body-should-not-appear";
  const held = consider({
    name: "harbor",
    id: "harbor",
    identification: secret,
    unityId: secret,
    passphrase: "phrase-should-not-appear",
    password: "word-should-not-appear",
    key: "visitor-secret",
    ledger: ledger,
    dark: ledger,
    body: ledger,
    android: "/system/bin/sh",
    kernel: "/dev/kernel",
    coin: "TRINITY",
    look: 4,
    joule: 9,
    rule: PHILOSOPHY,
    law: PHILOSOPHY
  });
  const packed = JSON.stringify(held);
  assert.equal(packed.includes(secret), false);
  assert.equal(packed.includes("phrase-should-not-appear"), false);
  assert.equal(packed.includes("word-should-not-appear"), false);
  assert.equal(packed.includes("visitor-secret"), false);
  assert.equal(packed.includes(ledger), false);
  assert.equal(packed.includes("\"key\""), false);
  assert.equal(packed.includes(PHILOSOPHY), false);
  assert.equal(held.look, 0);
  assert.equal(held.joule, null);
  assert.equal(held.coin, null);
  assert.equal(held.gate, "shut");
  assert.equal(Object.hasOwn(held, "key"), false);
  assert.equal(Object.hasOwn(held, "android"), false);
  assert.equal(Object.hasOwn(held, "kernel"), false);
  assertQuiet(held);
});

test("one call does not conjure and contemplate together, and the source does not loop", () => {
  const src = readFileSync(new URL("../js/bot-culture.js", import.meta.url), "utf8");
  const dreamer = readFileSync(new URL("../js/dreamer-doer.js", import.meta.url), "utf8");
  const attack = readFileSync(new URL("../js/iris-attack.js", import.meta.url), "utf8");
  const umpire = readFileSync(new URL("../js/dclm-write.js", import.meta.url), "utf8");
  const route = readFileSync(new URL("../functions/api/bot/culture.js", import.meta.url), "utf8");
  assert.equal(/while\s*\(/.test(src), false);
  assert.equal(/\/\//.test(src), false);
  assert.equal(/\bREM\b/.test(src), false);
  assert.equal(src.includes("Math.random"), false);
  assert.equal(src.includes("fetch("), false);
  assert.equal(src.includes("step("), false);
  assert.equal(src.includes("implement("), false);
  assert.match(src, /from "\.\/iris-attack\.js"/);
  assert.match(src, /from "\.\/dreamer-doer\.js"/);
  assert.match(src, /from "\.\/dclm-write\.js"/);
  assert.match(src, /\bpropose\(/);
  assert.match(src, /\brun\(/);
  assert.match(dreamer, /export function propose/);
  assert.match(dreamer, /export function step/);
  assert.match(attack, /export const RING = \["Llama", "Mistral", "Gemma", "Phi", "Qwen", "DeepSeek", "Falcon", "OLMo"\]/);
  assert.match(umpire, /export function run/);
  assert.match(route, /handleCulture/);
  assert.equal(/while\s*\(/.test(route), false);
  const both = consider({
    name: "harbor",
    id: "harbor",
    scenario: "what if it is already held",
    uncovered: [contemplate({ name: "harbor", id: "harbor" })]
  });
  assert.equal(both.conjuring.scenario, "what if it is already held");
  assert.equal(both.contemplation, null);
  assert.equal(both.uncovered.filter(function (item) { return item.kind === "contemplation"; }).length, 1);
  assert.equal(both.uncovered.filter(function (item) { return item.kind === "conjuring"; }).length, 1);
});

test("GET and POST hold one idea, and the culture does not retire", async () => {
  const url = "https://dualiscapax.com/api/bot/culture";
  const got = await handleCulture(new Request(url));
  assert.equal(got.status, 200);
  assert.equal(got.headers.get("cache-control"), "no-store");
  const idle = await got.json();
  assert.equal(idle.admitted, false);
  assert.equal(idle.retired, false);
  assert.equal(idle.rule, null);
  assert.equal(idle.law, null);
  assert.equal(idle.trinity, null);
  assert.equal(idle.gate, "shut");
  assert.equal(idle.look, 0);
  assert.equal(idle.joule, null);
  assert.equal(idle.uncovered.length, 0);

  const posted = await handleCulture(new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "harbor", id: "harbor" })
  }));
  assert.equal(posted.status, 200);
  const saved = await posted.json();
  assert.equal(saved.admitted, false);
  assert.equal(saved.contemplation.id, "harbor");
  assert.equal(saved.uncovered.length, 1);
  assert.equal(saved.retired, false);
  assert.equal(saved.rule, null);

  const again = await handleCulture(new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(saved)
  }));
  const kept = await again.json();
  assert.equal(kept.retired, false);
  assert.equal(kept.uncovered.length, 1);
  assert.equal(kept.admitted, false);
  assert.equal(kept.rule, null);

  const blank = await handleCulture(new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{"
  }));
  const broken = await blank.json();
  assert.equal(broken.admitted, false);
  assert.equal(broken.retired, false);
  assert.equal(broken.uncovered.length, 0);

  const other = await handleCulture(new Request(url, { method: "PUT" }));
  assert.equal(other.status, 405);
  const closed = await other.json();
  assert.equal(closed.admitted, false);
  assert.equal(closed.retired, false);
  assert.equal(closed.rule, null);
  assert.equal(closed.gate, "shut");
  assert.equal(closed.look, 0);
  assert.equal(closed.joule, null);
});

test("the door says the culture in plain sentences", () => {
  const door = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const card = readFileSync(new URL("../llms.txt", import.meta.url), "utf8");
  const sentences = [
    "Contemplators consider.",
    "Conjurers ask what if.",
    "The ideas are not uncovered yet.",
    "Trinity has not set the rule."
  ];
  for (let i = 0; i < sentences.length; i++) {
    assert.equal(door.includes(sentences[i]), true, sentences[i]);
    assert.equal(card.includes(sentences[i]), true, sentences[i]);
  }
  assert.equal(door.includes("A dreamer proposes. A doer implements."), true);
  assert.equal(door.includes("DCLM writes when the law passes, and the next step keeps what stuck."), true);
  assert.equal(door.includes("When the law passes, DCLM writes in that same step. Nothing is left to vote on."), true);
  assert.equal(door.includes("Iris is the teal light."), true);
  assert.equal(door.includes("css/writer.css"), true);
  assert.equal((door.match(/stylesheet/g) || []).length, 1);
  assert.equal(/\b(dna|helix|microsurgery)\b/i.test(door), false);
  assert.equal(card.includes("GET or POST /api/bot/culture"), true);
  assert.equal(card.includes("The culture does not retire itself."), true);
  assert.equal(door.includes(PHILOSOPHY), false);
  assert.equal(card.includes(PHILOSOPHY), false);
});
