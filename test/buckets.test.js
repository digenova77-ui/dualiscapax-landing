import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { OPEN_DECISION, published } from "../js/merit-align.js";
import { LAWS, run } from "../js/dclm-write.js";
import { BUCKETS, PIECES, affinity, bucketOf, friction, residueOf, smash } from "../js/buckets.js";

const HOLD = {
  NO_FORCE: true,
  HOST_SAFE: true,
  CLEANUP_FIRST: true,
  TRUTH_OR_NOTHING: true
};

function quiet(value) {
  assert.equal(value.look, 0);
  assert.equal(value.joule, null);
  assert.equal(Object.hasOwn(value, "key"), false);
  assert.equal(JSON.stringify(value).includes("\"key\""), false);
}

test("affinity binds a pair the law admits", () => {
  const pure = PIECES.filter(function (piece) {
    return piece.id === "efuse" || piece.id === "split";
  });
  const bound = affinity(pure);
  assert.equal(bound.binds.length, 1);
  assert.equal(bound.binds[0].law, "NO_FORCE");
  assert.equal(bound.pieces.length, 2);
  const record = run({
    id: "efuse+split",
    what: "NO_FORCE",
    axioms: HOLD
  });
  assert.equal(record.admitted, true);
  assert.equal(record.write.ok, true);
  assert.equal(record.audit.ok, true);
  assert.equal(record.write.pipe, "write");
  assert.equal(record.audit.pipe, "audit");
  assert.equal(record.look, 0);
  assert.equal(record.joule, null);
  const clash = affinity(PIECES.filter(function (piece) {
    return piece.id === "efuse" || piece.id === "field-canvas";
  }));
  assert.equal(clash.binds.length, 0);
});

test("friction knocks off a piece that looks pure and carries residue", () => {
  const vote = PIECES.find(function (piece) { return piece.id === "theater-vote"; });
  const record = run({ id: "theater-vote:rub", what: vote.text, axioms: HOLD });
  assert.equal(record.admitted, true);
  assert.deepEqual(residueOf(vote.text), ["vote", "theater"]);
  const rub = friction([vote, PIECES.find(function (piece) { return piece.id === "efuse"; })]);
  assert.equal(rub.fallen.length, 1);
  assert.equal(rub.fallen[0].id, "theater-vote");
  assert.equal(rub.fallen[0].bucket, "unknown");
  assert.equal(rub.kept.length, 1);
  assert.equal(rub.kept[0].id, "efuse");
});

test("the second affinity keeps only what still binds", () => {
  const result = smash();
  const left = new Set(result.left.map(function (piece) { return piece.id; }));
  const fallen = new Set(result.unknown.map(function (piece) { return piece.id; }));
  assert.equal(left.has("efuse"), true);
  assert.equal(left.has("theater-vote"), false);
  assert.equal(left.has("x402-rail"), false);
  assert.equal(left.has("explorer-passkey"), false);
  assert.equal(fallen.has("field-canvas"), false);
  for (let i = 0; i < result.second.binds.length; i++) {
    const row = result.second.binds[i];
    assert.equal(left.has(row.left), true);
    assert.equal(left.has(row.right), true);
    assert.equal(fallen.has(row.left), false);
    assert.equal(fallen.has(row.right), false);
    assert.equal(LAWS.includes(row.law), true);
  }
  assert.equal(result.second.binds.length > 0, true);
  assert.equal(result.left[0].id, "efuse");
  assert.equal(result.pin, "efuse");
});

test("unknown holds what fell and the live page does not show it", () => {
  const result = smash();
  const names = result.unknown.map(function (piece) { return piece.id; }).sort();
  assert.deepEqual(names, [
    "efuse-surgery",
    "explorer-passkey",
    "theater-rings",
    "theater-vote",
    "work-queue",
    "x402-rail"
  ]);
  for (let i = 0; i < result.unknown.length; i++) {
    assert.equal(result.unknown[i].bucket, "unknown");
    assert.equal(result.unknown[i].residue.length > 0, true);
  }
  const door = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const wallet = readFileSync(new URL("../wallet.html", import.meta.url), "utf8");
  const meeting = readFileSync(new URL("../meeting.html", import.meta.url), "utf8");
  const senses = readFileSync(new URL("../senses.html", import.meta.url), "utf8");
  const card = readFileSync(new URL("../llms.txt", import.meta.url), "utf8");
  const pages = [door, wallet, meeting, senses, card];
  for (let i = 0; i < result.unknown.length; i++) {
    for (let p = 0; p < pages.length; p++) {
      assert.equal(pages[p].includes(result.unknown[i].text), false, result.unknown[i].id);
    }
  }
  for (let i = 0; i < result.left.length; i++) {
    assert.equal(door.includes(result.left[i].text), true, result.left[i].id);
  }
  assert.equal(door.includes("microsurgery"), false);
  assert.equal(door.includes("passkey"), false);
  assert.equal(door.includes("USDC"), false);
  assert.equal(door.includes("theater"), false);
  assert.equal(card.includes("USDC"), false);
  assert.equal(senses.includes("theater"), false);
});

test("look stays 0, the joule stays null, and there is no key", () => {
  const result = smash();
  quiet(result);
  assert.equal(result.gate, "shut");
  assert.equal(result.efuse, 1);
  assert.equal(OPEN_DECISION.efuse, 1);
  assert.equal(published().joule, null);
  assert.equal(published().open, false);
  const buckets = bucketOf();
  assert.deepEqual(buckets.insula, []);
  assert.equal(BUCKETS.includes("unknown"), true);
  assert.equal(BUCKETS.includes("insula"), true);
  assert.equal(buckets["dreamer/doer"].includes("dreamer-role"), true);
  assert.equal(buckets["explorer keys"].includes("explorer-passkey"), true);
  assert.equal(result.unbound.includes("goggles"), true);
});
