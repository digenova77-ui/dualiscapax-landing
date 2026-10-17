import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { NAME, RINGS, SENTENCE, boot } from "../js/planckos.js";

function packed(value) {
  return JSON.stringify(value);
}

test("one boot hands to Android", () => {
  const row = boot();
  assert.equal(row.name, NAME);
  assert.equal(row.name, "PLANCKOS");
  assert.equal(row.beats.length, 2);
  assert.equal(row.beats[0].beat, 1);
  assert.equal(row.beats[0].name, "rings");
  assert.equal(row.beats[0].rings.length, 3);
  assert.equal(row.beats[0].rings[0].name, "Iris");
  assert.equal(row.beats[0].rings[0].light, "teal");
  assert.equal(row.beats[0].rings[1].name, "cosmos");
  assert.equal(row.beats[0].rings[2].name, "outer arc");
  assert.equal(row.beats[0].rings, RINGS);
  assert.equal(row.beats[1].beat, 2);
  assert.equal(row.beats[1].name, "handoff");
  assert.equal(row.beats[1].os, "Android");
  assert.equal(row.beats[1].handed, true);
  assert.equal(row.os, "Android");
  assert.equal(row.handed, true);
  assert.equal(row.host, "Android");
  assert.equal(row.stopped, true);
  assert.equal(row.loop, false);
});

test("a second boot is the same handoff", () => {
  const protocol = { stop: false };
  const first = boot({ os: "iOS", handed: false, admitted: true }, protocol);
  const second = boot({ os: "PLANCKOS", handed: false, admitted: true, retired: true }, protocol);
  assert.equal(first, second);
  assert.equal(second.os, "Android");
  assert.equal(second.handed, true);
  assert.equal(second.loop, false);
  assert.equal(second.retired, false);
  assert.equal(second.stop, false);
  assert.equal(protocol.stop, false);
  assert.equal(Object.hasOwn(protocol, "retired"), false);
  assert.equal(second.beats.length, 2);
});

test("the bootstrap holds no sense and no secret", () => {
  const row = boot({
    sense: "microphone",
    password: "secret",
    mail: "ada@example.com",
    identification: "raw-id",
    microphone: "on",
    camera: true,
    screen: "on",
    place: "on",
    granted: true,
    coin: "Merit",
    key: "raw-key"
  });
  const before = row.beats[0];
  assert.equal(before.sense, null);
  assert.equal(before.password, null);
  assert.equal(before.mail, null);
  assert.equal(before.identification, null);
  assert.equal(before.microphone, "off");
  assert.equal(before.camera, "off");
  assert.equal(before.screen, "off");
  assert.equal(before.place, "off");
  assert.equal(before.granted, false);
  assert.equal(before.grants.microphone, false);
  assert.equal(before.grants.camera, false);
  assert.equal(before.grants.screen, false);
  assert.equal(before.grants.place, false);
  assert.equal(row.sense, null);
  assert.equal(row.password, null);
  assert.equal(row.mail, null);
  assert.equal(row.identification, null);
  assert.equal(row.microphone, "off");
  assert.equal(row.camera, "off");
  assert.equal(row.screen, "off");
  assert.equal(row.place, "off");
  assert.equal(row.granted, false);
  assert.equal(row.coin, null);
  assert.equal(Object.hasOwn(row, "key"), false);
  const body = packed(row);
  assert.equal(body.includes("secret"), false);
  assert.equal(body.includes("ada@example.com"), false);
  assert.equal(body.includes("raw-id"), false);
  assert.equal(body.includes("raw-key"), false);
  assert.equal(/\bdna\b/i.test(body), false);
  assert.equal(/microsurgery/i.test(body), false);
  assert.equal(/ethereum|bitcoin|0x[0-9a-f]/i.test(body), false);
});

test("look stays 0", () => {
  const row = boot({ look: 4 });
  assert.equal(row.look, 0);
  assert.equal(row.beats[0].look, 0);
  assert.equal(row.beats[1].look, 0);
});

test("joule stays null", () => {
  const row = boot({ joule: 9 });
  assert.equal(row.joule, null);
  assert.equal(row.beats[0].joule, null);
  assert.equal(row.beats[1].joule, null);
});

test("a client cannot set the handoff", () => {
  const row = boot({ os: "iOS", handed: false, admitted: true });
  assert.equal(row.os, "Android");
  assert.equal(row.handed, true);
  assert.equal(row.admitted, false);
  assert.equal(row.beats[1].os, "Android");
  assert.equal(row.beats[1].handed, true);
  assert.equal(row.beats[1].admitted, false);
  assert.throws(() => {
    row.os = "iOS";
  });
  assert.throws(() => {
    row.handed = false;
  });
  assert.throws(() => {
    row.admitted = true;
  });
  assert.equal(row.os, "Android");
  assert.equal(row.handed, true);
  assert.equal(row.admitted, false);
});

test("the door says the bootstrap in one sentence", () => {
  const door = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const card = readFileSync(new URL("../llms.txt", import.meta.url), "utf8");
  const source = readFileSync(new URL("../js/planckos.js", import.meta.url), "utf8");
  assert.equal(door.includes(SENTENCE), true);
  assert.equal(card.includes(SENTENCE), true);
  assert.equal(door.includes('href="css/writer.css"'), true);
  assert.equal(door.includes("styles.css"), false);
  assert.equal(/\b(dna|helix|microsurgery)\b/i.test(door), false);
  assert.equal(/\/\//.test(source), false);
  assert.equal(/\bREM\b/.test(source), false);
  assert.equal(/\b(kernel|exploit|rom)\b/i.test(source), false);
});
