import { hmacSha256Hex, timingSafeEqualHex } from "./timing-safe-equal.js";

function parseStripeSig(header) {
  var parts = { t: null, v1: [] };
  if (!header) return parts;
  String(header).split(",").forEach(function (p) {
    var eq = p.indexOf("=");
    if (eq < 1) return;
    var k = p.slice(0, eq).trim();
    var v = p.slice(eq + 1).trim();
    if (k === "t") parts.t = v;
    if (k === "v1") parts.v1.push(v);
  });
  return parts;
}

/** Verify a Stripe webhook request. Consumes request.text() once. */
export async function verifyStripeWebhook(request, secret) {
  if (!secret) return { ok: false, reason: "no-secret" };
  var header = request.headers.get("stripe-signature") || request.headers.get("Stripe-Signature");
  if (!header) return { ok: false, reason: "no-sig" };
  var rawBody;
  try {
    rawBody = await request.text();
  } catch (e) {
    return { ok: false, reason: "body" };
  }
  var parts = parseStripeSig(header);
  if (!parts.t || !parts.v1.length) return { ok: false, reason: "sig-parse" };
  var age = Math.abs(Math.floor(Date.now() / 1000) - Number(parts.t));
  if (!Number.isFinite(age) || age > 300) return { ok: false, reason: "sig-age" };
  var hex = await hmacSha256Hex(parts.t + "." + rawBody, secret);
  if (!hex) return { ok: false, reason: "sig-hmac" };
  var match = parts.v1.some(function (v1) {
    return timingSafeEqualHex(hex, v1);
  });
  if (!match) return { ok: false, reason: "sig-bad" };
  var event;
  try {
    event = JSON.parse(rawBody);
  } catch (e) {
    return { ok: false, reason: "json" };
  }
  if (!event || typeof event !== "object" || !event.id) return { ok: false, reason: "event" };
  return { ok: true, event: event };
}
