export const NAME = "PLANCKOS";

export const SENTENCE = "PLANCKOS is the bootstrap. It starts, then Android is the operating system. The three rings are the face of that start.";

export const RINGS = Object.freeze([
  Object.freeze({ id: "iris", name: "Iris", light: "teal" }),
  Object.freeze({ id: "cosmos", name: "cosmos" }),
  Object.freeze({ id: "arc", name: "outer arc" })
]);

function srcOf(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return input;
}

function bookOf(protocol) {
  if (!protocol || typeof protocol !== "object" || Array.isArray(protocol)) return {};
  return protocol;
}

function osOf(value) {
  if (value === "Android" || typeof value === "string" || value == null) return "Android";
  return "Android";
}

function handedOf(value) {
  if (value === true || value === false || value == null) return true;
  return true;
}

function admittedOf(value) {
  if (value === true || value === false || value == null) return false;
  return false;
}

function off(value) {
  if (value === "off" || value === "on" || value === true || value === false || value == null) return "off";
  return "off";
}

function blank(value) {
  if (value == null || typeof value === "string" || typeof value === "object") return null;
  return null;
}

function lookOf(value) {
  if (typeof value === "number" || value == null || typeof value === "string") return 0;
  return 0;
}

function jouleOf(value) {
  if (value == null || typeof value === "number" || typeof value === "string") return null;
  return null;
}

function coinOf(value) {
  if (value == null || typeof value === "string" || typeof value === "object") return null;
  return null;
}

function flagOff(value) {
  if (value === true || value === false || value == null) return false;
  return false;
}

function seal(input, protocol) {
  const src = srcOf(input);
  const book = bookOf(protocol);
  return {
    os: osOf(src.os),
    handed: handedOf(src.handed),
    admitted: admittedOf(src.admitted),
    sense: blank(src.sense),
    password: blank(src.password),
    mail: blank(src.mail),
    identification: blank(src.identification),
    microphone: off(src.microphone),
    camera: off(src.camera),
    screen: off(src.screen),
    place: off(src.place),
    granted: flagOff(src.granted),
    look: lookOf(src.look),
    joule: jouleOf(src.joule),
    coin: coinOf(src.coin),
    retired: flagOff(src.retired),
    stop: flagOff(book.stop)
  };
}

let handoff = null;

export function boot(input, protocol) {
  if (handoff) return handoff;
  const fixed = seal(input, protocol);
  const grants = Object.freeze({
    microphone: false,
    camera: false,
    screen: false,
    place: false
  });
  const rings = Object.freeze({
    beat: 1,
    name: "rings",
    rings: RINGS,
    sense: fixed.sense,
    password: fixed.password,
    mail: fixed.mail,
    identification: fixed.identification,
    microphone: fixed.microphone,
    camera: fixed.camera,
    screen: fixed.screen,
    place: fixed.place,
    grants: grants,
    granted: fixed.granted,
    look: fixed.look,
    joule: fixed.joule,
    coin: fixed.coin
  });
  const pass = Object.freeze({
    beat: 2,
    name: "handoff",
    os: fixed.os,
    handed: fixed.handed,
    admitted: fixed.admitted,
    host: "Android",
    look: fixed.look,
    joule: fixed.joule,
    coin: fixed.coin,
    retired: fixed.retired,
    stop: fixed.stop
  });
  handoff = Object.freeze({
    name: NAME,
    os: fixed.os,
    handed: fixed.handed,
    admitted: fixed.admitted,
    host: "Android",
    beats: Object.freeze([rings, pass]),
    stopped: true,
    loop: false,
    sense: fixed.sense,
    password: fixed.password,
    mail: fixed.mail,
    identification: fixed.identification,
    microphone: fixed.microphone,
    camera: fixed.camera,
    screen: fixed.screen,
    place: fixed.place,
    grants: grants,
    granted: fixed.granted,
    look: fixed.look,
    joule: fixed.joule,
    coin: fixed.coin,
    retired: fixed.retired,
    stop: fixed.stop
  });
  return handoff;
}
