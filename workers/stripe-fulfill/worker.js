/**
 * DualisCapax Stripe fulfill worker
 * Current as of: 2026-08-30
 *
 * Listens for checkout.session.completed (+ async success).
 * Maps metadata.sku → seat / Fuel grant.
 * No sk_ in the static dualiscapax.ai site.
 *
 * Deploy: Cloudflare Workers (or any HTTPS endpoint).
 * Verify Stripe-Signature with STRIPE_WEBHOOK_SECRET.
 * Idempotent on session.id.
 */

const SKU_GRANT = {
  leaf: { kind: "seat", term_months: 12, ip: "one_room" },
  branch: { kind: "seat", term_months: 12, ip: "one_field" },
  library: { kind: "seat", term_months: 12, ip: "domain_class_toolkit" },
  depth_s: { kind: "fuel", units: 40 },
  depth_m: { kind: "fuel", units: 120 },
  depth_l: { kind: "fuel", units: 320 },
};

function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function verifyStripeSignature(rawBody, header, secret) {
  if (!header || !secret) return false;
  const parts = {};
  header.split(",").forEach((p) => {
    const [k, v] = p.split("=");
    if (k && v) parts[k.trim()] = v.trim();
  });
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(t));
  if (age > 300) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${t}.${rawBody}`)
  );
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === v1;
}

function skuFromSession(session) {
  const meta = (session && session.metadata) || {};
  if (meta.sku && SKU_GRANT[meta.sku]) return meta.sku;
  // Fallback: payment_link metadata is on the link; expand not available in webhook body alone
  return meta.sku || null;
}

async function grantAccess(env, { sessionId, sku, email, amountTotal, currency }) {
  const grant = SKU_GRANT[sku];
  if (!grant) {
    return { ok: false, reason: "unknown_sku", sku };
  }
  // Placeholder: persist to your ledger (KV / D1 / API).
  // Do not claim IP unlock without identity gate when product requires it.
  const record = {
    at: new Date().toISOString(),
    session_id: sessionId,
    sku,
    grant,
    email: email || null,
    amount_total: amountTotal,
    currency: currency || "cad",
    status: "granted_pending_ledger",
  };
  if (env.FULFILL_KV) {
    const key = `session:${sessionId}`;
    const existing = await env.FULFILL_KV.get(key);
    if (existing) return { ok: true, idempotent: true, record: JSON.parse(existing) };
    await env.FULFILL_KV.put(key, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 400 });
  }
  return { ok: true, idempotent: false, record };
}

export default {
  async fetch(request, env) {
    if (request.method === "GET") {
      return new Response(
        JSON.stringify({
          service: "dualiscapax-stripe-fulfill",
          status: "up",
          events: ["checkout.session.completed", "checkout.session.async_payment_succeeded"],
        }),
        { headers: { "content-type": "application/json" } }
      );
    }
    if (request.method !== "POST") {
      return new Response("method not allowed", { status: 405 });
    }

    const raw = await request.text();
    const sig = request.headers.get("Stripe-Signature");
    const secret = env.STRIPE_WEBHOOK_SECRET;
    if (!(await verifyStripeSignature(raw, sig, secret))) {
      return new Response("invalid signature", { status: 400 });
    }

    let event;
    try {
      event = JSON.parse(raw);
    } catch {
      return new Response("bad json", { status: 400 });
    }

    const type = event.type;
    if (
      type !== "checkout.session.completed" &&
      type !== "checkout.session.async_payment_succeeded"
    ) {
      return new Response(JSON.stringify({ received: true, ignored: type }), {
        headers: { "content-type": "application/json" },
      });
    }

    const session = event.data && event.data.object;
    if (!session) return new Response("no session", { status: 400 });

    // Only fulfill paid / no_payment_required
    const ps = session.payment_status;
    if (ps && ps !== "paid" && ps !== "no_payment_required") {
      return new Response(JSON.stringify({ received: true, wait: ps }), {
        headers: { "content-type": "application/json" },
      });
    }

    const sku = skuFromSession(session);
    const result = await grantAccess(env, {
      sessionId: session.id,
      sku,
      email: session.customer_details && session.customer_details.email,
      amountTotal: session.amount_total,
      currency: session.currency,
    });

    return new Response(JSON.stringify({ received: true, fulfill: result }), {
      headers: { "content-type": "application/json" },
    });
  },
};
