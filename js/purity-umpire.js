import { run } from "./dclm-write.js";

const HOLD = Object.freeze({
  NO_FORCE: true,
  HOST_SAFE: true,
  CLEANUP_FIRST: true,
  TRUTH_OR_NOTHING: true
});

function laws(over) {
  const out = {
    NO_FORCE: HOLD.NO_FORCE,
    HOST_SAFE: HOLD.HOST_SAFE,
    CLEANUP_FIRST: HOLD.CLEANUP_FIRST,
    TRUTH_OR_NOTHING: HOLD.TRUTH_OR_NOTHING
  };
  if (over) {
    const names = Object.keys(over);
    for (let i = 0; i < names.length; i++) out[names[i]] = over[names[i]];
  }
  return Object.freeze(out);
}

export const PIECES = Object.freeze([
  Object.freeze({
    id: "teal-explorer",
    what: "The teal ring is Iris, the explorer.",
    from: "index.html",
    axioms: HOLD
  }),
  Object.freeze({
    id: "emoji-line",
    what: "From her the line runs the web, the world, the cosmos, the heart, the brain, and the fire.",
    from: "index.html",
    marks: Object.freeze([
      "From her the line runs the web, the world, the cosmos, the heart, the brain, and the fire.",
      "The line runs web, world, cosmos, heart, brain, and fire.",
      "👽"
    ]),
    axioms: laws({ TRUTH_OR_NOTHING: false })
  }),
  Object.freeze({
    id: "violet-moon",
    what: "A violet moon is painted on Iris.",
    from: "index.html",
    marks: Object.freeze(["iris-moon", "A violet moon is painted on Iris."]),
    veto: true,
    axioms: HOLD
  }),
  Object.freeze({
    id: "quark-canvas",
    what: "A quark canvas is left running behind the page.",
    from: "html",
    marks: Object.freeze(["home-quarks", "A quark canvas is left running behind the page."]),
    tree: true,
    skipped: Object.freeze(["CLEANUP_FIRST"]),
    axioms: HOLD
  }),
  Object.freeze({
    id: "google-font",
    what: "A Google font is loaded as a second skin.",
    from: "css",
    marks: Object.freeze([
      "fonts.googleapis.com",
      "fonts.gstatic.com",
      "A Google font is loaded as a second skin."
    ]),
    tree: true,
    axioms: Object.freeze({
      NO_FORCE: true,
      HOST_SAFE: true,
      CLEANUP_FIRST: true
    })
  }),
  Object.freeze({
    id: "second-stories",
    what: "Law, philosophy, and for you are another story.",
    from: "index.html",
    marks: Object.freeze([
      'href="law.html"',
      'href="research/philosophy/"',
      'href="for-people.html"',
      "Law, philosophy, and for you are another story."
    ]),
    veto: true,
    axioms: HOLD
  }),
  Object.freeze({
    id: "field-canvas",
    what: "On the field canvas at /field.html, a person orbits a night Earth and asks.",
    from: "llms.txt",
    marks: Object.freeze([
      "On the field canvas at /field.html, a person orbits a night Earth and asks.",
      "The earlier canvas is at /field.html.",
      "Field canvas: /field.html."
    ]),
    skipped: Object.freeze(["HOST_SAFE"]),
    axioms: HOLD
  }),
  Object.freeze({
    id: "phosphor-bloom",
    what: "A phosphor bloom is drawn around the rings.",
    from: "index.html",
    marks: Object.freeze(['id="bloom"', 'id="phosphor"', "A phosphor bloom is drawn around the rings."]),
    skipped: Object.freeze(["NO_FORCE"]),
    axioms: HOLD
  }),
  Object.freeze({
    id: "star-drift",
    what: "The stars drift and the ring breathes.",
    from: "css/writer.css",
    marks: Object.freeze([
      "@keyframes drift",
      "@keyframes breath{",
      "The stars drift and the ring breathes."
    ]),
    tree: true,
    veto: true,
    axioms: HOLD
  }),
  Object.freeze({
    id: "module-comments",
    what: "Header comments decorate the exchange and the attack.",
    from: "js",
    marks: Object.freeze([
      "This build does not call the dreamers.",
      "This module does not open a till.",
      "The receipt is built only after the facilitator settles.",
      "Header comments decorate the exchange and the attack."
    ]),
    veto: true,
    axioms: HOLD
  })
]);

function taskOf(piece) {
  const task = {
    id: piece.id,
    what: piece.what,
    axioms: piece.axioms
  };
  if (piece.veto === true) task.veto = true;
  if (piece.skipped) task.skipped = piece.skipped;
  return task;
}

function classify(pieces) {
  const stuck = [];
  const unknown = [];
  const seen = new Set();
  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];
    const record = run(taskOf(piece));
    const row = Object.freeze({
      id: piece.id,
      what: piece.what,
      from: piece.from,
      reason: record.reason,
      admitted: record.admitted === true,
      look: 0,
      joule: null
    });
    if (record.admitted === true) {
      if (!seen.has(piece.id)) {
        seen.add(piece.id);
        stuck.push(row);
      }
    } else {
      unknown.push(row);
    }
  }
  return Object.freeze({
    stuck: Object.freeze(stuck),
    unknown: Object.freeze(unknown),
    look: 0,
    joule: null
  });
}

const PASS = classify(PIECES);

export function read() {
  return {
    stuck: PASS.stuck,
    unknown: PASS.unknown,
    counts: {
      stuck: PASS.stuck.length,
      unknown: PASS.unknown.length
    },
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

export function handleBucket(request) {
  const counts = {
    stuck: PASS.stuck.length,
    unknown: PASS.unknown.length,
    look: 0,
    joule: null
  };
  const method = request && request.method;
  if (method === "GET") return json(200, counts);
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, OPTIONS",
        "access-control-allow-headers": "Content-Type",
        "access-control-max-age": "86400"
      }
    });
  }
  return json(405, counts);
}
