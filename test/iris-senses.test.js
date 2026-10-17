import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { askSense } from "../js/iris-senses-live.js";
import { DEFAULT_ON, EXAMPLES, IDEMPOTENT, LABELS, RING_RULE, SENSES, SPATIAL, open } from "../js/iris-senses.js";
import { pegOf } from "../js/unity-wallet.js";

const HOST = "host-unity-one";
const FRIEND = "friend-unity-one";

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
    assert.equal(Object.hasOwn(node, "secret"), false);
    assert.equal(Object.hasOwn(node, "phrase"), false);
    assert.equal(Object.hasOwn(node, "audio"), false);
    assert.equal(Object.hasOwn(node, "video"), false);
    assert.equal(Object.hasOwn(node, "pixels"), false);
    assert.equal(Object.hasOwn(node, "dna"), false);
    assert.equal(Object.hasOwn(node, "child"), false);
  });
  const packed = JSON.stringify(value);
  assert.equal(packed.includes("\"key\""), false);
  assert.equal(packed.includes("\"secret\""), false);
  assert.equal(packed.includes("\"phrase\""), false);
}

function assertQuiet(value) {
  assert.equal(value.look, 0);
  assert.equal(value.joule, null);
  assert.equal(value.gate, "shut");
  assert.equal(value.open, false);
  assert.equal(value.minted, false);
  assert.equal(value.coin, null);
  assert.equal(value.media, null);
  assert.equal(value.stored, false);
  assert.equal(value.writer, false);
  assertNoKey(value);
}

test("before the agreement every sense is off and nothing is requested", async () => {
  const room = open();
  const state = room.view();
  assert.equal(state.signed, false);
  assert.equal(state.spatial, false);
  assert.equal(state.meeting, null);
  assert.equal(room.media(), null);
  for (let i = 0; i < SENSES.length; i++) {
    const row = state.senses[SENSES[i]];
    assert.equal(row.preference, false);
    assert.equal(row.live, "off");
    assert.equal(row.opens, 0);
    assert.equal(row.requested, false);
    assertQuiet(row);
    const turned = room.set(SENSES[i], true);
    assert.equal(turned.preference, false);
    assert.equal(turned.requested, false);
    const asked = room.ask(SENSES[i]);
    assert.equal(asked.requested, false);
    assert.equal(asked.live, "off");
    const granted = room.grant(SENSES[i], true);
    assert.equal(granted.live, "off");
    assert.equal(granted.opens, 0);
  }
  const unsigned = await room.sign({ unityId: HOST, body: "Ada" });
  assert.equal(unsigned.signed, false);
  assert.equal(unsigned.reason, "unsigned");
  assert.equal(room.view().senses.microphone.preference, false);
  assertQuiet(unsigned);
  assert.equal(room.memory().length, 0);
});

test("signing turns the preferences on and leaves the live grant pending", async () => {
  const room = open();
  const signed = await room.sign({ agree: true, unityId: HOST, body: "Ada", kind: "human" });
  assert.equal(signed.signed, true);
  assert.equal(signed.spatial, true);
  assert.equal(signed.peg, await pegOf(HOST));
  assert.equal(signed.iris, "Iris");
  assert.equal(JSON.stringify(signed).includes(HOST), false);
  assert.equal(JSON.stringify(room.memory()).includes(HOST), false);
  assert.equal(room.memory()[0].peg, signed.peg);
  assert.equal(room.memory()[0].look, 0);
  assert.equal(room.memory()[0].joule, null);
  assertQuiet(signed);
  for (let i = 0; i < SENSES.length; i++) {
    const row = signed.senses[SENSES[i]];
    assert.equal(row.preference, true);
    assert.equal(row.live, "pending");
    assert.equal(row.opens, 0);
    assert.equal(row.requested, false);
    assertQuiet(row);
  }
  if (signed.meeting) {
    assert.equal(signed.meeting.mode, "one");
    assert.equal(signed.meeting.look, 0);
    assert.equal(signed.meeting.joule, null);
    assert.equal(JSON.stringify(signed.meeting).includes(HOST), false);
  }
  const again = await room.sign({ agree: true, unityId: HOST, body: "Ada" });
  assert.equal(again.senses.front.opens, 0);
  assert.equal(again.senses.front.preference, true);
  assert.equal(room.memory().length, 1);
});

