/**
 * DualisCapax Stripe fulfill worker
 * Current as of: 2026-08-31
 *
 * Every gated purchase must grant exactly what was sold:
 *   depth_s/m/l → Fuel units
 *   leaf/branch/library → seat term + IP class
 *
 * Resolution order for sku:
 *   1. session.metadata.sku
 *   2. session.metadata.dc_sku
 *   3. amount_total (CAD cents) fallback table
 *   4. payment_link id map (if configured in env JSON)
 *
 * Secrets (never in git): STRIPE_WEBHOOK_SECRET
 * Optional: FULFILL_KV, PAYMENT_LINK_SKU_JSON
 */

const SKU_GRANT = {
  leaf: {
    kind: "seat",
    term_months: 12,
    ip: "one_room",
    cad: 49,
    label: "Leaf — one gated room, 12 mo",
    delivers: "seat_access",
  },
  branch: {
    kind: "seat",
    term_months: 12,
    ip: "one_field",
    cad: 149,
    label: "Branch — one field, 12 mo",
    delivers: "seat_access",
  },
  library: {
    kind: "seat",
    term_months: 12,
    ip: "domain_class_toolkit",
    cad: 499,
    label: "Library — one domain class toolkit, 12 mo (not full vault)",
    delivers: "seat_access",
  },
  depth_s: {
    kind: "fuel",
    units: 40,
    cad: 20,
    label: "40 Fuel (trial)",
    delivers: "fuel_credit",
    iris_tier_unlock: "SPARK",
  },
  depth_m: {
    kind: "fuel",
    units: 120,
    cad: 50,
    label: "120 Fuel (practice)",
    delivers: "fuel_credit",
    iris_tier_unlock: "BRANCH",
  },
  depth_l: {
    kind: "fuel",
    units: 320,
    cad: 120,
    label: "320 Fuel (retain)",
    delivers: "fuel_credit",
    iris_tier_unlock: "DEPTH",
  },
};

/** CAD cents → sku when Payment Link metadata is missing */
const AMOUNT_CAD_CENTS_TO_SKU = {
  2000: "depth_s", // $20
  5000: "depth_m", // $50
  12000: "depth_l", // $120
  4900: "leaf", // $49
  14900: "branch", // $149
  49900: "library", // $499
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

function parseLinkMap(env) {
  if (!env.PAYMENT_LINK_SKU_JSON) return {};
  try {
    return JSON.parse(env.PAYMENT_LINK_SKU_JSON);
  } catch {
    return {};
  }
}

function skuFromSession(session, env) {
  const meta = (session && session.metadata) || {};
  const candidate = meta.sku || meta.dc_sku || meta.product || null;
  if (candidate && SKU_GRANT[candidate]) return { sku: candidate, via: "metadata" };

  const linkMap = parseLinkMap(env);
  const pl =
    typeof session.payment_link === "string"
      ? session.payment_link
      : session.payment_link && session.payment_link.id;
  if (pl && linkMap[pl] && SKU_GRANT[linkMap[pl]]) {
    return { sku: linkMap[pl], via: "payment_link_map" };
  }

  const cents = session.amount_total;
  if (typeof cents === "number" && AMOUNT_CAD_CENTS_TO_SKU[cents]) {
    return { sku: AMOUNT_CAD_CENTS_TO_SKU[cents], via: "amount_total" };
  }

  return { sku: null, via: "unresolved" };
}

async function grantAccess(env, { sessionId, sku, email, amountTotal, currency, via }) {
  const grant = sku ? SKU_GRANT[sku] : null;
  if (!grant) {
    return {
      ok: false,
      reason: "unknown_sku",
      sku,
      via,
      amount_total: amountTotal,
      hint: "Set metadata.sku on the Payment Link (leaf|branch|library|depth_s|depth_m|depth_l) or match CAD amount",
    };
  }

  const record = {
    at: new Date().toISOString(),
    session_id: sessionId,
    sku,
    via,
    grant,
    email: email || null,
    amount_total: amountTotal,
    currency: currency || "cad",
    status: "granted",
    delivers: grant.delivers,
    // Client may apply fuel locally with this receipt until server ledger is authoritative
    client_hint:
      grant.kind === "fuel"
        ? { action: "credit_fuel", units: grant.units, iris_tier: grant.iris_tier_unlock || null }
        : {
            action: "open_seat",
            term_months: grant.term_months,
            ip: grant.ip,
            note: "Identity gate still applies for medical/engineering depth rooms",
          },
  };

  if (env.FULFILL_KV) {
    const key = `session:${sessionId}`;
    const existing = await env.FULFILL_KV.get(key);
    if (existing) return { ok: true, idempotent: true, record: JSON.parse(existing) };
    await env.FULFILL_KV.put(key, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 400 });

    if (email && grant.kind === "fuel") {
      const ek = `fuel:${email.toLowerCase()}`;
      const prev = Number((await env.FULFILL_KV.get(ek)) || 0);
      await env.FULFILL_KV.put(ek, String(prev + grant.units), { expirationTtl: 60 * 60 * 24 * 400 });
      record.fuel_balance_after = prev + grant.units;
    }
    if (email && grant.kind === "seat") {
      const sk = `seat:${email.toLowerCase()}:${sku}`;
      await env.FULFILL_KV.put(sk, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 400 });
    }
  }

  return { ok: true, idempotent: false, record };
}

export default {
  async fetch(request, env) {
    if (request.method === "GET") {
      const url = new URL(request.url);
      if (url.pathname.replace(/\/$/, "") === "/skus") {
        return new Response(
          JSON.stringify({
            service: "dualiscapax-stripe-fulfill",
            skus: SKU_GRANT,
            amount_fallback_cad_cents: AMOUNT_CAD_CENTS_TO_SKU,
            rule: "Every gated object must resolve to a grant. metadata.sku preferred.",
          }),
          { headers: { "content-type": "application/json", "access-control-allow-origin": "*" } }
        );
      }
      return new Response(
        JSON.stringify({
          service: "dualiscapax-stripe-fulfill",
          status: "up",
          events: [
            "checkout.session.completed",
            "checkout.session.async_payment_succeeded",
          ],
          skus: Object.keys(SKU_GRANT),
          has_webhook_secret: Boolean(env.STRIPE_WEBHOOK_SECRET),
          has_kv: Boolean(env.FULFILL_KV),
        }),
        { headers: { "content-type": "application/json" } }
      );
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, POST, OPTIONS",
          "access-control-allow-headers": "content-type, stripe-signature",
        },
      });
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

    const ps = session.payment_status;
    if (ps && ps !== "paid" && ps !== "no_payment_required") {
      return new Response(JSON.stringify({ received: true, wait: ps }), {
        headers: { "content-type": "application/json" },
      });
    }

    const resolved = skuFromSession(session, env);
    const result = await grantAccess(env, {
      sessionId: session.id,
      sku: resolved.sku,
      via: resolved.via,
      email: session.customer_details && session.customer_details.email,
      amountTotal: session.amount_total,
      currency: session.currency,
    });

    return new Response(JSON.stringify({ received: true, fulfill: result }), {
      headers: { "content-type": "application/json" },
    });
  },
};
