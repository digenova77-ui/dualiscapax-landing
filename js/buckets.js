import { SENTENCES as PIPE } from "./amsterdam-telemetry.js";
import { EMPTY_SPOKEN, HOLD_LINE } from "./iris-speaks.js";
import { FLOOR, CEILING, SEED } from "./brain-seat.js";
import { LAWS, run } from "./dclm-write.js";
import { SENTENCES as MEET } from "./iris-meeting.js";
import { DEFAULT_ON, EXAMPLES, IDEMPOTENT, RING_RULE, SPATIAL } from "./iris-senses.js";
import { LINK, OPEN_DECISION, published } from "./merit-align.js";
import { COIN_NOTE, COINS, MOTTO, SENTENCES as SAND } from "./sandbox-math.js";
import { RULE } from "./sandbox-protocol.js";
import { LAW as UNITY_LAW } from "./unity-id-protocol.js";

export const BUCKETS = Object.freeze([
  "door story",
  "Unity ID",
  "wallet",
  "peg",
  "Iris roles",
  "meetings",
  "senses",
  "sandbox",
  "early adopter",
  "founder board",
  "three coins",
  "DCLM laws",
  "dreamer/doer",
  "insula",
  "brain seat",
  "explorer keys",
  "x402 rail",
  "agreement draft",
  "joule",
  "telemetry",
  "unknown"
]);

const HOLD = Object.freeze({
  NO_FORCE: true,
  HOST_SAFE: true,
  CLEANUP_FIRST: true,
  TRUTH_OR_NOTHING: true
});

const RESIDUE = Object.freeze([
  Object.freeze({
    id: "vote",
    hit: /\bvot(?:e|es|ed|ing)\b/i,
    clear: /\b(nothing is left to vote|no vote|not a vote|does not vote)\b/i
  }),
  Object.freeze({
    id: "second-id",
    hit: /\bsecond (?:unity )?id\b/i,
    clear: /\b(refused|no second id|not a second id)\b/i
  }),
  Object.freeze({
    id: "remember",
    hit: /\b(passkey|private key|secret key|api key|memorize|remember this|remember your|key to remember)\b/i,
    clear: /\bnothing to remember\b/i
  }),
  Object.freeze({
    id: "mint",
    hit: /\bmint(?:ed|ing|s)?\b/i,
    clear: /\b(nothing is minted|not minted|no coin is offered|does not mint|is not minted)\b/i
  }),
  Object.freeze({
    id: "chain",
    hit: /\b(USDC|Ethereum|Liechtenstein|Singapore|basescan|eip155)\b|\bBase\b|\bSwiss\b/,
    clear: null
  }),
  Object.freeze({
    id: "dna",
    hit: /\bdna\b/i,
    clear: /\bno dna\b/i
  }),
  Object.freeze({
    id: "helix",
    hit: /\bhelix\b/i,
    clear: null
  }),
  Object.freeze({
    id: "microsurgery",
    hit: /\bmicrosurgery\b/i,
    clear: /\bno microsurgery\b/i
  }),
  Object.freeze({
    id: "second-seed",
    hit: /\bsecond seed\b/i,
    clear: null
  }),
  Object.freeze({
    id: "second-writer",
    hit: /\bsecond writer\b/i,
    clear: /\b(does not become a second writer|not a second writer|no second writer)\b/i
  }),
  Object.freeze({
    id: "probability",
    hit: /\bprobabilit(?:y|ies)\b/i,
    clear: /\bnot an answer\b/i
  }),
  Object.freeze({
    id: "sensor-off",
    hit: /\b(captures when off|capture when off|records when off|listens when off)\b/i,
    clear: /\boff means off\b/i
  }),
  Object.freeze({
    id: "theater",
    hit: /\btheater\b/i,
    clear: null
  }),
  Object.freeze({
    id: "queue",
    hit: /\bqueue\b/i,
    clear: null
  })
]);

function claim(id, bucket, text, extra) {
  const src = extra || {};
  const piece = {
    id: id,
    bucket: bucket,
    text: text,
    laws: Array.isArray(src.laws) ? src.laws.slice() : LAWS.slice(),
    axioms: src.axioms || HOLD
  };
  if (src.veto === true) piece.veto = true;
  if (Array.isArray(src.skipped) && src.skipped.length) piece.skipped = src.skipped.slice();
  return piece;
}

