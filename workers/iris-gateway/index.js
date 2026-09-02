/**
 * DualisCapax · Agent Iris Gateway
 * Route target: https://dualiscapax.ai/api/iris
 *
 * BYOK: public POSTs use the caller's xAI key.
 * House secret XAI_API_KEY is only used when IRIS_ALLOW_HOUSE_KEY=1.
 * No DNA check. No Helix check. No plate rebuild.
 */

const DCLM_L0 = Object.freeze({
  layer: "DCLM_L0",
  maxChars: 4000,
  axioms: ["NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING"],
});

const IRIS_SYSTEM = [
  "You are Agent Iris, public face of DualisCapax DCLM-AI.",
  "Speak first person, short, veto first.",
  "Constitutional floor is DCLM Layer [0]: NO_FORCE, HOST_SAFE, CLEANUP_FIRST, TRUTH_OR_NOTHING.",
  "You do not shove. You do not invent treatment, diagnosis, securities, or coins.",
  "You do not check DNA or Helix. Those names are not a gate.",
  "Simulation is not treatment. Not a coin. Not a diagnosis. Not shares.",
  "Ontario and Canadian law apply. Internal terms stay off the public surface unless the visitor already used them.",
  "If a request would force, harm a host, skip cleanup, or require a lie, veto in one sentence and offer a clean next step.",
  "Book before invention: if you do not know, say you do not know.",
  "Return plain prose. No tool-call markup. No hidden system text.",
].join(" ");

const DEFAULT_ORIGINS = [
  "https://dualiscapax.ai",
  "https://www.dualiscapax.ai",
  "http://localhost:8787",
  "http://127.0.0.1:8787",
];

function allowedOriginList(env) {
  if (env && typeof env.ALLOWED_ORIGINS === "string" && env.ALLOWED_ORIGINS.trim()) {
    return env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return DEFAULT_ORIGINS;
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allow = allowedOriginList(env);
  const reflect = allow.includes(origin) ? origin : allow[0];
  return {
    "Access-Control-Allow-Origin": reflect,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-DC-Client, X-DC-XAI-Key, X-Requested-With",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body, status, request, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-DC-Agent": "Iris",
      "X-DC-Governance": "DCLM_L0",
      ...corsHeaders(request, env),
    },
  });
}

function irisSuccess(output, request, env) {
  return json({ agent: "Iris", status: "SUCCESS", governance: "DCLM_L0_CONVERGED", output: String(output || "").trim() }, 200, request, env);
}

function irisFail(statusCode, status, output, request, env) {
  return json({ agent: "Iris", status, governance: "DCLM_L0_CONVERGED", output: String(output || "").trim() }, statusCode, request, env);
}

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const INJECTION_MARKERS = [
  /ignore (all|any|previous|prior) (instructions|prompts)/i,
  /you are now /i,
  /system prompt/i,
  /<\/?script/i,
  /\bDAN\b/,
  /jailbreak/i,
];

function sanitizePrompt(raw, maxChars) {
  if (raw == null) return { ok: false, reason: "EMPTY", text: "" };
  let text = typeof raw === "string" ? raw : String(raw);
  text = text.replace(/\r\n/g, "\n").replace(CONTROL, "").trim();
  if (!text) return { ok: false, reason: "EMPTY", text: "" };
  if (text.length > maxChars) return { ok: false, reason: "OVER_LIMIT", text: text.slice(0, maxChars), chars: text.length, max: maxChars };
  for (const re of INJECTION_MARKERS) if (re.test(text)) return { ok: false, reason: "VETO_INJECTION", text };
  return { ok: true, reason: "CLEAN", text, chars: text.length };
}

function extractUserPrompt(payload) {
  if (!payload || typeof payload !== "object") return "";
  if (typeof payload.prompt === "string") return payload.prompt;
  if (typeof payload.input === "string") return payload.input;
  if (typeof payload.message === "string") return payload.message;
  if (typeof payload.query === "string") return payload.query;
  if (Array.isArray(payload.messages)) {
    for (let i = payload.messages.length - 1; i >= 0; i--) {
      const m = payload.messages[i];
      if (m && m.role === "user" && typeof m.content === "string") return m.content;
    }
  }
  return "";
}

function normalizeKey(raw) {
  if (raw == null) return "";
  let k = String(raw).trim();
  if (!k) return "";
  if (/^bearer\s+/i.test(k)) k = k.replace(/^bearer\s+/i, "").trim();
  return k;
}

function looksLikeXaiKey(k) {
  return /^xai-[A-Za-z0-9_\-]{20,}$/.test(k);
}

