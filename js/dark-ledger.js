import { pegOf } from "./unity-wallet.js";

export const SENSES = Object.freeze([
  "audio",
  "video",
  "screen",
  "place",
  "motion",
  "microphone",
  "front",
  "rear",
  "gyroscope",
  "orientation"
]);

export const SWITCH = "You turn it on. You turn it off.";

export const SEAL = "Identity-bearing material seals itself on the dark ledger, so the public page does not show who you are.";

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function senseOf(name) {
  const value = text(name);
  if (value === "audio" || value === "video" || value === "screen" || value === "place" || value === "motion") return value;
  if (value === "microphone" || value === "front" || value === "rear" || value === "gyroscope" || value === "orientation") return value;
  return "";
}

function kindOf(piece) {
  const named = text(piece.kind);
  if (named === "password") return "passphrase";
  if (named === "email") return "mail";
  if (named === "pixels") return "screen";
  if (senseOf(named)) return senseOf(named);
  if (named === "identification" || named === "passphrase" || named === "preimage" || named === "mail") return named;
  if (text(piece.identification) || text(piece.unityId)) return "identification";
  if (text(piece.passphrase) || text(piece.password)) return "passphrase";
  if (text(piece.preimage)) return "preimage";
  if (text(piece.mail) || text(piece.email)) return "mail";
  if (piece.pixels != null) return "screen";
  if (piece.audio != null && piece.audio !== "") return "audio";
  if (piece.video != null && piece.video !== "") return "video";
  if (piece.screen != null && piece.screen !== "") return "screen";
  if (piece.place != null && piece.place !== "" && typeof piece.place !== "boolean") return "place";
  if (piece.motion != null && piece.motion !== "") return "motion";
  return "";
}

function reading(kind) {
  return senseOf(kind) !== "";
}

async function pegFor(piece, kind) {
  if (kind === "identification") return pegOf(text(piece.identification) || text(piece.unityId) || text(piece.id));
  if (kind === "preimage") return pegOf(text(piece.preimage));
  return null;
}

function row(extra) {
  const grant = extra.grant === true ? true : extra.grant === false ? false : null;
  return Object.freeze({
    step: extra.step,
    sealed: extra.sealed === true,
    sense: extra.sense || null,
    preference: extra.preference === true,
    peg: extra.peg || null,
    grant: grant,
    live: extra.preference === true && grant === true,
    stored: false,
    media: null,
    look: 0,
    joule: null,
    gate: "shut",
    coin: null
  });
}

export function open() {
  const preference = Object.create(null);
  const grants = Object.create(null);
  const log = [];
  let step = 0;
  let closed = false;

  function stateOf(sense) {
    const grant = grants[sense] === true ? true : grants[sense] === false ? false : null;
    return row({
      step: step,
      sealed: false,
      sense: sense,
      preference: preference[sense] === true,
      peg: null,
      grant: grant
    });
  }

  function absent() {
    return row({ step: step, sealed: false, sense: null, preference: false, peg: null, grant: null });
  }

  function prefer(name, on) {
    const sense = senseOf(name);
    if (!sense) return absent();
    if (!closed) preference[sense] = on === true;
    return stateOf(sense);
  }

  function android(name, allowed) {
    const sense = senseOf(name);
    if (!sense) return absent();
    if (closed) return stateOf(sense);
    grants[sense] = allowed === true;
    return stateOf(sense);
  }

  function hand(name, source, allowed) {
    if (source !== "android") {
      const sense = senseOf(name);
      if (!sense) return absent();
      return stateOf(sense);
    }
    return android(name, allowed);
  }

  async function seal(piece) {
    if (closed || !piece || typeof piece !== "object" || Array.isArray(piece)) return absent();
    const kind = kindOf(piece);
    if (!kind) return absent();
    const sense = senseOf(text(piece.sense)) || (reading(kind) ? kind : "");
    const peg = await pegFor(piece, kind);
    step += 1;
    const grant = sense ? (grants[sense] === true ? true : grants[sense] === false ? false : null) : null;
    const published = row({
      step: step,
      sealed: true,
      sense: sense || null,
      preference: sense ? preference[sense] === true : false,
      peg: peg,
      grant: grant
    });
    log.push(published);
    return published;
  }

  function record() {
    return Object.freeze(log.slice());
  }

  function view() {
    return Object.freeze({
      senses: Object.freeze({
        audio: stateOf("audio"),
        video: stateOf("video"),
        screen: stateOf("screen"),
        place: stateOf("place"),
        motion: stateOf("motion"),
        microphone: stateOf("microphone"),
        front: stateOf("front"),
        rear: stateOf("rear"),
        gyroscope: stateOf("gyroscope"),
        orientation: stateOf("orientation")
      }),
      closed: closed,
      watching: closed !== true,
      look: 0,
      joule: null,
      gate: "shut",
      coin: null
    });
  }

  function close() {
    closed = true;
    return Object.freeze({
      closed: true,
      watching: false,
      look: 0,
      joule: null,
      gate: "shut",
      coin: null
    });
  }

  return {
    prefer: prefer,
    set: prefer,
    android: android,
    hand: hand,
    seal: seal,
    record: record,
    view: view,
    close: close
  };
}
