import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { auditPipe, writePipe } from "../js/dclm-write.js";
import { SENTENCES, open } from "../js/dark-ledger.js";
import { pegOf } from "../js/unity-wallet.js";

const HOLD = {
  NO_FORCE: true,
  HOST_SAFE: true,
  CLEANUP_FIRST: true,
  TRUTH_OR_NOTHING: true
};

const GIVER = "giver-unity-ada";
const RECEIVER = "receiver-unity-bea";
const SECRET = "sealed-diary-not-for-the-screen";
const PASS = "do-not-keep-this-phrase";
const MAIL = "ada@example.test";
const AUDIO = "audio-bytes-not-stored";
const VIDEO = "video-bytes-not-stored";
const PIXELS = "pixel-rgba-not-stored";

function quiet(record) {
  assert.equal(record.look, 0);
  assert.equal(record.joule, null);
  assert.equal(Object.hasOwn(record, "key"), false);
  assert.equal(JSON.stringify(record).includes("\"key\""), false);
}

function packed(record) {
  return JSON.stringify(record);
}

function leaks(record) {
  const text = packed(record);
  assert.equal(text.includes(GIVER), false);
  assert.equal(text.includes(RECEIVER), false);
  assert.equal(text.includes(SECRET), false);
  assert.equal(text.includes(PASS), false);
  assert.equal(text.includes(MAIL), false);
  assert.equal(text.includes(AUDIO), false);
  assert.equal(text.includes(VIDEO), false);
  assert.equal(text.includes(PIXELS), false);
}

test("no ask returns no ledger", async () => {
  const book = open();
  const view = await book.screen({
    id: GIVER,
    ledger: SECRET,
    material: SECRET,
    password: PASS,
    passphrase: PASS,
    mail: MAIL,
    look: 4,
    joule: 9
  });
  assert.equal(view.asked, false);
  assert.equal(view.ledger, null);
  assert.equal(Object.hasOwn(view, "seal"), false);
  assert.equal(Object.hasOwn(view, "peg"), false);
  assert.equal(Object.hasOwn(view, "right"), false);
  assert.equal(book.audit().length, 0);
  quiet(view);
  leaks(view);
});

test("an ask for your own returns your seal and not the raw id", async () => {
  const book = open();
  const view = await book.ask({
    id: GIVER,
    body: "Ada",
    password: PASS,
    passphrase: PASS,
    mail: MAIL,
    audio: AUDIO,
    video: VIDEO,
    pixels: PIXELS,
    look: 2,
    joule: 3
  });
  assert.equal(view.asked, true);
  assert.equal(view.own, true);
  assert.equal(view.ledger, null);
  assert.equal(view.seal.peg, await pegOf(GIVER));
  assert.equal(view.seal.iris, "Iris");
  assert.equal(view.seal.look, 0);
  assert.equal(view.seal.joule, null);
  assert.deepEqual(Object.keys(view.seal), ["peg", "iris", "look", "joule"]);
  const row = book.audit()[0];
  assert.equal(row.step, 1);
  assert.equal(row.act, "ask");
  assert.equal(row.giver, view.seal.peg);
  assert.equal(row.receiver, view.seal.peg);
  quiet(view);
  quiet(view.seal);
  quiet(row);
  leaks(view);
  leaks(book.audit());
  const later = await book.screen({ id: GIVER });
  assert.equal(later.asked, false);
  assert.equal(later.ledger, null);
  assert.equal(Object.hasOwn(later, "seal"), false);
  quiet(later);
});

test("an ask does not return someone else's ledger", async () => {
  const book = open();
  const given = await book.give({
    giver: { id: GIVER, body: "Ada" },
    receiver: { id: RECEIVER, body: "Bea" }
  });
  assert.equal(given.given, true);
  const view = await book.ask({
    id: RECEIVER,
    body: "Bea",
    whose: { id: GIVER, body: "Ada" },
    material: SECRET
  });
  assert.equal(view.asked, true);
  assert.equal(view.own, false);
  assert.equal(view.right, true);
  assert.equal(view.ledger, null);
  assert.equal(Object.hasOwn(view, "seal"), false);
  assert.equal(Object.hasOwn(view, "peg"), false);
  assert.equal(packed(view).includes(await pegOf(GIVER)), false);
  quiet(view);
  leaks(view);
  const own = await book.ask({ id: RECEIVER, body: "Bea" });
  assert.equal(own.own, true);
  assert.equal(own.seal.peg, await pegOf(RECEIVER));
  assert.equal(packed(own).includes(await pegOf(GIVER)), false);
  assert.equal(packed(own).includes(GIVER), false);
  quiet(own);
});

