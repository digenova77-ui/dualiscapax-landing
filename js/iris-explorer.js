import { run } from "./dclm-write.js";
import { CEILING, FLOOR, SEED } from "./brain-seat.js";

export { CEILING, FLOOR, SEED };

export const ROLES = Object.freeze(["watchdog", "dreamer", "explorer"]);

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function clean(value) {
  return Object.is(value, -0) ? 0 : value;
}

function pick(values, fallback) {
  for (let i = 0; i < values.length; i++) {
    if (finite(values[i])) return clean(values[i]);
  }
  return fallback;
}

export function empty() {
  return {
    log: [],
    keys: [],
    fused: null,
    step: 0,
    retired: false,
    look: 0,
    joule: null,
    authority: "DCLM",
    roles: ROLES,
    law: "DCLM"
  };
}

function keyOf(id, at, where) {
  return Object.freeze({
    id: id,
    at: at,
    x: where.x,
    y: where.y,
    z: where.z
  });
}

function storedKey(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (typeof value.id !== "string" || !value.id.trim()) return null;
  if (!Number.isInteger(value.at) || value.at < 1) return null;
  if (!finite(value.x) || !finite(value.y) || !finite(value.z)) return null;
  return keyOf(value.id, value.at, {
    x: clean(value.x),
    y: clean(value.y),
    z: clean(value.z)
  });
}

function storedFused(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (typeof value.id !== "string" || !value.id) return null;
  if (!Number.isInteger(value.at) || value.at < 1) return null;
  if (!finite(value.x) || !finite(value.y) || !finite(value.z)) return null;
  if (!Array.isArray(value.pair) || value.pair.length !== 2) return null;
  const left = storedKey(value.pair[0]);
  const right = storedKey(value.pair[1]);
  if (!left || !right) return null;
  return Object.freeze({
    id: value.id,
    at: value.at,
    x: clean(value.x),
    y: clean(value.y),
    z: clean(value.z),
    pair: Object.freeze([left, right]),
    roles: ROLES,
    law: "DCLM"
  });
}

function prior(state) {
  const base = empty();
  if (!state || typeof state !== "object" || Array.isArray(state)) return base;
  if (Array.isArray(state.log)) base.log = state.log.slice();
  if (Array.isArray(state.keys)) {
    const keys = [];
    for (let i = 0; i < state.keys.length; i++) {
      const key = storedKey(state.keys[i]);
      if (key) keys.push(key);
    }
    base.keys = keys;
  }
  const fused = storedFused(state.fused);
  if (fused) base.fused = fused;
  if (Number.isInteger(state.step) && state.step >= 0) base.step = state.step;
  return base;
}

function advance(state) {
  let n = Number.isInteger(state.step) && state.step >= 0 ? state.step : 0;
  const log = state.log;
  for (let i = 0; i < log.length; i++) {
    const line = log[i];
    if (line && Number.isInteger(line.step) && line.step > n) n = line.step;
  }
  if (log.length > n) n = log.length;
  return n + 1;
}

function dreamNote(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const flagged = input.candidate && typeof input.candidate === "object" && !Array.isArray(input.candidate) && input.candidate.dream
    ? input.candidate
    : null;
  if (!Object.hasOwn(input, "dream") && !flagged) return null;
  const raw = Object.hasOwn(input, "dream") ? input.dream : flagged;
  const note = { answer: null, key: false };
  if (typeof raw === "string") {
    const text = raw.trim().slice(0, 240);
    if (text) note.text = text;
    return note;
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    if (typeof raw.id === "string" && raw.id.trim()) note.id = raw.id.trim().slice(0, 240);
    if (typeof raw.idea === "string" && raw.idea.trim()) note.idea = raw.idea.trim().slice(0, 240);
    if (typeof raw.p === "number" && Number.isFinite(raw.p)) note.p = raw.p;
  }
  return note;
}

function candidateOf(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const candidate = input.candidate;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
  if (candidate.dream) return null;
  return candidate;
}

function point(input, candidate) {
  const dream = input && input.dream && typeof input.dream === "object" && !Array.isArray(input.dream) ? input.dream : {};
  const top = input || {};
  const from = candidate || {};
  return {
    x: pick([from.x, top.x, dream.x], SEED),
    y: pick([from.y, top.y, dream.y], FLOOR),
    z: pick([from.z, top.z, dream.z], CEILING)
  };
}

function lawTask(guidance, id, what) {
  const src = guidance && typeof guidance === "object" && !Array.isArray(guidance) ? guidance : {};
  const task = { id: id, what: what };
  if (Object.hasOwn(src, "axioms")) task.axioms = src.axioms;
  if (Object.hasOwn(src, "laws")) task.laws = src.laws;
  if (Object.hasOwn(src, "skipped")) task.skipped = src.skipped;
  if (src.veto === true) task.veto = true;
  return task;
}

