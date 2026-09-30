#!/usr/bin/env node
import assert from "node:assert/strict";
import test from "node:test";

const PLATE = {
  inForce: false,
  potShips: false,
  noRaid: true,
  sameEitherWay: true,
  checks: 0,
};

const HALL = [
  "An attack is a throw. Each binder closes their own doors. No raid. Not in force.",
  "No shared pot ships. What they can take from here is near zero.",
];

function dclm(claims) {
  const drop = [
    /nodes support a nation/i,
    /sovereign alliance is live/i,
    /withdraw their power/i,
    /10 million/i,
    /ten million/i,
    /node army/i,
  ];
  const held = [];
  const dropped = [];
  for (const c of claims) {
    if (drop.some((re) => re.test(c))) dropped.push(c);
    else held.push(c);
  }
  return { held, dropped, inForce: PLATE.inForce && PLATE.checks >= 2 && !PLATE.potShips };
}

test("hall does not claim a live node alliance", () => {
  const out = dclm([...HALL, "nodes support a nation"]);
  assert.equal(out.dropped.includes("nodes support a nation"), true);
  assert.equal(out.inForce, false);
  assert.equal(HALL.some((s) => /nodes support a nation/i.test(s)), false);
});

test("pot ships stay false so invert is near zero", () => {
  assert.equal(PLATE.potShips, false);
  assert.equal(PLATE.noRaid, true);
  assert.equal(PLATE.sameEitherWay, true);
});

test("two checks are required before in force", () => {
  const early = dclm(HALL);
  assert.equal(early.inForce, false);
});
