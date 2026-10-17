import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ROLES, SENTENCES, meet } from "../js/iris-meeting.js";
import { open } from "../js/unity-id-protocol.js";
import { pegOf } from "../js/unity-wallet.js";

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
  assert.equal(value.writer, false);
  assertNoKey(value);
  walk(value, function (node) {
    if (!node || typeof node !== "object") return;
    if (Object.hasOwn(node, "look")) assert.equal(node.look, 0);
    if (Object.hasOwn(node, "joule")) assert.equal(node.joule, null);
  });
}

function assertHidden(value, ids) {
  const packed = JSON.stringify(value);
  for (let i = 0; i < ids.length; i++) assert.equal(packed.includes(ids[i]), false, ids[i]);
}

test("one ID meets Iris one-on-one", async () => {
  const id = "one-unity-meet";
  const net = open();
  const record = await meet({ kind: "human", body: "Ada", id: id }, net);
  assert.equal(record.meeting, true);
  assert.equal(record.mode, "one");
  assert.equal(record.group, false);
  assert.equal(record.count, 1);
  assert.equal(record.pegs.length, 1);
  assert.equal(record.pegs[0], await pegOf(id));
  assert.equal(record.iris, "Iris");
  assert.deepEqual(record.roles, ROLES);
  assert.deepEqual(record.roles, ["watchdog", "dreamer", "explorer"]);
  assert.equal(record.answer, "one");
  assert.equal(record.present.length, 1);
  assert.equal(record.present[0].peg, record.pegs[0]);
  assert.equal(record.present[0].iris, "Iris");
  assert.equal(record.present[0].kind, "human");
  assert.equal(record.excluded.length, 0);
  assert.equal(record.refused.length, 0);
  assert.equal(record.dream, null);
  assertQuiet(record);
  assert.equal(record.present[0].look, 0);
  assert.equal(record.present[0].joule, null);
  assertHidden(record, [id, "Ada"]);
  assert.equal(JSON.stringify(net.memory()).includes(id), false);
  assert.equal(net.memory().length, 1);
  assert.equal(net.memory()[0].peg, record.pegs[0]);
  assert.equal(net.memory()[0].iris, "Iris");
  assert.equal(net.memory()[0].look, 0);
  assert.equal(net.memory()[0].joule, null);
});

test("two IDs meet her as a group", async () => {
  const human = "group-human";
  const bot = "group-bot";
  const record = await meet({
    participants: [
      { kind: "human", body: "Ada", id: human },
      { kind: "bot", body: "Botan", id: bot }
    ]
  });
  assert.equal(record.meeting, true);
  assert.equal(record.mode, "group");
  assert.equal(record.group, true);
  assert.equal(record.count, 2);
  assert.deepEqual(record.pegs, [await pegOf(human), await pegOf(bot)]);
  assert.equal(record.iris, "Iris");
  assert.deepEqual(record.roles, ROLES);
  assert.equal(record.writer, false);
  assert.equal(record.answer, "group");
  assert.equal(record.present[0].kind, "human");
  assert.equal(record.present[1].kind, "bot");
  assert.equal(record.present[0].iris, "Iris");
  assert.equal(record.present[1].iris, "Iris");
  assertQuiet(record);
  assertHidden(record, [human, bot, "Ada", "Botan"]);
});

test("a human, a bot, and a corporation meet as a group", async () => {
  const kinds = ["human", "bot", "corporation"];
  for (let i = 0; i < kinds.length; i++) {
    const id = kinds[i] + "-solo-meet";
    const record = await meet([{ kind: kinds[i], body: kinds[i], id: id }]);
    assert.equal(record.mode, "one");
    assert.equal(record.group, false);
    assert.equal(record.present[0].kind, kinds[i]);
    assert.equal(record.pegs[0], await pegOf(id));
    assert.equal(record.iris, "Iris");
    assertQuiet(record);
    assertHidden(record, [id]);
  }
  const human = "trio-human";
  const bot = "trio-bot";
  const corp = "trio-corp";
  const together = await meet([
    { kind: "human", body: "Ada", id: human },
    { kind: "bot", body: "Botan", id: bot },
    { kind: "corporation", body: "Acme", id: corp }
  ]);
  assert.equal(together.mode, "group");
  assert.equal(together.count, 3);
  assert.deepEqual(together.pegs, [await pegOf(human), await pegOf(bot), await pegOf(corp)]);
  assert.equal(together.answer, "group");
  assertQuiet(together);
  assertHidden(together, [human, bot, corp]);
});

