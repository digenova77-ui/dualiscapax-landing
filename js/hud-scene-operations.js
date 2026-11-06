/**
 * DualisCapax HUD scene operation journal — adapter-driven local editing core.
 *
 * This module does not render, persist, authorize, or call providers. The caller
 * supplies a scene adapter. Protected or shared writes must be authorized by
 * the server-side Trinity gate before the adapter is mutated.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DualisHudSceneOps = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "dualis.hud-scene-ops.v1";
  const KINDS = new Set(["box", "sphere", "cylinder", "cone", "torus", "text", "node", "tower"]);
  const MATERIALS = new Set(["cyan", "violet", "darkMetal", "amber"]);
  const VECTOR_KEYS = ["position", "rotation", "scale"];

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function validVector(value, key) {
    return Array.isArray(value) && value.length === 3 &&
      value.every((n) => typeof n === "number" && Number.isFinite(n)) &&
      (key !== "scale" || value.every((n) => n > 0 && n <= 10000));
  }

  function validateObject(object) {
    if (!object || typeof object !== "object" || Array.isArray(object)) throw new TypeError("scene_object_required");
    if (typeof object.id !== "string" || !/^[A-Za-z0-9._:-]{1,128}$/.test(object.id)) throw new TypeError("invalid_object_id");
    if (!KINDS.has(object.kind)) throw new TypeError("unsupported_object_kind");
    for (const key of VECTOR_KEYS) {
      if (object[key] !== undefined && !validVector(object[key], key)) throw new TypeError("invalid_" + key);
    }
    if (object.material !== undefined && !MATERIALS.has(object.material)) throw new TypeError("unsupported_material");
    if (object.label !== undefined && (typeof object.label !== "string" || object.label.length > 160)) throw new TypeError("invalid_label");
    if (object.detail !== undefined && (typeof object.detail !== "string" || object.detail.length > 500)) throw new TypeError("invalid_detail");
    return clone(object);
  }

  function create(adapter, options) {
    if (!adapter || typeof adapter.get !== "function" || typeof adapter.add !== "function" ||
        typeof adapter.update !== "function" || typeof adapter.remove !== "function") {
      throw new TypeError("scene_adapter_contract_required");
    }
    const opts = options || {};
    const maxHistory = Number.isInteger(opts.maxHistory) ? Math.max(1, Math.min(opts.maxHistory, 500)) : 100;
    const undoStack = [];
    const redoStack = [];
    let busy = false;

    function snapshot(id) {
      const current = adapter.get(id);
      return current == null ? null : clone(current);
    }

    function perform(operation) {
      if (busy) throw new Error("scene_operation_reentrant");
      if (!operation || typeof operation !== "object") throw new TypeError("operation_required");
      busy = true;
      let inverse;
      try {
        if (operation.type === "create") {
          const object = validateObject(operation.object);
          if (snapshot(object.id) !== null) throw new Error("scene_object_already_exists");
          adapter.add(clone(object));
          inverse = { type: "remove", id: object.id };
        } else if (operation.type === "transform") {
          const id = operation.id;
          if (typeof id !== "string") throw new TypeError("object_id_required");
          const before = snapshot(id);
          if (!before) throw new Error("scene_object_not_found");
          const patch = {};
          for (const key of VECTOR_KEYS) {
            if (operation.patch && Object.prototype.hasOwnProperty.call(operation.patch, key)) {
              if (!validVector(operation.patch[key], key)) throw new TypeError("invalid_" + key);
              patch[key] = operation.patch[key].slice();
            }
          }
          if (!Object.keys(patch).length) throw new TypeError("empty_transform_patch");
          adapter.update(id, clone(patch));
          inverse = { type: "restore", id, object: before };
        } else if (operation.type === "remove") {
          const before = snapshot(operation.id);
          if (!before) throw new Error("scene_object_not_found");
          adapter.remove(operation.id);
          inverse = { type: "restore", id: operation.id, object: before };
        } else if (operation.type === "restore") {
          const object = validateObject(operation.object);
          const before = snapshot(operation.id);
          if (before) adapter.update(operation.id, clone(object));
          else adapter.add(clone(object));
          inverse = before ? { type: "restore", id: operation.id, object: before } : { type: "remove", id: operation.id };
        } else {
          throw new TypeError("unsupported_scene_operation");
        }
        return inverse;
      } finally {
        busy = false;
      }
    }

    function apply(operation, metadata) {
      const inverse = perform(operation);
      undoStack.push({ forward: clone(operation), inverse, metadata: clone(metadata || {}) });
      if (undoStack.length > maxHistory) undoStack.shift();
      redoStack.length = 0;
      return { ok: true, version: VERSION, undoDepth: undoStack.length, redoDepth: redoStack.length };
    }

    function undo() {
      if (!undoStack.length) return { ok: false, reason: "nothing_to_undo" };
      const entry = undoStack[undoStack.length - 1];
      const redo = perform(entry.inverse);
      undoStack.pop();
      redoStack.push({ forward: entry.forward, inverse: redo, metadata: entry.metadata });
      return { ok: true, version: VERSION, undoDepth: undoStack.length, redoDepth: redoStack.length };
    }

    function redo() {
      if (!redoStack.length) return { ok: false, reason: "nothing_to_redo" };
      const entry = redoStack[redoStack.length - 1];
      const inverse = perform(entry.forward);
      redoStack.pop();
      undoStack.push({ forward: entry.forward, inverse, metadata: entry.metadata });
      if (undoStack.length > maxHistory) undoStack.shift();
      return { ok: true, version: VERSION, undoDepth: undoStack.length, redoDepth: redoStack.length };
    }

    return Object.freeze({
      version: VERSION,
      apply,
      undo,
      redo,
      state: () => Object.freeze({ undoDepth: undoStack.length, redoDepth: redoStack.length, busy })
    });
  }

  return Object.freeze({ version: VERSION, create, validateObject });
});
