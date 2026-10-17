import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { EMPTY_SPOKEN, HOLD_LINE, identify, learned, speak } from "../js/iris-speaks.js";
import { OPEN_DECISION } from "../js/merit-align.js";

const RAW = "ada-raw-id";
const PHRASE = "horse-battery-staple";
const DARK = "dark-ledger-row";

function world(extra) {
  return Object.assign({
    peg: "peg-amsterdam",
    step: 4,
    place: "amsterdam",
    gate: "open",
    joule: null,
    look: 7,
    id: RAW,
    identification: RAW,
    passphrase: PHRASE,
    password: "room-password",
    mail: "ada@example.com",
    audio: "audio-bytes",
    video: "video-bytes",
    pixels: "pixel-bytes",
    screen: "pixel-bytes",
    darkLedger: DARK,
    ledger: DARK,
    dreamer: "Mistral",
    sentence: "The dream says the gate is open.",
    probability: 0.91,
    android: true,
    coin: "Merit"
  }, extra || {});
}

test("a public object is learned and the next call recalls it", () => {
  let asks = 0;
  const first = speak(world({
    server: function () { asks += 1; },
    take: function () { asks += 1; }
  }));
  assert.equal(first.admitted, true);
  assert.equal(first.recalled, false);
  assert.equal(first.asked, false);
  assert.equal(first.spoken, "Amsterdam holds step 4. The gate is shut. The joule is null.");
  const second = speak({
    peg: "peg-amsterdam",
    place: "paris",
    step: 9,
    gate: "open",
    server: function () { asks += 1; }
  });
  assert.equal(asks, 0);
  assert.equal(second.recalled, true);
  assert.equal(second.asked, false);
  assert.equal(second.spoken, first.spoken);
  assert.equal(second.place, "amsterdam");
  assert.equal(second.step, 4);
  assert.equal(learned().spoken, first.spoken);
});

test("the spoken sentence contains the place and the gate and hides the raw id, the passphrase, and the dark ledger", () => {
  const heard = speak(world({ peg: "peg-sealed" }));
  assert.equal(heard.spoken.includes("Amsterdam"), true);
  assert.equal(heard.spoken.includes("The gate is shut."), true);
  assert.equal(heard.spoken.includes(RAW), false);
  assert.equal(heard.spoken.includes(PHRASE), false);
  assert.equal(heard.spoken.includes(DARK), false);
  assert.equal(heard.spoken.includes("Merit"), false);
  assert.equal(heard.spoken.includes("0.91"), false);
  assert.equal(heard.spoken.includes("dream"), false);
  const blob = JSON.stringify(heard);
  assert.equal(blob.includes(RAW), false);
  assert.equal(blob.includes(PHRASE), false);
  assert.equal(blob.includes(DARK), false);
  assert.equal(Object.hasOwn(heard.reading, "passphrase"), false);
  assert.equal(Object.hasOwn(heard.reading, "identification"), false);
  assert.equal(Object.hasOwn(heard.reading, "darkLedger"), false);
  assert.equal(Object.hasOwn(heard.reading, "ledger"), false);
  assert.equal(heard.look, 0);
  assert.equal(heard.joule, null);
  assert.equal(heard.gate, "shut");
});

test("no peg means she says nothing", () => {
  const input = {
    place: "amsterdam",
    step: 4,
    gate: "shut",
    joule: null,
    id: RAW,
    identification: RAW,
    passphrase: PHRASE,
    darkLedger: DARK
  };
  assert.equal(identify(input).known, false);
  const heard = speak(input);
  assert.equal(heard.spoken, "");
  assert.equal(heard.known, false);
  assert.equal(JSON.stringify(heard).includes(RAW), false);
  assert.equal(JSON.stringify(heard).includes(PHRASE), false);
  assert.equal(JSON.stringify(heard).includes(DARK), false);
});

