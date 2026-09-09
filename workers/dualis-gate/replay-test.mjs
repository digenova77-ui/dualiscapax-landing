#!/usr/bin/env node
/* dualis-gate Replay tester — Node 22, zero npm, no network.
   Fixture secret is NOT a Stripe live prefix (secret-scan stays green).
   Five greens + identity fold. Checkout stays closed. */

import { hmacSha256Hex, timingSafeEqualHex } from "./timing-safe-equal.js";
import { verifyStripeWebhook } from "./stripe-hmac-verify.js";
import { acceptStripeEvent } from "./d1-idempotency.js";
import gate from "./dualis-bc.js";

const FIXTURE = "test_replay_not_live";
let failed = 0;

function assert(name, cond, detail) {
  if (cond) {
    console.log("PASS  " + name);
    return;
  }
  failed += 1;
  console.error("FAIL  " + name + (detail ? " — " + detail : ""));
}

function mockD1() {
  const events = new Map();
  const kyc = new Map();
  const session = new Map();
  const fields = new Map();
  const unity = new Map();

  function run(sql, args) {
    const s = String(sql).replace(/\s+/g, " ").trim();
    if (s.startsWith("INSERT INTO webhook_event")) {
      const id = args[0];
      if (events.has(id)) return { meta: { changes: 0 } };
      events.set(id, { event_id: id, event_type: args[1], payload_hash: args[2], unity_id: args[3], created_at: args[4] });
      return { meta: { changes: 1 } };
    }
    if (s.startsWith("INSERT INTO unity_kyc")) {
      kyc.set(args[0], { unity_id: args[0], kyc: args[1] == null ? 1 : args[1] });
      return { meta: { changes: 1 } };
    }
    if (s.startsWith("INSERT INTO unity_session")) {
      session.set(args[0], { session_hash: args[0], unity_id: args[1], created_at: args[2], expires_at: args[3] });
      return { meta: { changes: 1 } };
    }
    if (s.startsWith("INSERT INTO unity_fields")) {
      fields.set(args[0], { unity_id: args[0], name_ok: args[1], updated_at: args[2] });
      return { meta: { changes: 1 } };
    }
    if (s.startsWith("INSERT INTO unity ")) {
      unity.set(args[0], { unity_id: args[0], created_at: args[1], role: args[2] || "person" });
      return { meta: { changes: 1 } };
    }
    if (s.startsWith("UPDATE unity_fields")) {
      const row = fields.get(args[args.length - 1]) || { unity_id: args[args.length - 1] };
      row.declared_name = args[0];
      row.name_ok = args[1];
      row.updated_at = args[2];
      fields.set(row.unity_id, row);
      return { meta: { changes: 1 } };
    }
    return { meta: { changes: 0 } };
  }

  function first(sql, args) {
    const s = String(sql).replace(/\s+/g, " ").trim();
    if (s.includes("FROM unity_session")) {
      const row = session.get(args[0]);
      if (!row) return null;
      if (args[1] != null && row.expires_at <= args[1]) return null;
      return row;
    }
    if (s.includes("FROM unity_fields")) return fields.get(args[0]) || null;
    if (s.includes("FROM unity_kyc")) return kyc.get(args[0]) || null;
    if (s.includes("FROM webhook_event")) return events.get(args[0]) || null;
    return null;
  }

  return {
    events,
    kyc,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            run: async () => run(sql, args),
            first: async () => first(sql, args)
          };
        },
        run: async () => run(sql, []),
        first: async () => first(sql, [])
      };
    }
  };
}

async function signedRequest(path, event, secret, skewSec) {
  const body = JSON.stringify(event);
  const t = String(Math.floor(Date.now() / 1000) + (skewSec || 0));
  const hex = await hmacSha256Hex(t + "." + body, secret);
  return new Request("https://dualiscapax.ai" + path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": "t=" + t + ",v1=" + hex
    },
    body
  });
}

const env = {
  CHECKOUT_OPEN: "false",
  STRIPE_WEBHOOK_SECRET: FIXTURE,
  STRIPE_IDENTITY_SECRET: FIXTURE,
  DB: mockD1()
};

assert("timing-safe equal self", timingSafeEqualHex("abc123", "abc123"));
assert("timing-safe reject mismatch", !timingSafeEqualHex("abc123", "abc124"));
const hx = await hmacSha256Hex("hello", FIXTURE);
assert("hmac hex length", typeof hx === "string" && hx.length === 64, hx);

