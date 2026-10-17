import { pegOf } from "./unity-wallet.js";
import { open } from "./unity-id-protocol.js";
import { COINS, COIN_NOTE, MOTTO, ROLES, SENTENCES, run } from "./sandbox-math.js";

export { COINS, COIN_NOTE, MOTTO, ROLES, SENTENCES, run };

export const RULE = "The founding principle is identity, resource accounting, and Merit. The live specification does not name a founder board, a seat, or a cap. No seat is taken. Nothing is stored. Nothing is minted. The gate stays shut.";

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function quiet() {
  return {
    coin: null,
    minted: false,
    live: false,
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

function blankEconomic() {
  return {
    adopter: null,
    rule: "unresolved",
    cap: null,
    price: null,
    seat: null,
    shifts: null,
    cost: null
  };
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
      ...blankEconomic(),
      protocol: false,
      participates: false,
      reason: "second",
      kind: null,
      peg: null,
      iris: null,
      ...quiet()
    };
  }
  const record = await protocol.participate({ kind: kind, body: body, id: id });
  return {
    ...blankEconomic(),
    protocol: record.protocol === true,
    participates: record.participates === true,
    reason: record.reason,
    kind: record.kind,
    peg: record.peg,
    iris: record.iris,
    ...quiet()
  };
}

function rowOf(row) {
  if (typeof row === "string") return { unityId: row };
  if (!row || typeof row !== "object" || Array.isArray(row)) return {};
  return row;
}

export async function seatBoard(input) {
  const rows = input == null ? [] : (Array.isArray(input) ? input : [input]);
  const seen = new Set();
  const refused = [];
  for (let i = 0; i < rows.length; i++) {
    const src = rowOf(rows[i]);
    if (secondOf(src)) {
      refused.push({ reason: "second", peg: null, seat: null, look: 0, joule: null });
      continue;
    }
    const id = idOf(src);
    if (!id) {
      refused.push({ reason: "no-id", peg: null, seat: null, look: 0, joule: null });
      continue;
    }
    const mark = await pegOf(id);
    if (seen.has(mark)) {
      refused.push({ reason: "second", peg: mark, seat: null, look: 0, joule: null });
      continue;
    }
    seen.add(mark);
    refused.push({ reason: "unresolved", peg: mark, seat: null, look: 0, joule: null });
  }
  return {
    rule: "unresolved",
    principle: RULE,
    seated: [],
    seats: null,
    cap: null,
    names: null,
    refused: refused,
    stored: false,
    vote: null,
    pay: null,
    office: null,
    memory: [],
    ...quiet()
  };
}

export async function sign(input) {
  const src = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const base = {
    admitted: false,
    seated: false,
    stored: false,
    rule: "unresolved",
    seat: null,
    cap: null,
    names: null,
    ...quiet()
  };
  if (secondOf(src)) return { ...base, reason: "second", peg: null };
  const id = idOf(src);
  if (!id) return { ...base, reason: "no-id", peg: null };
  return { ...base, reason: "unresolved", peg: await pegOf(id) };
}

export async function foundingRule() {
  const board = await seatBoard(null);
  return {
    sentences: SENTENCES,
    note: COIN_NOTE,
    motto: MOTTO,
    coins: COINS,
    roles: ROLES,
    ...board,
    rule: RULE,
    stored: false,
    live: false
  };
}
