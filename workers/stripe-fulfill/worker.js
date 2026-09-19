/**
 * DualisCapax Stripe fulfill worker
 * Jacket: access.dual.v8
 * HMAC → merchSuperRefine → claimGrantD1 (evt_ + cs_ + atom + fuel lot) → persist
 * D1 success never falls through to KV fuel += .
 */

import { merchSuperRefine, merchIssuesToFulfill } from "./merch-refine.js";
import { claimGrantD1, claimDualKv, finalizeKv, dualisAtom } from "./idempotency.js";

/** Factory artifact tip — UNSTAMPED until factory/tools/stamp_artifact_tip.mjs runs. */
export const DC_ARTIFACT_TIP = "UNSTAMPED";

const JACKET = "access.dual.v8";

const SKU_GRANT = {
  fuel_10: { kind: "fuel", units: 10, cad: 5, allowed_cents: [500], label: "10 Fuel", delivers: "fuel_credit", sku_catalog_label: "SPARK", sku_code: "SKU-001" },
  depth_s: { kind: "fuel", units: 40, cad: 20, allowed_cents: [2000], label: "40 Fuel (trial)", delivers: "fuel_credit", sku_catalog_label: "SPARK", sku_code: "SKU-002" },
  depth_m: { kind: "fuel", units: 120, cad: 50, allowed_cents: [5000], label: "120 Fuel (practice)", delivers: "fuel_credit", sku_catalog_label: "BRANCH", sku_code: "SKU-003" },
  depth_l: { kind: "fuel", units: 320, cad: 120, allowed_cents: [12000], label: "320 Fuel (retain)", delivers: "fuel_credit", sku_catalog_label: "DEPTH", sku_code: "SKU-004" },
  fuel_1000: { kind: "fuel", units: 1000, cad: 350, allowed_cents: [35000], label: "1,000 Fuel", delivers: "fuel_credit", sku_catalog_label: "ULTIMATE", sku_code: "SKU-005" },
  edu_leaf: { kind: "seat", term_months: 1, ip: "overview_30d", cad: 19, allowed_cents: [1900], label: "Educational indication leaf — 30 day", delivers: "seat_access", sku_code: "SKU-016" },
  leaf: { kind: "seat", term_months: 12, ip: "one_room", cad: 49, allowed_cents: [4900], label: "Leaf — one gated room, 12 mo", delivers: "seat_access", sku_code: "SKU-017" },
  branch: { kind: "seat", term_months: 12, ip: "one_field", cad: 299, allowed_cents: [29900, 14900], label: "Branch — subsystem clade, 12 mo", delivers: "seat_access", sku_code: "SKU-018" },
  trunk: { kind: "seat", term_months: 12, ip: "domain_class_toolkit", cad: 499, allowed_cents: [49900], label: "Super-Trunk — one domain class, 12 mo", delivers: "seat_access", sku_code: "SKU-019" },
  library: { kind: "seat", term_months: 0, perpetual: true, ip: "atlas_index", cad: 1499, allowed_cents: [149900], label: "Atlas / index — not ALS, not MS, not the vault", delivers: "seat_access", sku_code: "SKU-029" }
};

const AMOUNT_CAD_CENTS_TO_SKU = {
  500: "fuel_10", 1900: "edu_leaf", 2000: "depth_s", 4900: "leaf", 5000: "depth_m",
  12000: "depth_l", 14900: "branch", 29900: "branch", 35000: "fuel_1000", 49900: "trunk", 149900: "library"
};

const ALLOWED_EVENTS = {
  "checkout.session.completed": true,
  "checkout.session.async_payment_succeeded": true
};