test("a give to a real receiver is audited", async () => {
  const book = open();
  const given = await book.give({
    giverId: GIVER,
    receiverId: RECEIVER,
    place: "anywhere",
    clock: "anytime",
    way: "anyhow",
    password: PASS,
    mail: MAIL,
    audio: AUDIO,
    video: VIDEO,
    pixels: PIXELS,
    material: SECRET,
    look: 1,
    joule: 8
  });
  assert.equal(given.given, true);
  assert.equal(given.reason, "given");
  assert.equal(given.ledger, null);
  assert.equal(given.audit.step, 1);
  assert.equal(given.audit.act, "give");
  assert.equal(given.audit.giver, await pegOf(GIVER));
  assert.equal(given.audit.receiver, await pegOf(RECEIVER));
  assert.deepEqual(Object.keys(given.audit).sort(), ["act", "giver", "joule", "look", "receiver", "step"]);
  assert.equal(book.audit().length, 1);
  assert.equal(book.audit()[0], given.audit);
  quiet(given);
  quiet(given.audit);
  leaks(given);
  leaks(book.audit());
  const missing = await book.give({ giver: GIVER, receiver: "   " });
  const spare = await book.give({
    giver: { id: "second-unity-ada", body: "Ada", secondId: "another-unity-ada" },
    receiver: { id: RECEIVER, body: "Bea" }
  });
  assert.equal(missing.given, false);
  assert.equal(missing.reason, "absent");
  assert.equal(missing.audit, null);
  assert.equal(spare.given, false);
  assert.equal(spare.reason, "second");
  assert.equal(book.audit().length, 1);
  quiet(missing);
  quiet(spare);
});

test("a gain without a give is refused", async () => {
  const book = open();
  const gained = await book.gain({
    giver: GIVER,
    receiver: RECEIVER,
    take: true,
    force: true,
    anywhere: true,
    material: SECRET,
    password: PASS
  });
  assert.equal(gained.gained, false);
  assert.equal(gained.given, false);
  assert.equal(gained.right, false);
  assert.equal(gained.reason, "ungiven");
  assert.equal(gained.ledger, null);
  assert.equal(gained.audit, null);
  assert.equal(gained.written, null);
  assert.equal(book.audit().length, 0);
  quiet(gained);
  leaks(gained);
});

test("a gain with a give is audited and still does not put their material on your screen", async () => {
  const book = open();
  await book.give({ giver: GIVER, receiver: RECEIVER });
  const gained = await book.gain({
    giver: GIVER,
    receiver: RECEIVER,
    place: "anywhere",
    where: "any place",
    clock: "any time",
    when: 0,
    way: "any way",
    material: SECRET,
    ledger: SECRET,
    password: PASS,
    passphrase: PASS,
    mail: MAIL,
    audio: AUDIO,
    video: VIDEO,
    pixels: PIXELS,
    look: 7,
    joule: 11
  });
  assert.equal(gained.gained, true);
  assert.equal(gained.right, true);
  assert.equal(gained.ledger, null);
  assert.equal(Object.hasOwn(gained, "seal"), false);
  assert.equal(Object.hasOwn(gained, "material"), false);
  assert.equal(gained.audit.act, "gain");
  assert.equal(gained.audit.step, 2);
  assert.equal(gained.audit.giver, await pegOf(GIVER));
  assert.equal(gained.audit.receiver, await pegOf(RECEIVER));
  assert.equal(packed(gained).includes("anywhere"), false);
  assert.equal(packed(gained).includes("any time"), false);
  quiet(gained);
  quiet(gained.audit);
  leaks(gained);
  leaks(book.audit());
  const screen = await book.screen({
    asked: true,
    id: RECEIVER,
    whose: GIVER
  });
  assert.equal(screen.right, true);
  assert.equal(screen.own, false);
  assert.equal(screen.ledger, null);
  assert.equal(Object.hasOwn(screen, "seal"), false);
  assert.equal(packed(screen).includes(SECRET), false);
  assert.equal(packed(screen).includes(await pegOf(GIVER)), false);
  quiet(screen);
});

