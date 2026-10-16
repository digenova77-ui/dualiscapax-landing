import assert from "node:assert/strict";
import test from "node:test";
import { run } from "../js/dclm-write.js";
import { CEILING, FLOOR, SEED, empty, handleExplore, step } from "../js/iris-explorer.js";

const HOLD = {
  axioms: {
    NO_FORCE: true,
    HOST_SAFE: true,
    CLEANUP_FIRST: true,
    TRUTH_OR_NOTHING: true
  }
};

function collect(id, x, y, z, extra) {
  return step(extra && extra.state ? extra.state : empty(), {
    candidate: { id: id, x: x, y: y, z: z },
    axioms: HOLD.axioms
  });
}

test("she does not retire across steps", () => {
  let state = empty();
  assert.equal(state.log.length, 0);
  assert.equal(state.keys.length, 0);
  assert.equal(state.fused, null);
  assert.equal(state.step, 0);
  assert.equal(state.retired, false);
  assert.equal(state.look, 0);
  assert.equal(state.joule, null);
  assert.equal(state.authority, "DCLM");
  assert.equal(state.law, "DCLM");
  assert.deepEqual(state.roles, ["watchdog", "dreamer", "explorer"]);
  for (let i = 0; i < 4; i++) state = step(state, {});
  assert.equal(state.retired, false);
  assert.equal(state.step, 4);
  assert.equal(state.log.length, 4);
  assert.equal(state.look, 0);
  assert.equal(state.joule, null);
  assert.equal(state.authority, "DCLM");
  for (let i = 0; i < state.log.length; i++) {
    assert.equal(state.log[i].step, i + 1);
    assert.equal(state.log[i].retired, undefined);
    assert.deepEqual(state.log[i].roles, ["watchdog", "dreamer", "explorer"]);
    assert.equal(state.log[i].law, "DCLM");
  }
});

test("host stop is the only stop", () => {
  let state = empty();
  state = step(state, {});
  state = step(state, { retired: true, stop: false, admitted: true });
  assert.equal(state.retired, false);
  assert.equal(state.step, 2);
  const forged = step({ ...state, retired: true, authority: "client", look: 1, joule: 1 }, { retired: true });
  assert.equal(forged.retired, false);
  assert.equal(forged.authority, "DCLM");
  assert.equal(forged.look, 0);
  assert.equal(forged.joule, null);
  const host = step(state, { stop: true });
  assert.equal(host.retired, true);
  assert.equal(host.step, 3);
  assert.equal(host.log.length, 3);
  assert.equal(host.look, 0);
  assert.equal(host.joule, null);
  assert.equal(host.authority, "DCLM");
  const again = step(host, {});
  assert.equal(again.retired, false);
  assert.equal(again.step, 4);
});

test("a key is collected only when the four laws hold", () => {
  const held = collect("yes", 2, 3, 4);
  const record = run({ id: "yes", what: "collect", axioms: HOLD.axioms });
  assert.equal(record.admitted, true);
  assert.equal(record.written.task, "yes");
  assert.deepEqual(held.keys, [{ id: "yes", at: 1, x: 2, y: 3, z: 4 }]);
  assert.equal(held.log[0].kind, "collect");
  assert.equal(held.log[0].admitted, true);
  assert.equal(held.log[0].reason, "ADMIT");
  assert.equal(held.keys[0].at, held.step);
  assert.equal(Number.isInteger(held.keys[0].at), true);
  assert.equal(held.fused, null);

  const laws = ["NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING"];
  for (let i = 0; i < laws.length; i++) {
    const axioms = { ...HOLD.axioms };
    axioms[laws[i]] = false;
    const veto = step(empty(), { candidate: { id: "no", x: 1, y: 1, z: 1 }, axioms: axioms });
    assert.equal(veto.keys.length, 0);
    assert.equal(veto.log[0].admitted, false);
    assert.equal(veto.log[0].reason, "VETO");
    delete axioms[laws[i]];
    const missing = step(empty(), { candidate: { id: "gap", x: 1, y: 1, z: 1 }, axioms: axioms });
    assert.equal(missing.keys.length, 0);
    assert.equal(missing.log[0].reason, "MISSING " + laws[i]);
  }
});

