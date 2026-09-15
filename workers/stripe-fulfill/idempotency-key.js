/**
 * Stripe API Idempotency-Key helper.
 * Use only on POST to api.stripe.com (Checkout Session, refund).
 * Do not send this header on incoming webhooks. Incoming identity is evt_ / cs_ in D1.
 */

const MAX = 255;

export function stripeIdempotencyKey(kind, stableId) {
  var k = String(kind || "op").replace(/[^a-z0-9._-]/gi, "").slice(0, 40);
  var id = String(stableId || "").replace(/\s+/g, "").slice(0, 180);
  if (!id) return null;
  var out = "dc_" + k + "_" + id;
  return out.length > MAX ? out.slice(0, MAX) : out;
}

export function stripeIdempotentHeaders(kind, stableId) {
  var key = stripeIdempotencyKey(kind, stableId);
  if (!key) return {};
  return { "Idempotency-Key": key };
}
