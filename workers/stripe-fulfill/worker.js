/**
 * DualisCapax Stripe fulfill worker
 * Jacket: access.dual.v8
 * Current as of: 2026-09-01
 *
 * Triple jacket — all three must pass or the purchase is NOT granted:
 *   1. Cryptographic jacket  — Stripe-Signature HMAC-SHA256 + 5-min window
 *   2. Identity jacket       — event.id + session.id idempotency (no double credit)
 *   3. Merchandise jacket    — allowlisted SKU AND amount_total in that SKU's CAD cents
 *
 * V8 merchandise law (source: research/payment-links.json):
 *   $499 live URL = Super-Trunk (sku=trunk), NOT master library
 *   $1,499        = master library
 *   $299          = branch (old $149 branch URL retired; $149 still grants branch as legacy)
 *
 * Secrets (never in git): STRIPE_WEBHOOK_SECRET
 * Optional bindings: FULFILL_KV, PAYMENT_LINK_SKU_JSON
 */

const JACKET = "access.dual.v8";

const SKU_GRANT = {
  fuel_10: {
    kind: "fuel",
    units: 10,
    cad: 5,
    allowed_cents: [500],
    label: "10 Fuel",
    delivers: "fuel_credit",
    iris_tier_unlock: "SPARK",
    sku_code: "SKU-001",
  },
  depth_s: {
    kind: "fuel",
    units: 40,
    cad: 20,
    allowed_cents: [2000],
    label: "40 Fuel (trial)",
    delivers: "fuel_credit",
    iris_tier_unlock: "SPARK",
    sku_code: "SKU-002",
  },
  depth_m: {
    kind: "fuel",
    units: 120,
    cad: 50,
    allowed_cents: [5000],
    label: "120 Fuel (practice)",
    delivers: "fuel_credit",
    iris_tier_unlock: "BRANCH",
    sku_code: "SKU-003",
  },
  depth_l: {
    kind: "fuel",
    units: 320,
    cad: 120,
    allowed_cents: [12000],
    label: "320 Fuel (retain)",
    delivers: "fuel_credit",
    iris_tier_unlock: "DEPTH",
    sku_code: "SKU-004",
  },
  fuel_1000: {
    kind: "fuel",
    units: 1000,
    cad: 350,
    allowed_cents: [35000],
    label: "1,000 Fuel",
    delivers: "fuel_credit",
    iris_tier_unlock: "ULTIMATE",
    sku_code: "SKU-005",
  },
  edu_leaf: {
    kind: "seat",
    term_months: 1,
    ip: "overview_30d",
    cad: 19,
    allowed_cents: [1900],
    label: "Educational indication leaf — 30 day",
    delivers: "seat_access",
    sku_code: "SKU-016",
  },
  leaf: {
    kind: "seat",
    term_months: 12,
    ip: "one_room",
    cad: 49,
    allowed_cents: [4900],
    label: "Leaf — one gated room, 12 mo",
    delivers: "seat_access",
    sku_code: "SKU-017",
  },
  branch: {
    kind: "seat",
    term_months: 12,
    ip: "one_field",
    cad: 299,
    allowed_cents: [29900, 14900],
    label: "Branch — subsystem clade, 12 mo",
    delivers: "seat_access",
    sku_code: "SKU-018",
    notes: "V8 list price CAD $299. CAD $149 is legacy test-link only.",
  },
  trunk: {
    kind: "seat",
    term_months: 12,
    ip: "domain_class_toolkit",
    cad: 499,
    allowed_cents: [49900],
    label: "Super-Trunk — one domain class, 12 mo",
    delivers: "seat_access",
    sku_code: "SKU-019",
    notes: "Live $499 Payment Link is Super-Trunk. Not the $1,499 master library.",
  },
  library: {
    kind: "seat",
    term_months: 0,
    perpetual: true,
    ip: "multi_kingdom",
    cad: 1499,
    allowed_cents: [149900],
    label: "Master library — multi-kingdom, perpetual",
    delivers: "seat_access",
    sku_code: "SKU-029",
    notes: "Do not grant library for CAD $499. That amount is trunk.",
  },
};

/** Amount fallback ONLY when metadata.sku is missing. $499 → trunk, never library. */
const AMOUNT_CAD_CENTS_TO_SKU = {
  500: "fuel_10",
  1900: "edu_leaf",
  2000: "depth_s",
  4900: "leaf",
  5000: "depth_m",
  12000: "depth_l",
  14900: "branch",
  29900: "branch",
  35000: "fuel_1000",
  49900: "trunk",
  149900: "library",
};

