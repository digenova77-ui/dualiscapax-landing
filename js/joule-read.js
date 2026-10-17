import { align, unifiCubed } from "./merit-align.js";
import { pegOf } from "./unity-wallet.js";

export const READING = "/api/merit/align";
export const BOOK = "/api/merit/exchange";

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function denied(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return true;
  if (body.error) return true;
  if (body.ok === false) return true;
  if (body.granted === false) return true;
  if (body.live === "denied") return true;
  return false;
}

function fromChain(body) {
  const chain = body.chain;
  const cubed = chain.unifiCubed;
  const unity = chain.unity;
  let factor = unity;
  if (unifiCubed(unity) !== cubed) {
    const root = typeof cubed === "number" && Number.isFinite(cubed) ? Math.cbrt(cubed) : null;
    factor = unifiCubed(root) === cubed ? root : null;
  }
  return {
    unity: unity,
    unifi: factor,
    meritPrice: chain.meritPrice,
    efuse: chain.efuse,
    joule: body.joule
  };
}

function decisionOf(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  if (body.decision && typeof body.decision === "object" && !Array.isArray(body.decision)) return body.decision;
  if (body.chain && typeof body.chain === "object" && !Array.isArray(body.chain)) return fromChain(body);
  return body;
}

export function jouleOf(body) {
  if (denied(body)) return null;
  return align(decisionOf(body) || {}).joule;
}

function quiet(reason, live) {
  return Object.freeze({
    sense: "joule",
    live: live,
    joule: null,
    look: 0,
    open: false,
    gate: "shut",
    usage: "closed",
    reason: reason,
    peg: null,
    chain: null,
    media: null,
    stored: false,
    coin: null,
    minted: false,
    writer: false
  });
}

function admitted(gate, peg) {
  return Object.freeze({
    sense: "joule",
    live: "granted",
    joule: gate.joule,
    look: 0,
    open: gate.open === true,
    gate: gate.open === true ? "open" : "shut",
    usage: gate.usage,
    reason: gate.reason,
    peg: peg,
    chain: Object.freeze({
      meritPrice: gate.chain.meritPrice,
      unity: gate.chain.unity,
      unifiCubed: gate.chain.unifiCubed,
      efuse: gate.chain.efuse
    }),
    media: null,
    stored: false,
    coin: null,
    minted: false,
    writer: false
  });
}

async function pull(fetchImpl) {
  try {
    const response = await fetchImpl(READING, {
      method: "GET",
      headers: { accept: "application/json" }
    });
    if (!response || response.ok !== true || typeof response.json !== "function") return null;
    return await response.json();
  } catch (err) {
    return null;
  }
}

async function pegFrom(src) {
  const id = text(src.identification) || text(src.unityId) || text(src.id);
  if (!id) return null;
  return pegOf(id);
}

export function open(options) {
  const opts = options || {};
  let preference = false;
  let asks = 0;
  const tape = [];

  function set(on) {
    preference = on === true;
    return preference;
  }

  async function read(input) {
    if (preference !== true) return quiet("off", "off");
    if (tape.length) return tape[0];
    const src = input && typeof input === "object" && !Array.isArray(input) ? input : {};
    let body;
    if (Object.hasOwn(src, "body")) {
      body = src.body;
    } else {
      const fetchImpl = src.fetch || opts.fetch || globalThis.fetch;
      asks += 1;
      body = typeof fetchImpl === "function" ? await pull(fetchImpl) : null;
    }
    if (denied(body)) return quiet("joule-null", "denied");
    const gate = align(decisionOf(body) || {});
    if (gate.joule === null) return quiet(gate.reason || "joule-null", "denied");
    const row = admitted(gate, await pegFrom(src));
    tape.push(row);
    return row;
  }

  function memory() {
    return Object.freeze(tape.slice());
  }

  function asked() {
    return asks;
  }

  return {
    set: set,
    read: read,
    memory: memory,
    asked: asked
  };
}
