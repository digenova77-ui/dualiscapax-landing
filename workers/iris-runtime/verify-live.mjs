/**
 * Live staging verifier for the Iris Runtime Worker.
 *
 * Checks the deployed staging Worker:
 *   1. /health is ok and missing is empty
 *   2. force_deny returns authorized: false
 *   3. an allow returns dualis.receipt.v1 with rct_ id and 64-char sha256
 *
 * Does not deploy. Does not touch production. Does not print secrets.
 *
 * Usage:
 *   IRIS_STAGING_URL=https://iris-runtime-staging.<subdomain>.workers.dev \
 *     node workers/iris-runtime/verify-live.mjs
 */
import { createHmac } from "node:crypto";
import { request } from "node:https";
import { request as httpRequest } from "node:http";

const RECEIPT_CONTRACT = "dualis.receipt.v1";
const SHA256_RE = /^[a-f0-9]{64}$/i;

function join(base, path) {
  return String(base || "").replace(/\/$/, "") + path;
}

function postJson(url, body, signingSecret) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createHmac("sha256", signingSecret).update(timestamp + "." + payload).digest("hex");
    const lib = url.startsWith("https:") ? request : httpRequest;
    const req = lib(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": Buffer.byteLength(payload),
        "x-timestamp": timestamp,
        "x-signature": signature,
      },
    }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let data = null;
        try { data = JSON.parse(text); } catch (e) {}
        resolve({ status: res.statusCode, data, text });
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https:") ? request : httpRequest;
    const req = lib(url, { method: "GET" }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let data = null;
        try { data = JSON.parse(text); } catch (e) {}
        resolve({ status: res.statusCode, data, text });
      });
    });
    req.on("error", reject);
    req.end();
  });
}

export function checkHealth(result) {
  const missing = result && result.data && result.data.missing;
  const inert = result && result.data && result.data.inert;
  const missingOk = Array.isArray(missing) && missing.length === 0;
  const inertOk = !Array.isArray(inert) || inert.length === 0;
  const ok = result && result.status === 200 && result.data && result.data.ok === true && missingOk && inertOk;
  return { ok, missing: missing || null, inert: inert || null, reason: ok ? null : "health-not-ok" };
}

export function checkDeny(result) {
  const ok = result && result.data && result.data.authorized === false;
  return { ok, reason: ok ? null : "deny-not-fail-closed" };
}

export function checkAllow(result) {
  const receipt = result && result.data && result.data.receipt;
  const ok = !!(
    result &&
    result.data &&
    result.data.authorized === true &&
    receipt &&
    receipt.contract === RECEIPT_CONTRACT &&
    typeof receipt.id === "string" &&
    receipt.id.startsWith("rct_") &&
    typeof receipt.sha256 === "string" &&
    SHA256_RE.test(receipt.sha256)
  );
  return { ok, receipt: receipt || null, reason: ok ? null : "allow-receipt-invalid" };
}

export async function verifyLive(base, signingSecret, unityId) {
  if (!base) throw new Error("IRIS_STAGING_URL is required");
  if (!signingSecret) throw new Error("IRIS_STAGING_SIGNING_SECRET is required; secret is never printed");
  if (!unityId || !unityId.trim()) throw new Error("IRIS_STAGING_UNITY_ID is required; refusing to invent an identity");
  const health = checkHealth(await getJson(join(base, "/health")));
  const deny = checkDeny(await postJson(join(base, "/v1/authorize"), {
    request_id: "deny-" + Date.now().toString(36),
    principal: { unity_id: unityId },
    force_deny: true,
    text: "deny",
  }, signingSecret));
  const allow = checkAllow(await postJson(join(base, "/v1/authorize"), {
    request_id: "allow-" + Date.now().toString(36),
    principal: { unity_id: unityId },
    text: "hello",
  }, signingSecret));
  return { ok: health.ok && deny.ok && allow.ok, health, deny, allow };
}

const isMain = process.argv[1] && process.argv[1].endsWith("verify-live.mjs");
if (isMain) {
  const base = process.env.IRIS_STAGING_URL;
  const signingSecret = process.env.IRIS_STAGING_SIGNING_SECRET;
  const unityId = process.env.IRIS_STAGING_UNITY_ID;
  if (!base) {
    console.error("IRIS_STAGING_URL is not set. Refusing to guess a staging origin.");
    process.exit(2);
  }
  if (!signingSecret) {
    console.error("IRIS_STAGING_SIGNING_SECRET is not set. Refusing unsigned live authorization checks.");
    process.exit(2);
  }
  if (!unityId) {
    console.error("IRIS_STAGING_UNITY_ID is not set. Refusing to invent an identity.");
    process.exit(2);
  }
  verifyLive(base, signingSecret, unityId).then((report) => {
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.ok ? 0 : 1);
  }).catch((err) => {
    console.error(String(err && err.message || err));
    process.exit(1);
  });
}
