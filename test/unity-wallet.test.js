import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { pegOf, record } from "../js/unity-wallet.js";

const ABC = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
const EMPTY_HASH = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

function hashes(value) {
  return JSON.stringify(value).match(/[0-9a-f]{64}/g) || [];
}

test("one peg only, and the same identification keeps that peg", async () => {
  const first = await record("visitor");
  const again = await record("visitor");
  assert.equal(first.peg, await pegOf("visitor"));
  assert.equal(again.peg, first.peg);
  assert.match(first.peg, /^[0-9a-f]{64}$/);
  assert.equal(first.peg.length, 64);
  assert.equal(hashes(first).length, 1);
  assert.equal(hashes(first)[0], first.peg);
  assert.deepEqual(Object.keys(first), ["peg", "iris", "look", "joule"]);
  assert.equal(await pegOf("abc"), ABC);
  assert.notEqual(await pegOf("visitor"), await pegOf("Iris"));
  assert.notEqual(first.peg, await pegOf("Iris"));
});

test("Iris is on that peg when the identification is present", async () => {
  const held = await record("visitor");
  assert.equal(held.peg !== null, true);
  assert.equal(held.iris, "Iris");
  assert.equal(held.look, 0);
  assert.equal(held.joule, null);
  const named = await record({ identification: "  visitor  ", look: 4, joule: 9 });
  assert.equal(named.peg, held.peg);
  assert.equal(named.iris, "Iris");
  assert.equal(named.look, 0);
  assert.equal(named.joule, null);
});

test("Iris is not pegged when the identification is empty", async () => {
  const blanks = ["", "   ", "\n\t", null, undefined, 0, false, {}, { identification: "  " }, { id: "visitor" }];
  for (const identification of blanks) {
    const held = await record(identification);
    assert.equal(held.peg, null);
    assert.equal(held.iris, null);
    assert.equal(held.look, 0);
    assert.equal(held.joule, null);
    assert.notEqual(held.peg, EMPTY_HASH);
    assert.equal(hashes(held).length, 0);
  }
  assert.equal(await pegOf(""), null);
  assert.equal(await pegOf("   "), null);
});

test("the raw identification is absent and there is no key field", async () => {
  const secret = "U-raw-identification-should-not-appear";
  const held = await record({ identification: secret, look: 1, joule: 2 });
  const packed = JSON.stringify(held);
  assert.equal(packed.includes(secret), false);
  assert.equal(packed.includes("U-raw"), false);
  assert.equal(Object.hasOwn(held, "key"), false);
  assert.equal(Object.hasOwn(held, "keys"), false);
  assert.equal(packed.includes("key"), false);
  assert.equal(held.look, 0);
  assert.equal(held.joule, null);
  assert.equal(held.iris, "Iris");
  assert.equal(held.peg, await pegOf(secret));
});

test("the wallet surface says the peg in plain sentences", () => {
  const page = readFileSync(new URL("../wallet.html", import.meta.url), "utf8");
  const door = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const sentences = [
    "You have your Universal identification and your wallet.",
    "Nothing to remember.",
    "The identification is hashed, and that hash is the peg to permanent memory about you.",
    "Iris is pegged to the same permanence."
  ];
  for (const sentence of sentences) {
    assert.equal(page.includes(sentence), true);
    assert.equal(door.includes(sentence), true);
  }
  assert.equal(/\bkey\b/i.test(page), false);
  assert.equal(/memorize|copy this|copy the|remember (this|your|the|a)\b/i.test(page), false);
  assert.equal(/\b(dna|helix|microsurgery)\b/i.test(page), false);
  const source = readFileSync(new URL("../js/unity-wallet.js", import.meta.url), "utf8");
  assert.equal(/\bkey\b/i.test(source), false);
  assert.equal(source.split("digest(").length - 1, 1);
});
