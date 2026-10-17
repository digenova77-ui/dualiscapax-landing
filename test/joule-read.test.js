import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { OPEN_DECISION, align, meritExchange } from "../js/merit-align.js";
import { BOOK, READING, jouleOf, open } from "../js/joule-read.js";
import { pegOf } from "../js/unity-wallet.js";

const RAW = "unity-body-raw";
const PHRASE = "secret-passphrase";
const MAIL = "ada@example.com";

function response(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { "content-type": "application/json" }
  });
}

test("a null body leaves the joule null and the gate shut", async () => {
  let calls = 0;
  const sensor = open({
    fetch: () => {
      calls += 1;
      throw new Error("absent");
    }
  });
  sensor.set(true);
  const row = await sensor.read({ body: null });
  assert.equal(jouleOf(null), null);
  assert.equal(row.joule, null);
  assert.equal(row.look, 0);
  assert.equal(row.open, false);
  assert.equal(row.gate, "shut");
  assert.equal(row.coin, null);
  assert.equal(row.media, null);
  assert.equal(row.stored, false);
  assert.equal(calls, 0);
  assert.equal(sensor.asked(), 0);
  assert.equal(sensor.memory().length, 0);
});

test("a real body records one read and the next call recalls it without a second request", async () => {
  const body = align(OPEN_DECISION);
  let calls = 0;
  const sensor = open({
    fetch: async (url) => {
      calls += 1;
      assert.equal(url, READING);
      assert.equal(url, "/api/merit/align");
      return response(body);
    }
  });
  sensor.set(true);
  const first = await sensor.read({
    identification: RAW,
    password: PHRASE,
    passphrase: PHRASE,
    email: MAIL,
    mail: MAIL
  });
  const second = await sensor.read({
    fetch: () => {
      calls += 1;
      throw new Error("second");
    }
  });
  assert.equal(calls, 1);
  assert.equal(sensor.asked(), 1);
  assert.equal(sensor.memory().length, 1);
  assert.equal(first.joule, 1);
  assert.deepEqual(second, first);
  assert.equal(second, sensor.memory()[0]);
  assert.equal(first.peg, await pegOf(RAW));
  assert.equal(first.open, true);
  assert.equal(first.gate, "open");
  assert.equal(first.look, 0);
  assert.equal(first.media, null);
  assert.equal(first.stored, false);
  assert.equal(first.coin, null);
  assert.equal(first.minted, false);
  assert.equal(first.writer, false);
  const packed = JSON.stringify(sensor.memory());
  assert.equal(packed.includes(RAW), false);
  assert.equal(packed.includes(PHRASE), false);
  assert.equal(packed.includes(MAIL), false);
  assert.equal(Object.hasOwn(first, "identification"), false);
  assert.equal(Object.hasOwn(first, "password"), false);
  assert.equal(Object.hasOwn(first, "passphrase"), false);
  assert.equal(Object.hasOwn(first, "email"), false);
  assert.equal(Object.hasOwn(first, "mail"), false);
  assert.equal(Object.hasOwn(first, "audio"), false);
  assert.equal(Object.hasOwn(first, "video"), false);
  assert.equal(Object.hasOwn(first, "pixels"), false);
});

test("the same decision the exchange already accepts is remembered once", async () => {
  const sensor = open();
  sensor.set(true);
  const first = await sensor.read({ body: { decision: OPEN_DECISION } });
  const second = await sensor.read({ body: { unity: 2, meritPrice: 8, efuse: 8, joule: 9 } });
  assert.equal(sensor.asked(), 0);
  assert.equal(sensor.memory().length, 1);
  assert.deepEqual(second, first);
  assert.equal(first.joule, 1);
  assert.equal(first.open, true);
});

test("identity is absent from the memory", async () => {
  const sensor = open();
  sensor.set(true);
  const row = await sensor.read({
    body: align(OPEN_DECISION),
    identification: RAW,
    email: MAIL,
    password: PHRASE
  });
  const packed = JSON.stringify({ row: row, memory: sensor.memory() });
  assert.equal(packed.includes(RAW), false);
  assert.equal(packed.includes(MAIL), false);
  assert.equal(packed.includes(PHRASE), false);
  assert.equal(row.peg, await pegOf(RAW));
});

