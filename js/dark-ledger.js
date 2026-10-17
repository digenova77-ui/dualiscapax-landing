import { run } from "./dclm-write.js";
import { pegOf, record } from "./unity-wallet.js";

export const SENTENCES = Object.freeze([
  "Iris shows your dark ledger only when you ask.",
  "A give and a gain are audited, and nothing is taken that was not given."
]);

const HOLD = Object.freeze({
  NO_FORCE: true,
  HOST_SAFE: true,
  CLEANUP_FIRST: true,
  TRUTH_OR_NOTHING: true
});

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function asObject(value) {
  if (typeof value === "string") return { id: value };
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function addId(found, value) {
  if (typeof value !== "string") return;
  const trimmed = value.trim();
  if (!trimmed || found.indexOf(trimmed) !== -1) return;
  found.push(trimmed);
}

function idsFrom(src) {
  const found = [];
  addId(found, src.id);
  addId(found, src.unityId);
  addId(found, src.identification);
  addId(found, src.secondId);
  addId(found, src.second);
  if (Array.isArray(src.ids)) {
    for (let i = 0; i < src.ids.length; i++) addId(found, src.ids[i]);
  }
  if (Array.isArray(src.unityIds)) {
    for (let i = 0; i < src.unityIds.length; i++) addId(found, src.unityIds[i]);
  }
  return found;
}

function partyOf(value) {
  const src = asObject(value);
  const ids = idsFrom(src);
  return {
    id: ids[0] || "",
    body: text(src.body),
    extras: ids.slice(1)
  };
}

function roleParty(src, role) {
  if (Object.hasOwn(src, role) && src[role] != null && src[role] !== "") return partyOf(src[role]);
  const flat = {};
  if (typeof src[role + "Id"] === "string") flat.id = src[role + "Id"];
  if (typeof src[role + "Body"] === "string") flat.body = src[role + "Body"];
  if (typeof src[role + "Second"] === "string") flat.secondId = src[role + "Second"];
  if (typeof src[role + "SecondId"] === "string") flat.second = src[role + "SecondId"];
  return partyOf(flat);
}

function viewerParty(src) {
  if (src.viewer != null || src.owner != null || src.self != null) {
    return partyOf(src.viewer != null ? src.viewer : (src.owner != null ? src.owner : src.self));
  }
  return partyOf(src);
}

function otherParty(src, selfId) {
  const named = src.whose != null ? src.whose : (src.subject != null ? src.subject : (src.other != null ? src.other : src.theirs));
  if (named == null || named === true || named === false) return null;
  const party = partyOf(named);
  if (!party.id || party.id === selfId) return null;
  return party;
}

function axiomsOf(input) {
  if (!input || typeof input !== "object") return HOLD;
  const src = input.axioms && typeof input.axioms === "object" && !Array.isArray(input.axioms)
    ? input.axioms
    : input.laws;
  if (!src || typeof src !== "object" || Array.isArray(src)) return HOLD;
  return src;
}

function taskOf(input, name) {
  const task = {
    id: name,
    what: name,
    axioms: axiomsOf(input)
  };
  if (input && input.veto === true) task.veto = true;
  if (input && Array.isArray(input.skipped)) task.skipped = input.skipped.slice();
  return task;
}

function quiet(fields) {
  const out = {};
  const names = Object.keys(fields);
  for (let i = 0; i < names.length; i++) out[names[i]] = fields[names[i]];
  out.look = 0;
  out.joule = null;
  return Object.freeze(out);
}

function pairOf(giver, receiver) {
  return giver + ":" + receiver;
}

export function open() {
  const bodies = new Map();
  const gifts = new Set();
  const book = [];

  function audit() {
    const copy = [];
    for (let i = 0; i < book.length; i++) copy.push(book[i]);
    return Object.freeze(copy);
  }

  function append(act, giver, receiver) {
    const row = Object.freeze({
      step: book.length + 1,
      giver: giver,
      receiver: receiver,
      act: act,
      look: 0,
      joule: null
    });
    book.push(row);
    return row;
  }

  async function resolve(party) {
    if (party.extras.length) return { ok: false, reason: "second", peg: null, slot: "" };
    if (!party.id) return { ok: false, reason: "absent", peg: null, slot: "" };
    const peg = await pegOf(party.id);
    if (!peg) return { ok: false, reason: "absent", peg: null, slot: "" };
    const slot = party.body || peg;
    const held = bodies.get(slot);
    if (held && held !== peg) return { ok: false, reason: "second", peg: null, slot: "" };
    for (const [name, mark] of bodies) {
      if (name !== slot && mark === peg) return { ok: false, reason: "second", peg: null, slot: "" };
    }
    return { ok: true, reason: "one", peg: peg, slot: slot };
  }

  function seat(resolved) {
    if (!resolved.ok) return;
    bodies.set(resolved.slot, resolved.peg);
  }

  function refused(reason) {
    return quiet({
      given: false,
      gained: false,
      reason: reason,
      right: false,
      ledger: null,
      audit: null,
      written: null
    });
  }

  async function sides(src) {
    const giver = roleParty(src, "giver");
    const receiver = roleParty(src, "receiver");
    const left = await resolve(giver);
    if (!left.ok) return { ok: false, reason: left.reason };
    const right = await resolve(receiver);
    if (!right.ok) return { ok: false, reason: right.reason };
    if (left.slot === right.slot && left.peg !== right.peg) return { ok: false, reason: "second" };
    return { ok: true, left: left, right: right };
  }

  async function give(input) {
    const src = input && typeof input === "object" && !Array.isArray(input) ? input : {};
    const found = await sides(src);
    if (!found.ok) return refused(found.reason);
    const admitted = run(taskOf(src, "give"));
    if (admitted.admitted !== true) return refused(admitted.reason);
    seat(found.left);
    seat(found.right);
    gifts.add(pairOf(found.left.peg, found.right.peg));
    const row = append("give", found.left.peg, found.right.peg);
    return quiet({
      given: true,
      gained: false,
      reason: "given",
      right: true,
      ledger: null,
      audit: row,
      written: null
    });
  }

  async function gain(input) {
    const src = input && typeof input === "object" && !Array.isArray(input) ? input : {};
    const found = await sides(src);
    if (!found.ok) return refused(found.reason);
    if (!gifts.has(pairOf(found.left.peg, found.right.peg))) return refused("ungiven");
    const admitted = run(taskOf(src, "gain"));
    if (admitted.admitted !== true) return refused(admitted.reason);
    seat(found.left);
    seat(found.right);
    const row = append("gain", found.left.peg, found.right.peg);
    return quiet({
      given: false,
      gained: true,
      reason: "given",
      right: true,
      ledger: null,
      audit: row,
      written: null
    });
  }

  function askedFor(src, explicit) {
    if (explicit === true) return true;
    if (src.asked === true) return true;
    if (src.ask === true) return true;
    if (src.explicit === true) return true;
    return false;
  }

  async function screen(input, explicit) {
    const src = input && typeof input === "object" && !Array.isArray(input) ? input : {};
    if (!askedFor(src, explicit)) {
      return quiet({ asked: false, ledger: null });
    }
    const viewer = viewerParty(src);
    const self = await resolve(viewer);
    if (!self.ok) {
      return quiet({
        asked: true,
        own: false,
        ledger: null,
        reason: self.reason,
        written: null
      });
    }
    const other = otherParty(src, viewer.id);
    if (other) {
      const them = await resolve(other);
      const right = them.ok === true && gifts.has(pairOf(them.peg, self.peg));
      return quiet({
        asked: true,
        own: false,
        right: right,
        ledger: null
      });
    }
    const admitted = run(taskOf(src, "ask"));
    if (admitted.admitted !== true) {
      return quiet({
        asked: true,
        own: false,
        ledger: null,
        reason: admitted.reason,
        written: null
      });
    }
    seat(self);
    const seal = await record(viewer.id);
    append("ask", self.peg, self.peg);
    return quiet({
      asked: true,
      own: true,
      ledger: null,
      seal: seal
    });
  }

  function ask(input) {
    return screen(input, true);
  }

  return Object.freeze({
    give: give,
    gain: gain,
    screen: screen,
    ask: ask,
    audit: audit,
    sentences: SENTENCES
  });
}
