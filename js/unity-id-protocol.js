import { pegOf, record } from "./unity-wallet.js";

export const KINDS = Object.freeze(["human", "bot", "corporation"]);

export const LAW = "Everything on this network has one Unity ID. A human has one. A bot has one. A corporation has one. That is the identity. An agent of an agency must carry it to participate. Without it, they are not part of this protocol.";

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function carrying(input) {
  if (!input || typeof input !== "object") return false;
  if (input.agent === true) return true;
  if (typeof input.agent === "string" && input.agent.trim()) return true;
  const part = text(input.part);
  return part === "agent" || part === "department" || part === "brand";
}

function refused(reason, kind) {
  return Object.freeze({
    participates: false,
    protocol: false,
    reason: reason,
    kind: kind,
    peg: null,
    iris: null,
    look: 0,
    joule: null
  });
}

function admitted(kind, held) {
  return Object.freeze({
    participates: true,
    protocol: true,
    reason: "one",
    kind: kind,
    peg: held.peg,
    iris: held.iris,
    look: 0,
    joule: null
  });
}

export function open() {
  const bodies = new Map();

  async function participate(input) {
    const src = input && typeof input === "object" ? input : {};
    const kind = text(src.kind);
    const body = text(src.body);
    const id = typeof src.id === "string" ? src.id : text(src.identification);
    const mark = await pegOf(id);
    if (!KINDS.includes(kind)) return refused("kind", null);
    if (carrying(src) && kind !== "corporation") return refused("kind", null);
    if (!mark) return refused("absent", null);
    const slot = body || mark;
    if (carrying(src) && !body) return refused("absent", null);
    const held = bodies.get(slot);
    if (held && held.peg !== mark) return refused("second", held.kind);
    for (const [name, row] of bodies) {
      if (name !== slot && row.peg === mark) return refused("second", row.kind);
    }
    const heldRecord = await record(id);
    if (!heldRecord.peg) return refused("absent", null);
    const seated = held ? held.kind : kind;
    bodies.set(slot, { kind: seated, peg: heldRecord.peg });
    return admitted(seated, heldRecord);
  }

  function memory() {
    const rows = [];
    for (const row of bodies.values()) {
      rows.push(Object.freeze({
        peg: row.peg,
        iris: "Iris",
        kind: row.kind,
        look: 0,
        joule: null
      }));
    }
    return Object.freeze(rows);
  }

  return { participate: participate, memory: memory };
}