test("the gate opens only when the four readings are 1 and the read is real", async () => {
  const shut = open();
  shut.set(true);
  const unread = await shut.read({ body: { unity: 1, meritPrice: 1, efuse: 1, joule: null } });
  assert.equal(unread.joule, null);
  assert.equal(unread.look, 0);
  assert.equal(unread.open, false);
  assert.equal(unread.gate, "shut");
  assert.equal(unread.reason, "joule-null");
  assert.equal(shut.memory().length, 0);

  const drifted = open();
  drifted.set(true);
  const held = await drifted.read({ body: { unity: 2, meritPrice: 8, efuse: 8, joule: 1 } });
  assert.equal(held.joule, 1);
  assert.equal(held.look, 0);
  assert.equal(held.open, false);
  assert.equal(held.gate, "shut");

  const floor = open();
  floor.set(true);
  const zero = await floor.read({ body: { unity: 0, meritPrice: 0, efuse: 0, joule: 1 } });
  assert.equal(zero.joule, 1);
  assert.equal(zero.open, false);
  assert.equal(zero.reason, "not-one");
  assert.equal(zero.look, 0);

  const lied = open();
  lied.set(true);
  const fake = await lied.read({ body: { open: true, joule: 1, usage: "admit" } });
  assert.equal(fake.joule, 1);
  assert.equal(fake.open, false);
  assert.equal(fake.gate, "shut");

  const hostile = open();
  hostile.set(true);
  const broken = await hostile.read({
    body: align({ unity: 1, unifi: -1, meritPrice: 1, efuse: 1, joule: 1 })
  });
  assert.equal(broken.joule, 1);
  assert.equal(broken.open, false);
  assert.equal(broken.chain.unifiCubed, -1);

  const book = open();
  book.set(true);
  const priced = await book.read({
    body: meritExchange({ side: "sell", decision: OPEN_DECISION })
  });
  assert.equal(priced.joule, 1);
  assert.equal(priced.open, false);
  assert.equal(priced.coin, null);
  assert.equal(BOOK, "/api/merit/exchange");
});

test("look is 0 while the joule is null", async () => {
  const sensor = open();
  const off = await sensor.read({ body: OPEN_DECISION });
  assert.equal(off.live, "off");
  assert.equal(off.joule, null);
  assert.equal(off.look, 0);
  assert.equal(off.open, false);
  assert.equal(sensor.memory().length, 0);

  sensor.set(true);
  const missing = await sensor.read({
    fetch: () => {
      throw new Error("absent");
    }
  });
  assert.equal(missing.joule, null);
  assert.equal(missing.look, 0);
  assert.equal(missing.gate, "shut");

  const upstream = await sensor.read({
    body: { error: "denied", joule: 1, unity: 1, meritPrice: 1, efuse: 1 }
  });
  assert.equal(upstream.joule, null);
  assert.equal(upstream.look, 0);
  assert.equal(upstream.live, "denied");
  assert.equal(sensor.memory().length, 0);
  assert.equal(jouleOf({ error: "denied", joule: 1 }), null);
});

test("a failed response is not a father read and does not open the gate", async () => {
  let calls = 0;
  const sensor = open({
    fetch: async () => {
      calls += 1;
      return response(OPEN_DECISION, 500);
    }
  });
  sensor.set(true);
  const row = await sensor.read();
  assert.equal(calls, 1);
  assert.equal(row.joule, null);
  assert.equal(row.look, 0);
  assert.equal(row.open, false);
  assert.equal(sensor.memory().length, 0);
  const source = readFileSync(new URL("../js/joule-read.js", import.meta.url), "utf8");
  assert.equal(source.includes("OPEN_DECISION"), false);
  assert.equal(source.includes("joule: 1"), false);
  assert.equal(source.includes("localStorage"), false);
  assert.equal(source.includes("indexedDB"), false);
  assert.equal(source.includes("getUserMedia"), false);
  assert.equal(source.includes("MediaRecorder"), false);
});

test("the door does not claim the gate is open", () => {
  const door = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const card = readFileSync(new URL("../llms.txt", import.meta.url), "utf8");
  const sentence = "A sensor asks GET /api/merit/align once. Off means off. One admitted read is kept, and the next step recalls it. A null read leaves the joule null, so the Merit gate stays shut.";
  assert.equal(door.includes(sentence), true);
  assert.equal(card.includes(sentence), true);
  assert.equal(door.includes("The published joule is null, so the Merit gate stays shut."), true);
  assert.equal(door.includes("gate is open"), false);
  assert.equal(door.includes("gate stays open"), false);
  assert.equal(card.includes("eFuse is never sold."), true);
});