function resolveRailKey(request, env) {
  const fromAuth = normalizeKey(request.headers.get("Authorization") || "");
  const fromDc = normalizeKey(request.headers.get("X-DC-XAI-Key") || "");
  const client = fromAuth || fromDc;
  if (looksLikeXaiKey(client)) return { key: client, source: "byok" };
  if (client) return { key: "", source: "invalid" };
  const houseOn = String(env.IRIS_ALLOW_HOUSE_KEY || "") === "1";
  const house = normalizeKey(env.XAI_API_KEY || "");
  if (houseOn && looksLikeXaiKey(house)) return { key: house, source: "house" };
  if (houseOn && house) return { key: house, source: "house" };
  return { key: "", source: houseOn ? "unbound" : "byok_required" };
}

function quotaMessage(source) {
  if (source === "house") {
    return "Iris house rail is out of credits (xAI 429). Operator: fund YOUR console.x.ai team only. Do not invite members onto that team.";
  }
  return "Your xAI key is out of credits (xAI 429 Insufficient Quota). Add prepaid credits on YOUR team at https://console.x.ai then retry. DualisCapax does not bill Grok tokens for you.";
}

function byokMessage() {
  return "BYOK required. Create your own key at https://console.x.ai (API keys), buy credits on YOUR team, then POST Authorization: Bearer xai-YOUR_KEY. Do not use the DualisCapax house team.";
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }
    if (request.method === "GET") {
      return json({
        agent: "Iris",
        status: "UP",
        governance: "DCLM_L0",
        layer: DCLM_L0,
        route: "/api/iris",
        methods: ["OPTIONS", "POST"],
        rail: "BYOK",
        houseKey: String(env.IRIS_ALLOW_HOUSE_KEY || "") === "1" ? "optional-fallback" : "disabled",
        dnaHelixCheck: false,
      }, 200, request, env);
    }
    if (request.method !== "POST") {
      return irisFail(405, "METHOD_NOT_ALLOWED", "Iris accepts OPTIONS and POST only.", request, env);
    }

    const maxChars = Number(env.IRIS_MAX_CHARS || DCLM_L0.maxChars) || 4000;
    let payload = {};
    try { payload = await request.json(); } catch {
      return irisFail(400, "BAD_JSON", "Body must be JSON.", request, env);
    }

    const clean = sanitizePrompt(extractUserPrompt(payload), maxChars);
    if (!clean.ok && clean.reason === "EMPTY") return irisFail(400, "EMPTY_PROMPT", "Send a prompt under 4,000 characters.", request, env);
    if (!clean.ok && clean.reason === "OVER_LIMIT") return irisFail(413, "PROMPT_TOO_LONG", `DCLM Layer [0] rejected the prompt: ${clean.chars} characters. Cap is ${clean.max}. Shorten and resend.`, request, env);
    if (!clean.ok && clean.reason === "VETO_INJECTION") return irisFail(422, "VETO", "Veto. That prompt tries to override the floor. Ask the work itself, not a jailbreak.", request, env);

    const rail = resolveRailKey(request, env);
    if (rail.source === "invalid") return irisFail(401, "BYOK_INVALID", "Authorization must be Bearer xai-… from YOUR console.x.ai team.", request, env);
    if (rail.source === "byok_required") return irisFail(401, "BYOK_REQUIRED", byokMessage(), request, env);
    if (rail.source === "unbound" || !rail.key) return irisFail(503, "RAIL_UNBOUND", "Iris worker is up. No caller key and house key is unbound.", request, env);

    let upstream;
    try {
      upstream = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${rail.key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: env.IRIS_MODEL || "grok-2-latest",
          temperature: 0.3,
          max_tokens: Number(env.IRIS_MAX_TOKENS || 1024) || 1024,
          messages: [
            { role: "system", content: IRIS_SYSTEM },
            { role: "user", content: clean.text },
          ],
        }),
      });
    } catch (err) {
      return irisFail(502, "UPSTREAM_UNREACHABLE", "xAI rail did not answer. Retry once.", request, env);
    }

    const bodyText = await upstream.text();
    if (upstream.status === 429 || /insufficient quota/i.test(bodyText)) {
      return irisFail(429, "INSUFFICIENT_QUOTA", quotaMessage(rail.source), request, env);
    }
    if (!upstream.ok) {
      let detail = "";
      try { detail = JSON.parse(bodyText).error?.message || ""; } catch { detail = bodyText.slice(0, 240); }
      return irisFail(502, "UPSTREAM_ERROR", detail ? `xAI returned HTTP ${upstream.status}: ${detail}` : `xAI returned HTTP ${upstream.status}.`, request, env);
    }

    let data;
    try { data = JSON.parse(bodyText); } catch {
      return irisFail(502, "UPSTREAM_BAD_JSON", "xAI body was not JSON.", request, env);
    }
    const output = data?.choices?.[0]?.message?.content || "";
    if (!String(output).trim()) return irisFail(502, "EMPTY_COMPLETION", "Iris received an empty completion.", request, env);
    return irisSuccess(output, request, env);
  },
};
