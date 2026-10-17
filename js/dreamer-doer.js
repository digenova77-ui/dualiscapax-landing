import { RING, invert2, seats } from "./iris-attack.js";
import { LAWS, run } from "./dclm-write.js";

export { RING };

function text(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 240) : "";
}

function clean(value) {
  return Object.is(value, -0) ? 0 : value;
}

function probability(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) return null;
  return clean(value);
}

function jobOf(seed) {
  if (!seed || typeof seed !== "object" || Array.isArray(seed)) return null;
  if (!seed.job || typeof seed.job !== "object" || Array.isArray(seed.job)) return null;
  return seed.job;
}

function rawAxioms(seed) {
  if (!seed || typeof seed !== "object") return {};
  if (seed.axioms && typeof seed.axioms === "object" && !Array.isArray(seed.axioms)) return seed.axioms;
  if (seed.laws && typeof seed.laws === "object" && !Array.isArray(seed.laws)) return seed.laws;
  const job = jobOf(seed);
  if (!job) return {};
  if (job.axioms && typeof job.axioms === "object" && !Array.isArray(job.axioms)) return job.axioms;
  if (job.laws && typeof job.laws === "object" && !Array.isArray(job.laws)) return job.laws;
  return {};
}

function axiomsOf(seed) {
  const raw = rawAxioms(seed);
  const out = {};
  for (let i = 0; i < LAWS.length; i++) {
    const law = LAWS[i];
    if (raw[law] === true) out[law] = true;
    else if (raw[law] === false) out[law] = false;
  }
  return out;
}

function skippedOf(seed) {
  const job = jobOf(seed);
  const raw = seed && Array.isArray(seed.skipped) ? seed.skipped : (job && Array.isArray(job.skipped) ? job.skipped : []);
  return LAWS.filter(function (law) { return raw.indexOf(law) !== -1; });
}

function vetoOf(seed) {
  if (seed && seed.veto === true) return true;
  const job = jobOf(seed);
  return !!(job && job.veto === true);
}

function matrixOf(seed) {
  const job = jobOf(seed);
  const raw = seed && Array.isArray(seed.matrix) ? seed.matrix : (job && Array.isArray(job.matrix) ? job.matrix : null);
  if (!raw || raw.length !== 4) return null;
  const out = [];
  for (let i = 0; i < 4; i++) {
    const n = raw[i];
    if (typeof n !== "number" || !Number.isFinite(n)) return null;
    out.push(clean(n));
  }
  return out;
}

function idOf(seed, dreamer, idea) {
  const job = jobOf(seed);
  const named = text(seed && seed.id) || text(seed && seed.name) || (job ? (text(job.id) || text(job.name)) : "");
  if (named) return named;
  if (dreamer && idea) return dreamer + ":" + idea;
  return idea || dreamer || "";
}

function ideaOf(seed) {
  const job = jobOf(seed);
  return text(seed && seed.idea) || text(seed && seed.what) || (job ? (text(job.idea) || text(job.what)) : "");
}

function dreamerOf(seed, seated) {
  if (RING.indexOf(seated) !== -1) return seated;
  if (seed && RING.indexOf(seed.dreamer) !== -1) return seed.dreamer;
  return "";
}

function freeze(seed, seated) {
  const src = seed && typeof seed === "object" && !Array.isArray(seed) ? seed : {};
  const dreamer = dreamerOf(src, seated);
  const idea = ideaOf(src);
  return {
    dreamer: dreamer,
    id: idOf(src, dreamer, idea),
    idea: idea,
    p: probability(src.p),
    axioms: axiomsOf(src),
    veto: vetoOf(src),
    skipped: skippedOf(src),
    matrix: matrixOf(src)
  };
}

function publicSeed(frozen) {
  return {
    dreamer: frozen.dreamer,
    id: frozen.id,
    idea: frozen.idea,
    p: frozen.p,
    axioms: frozen.axioms,
    veto: frozen.veto,
    skipped: frozen.skipped.slice(),
    matrix: frozen.matrix ? frozen.matrix.slice() : null
  };
}

function seatSeeds(turn, seeds) {
  const order = seats(turn);
  const named = new Map();
  const loose = [];
  const refused = [];
  const list = Array.isArray(seeds) ? seeds : [];
  for (let i = 0; i < list.length; i++) {
    const seed = list[i];
    if (!seed || typeof seed !== "object" || Array.isArray(seed)) continue;
    if (seed.dreamer) {
      if (RING.indexOf(seed.dreamer) === -1) refused.push(String(seed.dreamer));
      else if (!named.has(seed.dreamer)) named.set(seed.dreamer, seed);
      continue;
    }
    loose.push(seed);
  }
  let looseAt = 0;
  const seated = order.map(function (name) {
    if (named.has(name)) return { dreamer: name, seed: named.get(name) };
    if (looseAt < loose.length) return { dreamer: name, seed: loose[looseAt++] };
    return { dreamer: name, seed: null };
  });
  return { seated: seated, refused: refused, onDuty: order[0] };
}

