import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { begin, handleWork, step, votePiece } from "../js/autonomy-work.js";

const HOLD = {
  NO_FORCE: true,
  HOST_SAFE: true,
  CLEANUP_FIRST: true,
  TRUTH_OR_NOTHING: true
};

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

function assertQuiet(value) {
  walk(value, function (node) {
    if (!node || typeof node !== "object") return;
    assert.equal(Object.hasOwn(node, "key"), false);
    if (Object.hasOwn(node, "look")) assert.equal(node.look, 0);
    if (Object.hasOwn(node, "joule")) assert.equal(node.joule, null);
  });
  assert.equal(JSON.stringify(value).includes("\"key\""), false);
  assert.equal(value.look, 0);
  assert.equal(value.joule, null);
}

function line(state, task) {
  return state.log.find(function (row) { return row.task === task; });
}

test("a theater piece that holds the four laws passes and is shown", () => {
  const piece = {
    id: "plain-stage",
    what: "a finite stage",
    axioms: HOLD
  };
  const vote = votePiece(piece);
  assert.equal(vote.admitted, true);
  assert.equal(vote.reason, "ADMIT");
  assert.equal(vote.authority, "DCLM");
  assert.equal(vote.shown, true);
  assert.equal(vote.what, "a finite stage");
  assertQuiet(vote);
  const state = step(begin(), {});
  assert.equal(state.log.length, 1);
  assert.equal(state.log[0].task, "rings");
  assert.equal(state.log[0].admitted, true);
  assert.equal(state.log[0].reason, "ADMIT");
  assert.equal(state.shown.length, 1);
  assert.equal(state.shown[0].id, "rings");
  assert.equal(state.retired, false);
  assert.equal(state.stop, false);
  assertQuiet(state);
});

test("a veto does not pass and is not shown", () => {
  const veto = votePiece({
    id: "plain-stage",
    what: "a finite stage",
    veto: true,
    axioms: HOLD
  });
  assert.equal(veto.admitted, false);
  assert.equal(veto.reason, "VETO");
  assert.equal(veto.shown, false);
  assert.equal(veto.what, null);
  assertQuiet(veto);
  let state = begin();
  const count = state.pending.length;
  for (let i = 0; i < count; i++) state = step(state, {});
  for (const task of ["field-canvas", "goggles", "skin"]) {
    const row = line(state, task);
    assert.equal(row.admitted, false);
    assert.equal(row.reason, "VETO");
    assert.equal(row.shown, false);
    assert.equal(state.shown.some(function (item) { return item.id === task; }), false);
  }
  assert.equal(state.shown.length, 1);
  assert.equal(state.shown[0].id, "rings");
  assertQuiet(state);
});

test("a skipped law does not pass", () => {
  const skipped = votePiece({
    id: "plain-stage",
    what: "a finite stage",
    skipped: ["HOST_SAFE"],
    axioms: HOLD
  });
  assert.equal(skipped.admitted, false);
  assert.equal(skipped.reason, "SKIPPED HOST_SAFE");
  assert.equal(skipped.shown, false);
  assert.equal(skipped.what, null);
  let state = begin();
  const count = state.pending.length;
  for (let i = 0; i < count; i++) state = step(state, {});
  const row = line(state, "quark-canvas");
  assert.equal(row.admitted, false);
  assert.equal(row.reason, "SKIPPED CLEANUP_FIRST");
  assert.equal(row.shown, false);
  assert.equal(state.shown.some(function (item) { return item.id === "quark-canvas"; }), false);
  const missing = line(state, "scaffold");
  assert.equal(missing.admitted, false);
  assert.equal(missing.reason, "MISSING CLEANUP_FIRST");
  assert.equal(missing.shown, false);
  assertQuiet(state);
});

test("the work does not retire across steps", () => {
  let state = begin();
  for (let i = 0; i < 12; i++) {
    state = step(state, {});
    assert.equal(state.retired, false);
    assert.equal(state.stop, false);
    assert.equal(state.log.length, i + 1);
  }
  assertQuiet(state);
});

