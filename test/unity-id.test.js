import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { LAW, open } from "../js/unity-id-protocol.js";
import { pegOf } from "../js/unity-wallet.js";

const LAW_SENTENCES = [
  "Everything on this network has one Unity ID.",
  "A human has one.",
  "A bot has one.",
  "A corporation has one.",
  "That is the identity.",
  "An agent of an agency must carry it to participate.",
  "Without it, they are not part of this protocol."
];

function quiet(record) {
  assert.equal(record.look, 0);
  assert.equal(record.joule, null);
  assert.equal(Object.hasOwn(record, "key"), false);
  assert.equal(JSON.stringify(record).includes("\"key\""), false);
}

test("a human with one Unity ID participates", async () => {
  const net = open();
  const id = "human-unity-one";
  const record = await net.participate({ kind: "human", body: "Ada", id: id });
  assert.equal(record.participates, true);
  assert.equal(record.protocol, true);
  assert.equal(record.reason, "one");
  assert.equal(record.kind, "human");
  assert.equal(record.peg, await pegOf(id));
  assert.equal(record.iris, "Iris");
  assert.equal(record.peg !== null, true);
  quiet(record);
  assert.equal(JSON.stringify(net.memory()).includes(id), false);
});

test("a bot with one Unity ID participates", async () => {
  const net = open();
  const id = "bot-unity-one";
  const record = await net.participate({ kind: "bot", body: "Iris", id: id });
  assert.equal(record.participates, true);
  assert.equal(record.protocol, true);
  assert.equal(record.kind, "bot");
  assert.equal(record.peg, await pegOf(id));
  assert.equal(record.iris, "Iris");
  quiet(record);
  const again = await net.participate({ kind: "bot", body: "Iris", id: id });
  assert.equal(again.participates, true);
  assert.equal(again.peg, record.peg);
  assert.equal(net.memory().length, 1);
});

test("a corporation with one Unity ID participates", async () => {
  const net = open();
  const id = "corp-unity-one";
  const record = await net.participate({ kind: "corporation", body: "Acme", id: id });
  assert.equal(record.participates, true);
  assert.equal(record.protocol, true);
  assert.equal(record.kind, "corporation");
  assert.equal(record.peg, await pegOf(id));
  assert.equal(record.iris, "Iris");
  quiet(record);
  assert.equal(JSON.stringify(net.memory()).includes(id), false);
});

test("a second ID for the same body is refused", async () => {
  const net = open();
  const first = "corp-unity-one";
  const spare = "corp-unity-spare";
  const seated = await net.participate({ kind: "corporation", body: "Acme", id: first });
  const brand = await net.participate({ kind: "corporation", body: "Acme", id: spare, part: "brand" });
  const desk = await net.participate({ kind: "corporation", body: "Acme", id: "dept-spare", part: "department" });
  assert.equal(seated.participates, true);
  assert.equal(brand.participates, false);
  assert.equal(brand.protocol, false);
  assert.equal(brand.reason, "second");
  assert.equal(brand.peg, null);
  assert.equal(desk.participates, false);
  assert.equal(desk.peg, null);
  assert.equal(JSON.stringify(net.memory()).includes(spare), false);
  assert.equal(JSON.stringify(net.memory()).includes("dept-spare"), false);
  assert.equal(net.memory().length, 1);
  assert.equal(net.memory()[0].peg, seated.peg);
  quiet(brand);
  quiet(desk);
});

test("a missing Unity ID does not participate", async () => {
  const net = open();
  const missing = [
    { kind: "human", body: "Ada" },
    { kind: "bot", body: "Iris", id: "" },
    { kind: "corporation", body: "Acme", id: "   " },
    { kind: "human", body: "Ada", id: null },
    { kind: "bot", body: "Iris", identification: "\n\t" }
  ];
  for (const input of missing) {
    const record = await net.participate(input);
    assert.equal(record.participates, false);
    assert.equal(record.protocol, false);
    assert.equal(record.reason, "absent");
    assert.equal(record.peg, null);
    assert.equal(record.iris, null);
    quiet(record);
  }
  assert.equal(net.memory().length, 0);
});

