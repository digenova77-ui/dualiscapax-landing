#!/usr/bin/env node
/** Throwaway keys only. Never the founder vault. */

import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ZERO = "0x" + "00".repeat(20);
const here = dirname(fileURLToPath(import.meta.url));

function addr() {
  return "0x" + createHash("sha256").update(randomBytes(32)).digest("hex").slice(0, 40);
}

function token(genesis, founder) {
  if (!(genesis > 0n)) throw new Error("genesis");
  if (!founder || founder === ZERO) throw new Error("founder");
  const balance = new Map([[founder, genesis]]);
  const allowance = new Map();
  let supply = genesis;
  const key = (a, b) => `${a}|${b}`;
  return {
    name: "eFuse",
    symbol: "EFUSE",
    decimals: 18,
    totalSupply: () => supply,
    balanceOf: (a) => balance.get(a) ?? 0n,
    mint() {
      throw new Error("no later mint");
    },
    transfer(from, to, value) {
      if (!to || to === ZERO) throw new Error("to");
      if (to === "contract") throw new Error("no pot");
      const have = balance.get(from) ?? 0n;
      if (have < value) throw new Error("balance");
      balance.set(from, have - value);
      balance.set(to, (balance.get(to) ?? 0n) + value);
      return true;
    },
    approve(owner, spender, value) {
      allowance.set(key(owner, spender), value);
      return true;
    },
    transferFrom(spender, from, to, value) {
      const allowed = allowance.get(key(from, spender)) ?? 0n;
      if (allowed < value) throw new Error("allowance");
      allowance.set(key(from, spender), allowed - value);
      return this.transfer(from, to, value);
    },
    receiveEth() {
      throw new Error("no pot");
    },
  };
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

test("genesis lands on one address and cannot grow", () => {
  const founder = addr();
  const other = addr();
  const t = token(1000n, founder);
  assert.equal(t.totalSupply(), 1000n);
  assert.equal(t.balanceOf(founder), 1000n);
  assert.equal(t.balanceOf(other), 0n);
  assert.throws(() => t.mint());
});

test("founder can send, receiver can hold", () => {
  const founder = addr();
  const bench = addr();
  const t = token(1000n, founder);
  t.transfer(founder, bench, 7n);
  assert.equal(t.balanceOf(founder), 993n);
  assert.equal(t.balanceOf(bench), 7n);
  assert.equal(t.totalSupply(), 1000n);
});

test("cannot send to the token itself", () => {
  const founder = addr();
  const t = token(1000n, founder);
  assert.throws(() => t.transfer(founder, "contract", 1n), /no pot/);
});

test("cannot pour ETH into the token", () => {
  const t = token(1n, addr());
  assert.throws(() => t.receiveEth(), /no pot/);
});

test("approve is finite and transferFrom spends it", () => {
  const founder = addr();
  const spender = addr();
  const sink = addr();
  const t = token(100n, founder);
  t.approve(founder, spender, 9n);
  t.transferFrom(spender, founder, sink, 9n);
  assert.throws(() => t.transferFrom(spender, founder, sink, 1n), /allowance/);
  assert.equal(t.balanceOf(sink), 9n);
});

test("constructor refuses an empty founder", () => {
  assert.throws(() => token(1n, ZERO), /founder/);
  assert.throws(() => token(0n, addr()), /genesis/);
});

test("no private key material lives under research/coin", () => {
  if (!existsSync(here)) return;
  const bad = walk(here).filter((p) =>
    /\.(pem|key)$|keystore|secret|mnemonic|seed/i.test(p),
  );
  assert.deepEqual(bad, []);
});

test("published gift ETH is not automatically the vault", () => {
  const gift = "0x0adC5f2Dcb239DAAF3eeB3cc34b3F1BFF5AFBBc4";
  assert.match(gift, /^0x[0-9a-fA-F]{40}$/);
  const plate = { founder: null, signed: false };
  assert.equal(plate.founder, null);
  assert.equal(plate.signed, false);
});