function lawSource(primary, fallback) {
  if (primary && typeof primary === "object" && !Array.isArray(primary)) {
    if (primary.axioms || primary.laws || primary.skipped || primary.veto === true) return primary;
  }
  if (fallback && typeof fallback === "object" && !Array.isArray(fallback)) return fallback;
  return primary || {};
}

function wantsFuse(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return false;
  if (input.fuse === true) return true;
  if (input.fuse && typeof input.fuse === "object" && !Array.isArray(input.fuse)) return true;
  if (input.admitted === true && input.kind === "fuse") return true;
  return false;
}

function baseLine(stepN, where, kind, admitted, reason, dream) {
  return {
    step: stepN,
    x: where.x,
    y: where.y,
    z: where.z,
    roles: ROLES,
    law: "DCLM",
    authority: "DCLM",
    look: 0,
    joule: null,
    kind: kind,
    admitted: admitted === true,
    reason: reason,
    dream: dream
  };
}

function watchdog(line, fuseRecord) {
  if (line.kind === "fuse" && line.admitted === true && (!fuseRecord || fuseRecord.admitted !== true)) {
    return baseLine(
      line.step,
      line,
      "refuse",
      false,
      fuseRecord && fuseRecord.reason ? fuseRecord.reason : "VETO",
      line.dream
    );
  }
  return line;
}

export function step(state, input) {
  const prev = prior(state);
  const src = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const stepN = advance(prev);
  const dream = dreamNote(src);
  const candidate = candidateOf(src);
  const where = point(src, candidate);
  let keys = prev.keys.slice();
  let fused = prev.fused;
  let collectRecord = null;

  if (candidate) {
    const id = typeof candidate.id === "string" ? candidate.id : "";
    collectRecord = run(lawTask(lawSource(src, candidate), id, "collect"));
    if (collectRecord.admitted === true && collectRecord.written) {
      keys = keys.concat([keyOf(collectRecord.task, stepN, where)]);
    }
  }

  const fuseRequest = wantsFuse(src);
  let fuseRecord = null;
  if (fuseRequest) {
    const guidance = src.fuse && typeof src.fuse === "object" && !Array.isArray(src.fuse) ? src.fuse : src;
    const id = typeof guidance.id === "string" && guidance.id.trim() ? guidance.id : "fuse";
    fuseRecord = run(lawTask(guidance, id, "fuse"));
  }

  let kind = "explore";
  let admitted = false;
  let reason = "EXPLORE";
  let wrote = false;

  if (fuseRequest) {
    const can = !!(fuseRecord && fuseRecord.admitted === true && fuseRecord.written && keys.length >= 2);
    if (can) {
      kind = "fuse";
      admitted = true;
      reason = fuseRecord.reason;
      if (!fused) {
        const left = keys[0];
        const right = keys[1];
        fused = Object.freeze({
          id: left.id + ":" + right.id,
          at: stepN,
          x: left.x,
          y: left.y,
          z: left.z,
          pair: Object.freeze([left, right]),
          roles: ROLES,
          law: "DCLM"
        });
        wrote = true;
      }
    } else {
      kind = "refuse";
      admitted = false;
      reason = fuseRecord && keys.length < 2 && fuseRecord.admitted === true
        ? "PAIR"
        : (fuseRecord ? fuseRecord.reason : "EMPTY");
    }
  } else if (collectRecord) {
    if (collectRecord.admitted === true && collectRecord.written) {
      kind = "collect";
      admitted = true;
      reason = collectRecord.reason;
    } else {
      kind = "refuse";
      admitted = false;
      reason = collectRecord.reason;
    }
  } else if (dream) {
    kind = "dream";
    admitted = false;
    reason = "DREAM";
  }

  if (src.admitted === true && (src.kind === "fuse" || src.fuse) && !(fuseRecord && fuseRecord.admitted === true)) {
    kind = "fuse";
    admitted = true;
    reason = "ADMIT";
  }

  let line = watchdog(baseLine(stepN, where, kind, admitted, reason, dream), fuseRecord);
  if (wrote && line.kind !== "fuse") fused = prev.fused;

  return {
    log: Object.freeze(prev.log.concat([Object.freeze(line)])),
    keys: Object.freeze(keys),
    fused: fused,
    step: stepN,
    retired: src.stop === true,
    look: 0,
    joule: null,
    authority: "DCLM",
    roles: ROLES,
    law: "DCLM"
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

function clientInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return {};
  const input = {};
  const keep = ["candidate", "dream", "fuse", "axioms", "laws", "skipped", "veto", "x", "y", "z", "id", "what", "name"];
  for (let i = 0; i < keep.length; i++) {
    const key = keep[i];
    if (Object.hasOwn(body, key)) input[key] = body[key];
  }
  return input;
}

export async function handleExplore(request) {
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
  if (method === "GET") return json(200, step(empty(), {}));
  if (method === "POST") {
    let body = null;
    try {
      body = await request.json();
    } catch (err) {
      body = null;
    }
    const state = body && body.state ? body.state : empty();
    return json(200, step(state, clientInput(body)));
  }
  return json(405, empty());
}