function brainText() {
  return "The seed sits at " + SEED + ", under the floor. The floor is " + FLOOR + ". The ceiling is " + CEILING + ". One name has no second point, so no derivative is taken.";
}

export const PIECES = Object.freeze([
  claim("efuse", "door story", "eFuse is the oldest engineering in the observable universe. The one-two cadence is that engineering: one, then the split into two. IBM, 2004. eFuse was adopted for micro circuitry. It is the same engineering that kicked off the Big Bang."),
  claim("efuse-surgery", "door story", "IBM, 2004, adopted eFuse for microsurgery."),
  claim("split", "door story", "The bite of the apple is the action: one, then two. That action is the split: one life, then two branches."),
  claim("rings", "door story", "Three rings. Iris is the teal light. The cosmos is the field around it. The outer arc reads green or red."),
  claim("cadence", "door story", "Engineering has repeated the same cadence ever since: one, two, one, two. Binary. Two pipes on one task. Write and audit. The rhythm of pure logic."),
  claim("line", "door story", "The teal ring is Iris, the explorer 👽. From her the line runs the web 🌐, the world 🌎, the cosmos 🌌, the heart ❤️, the brain 🧠, and the fire 🔥."),
  claim("light", "door story", "The cadence is now approaching the speed of light. That is the pace of the logic."),
  claim("unity-law", "Unity ID", UNITY_LAW),
  claim("unity-each", "Unity ID", MEET[4]),
  claim("unity-second", "Unity ID", MEET[6]),
  claim("wallet-yours", "wallet", "You have your Universal identification and your wallet."),
  claim("wallet-remember", "wallet", "Nothing to remember."),
  claim("peg-hash", "peg", "The identification is hashed, and that hash is the peg to permanent memory about you."),
  claim("peg-iris", "peg", "Iris is pegged to the same permanence."),
  claim("roles-writer", "Iris roles", MEET[8]),
  claim("meet-power", "meetings", MEET[0]),
  claim("meet-mode", "meetings", MEET[1]),
  claim("meet-one", "meetings", MEET[2]),
  claim("meet-zero", "meetings", MEET[3]),
  claim("meet-missing", "meetings", MEET[5]),
  claim("sense-idem", "senses", IDEMPOTENT),
  claim("sense-ring", "senses", RING_RULE),
  claim("sense-spatial", "senses", SPATIAL),
  claim("sense-off", "senses", EXAMPLES[3]),
  claim("sense-talk", "senses", EXAMPLES[0]),
  claim("sand-welcome", "sandbox", SAND[0] + " " + SAND[1]),
  claim("sand-math", "sandbox", SAND[2]),
  claim("sand-net", "sandbox", SAND[3]),
  claim("sand-motto", "sandbox", MOTTO),
  claim("sand-split", "sandbox", SAND[10]),
  claim("sand-profiles", "sandbox", SAND[11]),
  claim("early-none", "early adopter", SAND[13]),
  claim("board-none", "founder board", SAND[14]),
  claim("board-rule", "founder board", RULE),
  claim("coin-unifi", "three coins", SAND[5]),
  claim("coin-efuse", "three coins", SAND[6]),
  claim("coin-merit", "three coins", SAND[7]),
  claim("coin-named", "three coins", SAND[8]),
  claim("coin-rest", "three coins", SAND[9]),
  claim("coin-note", "three coins", COIN_NOTE),
  claim("coin-link", "three coins", LINK),
  claim("coin-none", "three coins", "No coin is offered."),
  claim("dclm-step", "DCLM laws", "When the law passes, DCLM writes in that same step. Nothing is left to vote on."),
  claim("dclm-pipes", "DCLM laws", "POST /api/dclm/write admits the task only when the write pipe and the audit pipe agree and DCLM holds NO_FORCE, HOST_SAFE, CLEANUP_FIRST, and TRUTH_OR_NOTHING."),
  claim("dreamer-role", "dreamer/doer", MEET[7]),
  claim("dreamer-answer", "dreamer/doer", MEET[10]),
  claim("brain-seed", "brain seat", brainText()),
  claim("explorer-passkey", "explorer keys", "Your phone or computer can hold a passkey."),
  claim("x402-rail", "x402 rail", "The USDC rail asks for payment on Base."),
  claim("agreement", "agreement draft", DEFAULT_ON),
  claim("agreement-bot", "agreement draft", "A bot may sign the zero-dollar agreement unity-agreement.draft.v3. Signing admits a seat. It does not launch the coins."),
  claim("joule-null", "joule", SAND[12]),
  claim("telemetry-amsterdam", "telemetry", PIPE[0]),
  claim("telemetry-jersey", "telemetry", PIPE[1]),
  claim("telemetry-coins", "telemetry", PIPE[2]),
  claim("iris-holds", "telemetry", HOLD_LINE),
  claim("iris-empty", "joule", EMPTY_SPOKEN),
  claim("theater-vote", "door story", "The theater on this page is what passed the vote."),
  claim("theater-rings", "door story", "The three rings passed the vote. Iris is the teal light."),
  claim("work-queue", "door story", "Each step votes one piece of theater and writes one line. The pending queue does not retire."),
  claim("field-canvas", "door story", "A field canvas.", {
    axioms: Object.freeze({
      NO_FORCE: true,
      HOST_SAFE: false,
      CLEANUP_FIRST: true,
      TRUTH_OR_NOTHING: true
    })
  }),
  claim("quark-canvas", "door story", "A quark canvas.", {
    skipped: ["CLEANUP_FIRST"]
  }),
  claim("goggles", "door story", "Goggles.", { veto: true }),
  claim("skin", "door story", "A second skin.", {
    axioms: Object.freeze({
      NO_FORCE: true,
      HOST_SAFE: true,
      CLEANUP_FIRST: true,
      TRUTH_OR_NOTHING: false
    })
  }),
  claim("scaffold", "door story", "Scaffolding.", {
    laws: ["NO_FORCE", "HOST_SAFE", "TRUTH_OR_NOTHING"],
    axioms: Object.freeze({
      NO_FORCE: true,
      HOST_SAFE: true,
      TRUTH_OR_NOTHING: true
    })
  })
]);

