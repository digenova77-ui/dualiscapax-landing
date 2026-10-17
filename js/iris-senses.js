import { pegOf } from "./unity-wallet.js";

export const SENSES = Object.freeze([
  "microphone",
  "front",
  "rear",
  "screen",
  "gyroscope",
  "motion",
  "orientation",
  "place"
]);

export const LABELS = Object.freeze({
  microphone: "Microphone",
  front: "Front camera",
  rear: "Rear camera",
  screen: "Screen",
  gyroscope: "Gyroscope",
  motion: "Motion",
  orientation: "Orientation",
  place: "Place"
});

export const RINGS = Object.freeze(["iris", "cosmos", "arc"]);

export const IDEMPOTENT = "Iris runs with the operating system, idempotently: asking twice does not double-open a sense, and off means off.";

export const DEFAULT_ON = "When you sign the Unity agreement, every sense preference turns on. The operating system still has to grant each live sense. A preference can be on while the live grant is still pending.";

export const RING_RULE = "A friend joins a ring only with their own Unity ID. One ID each. A missing ID is not on the ring. A duplicate body is refused. A ring grants shared access to the senses the host has turned on. A friend does not gain a sense the host turned off. Leaving the ring removes that friend. The host can close the ring.";

export const SPATIAL = "A spatial session is a meeting plus these sense preferences.";

export const EXAMPLES = Object.freeze([
  "You sit with Iris on the teal ring. Your microphone preference is on, and the two of you talk. No friend is on the ring.",
  "Three people sit on the cosmos ring. Each one brought their own Unity ID. They share only the senses the host left on.",
  "You turn the front camera on. That is one open. Asking again does not open a second camera. The operating system still has to grant it.",
  "You turn the microphone off. Iris stops using it. The front camera and the other senses stay as they were. Off means off.",
  "Ada joins the outer arc with her own Unity ID. She receives the senses you left on. She does not receive a sense you turned off. When she leaves, she is off the ring."
]);

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function idOf(src) {
  if (!src || typeof src !== "object") return "";
  return text(src.unityId) || text(src.id) || text(src.identification);
}

function shell(extra) {
  return {
    ...(extra || {}),
    look: 0,
    joule: null,
    gate: "shut",
    open: false,
    minted: false,
    coin: null,
    media: null,
    stored: false,
    writer: false
  };
}

function blank() {
  return { preference: false, live: "off", opens: 0, requested: false };
}

async function loadMeet() {
  try {
    const mod = await import("./iris-meeting.js");
    if (mod && typeof mod.meet === "function") return mod.meet;
  } catch (err) {
    return null;
  }
  return null;
}