test("turning one sense off leaves the others on", async () => {
  const room = open();
  await room.sign({ agree: true, unityId: HOST, body: "Ada" });
  const off = room.set("microphone", false);
  assert.equal(off.preference, false);
  assert.equal(off.live, "off");
  assert.equal(off.opens, 0);
  assert.equal(off.requested, false);
  assertQuiet(off);
  const state = room.view();
  for (let i = 0; i < SENSES.length; i++) {
    const name = SENSES[i];
    if (name === "microphone") assert.equal(state.senses[name].preference, false);
    else assert.equal(state.senses[name].preference, true);
  }
});

test("turning a sense on again does not create a second open", async () => {
  const room = open();
  await room.sign({ agree: true, unityId: HOST, body: "Ada" });
  room.set("front", false);
  const back = room.set("front", true);
  assert.equal(back.preference, true);
  assert.equal(back.opens, 0);
  assert.equal(back.requested, false);
  const firstAsk = room.ask("front");
  assert.equal(firstAsk.requested, true);
  assert.equal(firstAsk.same, false);
  assert.equal(firstAsk.opens, 0);
  const first = room.grant("front", true);
  assert.equal(first.live, "granted");
  assert.equal(first.opens, 1);
  assert.equal(first.same, false);
  const secondAsk = room.ask("front");
  assert.equal(secondAsk.same, true);
  assert.equal(secondAsk.opens, 1);
  const second = room.grant("front", true);
  assert.equal(second.opens, 1);
  assert.equal(second.same, true);
  assert.equal(second.live, "granted");
  room.set("front", false);
  assert.equal(room.view().senses.front.opens, 0);
  assert.equal(room.view().senses.front.live, "off");
  room.set("front", true);
  room.ask("front");
  const reopened = room.grant("front", true);
  assert.equal(reopened.opens, 1);
  assert.equal(reopened.same, false);
  room.ask("front");
  assert.equal(room.grant("front", true).opens, 1);
  assertQuiet(reopened);
});

test("off stays off", async () => {
  const room = open();
  await room.sign({ agree: true, unityId: HOST, body: "Ada" });
  room.ask("gyroscope");
  room.grant("gyroscope", true);
  assert.equal(room.view().senses.gyroscope.opens, 1);
  room.set("gyroscope", false);
  const asked = room.ask("gyroscope");
  assert.equal(asked.preference, false);
  assert.equal(asked.requested, false);
  assert.equal(asked.live, "off");
  assert.equal(asked.opens, 0);
  const granted = room.grant("gyroscope", true);
  assert.equal(granted.live, "off");
  assert.equal(granted.opens, 0);
  assert.equal(granted.preference, false);
  assert.equal(room.view().senses.motion.preference, true);
  assertQuiet(granted);
});

test("a friend with a Unity ID joins and only receives senses that are on", async () => {
  const room = open();
  await room.sign({ agree: true, unityId: HOST, body: "Ada" });
  const shut = await room.join({ unityId: FRIEND, body: "Bea" });
  assert.equal(shut.joined, false);
  assert.equal(shut.reason, "closed");
  room.seat("arc");
  room.set("microphone", false);
  room.set("rear", false);
  const friend = await room.join({ unityId: FRIEND, body: "Bea" });
  assert.equal(friend.joined, true);
  assert.equal(friend.reason, "one");
  assert.equal(friend.ring, "arc");
  assert.equal(friend.peg, await pegOf(FRIEND));
  assert.equal(friend.senses.includes("microphone"), false);
  assert.equal(friend.senses.includes("rear"), false);
  assert.equal(friend.senses.includes("front"), true);
  assert.equal(friend.senses.includes("screen"), true);
  assert.equal(friend.senses.includes("place"), true);
  assert.equal(JSON.stringify(friend).includes(FRIEND), false);
  assert.equal(JSON.stringify(room.view()).includes(FRIEND), false);
  assert.equal(JSON.stringify(room.memory()).includes(FRIEND), false);
  assert.equal(room.memory().length, 2);
  assert.equal(room.view().friends.length, 1);
  assert.equal(room.view().friends[0].senses.includes("microphone"), false);
  assert.equal(room.view().mode, "group");
  assertQuiet(friend);
  room.set("front", false);
  assert.equal(room.view().friends[0].senses.includes("front"), false);
  assert.equal(room.view().friends[0].senses.includes("screen"), true);
  const dupBody = await room.join({ unityId: "friend-unity-two", body: "Bea" });
  assert.equal(dupBody.joined, false);
  assert.equal(dupBody.reason, "duplicate");
  assert.equal(dupBody.peg, null);
  const dupId = await room.join({ unityId: FRIEND, body: "Cara" });
  assert.equal(dupId.joined, false);
  assert.equal(dupId.reason, "duplicate");
  assert.equal(room.view().friends.length, 1);
  assertQuiet(dupBody);
});

