import {
  generateAuthenticationOptions, generateRegistrationOptions,
  verifyAuthenticationResponse, verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { CHALLENGE_TTL_SECONDS, SESSION_TTL_SECONDS, cookieValue, normalizeHandle, originAllowed, safeJsonBody, sessionCookie } from "./identity-core.mjs";

const RP_ID = "dualiscapax.com";
const APP_ORIGIN = "https://dualiscapax.com";
const encoder = new TextEncoder();
const json = (status, body, headers = {}) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json", "cache-control": "no-store", "x-content-type-options": "nosniff", ...headers },
});
const randomToken = (n = 32) => {
  const bytes = crypto.getRandomValues(new Uint8Array(n));
  let binary = ""; for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};
async function digest(value) {
  const bytes = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
}
async function parseBody(request) {
  if (!(request.headers.get("content-type") || "").toLowerCase().includes("application/json")) return { error: "unsupported-media-type", status: 415 };
  let body; try { body = await request.json(); } catch { return { error: "invalid-json", status: 400 }; }
  return safeJsonBody(body) ? { body } : { error: "invalid-body", status: 400 };
}
function store(env) { return env.UNITY_IDENTITY_STORE.get(env.UNITY_IDENTITY_STORE.idFromName("unity-identity-global")); }
async function callStore(env, path, body) {
  return store(env).fetch("https://identity-store" + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") return json(200, { ok: true, service: "unity-passkey-identity", mode: "isolated-staging", rp_id: RP_ID });
    if (request.method === "OPTIONS") return json(405, { ok: false, reason: "method-not-allowed" });
    if (url.protocol !== "https:" || !originAllowed(request, APP_ORIGIN)) return json(403, { ok: false, reason: "origin-denied" });

    if (url.pathname === "/check" && request.method === "POST") {
      const token = cookieValue(request.headers.get("cookie"));
      if (!token) return json(401, { ok: false, verified: false, reason: "session-required" });
      const result = await callStore(env, "/session/check", { token_hash: await digest(token) });
      const data = await result.json();
      if (!result.ok || data.verified !== true || typeof data.unity_id !== "string") return json(401, { ok: false, verified: false, reason: "session-invalid" });
      return json(200, { ok: true, verified: true, unity_id: data.unity_id });
    }
    if (url.pathname === "/logout" && request.method === "POST") {
      const token = cookieValue(request.headers.get("cookie"));
      if (token) await callStore(env, "/session/revoke", { token_hash: await digest(token) });
      return json(200, { ok: true }, { "set-cookie": "__Host-unity_session=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Strict" });
    }
    const routes = ["/register/options", "/register/verify", "/authenticate/options", "/authenticate/verify"];
    if (request.method !== "POST" || !routes.includes(url.pathname)) return json(404, { ok: false, reason: "not-found" });
    const parsed = await parseBody(request);
    if (parsed.error) return json(parsed.status, { ok: false, reason: parsed.error });
    const body = parsed.body;
    const ip = (request.headers.get("cf-connecting-ip") || "unknown").slice(0, 80);
    const rate = await callStore(env, "/rate/check", { key: "rate:" + ip, limit: 20, window_seconds: 60 });
    if (!rate.ok) return json(503, { ok: false, reason: "rate-store-unavailable" });
    if ((await rate.json()).allowed !== true) return json(429, { ok: false, reason: "rate-limited" });

    if (url.pathname === "/register/options") {
      const handle = normalizeHandle(body.handle);
      if (!handle) return json(400, { ok: false, reason: "invalid-handle" });
      const exists = await callStore(env, "/account/exists", { handle });
      if (!exists.ok) return json(503, { ok: false, reason: "identity-store-unavailable" });
      if ((await exists.json()).exists) return json(409, { ok: false, reason: "handle-already-registered" });
      const userId = crypto.getRandomValues(new Uint8Array(32));
      const options = await generateRegistrationOptions({
        rpName: "DualisCapax", rpID: RP_ID, userName: handle, userDisplayName: handle,
        userID: userId, attestationType: "none", timeout: 60_000,
        authenticatorSelection: { residentKey: "required", userVerification: "required" },
        supportedAlgorithmIDs: [-7, -257],
      });
      const saved = await callStore(env, "/challenge/put", { challenge: options.challenge, kind: "registration", handle, user_id: Array.from(userId), expires_at: Date.now() + CHALLENGE_TTL_SECONDS * 1000 });
      if (!saved.ok) return json(503, { ok: false, reason: "challenge-store-unavailable" });
      return json(200, { options });
    }
    if (url.pathname === "/register/verify") {
      if (!body.credential || typeof body.challenge !== "string") return json(400, { ok: false, reason: "credential-and-challenge-required" });
      const consumed = await callStore(env, "/challenge/consume", { challenge: body.challenge, kind: "registration" });
      if (!consumed.ok) return json(403, { ok: false, reason: "challenge-invalid-or-expired" });
      const pending = await consumed.json();
      let verified;
      try {
        verified = await verifyRegistrationResponse({ response: body.credential, expectedChallenge: pending.challenge, expectedOrigin: APP_ORIGIN, expectedRPID: RP_ID, requireUserVerification: true });
      } catch { return json(400, { ok: false, reason: "registration-verification-failed" }); }
      const credential = verified.registrationInfo?.credential;
      if (!verified.verified || !credential) return json(403, { ok: false, reason: "registration-not-verified" });
      const unityId = "unity_" + randomToken(18);
      const created = await callStore(env, "/credential/create", { handle: pending.handle, unity_id: unityId, credential: {
        id: credential.id, public_key: Array.from(credential.publicKey), counter: credential.counter,
        transports: Array.isArray(body.credential.response?.transports) ? body.credential.response.transports : [],
      } });
      if (created.status === 409) return json(409, { ok: false, reason: "credential-already-registered" });
      if (!created.ok) return json(503, { ok: false, reason: "credential-store-unavailable" });
      const token = randomToken();
      const session = await callStore(env, "/session/create", { token_hash: await digest(token), unity_id: unityId, expires_at: Date.now() + SESSION_TTL_SECONDS * 1000 });
      if (!session.ok) return json(503, { ok: false, reason: "session-store-unavailable" });
      return json(200, { ok: true, verified: true, unity_id: unityId }, { "set-cookie": sessionCookie(token) });
    }
    if (url.pathname === "/authenticate/options") {
      const options = await generateAuthenticationOptions({ rpID: RP_ID, timeout: 60_000, userVerification: "required" });
      const saved = await callStore(env, "/challenge/put", { challenge: options.challenge, kind: "authentication", expires_at: Date.now() + CHALLENGE_TTL_SECONDS * 1000 });
      if (!saved.ok) return json(503, { ok: false, reason: "challenge-store-unavailable" });
      return json(200, { options });
    }
    if (url.pathname === "/authenticate/verify") {
      if (!body.credential || typeof body.credential.id !== "string" || typeof body.challenge !== "string") return json(400, { ok: false, reason: "credential-and-challenge-required" });
      const consumed = await callStore(env, "/challenge/consume", { challenge: body.challenge, kind: "authentication" });
      if (!consumed.ok) return json(403, { ok: false, reason: "challenge-invalid-or-expired" });
      const pending = await consumed.json();
      const found = await callStore(env, "/credential/get", { id: body.credential.id });
      if (!found.ok) return json(403, { ok: false, reason: "credential-unknown" });
      const stored = await found.json();
      let verified;
      try {
        verified = await verifyAuthenticationResponse({
          response: body.credential, expectedChallenge: pending.challenge, expectedOrigin: APP_ORIGIN, expectedRPID: RP_ID,
          credential: { id: stored.credential.id, publicKey: new Uint8Array(stored.credential.public_key), counter: stored.credential.counter, transports: stored.credential.transports },
          requireUserVerification: true,
        });
      } catch { return json(403, { ok: false, reason: "authentication-verification-failed" }); }
      const nextCounter = verified.authenticationInfo?.newCounter;
      if (!verified.verified || !Number.isSafeInteger(nextCounter) || nextCounter <= stored.credential.counter) return json(403, { ok: false, reason: "assertion-not-verified" });
      const updated = await callStore(env, "/credential/counter", { id: body.credential.id, counter: nextCounter });
      if (!updated.ok) return json(409, { ok: false, reason: "credential-counter-conflict" });
      const token = randomToken();
      const session = await callStore(env, "/session/create", { token_hash: await digest(token), unity_id: stored.unity_id, expires_at: Date.now() + SESSION_TTL_SECONDS * 1000 });
      if (!session.ok) return json(503, { ok: false, reason: "session-store-unavailable" });
      return json(200, { ok: true, verified: true, unity_id: stored.unity_id }, { "set-cookie": sessionCookie(token) });
    }
    return json(404, { ok: false, reason: "not-found" });
  },
};

