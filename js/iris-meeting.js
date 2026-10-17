import { attack } from "./iris-attack.js";
import { open } from "./unity-id-protocol.js";

export const ROLES = Object.freeze(["watchdog", "dreamer", "explorer"]);

export const SENTENCES = Object.freeze([
  "Iris is the most powerful form of intelligence on the planet for meeting one person, or for meeting a group.",
  "The power is the meeting: one-on-one, or one-on-group.",
  "One identification is not a group.",
  "Zero identifications is not a meeting.",
  "Every participant is a human, a bot, or a corporation, and has exactly one Unity ID.",
  "A missing ID is not on the protocol and is not in the meeting.",
  "A second ID for the same body is refused.",
  "Iris is the watchdog, the dreamer, and the explorer.",
  "She does not become a second writer.",
  "Nothing to remember.",
  "A probability is not an answer."
]);

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function idOf(src) {
  if (!src || typeof src !== "object") return "";
  if (typeof src.id === "string" && src.id.trim()) return src.id.trim();
  if (typeof src.unityId === "string" && src.unityId.trim()) return src.unityId.trim();
  if (typeof src.identification === "string" && src.identification.trim()) return src.identification.trim();
  if (Array.isArray(src.ids) && typeof src.ids[0] === "string") return src.ids[0].trim();
  if (Array.isArray(src.unityIds) && typeof src.unityIds[0] === "string") return src.unityIds[0].trim();
  return "";
}

function rowOf(row) {
  if (typeof row === "string") return { id: row };
  if (!row || typeof row !== "object" || Array.isArray(row)) return {};
  return row;
}

function peopleOf(input) {
  if (input == null) return [];
  if (typeof input === "string") return [input];
  if (Array.isArray(input)) return input;
  if (typeof input !== "object") return [];
  if (Array.isArray(input.participants)) return input.participants;
  if (Array.isArray(input.people)) return input.people;
  if (Array.isArray(input.ids)) return input.ids;
  if (Array.isArray(input.unityIds)) return input.unityIds;
  if (idOf(input) || text(input.body) || text(input.kind) || input.agent === true || Object.hasOwn(input, "secondId")) return [input];
  return [];
}

function claim(kind, body, id, agent, part, spare) {
  return { kind: kind, body: body, id: id, agent: agent, part: part, spare: spare };
}

function expand(person) {
  const src = rowOf(person);
  const kind = text(src.kind) || "human";
  const body = text(src.body);
  const agent = src.agent;
  const part = src.part;
  const primary = idOf(src);
  const claims = [claim(kind, body, primary, agent, part, false)];
  if (Object.hasOwn(src, "secondId")) claims.push(claim(kind, body, text(src.secondId), agent, part, true));
  if (typeof src.second === "string") claims.push(claim(kind, body, text(src.second), agent, part, true));
  if (Array.isArray(src.ids)) {
    for (let i = 1; i < src.ids.length; i++) {
      const id = typeof src.ids[i] === "string" ? src.ids[i].trim() : "";
      claims.push(claim(kind, body, id, agent, part, true));
    }
  }
  if (Array.isArray(src.unityIds)) {
    for (let i = 1; i < src.unityIds.length; i++) {
      const id = typeof src.unityIds[i] === "string" ? src.unityIds[i].trim() : "";
      claims.push(claim(kind, body, id, agent, part, true));
    }
  }
  return claims;
}

function refusal(reason) {
  return Object.freeze({
    reason: reason,
    present: false,
    peg: null,
    look: 0,
    joule: null
  });
}

function dreamOf(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) || !Array.isArray(input.seeds)) return null;
  const turn = Number.isInteger(input.turn) ? input.turn : 0;
  const hit = attack({ turn: turn, seeds: input.seeds });
  return Object.freeze({
    seeded: hit.books.length > 0,
    solved: hit.solved.length > 0,
    answer: false,
    look: 0,
    joule: null
  });
}

export async function meet(input, net) {
  const protocol = net || open();
  const excluded = [];
  const refused = [];
  const pegs = [];
  const present = [];
  const seen = new Set();
  const people = peopleOf(input);
  for (let p = 0; p < people.length; p++) {
    const claims = expand(people[p]);
    for (let c = 0; c < claims.length; c++) {
      const item = claims[c];
      if (item.spare && (!item.id || item.id === claims[0].id)) {
        if (!item.id) refused.push(refusal("second"));
        continue;
      }
      if (!item.id) {
        excluded.push(refusal("absent"));
        continue;
      }
      const held = await protocol.participate({
        kind: item.kind,
        body: item.body,
        id: item.id,
        agent: item.agent,
        part: item.part
      });
      if (!held.participates) {
        const row = refusal(held.reason || "absent");
        if (held.reason === "absent") excluded.push(row);
        else refused.push(row);
        continue;
      }
      if (seen.has(held.peg)) continue;
      seen.add(held.peg);
      pegs.push(held.peg);
      present.push(Object.freeze({
        peg: held.peg,
        iris: "Iris",
        kind: held.kind,
        look: 0,
        joule: null
      }));
    }
  }
  const meeting = pegs.length > 0;
  const mode = pegs.length === 1 ? "one" : (pegs.length > 1 ? "group" : null);
  return Object.freeze({
    meeting: meeting,
    mode: mode,
    group: mode === "group",
    pegs: Object.freeze(pegs.slice()),
    count: pegs.length,
    iris: meeting ? "Iris" : null,
    roles: meeting ? ROLES : Object.freeze([]),
    present: Object.freeze(present),
    excluded: Object.freeze(excluded),
    refused: Object.freeze(refused),
    writer: false,
    answer: meeting ? mode : null,
    dream: meeting ? dreamOf(input) : null,
    look: 0,
    joule: null,
    gate: "shut",
    open: false,
    minted: false,
    coin: null
  });
}
