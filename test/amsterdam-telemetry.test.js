import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { EXPLORERS, PING, SENTENCES, handleStep, pingOf, rolesFrom, tunnel } from "../js/amsterdam-telemetry.js";
import { OPEN_DECISION, published } from "../js/merit-align.js";

const HOLD = {
  id: "look-0",
  what: "record the look",
  axioms: {
    NO_FORCE: true,
    HOST_SAFE: true,
    CLEANUP_FIRST: true,
    TRUTH_OR_NOTHING: true
  }
};

function bench(amsterdamUp) {
  const amsterdam = { host: "amsterdam", up: amsterdamUp === true, inbox: [] };
  const jersey = { host: "new-jersey", up: true, inbox: [] };
  amsterdam.take = function (object) { amsterdam.inbox.push(object); };
  jersey.take = function (object) { jersey.inbox.push(object); };
  return {
    amsterdam: amsterdam,
    jersey: jersey,
    pipe: tunnel({ amsterdam: amsterdam, "new-jersey": jersey })
  };
}

function absent(blob, secrets) {
  for (let i = 0; i < secrets.length; i++) {
    assert.equal(blob.includes(secrets[i]), false, secrets[i]);
  }
}

test("an object offloads to Amsterdam when Amsterdam is up", async () => {
  const rig = bench(true);
  const result = await rig.pipe.step({ task: HOLD });
  assert.equal(result.sent, true);
  assert.equal(result.place, "amsterdam");
  assert.equal(result.reason, "sent");
  assert.equal(rig.amsterdam.inbox.length, 1);
  assert.equal(rig.jersey.inbox.length, 0);
  const object = rig.amsterdam.inbox[0];
  assert.equal(object.place, "amsterdam");
  assert.equal(object.step, 1);
  assert.equal(object.gate, "shut");
  assert.equal(object.joule, null);
  assert.equal(object.look, 0);
  assert.equal(object.write, "admitted");
  assert.equal(typeof object.id, "string");
  assert.equal(object.id.length, 64);
  assert.deepEqual(Object.keys(object).sort(), ["gate", "id", "joule", "look", "place", "step", "write"]);
});

test("New Jersey receives the same object id only when Amsterdam is down", async () => {
  const up = bench(true);
  const down = bench(false);
  const left = await up.pipe.step({ task: HOLD, place: "new-jersey" });
  const right = await down.pipe.step({ task: HOLD, place: "amsterdam" });
  assert.equal(left.place, "amsterdam");
  assert.equal(up.jersey.inbox.length, 0);
  assert.equal(right.place, "new-jersey");
  assert.equal(right.sent, true);
  assert.equal(down.amsterdam.inbox.length, 0);
  assert.equal(down.jersey.inbox.length, 1);
  assert.equal(down.jersey.inbox[0].place, "new-jersey");
  assert.equal(up.amsterdam.inbox[0].id, down.jersey.inbox[0].id);
  assert.equal(up.amsterdam.inbox[0].step, down.jersey.inbox[0].step);
  assert.notEqual(up.amsterdam.inbox[0].place, down.jersey.inbox[0].place);
});

test("the live memory keeps the peg and the next call recalls it", async () => {
  const rig = bench(true);
  const first = await rig.pipe.step({ task: HOLD });
  assert.equal(first.recalled, null);
  assert.deepEqual(rig.pipe.memory(), { peg: first.peg });
  assert.deepEqual(Object.keys(rig.pipe.memory()), ["peg"]);
  assert.equal(JSON.stringify(rig.pipe.memory()).includes("record the look"), false);
  const second = await rig.pipe.step({ task: HOLD });
  assert.equal(second.recalled, first.peg);
  assert.equal(rig.pipe.memory().peg, second.peg);
  assert.notEqual(second.peg, first.peg);
  assert.equal(rig.amsterdam.inbox.length, 2);
  assert.equal(rig.amsterdam.inbox[0].step, 1);
  assert.equal(rig.amsterdam.inbox[1].step, 2);
  assert.equal(rig.jersey.inbox.length, 0);
});