test("a skipped law writes nothing", async () => {
  const book = open();
  const task = { id: "give", what: "give", axioms: HOLD, skipped: ["HOST_SAFE"] };
  assert.equal(writePipe(task).ok, true);
  assert.equal(auditPipe(task).ok, false);
  const skipped = await book.give({
    giver: GIVER,
    receiver: RECEIVER,
    skipped: ["HOST_SAFE"],
    material: SECRET
  });
  assert.equal(skipped.given, false);
  assert.equal(skipped.written, null);
  assert.equal(skipped.audit, null);
  assert.equal(skipped.reason, "SKIPPED HOST_SAFE");
  assert.equal(book.audit().length, 0);
  quiet(skipped);
  const veto = await book.give({ giver: GIVER, receiver: RECEIVER, veto: true });
  assert.equal(veto.given, false);
  assert.equal(veto.reason, "VETO");
  assert.equal(book.audit().length, 0);
  const blind = await book.gain({
    giver: GIVER,
    receiver: RECEIVER,
    skipped: ["TRUTH_OR_NOTHING"]
  });
  assert.equal(blind.gained, false);
  assert.equal(book.audit().length, 0);
  const asked = await book.ask({ id: GIVER, skipped: ["NO_FORCE"] });
  assert.equal(asked.ledger, null);
  assert.equal(Object.hasOwn(asked, "seal"), false);
  assert.equal(book.audit().length, 0);
  const held = open();
  await held.give({ giver: GIVER, receiver: RECEIVER });
  const blocked = await held.gain({
    giver: GIVER,
    receiver: RECEIVER,
    skipped: ["CLEANUP_FIRST"],
    material: SECRET
  });
  assert.equal(blocked.gained, false);
  assert.equal(blocked.reason, "SKIPPED CLEANUP_FIRST");
  assert.equal(blocked.audit, null);
  assert.equal(blocked.ledger, null);
  assert.equal(held.audit().length, 1);
  assert.equal(held.audit()[0].act, "give");
  quiet(veto);
  quiet(blind);
  quiet(asked);
  quiet(blocked);
  leaks(blocked);
});

test("a second id for the same body is refused and a missing id is refused", async () => {
  const book = open();
  const seated = await book.give({
    giver: { id: GIVER, body: "Ada" },
    receiver: { id: RECEIVER, body: "Bea" }
  });
  assert.equal(seated.given, true);
  const again = await book.give({
    giver: { id: "other-unity-ada", body: "Ada" },
    receiver: { id: "other-unity-bea", body: "Cy" }
  });
  assert.equal(again.given, false);
  assert.equal(again.reason, "second");
  assert.equal(book.audit().length, 1);
  const oneCall = await open().give({
    giver: { id: GIVER, ids: [GIVER, "spare-unity-ada"], body: "Ada" },
    receiver: RECEIVER
  });
  assert.equal(oneCall.given, false);
  assert.equal(oneCall.reason, "second");
  assert.equal(oneCall.audit, null);
  const blank = await open().give({ receiver: RECEIVER });
  assert.equal(blank.given, false);
  assert.equal(blank.reason, "absent");
  quiet(again);
  quiet(oneCall);
  quiet(blank);
  leaks(book.audit());
});

test("look stays 0 and joule stays null", async () => {
  const book = open();
  const given = await book.give({ giver: GIVER, receiver: RECEIVER, look: 5, joule: 6 });
  const gained = await book.gain({ giver: GIVER, receiver: RECEIVER, look: 1, joule: 1 });
  const view = await book.ask({ id: GIVER, look: 9, joule: 4 });
  const idle = await book.screen({ id: GIVER, look: 3, joule: 2 });
  for (const record of [given, gained, view, idle, given.audit, gained.audit, view.seal]) {
    quiet(record);
  }
  for (const row of book.audit()) quiet(row);
  assert.equal(packed(book.audit()).includes("\"joule\":0"), false);
  assert.equal(packed(book.audit()).includes("\"look\":1"), false);
});

test("the page states the two sentences and holds no seal until an ask", () => {
  const page = readFileSync(new URL("../dark-ledger.html", import.meta.url), "utf8");
  const source = readFileSync(new URL("../js/dark-ledger.js", import.meta.url), "utf8");
  assert.deepEqual(SENTENCES, [
    "Iris shows your dark ledger only when you ask.",
    "A give and a gain are audited, and nothing is taken that was not given."
  ]);
  assert.equal(page.includes(SENTENCES[0]), true);
  assert.equal(page.includes(SENTENCES[1]), true);
  assert.equal(page.includes('href="css/writer.css"'), true);
  assert.equal((page.match(/stylesheet/g) || []).length, 1);
  assert.equal(page.includes("fonts.googleapis.com"), false);
  assert.equal(/[0-9a-f]{64}/.test(page), false);
  assert.equal(page.includes(SECRET), false);
  assert.equal(/^\s*\/\//m.test(source), false);
  assert.equal(source.includes("/*"), false);
  assert.equal(/\bREM\b/.test(source), false);
  assert.equal(/\bkey\b/i.test(source), false);
  assert.equal(source.includes("dclm-write.js"), true);
  assert.equal(source.includes("unity-wallet.js"), true);
  assert.equal(source.includes("android"), false);
  assert.equal(source.includes("kernel"), false);
  assert.equal(source.includes("setInterval"), false);
});
