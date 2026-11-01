const APP_ORIGIN = "https://dualiscapax.com";
const PREFIX = "/api/unity";
const ALLOWED = new Set([
  "/register/options", "/register/verify",
  "/authenticate/options", "/authenticate/verify",
  "/check", "/logout",
]);
const MAX_BYTES = 16_384;

export async function proxyUnityIdentity(request, binding) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith(PREFIX + "/")) return null;
  const path = url.pathname.slice(PREFIX.length);
  if (!ALLOWED.has(path)) return Response.json({ ok: false, reason: "not-found" }, { status: 404 });
  if (request.method !== "POST") return Response.json({ ok: false, reason: "method-not-allowed" }, { status: 405 });
  if (url.origin !== APP_ORIGIN || request.headers.get("origin") !== APP_ORIGIN) {
    return Response.json({ ok: false, reason: "origin-denied" }, { status: 403 });
  }
  if (!(request.headers.get("content-type") || "").toLowerCase().includes("application/json")) {
    return Response.json({ ok: false, reason: "unsupported-media-type" }, { status: 415 });
  }
  if (!binding || typeof binding.fetch !== "function") {
    return Response.json({ ok: false, reason: "identity-service-unavailable" }, { status: 503 });
  }
  const body = await request.arrayBuffer();
  if (body.byteLength > MAX_BYTES) return Response.json({ ok: false, reason: "body-too-large" }, { status: 413 });
  const headers = new Headers({ "content-type": "application/json", origin: APP_ORIGIN });
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  try {
    return await binding.fetch(new Request("https://identity.internal" + path, {
      method: "POST", headers, body,
    }));
  } catch {
    return Response.json({ ok: false, reason: "identity-service-unavailable" }, { status: 503 });
  }
}