test("identity and passphrase are absent from the object", async () => {
  const rig = bench(true);
  const secrets = [
    "ada-raw-id",
    "horse-battery-staple",
    "room-password",
    "ada@example.com",
    "audio-bytes",
    "video-bytes",
    "pixel-bytes",
    "dark-ledger-row"
  ];
  const result = await rig.pipe.step({
    task: HOLD,
    identification: "ada-raw-id",
    passphrase: "horse-battery-staple",
    password: "room-password",
    mail: "ada@example.com",
    email: "ada@example.com",
    audio: "audio-bytes",
    video: "video-bytes",
    pixels: "pixel-bytes",
    screen: "pixel-bytes",
    dark: "dark-ledger-row",
    ledger: "dark-ledger-row"
  });
  const blob = JSON.stringify(rig.amsterdam.inbox[0]) + JSON.stringify(result) + JSON.stringify(rig.pipe.memory());
  absent(blob, secrets);
  assert.equal(Object.hasOwn(rig.amsterdam.inbox[0], "identification"), false);
  assert.equal(Object.hasOwn(rig.amsterdam.inbox[0], "passphrase"), false);
  assert.equal(Object.hasOwn(rig.amsterdam.inbox[0], "password"), false);
  assert.equal(Object.hasOwn(rig.amsterdam.inbox[0], "mail"), false);
  assert.equal(result.sent, true);
});

test("a third place is refused", async () => {
  const rig = bench(true);
  const result = await rig.pipe.step({ task: HOLD, place: "vultr" });
  assert.equal(result.sent, false);
  assert.equal(result.reason, "refused");
  assert.equal(result.place, null);
  assert.equal(result.write, "refused");
  assert.equal(rig.amsterdam.inbox.length, 0);
  assert.equal(rig.jersey.inbox.length, 0);
  assert.equal(rig.pipe.memory().peg, null);
  assert.equal(JSON.stringify(result).includes("vultr"), false);
});

