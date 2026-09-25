#!/usr/bin/env node
import assert from "node:assert/strict";
import test from "node:test";

function leftover(label, sitting) {
  if (!label) throw new Error("label");
  return { label, sitting, receipt: null, spent: null, open: true, pot: false };
}

function tag(row, receipt) {
  if (!receipt) throw new Error("receipt");
  return { ...row, receipt };
}

function spend(row, label, spent, raid = false) {
  if (raid) throw new Error("no raid");
  if (label !== row.label) throw new Error("wrong leftover");
  if (!row.receipt) throw new Error("unseen");
  return { ...row, spent, open: false };
}

function hallSays(row) {
  if (row.receipt && row.spent && row.label) return "spend seen against the leftover it named";
  return "the rule is written. the money is not proven";
}

test("a gift cannot close a different leftover", () => {
  const row = tag(leftover("hockey-roster", "DC1-H1-0001"), "rx1");
  assert.throws(() => spend(row, "raid-fund", "tx1"), /wrong leftover/);
});

test("a gift cannot fund a raid", () => {
  const row = tag(leftover("throw-north", "DC1-H1-0001"), "rx1");
  assert.throws(() => spend(row, "throw-north", "tx1", true), /no raid/);
});

test("hall does not claim a spend until both hashes exist", () => {
  const open = leftover("throw-north", "DC1-H1-0001");
  assert.match(hallSays(open), /not proven/);
  const tagged = tag(open, "rx1");
  assert.match(hallSays(tagged), /not proven/);
  const closed = spend(tagged, "throw-north", "tx1");
  assert.match(hallSays(closed), /spend seen/);
  assert.equal(closed.pot, false);
});
