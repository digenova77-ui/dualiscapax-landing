import { run } from "./dclm-write.js";

const HOLD = Object.freeze({
  NO_FORCE: true,
  HOST_SAFE: true,
  CLEANUP_FIRST: true,
  TRUTH_OR_NOTHING: true
});

export const PIECES = Object.freeze([
  Object.freeze({
    id: "rings",
    what: "The three rings passed the vote. Iris is the teal light.",
    axioms: HOLD
  }),
  Object.freeze({
    id: "field-canvas",
    what: "A field canvas.",
    axioms: Object.freeze({
      NO_FORCE: true,
      HOST_SAFE: false,
      CLEANUP_FIRST: true,
      TRUTH_OR_NOTHING: true
    })
  }),
  Object.freeze({
    id: "quark-canvas",
    what: "A quark canvas.",
    skipped: Object.freeze(["CLEANUP_FIRST"]),
    axioms: HOLD
  }),
  Object.freeze({
    id: "goggles",
    what: "Goggles.",
    veto: true,
    axioms: HOLD
  }),
  Object.freeze({
    id: "skin",
    what: "A second skin.",
    axioms: Object.freeze({
      NO_FORCE: true,
      HOST_SAFE: true,
      CLEANUP_FIRST: true,
      TRUTH_OR_NOTHING: false
    })
  }),
  Object.freeze({
    id: "scaffold",
    what: "Scaffolding.",
    axioms: Object.freeze({
      NO_FORCE: true,
      HOST_SAFE: true,
      TRUTH_OR_NOTHING: true
    })
  })
]);

function pieceById(id) {
  for (let i = 0; i < PIECES.length; i++) {
    if (PIECES[i].id === id) return PIECES[i];
  }
  return null;
}

function taskOf(piece) {
  if (!piece || typeof piece !== "object") return null;
  const task = {
    id: typeof piece.id === "string" ? piece.id : "",
    what: typeof piece.what === "string" ? piece.what : "",
    axioms: piece.axioms && typeof piece.axioms === "object" ? piece.axioms : {}
  };
  if (piece.veto === true) task.veto = true;
  if (Array.isArray(piece.skipped) && piece.skipped.length) task.skipped = piece.skipped.slice();
  return task;
}

function lineOf(vote, what) {
  return {
    task: vote.task,
    admitted: vote.admitted === true,
    reason: vote.reason,
    authority: "DCLM",
    shown: vote.admitted === true,
    what: vote.admitted === true ? what : "",
    look: 0,
    joule: null
  };
}

function cleanLine(line) {
  if (!line || typeof line !== "object") {
    return {
      task: "",
      admitted: false,
      reason: "",
      authority: "DCLM",
      shown: false,
      what: "",
      look: 0,
      joule: null
    };
  }
  const admitted = line.admitted === true && line.reason === "ADMIT";
  return {
    task: typeof line.task === "string" ? line.task : "",
    admitted: admitted,
    reason: typeof line.reason === "string" ? line.reason : "",
    authority: "DCLM",
    shown: admitted && line.shown === true,
    what: admitted && typeof line.what === "string" ? line.what : "",
    look: 0,
    joule: null
  };
}

function shownFrom(log) {
  const shown = [];
  for (let i = 0; i < log.length; i++) {
    const line = log[i];
    if (line.admitted === true && line.shown === true) {
      shown.push({ id: line.task, what: line.what });
    }
  }
  return shown;
}

export function begin() {
  return {
    pending: PIECES.map(function (piece) { return piece.id; }),
    shown: [],
    log: [],
    retired: false,
    stop: false,
    look: 0,
    joule: null
  };
}

function normalize(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) return begin();
  const pending = Array.isArray(state.pending)
    ? state.pending.filter(function (id) { return typeof id === "string"; })
    : [];
  const log = Array.isArray(state.log) ? state.log.map(cleanLine) : [];
  return {
    pending: pending,
    shown: shownFrom(log),
    log: log,
    retired: false,
    stop: false,
    look: 0,
    joule: null
  };
}

export function votePiece(piece) {
  const vote = run(taskOf(piece));
  const what = vote.written ? vote.written.what : null;
  return {
    id: vote.task,
    admitted: vote.admitted === true,
    reason: vote.reason,
    authority: "DCLM",
    shown: vote.admitted === true,
    what: vote.admitted === true ? what : null,
    look: 0,
    joule: null
  };
}

export function voteAll() {
  const rows = [];
  for (let i = 0; i < PIECES.length; i++) rows.push(votePiece(PIECES[i]));
  return rows;
}

export function step(state, host) {
  const prior = normalize(state);
  const hidden = !!(host && typeof host === "object" && host.hidden === true);
  if (hidden) {
    return {
      pending: prior.pending.slice(),
      shown: prior.shown.map(function (item) { return { id: item.id, what: item.what }; }),
      log: prior.log.slice(),
      retired: false,
      stop: false,
      look: 0,
      joule: null
    };
  }
  const pending = prior.pending.slice();
  const id = pending.length ? pending.shift() : "";
  const piece = pieceById(id);
  const vote = run(piece ? taskOf(piece) : null);
  const what = vote.written ? vote.written.what : "";
  const log = prior.log.concat([lineOf(vote, what)]);
  return {
    pending: pending,
    shown: shownFrom(log),
    log: log,
    retired: false,
    stop: false,
    look: 0,
    joule: null
  };
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*"
    }
  });
}

export async function handleWork(request) {
  const method = request && request.method;
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "Content-Type",
        "access-control-max-age": "86400"
      }
    });
  }
  if (method === "GET") return json(200, step(begin(), {}));
  if (method === "POST") {
    let body = null;
    try {
      body = await request.json();
    } catch (err) {
      body = null;
    }
    const state = body && body.state ? body.state : begin();
    return json(200, step(state, {}));
  }
  return json(405, {
    admitted: false,
    reason: "method",
    retired: false,
    stop: false,
    shown: [],
    log: [],
    pending: [],
    look: 0,
    joule: null
  });
}
