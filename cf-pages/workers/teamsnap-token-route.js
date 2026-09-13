/**
 * Drop into dualiscapax-depth worker:
 * POST /v2/oauth/teamsnap/token
 * Body: { code, client_id, redirect_uri, grant_type }
 * Env: TEAMSNAP_CLIENT_SECRET (and optional TEAMSNAP_CLIENT_ID allowlist)
 *
 * Never log the secret or access_token.
 */
export async function handleTeamSnapToken(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request)
    });
  }
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405, request);
  }
  let body;
  try { body = await request.json(); } catch (e) {
    return json({ error: "invalid_json" }, 400, request);
  }
  const code = body && body.code;
  const client_id = body && body.client_id;
  const redirect_uri = body && body.redirect_uri;
  const grant_type = (body && body.grant_type) || "authorization_code";
  if (!code || !client_id || !redirect_uri) {
    return json({ error: "missing_params" }, 400, request);
  }
  if (env.TEAMSNAP_CLIENT_ID && env.TEAMSNAP_CLIENT_ID !== client_id) {
    return json({ error: "client_mismatch" }, 403, request);
  }
  if (!env.TEAMSNAP_CLIENT_SECRET) {
    return json({ error: "server_misconfigured", message: "TEAMSNAP_CLIENT_SECRET not set" }, 500, request);
  }
  const form = new URLSearchParams();
  form.set("client_id", client_id);
  form.set("client_secret", env.TEAMSNAP_CLIENT_SECRET);
  form.set("redirect_uri", redirect_uri);
  form.set("grant_type", grant_type);
  form.set("code", code);
  const upstream = await fetch("https://auth.teamsnap.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: form
  });
  const text = await upstream.text();
  let data;
  try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }
  return new Response(JSON.stringify(data), {
    status: upstream.status,
    headers: {
      "Content-Type": "application/json",
      ...Object.fromEntries(corsHeaders(request).entries())
    }
  });
}
function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "https://dualiscapax.ai";
  const h = new Headers();
  h.set("Access-Control-Allow-Origin", origin);
  h.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type, X-DC-Client");
  h.set("Vary", "Origin");
  return h;
}
function json(obj, status, request) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json",
      ...Object.fromEntries(corsHeaders(request).entries())
    }
  });
}
