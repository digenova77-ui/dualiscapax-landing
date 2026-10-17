import { pegOf } from "./unity-wallet.js";
import { open } from "./unity-id-protocol.js";
import { COINS, COIN_NOTE, SENTENCES, run } from "./sandbox-math.js";

export { COINS, COIN_NOTE, SENTENCES, run };

export const EARLY = 2;

const HOUSE = Object.freeze([
  Object.freeze({ seat: 1, serial: "DC-F-DE51-FFD7", unityId: "DC-U-001", ledger: "WHITE", label: "Reserved — seat 1", role: "Founding seat. Operator." }),
  Object.freeze({ seat: 2, serial: "DC-F-3B06-260D", unityId: "", ledger: "WHITE", label: "Reserved — seat 2", role: "Founding seat." }),
  Object.freeze({ seat: 3, serial: "DC-F-0505-E337", unityId: "", ledger: "BLACK", label: "", role: "Undisclosed allocation." }),
  Object.freeze({ seat: 4, serial: "DC-F-7923-A1F3", unityId: "", ledger: "BLACK", label: "", role: "Undisclosed allocation." }),
  Object.freeze({ seat: 5, serial: "DC-F-9B78-408E", unityId: "", ledger: "BLACK", label: "", role: "Undisclosed allocation." }),
  Object.freeze({ seat: 6, serial: "DC-F-4CA0-75AB", unityId: "", ledger: "BLACK", label: "", role: "Undisclosed allocation." }),
  Object.freeze({ seat: 7, serial: "DC-F-9D8F-FB45", unityId: "", ledger: "BLACK", label: "", role: "Undisclosed allocation." }),
  Object.freeze({ seat: 8, serial: "DC-F-07A8-CB8F", unityId: "", ledger: "BLACK", label: "", role: "Undisclosed allocation." }),
  Object.freeze({ seat: 9, serial: "DC-F-C087-92EE", unityId: "", ledger: "BLACK", label: "", role: "Undisclosed allocation." }),
  Object.freeze({ seat: 10, serial: "DC-F-BD1C-7269", unityId: "", ledger: "BLACK", label: "", role: "Undisclosed seat." })
]);

export const RULE = "A founder seat is one Unity ID from the published house. One seat each. A duplicate is refused. A missing ID is refused. The seat does not vote. The pay is 0. It is not an office. The board does not mint a coin and does not open the gate. This door does not store a new board.";

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function quiet() {
  return {
    coin: null,
    minted: false,
    gate: "shut",
    open: false,
    look: 0,
    joule: null
  };
}

function idOf(src) {
  return text(src.id) || text(src.unityId) || text(src.identification);
}

function secondOf(src) {
  if (!src || typeof src !== "object") return "";
  if (Object.hasOwn(src, "secondId")) return text(src.secondId) || "second";
  if (Object.hasOwn(src, "second")) return text(src.second) || "second";
  if (Array.isArray(src.ids) && src.ids.length > 1) return text(src.ids[1]) || "second";
  if (Array.isArray(src.unityIds) && src.unityIds.length > 1) return text(src.unityIds[1]) || "second";
  return "";
}

export async function adopt(input, net) {
  const src = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const protocol = net || open();
  const kind = text(src.kind) || "human";
  const body = text(src.body);
  const id = idOf(src);
  const extra = secondOf(src);
  if (extra) {
    const slot = body || "body";
    if (id) await protocol.participate({ kind: kind, body: slot, id: id });
    if (extra !== "second") await protocol.participate({ kind: kind, body: slot, id: extra });
    return {
      adopter: false,
      protocol: false,
      participates: false,
      reason: "second",
      kind: null,
      peg: null,
      iris: null,
      shifts: 0,
      sooner: 0,
      cost: null,
      find: false,
      face: false,
      standing: false,
      ...quiet()
    };
  }
  const record = await protocol.participate({ kind: kind, body: body, id: id });
  const marked = src.adopter !== false && record.participates === true;
  return {
    adopter: marked,
    protocol: record.protocol === true,
    participates: record.participates === true,
    reason: record.reason,
    kind: record.kind,
    peg: record.peg,
    iris: record.iris,
    shifts: marked ? EARLY : 0,
    sooner: marked ? EARLY : 0,
    cost: marked ? 0 : null,
    find: false,
    face: false,
    standing: false,
    ...quiet()
  };
}

function rowOf(row) {
  if (typeof row === "string") return { unityId: row };
  if (!row || typeof row !== "object" || Array.isArray(row)) return {};
  return row;
}

export async function seatBoard(input) {
  const rows = input == null ? HOUSE.map(function (seat) {
    return { unityId: seat.unityId, seat: seat.seat };
  }) : (Array.isArray(input) ? input : [input]);
  const protocol = open();
  const seen = new Set();
  const seated = [];
  const refused = [];
  for (let i = 0; i < rows.length; i++) {
    const src = rowOf(rows[i]);
    if (secondOf(src)) {
      refused.push({ reason: "second", peg: null, look: 0, joule: null });
      continue;
    }
    const id = idOf(src);
    if (!id) {
      refused.push({ reason: "no-id", seat: src.seat || null, look: 0, joule: null });
      continue;
    }
    const mark = await pegOf(id);
    if (seen.has(mark)) {
      refused.push({ reason: "duplicate", peg: mark, look: 0, joule: null });
      continue;
    }
    seen.add(mark);
    const known = HOUSE.find(function (seat) { return seat.unityId === id; });
    if (!known) {
      refused.push({ reason: "not-on-board", peg: mark, look: 0, joule: null });
      continue;
    }
    const record = await protocol.participate({ kind: "human", body: "seat-" + known.seat, id: id });
    if (!record.participates) {
      refused.push({ reason: record.reason, peg: null, look: 0, joule: null });
      continue;
    }
    seated.push({
      seat: known.seat,
      serial: known.serial,
      label: known.label || null,
      ledger: known.ledger,
      role: known.role,
      peg: record.peg,
      iris: record.iris,
      vote: false,
      pay: 0,
      office: false,
      look: 0,
      joule: null
    });
  }
  return {
    seated: seated,
    refused: refused,
    vote: false,
    pay: 0,
    office: false,
    memory: protocol.memory(),
    ...quiet()
  };
}

export async function sign(input) {
  const src = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const base = {
    admitted: false,
    seated: false,
    second: false,
    vote: false,
    pay: 0,
    office: false,
    stored: false,
    ...quiet()
  };
  if (src.flags !== 0) return { ...base, reason: "flags", peg: null };
  if (secondOf(src)) return { ...base, reason: "second", peg: null };
  const id = idOf(src);
  if (!id) return { ...base, reason: "no-id", peg: null };
  const known = HOUSE.find(function (seat) { return seat.unityId === id; });
  const mark = await pegOf(id);
  if (!known) return { ...base, reason: "not-on-board", peg: mark };
  return { ...base, reason: "duplicate", peg: mark, seat: known.seat };
}

export async function foundingRule() {
  const board = await seatBoard(null);
  return {
    rule: RULE,
    sentences: SENTENCES,
    note: COIN_NOTE,
    coins: COINS,
    stored: false,
    ...board
  };
}
