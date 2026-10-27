/**
 * Three.js adapter for the HUD scene-operation journal.
 *
 * Opt-in module; not imported by the live page yet. It only manages objects
 * created through this adapter and never takes ownership of the whole scene.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DualisHudThreeAdapter = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function create(THREE, scene, options) {
    if (!THREE || !scene || typeof scene.add !== "function" || typeof scene.remove !== "function") {
      throw new TypeError("three_scene_required");
    }
    const opts = options || {};
    const objects = new Map();
    const materials = opts.materials || {};
    const defaultMaterial = new THREE.MeshStandardMaterial({ color: 0x63f7dd, metalness: 0.35, roughness: 0.5 });

    function vector(values, fallback) {
      return Array.isArray(values) && values.length === 3 ? values : fallback;
    }
    function materialFor(name) {
      return materials[name] || defaultMaterial;
    }
    function makeGeometry(object) {
      switch (object.kind) {
        case "box": return new THREE.BoxGeometry(1, 1, 1);
        case "sphere": return new THREE.SphereGeometry(0.5, 24, 16);
        case "cylinder": return new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
        case "cone": return new THREE.ConeGeometry(0.5, 1, 24);
        case "torus": return new THREE.TorusGeometry(0.5, 0.12, 12, 32);
        case "node": return new THREE.SphereGeometry(0.18, 16, 12);
        case "tower": return new THREE.BoxGeometry(0.7, 2, 0.7);
        case "text": throw new TypeError("text_geometry_requires_text_factory");
        default: throw new TypeError("unsupported_object_kind");
      }
    }
    function make(object) {
      const geometry = makeGeometry(object);
      const mesh = new THREE.Mesh(geometry, materialFor(object.material));
      mesh.name = object.id;
      mesh.position.set(...vector(object.position, [0, 0, 0]));
      mesh.rotation.set(...vector(object.rotation, [0, 0, 0]));
      mesh.scale.set(...vector(object.scale, [1, 1, 1]));
      mesh.userData = { ...(mesh.userData || {}), hudObject: true, hudId: object.id, hudKind: object.kind, hudLabel: object.label || object.id, hudMaterial: object.material || "cyan" };
      return mesh;
    }
    function serialize(mesh) {
      return {
        id: mesh.userData.hudId,
        kind: mesh.userData.hudKind,
        position: [mesh.position.x, mesh.position.y, mesh.position.z],
        rotation: [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z],
        scale: [mesh.scale.x, mesh.scale.y, mesh.scale.z],
        material: mesh.userData.hudMaterial || "cyan",
        label: mesh.userData.hudLabel
      };
    }
    function get(id) {
      const mesh = objects.get(id);
      return mesh ? serialize(mesh) : null;
    }
    function add(object) {
      if (objects.has(object.id)) throw new Error("scene_object_already_exists");
      const mesh = make(object);
      objects.set(object.id, mesh);
      scene.add(mesh);
    }
    function update(id, patch) {
      const mesh = objects.get(id);
      if (!mesh) throw new Error("scene_object_not_found");
      if (patch.position) mesh.position.set(...patch.position);
      if (patch.rotation) mesh.rotation.set(...patch.rotation);
      if (patch.scale) mesh.scale.set(...patch.scale);
      if (patch.label) mesh.userData.hudLabel = patch.label;
    }
    function remove(id) {
      const mesh = objects.get(id);
      if (!mesh) throw new Error("scene_object_not_found");
      scene.remove(mesh);
      if (mesh.geometry && typeof mesh.geometry.dispose === "function") mesh.geometry.dispose();
      objects.delete(id);
    }
    return Object.freeze({ get, add, update, remove, size: () => objects.size });
  }

  return Object.freeze({ create });
});
