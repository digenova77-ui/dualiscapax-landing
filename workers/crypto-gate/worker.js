/* DualisCapax crypto-gate. Public rail language is USDC / CAD-matched.
   Never calls DCLMVault.routeUsdc. Never invents wallets.
   CHECKOUT_OPEN and CRYPTO_OPEN stay false until Bind-continue. */

const ALLOW = ["https://dualiscapax.ai", "https://www.dualiscapax.ai"];

function cors(origin) {
  const allowed = ALLOW.includes(origin);
  const headers = {
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "x-frame-options": "DENY",
    "vary": "Origin"
  };
  if (allowed) headers["access-control-allow-origin"] = origin;
  return headers;
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...cors(origin) }
  });
}

function open(env) {
  return String(env.CHECKOUT_OPEN || "") === "true" && String(env.CRYPTO_OPEN || "") === "true";
}

function envelope(env) {
  return {
    ok: true,
    rail: env.RAIL || "usdc",
    peg: env.PEG || "CAD_MATCHED",
    open: open(env),
    checkout: open(env),
    intent: open(env) ? "not-wired" : "closed",
    vault: "paused-paper",
    settle: "parked",
    stripe: "retired",
    reason: "CRYPTO_OPEN false + DCLMVault paused + Stripe public rail retired"
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const path = String(url.pathname || "/").replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(origin) });
    }

    if (request.method === "GET" && (path === "/" || path === "/pay/quote" || path === "/pay/dry-run" || path === "/pay/crypto")) {
      return json(envelope(env), 200, origin);
    }

    if (path === "/pay/intent" && request.method === "POST") {
      if (!open(env)) return json({ ok: false, reason: "closed", stripe: "retired", rail: "usdc" }, 403, origin);
      return json({ ok: false, reason: "not-wired" }, 503, origin);
    }

    return json({ ok: false, reason: "no-route", stripe: "retired" }, 404, origin);
  }
};