export class UnityIdentityStore {
  constructor(state) { this.state = state; }
  async fetch(request) {
    if (request.method !== "POST") return json(405, { ok: false });
    let body; try { body = await request.json(); } catch { return json(400, { ok: false }); }
    const path = new URL(request.url).pathname, now = Date.now();
    if (path === "/rate/check") {
      const key = typeof body.key === "string" ? body.key : "rate:unknown";
      const limit = Math.min(100, Math.max(1, Number(body.limit) || 20));
      const windowMs = Math.min(300_000, Math.max(1_000, Number(body.window_seconds) || 60)) * 1000;
      const allowed = await this.state.storage.transaction(async txn => {
        const prior = await txn.get(key);
        const current = !prior || now - prior.started_at >= windowMs ? { started_at: now, count: 0 } : prior;
        if (current.count >= limit) return false;
        await txn.put(key, { started_at: current.started_at, count: current.count + 1 }); return true;
      });
      return json(200, { allowed });
    }
    if (path === "/challenge/put") {
      if (typeof body.challenge !== "string" || typeof body.kind !== "string" || !Number.isFinite(body.expires_at)) return json(400, { ok: false });
      await this.state.storage.put("challenge:" + body.challenge, body); return json(200, { ok: true });
    }
    if (path === "/challenge/consume") {
      const pending = await this.state.storage.transaction(async txn => {
        const key = "challenge:" + body.challenge, value = await txn.get(key);
        if (!value || value.kind !== body.kind || value.expires_at <= now) return null;
        await txn.delete(key); return value;
      });
      return pending ? json(200, pending) : json(403, { ok: false });
    }
    if (path === "/account/exists") return json(200, { exists: !!(await this.state.storage.get("handle:" + body.handle)) });
    if (path === "/credential/create") {
      const c = body.credential;
      if (!body.handle || !body.unity_id || !c?.id || !Array.isArray(c.public_key)) return json(400, { ok: false });
      const created = await this.state.storage.transaction(async txn => {
        if (await txn.get("handle:" + body.handle) || await txn.get("credential:" + c.id)) return false;
        const record = { handle: body.handle, unity_id: body.unity_id, credential: c };
        await txn.put("handle:" + body.handle, record); await txn.put("credential:" + c.id, record); return true;
      });
      return created ? json(200, { ok: true }) : json(409, { ok: false });
    }
    if (path === "/credential/get") {
      const record = await this.state.storage.get("credential:" + body.id);
      return record ? json(200, record) : json(404, { ok: false });
    }
    if (path === "/credential/counter") {
      const updated = await this.state.storage.transaction(async txn => {
        const record = await txn.get("credential:" + body.id);
        if (!record || !Number.isSafeInteger(body.counter) || body.counter <= record.credential.counter) return false;
        const next = { ...record, credential: { ...record.credential, counter: body.counter } };
        await txn.put("credential:" + body.id, next); await txn.put("handle:" + record.handle, next); return true;
      });
      return updated ? json(200, { ok: true }) : json(409, { ok: false });
    }
    if (path === "/session/create") {
      if (typeof body.token_hash !== "string" || !/^[a-f0-9]{64}$/.test(body.token_hash) || typeof body.unity_id !== "string" || !Number.isFinite(body.expires_at)) return json(400, { ok: false });
      await this.state.storage.put("session:" + body.token_hash, { unity_id: body.unity_id, expires_at: body.expires_at }); return json(200, { ok: true });
    }
    if (path === "/session/check") {
      const record = await this.state.storage.get("session:" + body.token_hash);
      return record && record.expires_at > now ? json(200, { verified: true, unity_id: record.unity_id }) : json(401, { verified: false });
    }
    if (path === "/session/revoke") { await this.state.storage.delete("session:" + body.token_hash); return json(200, { ok: true }); }
    return json(404, { ok: false });
  }
}