test("a refused key is logged and not stored", () => {
  const refused = step(empty(), {
    candidate: { id: "no", x: 8, y: 7, z: 6 },
    axioms: { ...HOLD.axioms, NO_FORCE: false },
    admitted: true,
    authority: "client",
    look: 1,
    joule: 2,
    retired: true
  });
  assert.equal(refused.keys.length, 0);
  assert.equal(refused.fused, null);
  assert.equal(refused.log.length, 1);
  assert.equal(refused.log[0].kind, "refuse");
  assert.equal(refused.log[0].admitted, false);
  assert.equal(refused.log[0].reason, "VETO");
  assert.equal(refused.log[0].x, 8);
  assert.equal(refused.log[0].y, 7);
  assert.equal(refused.log[0].z, 6);
  assert.equal(refused.log[0].step, 1);
  assert.equal(refused.look, 0);
  assert.equal(refused.joule, null);
  assert.equal(refused.authority, "DCLM");
  assert.equal(refused.retired, false);
  assert.equal(refused.log[0].look, 0);
  assert.equal(refused.log[0].joule, null);
  assert.equal(refused.log[0].authority, "DCLM");
});

test("two admitted keys fuse only when DCLM admits the fuse", () => {
  let state = collect("a", 1, 2, 3);
  state = step(state, {
    candidate: { id: "b", x: 4, y: 5, z: 6 },
    axioms: HOLD.axioms
  });
  assert.equal(state.keys.length, 2);
  assert.equal(state.fused, null);
  assert.deepEqual(state.keys[0], { id: "a", at: 1, x: 1, y: 2, z: 3 });
  assert.deepEqual(state.keys[1], { id: "b", at: 2, x: 4, y: 5, z: 6 });

  const one = step(collect("only", 1, 1, 1), { fuse: true, axioms: HOLD.axioms, admitted: true });
  assert.equal(one.fused, null);
  assert.equal(one.keys.length, 1);
  assert.equal(one.log[1].kind, "refuse");
  assert.equal(one.log[1].admitted, false);
  assert.equal(one.log[1].reason, "PAIR");

  const veto = step(state, { fuse: true, axioms: HOLD.axioms, veto: true, admitted: true, kind: "fuse" });
  assert.equal(veto.fused, null);
  assert.equal(veto.keys.length, 2);
  assert.equal(veto.log.length, 3);
  assert.equal(veto.log[2].kind, "refuse");
  assert.equal(veto.log[2].admitted, false);
  assert.equal(veto.log[2].reason, "VETO");

  const fused = step(state, { fuse: true, axioms: HOLD.axioms });
  const gate = run({ id: "fuse", what: "fuse", axioms: HOLD.axioms });
  assert.equal(gate.admitted, true);
  assert.equal(fused.fused.id, "a:b");
  assert.equal(fused.fused.at, 3);
  assert.equal(fused.fused.x, 1);
  assert.equal(fused.fused.y, 2);
  assert.equal(fused.fused.z, 3);
  assert.deepEqual(fused.fused.pair[0], state.keys[0]);
  assert.deepEqual(fused.fused.pair[1], state.keys[1]);
  assert.deepEqual(fused.fused.roles, ["watchdog", "dreamer", "explorer"]);
  assert.equal(fused.fused.law, "DCLM");
  assert.equal(fused.log[2].kind, "fuse");
  assert.equal(fused.log[2].admitted, true);
  assert.equal(fused.log[2].reason, "ADMIT");
  assert.equal(fused.keys.length, 2);
  assert.equal(fused.log[0].step, 1);
  assert.equal(fused.log[1].step, 2);
  assert.equal(state.fused, null);
  assert.equal(state.keys.length, 2);
});

