/**
 * IrisAuthorize — client-side HMAC signing helper for /v1/authorize.
 * The SIGNING_SECRET must be supplied by a secure context (server-injected,
 * session, or agent runtime). Never hardcode it here.
 */
(function (w) {
  var VERSION = "iris-authorize-2026-10-24";

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

  async function authorize(body, secret) {
    var signed = await signRequest(body, secret);
    var res = await fetch("/v1/authorize", {
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

  w.IrisAuthorize = {
    version: VERSION,
    signRequest: signRequest,
    authorize: authorize
  };
})(window);