function unknownOf(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  const seen = new Set();
  for (let i = 0; i < value.length; i++) {
    const row = value[i];
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const id = text(row.id);
    if (!id || seen.has(id)) continue;
    if (RING.indexOf(row.dreamer) === -1) continue;
    seen.add(id);
    out.push(Object.freeze({
      dreamer: row.dreamer,
      id: id,
      idea: text(row.idea),
      reason: text(row.reason),
      divided: row.divided === true,
      passed: false,
      look: 0,
      joule: null
    }));
  }
  return out;
}

function pegOf(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (value.passed !== true) return null;
  if (RING.indexOf(value.dreamer) === -1) return null;
  const id = text(value.id);
  const idea = text(value.idea || value.what);
  const written = value.written;
  if (!id || !idea || !written || typeof written !== "object") return null;
  if (written.task !== id || written.what !== idea) return null;
  return Object.freeze({
    dreamer: value.dreamer,
    id: id,
    idea: idea,
    what: idea,
    written: Object.freeze({ task: id, what: idea }),
    passed: true,
    look: 0,
    joule: null
  });
}

function remember(state) {
  const src = state && typeof state === "object" && !Array.isArray(state) ? state : {};
  return {
    peg: pegOf(src.peg),
    unknown: unknownOf(src.unknown),
    turn: Number.isInteger(src.turn) ? src.turn : 0,
    seeds: Array.isArray(src.seeds) ? src.seeds : []
  };
}

const DROP = {
  key: true,
  keys: true,
  secret: true,
  password: true,
  identification: true,
  unityId: true,
  vote: true,
  votes: true,
  queue: true,
  pending: true,
  waiting: true,
  residue: true,
  framework: true,
  canvas: true,
  theater: true,
  dna: true,
  helix: true,
  microsurgery: true,
  comment: true,
  rem: true,
  look: true,
  joule: true,
  stop: true,
  retired: true
};

function cleanSeed(seed) {
  if (!seed || typeof seed !== "object" || Array.isArray(seed)) return null;
  const out = {};
  const names = Object.keys(seed);
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (DROP[name]) continue;
    if (name === "job" && seed.job && typeof seed.job === "object" && !Array.isArray(seed.job)) {
      const job = {};
      const jobNames = Object.keys(seed.job);
      for (let j = 0; j < jobNames.length; j++) {
        if (DROP[jobNames[j]]) continue;
        job[jobNames[j]] = seed.job[jobNames[j]];
      }
      out.job = job;
      continue;
    }
    out[name] = seed[name];
  }
  return out;
}

function cleanup(state) {
  const src = state && typeof state === "object" && !Array.isArray(state) ? state : {};
  const seeds = [];
  if (Array.isArray(src.seeds)) {
    for (let i = 0; i < src.seeds.length; i++) {
      const seed = cleanSeed(src.seeds[i]);
      if (seed) seeds.push(seed);
    }
  }
  return {
    peg: src.peg,
    unknown: src.unknown,
    turn: src.turn,
    seeds: seeds
  };
}

function hostStops(host) {
  return !!(host && typeof host === "object" && host.stop === true);
}

export function propose(input) {
  const src = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const turn = Number.isInteger(src.turn) ? src.turn : 0;
  const blocked = new Set();
  const unknown = unknownOf(src.unknown);
  for (let i = 0; i < unknown.length; i++) blocked.add(unknown[i].id);
  const laid = seatSeeds(turn, src.seeds);
  for (let i = 0; i < laid.seated.length; i++) {
    const seat = laid.seated[i];
    if (!seat.seed) continue;
    const frozen = freeze(seat.seed, seat.dreamer);
    if (!frozen.id || blocked.has(frozen.id)) continue;
    return {
      dreamer: seat.dreamer,
      turn: turn,
      refused: laid.refused.slice(),
      seed: publicSeed(frozen)
    };
  }
  return {
    dreamer: laid.onDuty,
    turn: turn,
    refused: laid.refused.slice(),
    seed: null
  };
}

export function implement(seed) {
  const frozen = freeze(seed, seed && seed.dreamer);
  const axioms = axiomsOf(frozen);
  const task = {
    id: frozen.id,
    what: frozen.idea,
    axioms: axioms
  };
  if (frozen.veto) task.veto = true;
  if (frozen.skipped.length) task.skipped = frozen.skipped.slice();
  const matrix = frozen.matrix ? frozen.matrix.slice() : null;
  return {
    dreamer: frozen.dreamer,
    id: frozen.id,
    idea: frozen.idea,
    p: frozen.p,
    matrix: matrix,
    inverse: matrix ? invert2(matrix) : null,
    task: task
  };
}