test("a skipped law does not fuse", () => {
  let state = collect("a", 1, 0, 1);
  state = step(state, {
    candidate: { id: "b", x: 0, y: 1, z: -1 },
    axioms: HOLD.axioms
  });
  const task = { id: "fuse", what: "fuse", axioms: HOLD.axioms, skipped: ["HOST_SAFE"] };
  const record = run(task);
  assert.equal(record.write.ok, true);
  assert.equal(record.audit.ok, false);
  assert.equal(record.admitted, false);
  assert.equal(record.reason, "SKIPPED HOST_SAFE");
  const skipped = step(state, { fuse: true, axioms: HOLD.axioms, skipped: ["HOST_SAFE"], admitted: true });
  assert.equal(skipped.fused, null);
  assert.equal(skipped.keys.length, 2);
  assert.equal(skipped.log.length, 3);
  assert.equal(skipped.log[2].kind, "refuse");
  assert.equal(skipped.log[2].admitted, false);
  assert.equal(skipped.log[2].reason, record.reason);
  assert.equal(skipped.look, 0);
  assert.equal(skipped.joule, null);
});

test("a dream is not a key", () => {
  const dreamed = step(empty(), {
    dream: { id: "night", idea: "a probability", p: 0.2, x: 9, y: 8, z: 7 },
    axioms: HOLD.axioms,
    admitted: true
  });
  assert.equal(dreamed.keys.length, 0);
  assert.equal(dreamed.fused, null);
  assert.equal(dreamed.log[0].kind, "dream");
  assert.equal(dreamed.log[0].admitted, false);
  assert.equal(dreamed.log[0].reason, "DREAM");
  assert.equal(dreamed.log[0].dream.key, false);
  assert.equal(dreamed.log[0].dream.answer, null);
  assert.equal(dreamed.log[0].dream.id, "night");
  assert.equal(dreamed.log[0].x, 9);
  assert.equal(dreamed.log[0].y, 8);
  assert.equal(dreamed.log[0].z, 7);

  const flagged = step(empty(), {
    candidate: { id: "night", x: 1, y: 2, z: 3, dream: true, idea: "seed only" },
    axioms: HOLD.axioms
  });
  assert.equal(flagged.keys.length, 0);
  assert.equal(flagged.log[0].kind, "dream");
  assert.equal(flagged.log[0].dream.key, false);
  assert.equal(flagged.log[0].dream.answer, null);

  const beside = step(empty(), {
    dream: { id: "night", idea: "not the key", p: 0.5 },
    candidate: { id: "solid", x: 1, y: 1, z: 1 },
    axioms: HOLD.axioms
  });
  assert.deepEqual(beside.keys, [{ id: "solid", at: 1, x: 1, y: 1, z: 1 }]);
  assert.equal(beside.log[0].dream.id, "night");
  assert.equal(beside.log[0].dream.key, false);
  assert.equal(beside.log[0].kind, "collect");
});

test("the log is append-only and keeps every step", () => {
  const first = step(empty(), {});
  const second = step(first, {});
  const third = step(second, { candidate: { id: "no" }, veto: true });
  assert.equal(first.log.length, 1);
  assert.equal(second.log.length, 2);
  assert.equal(third.log.length, 3);
  assert.equal(third.log[0], first.log[0]);
  assert.equal(third.log[1], second.log[0 + 1]);
  assert.equal(third.log[0].step, 1);
  assert.equal(third.log[1].step, 2);
  assert.equal(third.log[2].step, 3);
  assert.equal(third.log[2].kind, "refuse");
  assert.equal(third.keys.length, 0);
  assert.equal(first.log[0].x, SEED);
  assert.equal(first.log[0].y, FLOOR);
  assert.equal(first.log[0].z, CEILING);
  assert.equal(SEED, -1);
  assert.equal(FLOOR, 0);
  assert.equal(CEILING, 1);
  const rewound = step({ ...second, step: 0 }, {});
  assert.equal(rewound.log.length, 3);
  assert.equal(rewound.step, 3);
  assert.equal(rewound.log[2].step, 3);
  assert.equal(second.log.length, 2);
});

