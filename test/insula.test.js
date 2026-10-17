import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CEILING, FLOOR, SEED, seat } from "../js/brain-seat.js";
import { run } from "../js/dclm-write.js";
import { open } from "../js/insula.js";
import { pegOf } from "../js/unity-wallet.js";

const HOLD = {
  axioms: {
    NO_FORCE: true,
    HOST_SAFE: true,
    CLEANUP_FIRST: true,
    TRUTH_OR_NOTHING: true
  }
};

const RAW = "visitor-raw-identification";
const SECRET = "remember-this-secret";

function quiet(record) {
  assert.equal(record.look, 0);
  assert.equal(record.joule, null);
  assert.equal(record.seed, SEED);
  assert.equal(record.floor, FLOOR);
  assert.equal(record.ceiling, CEILING);
  assert.equal(Object.hasOwn(record, "key"), false);
  assert.equal(Object.hasOwn(record, "id"), false);
  assert.equal(Object.hasOwn(record, "identification"), false);
  assert.equal(Object.hasOwn(record, "vote"), false);
  assert.equal(Object.hasOwn(record, "written"), false);
  if (Object.hasOwn(record, "authority")) assert.equal(record.authority, "DCLM");
}

function noRaw(value, name) {
  const text = JSON.stringify(value);
  assert.equal(text.includes(RAW), false);
  assert.equal(text.includes(SECRET), false);
  if (name) assert.equal(text.includes(name), false);
  assert.equal(text.includes("\"key\""), false);
}

test("a nerve and a gland meet the brain only through the insula", async () => {
  const organ = open();
  const nerve = await organ.join({
    nerve: { sense: "touch" },
    ...HOLD,
    identification: RAW,
    id: RAW,
    key: SECRET,
    seed: 5,
    floor: 3,
    ceiling: 9
  });
  const gland = await organ.join({ gland: { change: "wake" }, ...HOLD });
  assert.equal(nerve.joined, true);
  assert.equal(gland.joined, true);
  assert.equal(nerve.admitted, true);
  assert.equal(gland.admitted, true);
  assert.equal(nerve.peg, await pegOf("nerve:touch"));
  assert.equal(gland.peg, await pegOf("gland:wake"));
  quiet(nerve);
  quiet(gland);
  assert.deepEqual(organ.corpus().map(function (row) { return row.peg; }), [nerve.peg, gland.peg]);
  for (const row of organ.corpus()) {
    quiet(row);
    assert.deepEqual(Object.keys(row).sort(), ["ceiling", "floor", "joule", "look", "peg", "seed", "step"]);
  }
  const outside = open();
  seat({ name: "touch", ...HOLD, readings: [1, 4] });
  run({ name: "wake", what: "wake", axioms: HOLD.axioms });
  assert.equal(outside.corpus().length, 0);
  assert.equal(outside.skip({ nerve: "touch", gland: "wake", ...HOLD }).joined, false);
  assert.equal(outside.corpus().length, 0);
});

test("a signal that skips the insula is absent from the corpus", async () => {
  const organ = open();
  const name = "hearing";
  const peg = await pegOf("nerve:" + name);
  run({ name: name, what: name, axioms: HOLD.axioms, identification: RAW });
  const skipped = organ.skip({ nerve: name, ...HOLD, identification: RAW, key: SECRET });
  assert.equal(skipped.joined, false);
  assert.equal(skipped.admitted, false);
  assert.equal(skipped.reason, "SKIP");
  assert.equal(skipped.peg, null);
  quiet(skipped);
  assert.equal(organ.corpus().length, 0);
  assert.equal(organ.unknown().length, 0);
  assert.equal(organ.corpus().some(function (row) { return row.peg === peg; }), false);
  noRaw(organ.corpus(), name);
  const held = await organ.join({ sense: name, ...HOLD });
  assert.equal(held.admitted, true);
  assert.equal(organ.corpus()[0].peg, peg);
});