const ALLOWED_EVENTS = {
  "checkout.session.completed": true,
  "checkout.session.async_payment_succeeded": true,
};

function timingSafeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length || a.length === 0) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function verifyStripeSignature(rawBody, header, secret) {
  if (!header || !secret) return false;
  const parts = { t: null, v1: [] };
  header.split(",").forEach((p) => {
    const eq = p.indexOf("=");
    if (eq < 1) return;
    const k = p.slice(0, eq).trim();
    const v = p.slice(eq + 1).trim();
    if (k === "t") parts.t = v;
    if (k === "v1") parts.v1.push(v);
  });
  if (!parts.t || !parts.v1.length) return false;
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(parts.t));
  if (!Number.isFinite(age) || age > 300) return false;
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
    new TextEncoder().encode(`${parts.t}.${rawBody}`)
  );
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return parts.v1.some((v1) => timingSafeEqualHex(hex, v1));
}

function parseLinkMap(env) {
  if (!env || !env.PAYMENT_LINK_SKU_JSON) return {};
  try {
    const parsed = JSON.parse(env.PAYMENT_LINK_SKU_JSON);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function amountMatchesSku(sku, cents) {
  const grant = SKU_GRANT[sku];
  if (!grant || typeof cents !== "number") return false;
  return grant.allowed_cents.indexOf(cents) !== -1;
}

function skuFromSession(session, env) {
  const meta = (session && session.metadata) || {};
  const candidate = meta.sku || meta.dc_sku || meta.product || null;
  const cents = session && typeof session.amount_total === "number" ? session.amount_total : null;

  if (candidate && SKU_GRANT[candidate]) {
    if (cents != null && !amountMatchesSku(candidate, cents)) {
      return {
        sku: null,
        via: "metadata_amount_mismatch",
        claimed: candidate,
        amount_total: cents,
        expected_cents: SKU_GRANT[candidate].allowed_cents,
      };
    }
    return { sku: candidate, via: "metadata", amount_total: cents };
  }

  const linkMap = parseLinkMap(env);
  const pl =
    session && typeof session.payment_link === "string"
      ? session.payment_link
      : session && session.payment_link && session.payment_link.id;
  if (pl && linkMap[pl] && SKU_GRANT[linkMap[pl]]) {
    const mapped = linkMap[pl];
    if (cents != null && !amountMatchesSku(mapped, cents)) {
      return {
        sku: null,
        via: "payment_link_amount_mismatch",
        claimed: mapped,
        amount_total: cents,
        expected_cents: SKU_GRANT[mapped].allowed_cents,
      };
    }
    return { sku: mapped, via: "payment_link_map", amount_total: cents };
  }

  if (cents != null && AMOUNT_CAD_CENTS_TO_SKU[cents]) {
    return { sku: AMOUNT_CAD_CENTS_TO_SKU[cents], via: "amount_total", amount_total: cents };
  }

  return { sku: null, via: "unresolved", amount_total: cents };
}

function merchandiseJacket(session, resolved) {
  const currency = String((session && session.currency) || "cad").toLowerCase();
  if (currency !== "cad") {
    return { ok: false, reason: "currency_not_cad", currency };
  }
  if (!resolved || !resolved.sku || !SKU_GRANT[resolved.sku]) {
    return {
      ok: false,
      reason: resolved && resolved.via ? resolved.via : "unknown_sku",
      claimed: resolved && resolved.claimed,
      expected_cents: resolved && resolved.expected_cents,
    };
  }
  const cents = session && session.amount_total;
  if (!amountMatchesSku(resolved.sku, cents)) {
    return {
      ok: false,
      reason: "amount_sku_mismatch",
      sku: resolved.sku,
      amount_total: cents,
      expected_cents: SKU_GRANT[resolved.sku].allowed_cents,
    };
  }
  return { ok: true, sku: resolved.sku, via: resolved.via };
}

async function grantAccess(env, { eventId, sessionId, sku, email, amountTotal, currency, via }) {
  const grant = sku ? SKU_GRANT[sku] : null;
  if (!grant) {
    return {
      ok: false,
      reason: "unknown_sku",
      sku,
      via,
      amount_total: amountTotal,
      jacket: JACKET,
      hint: "metadata.sku must be an allowlisted V8 sku and amount_total must match that sku",
    };
  }

  const record = {
    at: new Date().toISOString(),
    jacket: JACKET,
    event_id: eventId || null,
    session_id: sessionId,
    sku,
    via,
    grant,
    email: email || null,
    amount_total: amountTotal,
    currency: currency || "cad",
    status: "granted",
    delivers: grant.delivers,
    client_hint:
      grant.kind === "fuel"
        ? { action: "credit_fuel", units: grant.units, iris_tier: grant.iris_tier_unlock || null }
        : {
            action: "open_seat",
            term_months: grant.term_months,
            perpetual: Boolean(grant.perpetual),
            ip: grant.ip,
            note: "Identity gate still applies for medical/engineering depth rooms",
          },
  };

  if (env && env.FULFILL_KV) {
    if (eventId) {
      const eventKey = `event:${eventId}`;
      const seenEvent = await env.FULFILL_KV.get(eventKey);
      if (seenEvent) return { ok: true, idempotent: true, jacket: "identity", record: JSON.parse(seenEvent) };
    }
    const key = `session:${sessionId}`;
    const existing = await env.FULFILL_KV.get(key);
    if (existing) return { ok: true, idempotent: true, jacket: "identity", record: JSON.parse(existing) };
    await env.FULFILL_KV.put(key, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 400 });
    if (eventId) {
      await env.FULFILL_KV.put(`event:${eventId}`, JSON.stringify(record), {
        expirationTtl: 60 * 60 * 24 * 400,
      });
    }
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

  return { ok: true, idempotent: false, jacket: JACKET, record };
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "GET") {
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/$/, "") || "/";
      if (path === "/skus") {
        return json({
          service: "dualiscapax-stripe-fulfill",
          jacket: JACKET,
          skus: SKU_GRANT,
          amount_fallback_cad_cents: AMOUNT_CAD_CENTS_TO_SKU,
          rule: "metadata.sku preferred. amount_total must match that sku. $499 = trunk, not library.",
        });
      }
      return json({
        service: "dualiscapax-stripe-fulfill",
        status: "up",
        jacket: JACKET,
        events: Object.keys(ALLOWED_EVENTS),
        skus: Object.keys(SKU_GRANT),
        jackets: ["cryptographic", "identity", "merchandise"],
        has_webhook_secret: Boolean(env && env.STRIPE_WEBHOOK_SECRET),
        has_kv: Boolean(env && env.FULFILL_KV),
      });
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
    const sig = request.headers.get("Stripe-Signature") || request.headers.get("stripe-signature");
    const secret = env && env.STRIPE_WEBHOOK_SECRET;
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
    if (type === "checkout.session.async_payment_failed") {
      return json({ received: true, ignored: type, fulfill: { ok: false, reason: "payment_failed" } });
    }
    if (!ALLOWED_EVENTS[type]) {
      return json({ received: true, ignored: type });
    }

    const session = event.data && event.data.object;
    if (!session || !session.id) return new Response("no session", { status: 400 });

    const ps = session.payment_status;
    if (ps && ps !== "paid" && ps !== "no_payment_required") {
      return json({ received: true, wait: ps, fulfill: { ok: false, reason: "not_paid" } });
    }

    const resolved = skuFromSession(session, env);
    const merch = merchandiseJacket(session, resolved);
    if (!merch.ok) {
      return json({
        received: true,
        fulfill: {
          ok: false,
          reason: merch.reason,
          claimed: merch.claimed || resolved.claimed || resolved.sku,
          amount_total: session.amount_total,
          currency: session.currency,
          expected_cents: merch.expected_cents,
          jacket: JACKET,
          hint: "Refused to grant the wrong item. Set metadata.sku to the V8 sku that matches the cents charged.",
        },
      });
    }

    const result = await grantAccess(env, {
      eventId: event.id,
      sessionId: session.id,
      sku: merch.sku,
      via: merch.via,
      email: session.customer_details && session.customer_details.email,
      amountTotal: session.amount_total,
      currency: session.currency,
    });

    return json({ received: true, fulfill: result });
  },
};

export { SKU_GRANT, AMOUNT_CAD_CENTS_TO_SKU, skuFromSession, merchandiseJacket, amountMatchesSku };