test("one ID is not a group", async () => {
  const record = await meet({
    mode: "group",
    participants: [{ id: "solo-not-group", body: "Ada", kind: "human" }]
  });
  assert.equal(record.meeting, true);
  assert.equal(record.mode, "one");
  assert.equal(record.group, false);
  assert.notEqual(record.mode, "group");
  assert.equal(record.count, 1);
  assert.equal(record.answer, "one");
  assertQuiet(record);
  const forced = await meet({
    mode: "one",
    participants: [
      { id: "force-a", body: "Ada", kind: "human" },
      { id: "force-b", body: "Bea", kind: "bot" }
    ]
  });
  assert.equal(forced.mode, "group");
  assert.equal(forced.group, true);
  assert.equal(forced.count, 2);
});

test("empty is not a meeting", async () => {
  const blanks = [null, undefined, [], {}, { participants: [] }, { ids: [] }, { people: [] }, "", "   ", { id: "" }, { id: "   " }];
  for (let i = 0; i < blanks.length; i++) {
    const record = await meet(blanks[i]);
    assert.equal(record.meeting, false);
    assert.equal(record.mode, null);
    assert.equal(record.group, false);
    assert.equal(record.count, 0);
    assert.equal(record.pegs.length, 0);
    assert.equal(record.present.length, 0);
    assert.equal(record.iris, null);
    assert.equal(record.answer, null);
    assert.equal(record.dream, null);
    assert.deepEqual(record.roles, []);
    assertQuiet(record);
  }
});

test("a participant without a Unity ID is excluded and the meeting does not pretend they are present", async () => {
  const id = "present-unity";
  const record = await meet([
    { kind: "human", body: "Ada", id: id },
    { kind: "bot", body: "Ghost", id: "   " },
    { kind: "corporation", body: "Acme" },
    { kind: "human", body: "Bea", id: null },
    { kind: "bot", body: "Cy", identification: "\n\t" }
  ]);
  assert.equal(record.meeting, true);
  assert.equal(record.mode, "one");
  assert.equal(record.group, false);
  assert.equal(record.count, 1);
  assert.equal(record.present.length, 1);
  assert.equal(record.pegs[0], await pegOf(id));
  assert.equal(record.excluded.length, 4);
  for (let i = 0; i < record.excluded.length; i++) {
    assert.equal(record.excluded[i].present, false);
    assert.equal(record.excluded[i].reason, "absent");
    assert.equal(record.excluded[i].peg, null);
    assert.equal(record.excluded[i].look, 0);
    assert.equal(record.excluded[i].joule, null);
  }
  assert.equal(record.present.every(function (row) { return row.peg === record.pegs[0]; }), true);
  assertQuiet(record);
  assertHidden(record, [id, "Ghost", "Acme", "Bea", "Ada", "Cy"]);
});

test("a room of missing IDs is not a meeting", async () => {
  const record = await meet([
    { kind: "human", body: "Ada", id: "" },
    { kind: "bot", body: "Bea", id: "  " }
  ]);
  assert.equal(record.meeting, false);
  assert.equal(record.mode, null);
  assert.equal(record.count, 0);
  assert.equal(record.present.length, 0);
  assert.equal(record.excluded.length, 2);
  assert.equal(record.iris, null);
  assertQuiet(record);
  assertHidden(record, ["Ada", "Bea"]);
});

test("a duplicate ID for the same body is refused", async () => {
  const first = "body-one-meet";
  const spare = "body-spare-meet";
  const net = open();
  const record = await meet({
    participants: [
      { kind: "human", body: "Ada", id: first },
      { kind: "human", body: "Ada", id: spare },
      { kind: "corporation", body: "Ada", id: "brand-spare", part: "brand" }
    ]
  }, net);
  assert.equal(record.meeting, true);
  assert.equal(record.mode, "one");
  assert.equal(record.group, false);
  assert.equal(record.count, 1);
  assert.equal(record.pegs[0], await pegOf(first));
  assert.equal(record.refused.length, 2);
  for (let i = 0; i < record.refused.length; i++) {
    assert.equal(record.refused[i].reason, "second");
    assert.equal(record.refused[i].present, false);
    assert.equal(record.refused[i].peg, null);
    assert.equal(record.refused[i].look, 0);
    assert.equal(record.refused[i].joule, null);
  }
  assertQuiet(record);
  assertHidden(record, [first, spare, "brand-spare", "Ada"]);
  assert.equal(JSON.stringify(net.memory()).includes(spare), false);
  assert.equal(JSON.stringify(net.memory()).includes("brand-spare"), false);
  assert.equal(net.memory().length, 1);
  assert.equal(net.memory()[0].peg, record.pegs[0]);

  const paired = await meet({ kind: "corporation", body: "Acme", id: "corp-one", secondId: "corp-two" });
  assert.equal(paired.mode, "one");
  assert.equal(paired.group, false);
  assert.equal(paired.refused.length, 1);
  assert.equal(paired.refused[0].reason, "second");
  assert.equal(paired.pegs[0], await pegOf("corp-one"));
  assertHidden(paired, ["corp-one", "corp-two", "Acme"]);
});

