import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { SEAL, SENSES, SWITCH, open } from "../js/dark-ledger.js";
import { pegOf } from "../js/unity-wallet.js";

const RAW = "RAW-VISITOR-IDENTITY-77";
const PHRASE = "passphrase-violet-phrase-77";
const READING = "sense-reading-waveform-91";
const PREIMAGE = "preimage-of-the-peg-55";
const MAIL = "ada@secret.example";

function walk(value, visit) {
  visit(value);
  if (!value || typeof value !== "object") return;
  const names = Object.keys(value);
  for (let i = 0; i < names.length; i++) walk(value[names[i]], visit);
}

function packed(value) {
  return JSON.stringify(value);
}

function assertNoSecret(value, secret) {
  const body = packed(value);
  assert.equal(body.includes(secret), false);
  walk(value, function (node) {
    if (typeof node === "string") assert.equal(node.includes(secret), false);
    if (!node || typeof node !== "object") return;
    assert.equal(Object.hasOwn(node, "key"), false);
    assert.equal(Object.hasOwn(node, "password"), false);
    assert.equal(Object.hasOwn(node, "passphrase"), false);
    assert.equal(Object.hasOwn(node, "identification"), false);
    assert.equal(Object.hasOwn(node, "preimage"), false);
    assert.equal(Object.hasOwn(node, "audio"), false);
    assert.equal(Object.hasOwn(node, "video"), false);
    assert.equal(Object.hasOwn(node, "mail"), false);
    assert.equal(Object.hasOwn(node, "pixels"), false);
    assert.equal(Object.hasOwn(node, "unseal"), false);
  });
}

function assertQuiet(value) {
  assert.equal(value.look, 0);
  assert.equal(value.joule, null);
  assert.equal(value.gate, "shut");
  assert.equal(value.coin, null);
  assert.equal(value.stored, false);
  assert.equal(value.media, null);
  assert.equal(Object.hasOwn(value, "key"), false);
}

test("user off stays off", () => {
  const book = open();
  assert.equal(book.view().senses.audio.preference, false);
  assert.equal(book.view().senses.audio.live, false);
  const off = book.prefer("place", false);
  assert.equal(off.preference, false);
  assert.equal(off.live, false);
  assert.equal(off.grant, null);
  book.prefer("motion", true);
  const again = book.prefer("motion", false);
  assert.equal(again.preference, false);
  assert.equal(again.live, false);
  assert.equal(book.prefer("motion", false).preference, false);
  assert.equal(book.view().senses.motion.preference, false);
  assertQuiet(again);
});

test("user on sets the preference and does not invent an operating-system grant", () => {
  const book = open();
  const on = book.prefer("video", true);
  assert.equal(on.preference, true);
  assert.equal(on.grant, null);
  assert.equal(on.live, false);
  assert.equal(book.prefer("video", true).grant, null);
  assert.equal(book.view().senses.video.preference, true);
  assert.equal(book.view().senses.video.grant, null);
  assert.equal(book.view().senses.video.live, false);
  assert.equal(book.unseal, undefined);
  assertQuiet(on);
});

test("an Android no stays no", () => {
  const book = open();
  book.prefer("screen", true);
  const denied = book.android("screen", false);
  assert.equal(denied.grant, false);
  assert.equal(denied.live, false);
  assert.equal(denied.preference, true);
  const still = book.prefer("screen", true);
  assert.equal(still.preference, true);
  assert.equal(still.grant, false);
  assert.equal(still.live, false);
  const handed = book.hand("screen", "planckos", true);
  assert.equal(handed.grant, false);
  assert.equal(handed.live, false);
  assert.equal(book.view().senses.screen.grant, false);
  book.android("audio", false);
  book.hand("audio", "user", true);
  assert.equal(book.view().senses.audio.grant, false);
  assert.equal(book.view().senses.audio.preference, false);
  const allowed = book.android("place", true);
  assert.equal(allowed.grant, true);
  assert.equal(allowed.live, false);
  book.prefer("place", true);
  assert.equal(book.view().senses.place.live, true);
  book.prefer("place", false);
  assert.equal(book.view().senses.place.preference, false);
  assert.equal(book.view().senses.place.live, false);
  assert.equal(book.view().senses.place.grant, true);
  assertQuiet(denied);
});

test("raw identification is sealed and absent from the public record", async () => {
  const book = open();
  const row = await book.seal({ kind: "identification", identification: RAW, passphrase: PHRASE, look: 4, joule: 9 });
  assert.equal(row.sealed, true);
  assert.equal(row.step, 1);
  assert.equal(row.peg, await pegOf(RAW));
  assert.notEqual(row.peg, RAW);
  assertNoSecret(row, RAW);
  assertNoSecret(row, PHRASE);
  assertNoSecret(book.record(), RAW);
  assertNoSecret(book.record(), PHRASE);
  assert.equal(book.record().length, 1);
  assert.equal(book.record()[0], row);
  assert.equal(row.unseal, undefined);
  assertQuiet(row);
  const next = await book.seal({ kind: "passphrase", passphrase: PHRASE });
  assert.equal(next.step, 2);
  assert.equal(book.record().length, 2);
});