export function open() {
  const pref = {};
  for (let i = 0; i < SENSES.length; i++) pref[SENSES[i]] = blank();
  let signed = false;
  let host = null;
  let ring = null;
  let meeting = null;
  const friends = new Map();

  function onSenses() {
    const names = [];
    for (let i = 0; i < SENSES.length; i++) {
      if (pref[SENSES[i]].preference === true) names.push(SENSES[i]);
    }
    return names;
  }

  function snapshot(name, same) {
    const row = pref[name] || blank();
    return shell({
      sense: name,
      preference: row.preference === true,
      live: row.live,
      opens: row.opens,
      requested: row.requested === true,
      same: same === true
    });
  }

  function modeOf() {
    if (!signed) return null;
    if (friends.size > 0) return "group";
    if (meeting && meeting.mode) return meeting.mode;
    return "one";
  }

  function view() {
    const senses = {};
    for (let i = 0; i < SENSES.length; i++) senses[SENSES[i]] = snapshot(SENSES[i], false);
    const shared = onSenses();
    const people = [];
    for (const friend of friends.values()) {
      people.push(shell({
        peg: friend.peg,
        body: friend.body,
        ring: ring,
        senses: shared.slice()
      }));
    }
    return shell({
      signed: signed,
      spatial: signed,
      peg: host ? host.peg : null,
      iris: signed ? "Iris" : null,
      ring: ring,
      ringOpen: ring !== null,
      mode: modeOf(),
      meeting: meeting,
      senses: senses,
      friends: people
    });
  }

  async function sign(input) {
    const src = input && typeof input === "object" && !Array.isArray(input) ? input : {};
    if (signed) return view();
    if (src.agree !== true) {
      return shell({ signed: false, spatial: false, peg: null, iris: null, reason: "unsigned", meeting: null, ring: null, ringOpen: false, mode: null });
    }
    const id = idOf(src);
    if (!id) {
      return shell({ signed: false, spatial: false, peg: null, iris: null, reason: "absent", meeting: null, ring: null, ringOpen: false, mode: null });
    }
    const mark = await pegOf(id);
    if (!mark) {
      return shell({ signed: false, spatial: false, peg: null, iris: null, reason: "absent", meeting: null, ring: null, ringOpen: false, mode: null });
    }
    const body = text(src.body) || mark;
    signed = true;
    host = { peg: mark, body: body };
    for (let i = 0; i < SENSES.length; i++) {
      pref[SENSES[i]] = { preference: true, live: "pending", opens: 0, requested: false };
    }
    const meet = await loadMeet();
    if (meet) {
      try {
        const held = await meet({ kind: text(src.kind) || "human", body: body, id: id });
        meeting = held && held.meeting === true ? held : null;
      } catch (err) {
        meeting = null;
      }
    }
    return view();
  }

  function set(name, on) {
    if (!SENSES.includes(name)) {
      return shell({ sense: name, preference: false, live: "off", opens: 0, requested: false, same: false, reason: "absent" });
    }
    if (!signed) return snapshot(name, false);
    const row = pref[name];
    const next = on === true;
    if (row.preference === next) return snapshot(name, false);
    if (!next) {
      row.preference = false;
      row.live = "off";
      row.opens = 0;
      row.requested = false;
      return snapshot(name, false);
    }
    row.preference = true;
    row.live = "pending";
    row.opens = 0;
    row.requested = false;
    return snapshot(name, false);
  }

  function ask(name) {
    if (!SENSES.includes(name)) {
      return shell({ sense: name, preference: false, live: "off", opens: 0, requested: false, same: false, reason: "absent" });
    }
    const row = pref[name];
    if (!signed || row.preference !== true) return snapshot(name, false);
    if (row.live === "granted" && row.opens === 1) return snapshot(name, true);
    row.requested = true;
    row.live = "pending";
    return snapshot(name, false);
  }

  function grant(name, allowed) {
    if (!SENSES.includes(name)) {
      return shell({ sense: name, preference: false, live: "off", opens: 0, requested: false, same: false, reason: "absent" });
    }
    const row = pref[name];
    if (!signed || row.preference !== true || row.requested !== true) return snapshot(name, false);
    if (allowed === true) {
      const again = row.live === "granted" && row.opens === 1;
      row.live = "granted";
      row.opens = 1;
      return snapshot(name, again);
    }
    row.live = "denied";
    row.opens = 0;
    return snapshot(name, false);
  }

  function seat(name) {
    if (!signed) return shell({ ring: null, ringOpen: false, reason: "unsigned" });
    if (!RINGS.includes(name)) return shell({ ring: ring, ringOpen: ring !== null, reason: "absent" });
    ring = name;
    return shell({ ring: ring, ringOpen: true, reason: "one" });
  }

  function close() {
    ring = null;
    friends.clear();
    return shell({ ring: null, ringOpen: false, friends: [] });
  }

  async function join(input) {
    const src = input && typeof input === "object" && !Array.isArray(input) ? input : {};
    if (!signed || ring === null) {
      return shell({ joined: false, reason: "closed", peg: null, senses: [] });
    }
    const id = idOf(src);
    if (!id) return shell({ joined: false, reason: "absent", peg: null, senses: [] });
    const mark = await pegOf(id);
    if (!mark) return shell({ joined: false, reason: "absent", peg: null, senses: [] });
    const body = text(src.body) || mark;
    if (host && (mark === host.peg || body === host.body)) {
      return shell({ joined: false, reason: "duplicate", peg: null, senses: [] });
    }
    if (friends.has(mark)) return shell({ joined: false, reason: "duplicate", peg: null, senses: [] });
    for (const friend of friends.values()) {
      if (friend.body === body) return shell({ joined: false, reason: "duplicate", peg: null, senses: [] });
    }
    friends.set(mark, { peg: mark, body: body });
    return shell({
      joined: true,
      reason: "one",
      peg: mark,
      body: body,
      ring: ring,
      senses: onSenses().slice()
    });
  }

  async function leave(input) {
    const src = input && typeof input === "object" && !Array.isArray(input) ? input : {};
    const id = idOf(src);
    const body = text(src.body);
    let mark = id ? await pegOf(id) : null;
    if (!mark && body) {
      for (const friend of friends.values()) {
        if (friend.body === body) mark = friend.peg;
      }
    }
    if (!mark || !friends.has(mark)) return shell({ left: false, reason: "absent", peg: null });
    friends.delete(mark);
    return shell({ left: true, reason: "one", peg: mark });
  }

  function memory() {
    const rows = [];
    if (host) {
      rows.push(Object.freeze(shell({ peg: host.peg, iris: "Iris" })));
    }
    for (const friend of friends.values()) {
      rows.push(Object.freeze(shell({ peg: friend.peg, iris: "Iris" })));
    }
    return Object.freeze(rows);
  }

  function media() {
    return null;
  }

  return {
    sign: sign,
    set: set,
    ask: ask,
    grant: grant,
    seat: seat,
    close: close,
    join: join,
    leave: leave,
    view: view,
    memory: memory,
    media: media
  };
}