test("only the host can stop it", () => {
  const going = step(begin(), {});
  assert.equal(going.retired, false);
  assert.equal(going.stop, false);
  const named = step(going, { stop: false, retired: true });
  assert.equal(named.retired, false);
  assert.equal(named.stop, false);
  const planted = step({ ...begin(), stop: true, retired: true }, {});
  assert.equal(planted.retired, false);
  assert.equal(planted.stop, false);
  assert.equal(planted.log[0].reason, "ADMIT");
  const stopped = step(going, { stop: true });
  assert.equal(stopped.retired, true);
  assert.equal(stopped.stop, true);
  assert.equal(stopped.log.length, going.log.length + 1);
  assert.equal(stopped.log[stopped.log.length - 1].reason, "HOST STOP");
  assert.equal(stopped.pending.length, going.pending.length);
  assert.deepEqual(stopped.shown, going.shown);
  assertQuiet(stopped);
});

test("two steps append two log lines", () => {
  const once = step(begin(), {});
  const twice = step(once, {});
  assert.equal(once.log.length, 1);
  assert.equal(twice.log.length, 2);
  assert.equal(twice.log[0].task, once.log[0].task);
  assert.equal(twice.log[0].reason, once.log[0].reason);
  assert.equal(twice.log[0].admitted, true);
  assert.equal(twice.log[1].admitted, false);
  assert.equal(twice.log[1].task, "field-canvas");
  assert.notEqual(twice.log[0], twice.log[1]);
  assertQuiet(twice);
});

test("the work state has no key and look stays 0", () => {
  let state = begin();
  state = step(state, {});
  state = step(state, {});
  state = step(state, { stop: true });
  assertQuiet(state);
  assert.equal(state.look, 0);
  assert.equal(state.joule, null);
  for (const row of state.log) {
    assert.equal(row.look, 0);
    assert.equal(row.joule, null);
  }
});

test("GET and POST each call step once", async () => {
  const got = await handleWork(new Request("https://dualiscapax.com/api/autonomy/work"));
  assert.equal(got.status, 200);
  assert.equal(got.headers.get("cache-control"), "no-store");
  const first = await got.json();
  assert.equal(first.log.length, 1);
  assert.equal(first.log[0].task, "rings");
  assert.equal(first.log[0].admitted, true);
  assert.equal(first.retired, false);
  assert.equal(first.stop, false);
  assertQuiet(first);

  const posted = await handleWork(new Request("https://dualiscapax.com/api/autonomy/work", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ state: first, rounds: 100 })
  }));
  const second = await posted.json();
  assert.equal(second.log.length, 2);
  assert.equal(second.log[1].task, "field-canvas");
  assert.equal(second.log[1].admitted, false);
  assert.equal(second.shown.length, 1);
  assert.equal(second.retired, false);
  assertQuiet(second);

  const halt = await handleWork(new Request("https://dualiscapax.com/api/autonomy/work", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ state: second, stop: true })
  }));
  const host = await halt.json();
  assert.equal(host.retired, true);
  assert.equal(host.stop, true);
  assert.equal(host.log.length, 3);
  assert.equal(host.pending.length, second.pending.length);
  assertQuiet(host);
});

test("the door shows the theater that passed and keeps the work open", () => {
  const door = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const card = readFileSync(new URL("../llms.txt", import.meta.url), "utf8");
  const work = readFileSync(new URL("../js/autonomy-work.js", import.meta.url), "utf8");
  assert.equal(door.includes("The theater on this page is what passed the vote."), true);
  assert.equal(door.includes("The parts of the system meet each other here."), true);
  assert.equal(door.includes("The work does not retire."), true);
  assert.equal(door.includes("Only the host can stop it."), true);
  assert.equal(door.includes("The three rings passed the vote. Iris is the teal light."), true);
  assert.equal(door.includes('data-theater="rings"'), true);
  assert.equal(door.includes('data-piece="rings"'), true);
  assert.equal(door.includes("No early-adopter seat is named."), true);
  assert.equal(door.includes("No founder-board seat is named."), true);
  assert.equal(door.includes("The live specification does not name a founder board, a seat, or a cap."), true);
  assert.equal(door.includes('href="meeting.html"'), true);
  assert.equal(door.includes("css/writer.css"), true);
  assert.equal(door.includes("fonts.googleapis"), false);
  assert.equal(door.includes("home-quarks"), false);
  assert.equal(door.includes("curtain-skin"), false);
  assert.equal(door.includes('id="quarks"'), false);
  assert.equal(door.includes('id="scene"'), false);
  assert.equal(/\b(dna|helix|microsurgery|goggles)\b/i.test(door), false);
  assert.equal(work.includes("while"), false);
  assert.equal(card.includes("The theater on the page is what passed the vote."), true);
  assert.equal(card.includes("The work does not retire."), true);
});