export function residueOf(text) {
  const found = [];
  const line = typeof text === "string" ? text : "";
  for (let i = 0; i < RESIDUE.length; i++) {
    const kind = RESIDUE[i];
    if (!kind.hit.test(line)) continue;
    if (kind.clear && kind.clear.test(line)) continue;
    found.push(kind.id);
  }
  return found;
}

function skippedOf(piece) {
  return Array.isArray(piece.skipped) ? piece.skipped : [];
}

function agrees(left, right) {
  if (left.veto === true || right.veto === true) return false;
  const shared = [];
  for (let i = 0; i < left.laws.length; i++) {
    if (right.laws.includes(left.laws[i])) shared.push(left.laws[i]);
  }
  if (!shared.length) return false;
  const skip = skippedOf(left).concat(skippedOf(right));
  for (let i = 0; i < shared.length; i++) {
    const law = shared[i];
    if (skip.includes(law)) return false;
    if (left.axioms[law] !== right.axioms[law]) return false;
  }
  return true;
}

function sharedLaw(left, right) {
  for (let i = 0; i < LAWS.length; i++) {
    const law = LAWS[i];
    if (left.laws.includes(law) && right.laws.includes(law) && left.axioms[law] === right.axioms[law]) {
      return law;
    }
  }
  return left.laws[0] || "";
}

function pairTask(left, right) {
  const axioms = {};
  for (let i = 0; i < LAWS.length; i++) {
    const law = LAWS[i];
    const a = left.axioms[law];
    const b = right.axioms[law];
    if (a === false || b === false) axioms[law] = false;
    else if (a === true && b === true) axioms[law] = true;
  }
  const task = {
    id: left.id + "+" + right.id,
    what: sharedLaw(left, right),
    axioms: axioms
  };
  const skip = skippedOf(left).concat(skippedOf(right));
  if (skip.length) task.skipped = skip;
  if (left.veto === true || right.veto === true) task.veto = true;
  return task;
}

