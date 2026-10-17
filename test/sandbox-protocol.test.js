import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { pegOf } from "../js/unity-wallet.js";
import { open } from "../js/unity-id-protocol.js";
import { adopt, foundingRule, seatBoard, sign } from "../js/sandbox-protocol.js";
import { COINS, COIN_NOTE, SENTENCES, run } from "../js/sandbox-math.js";

const ONE = "DC-U-001";

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
  assert.equal(value.minted, false);
  assert.equal(value.coin, null);
  assert.equal(value.gate, "shut");
  assertNoKey(value);
}

test("an early adopter with one Unity ID is on the protocol", async () => {
  const net = open();
  const held = await adopt({ unityId: ONE, body: "Ada", kind: "human", adopter: true }, net);
  assert.equal(held.adopter, true);
  assert.equal(held.protocol, true);
  assert.equal(held.participates, true);
  assert.equal(held.reason, "one");
  assert.equal(held.shifts, 2);
  assert.equal(held.sooner, 2);
  assert.equal(held.cost, 0);
  assert.equal(held.find, false);
  assert.equal(held.face, false);
  assert.equal(held.standing, false);
  assert.equal(held.peg, await pegOf(ONE));
  assert.equal(held.iris, "Iris");
  assertQuiet(held);
  assert.equal(JSON.stringify(held).includes(ONE), false);
  assert.equal(JSON.stringify(net.memory()).includes(ONE), false);
  assert.equal(net.memory().length, 1);
  assert.equal(net.memory()[0].peg, held.peg);
  assert.equal(net.memory()[0].look, 0);
  assert.equal(net.memory()[0].joule, null);
});

test("a body without a Unity ID is not an early adopter and is not on the protocol", async () => {
  for (const input of [{}, { adopter: true }, { unityId: "  " }, { body: "Ada", kind: "human" }, null]) {
    const held = await adopt(input);
    assert.equal(held.adopter, false);
    assert.equal(held.protocol, false);
    assert.equal(held.participates, false);
    assert.equal(held.reason, "absent");
    assert.equal(held.peg, null);
    assert.equal(held.shifts, 0);
    assert.equal(held.cost, null);
    assertQuiet(held);
  }
});

test("a second ID for the same body is refused", async () => {
  const net = open();
  const first = await adopt({ unityId: "body-one", body: "Ada", kind: "human" }, net);
  assert.equal(first.protocol, true);
  const second = await adopt({ unityId: "body-two", body: "Ada", kind: "human" }, net);
  assert.equal(second.protocol, false);
  assert.equal(second.adopter, false);
  assert.equal(second.reason, "second");
  assert.equal(second.peg, null);
  assert.equal(second.minted, false);
  assertQuiet(second);
  assert.equal(JSON.stringify(net.memory()).includes("body-two"), false);
  assert.equal(net.memory().length, 1);

  const paired = await adopt({ unityId: "left", secondId: "right", body: "Bea", kind: "bot" });
  assert.equal(paired.protocol, false);
  assert.equal(paired.reason, "second");
  assert.equal(paired.peg, null);
  assertQuiet(paired);
});

test("a founder seat requires one Unity ID and a duplicate seat is refused", async () => {
  const missing = await seatBoard({});
  assert.equal(missing.seated.length, 0);
  assert.equal(missing.refused[0].reason, "no-id");
  assertQuiet(missing);

  const seated = await seatBoard({ unityId: ONE });
  assert.equal(seated.seated.length, 1);
  assert.equal(seated.seated[0].seat, 1);
  assert.equal(seated.seated[0].serial, "DC-F-DE51-FFD7");
  assert.equal(seated.seated[0].label, "Reserved — seat 1");
  assert.equal(seated.seated[0].vote, false);
  assert.equal(seated.seated[0].pay, 0);
  assert.equal(seated.seated[0].office, false);
  assert.equal(seated.seated[0].peg, await pegOf(ONE));
  assert.equal(seated.seated[0].iris, "Iris");
  assert.equal(JSON.stringify(seated).includes(ONE), false);
  assert.equal(JSON.stringify(seated.memory).includes(ONE), false);
  assertQuiet(seated);
  assert.equal(seated.open, false);

  const dup = await seatBoard([{ unityId: ONE }, { unityId: ONE }]);
  assert.equal(dup.seated.length, 1);
  assert.equal(dup.refused.length, 1);
  assert.equal(dup.refused[0].reason, "duplicate");
  assert.equal(dup.minted, false);
  assert.equal(dup.open, false);
  assertQuiet(dup);

  const stranger = await seatBoard({ unityId: "not-a-published-seat" });
  assert.equal(stranger.seated.length, 0);
  assert.equal(stranger.refused[0].reason, "not-on-board");
  assert.equal(JSON.stringify(stranger).includes("not-a-published-seat"), false);
});