test("a friend with no Unity ID cannot join, and leaving removes them", async () => {
  const room = open();
  await room.sign({ agree: true, unityId: HOST, body: "Ada" });
  room.seat("cosmos");
  for (const input of [{ body: "Cara" }, { unityId: "  ", body: "Cara" }, { unityId: null }, {}]) {
    const missing = await room.join(input);
    assert.equal(missing.joined, false);
    assert.equal(missing.reason, "absent");
    assert.equal(missing.peg, null);
    assertQuiet(missing);
  }
  assert.equal(room.view().friends.length, 0);
  const friend = await room.join({ unityId: FRIEND, body: "Bea" });
  assert.equal(friend.joined, true);
  const left = await room.leave({ unityId: FRIEND });
  assert.equal(left.left, true);
  assert.equal(left.peg, await pegOf(FRIEND));
  assert.equal(JSON.stringify(left).includes(FRIEND), false);
  assert.equal(room.view().friends.length, 0);
  assert.equal(room.memory().length, 1);
  assert.equal(room.view().mode, room.view().meeting ? room.view().meeting.mode : "one");
  const again = await room.leave({ unityId: FRIEND });
  assert.equal(again.left, false);
  assert.equal(again.reason, "absent");
  room.seat("iris");
  await room.join({ unityId: FRIEND, body: "Bea" });
  assert.equal(room.view().friends.length, 1);
  const closed = room.close();
  assert.equal(closed.ringOpen, false);
  assert.equal(room.view().friends.length, 0);
  assert.equal(room.view().ring, null);
  const after = await room.join({ unityId: FRIEND, body: "Bea" });
  assert.equal(after.joined, false);
  assert.equal(after.reason, "closed");
  assertQuiet(closed);
  assert.equal(room.media(), null);
});

test("no media is stored and the live ask does not open a second handle", async () => {
  const room = open();
  await room.sign({ agree: true, unityId: HOST, body: "Ada" });
  assert.equal(room.media(), null);
  assert.equal(room.view().media, null);
  const held = { stop: function () {} };
  const same = await askSense("microphone", held);
  assert.equal(same.granted, true);
  assert.equal(same.same, true);
  assert.equal(same.handle, held);
  assert.equal(same.media, null);
  assert.equal(same.stored, false);
  assert.equal(same.look, 0);
  assert.equal(same.joule, null);
  assert.equal(same.gate, "shut");
  assert.equal(same.coin, null);
  assertNoKey(same);
  const denied = await askSense("microphone", null);
  assert.equal(denied.granted, false);
  assert.equal(denied.same, false);
  assert.equal(denied.handle, null);
  assert.equal(denied.media, null);
  assert.equal(denied.look, 0);
  assert.equal(denied.joule, null);
  const logic = readFileSync(new URL("../js/iris-senses.js", import.meta.url), "utf8");
  assert.equal(logic.includes("getUserMedia"), false);
  assert.equal(logic.includes("getDisplayMedia"), false);
  assert.equal(logic.includes("geolocation"), false);
  const live = readFileSync(new URL("../js/iris-senses-live.js", import.meta.url), "utf8");
  assert.equal(live.includes("MediaRecorder"), false);
  assert.equal(live.includes("toDataURL"), false);
  assert.equal(live.includes("watchPosition"), false);
  assert.equal(live.includes("localStorage"), false);
  assert.equal(live.includes("indexedDB"), false);
});

test("the page says the rules and the New World examples", () => {
  const html = readFileSync(new URL("../senses.html", import.meta.url), "utf8");
  assert.equal(html.includes(IDEMPOTENT), true);
  assert.equal(html.includes(DEFAULT_ON), true);
  assert.equal(html.includes(RING_RULE), true);
  assert.equal(html.includes(SPATIAL), true);
  for (let i = 0; i < EXAMPLES.length; i++) assert.equal(html.includes(EXAMPLES[i]), true);
  assert.equal(html.includes("One became two. Adam and Eve are the human name for that split: one life, two branches."), true);
  assert.equal(html.includes("IBM, 2004. eFuse was adopted for micro circuitry."), true);
  assert.equal(html.includes("Nothing to remember."), true);
  assert.equal(html.includes("Everything on this network has one Unity ID."), true);
  assert.equal(html.includes("The published joule is null, so the Merit gate stays shut."), true);
  assert.equal(html.includes("No coin is offered."), true);
  assert.equal(html.includes("No child's record."), true);
  assert.equal(html.includes('href="css/writer.css"'), true);
  assert.equal(html.includes("seed.css"), false);
  assert.equal(LABELS.place, "Place");
  assert.equal(html.includes("> Place<"), true);
});