{
  const req = new Request("https://dualiscapax.ai/hooks/stripe", {
    method: "POST",
    body: JSON.stringify({ id: "evt_nosig", type: "ping" })
  });
  const out = await verifyStripeWebhook(req, FIXTURE);
  assert("no-sig", out.ok === false && out.reason === "no-sig", JSON.stringify(out));
}

{
  const body = JSON.stringify({ id: "evt_bad", type: "ping" });
  const t = String(Math.floor(Date.now() / 1000));
  const req = new Request("https://dualiscapax.ai/hooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": "t=" + t + ",v1=" + "00".repeat(32) },
    body
  });
  const out = await verifyStripeWebhook(req, FIXTURE);
  assert("sig-bad", out.ok === false && out.reason === "sig-bad", JSON.stringify(out));
}

{
  const event = { id: "evt_old", type: "ping" };
  const req = await signedRequest("/hooks/stripe", event, FIXTURE, -400);
  const out = await verifyStripeWebhook(req, FIXTURE);
  assert("sig-age", out.ok === false && out.reason === "sig-age", JSON.stringify(out));
}

{
  const event = { id: "evt_test_1", type: "ping" };
  const req = await signedRequest("/hooks/stripe", event, FIXTURE, 0);
  const verified = await verifyStripeWebhook(req, FIXTURE);
  assert("good verify", verified.ok === true && verified.event && verified.event.id === "evt_test_1", JSON.stringify(verified));
  const acc = await acceptStripeEvent(env, verified.event);
  assert("first accept", acc.duplicate === false, JSON.stringify(acc));
  assert("one row", env.DB.events.size === 1, String(env.DB.events.size));
}

{
  const acc = await acceptStripeEvent(env, { id: "evt_test_1", type: "ping" });
  assert("replay duplicate", acc.duplicate === true, JSON.stringify(acc));
  assert("still one row", env.DB.events.size === 1, String(env.DB.events.size));
}

{
  const event = {
    id: "evt_id_1",
    type: "identity.verification_session.verified",
    data: { object: { metadata: { unity_id: "11111111-1111-1111-1111-111111111111" } } }
  };
  const acc = await acceptStripeEvent(env, event);
  assert("identity accept", acc.duplicate === false, JSON.stringify(acc));
  const row = env.DB.kyc.get("11111111-1111-1111-1111-111111111111");
  assert("unity_kyc folded", !!(row && Number(row.kyc) === 1), JSON.stringify(row));
}

{
  const health = await gate.fetch(new Request("https://dualiscapax.ai/u/health"), env);
  const body = await health.json();
  assert("GET /u/health 200", health.status === 200, String(health.status));
  assert("health checkout false", body.checkout === false, JSON.stringify(body));
}
{
  const intent = await gate.fetch(
    new Request("https://dualiscapax.ai/pay/intent", { method: "POST", body: "{}" }),
    env
  );
  const body = await intent.json();
  assert("POST /pay/intent 403", intent.status === 403, String(intent.status));
  assert("intent closed", body.reason === "closed", JSON.stringify(body));
}
{
  const bad = await gate.fetch(
    new Request("https://dualiscapax.ai/hooks/stripe", {
      method: "POST",
      body: JSON.stringify({ id: "evt_x", type: "ping" })
    }),
    env
  );
  const body = await bad.json();
  assert("hooks no-sig 400", bad.status === 400 && body.ok === false, JSON.stringify(body));
}
{
  const event = { id: "evt_hook_1", type: "checkout.session.completed" };
  const before = env.DB.events.size;
  const req = await signedRequest("/hooks/stripe", event, FIXTURE, 0);
  const res = await gate.fetch(req, env);
  const body = await res.json();
  assert("hooks good 200 closed", res.status === 200 && body.ok === true && body.applied === false, JSON.stringify(body));
  assert("hooks first row appended", env.DB.events.size === before + 1, String(env.DB.events.size));
}
{
  const event = { id: "evt_hook_1", type: "checkout.session.completed" };
  const before = env.DB.events.size;
  const req = await signedRequest("/hooks/stripe", event, FIXTURE, 0);
  const res = await gate.fetch(req, env);
  const body = await res.json();
  assert("hooks replay 200 closed", res.status === 200 && body.ok === true && body.applied === false, JSON.stringify(body));
  assert("hooks replay no second row", env.DB.events.size === before, String(env.DB.events.size));
}

if (failed) {
  console.error("Replay tester: " + failed + " failed. Isolate is not green.");
  process.exit(1);
}
console.log("Replay tester: all greens. Checkout still closed.");
process.exit(0);