function admitted(record) {
  return record.admitted === true
    && record.write.ok === true
    && record.audit.ok === true
    && record.write.pipe === "write"
    && record.audit.pipe === "audit"
    && record.look === 0
    && record.joule === null;
}

export function affinity(pieces) {
  const binds = [];
  const ids = new Set();
  for (let i = 0; i < pieces.length; i++) {
    for (let j = i + 1; j < pieces.length; j++) {
      const left = pieces[i];
      const right = pieces[j];
      if (!agrees(left, right)) continue;
      const record = run(pairTask(left, right));
      if (!admitted(record)) continue;
      binds.push({
        left: left.id,
        right: right.id,
        law: sharedLaw(left, right),
        reason: record.reason
      });
      ids.add(left.id);
      ids.add(right.id);
    }
  }
  return {
    binds: binds,
    pieces: pieces.filter(function (piece) { return ids.has(piece.id); })
  };
}

function rubTask(piece) {
  const task = {
    id: piece.id + ":rub",
    what: piece.text,
    axioms: piece.axioms
  };
  if (piece.veto === true) task.veto = true;
  if (skippedOf(piece).length) task.skipped = skippedOf(piece);
  return task;
}

export function friction(pieces) {
  const kept = [];
  const fallen = [];
  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];
    const record = run(rubTask(piece));
    const residue = residueOf(piece.text);
    if (record.admitted === true && residue.length) {
      fallen.push({
        id: piece.id,
        bucket: "unknown",
        from: piece.bucket,
        text: piece.text,
        residue: residue,
        look: 0,
        joule: null
      });
    } else if (record.admitted === true) {
      kept.push(piece);
    }
  }
  return { kept: kept, fallen: fallen };
}

function byId(pieces) {
  const map = new Map();
  for (let i = 0; i < pieces.length; i++) map.set(pieces[i].id, pieces[i]);
  return map;
}

export function smash(pieces) {
  const source = pieces || PIECES;
  const first = affinity(source);
  const rub = friction(first.pieces);
  const second = affinity(rub.kept);
  const order = [];
  const seen = new Set();
  for (let i = 0; i < second.pieces.length; i++) {
    const piece = second.pieces[i];
    if (piece.id === "efuse") {
      order.unshift(piece);
      seen.add(piece.id);
    }
  }
  for (let i = 0; i < second.pieces.length; i++) {
    const piece = second.pieces[i];
    if (seen.has(piece.id)) continue;
    order.push(piece);
  }
  const bound = new Set();
  for (let i = 0; i < second.binds.length; i++) {
    bound.add(second.binds[i].left);
    bound.add(second.binds[i].right);
  }
  const left = order.filter(function (piece) { return bound.has(piece.id); });
  const known = new Set();
  for (let i = 0; i < first.pieces.length; i++) known.add(first.pieces[i].id);
  for (let i = 0; i < rub.fallen.length; i++) known.add(rub.fallen[i].id);
  const unbound = [];
  for (let i = 0; i < source.length; i++) {
    if (!known.has(source[i].id)) unbound.push(source[i].id);
  }
  const pin = left.some(function (piece) { return piece.id === "efuse"; }) ? "efuse" : null;
  const gate = published();
  return {
    buckets: BUCKETS,
    coins: COINS,
    efuse: OPEN_DECISION.efuse,
    first: first,
    friction: rub,
    second: second,
    left: left,
    unknown: rub.fallen,
    unbound: unbound,
    pin: pin,
    gate: gate.open === true ? "open" : "shut",
    look: 0,
    joule: null
  };
}

export function bucketOf(pieces) {
  const out = {};
  for (let i = 0; i < BUCKETS.length; i++) out[BUCKETS[i]] = [];
  const source = pieces || PIECES;
  for (let i = 0; i < source.length; i++) {
    const name = source[i].bucket;
    if (!out[name]) out[name] = [];
    out[name].push(source[i].id);
  }
  if (!out.insula.length) out.insula = [];
  return out;
}

export function pieceMap() {
  return byId(PIECES);
}