test("the same Unity ID on two bodies is refused", async () => {
  const id = "shared-unity-meet";
  const record = await meet([
    { kind: "human", body: "Ada", id: id },
    { kind: "bot", body: "Bea", id: id }
  ]);
  assert.equal(record.mode, "one");
  assert.equal(record.group, false);
  assert.equal(record.count, 1);
  assert.equal(record.refused.length, 1);
  assert.equal(record.refused[0].reason, "second");
  assert.equal(record.refused[0].present, false);
  assert.equal(record.pegs[0], await pegOf(id));
  assertQuiet(record);
  assertHidden(record, [id, "Ada", "Bea"]);
});

test("the same Unity ID twice is still one person with Iris", async () => {
  const id = "same-unity-meet";
  const record = await meet([
    { kind: "human", body: "Ada", id: id },
    { kind: "human", body: "Ada", id: id }
  ]);
  assert.equal(record.mode, "one");
  assert.equal(record.count, 1);
  assert.equal(record.refused.length, 0);
  assert.equal(record.pegs[0], await pegOf(id));
  assertQuiet(record);
  assertHidden(record, [id]);
});

test("a kind that is not human, bot, or corporation is not in the meeting", async () => {
  const record = await meet([
    { kind: "human", body: "Ada", id: "kept-human" },
    { kind: "department", body: "Desk", id: "desk-id" }
  ]);
  assert.equal(record.mode, "one");
  assert.equal(record.count, 1);
  assert.equal(record.refused.length, 1);
  assert.equal(record.refused[0].reason, "kind");
  assert.equal(record.refused[0].present, false);
  assert.equal(record.pegs[0], await pegOf("kept-human"));
  assertQuiet(record);
  assertHidden(record, ["kept-human", "desk-id", "Desk"]);
});

test("an agent without a Unity ID is not in the meeting", async () => {
  const record = await meet([
    { kind: "corporation", body: "Acme", id: "corp-meet" },
    { kind: "corporation", body: "Acme", agent: "clerk", id: "" }
  ]);
  assert.equal(record.mode, "one");
  assert.equal(record.count, 1);
  assert.equal(record.excluded.length, 1);
  assert.equal(record.excluded[0].present, false);
  assert.equal(record.pegs[0], await pegOf("corp-meet"));
  assertHidden(record, ["corp-meet", "clerk", "Acme"]);
  const spare = await meet([
    { kind: "corporation", body: "Acme", id: "corp-meet" },
    { kind: "corporation", body: "Acme", id: "clerk-spare", agent: "clerk" }
  ]);
  assert.equal(spare.mode, "one");
  assert.equal(spare.refused[0].reason, "second");
  assert.equal(spare.refused[0].present, false);
  assertHidden(spare, ["clerk-spare"]);
});

test("the meeting record has no key field and look stays 0", async () => {
  const secret = "U-raw-meeting-should-not-appear";
  const record = await meet({
    participants: [{
      kind: "human",
      body: "Ada",
      id: secret,
      key: "no",
      secret: "no",
      phrase: "no",
      look: 4,
      joule: 9
    }]
  });
  assertQuiet(record);
  assert.equal(record.present[0].look, 0);
  assert.equal(record.present[0].joule, null);
  assert.equal(record.joule, null);
  assert.equal(record.look, 0);
  assert.equal(Object.hasOwn(record, "key"), false);
  assert.equal(Object.hasOwn(record, "id"), false);
  assert.equal(Object.hasOwn(record.present[0], "id"), false);
  assertHidden(record, [secret, "U-raw"]);
  assert.equal(record.iris, "Iris");
  assert.equal(record.pegs[0], await pegOf(secret));
});