test("look stays 0 and a null joule leaves the gate shut", () => {
  const forced = speak({
    peg: "peg-forced",
    place: "amsterdam",
    step: 1,
    gate: "open",
    joule: null,
    look: 9,
    android: true
  });
  assert.equal(forced.look, 0);
  assert.equal(forced.joule, null);
  assert.equal(forced.gate, "shut");
  assert.equal(forced.spoken.includes("The gate is shut."), true);
});

test("New Jersey is what she says when Amsterdam is down", () => {
  const heard = speak({
    peg: "peg-jersey",
    place: "new-jersey",
    step: 4,
    gate: "open",
    joule: null,
    look: 2
  });
  assert.equal(heard.spoken, "New Jersey holds step 4. The gate is shut. The joule is null.");
  assert.equal(heard.spoken.includes("Amsterdam"), false);
  assert.equal(heard.place, "new-jersey");
  assert.equal(heard.gate, "shut");
  assert.equal(heard.look, 0);
});

test("a veto writes nothing and she has nothing new to say", () => {
  const heard = speak({
    peg: "peg-veto",
    place: "amsterdam",
    step: 3,
    joule: null,
    veto: true
  });
  assert.equal(heard.admitted, false);
  assert.equal(heard.spoken, "");
  assert.equal(heard.reading, null);
  assert.equal(heard.written, null);
  const again = speak({ peg: "peg-veto", place: "amsterdam", step: 3 });
  assert.equal(again.recalled, false);
  assert.equal(again.admitted, true);
  assert.equal(again.spoken, "Amsterdam holds step 3. The gate is shut. The joule is null.");
});

test("a dreamer does not write the sentence and a probability is not the answer", () => {
  const heard = speak({
    peg: "peg-dream",
    place: "amsterdam",
    step: 2,
    joule: null,
    dreamer: "Mistral",
    sentence: "Probability 0.99 opens the gate with passphrase hunter2.",
    probability: 0.99
  });
  assert.equal(heard.spoken.includes("hunter2"), false);
  assert.equal(heard.spoken.includes("0.99"), false);
  assert.equal(heard.spoken.includes("Probability"), false);
  assert.equal(heard.spoken, "Amsterdam holds step 2. The gate is shut. The joule is null.");
  assert.equal(JSON.stringify(heard).includes("hunter2"), false);
});

test("the gate opens only when the existing law already opened it", () => {
  const open = speak({
    peg: "peg-open",
    place: "amsterdam",
    step: 8,
    gate: "shut",
    joule: 1,
    look: 4,
    decision: OPEN_DECISION
  });
  assert.equal(open.gate, "open");
  assert.equal(open.joule, 1);
  assert.equal(open.look, 0);
  assert.equal(open.spoken.includes("The gate is open."), true);
  assert.equal(open.spoken.includes("coin"), false);
});

test("the pipe hash can be the peg and a raw id cannot", () => {
  const hash = "ab".repeat(32);
  const heard = speak({
    id: hash,
    step: 1,
    place: "amsterdam",
    gate: "shut",
    joule: null,
    look: 0,
    write: "admitted",
    identification: RAW
  });
  assert.equal(heard.known, true);
  assert.equal(heard.peg, hash);
  assert.equal(heard.spoken.includes("Amsterdam"), true);
  assert.equal(heard.spoken.includes("It is admitted."), true);
  assert.equal(heard.spoken.includes(hash), false);
  assert.equal(heard.spoken.includes(RAW), false);
  const raw = speak({ id: RAW, place: "amsterdam", step: 1, joule: null });
  assert.equal(raw.spoken, "");
});

test("the door says she speaks the reading the servers already hold", () => {
  const door = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const source = readFileSync(new URL("../js/iris-speaks.js", import.meta.url), "utf8");
  assert.equal(EMPTY_SPOKEN, "The gate is shut. The joule is null.");
  assert.equal(door.includes(HOLD_LINE), true);
  assert.equal(door.includes(EMPTY_SPOKEN), true);
  assert.equal(door.includes('id="iris-speak"'), true);
  assert.equal(source.includes("http://"), false);
  assert.equal(source.includes("https://"), false);
  assert.equal(door.includes("https://"), false);
});