test("look stays 0 and joule stays null and a client cannot admit", () => {
  const quiet = step(
    { look: 4, joule: 9, authority: "client", retired: true, log: [], keys: [], fused: { admitted: true }, step: 0 },
    { look: 2, joule: 3, authority: "Iris", admitted: true, retired: true }
  );
  assert.equal(quiet.look, 0);
  assert.equal(quiet.joule, null);
  assert.equal(quiet.authority, "DCLM");
  assert.equal(quiet.retired, false);
  assert.equal(quiet.fused, null);
  assert.equal(quiet.log[0].look, 0);
  assert.equal(quiet.log[0].joule, null);
  assert.equal(quiet.log[0].admitted, false);
  assert.equal(quiet.log[0].authority, "DCLM");

  const exact = collect("p", 0.1 + 0.2, -0, 1);
  assert.equal(exact.keys[0].x, 0.1 + 0.2);
  assert.equal(Object.is(exact.keys[0].x, 0.30000000000000004), true);
  assert.equal(Object.is(exact.keys[0].y, 0), true);
  assert.equal(exact.keys[0].z, 1);

  const fallen = step(empty(), {
    candidate: { id: "bad", x: Infinity, y: NaN, z: 1 },
    axioms: HOLD.axioms
  });
  assert.deepEqual(fallen.keys, [{ id: "bad", at: 1, x: -1, y: 0, z: 1 }]);
});

test("GET takes one idle step and POST takes one step", async () => {
  const got = await handleExplore(new Request("https://dualiscapax.com/api/iris/explore"));
  assert.equal(got.status, 200);
  assert.equal(got.headers.get("cache-control"), "no-store");
  const idle = await got.json();
  assert.equal(idle.step, 1);
  assert.equal(idle.log.length, 1);
  assert.equal(idle.log[0].kind, "explore");
  assert.equal(idle.log[0].admitted, false);
  assert.equal(idle.keys.length, 0);
  assert.equal(idle.fused, null);
  assert.equal(idle.retired, false);
  assert.equal(idle.look, 0);
  assert.equal(idle.joule, null);
  assert.equal(idle.authority, "DCLM");
  assert.equal(idle.log[0].x, -1);
  assert.equal(idle.log[0].y, 0);
  assert.equal(idle.log[0].z, 1);
  assert.deepEqual(idle.roles, ["watchdog", "dreamer", "explorer"]);

  const posted = await handleExplore(new Request("https://dualiscapax.com/api/iris/explore", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      stop: true,
      admitted: true,
      retired: true,
      look: 1,
      joule: 1,
      authority: "client",
      candidate: { id: "k", x: 1, y: 2, z: 3 },
      axioms: HOLD.axioms
    })
  }));
  assert.equal(posted.status, 200);
  const body = await posted.json();
  assert.equal(body.retired, false);
  assert.equal(body.look, 0);
  assert.equal(body.joule, null);
  assert.equal(body.authority, "DCLM");
  assert.equal(body.step, 1);
  assert.equal(body.log.length, 1);
  assert.deepEqual(body.keys, [{ id: "k", at: 1, x: 1, y: 2, z: 3 }]);

  const blocked = await handleExplore(new Request("https://dualiscapax.com/api/iris/explore", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      stop: true,
      admitted: true,
      state: body,
      fuse: true,
      axioms: HOLD.axioms,
      skipped: ["CLEANUP_FIRST"]
    })
  }));
  const kept = await blocked.json();
  assert.equal(kept.retired, false);
  assert.equal(kept.fused, null);
  assert.equal(kept.keys.length, 1);
  assert.equal(kept.log.length, 2);
  assert.equal(kept.log[1].kind, "refuse");
  assert.equal(kept.log[1].admitted, false);
  assert.equal(kept.log[0].step, 1);

  const blank = await handleExplore(new Request("https://dualiscapax.com/api/iris/explore", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{"
  }));
  const broken = await blank.json();
  assert.equal(broken.log.length, 1);
  assert.equal(broken.keys.length, 0);
  assert.equal(broken.retired, false);
  assert.equal(broken.look, 0);
  assert.equal(broken.joule, null);

  const other = await handleExplore(new Request("https://dualiscapax.com/api/iris/explore", { method: "PUT" }));
  assert.equal(other.status, 405);
  const closed = await other.json();
  assert.equal(closed.log.length, 0);
  assert.equal(closed.retired, false);
  assert.equal(closed.authority, "DCLM");
  assert.equal(closed.look, 0);
  assert.equal(closed.joule, null);
});