function db(env) {
  return (env && (env.DB || env.FULFILL_DB || env.FULFILLMENTS)) || null;
}

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
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${parts.t}.${rawBody}`));
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
      return { sku: null, via: "metadata_amount_mismatch", claimed: candidate, amount_total: cents, expected_cents: SKU_GRANT[candidate].allowed_cents };
    }
    return { sku: candidate, via: "metadata", amount_total: cents };
  }
  const linkMap = parseLinkMap(env);
  const pl = session && typeof session.payment_link === "string" ? session.payment_link : session && session.payment_link && session.payment_link.id;
  if (pl && linkMap[pl] && SKU_GRANT[linkMap[pl]]) {
    const mapped = linkMap[pl];
    if (cents != null && !amountMatchesSku(mapped, cents)) {
      return { sku: null, via: "payment_link_amount_mismatch", claimed: mapped, amount_total: cents, expected_cents: SKU_GRANT[mapped].allowed_cents };
    }
    return { sku: mapped, via: "payment_link_map", amount_total: cents };
  }
  if (cents != null && AMOUNT_CAD_CENTS_TO_SKU[cents]) {
    return { sku: AMOUNT_CAD_CENTS_TO_SKU[cents], via: "amount_total", amount_total: cents };
  }
  return { sku: null, via: "unresolved", amount_total: cents };
}

function merchandiseJacket(session, resolved) {
  const result = merchSuperRefine(
    { sku: resolved && resolved.sku, cents: session && session.amount_total, currency: session && session.currency, via: resolved && resolved.via },
    SKU_GRANT
  );
  const out = merchIssuesToFulfill(result);
  if (out.ok) return { ok: true, sku: resolved.sku, via: resolved.via, reasons: [] };
  return out;
}

function atomFromSession(session, sku) {
  const meta = (session && session.metadata) || {};
  return dualisAtom({
    sku: sku || meta.sku || meta.dc_sku,
    host: meta.host || meta.dc_host,
    window: meta.window || meta.dc_window,
    payer: meta.payer || meta.dc_payer || (session.customer_details && session.customer_details.email),
    sessionId: session && session.id
  });
}


/** entitlements.tier column name is privileged-looking; values are CLAIM_ONLY.
 *  Never echo legacy SPARK/BRANCH/DEPTH/ULTIMATE/GRANTED as Iris AUTHORIZED.
 */
function demoteEntitlementRecord(rec) {
  if (!rec || typeof rec !== "object") return null;
  const raw = rec.tier;
  const out = Object.assign({}, rec);
  out.tier = "CLAIM_ONLY";
  out.tier_claim_authority = "CLAIM_ONLY";
  out.sku_catalog_claim =
    raw && !["CLAIM_ONLY", "GRANTED", "UNRESOLVED"].includes(String(raw))
      ? String(raw)
      : rec.sku || null;
  out.iris_kernel_authorized = false;
  return out;
}

async function grantAccess(env, { eventId, eventType, sessionId, sku, email, amountTotal, currency, via, atom }) {
  const grant = sku ? SKU_GRANT[sku] : null;
  if (!grant) return { ok: false, reason: "unknown_sku", sku, via, amount_total: amountTotal, jacket: JACKET };
  if (!eventId) return { ok: false, reason: "missing_event_id", jacket: "identity" };

  const database = db(env);
  const kv = env && env.FULFILL_KV;
  if (!database && !kv) return { ok: false, reason: "store_unbound", jacket: "identity", persist: false };

  if (database) {
    try {
      const fuelRow =
        grant.kind === "fuel" && Number(grant.units) > 0 && sessionId
          ? {
              session_id: sessionId,
              event_id: eventId,
              email: email || "unbound@local",
              units: grant.units,
              sku
            }
          : null;
      const grantRow = atom
        ? { atom, event_id: eventId, session_id: sessionId, sku }
        : null;
      const claimed = await claimGrantD1(
        database,
        { event_id: eventId, event_type: eventType || "checkout", session_id: sessionId },
        {
          session_id: sessionId,
          event_id: eventId,
          token_id: eventId,
          email: email || "unbound@local",
          tier: "CLAIM_ONLY",  // column name residual; value is never Iris AUTHORIZED
          tier_claim_authority: "CLAIM_ONLY",
          sku,
          amount_cad_cents: amountTotal,
          currency: currency || "cad",
          status: "granted"
        },
        fuelRow,
        grantRow
      );
      if (claimed.used) {
        return {
          ok: true,
          idempotent: Boolean(claimed.idempotent),
          jacket: claimed.idempotent ? "identity" : JACKET,
          store: "d1",
          atom: atom || null,
          record: demoteEntitlementRecord(claimed.entitlement) || null,
          fuel: claimed.fuel || null,
          grant: claimed.grant || null,
          authority_effect: "NONE",
          iris_kernel_authorized: false,
          sku_catalog_label: grant.sku_catalog_label || sku || null,
          note: "D1 fulfill row is LEDGER_PRESENT; entitlements.tier is CLAIM_ONLY (not Iris AUTHORIZED); sku_catalog_label is catalog only"
        };
      }
    } catch (err) {
      if (!kv) {
        return { ok: false, reason: "d1_error", jacket: "identity", error: String(err && err.message ? err.message : err) };
      }
    }
  }

  // KV cannot independently mint an authoritative grant (race + no ledger).
  const kvClaim = await claimDualKv(kv, eventId, sessionId, {
    event_id: eventId,
    session_id: sessionId,
    sku,
    atom: atom || null,
    status: "pending"
  });
  if (kvClaim.used && kvClaim.idempotent) {
    return {
      ok: false,
      idempotent: true,
      authoritative: false,
      authority_effect: "NONE",
      jacket: "identity",
      store: "kv",
      via: kvClaim.via,
      record: kvClaim.record,
      reason: "KV_OBSERVATION_ONLY",
      note: "Prior KV observation is not an authoritative grant"
    };
  }

  return {
    ok: false,
    idempotent: false,
    authoritative: false,
    authority_effect: "NONE",
    jacket: "identity",
    store: kv ? "kv" : "none",
    reason: kvClaim.reason || "KV_CANNOT_MINT_GRANT",
    note: "Fail closed: D1 claimGrant required; KV cannot mint grant"
  };
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" }
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "GET") {
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/$/, "") || "/";
      if (path === "/skus") {
        return json({ service: "dualiscapax-stripe-fulfill", jacket: JACKET, skus: SKU_GRANT, amount_fallback_cad_cents: AMOUNT_CAD_CENTS_TO_SKU, rule: "metadata.sku preferred. $499 = trunk, not atlas.", authority_effect: "NONE", note: "sku_catalog_label values are SKU catalog labels, not Iris kernel AUTHORIZED; D1 entitlements.tier is CLAIM_ONLY" });
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
        has_d1: Boolean(db(env)),
        idempotency: "evt_ plus cs_ plus atom; D1 write-once lots; no KV fuel +="
      });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "content-type, stripe-signature" } });
    }
    if (request.method !== "POST") return new Response("method not allowed", { status: 405 });

    const raw = await request.text();
    const sig = request.headers.get("Stripe-Signature") || request.headers.get("stripe-signature");
    if (!(await verifyStripeSignature(raw, sig, env && env.STRIPE_WEBHOOK_SECRET))) {
      return new Response("invalid signature", { status: 400 });
    }
    let event;
    try { event = JSON.parse(raw); } catch { return new Response("bad json", { status: 400 }); }

    const type = event.type;
    if (type === "checkout.session.async_payment_failed") {
      return json({ received: true, ignored: type, fulfill: { ok: false, reason: "payment_failed" } });
    }
    if (!ALLOWED_EVENTS[type]) return json({ received: true, ignored: type });
    if (!event.id) return json({ received: true, fulfill: { ok: false, reason: "missing_event_id" } }, 400);

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
          reasons: merch.reasons || [],
          claimed: merch.claimed || resolved.claimed || resolved.sku,
          amount_total: session.amount_total,
          currency: session.currency,
          expected_cents: merch.expected_cents,
          jacket: JACKET
        }
      });
    }

    const result = await grantAccess(env, {
      eventId: event.id,
      eventType: type,
      sessionId: session.id,
      sku: merch.sku,
      via: merch.via,
      email: session.customer_details && session.customer_details.email,
      amountTotal: session.amount_total,
      currency: session.currency,
      atom: atomFromSession(session, merch.sku)
    });
    return json({ received: true, fulfill: result });
  }
};

export { SKU_GRANT, AMOUNT_CAD_CENTS_TO_SKU, skuFromSession, merchandiseJacket, amountMatchesSku, atomFromSession };
