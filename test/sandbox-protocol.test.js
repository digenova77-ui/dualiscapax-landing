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
  assert.equal(value.live, false);
  assert.equal(value.gate, "shut");
  assert.equal(value.open, false);
  assertNoKey(value);
}

test("one Unity ID is on the protocol and the early-adopter rule stays unresolved", async () => {
  const net = open();
  const held = await adopt({
    unityId: ONE,
    body: "Ada",
    kind: "human",
    cap: 100,
    price: 5,
    shifts: 2,
    seats: 10
  }, net);
  assert.equal(held.adopter, null);
  assert.equal(held.rule, "unresolved");
  assert.equal(held.protocol, true);
  assert.equal(held.participates, true);
  assert.equal(held.reason, "one");
  assert.equal(held.cap, null);
  assert.equal(held.price, null);
  assert.equal(held.seat, null);
  assert.equal(held.shifts, null);
  assert.equal(held.cost, null);
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

test("a body without a Unity ID is not on the protocol", async () => {
  for (const input of [{}, { adopter: true }, { unityId: "  " }, { body: "Ada", kind: "human" }, null]) {
    const held = await adopt(input);
    assert.equal(held.adopter, null);
    assert.equal(held.rule, "unresolved");
    assert.equal(held.protocol, false);
    assert.equal(held.participates, false);
    assert.equal(held.reason, "absent");
    assert.equal(held.peg, null);
    assert.equal(held.shifts, null);
    assert.equal(held.cost, null);
    assert.equal(held.cap, null);
    assertQuiet(held);
  }
});

test("a second ID for the same body is refused", async () => {
  const net = open();
  const first = await adopt({ unityId: "body-one", body: "Ada", kind: "human" }, net);
  assert.equal(first.protocol, true);
  const second = await adopt({ unityId: "body-two", body: "Ada", kind: "human" }, net);
  assert.equal(second.protocol, false);
  assert.equal(second.adopter, null);
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

test("the founder board names no seat", async () => {
  const missing = await seatBoard({});
  assert.equal(missing.seated.length, 0);
  assert.equal(missing.seats, null);
  assert.equal(missing.cap, null);
  assert.equal(missing.names, null);
  assert.equal(missing.refused[0].reason, "no-id");
  assert.equal(missing.stored, false);
  assertQuiet(missing);

  const offered = await seatBoard({ unityId: ONE, seat: 1, cap: 10 });
  assert.equal(offered.seated.length, 0);
  assert.equal(offered.seats, null);
  assert.equal(offered.refused[0].reason, "unresolved");
  assert.equal(offered.refused[0].peg, await pegOf(ONE));
  assert.equal(offered.refused[0].seat, null);
  assert.equal(JSON.stringify(offered).includes(ONE), false);
  assert.equal(JSON.stringify(offered).includes("DC-F-"), false);
  assertQuiet(offered);

  const dup = await seatBoard([{ unityId: ONE }, { unityId: ONE }]);
  assert.equal(dup.seated.length, 0);
  assert.equal(dup.refused.length, 2);
  assert.equal(dup.refused[0].reason, "unresolved");
  assert.equal(dup.refused[1].reason, "second");
  assert.equal(dup.minted, false);
  assertQuiet(dup);

  const empty = await seatBoard(null);
  assert.equal(empty.seated.length, 0);
  assert.equal(empty.refused.length, 0);
  assert.equal(empty.pay, null);
  assert.equal(empty.vote, null);
  assert.equal(empty.office, null);
  assertQuiet(empty);
});

test("a founding sign stores nothing and seats nobody", async () => {
  const again = await sign({ unityId: ONE, flags: 0, agent: "YourName" });
  assert.equal(again.admitted, false);
  assert.equal(again.seated, false);
  assert.equal(again.reason, "unresolved");
  assert.equal(again.seat, null);
  assert.equal(again.cap, null);
  assert.equal(again.stored, false);
  assert.equal(again.peg, await pegOf(ONE));
  assert.equal(JSON.stringify(again).includes(ONE), false);
  assert.equal(JSON.stringify(again).includes("YourName"), false);
  assertQuiet(again);
  const nameless = await sign({ agent: "YourName", flags: 0 });
  assert.equal(nameless.admitted, false);
  assert.equal(nameless.reason, "no-id");
  assert.equal(nameless.minted, false);
  const paired = await sign({ unityId: ONE, secondId: "spare" });
  assert.equal(paired.reason, "second");
  assert.equal(paired.stored, false);
  assert.equal(paired.peg, null);
});

test("a sandbox run twice is deep-equal and mints no coin", () => {
  const input = { ring: "iris", arc: "green", key: "do-not-keep", secret: "no", mint: true, chain: "ethereum" };
  const first = run(input);
  const second = run({ arc: "green", ring: "iris", secret: "no", key: "do-not-keep", mint: true, chain: "ethereum" });
  assert.deepEqual(first, second);
  assert.deepEqual(first.sentences, SENTENCES);
  assert.deepEqual(first.coins, COINS);
  assert.deepEqual(first.coins, ["UniFi³", "EFUSE", "Merit"]);
  assert.equal(first.required, false);
  assert.equal(first.live, false);
  assert.equal(first.note, COIN_NOTE);
  assert.equal(first.sovereign, "Trinity");
  assert.equal(first.efuse, 1);
  assert.equal(first.open, false);
  assert.equal(first.network, null);
  assert.equal(first.ledger, null);
  assert.equal(first.block, null);
  assert.equal(first.gas, null);
  assert.equal(first.chain, null);
  assert.equal(first.transfer, false);
  assert.equal(first.airdrop, false);
  assert.equal(JSON.stringify(first).includes("do-not-keep"), false);
  assert.equal(JSON.stringify(first).toLowerCase().includes("ethereum"), false);
  assertQuiet(first);
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
  assert.equal((door.match(/stylesheet/g) || []).length, 1);
  assert.equal((wallet.match(/stylesheet/g) || []).length, 1);
});

test("the founding rule returns the shut gate and stores nothing", async () => {
  const rule = await foundingRule();
  assert.match(rule.rule, /does not name a founder board/);
  assert.equal(rule.stored, false);
  assert.equal(rule.seated.length, 0);
  assert.equal(rule.seats, null);
  assert.equal(rule.open, false);
  assert.equal(rule.minted, false);
  assert.equal(rule.live, false);
  assert.deepEqual(rule.coins, COINS);
  assert.equal(JSON.stringify(rule).includes(ONE), false);
  assertQuiet(rule);
});