test("an agent with no Unity ID is not on the protocol", async () => {
  const net = open();
  await net.participate({ kind: "corporation", body: "Acme", id: "corp-unity-one" });
  const record = await net.participate({ kind: "corporation", body: "Acme", agent: "clerk", id: "" });
  assert.equal(record.participates, false);
  assert.equal(record.protocol, false);
  assert.equal(record.reason, "absent");
  assert.equal(record.peg, null);
  quiet(record);
  const unnamed = await net.participate({ kind: "corporation", agent: true, id: "corp-unity-one" });
  assert.equal(unnamed.participates, false);
  assert.equal(unnamed.protocol, false);
});

test("an agent carrying the corporation's one ID participates", async () => {
  const net = open();
  const id = "corp-unity-one";
  const seated = await net.participate({ kind: "corporation", body: "Acme", id: id });
  const agent = await net.participate({ kind: "corporation", body: "Acme", id: id, agent: "clerk" });
  assert.equal(agent.participates, true);
  assert.equal(agent.protocol, true);
  assert.equal(agent.kind, "corporation");
  assert.equal(agent.peg, seated.peg);
  assert.equal(agent.iris, "Iris");
  assert.equal(agent.peg, await pegOf(id));
  quiet(agent);
  const spare = await net.participate({ kind: "corporation", body: "Acme", id: "clerk-spare", agent: "clerk" });
  assert.equal(spare.participates, false);
  assert.equal(spare.reason, "second");
  assert.equal(spare.peg, null);
  assert.equal(JSON.stringify(net.memory()).includes(id), false);
  assert.equal(JSON.stringify(net.memory()).includes("clerk-spare"), false);
});

test("an empty identification yields no peg", async () => {
  const net = open();
  for (const id of ["", "   ", "\n\t"]) {
    const record = await net.participate({ kind: "human", body: "Ada", id: id });
    assert.equal(record.peg, null);
    assert.equal(record.iris, null);
    assert.equal(record.participates, false);
    assert.equal(await pegOf(id), null);
    quiet(record);
  }
  assert.equal(net.memory().length, 0);
});

test("only a human, a bot, or a corporation is a kind", async () => {
  const net = open();
  for (const kind of ["guest", "department", "brand", "agent", "shop", ""]) {
    const record = await net.participate({ kind: kind, body: "Acme", id: "spare-" + kind });
    assert.equal(record.participates, false);
    assert.equal(record.protocol, false);
    assert.equal(record.reason, "kind");
    assert.equal(record.peg, null);
    quiet(record);
  }
  assert.equal(net.memory().length, 0);
  const human = await net.participate({ kind: "human", body: "Ada", id: "human-unity-one", agent: "no" });
  assert.equal(human.participates, false);
  assert.equal(human.reason, "kind");
});

test("the participation record has no key field and look stays 0", async () => {
  const net = open();
  const record = await net.participate({ kind: "human", body: "Ada", id: "human-unity-one" });
  quiet(record);
  for (const row of net.memory()) quiet(row);
  assert.equal(record.joule, null);
  assert.equal(net.memory()[0].joule, null);
  assert.equal(Object.hasOwn(record, "id"), false);
  assert.equal(Object.hasOwn(net.memory()[0], "id"), false);
});

test("the public pages say the Unity ID law in plain sentences", () => {
  const door = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const wallet = readFileSync(new URL("../wallet.html", import.meta.url), "utf8");
  assert.equal(LAW, LAW_SENTENCES.join(" "));
  for (const sentence of LAW_SENTENCES) {
    assert.equal(door.includes(sentence), true, sentence);
    assert.equal(wallet.includes(sentence), true, sentence);
  }
  assert.equal(door.includes("One became two."), true);
  assert.equal(door.includes("eFuse is the oldest engineering in the observable universe."), true);
  assert.equal(door.includes("The one-two cadence is that engineering: one, then the split into two."), true);
  assert.equal(door.includes("IBM, 2004. eFuse was adopted for micro circuitry."), true);
  assert.equal(door.includes("microsurgery"), false);
  assert.equal(wallet.includes("You have your Universal identification and your wallet."), true);
  assert.equal(wallet.includes("Nothing to remember."), true);
  assert.equal(wallet.includes("The identification is hashed, and that hash is the peg to permanent memory about you."), true);
  assert.equal(wallet.includes("Iris is pegged to the same permanence."), true);
  assert.equal(/\bkey\b/i.test(wallet), false);
  assert.equal(/memorize|copy this|copy the|remember (this|your|the|a)\b/i.test(wallet), false);
});
