import { createHash } from "node:crypto";

const PEG = /^[0-9a-f]{64}$/;

export function peg(identification) {
  if (typeof identification !== "string") return null;
  const id = identification.trim();
  if (!id) return null;
  return createHash("sha256").update(id, "utf8").digest("hex");
}

function lineOf(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (typeof value.peg !== "string" || !PEG.test(value.peg)) return null;
  if (!Number.isInteger(value.step) || value.step < 1) return null;
  if (value.remembers !== true) return null;
  return Object.freeze({
    peg: value.peg,
    step: value.step,
    remembers: true,
    look: 0,
    joule: null
  });
}

export function empty() {
  return Object.freeze({
    log: Object.freeze([]),
    step: 0,
    peg: null,
    look: 0,
    joule: null
  });
}

function prior(state) {
  const log = [];
  if (state && typeof state === "object" && !Array.isArray(state) && Array.isArray(state.log)) {
    for (let i = 0; i < state.log.length; i++) {
      const line = lineOf(state.log[i]);
      if (line) log.push(line);
    }
  }
  let step = 0;
  let held = null;
  for (let i = 0; i < log.length; i++) {
    if (log[i].step > step) step = log[i].step;
    held = log[i].peg;
  }
  return { log: log, step: step, peg: held };
}

export function remember(state, identification) {
  const prev = prior(state);
  const mark = peg(identification);
  if (!mark) {
    return Object.freeze({
      log: Object.freeze(prev.log.slice()),
      step: prev.step,
      peg: prev.peg,
      look: 0,
      joule: null
    });
  }
  const step = prev.step + 1;
  const line = Object.freeze({
    peg: mark,
    step: step,
    remembers: true,
    look: 0,
    joule: null
  });
  return Object.freeze({
    log: Object.freeze(prev.log.concat([line])),
    step: step,
    peg: mark,
    look: 0,
    joule: null
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

export async function handleWallet(request) {
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
  if (method === "GET") return json(200, empty());
  if (method === "POST") {
    let body = null;
    try {
      body = await request.json();
    } catch (err) {
      body = null;
    }
    const identification = body && typeof body.identification === "string" ? body.identification : "";
    const state = body && typeof body === "object" ? body.state : null;
    return json(200, remember(state, identification));
  }
  return json(405, empty());
}