function appendUnknown(list, mark) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === mark.id) return list.slice();
  }
  return list.concat([mark]);
}

function view(memory, fields) {
  return {
    dreamer: fields.dreamer || null,
    seed: fields.seed || null,
    implementation: fields.implementation || null,
    written: fields.written || null,
    admitted: fields.admitted === true,
    reason: fields.reason || "",
    authority: "DCLM",
    write: fields.write || null,
    audit: fields.audit || null,
    peg: memory.peg,
    unknown: memory.unknown,
    offered: fields.offered || [],
    recalled: fields.recalled === true,
    refused: fields.refused ? fields.refused.slice() : [],
    retired: fields.retired === true,
    stop: fields.stop === true,
    turn: memory.turn,
    order: Array.isArray(fields.order) ? fields.order.slice() : [],
    look: 0,
    joule: null
  };
}

export function step(state, host) {
  const order = ["cleanup"];
  const memory = remember(cleanup(state));
  if (hostStops(host)) {
    return view(memory, {
      dreamer: memory.peg ? memory.peg.dreamer : null,
      written: null,
      admitted: false,
      reason: "HOST STOP",
      offered: memory.peg ? [memory.peg] : [],
      recalled: false,
      retired: true,
      stop: true,
      order: order
    });
  }
  if (memory.peg) {
    order.push("recall");
    return view(memory, {
      dreamer: memory.peg.dreamer,
      written: memory.peg.written,
      admitted: false,
      reason: "RECALL",
      offered: [memory.peg],
      recalled: true,
      retired: false,
      stop: false,
      order: order
    });
  }
  order.push("seed");
  const proposal = propose({
    turn: memory.turn,
    seeds: memory.seeds,
    unknown: memory.unknown
  });
  const advanced = {
    peg: null,
    unknown: memory.unknown,
    turn: memory.turn + 1,
    seeds: []
  };
  if (!proposal.seed) {
    return view(advanced, {
      dreamer: proposal.dreamer,
      written: null,
      admitted: false,
      reason: proposal.refused.length ? "REFUSED" : "EMPTY",
      offered: [],
      recalled: false,
      refused: proposal.refused,
      retired: false,
      stop: false,
      order: order
    });
  }
  order.push("doer");
  const implementation = implement(proposal.seed);
  order.push("dclm");
  const record = run(implementation.task);
  if (record.admitted === true && record.written) {
    const peg = Object.freeze({
      dreamer: proposal.dreamer,
      id: record.written.task,
      idea: record.written.what,
      what: record.written.what,
      written: Object.freeze({ task: record.written.task, what: record.written.what }),
      passed: true,
      look: 0,
      joule: null
    });
    return view({
      peg: peg,
      unknown: memory.unknown,
      turn: memory.turn + 1,
      seeds: []
    }, {
      dreamer: proposal.dreamer,
      seed: proposal.seed,
      implementation: implementation,
      written: peg.written,
      admitted: true,
      reason: record.reason,
      write: record.write,
      audit: record.audit,
      offered: [peg],
      recalled: false,
      refused: proposal.refused,
      retired: false,
      stop: false,
      order: order
    });
  }
  const divided = !!(record.write && record.audit && record.write.ok !== record.audit.ok);
  const mark = Object.freeze({
    dreamer: proposal.dreamer,
    id: implementation.id,
    idea: implementation.idea,
    reason: record.reason,
    divided: divided,
    passed: false,
    look: 0,
    joule: null
  });
  return view({
    peg: null,
    unknown: appendUnknown(memory.unknown, mark),
    turn: memory.turn + 1,
    seeds: []
  }, {
    dreamer: proposal.dreamer,
    seed: proposal.seed,
    implementation: implementation,
    written: null,
    admitted: false,
    reason: record.reason,
    write: record.write,
    audit: record.audit,
    offered: [],
    recalled: false,
    refused: proposal.refused,
    retired: false,
    stop: false,
    order: order
  });
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

function closed() {
  return {
    dreamer: null,
    seed: null,
    implementation: null,
    written: null,
    admitted: false,
    reason: "method",
    authority: "DCLM",
    write: null,
    audit: null,
    peg: null,
    unknown: [],
    offered: [],
    recalled: false,
    refused: [],
    retired: false,
    stop: false,
    turn: 0,
    look: 0,
    joule: null
  };
}

export async function handleStep(request) {
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
  if (method === "GET") return json(200, step(null, {}));
  if (method === "POST") {
    let body = null;
    try {
      body = await request.json();
    } catch (err) {
      body = null;
    }
    const host = body && typeof body === "object" && body.stop === true ? { stop: true } : {};
    return json(200, step(body, host));
  }
  return json(405, closed());
}