test("a lawful signal is kept and a later step still has it", async () => {
  const organ = open();
  const first = await organ.join({ nerve: "balance", ...HOLD });
  const empty = await organ.join({ nerve: "   " });
  const veto = await organ.join({ gland: "flare", ...HOLD, veto: true });
  const second = await organ.join({ change: "settle", ...HOLD });
  assert.equal(first.admitted, true);
  assert.equal(second.admitted, true);
  assert.equal(empty.admitted, false);
  assert.equal(veto.admitted, false);
  assert.equal(organ.corpus().length, 2);
  assert.equal(organ.corpus()[0].peg, first.peg);
  assert.equal(organ.corpus()[0].step, first.step);
  assert.equal(organ.corpus()[1].peg, second.peg);
  assert.ok(organ.corpus()[0].step < organ.corpus()[1].step);
  assert.equal(organ.corpus().some(function (row) { return row.step === veto.step; }), false);
  assert.equal(organ.corpus()[0].peg, await pegOf("nerve:balance"));
  quiet(organ.corpus()[0]);
  quiet(organ.corpus()[1]);
});

test("a veto stays unknown and is not body", async () => {
  const organ = open();
  const name = "pain";
  const veto = await organ.join({
    nerve: name,
    ...HOLD,
    veto: true,
    admitted: true,
    identification: RAW,
    key: SECRET,
    look: 4,
    joule: 8
  });
  assert.equal(veto.admitted, false);
  assert.equal(veto.reason, "VETO");
  assert.equal(veto.peg, null);
  quiet(veto);
  assert.equal(organ.corpus().length, 0);
  assert.equal(organ.unknown().length, 1);
  assert.equal(organ.unknown()[0].reason, "VETO");
  assert.equal(organ.unknown()[0].step, veto.step);
  assert.equal(Object.hasOwn(organ.unknown()[0], "peg"), false);
  quiet(organ.unknown()[0]);
  noRaw(organ.corpus(), name);
  noRaw(organ.unknown(), name);

  const axioms = { ...HOLD.axioms };
  delete axioms.CLEANUP_FIRST;
  const missing = await organ.join({ gland: "drift", axioms: axioms });
  assert.equal(missing.admitted, false);
  assert.equal(missing.reason, "MISSING CLEANUP_FIRST");
  assert.equal(organ.corpus().length, 0);
  assert.equal(organ.unknown()[1].reason, "MISSING CLEANUP_FIRST");

  const skipped = await organ.join({ nerve: "itch", ...HOLD, skipped: ["HOST_SAFE"] });
  assert.equal(skipped.admitted, false);
  assert.equal(skipped.reason, "SKIPPED HOST_SAFE");
  assert.equal(organ.corpus().length, 0);
  assert.equal(organ.unknown()[2].reason, "SKIPPED HOST_SAFE");
  assert.equal(organ.unknown().every(function (row) { return Object.hasOwn(row, "peg") === false; }), true);
});

test("one step adds at most one signal and an empty signal adds nothing", async () => {
  const organ = open();
  const before = organ.corpus().length;
  const both = await organ.join({ nerve: "sight", gland: "cool", ...HOLD });
  assert.equal(both.admitted, false);
  assert.equal(both.reason, "STEP");
  assert.ok(organ.corpus().length - before <= 1);
  assert.equal(organ.corpus().length, before);
  assert.equal(organ.unknown().length, 1);
  assert.equal(Object.hasOwn(organ.unknown()[0], "peg"), false);

  const many = await organ.join({ nerve: ["warm", "cold"], ...HOLD });
  assert.equal(many.reason, "STEP");
  assert.equal(organ.corpus().length, 0);

  const unknownBefore = organ.unknown().length;
  for (const input of [null, undefined, {}, { nerve: "" }, { gland: "  " }, { axioms: HOLD.axioms }, { identification: RAW, key: SECRET }]) {
    const held = await organ.join(input);
    assert.equal(held.admitted, false);
    assert.equal(held.reason, "EMPTY");
    assert.equal(held.step, null);
    quiet(held);
  }
  assert.equal(organ.corpus().length, 0);
  assert.equal(organ.unknown().length, unknownBefore);
  noRaw(organ.corpus());
  noRaw(organ.unknown());

  const one = await organ.join({ nerve: "sight", ...HOLD, step: 99 });
  assert.equal(one.admitted, true);
  assert.equal(organ.corpus().length, 1);
  assert.equal(organ.corpus()[0].step, one.step);
  assert.notEqual(organ.corpus()[0].step, 99);
});

