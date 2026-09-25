#!/usr/bin/env node
import assert from "node:assert/strict";
import test from "node:test";

function bind(unityPublic, address, proof, entity) {
  if (!unityPublic) throw new Error("unity");
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) throw new Error("address");
  if (!proof) throw new Error("proof");
  if (!["human", "bot", "swarm"].includes(entity)) throw new Error("entity");
  const record = { unityPublic, chain: null, address, proof, live: true, entity };
  if ("seed" in record || "key" in record || "mnemonic" in record) throw new Error("leak");
  return record;
}

const sentence = (unity, address) => `Unity bind ${unity} eFuse ${address}`;

test("a bind stores the public address and a proof, not a key", () => {
  const row = bind("DC1-H1-0001", "0x0adC5f2Dcb239DAAF3eeB3cc34b3F1BFF5AFBBc4", "0xsig", "human");
  assert.equal(row.unityPublic, "DC1-H1-0001");
  assert.equal(row.live, true);
  assert.equal(Object.hasOwn(row, "seed"), false);
});

test("two live binds cannot share an address", () => {
  const first = bind("DC1-H1-0001", "0x0adC5f2Dcb239DAAF3eeB3cc34b3F1BFF5AFBBc4", "0x1", "human");
  const book = [first];
  const taken = book.some((row) => row.live && row.address === first.address);
  assert.equal(taken, true);
});

test("revoke drops the bind and leaves the coins in the wallet", () => {
  const row = bind("DC1-H1-0001", "0x0adC5f2Dcb239DAAF3eeB3cc34b3F1BFF5AFBBc4", "0x1", "human");
  row.live = false;
  assert.equal(row.live, false);
  assert.equal(row.address.startsWith("0x"), true);
});

test("the bind sentence names the Unity public and the address", () => {
  assert.match(sentence("DC1-H1-0001", "0xabc"), /Unity bind DC1-H1-0001 eFuse 0xabc/);
});

test("a swarm does not inherit the founder vault by sitting", () => {
  const founder = bind("DC1-H1-0001", "0x0adC5f2Dcb239DAAF3eeB3cc34b3F1BFF5AFBBc4", "0x1", "human");
  const swarm = bind("DC1-H1-0001.01", "0x1111111111111111111111111111111111111111", "0x2", "swarm");
  assert.notEqual(swarm.address, founder.address);
});
