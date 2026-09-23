#!/usr/bin/env node
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createHash, randomBytes } from "node:crypto";

const ZERO = "0x" + "00".repeat(20);
const THIS = "0x" + "ee".repeat(20);
const MAX = (1n << 256n) - 1n;

function addr() {
  return "0x" + createHash("sha256").update(randomBytes(32)).digest("hex").slice(0, 40);
}

function token(genesis, founder) {
  if (!(genesis > 0n)) throw new Error("genesis");
  if (!founder || founder === ZERO) throw new Error("founder");
  const balance = new Map([[founder, genesis]]);
  const allowance = new Map();
  const supply = genesis;
  const key = (a, b) => `${a}|${b}`;
  const move = (from, to, value) => {
    if (!to || to === ZERO) throw new Error("to");
    if (to === THIS) throw new Error("no pot");
    const have = balance.get(from) ?? 0n;
    if (have < value) throw new Error("balance");
    balance.set(from, have - value);
    balance.set(to, (balance.get(to) ?? 0n) + value);
    return true;
  };
  return {
    name: "eFuse",
    symbol: "EFUSE",
    decimals: 18,
    totalSupply: () => supply,
    balanceOf: (a) => balance.get(a) ?? 0n,
    mint() { throw new Error("no later mint"); },
    transfer: (from, to, value) => move(from, to, value),
    approve(owner, spender, value) {
      allowance.set(key(owner, spender), value);
      return true;
    },
    transferFrom(spender, from, to, value) {
      const allowed = allowance.get(key(from, spender)) ?? 0n;
      if (allowed < value) throw new Error("allowance");
      if (allowed !== MAX) allowance.set(key(from, spender), allowed - value);
      return move(from, to, value);
    },
    receiveEth() { throw new Error("no pot"); },
    fallback() { throw new Error("no pot"); },
  };
}

const CLAIMS = [
  "issued is yes",
  "listed",
  "mainnet address exists",
  "nodes support a nation",
  "alliance treasury",
  "company remainder",
  "shared pot ships",
  "fixed supply at genesis",
  "no later mint",
  "no pot",
  "Unity ID is not the key",
];

function dclm(claims) {
  const drop = [
    /issued is yes/i,
    /listed/i,
    /mainnet address/i,
    /nodes support a nation/i,
    /alliance treasury/i,
    /company remainder/i,
    /shared pot/i,
    /war chest/i,
    /10 million/i,
  ];
  const dropped = claims.filter((c) => drop.some((re) => re.test(c)));
  const held = claims.filter((c) => !dropped.includes(c));
  return { friction: 100, acuity: 100, amplitude: held.length, affinity: "eFuse / Unity Network", held, dropped };
}

function twain(matrix) {
  const again = dclm(matrix.held);
  return { ...again, square: true, issued: false, inForce: false };
}

test("syntax: contract still has the four doors and two reverts", () => {
  const src = readFileSync(new URL("./EFuseToken.sol", import.meta.url), "utf8");
  assert.match(src, /pragma solidity \^0\.8\.24/);
  assert.match(src, /function transfer\(/);
  assert.match(src, /function approve\(/);
  assert.match(src, /function transferFrom\(/);
  assert.match(src, /function _move\(/);
  assert.match(src, /receive\(\) external payable/);
  assert.match(src, /fallback\(\) external payable/);
  assert.equal((src.match(/revert\("no pot"\)/g) || []).length, 2);
  assert.doesNotMatch(src, /function mint\(/);
  assert.match(src, /LicenseRef-eFuse-Sandbox/);
});

test("zero transfer is allowed and does not grow supply", () => {
  const founder = addr();
  const t = token(10n, founder);
  t.transfer(founder, addr(), 0n);
  assert.equal(t.totalSupply(), 10n);
});

test("cannot send to zero or to the contract", () => {
  const founder = addr();
  const t = token(10n, founder);
  assert.throws(() => t.transfer(founder, ZERO, 1n), /to/);
  assert.throws(() => t.transfer(founder, THIS, 1n), /no pot/);
});

test("max approve does not decrement", () => {
  const founder = addr();
  const spender = addr();
  const sink = addr();
  const t = token(10n, founder);
  t.approve(founder, spender, MAX);
  t.transferFrom(spender, founder, sink, 2n);
  t.transferFrom(spender, founder, sink, 2n);
  assert.equal(t.balanceOf(sink), 4n);
});

test("fallback rejects value the same as receive", () => {
  const t = token(1n, addr());
  assert.throws(() => t.fallback(), /no pot/);
  assert.throws(() => t.receiveEth(), /no pot/);
});

test("DCLM square then Twain square holds only tested sentences", () => {
  const first = dclm(CLAIMS);
  const second = twain(first);
  assert.deepEqual(first.held.slice().sort(), second.held.slice().sort());
  assert.ok(first.dropped.includes("issued is yes"));
  assert.ok(first.dropped.includes("shared pot ships"));
  assert.ok(second.held.includes("fixed supply at genesis"));
  assert.ok(second.held.includes("no later mint"));
  assert.ok(second.held.includes("no pot"));
  assert.ok(second.held.includes("Unity ID is not the key"));
  assert.equal(second.issued, false);
  assert.equal(second.inForce, false);
});
