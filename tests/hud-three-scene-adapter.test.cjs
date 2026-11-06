const test = require("node:test");
const assert = require("node:assert/strict");
const ThreeAdapter = require("../js/hud-three-scene-adapter.js");
const SceneOps = require("../js/hud-scene-operations.js");

function fakeThree() {
  class Vector3 {
    constructor() { this.x = 0; this.y = 0; this.z = 0; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; }
  }
  class Geometry { dispose() { this.disposed = true; } }
  class Material { constructor(options) { this.options = options; } }
  class Mesh {
    constructor(geometry, material) {
      this.geometry = geometry; this.material = material;
      this.position = new Vector3(); this.rotation = new Vector3(); this.scale = new Vector3();
      this.userData = {};
    }
  }
  return {
    BoxGeometry: Geometry, SphereGeometry: Geometry, CylinderGeometry: Geometry,
    ConeGeometry: Geometry, TorusGeometry: Geometry,
    MeshStandardMaterial: Material, Mesh
  };
}
function sceneFixture() {
  const children = new Set();
  const scene = { add: (item) => children.add(item), remove: (item) => children.delete(item) };
  const THREE = fakeThree();
  const adapter = ThreeAdapter.create(THREE, scene);
  const journal = SceneOps.create(adapter);
  return { children, adapter, journal };
}
const object = { id: "mesh-1", kind: "box", position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], material: "cyan", label: "Proof mesh" };

test("Three.js adapter adds a mesh and exposes a stable snapshot", () => {
  const f = sceneFixture();
  f.journal.apply({ type: "create", object });
  assert.equal(f.children.size, 1);
  assert.deepEqual(f.adapter.get("mesh-1").position, [0, 0, 0]);
  assert.equal(f.adapter.get("mesh-1").label, "Proof mesh");
});

test("journal transforms actual adapter-backed mesh and undo restores it", () => {
  const f = sceneFixture();
  f.journal.apply({ type: "create", object });
  f.journal.apply({ type: "transform", id: "mesh-1", patch: { position: [2, 3, 4] } });
  assert.deepEqual(f.adapter.get("mesh-1").position, [2, 3, 4]);
  f.journal.undo();
  assert.deepEqual(f.adapter.get("mesh-1").position, [0, 0, 0]);
});

test("undo of create removes mesh and redo recreates it", () => {
  const f = sceneFixture();
  f.journal.apply({ type: "create", object });
  f.journal.undo();
  assert.equal(f.children.size, 0);
  f.journal.redo();
  assert.equal(f.children.size, 1);
});

test("adapter rejects unsupported text geometry rather than guessing", () => {
  const f = sceneFixture();
  assert.throws(() => f.journal.apply({ type: "create", object: { ...object, id: "text-1", kind: "text" } }), /text_geometry_requires_text_factory/);
  assert.equal(f.children.size, 0);
});
