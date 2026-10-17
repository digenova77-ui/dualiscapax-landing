export const RING = ["Llama", "Mistral", "Gemma", "Phi", "Qwen", "DeepSeek", "Falcon", "OLMo"];
export const EPS = 1e-12;

const AXIOMS = ["NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING"];
const MATCH = /\b(method of attack|how do you (?:think|attack|solve)|hybrid architecture|dreamers?|self[- ]arbitrage|probability measures?)\b/i;

let cursor = 0;

export function match(text) {
  return MATCH.test(String(text || ""));
}

export function seats(turn) {
  const n = RING.length;
  const start = ((turn % n) + n) % n;
  return RING.map(function (_, i) { return RING[(start + i) % n]; });
}

export function invert2(matrix) {
  if (!Array.isArray(matrix) || matrix.length !== 4) return null;
  const a = matrix[0], b = matrix[1], c = matrix[2], d = matrix[3];
  if (![a, b, c, d].every(function (n) { return typeof n === "number" && Number.isFinite(n); })) return null;
  const det = a * d - b * c;
  if (!Number.isFinite(det) || Math.abs(det) < EPS) return null;
  function clean(n) { return Object.is(n, -0) ? 0 : n; }
  return [clean(d / det), clean(-b / det), clean(-c / det), clean(a / det)];
}

export function solveJob(job) {
  if (!job || typeof job !== "object") return null;
  const broken = AXIOMS.filter(function (name) { return job.axioms && job.axioms[name] === false; });
  if (broken.length) return null;
  if (!job.directive || !job.refuse) return null;
  const world = job.world === 1 ? 1 : 0;
  const faces = job.faces || {};
  if (world === 1 && faces.L4) return null;
  if (faces.L6 && job.publish) return null;
  return { status: job.cell ? "ONE" : "INDEXED", world: world };
}

function measure(n) {
  return Math.round(n * 1e6) / 1e6;
}

function score(seed) {
  if (!seed || typeof seed !== "object") return { ok: false, reason: "bad-measure" };
  const p = seed.p;
  if (typeof p !== "number" || !Number.isFinite(p) || p < 0 || p > 1) return { ok: false, reason: "bad-measure" };
  const hasMatrix = Array.isArray(seed.matrix);
  const hasJob = !!seed.job && typeof seed.job === "object";
  const inverse = hasMatrix ? invert2(seed.matrix) : null;
  const law = hasJob ? solveJob(seed.job) : null;
  let solved = false;
  let solution = null;
  if (hasMatrix && hasJob) {
    if (inverse && law) {
      solved = true;
      solution = { inverse: inverse, law: law };
    }
  } else if (hasMatrix && inverse) {
    solved = true;
    solution = { inverse: inverse };
  } else if (hasJob && law) {
    solved = true;
    solution = { law: law };
  }
  const bit = solved ? 1 : 0;
  return {
    ok: true,
    idea: String(seed.idea || "").slice(0, 240),
    p: p,
    solved: bit,
    spread: measure(p - bit),
    solution: solution
  };
}

function place(turn, seeds) {
  const order = seats(turn);
  const named = new Map();
  const loose = [];
  const refused = [];
  (seeds || []).forEach(function (seed) {
    if (seed && seed.dreamer) {
      if (RING.indexOf(seed.dreamer) === -1) refused.push(String(seed.dreamer));
      else named.set(seed.dreamer, seed);
      return;
    }
    loose.push(seed);
  });
  let looseAt = 0;
  const seated = order.map(function (name) {
    if (named.has(name)) return { dreamer: name, seed: named.get(name) };
    if (looseAt < loose.length) return { dreamer: name, seed: loose[looseAt++] };
    return { dreamer: name, seed: null };
  });
  return { seated: seated, refused: refused };
}

export function speak(result) {
  const duty = result.onDuty;
  const rest = result.ring.filter(function (name) { return name !== duty; });
  if (!result.books.length) {
    return "I'm Iris. My attack is hybrid. " + duty + " leads this turn, then " + rest.join(", ") + " rotate. They only seed. The engine solves. I keep the spread between a probability and that solve. No seed has arrived, so I book nothing.";
  }
  const solved = result.books.filter(function (row) { return row.solved === 1; });
  const missed = result.books.filter(function (row) { return row.solved === 0; });
  if (!solved.length) {
    const top = missed.slice().sort(function (a, b) { return b.p - a.p; })[0];
    return "I'm Iris. " + top.dreamer + " priced a seed at " + top.p + ". The engine refused it. I keep the spread " + top.spread + ". I do not take the dream.";
  }
  const book = solved[0];
  const shy = missed.filter(function (row) { return row.p > book.p; })[0];
  let line = "I'm Iris. The engine solved the seed from " + book.dreamer + ". I book that solve. The probability was " + book.p + ", so the spread is " + book.spread + ".";
  if (shy) line += " " + shy.dreamer + " priced a miss higher. I do not follow that price.";
  return line;
}

export function attack(input) {
  const src = input || {};
  const turn = Number.isInteger(src.turn) ? src.turn : cursor++;
  const laid = place(turn, src.seeds);
  const books = [];
  laid.seated.forEach(function (seat) {
    if (!seat.seed) return;
    const row = score(seat.seed);
    if (!row.ok) {
      laid.refused.push(seat.dreamer);
      return;
    }
    books.push({
      dreamer: seat.dreamer,
      idea: row.idea,
      p: row.p,
      solved: row.solved,
      spread: row.spread,
      solution: row.solution
    });
  });
  const solved = books.filter(function (row) { return row.solved === 1; });
  const result = {
    method: "hybrid",
    ring: laid.seated.map(function (seat) { return seat.dreamer; }),
    onDuty: laid.seated[0].dreamer,
    turn: turn,
    refused: laid.refused,
    books: books,
    solved: solved,
    spread: measure(books.reduce(function (sum, row) { return sum + Math.abs(row.spread); }, 0)),
    answer: solved.map(function (row) { return row.solution; })
  };
  result.spoken = speak(result);
  return result;
}

export function publishedResponse() {
  return new Response(JSON.stringify(attack({ turn: 0, seeds: [] })), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

export function install(host) {
  const w = host || (typeof window !== "undefined" ? window : null);
  if (!w) return null;
  w.IrisAttack = {
    ring: RING,
    match: match,
    seats: seats,
    invert2: invert2,
    solveJob: solveJob,
    attack: attack
  };
  return w.IrisAttack;
}

if (typeof window !== "undefined") install(window);
