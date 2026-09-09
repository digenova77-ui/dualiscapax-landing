/** Constant-time compare + HMAC-SHA256 hex. Fail closed. */

export function timingSafeEqualBytes(a, b) {
  if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array)) return false;
  if (a.length !== b.length || a.length === 0) return false;
  var out = 0;
  for (var i = 0; i < a.length; i++) out |= a[i] ^ b[i];
  return out === 0;
}

export function hexToBytes(hex) {
  if (typeof hex !== "string" || hex.length % 2 !== 0) return null;
  var n = hex.length / 2;
  var out = new Uint8Array(n);
  for (var i = 0; i < n; i++) {
    var byte = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (!Number.isFinite(byte)) return null;
    out[i] = byte;
  }
  return out;
}

export function timingSafeEqualHex(a, b) {
  var left = hexToBytes(String(a || "").toLowerCase());
  var right = hexToBytes(String(b || "").toLowerCase());
  if (!left || !right) return false;
  return timingSafeEqualBytes(left, right);
}

export async function hmacSha256Hex(message, secret) {
  if (typeof message !== "string" || typeof secret !== "string" || !secret) return "";
  var enc = new TextEncoder();
  var key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  var sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map(function (b) {
    return b.toString(16).padStart(2, "0");
  }).join("");
}