test("the published house seats only the Unity ID that already exists", async () => {
  const board = await seatBoard(null);
  assert.equal(board.seated.length, 1);
  assert.equal(board.seated[0].seat, 1);
  assert.equal(board.refused.length, 9);
  for (let i = 0; i < board.refused.length; i++) assert.equal(board.refused[i].reason, "no-id");
  assert.equal(board.pay, 0);
  assert.equal(board.vote, false);
  assert.equal(board.office, false);
  assertQuiet(board);
  const again = await sign({ unityId: ONE, flags: 0, agent: "YourName" });
  assert.equal(again.admitted, false);
  assert.equal(again.seated, false);
  assert.equal(again.reason, "duplicate");
  assert.equal(again.pay, 0);
  assert.equal(again.vote, false);
  assert.equal(again.office, false);
  assert.equal(again.stored, false);
  assertQuiet(again);
  const nameless = await sign({ agent: "YourName", flags: 0 });
  assert.equal(nameless.admitted, false);
  assert.equal(nameless.reason, "no-id");
  assert.equal(nameless.minted, false);
});

test("a sandbox run twice is deep-equal and mints no coin", () => {
  const input = { ring: "iris", arc: "green", key: "do-not-keep", secret: "no" };
  const first = run(input);
  const second = run({ arc: "green", ring: "iris", secret: "no", key: "do-not-keep" });
  assert.deepEqual(first, second);
  assert.deepEqual(first.sentences, SENTENCES);
  assert.deepEqual(first.coins, COINS);
  assert.deepEqual(first.coins, ["Unity", "Merit", "eFuse"]);
  assert.equal(first.required, false);
  assert.equal(first.note, COIN_NOTE);
  assert.equal(first.sovereign, "Trinity");
  assert.equal(first.efuse, 1);
  assert.equal(first.open, false);
  assert.equal(first.network, null);
  assert.equal(first.ledger, null);
  assert.equal(first.block, null);
  assert.equal(first.gas, null);
  assert.equal(typeof first.math, "number");
  assert.equal(JSON.stringify(first).includes("do-not-keep"), false);
  assertQuiet(first);
  assert.notDeepEqual(run({ ring: "iris" }), run({ ring: "cosmos" }));
});

test("the public sentences are on the door and the wallet", () => {
  const door = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const wallet = readFileSync(new URL("../wallet.html", import.meta.url), "utf8");
  for (const sentence of SENTENCES) {
    assert.equal(door.includes(sentence), true, sentence);
    assert.equal(wallet.includes(sentence), true, sentence);
  }
  assert.equal(door.includes("No coin is offered."), true);
  assert.equal(wallet.includes("No coin is offered."), true);
  assert.equal(/\bkey\b/i.test(wallet), false);
  assert.equal(wallet.includes('type="password"'), false);
});

test("the founding rule returns the shut gate and stores nothing", async () => {
  const rule = await foundingRule();
  assert.match(rule.rule, /one Unity ID/);
  assert.equal(rule.stored, false);
  assert.equal(rule.seated.length, 1);
  assert.equal(rule.open, false);
  assert.equal(rule.minted, false);
  assert.deepEqual(rule.coins, COINS);
  assert.equal(JSON.stringify(rule).includes(ONE), false);
  assertQuiet(rule);
});