test("a passphrase is absent from the public record", async () => {
  const book = open();
  const row = await book.seal({ kind: "password", password: PHRASE, passphrase: PHRASE });
  assert.equal(row.sealed, true);
  assert.equal(row.peg, null);
  assert.equal(row.step, 1);
  assertNoSecret(row, PHRASE);
  assertNoSecret(book.record(), PHRASE);
  assert.equal(packed(row).includes("password"), false);
  assertQuiet(row);
});

test("a sense reading is absent and the public record shows the preference and the seal", async () => {
  const book = open();
  book.prefer("audio", true);
  const row = await book.seal({
    kind: "audio",
    sense: "audio",
    audio: READING,
    pixels: "pixel-secret-77",
    video: "frame-secret-77"
  });
  assert.equal(row.sealed, true);
  assert.equal(row.sense, "audio");
  assert.equal(row.preference, true);
  assert.equal(row.grant, null);
  assert.equal(row.live, false);
  assert.equal(row.peg, null);
  assertNoSecret(row, READING);
  assertNoSecret(row, "pixel-secret-77");
  assertNoSecret(row, "frame-secret-77");
  assertNoSecret(book.record(), READING);
  assert.equal(book.record()[0].preference, true);
  assert.equal(book.record()[0].sealed, true);
  assertQuiet(row);
  const place = await book.seal({ sense: "place", place: { lat: "place-secret-77" } });
  assert.equal(place.sense, "place");
  assert.equal(place.preference, false);
  assert.equal(place.sealed, true);
  assertNoSecret(place, "place-secret-77");
  assert.equal(book.record().length, 2);
});

test("a preimage and a mail message stay off the public record", async () => {
  const book = open();
  const pre = await book.seal({ kind: "preimage", preimage: PREIMAGE });
  assert.equal(pre.sealed, true);
  assert.equal(pre.peg, await pegOf(PREIMAGE));
  assertNoSecret(pre, PREIMAGE);
  assertNoSecret(book.record(), PREIMAGE);
  const mail = await book.seal({ kind: "mail", mail: MAIL, subject: "inbox-secret-subject" });
  assert.equal(mail.sealed, true);
  assert.equal(mail.peg, null);
  assertNoSecret(mail, MAIL);
  assertNoSecret(mail, "inbox-secret-subject");
  assertNoSecret(book.record(), MAIL);
  assertQuiet(mail);
});

test("one step seals one piece and a list is not unsealed", async () => {
  const book = open();
  const listed = await book.seal([{ passphrase: PHRASE }, { audio: READING }]);
  assert.equal(listed.sealed, false);
  assert.equal(book.record().length, 0);
  assertNoSecret(listed, PHRASE);
  assertNoSecret(listed, READING);
  const one = await book.seal({ kind: "motion", sense: "motion", motion: READING });
  assert.equal(one.step, 1);
  assert.equal(one.sealed, true);
  assertNoSecret(one, READING);
  assert.equal(book.record().length, 1);
  const source = readFileSync(new URL("../js/dark-ledger.js", import.meta.url), "utf8");
  assert.equal(source.includes("while"), false);
  assert.equal(source.includes("for ("), false);
  assert.equal(source.includes("for("), false);
  assert.equal(source.includes("getUserMedia"), false);
  assert.equal(source.includes("geolocation"), false);
  assert.equal(/\/\//.test(source), false);
  assert.equal(source.includes("unseal"), false);
});

test("look stays 0 and the joule stays null", async () => {
  const book = open();
  book.prefer("microphone", true);
  const row = await book.seal({ kind: "identification", identification: RAW, look: 8, joule: 3 });
  assert.equal(row.look, 0);
  assert.equal(row.joule, null);
  assert.equal(book.view().look, 0);
  assert.equal(book.view().joule, null);
  assert.equal(book.view().gate, "shut");
  assert.equal(book.view().coin, null);
  assert.equal(book.record()[0].look, 0);
  assert.equal(book.record()[0].joule, null);
  const shut = book.close();
  assert.equal(shut.watching, false);
  assert.equal(shut.look, 0);
  assert.equal(shut.joule, null);
  book.android("microphone", true);
  book.prefer("microphone", true);
  assert.equal(book.view().senses.microphone.grant, null);
  assert.equal(book.view().senses.microphone.preference, true);
  assert.equal(book.view().watching, false);
  const after = await book.seal({ kind: "passphrase", passphrase: PHRASE });
  assert.equal(after.sealed, false);
  assertNoSecret(after, PHRASE);
  assert.equal(book.record().length, 1);
  assert.equal(SENSES.includes("audio"), true);
  assert.equal(SENSES.includes("motion"), true);
});

test("the senses page says the switch and seals the identification", () => {
  const html = readFileSync(new URL("../senses.html", import.meta.url), "utf8");
  assert.equal(html.includes(SWITCH), true);
  assert.equal(html.includes(SEAL), true);
  assert.equal(html.includes('from "./js/dark-ledger.js"'), true);
  assert.equal(html.includes("ledger.prefer"), true);
  assert.equal(html.includes("ledger.android"), true);
  assert.equal(html.includes("ledger.seal"), true);
  assert.equal(html.includes("ledger.close"), true);
  assert.equal(html.includes('href="css/writer.css"'), true);
  assert.equal((html.match(/stylesheet/g) || []).length, 1);
  assert.equal(/\b(dna|helix|microsurgery)\b/i.test(SWITCH + SEAL), false);
});
