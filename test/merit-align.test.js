import assert from "node:assert/strict";
import test from "node:test";
import { OPEN_DECISION, align, published, publishedResponse, quotePrice, unifiCubed } from "../js/merit-align.js";

test("UniFi³ is the reading taken three times", () => {
  assert.equal(unifiCubed(1), 1);
  assert.equal(unifiCubed(0), 0);
  assert.equal(unifiCubed(-1), -1);
  assert.equal(unifiCubed(2), 8);
  assert.equal(unifiCubed(null), null);
  assert.equal(unifiCubed("1"), null);
});

test("the published joule is null and the gate stays shut", () => {
  const gate = published();
  assert.equal(gate.open, false);
  assert.equal(gate.usage, "closed");
  assert.equal(gate.aligned, false);
  assert.equal(gate.joule, null);
  assert.equal(gate.reason, "misaligned");
  assert.deepEqual(gate.chain, {
    meritPrice: null,
    unity: null,
    unifiCubed: null,
    efuse: null
  });
});

test("the published response tells a caller the gate is shut", async () => {
  const res = publishedResponse();
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("cache-control"), "no-store");
  const body = await res.json();
  assert.equal(body.open, false);
  assert.equal(body.usage, "closed");
  assert.match(body.link, /UniFi³/);
  assert.match(body.link, /eFuse/);
});

test("a drifted Merit price stays shut", () => {
  const gate = align({ unity: 1, meritPrice: 2, efuse: 1, joule: 1 });
  assert.equal(gate.aligned, false);
  assert.equal(gate.open, false);
  assert.equal(gate.usage, "closed");
});

test("eFuse must read the cube", () => {
  const gate = align({ unity: 1, meritPrice: 1, efuse: 0, joule: 1 });
  assert.equal(gate.chain.unifiCubed, 1);
  assert.equal(gate.aligned, false);
  assert.equal(gate.open, false);
});

test("a UniFi factor that is not Unity breaks the link", () => {
  const gate = align({ unity: 1, unifi: -1, meritPrice: 1, efuse: 1, joule: 1 });
  assert.equal(gate.chain.unifiCubed, -1);
  assert.equal(gate.aligned, false);
  assert.equal(gate.open, false);
});

test("the floor is aligned and the gate stays shut", () => {
  const gate = align({ unity: 0, meritPrice: 0, efuse: 0, joule: 1 });
  assert.equal(gate.aligned, true);
  assert.equal(gate.open, false);
  assert.equal(gate.usage, "closed");
  assert.equal(gate.reason, "not-one");
});

test("the seed is aligned and the gate stays shut", () => {
  const gate = align({ unity: -1, meritPrice: -1, efuse: -1, joule: 1 });
  assert.equal(gate.aligned, true);
  assert.equal(gate.open, false);
  assert.equal(gate.reason, "not-one");
});

test("Unity 1 with a null joule stays shut", () => {
  const gate = align({ unity: 1, meritPrice: 1, efuse: 1, joule: null });
  assert.equal(gate.chain.unifiCubed, 1);
  assert.equal(gate.aligned, false);
  assert.equal(gate.open, false);
  assert.equal(gate.reason, "joule-null");
});

test("Unity 2 cubes to 8 and does not align the price to Unity", () => {
  const gate = align({ unity: 2, meritPrice: 8, efuse: 8, joule: 1 });
  assert.equal(gate.chain.unifiCubed, 8);
  assert.equal(gate.aligned, false);
  assert.equal(gate.open, false);
});

test("look stays free while a charge waits on the joule and the decision gate", () => {
  const look = quotePrice({ amount: 0 });
  assert.equal(look.priced, true);
  assert.equal(look.charge, false);
  assert.equal(look.reason, "look");

  const shut = quotePrice({ amount: "10000" });
  assert.equal(shut.priced, false);
  assert.equal(shut.charge, false);
  assert.equal(shut.open, false);
  assert.equal(shut.joule, null);
  assert.equal(shut.reason, "misaligned");

  const unread = quotePrice({
    amount: 20,
    decision: { unity: 1, meritPrice: 1, efuse: 1, joule: null }
  });
  assert.equal(unread.priced, false);
  assert.equal(unread.reason, "joule-null");

  const open = quotePrice({ amount: "10000", decision: OPEN_DECISION });
  assert.equal(open.priced, true);
  assert.equal(open.charge, true);
  assert.equal(open.reason, "aligned");
  assert.equal(open.joule, 1);
});

test("Unity 1 through UniFi³ into eFuse, with a read joule, admits usage and opens the gate", () => {
  const gate = align({ unity: 1, meritPrice: 1, efuse: 1, joule: 1 });
  assert.equal(gate.aligned, true);
  assert.equal(gate.open, true);
  assert.equal(gate.usage, "admit");
  assert.equal(gate.reason, "aligned");
  assert.deepEqual(gate.chain, {
    meritPrice: 1,
    unity: 1,
    unifiCubed: 1,
    efuse: 1
  });
});