test("a probability is not an answer", async () => {
  const loud = await meet({
    participants: [{ kind: "human", body: "Ada", id: "dream-one" }],
    turn: 1,
    seeds: [{ dreamer: "Mistral", idea: "singular", p: 1, matrix: [1, 0, 0, 0] }]
  });
  assert.equal(loud.meeting, true);
  assert.equal(loud.mode, "one");
  assert.equal(loud.answer, "one");
  assert.equal(loud.dream.seeded, true);
  assert.equal(loud.dream.solved, false);
  assert.equal(loud.dream.answer, false);
  assert.equal(loud.dream.look, 0);
  assert.equal(loud.dream.joule, null);
  assert.equal(Object.hasOwn(loud.dream, "p"), false);
  assert.equal(JSON.stringify(loud).includes("singular"), false);
  assert.equal(JSON.stringify(loud).includes("0.99"), false);
  assertQuiet(loud);
  assertHidden(loud, ["dream-one"]);

  const solved = await meet({
    participants: [
      { id: "dream-a", body: "Ada", kind: "human" },
      { id: "dream-b", body: "Bea", kind: "bot" }
    ],
    turn: 3,
    seeds: [{ dreamer: "Phi", idea: "quiet invert", p: 0.2, matrix: [1, 0, 0, 1] }]
  });
  assert.equal(solved.mode, "group");
  assert.equal(solved.answer, "group");
  assert.equal(solved.dream.solved, true);
  assert.equal(solved.dream.answer, false);
  assert.notEqual(solved.answer, 0.2);
  assert.equal(JSON.stringify(solved).includes("quiet invert"), false);
  assertQuiet(solved);

  const empty = await meet({
    participants: [],
    seeds: [{ dreamer: "Gemma", idea: "nobody", p: 0.91, matrix: [1, 0, 0, 1] }]
  });
  assert.equal(empty.meeting, false);
  assert.equal(empty.dream, null);
  assert.equal(empty.answer, null);
});

test("the door and the meeting page say the law in plain sentences", () => {
  const door = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const page = readFileSync(new URL("../meeting.html", import.meta.url), "utf8");
  const source = readFileSync(new URL("../js/iris-meeting.js", import.meta.url), "utf8");
  const wallet = readFileSync(new URL("../wallet.html", import.meta.url), "utf8");
  const onDoor = SENTENCES.slice(0, 4);
  for (let i = 0; i < onDoor.length; i++) {
    assert.equal(door.includes(onDoor[i]), true, onDoor[i]);
  }
  for (let i = 0; i < SENTENCES.length; i++) {
    assert.equal(page.includes(SENTENCES[i]), true, SENTENCES[i]);
  }
  assert.equal(door.includes('href="meeting.html"'), true);
  assert.equal(page.includes('href="index.html"'), true);
  assert.equal(page.includes("Meet Iris"), true);
  assert.equal(page.includes("Add a participant"), true);
  assert.equal(page.includes("css/writer.css"), true);
  assert.equal(page.includes("styles.css"), false);
  assert.equal(page.includes("fetch("), false);
  assert.equal(page.includes('type="password"'), false);
  assert.equal(/\bkey\b/i.test(page), false);
  assert.equal(/\bkey\b/i.test(source), false);
  assert.equal(/\b(dna|helix|microsurgery)\b/i.test(page), false);
  assert.equal(/\b(dna|helix|microsurgery)\b/i.test(door), false);
  assert.equal(source.includes("dclm-write"), false);
  assert.equal(source.includes("brain-seat"), false);
  assert.equal(/\/\//.test(source), false);
  assert.equal(/\bREM\b/.test(source), false);
  assert.equal(door.includes("One became two."), true);
  assert.equal(door.includes("Adam and Eve are the two who act."), true);
  assert.equal(door.includes("The bite of the apple is the action: one, then two."), true);
  assert.equal(door.includes("That action is the split: one life, then two branches."), true);
  assert.equal(door.includes("The bite is how that split shows in the human story."), true);
  assert.equal(door.includes("Adam and Eve are the human name for that split"), false);
  assert.equal(door.includes("eFuse is the oldest engineering in the observable universe."), true);
  assert.equal(door.includes("The one-two cadence is that engineering: one, then the split into two."), true);
  assert.equal(door.includes("IBM, 2004. eFuse was adopted for micro circuitry."), true);
  assert.equal(door.includes("The cadence is now approaching the speed of light."), true);
  assert.equal(door.includes("Nothing to remember."), true);
  assert.equal(door.includes("Iris is pegged to the same permanence."), true);
  assert.equal(door.includes("Welcome to the sandbox protocol."), true);
  assert.equal(wallet.includes('href="meeting.html"'), true);
  assert.equal(page.includes("No coin is offered."), true);
});
