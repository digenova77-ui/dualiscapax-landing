const test = require("node:test");
const assert = require("node:assert/strict");
const SceneOps = require("../js/hud-scene-operations.js");

function fixture() {
  const objects = new Map();
  const adapter = {
    get: (id) => objects.has(id) ? structuredClone(objects.get(id)) : null,
    add: (object) => { if (objects.has(object.id)) throw new Error("duplicate"); objects.set(object.id, structuredClone(object)); },
    update: (id, patch) => {
      if (!objects.has(id)) throw new Error("missing");
      objects.set(id, { ...objects.get(id), ...structuredClone(patch) });
    },
    remove: (id) => { if (!objects.delete(id)) throw new Error("missing"); }
  };
  return { objects, adapter, journal: SceneOps.create(adapter) };
}
const box = (id = "obj-1") => ({ id, kind: "box", position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], material: "cyan", label: "Test object" });

test("creates a validated object and undo removes it", () => {
  const f = fixture();
  f.journal.apply({ type: "create", object: box() });
  assert.equal(f.objects.has("obj-1"), true);
  assert.equal(f.journal.undo().ok, true);
  assert.equal(f.objects.has("obj-1"), false);
});

test("redo restores a created object", () => {
  const f = fixture();
  f.journal.apply({ type: "create", object: box() });
  f.journal.undo();
  f.journal.redo();
  assert.equal(f.objects.get("obj-1").kind, "box");
});

test("transform is reversible and redo reapplies it", () => {
  const f = fixture();
  f.journal.apply({ type: "create", object: box() });
  f.journal.apply({ type: "transform", id: "obj-1", patch: { position: [4, 2, -1], scale: [2, 2, 2] } });
  assert.deepEqual(f.objects.get("obj-1").position, [4, 2, -1]);
  f.journal.undo();
  assert.deepEqual(f.objects.get("obj-1").position, [0, 0, 0]);
  f.journal.redo();
  assert.deepEqual(f.objects.get("obj-1").scale, [2, 2, 2]);
});

test("unknown object kind is rejected", () => {
  const f = fixture();
  assert.throws(() => f.journal.apply({ type: "create", object: { ...box(), kind: "arbitrary-html" } }), /unsupported_object_kind/);
  assert.equal(f.objects.size, 0);
});

test("non-finite and non-positive scale values are rejected", () => {
  const f = fixture();
  assert.throws(() => f.journal.apply({ type: "create", object: { ...box(), position: [0, Infinity, 0] } }), /invalid_position/);
  assert.throws(() => f.journal.apply({ type: "create", object: { ...box(), scale: [1, 0, 1] } }), /invalid_scale/);
});

test("duplicate IDs fail without overwriting existing objects", () => {
  const f = fixture();
  f.journal.apply({ type: "create", object: box() });
  assert.throws(() => f.journal.apply({ type: "create", object: { ...box(), label: "Overwrite attempt" } }), /scene_object_already_exists/);
  assert.equal(f.objects.get("obj-1").label, "Test object");
});

test("history is bounded and a new edit clears redo history", () => {
  const f = fixture();
  f.journal.apply({ type: "create", object: box() });
  f.journal.undo();
  f.journal.apply({ type: "create", object: box("obj-2") });
  assert.equal(f.journal.redo().reason, "nothing_to_redo");
});

test("missing target and unsupported operation fail closed", () => {
  const f = fixture();
  assert.throws(() => f.journal.apply({ type: "transform", id: "missing", patch: { position: [1, 2, 3] } }), /scene_object_not_found/);
  assert.throws(() => f.journal.apply({ type: "execute", payload: "anything" }), /unsupported_scene_operation/);
});

test("undo and redo report empty history safely", () => {
  const f = fixture();
  assert.equal(f.journal.undo().reason, "nothing_to_undo");
  assert.equal(f.journal.redo().reason, "nothing_to_redo");
});