test("the corpus keeps every admitted signal and drops none", async () => {
  const organ = open();
  const names = ["north", "east", "south"];
  const pegs = [];
  for (let i = 0; i < names.length; i++) {
    const held = await organ.join({ nerve: names[i], ...HOLD });
    assert.equal(held.admitted, true);
    pegs.push(held.peg);
  }
  const again = await organ.join({ nerve: "north", ...HOLD });
  assert.equal(again.admitted, true);
  assert.equal(again.peg, pegs[0]);
  assert.equal(again.step, organ.corpus()[0].step);
  assert.equal(organ.corpus().length, 3);
  assert.deepEqual(organ.corpus().map(function (row) { return row.peg; }), pegs);
  assert.equal(organ.corpus()[0].peg, again.peg);
  const text = JSON.stringify(organ.corpus());
  for (let i = 0; i < names.length; i++) assert.equal(text.includes(names[i]), false);
});

test("a dreamer does not write the corpus", async () => {
  const organ = open();
  const veto = await organ.join({
    dreamer: "Llama",
    nerve: "sight",
    ...HOLD,
    veto: true,
    admitted: true,
    identification: RAW,
    key: SECRET
  });
  assert.equal(veto.admitted, false);
  assert.equal(veto.reason, "VETO");
  assert.equal(veto.joined, true);
  quiet(veto);
  assert.equal(organ.corpus().length, 0);
  assert.equal(organ.unknown().length, 1);
  assert.equal(organ.unknown()[0].reason, "VETO");
  noRaw(organ.corpus(), "sight");
  noRaw(organ.unknown(), "Llama");

  const off = await organ.join({ dreamer: "Claude", nerve: "sight", ...HOLD });
  assert.equal(off.admitted, false);
  assert.equal(organ.corpus().length, 0);
  noRaw(organ.corpus(), "Claude");
  noRaw(organ.unknown(), "Claude");

  const held = await organ.join({
    dreamer: "Gemma",
    gland: "wake",
    ...HOLD,
    identification: RAW,
    key: SECRET
  });
  assert.equal(held.admitted, true);
  assert.equal(held.joined, true);
  assert.equal(held.peg, await pegOf("gland:wake"));
  quiet(held);
  assert.equal(organ.corpus().length, 1);
  noRaw(organ.corpus(), "wake");
  noRaw(organ.corpus(), "Gemma");
  noRaw(held, "wake");

  const again = await organ.join({ dreamer: "Phi", nerve: "balance", ...HOLD });
  assert.equal(again.admitted, false);
  assert.equal(again.reason, "RECALL");
  assert.equal(organ.corpus().length, 1);
  assert.equal(organ.corpus()[0].peg, held.peg);
});

test("a client cannot force look, joule, or a raw id into the corpus", async () => {
  const organ = open();
  const forced = await organ.join({
    nerve: "pressure",
    axioms: { NO_FORCE: true },
    admitted: true,
    authority: "client",
    force: true,
    look: 2,
    joule: 6,
    key: SECRET,
    identification: RAW,
    written: { task: "forged" }
  });
  assert.equal(forced.admitted, false);
  assert.equal(forced.reason, "MISSING HOST_SAFE");
  assert.equal(forced.look, 0);
  assert.equal(forced.joule, null);
  assert.equal(organ.corpus().length, 0);
  quiet(forced);
  noRaw(organ.unknown(), "pressure");
  const held = await organ.join({
    gland: "still",
    laws: HOLD.axioms,
    admitted: false,
    look: 7,
    joule: 1,
    key: SECRET,
    identification: RAW
  });
  assert.equal(held.admitted, true);
  assert.equal(held.look, 0);
  assert.equal(held.joule, null);
  assert.equal(Object.hasOwn(held, "key"), false);
  assert.equal(organ.corpus().length, 1);
  noRaw(organ.corpus(), "still");
  noRaw(held, "still");
});

test("the door says the insula and the corpus in two plain sentences", () => {
  const sentence = "The insula joins brain, nerve, and gland.";
  const body = "Corpus Maximus keeps every signal the law admits, and drops none.";
  const door = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const senses = readFileSync(new URL("../senses.html", import.meta.url), "utf8");
  const card = readFileSync(new URL("../llms.txt", import.meta.url), "utf8");
  assert.equal(door.includes(sentence), true);
  assert.equal(door.includes(body), true);
  assert.equal(senses.includes(sentence), true);
  assert.equal(senses.includes(body), true);
  assert.equal(card.includes(sentence), true);
  assert.equal(card.includes(body), true);
  assert.equal(door.includes("css/writer.css"), true);
  assert.equal((door.match(/stylesheet/g) || []).length, 1);
  assert.equal(/\b(dna|helix|microsurgery)\b/i.test(door), false);
});