test("no coin is minted and the token ping is absent", async () => {
  const rig = bench(true);
  const result = await rig.pipe.step({ task: HOLD, decision: OPEN_DECISION });
  const object = rig.amsterdam.inbox[0];
  assert.equal(result.minted, false);
  assert.equal(result.ping, null);
  assert.equal(PING, null);
  assert.equal(pingOf(), null);
  assert.equal(EXPLORERS.Unity, null);
  assert.equal(EXPLORERS.Merit, null);
  assert.equal(EXPLORERS.eFuse, null);
  assert.equal(object.gate, "open");
  assert.equal(object.joule, 1);
  assert.equal(Object.hasOwn(object, "minted"), false);
  assert.equal(Object.hasOwn(object, "coin"), false);
  assert.equal(Object.hasOwn(object, "ping"), false);
  const source = readFileSync(new URL("../js/amsterdam-telemetry.js", import.meta.url), "utf8");
  assert.equal(source.includes("basescan"), false);
  assert.equal(source.includes("etherscan"), false);
  assert.equal(source.includes("ethereum"), false);
  assert.equal(source.includes("USDC"), false);
  assert.equal(source.includes("vultr"), false);
  assert.equal(/\b\d{1,3}(\.\d{1,3}){3}\b/.test(source), false);
  assert.equal(/mint\s*\(/.test(source), false);
});

test("look stays 0 and a null joule leaves the gate shut", async () => {
  const rig = bench(true);
  const result = await rig.pipe.step({ task: HOLD, look: 4, joule: null });
  const object = rig.amsterdam.inbox[0];
  assert.equal(object.look, 0);
  assert.equal(result.look, 0);
  assert.equal(object.joule, null);
  assert.equal(result.joule, null);
  assert.equal(object.gate, "shut");
  assert.equal(result.gate, "shut");
  assert.equal(published().joule, null);
  assert.equal(published().open, false);
  const recalled = await rig.pipe.step({ task: { ...HOLD, veto: true }, joule: 4, look: 9 });
  const second = rig.amsterdam.inbox[1];
  assert.equal(second.look, 0);
  assert.equal(second.joule, 4);
  assert.equal(second.gate, "shut");
  assert.equal(second.write, "refused");
  assert.equal(recalled.minted, false);
});

test("a missing host leaves the reading unsent", async () => {
  const rig = bench(true);
  rig.amsterdam.host = "   ";
  const missed = await rig.pipe.step({ task: HOLD });
  assert.equal(missed.sent, false);
  assert.equal(missed.reason, "unsent");
  assert.equal(missed.place, "amsterdam");
  assert.equal(rig.amsterdam.inbox.length, 0);
  assert.equal(rig.jersey.inbox.length, 0);
  rig.amsterdam.host = null;
  rig.amsterdam.up = false;
  rig.jersey.host = "";
  const down = await rig.pipe.step({ task: HOLD });
  assert.equal(down.sent, false);
  assert.equal(down.place, "new-jersey");
  assert.equal(rig.jersey.inbox.length, 0);
  assert.deepEqual(rolesFrom({}), {
    amsterdam: { host: null, up: false },
    "new-jersey": { host: null, up: false }
  });
  assert.equal(rolesFrom({ AMSTERDAM_HOST: "amsterdam" }).amsterdam.host, "amsterdam");
  assert.equal(rolesFrom({ AMSTERDAM_UP: "up" }).amsterdam.up, true);
});

test("one call posts at most one object and only to the caller host", async () => {
  const calls = [];
  const prior = globalThis.fetch;
  globalThis.fetch = async function (url, init) {
    calls.push({ url: url, body: init.body, method: init.method });
    return { ok: true };
  };
  try {
    const request = new Request("https://example.test/api/telemetry/step", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        task: HOLD,
        place: "london",
        host: "https://example.test/evil",
        passphrase: "horse-battery-staple",
        identification: "ada-raw-id"
      })
    });
    const refused = await handleStep(request, {
      AMSTERDAM_HOST: "https://example.test/amsterdam",
      AMSTERDAM_UP: "up",
      NEW_JERSEY_HOST: "https://example.test/new-jersey"
    });
    assert.equal(refused.status, 200);
    const refusedBody = await refused.json();
    assert.equal(refusedBody.reason, "refused");
    assert.equal(refusedBody.sent, false);
    assert.equal(calls.length, 0);
    assert.equal(JSON.stringify(refusedBody).includes("horse-battery-staple"), false);
    assert.equal(JSON.stringify(refusedBody).includes("ada-raw-id"), false);
    const sent = await handleStep(new Request("https://example.test/api/telemetry/step", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ task: HOLD, place: "new-jersey" })
    }), {
      AMSTERDAM_HOST: "https://example.test/amsterdam",
      AMSTERDAM_UP: "true",
      NEW_JERSEY_HOST: "https://example.test/new-jersey"
    });
    const sentBody = await sent.json();
    assert.equal(sentBody.sent, true);
    assert.equal(sentBody.place, "amsterdam");
    assert.equal(sentBody.look, 0);
    assert.equal(sentBody.joule, null);
    assert.equal(sentBody.gate, "shut");
    assert.equal(sentBody.minted, false);
    assert.equal(sentBody.ping, null);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].method, "POST");
    assert.equal(calls[0].url, "https://example.test/amsterdam");
    const posted = JSON.parse(calls[0].body);
    assert.equal(posted.place, "amsterdam");
    assert.equal(posted.look, 0);
    assert.equal(posted.gate, "shut");
    const idle = await handleStep(new Request("https://example.test/api/telemetry/step"), {});
    const idleBody = await idle.json();
    assert.equal(idleBody.sent, false);
    assert.equal(idleBody.reason, "idle");
    assert.equal(calls.length, 1);
    const down = await handleStep(new Request("https://example.test/api/telemetry/step", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ task: HOLD })
    }), {
      AMSTERDAM_HOST: "https://example.test/amsterdam",
      AMSTERDAM_UP: "down",
      NEW_JERSEY_HOST: "https://example.test/new-jersey"
    });
    const downBody = await down.json();
    assert.equal(downBody.place, "new-jersey");
    assert.equal(calls.length, 2);
    assert.equal(calls[1].url, "https://example.test/new-jersey");
    assert.equal(JSON.parse(calls[1].body).id, posted.id);
  } finally {
    globalThis.fetch = prior;
  }
});

test("the door says where the object goes", () => {
  const door = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.equal(door.includes(SENTENCES[0]), true);
  assert.equal(door.includes(SENTENCES[1]), true);
  assert.equal(door.includes(SENTENCES[2]), true);
});
