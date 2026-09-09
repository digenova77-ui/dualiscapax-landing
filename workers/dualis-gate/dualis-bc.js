/* Dualis Phase B+C gate. Pages owns /. This Worker owns /u /hooks /pay only.
   Fail closed. CHECKOUT_OPEN stays false until Bind-continue. */

import { verifyStripeWebhook } from "./stripe-hmac-verify.js";
import { acceptStripeEvent } from "./d1-idempotency.js";
import { hmacSha256Hex } from "./timing-safe-equal.js";

const ALLOW_ORIGINS = [
  "https://dualiscapax.ai",
  "https://www.dualiscapax.ai"
];

function cors(origin) {
  const allow = ALLOW_ORIGINS.includes(origin) ? origin : ALLOW_ORIGINS[0];
  return {
    "access-control-allow-origin": allow,
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "content-type, stripe-signature",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...cors(origin) }
  });
}

function checkoutOpen(env) {
  return String(env.CHECKOUT_OPEN || "") === "true";
}

async function sha256Hex(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function cookieToken() {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function sessionCookie(token) {
  return `dc_u=${token}; Path=/u; HttpOnly; Secure; SameSite=Lax; Max-Age=1209600`;
}

async function sessionOf(request, env) {
  const raw = (request.headers.get("Cookie") || "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("dc_u="));
  if (!raw) return null;
  const token = raw.slice(5);
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  const hash = await sha256Hex(token);
  const row = await env.DB.prepare(
    `SELECT unity_id FROM unity_session
     WHERE session_hash = ?1 AND expires_at > ?2`
  ).bind(hash, Date.now()).first();
  return row ? { unityId: row.unity_id } : null;
}

function publicFields(row, kyc) {
  if (!row) return {};
  return {
    unityId: row.unity_id,
    declaredName: row.name_ok ? row.declared_name : null,
    nameOk: !!row.name_ok,
    locale: row.locale || null,
    lastRoom: row.last_room || null,
    kyc: !!kyc,
    workAttested: !!row.work_attested
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(origin) });
    }

    if (!env.DB) return json({ ok: false, reason: "no-db" }, 500, origin);

    if (path === "/u/health" && request.method === "GET") {
      return json({ ok: true, phase: "B+C", checkout: checkoutOpen(env) }, 200, origin);
    }

    if (path === "/u/fields" && request.method === "GET") {
      const ses = await sessionOf(request, env);
      if (!ses) return json({}, 200, origin);
      const fields = await env.DB.prepare(
        `SELECT * FROM unity_fields WHERE unity_id = ?1`
      ).bind(ses.unityId).first();
      const kyc = await env.DB.prepare(
        `SELECT kyc FROM unity_kyc WHERE unity_id = ?1`
      ).bind(ses.unityId).first();
      return json(publicFields(fields, kyc && kyc.kyc), 200, origin);
    }

    if (path === "/u/session" && request.method === "POST") {
      const now = Date.now();
      const unityId = crypto.randomUUID();
      await env.DB.prepare(
        `INSERT INTO unity (unity_id, created_at, role) VALUES (?1, ?2, 'person')`
      ).bind(unityId, now).run();
      await env.DB.prepare(
        `INSERT INTO unity_fields (unity_id, name_ok, updated_at) VALUES (?1, 0, ?2)`
      ).bind(unityId, now).run();
      const token = cookieToken();
      const hash = await sha256Hex(token);
      await env.DB.prepare(
        `INSERT INTO unity_session (session_hash, unity_id, created_at, expires_at)
         VALUES (?1, ?2, ?3, ?4)`
      ).bind(hash, unityId, now, now + 14 * 86400 * 1000).run();
      const res = json({ ok: true, guest: true }, 200, origin);
      res.headers.append("set-cookie", sessionCookie(token));
      return res;
    }

    if (path === "/u/name" && request.method === "POST") {
      const ses = await sessionOf(request, env);
      if (!ses) return json({ ok: false, reason: "no-session" }, 401, origin);
      let body;
      try { body = await request.json(); } catch {
        return json({ ok: false, reason: "json" }, 400, origin);
      }
      const name = String(body.declaredName || "").trim().slice(0, 80);
      const nameOk = body.nameOk === true && name.length > 0;
      await env.DB.prepare(
        `UPDATE unity_fields SET declared_name = ?2, name_ok = ?3, updated_at = ?4 WHERE unity_id = ?1`
      ).bind(ses.unityId, name || null, nameOk ? 1 : 0, Date.now()).run();
      return json({ ok: true, nameOk }, 200, origin);
    }

    if (path === "/hooks/identity" && request.method === "POST") {
      const verified = await verifyStripeWebhook(request, env.STRIPE_IDENTITY_SECRET);
      if (!verified.ok) return json({ ok: false, reason: verified.reason }, 400, origin);
      const out = await acceptStripeEvent(env, verified.event);
      return json({ ok: true, duplicate: !!out.duplicate }, 200, origin);
    }

    if (path === "/pay/quote" && request.method === "GET") {
      return json(
        { open: checkoutOpen(env), residual: "unpublished", rails: "/hall/rails.html" },
        200, origin
      );
    }

    if (path === "/pay/intent" && request.method === "POST") {
      if (!checkoutOpen(env)) return json({ ok: false, reason: "closed" }, 403, origin);
      return json({ ok: false, reason: "not-wired" }, 503, origin);
    }

    if (path === "/hooks/stripe" && request.method === "POST") {
      const verified = await verifyStripeWebhook(request, env.STRIPE_WEBHOOK_SECRET);
      if (!verified.ok) return json({ ok: false, reason: verified.reason }, 400, origin);
      if (!checkoutOpen(env)) {
        await acceptStripeEvent(env, verified.event);
        return json({ ok: true, applied: false, reason: "closed" }, 200, origin);
      }
      const ev = verified.event;
      if (ev.type === "checkout.session.completed" || ev.type === "invoice.paid") {
        const out = await acceptStripeEvent(env, ev);
        return json({ ok: true, duplicate: !!out.duplicate }, 200, origin);
      }
      return json({ ok: true, ignored: ev.type }, 200, origin);
    }

    void hmacSha256Hex;
    return json({ ok: false, reason: "no-route" }, 404, origin);
  }
};
