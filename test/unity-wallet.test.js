import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { empty, handleWallet, peg, remember } from "../js/unity-wallet.js";

const SAME = "visitor-universal-same";
const OTHER = "visitor-universal-other";

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

function assertNoKey(value) {
  walk(value, function (node) {
    if (!node || typeof node !== "object") return;
    assert.equal(Object.hasOwn(node, "key"), false);
  });
  assert.equal(JSON.stringify(value).includes("\"key\""), false);
}

function assertQuiet(value) {
  assert.equal(value.look, 0);
  assert.equal(value.joule, null);
  assertNoKey(value);
  for (let i = 0; i < value.log.length; i++) {
    assert.equal(value.log[i].look, 0);
    assert.equal(value.log[i].joule, null);
    assert.equal(value.log[i].remembers, true);
    assert.equal(Object.hasOwn(value.log[i], "identification"), false);
  }
}

test("the same identification always yields the same peg", () => {
  const first = peg(SAME);
  const second = peg("  " + SAME + "  ");
  const digest = createHash("sha256").update(SAME, "utf8").digest("hex");
  assert.equal(first, digest);
  assert.equal(first, second);
  assert.equal(first, peg(SAME));
  assert.equal(typeof first, "string");
  assert.equal(first.length, 64);
  assert.equal(first, first.toLowerCase());
  assert.match(first, /^[0-9a-f]{64}$/);
  assert.equal(peg("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});

test("a different identification yields a different peg", () => {
  assert.notEqual(peg(SAME), peg(OTHER));
  assert.notEqual(peg("abc"), peg("abd"));
});

test("an empty identification yields no peg", () => {
  for (const value of ["", "   ", "\n\t", null, undefined, 0, false, {}, []]) {
    assert.equal(peg(value), null);
  }
  const blank = remember(empty(), "");
  assert.equal(blank.peg, null);
  assert.equal(blank.step, 0);
  assert.equal(blank.log.length, 0);
  assertQuiet(blank);
});

test("memory keeps the peg and not the raw identification", () => {
  const first = remember(empty(), SAME);
  assert.equal(first.peg, peg(SAME));
  assert.equal(first.step, 1);
  assert.equal(first.log.length, 1);
  assert.equal(first.log[0].peg, peg(SAME));
  assert.equal(first.log[0].step, 1);
  assert.equal(first.log[0].remembers, true);
  assert.equal(JSON.stringify(first).includes(SAME), false);
  assertQuiet(first);

  const second = remember({
    log: first.log,
    step: 0,
    peg: null,
    look: 1,
    joule: 4,
    key: "drop",
    identification: SAME
  }, OTHER);
  assert.equal(second.log.length, 2);
  assert.equal(second.log[0].peg, first.log[0].peg);
  assert.equal(second.log[0].step, 1);
  assert.equal(second.log[1].peg, peg(OTHER));
  assert.equal(second.log[1].step, 2);
  assert.equal(second.peg, peg(OTHER));
  assert.equal(second.step, 2);
  assert.equal(JSON.stringify(second).includes(SAME), false);
  assert.equal(JSON.stringify(second).includes(OTHER), false);
  assertQuiet(second);

  const later = remember(second, "   ");
  assert.equal(later.log.length, 2);
  assert.equal(later.log[0].peg, first.log[0].peg);
  assert.equal(later.log[1].peg, second.log[1].peg);
  assert.equal(later.peg, second.peg);
  assert.equal(later.step, 2);
  assertQuiet(later);
});

test("the wallet request keeps the peg and leaves look and joule alone", async () => {
  const idle = await handleWallet(new Request("https://dualiscapax.com/api/unity/wallet"));
  assert.equal(idle.status, 200);
  assert.equal(idle.headers.get("cache-control"), "no-store");
  const open = await idle.json();
  assert.equal(open.peg, null);
  assert.equal(open.log.length, 0);
  assertQuiet(open);

  const posted = await handleWallet(new Request("https://dualiscapax.com/api/unity/wallet", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      identification: SAME,
      look: 1,
      joule: 5,
      key: "nope"
    })
  }));
  const held = await posted.json();
  assert.equal(held.peg, peg(SAME));
  assert.equal(JSON.stringify(held).includes(SAME), false);
  assertQuiet(held);

  const again = await handleWallet(new Request("https://dualiscapax.com/api/unity/wallet", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      identification: OTHER,
      state: held,
      key: "still-no"
    })
  }));
  const next = await again.json();
  assert.equal(next.log.length, 2);
  assert.equal(next.log[0].peg, held.log[0].peg);
  assert.equal(next.log[1].peg, peg(OTHER));
  assert.equal(JSON.stringify(next).includes(SAME), false);
  assert.equal(JSON.stringify(next).includes(OTHER), false);
  assertQuiet(next);

  const emptyPost = await handleWallet(new Request("https://dualiscapax.com/api/unity/wallet", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identification: "  ", state: next, look: 1, joule: 2 })
  }));
  const kept = await emptyPost.json();
  assert.equal(kept.log.length, 2);
  assert.equal(kept.log[0].peg, held.log[0].peg);
  assert.equal(kept.peg, next.peg);
  assertQuiet(kept);

  const broken = await handleWallet(new Request("https://dualiscapax.com/api/unity/wallet", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{"
  }));
  const blank = await broken.json();
  assert.equal(blank.peg, null);
  assert.equal(blank.log.length, 0);
  assertQuiet(blank);

  const other = await handleWallet(new Request("https://dualiscapax.com/api/unity/wallet", { method: "PUT" }));
  assert.equal(other.status, 405);
  assertQuiet(await other.json());
});
