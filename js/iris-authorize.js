/**
 * IrisAuthorize — client helper for /v1/authorize.
 *
 * Production path: the browser posts to the application's own backend
 * (IrisAuthorizeBase). The backend holds the HMAC secret and performs
 * the signature. The browser never supplies or sees the secret.
 *
 * Staging path: window.IrisSigningSecret may be set for controlled
 * verification only. It is browser-visible and is not a production
 * secret store. Production builds must leave it unset.
 */
(function (w) {
  var VERSION = "iris-authorize-2026-10-24-prod-path";

  async function signRequest(body, secret) {
    if (!secret) throw new Error("signing-secret-unavailable");
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payload = timestamp + "." + JSON.stringify(body);
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    const signature = Array.from(new Uint8Array(sigBuf))
      .map(function (b) { return b.toString(16).padStart(2, "0"); })
      .join("");
    return { timestamp: timestamp, signature: signature };
  }

  /**
   * Production authorize: browser posts the body to the configured base.
   * The server is expected to hold the secret, verify the session, and
   * return the authorization result. No secret is read from the browser.
   */
  async function authorizeProduction(body) {
    var base = (w.IrisAuthorizeBase || "").replace(/\/$/, "");
    if (!base) throw new Error("authorize-base-unavailable");
    var url = base + "/v1/authorize";
    var res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin"
    });
    var data = null;
    try { data = await res.json(); } catch (e) {}
    return { status: res.status, ok: res.ok, data: data };
  }

  /**
   * Staging authorize: uses window.IrisSigningSecret if present.
   * Documented as browser-visible; must not be used in production.
   */
  async function authorizeStaging(body) {
    var secret = w.IrisSigningSecret;
    if (!secret) throw new Error("signing-secret-unavailable");
    return authorizeProductionWithSignature(body, secret);
  }

  async function authorizeProductionWithSignature(body, secret) {
    var base = (w.IrisAuthorizeBase || "").replace(/\/$/, "");
    var url = base + "/v1/authorize";
    var signed = await signRequest(body, secret);
    var res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-timestamp": signed.timestamp,
        "x-signature": signed.signature
      },
      body: JSON.stringify(body)
    });
    var data = null;
    try { data = await res.json(); } catch (e) {}
    return { status: res.status, ok: res.ok, data: data };
  }

  /**
   * Public entry. In production (no window.IrisSigningSecret) the
   * browser never supplies a secret. Staging may set the hook for tests.
   */
  async function authorize(body) {
    if (w.IrisSigningSecret) {
      return authorizeStaging(body);
    }
    return authorizeProduction(body);
  }

  w.IrisAuthorize = {
    version: VERSION,
    signRequest: signRequest,
    authorize: authorize,
    authorizeProduction: authorizeProduction
  };
})(window);
