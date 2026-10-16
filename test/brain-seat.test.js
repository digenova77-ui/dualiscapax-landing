import assert from "node:assert/strict";
import test from "node:test";
import { CEILING, FLOOR, SEED, seat } from "../js/brain-seat.js";

const HOLD = {
  id: "brain",
  what: "seat the tree",
  axioms: {
    NO_FORCE: true,
    HOST_SAFE: true,
    CLEANUP_FIRST: true,
    TRUTH_OR_NOTHING: true
  }
};

test("the seed sits at -1 under the floor at 0 and the tree is that path", () => {
  const held = seat();
  assert.equal(SEED, -1);
  assert.equal(FLOOR, 0);
  assert.equal(CEILING, 1);
  assert.equal(held.brain, "seated");
  assert.equal(held.seat.seed, -1);
  assert.equal(held.seat.floor, 0);
  assert.equal(held.seat.ceiling, 1);
  assert.ok(held.seat.seed < held.seat.floor);
  assert.ok(held.seat.floor < held.seat.ceiling);
  assert.deepEqual(held.seat.tree, [-1, 0]);
  assert.deepEqual(held.seat.tree, [held.seat.seed, held.seat.floor]);
  assert.equal(Array.isArray(held.seat), false);
  assert.equal(Object.hasOwn(held, "seats"), false);
  assert.deepEqual(Object.keys(held.seat), ["seed", "floor", "ceiling", "tree", "derivative"]);
});

test("one name has no second point, so the diamond derivative is withheld", () => {
  for (const input of [undefined, null, {}, { name: "floor" }, { readings: [0] }, { reading: -1 }, [FLOOR]]) {
    const held = seat(input);
    assert.equal(held.seat.derivative, null);
    assert.deepEqual(held.seat.tree, [SEED, FLOOR]);
    assert.equal(held.written, null);
    assert.equal(held.look, 0);
    assert.equal(held.joule, null);
  }
});

test("two different finite readings take their difference and two equal readings are 0", () => {
  assert.equal(seat({ readings: [2, 5] }).seat.derivative, 3);
  assert.equal(seat({ reading: 4, second: 1 }).seat.derivative, -3);
  assert.equal(seat([8, 8]).seat.derivative, 0);
  assert.equal(seat({ readings: [4, 4] }).seat.derivative, 0);
  assert.equal(seat({ reading: -0, second: 0 }).seat.derivative, 0);
  assert.equal(seat({ readings: [1.5, 1.5] }).seat.derivative, 0);
  assert.equal(seat({ readings: [1, 2, 100] }).seat.derivative, 1);
});

test("non-finite readings do not invent a derivative", () => {
  const bad = [
    [NaN, 1],
    [1, NaN],
    [Infinity, 1],
    [1, -Infinity],
    ["1", 2],
    [1, "2"],
    [null, 1],
    [1, null],
    [undefined, 1],
    [1, undefined],
    [true, 1],
    [{}, 1]
  ];
  for (const readings of bad) {
    const held = seat({ readings: readings, derivative: 9, second: 4 });
    assert.equal(held.seat.derivative, null);
    assert.equal(held.seat.seed, -1);
    assert.equal(held.seat.floor, 0);
  }
  const onlySecond = seat({ second: 4, derivative: 4 });
  assert.equal(onlySecond.seat.derivative, null);
  const moved = seat({ seed: 5, floor: 2, ceiling: 9, tree: ["dna"], derivative: 1 });
  assert.equal(moved.seat.seed, -1);
  assert.equal(moved.seat.floor, 0);
  assert.equal(moved.seat.ceiling, 1);
  assert.deepEqual(moved.seat.tree, [-1, 0]);
  assert.equal(moved.seat.derivative, null);
});

test("a DCLM veto or a missing law describes the seat and writes nothing", () => {
  const veto = seat({ ...HOLD, veto: true, readings: [1, 4] });
  assert.equal(veto.admitted, false);
  assert.equal(veto.authority, "DCLM");
  assert.equal(veto.written, null);
  assert.equal(veto.look, 0);
  assert.equal(veto.joule, null);
  assert.equal(veto.brain, "seated");
  assert.equal(veto.seat.derivative, 3);
  assert.deepEqual(veto.seat.tree, [-1, 0]);

  const axioms = { ...HOLD.axioms };
  delete axioms.CLEANUP_FIRST;
  const missing = seat({ ...HOLD, axioms: axioms, readings: [9, 9] });
  assert.equal(missing.admitted, false);
  assert.equal(missing.written, null);
  assert.equal(missing.authority, "DCLM");
  assert.equal(missing.seat.derivative, 0);
  assert.equal(missing.seat.seed, -1);
  assert.equal(missing.look, 0);
  assert.equal(missing.joule, null);

  const idle = seat({ readings: [3, 7] });
  assert.equal(idle.admitted, false);
  assert.equal(idle.written, null);
  assert.equal(idle.seat.derivative, 4);
});

test("client flags cannot force admitted or move look or joule", () => {
  const forced = seat({
    ...HOLD,
    veto: true,
    admitted: true,
    authority: "client",
    bypass: true,
    look: 1,
    joule: 5,
    written: { task: "forged", what: "open" },
    readings: [6, 6]
  });
  assert.equal(forced.admitted, false);
  assert.equal(forced.authority, "DCLM");
  assert.equal(forced.written, null);
  assert.equal(forced.look, 0);
  assert.equal(forced.joule, null);
  assert.equal(forced.seat.derivative, 0);
  assert.equal(Object.hasOwn(forced, "bypass"), false);

  const held = seat({
    ...HOLD,
    admitted: false,
    authority: "client",
    bypass: true,
    look: 8,
    joule: 2,
    readings: [1, 2]
  });
  assert.equal(held.admitted, true);
  assert.equal(held.authority, "DCLM");
  assert.deepEqual(held.written, { task: "brain", what: "seat the tree" });
  assert.equal(held.look, 0);
  assert.equal(held.joule, null);
  assert.equal(held.brain, "seated");
  assert.equal(held.seat.derivative, 1);
  assert.deepEqual(held.seat, {
    seed: -1,
    floor: 0,
    ceiling: 1,
    tree: [-1, 0],
    derivative: 1
  });
});

test("the brain keeps one seat when it is seated again", () => {
  const first = seat({ readings: [1, 3] });
  const second = seat();
  assert.equal(first.brain, "seated");
  assert.equal(second.brain, "seated");
  assert.equal(second.seat.derivative, null);
  assert.notEqual(first.seat, second.seat);
  assert.equal(Object.keys(second).filter(function (key) { return key === "seat"; }).length, 1);
});
