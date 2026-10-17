const HEX = "0123456789abcdef";

function identificationOf(value) {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  if (typeof value.identification !== "string") return "";
  return value.identification.trim();
}

export async function pegOf(identification) {
  const id = identificationOf(identification);
  if (!id) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(id));
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    hex += HEX[byte >> 4] + HEX[byte & 15];
  }
  return hex;
}

export async function record(identification) {
  const peg = await pegOf(identification);
  if (!peg) {
    return Object.freeze({
      peg: null,
      iris: null,
      look: 0,
      joule: null
    });
  }
  return Object.freeze({
    peg: peg,
    iris: "Iris",
    look: 0,
    joule: null
  });
}
