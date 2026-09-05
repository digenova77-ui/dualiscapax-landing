/**
 * DualisCapax · Agent Iris Gateway
 * Route target: https://dualiscapax.ai/api/iris
 *
 * Primary: xAI grok-4.6 (BYOK or house if IRIS_ALLOW_HOUSE_KEY=1).
 * On 429 / 5xx: webhook handoff, then Groq, then OpenRouter.
 * No invented keys. Missing fallback secret = fail closed after webhook.
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
  "Simulation is not treatment. Not a coin. Not a diagnosis. Not shares.",
  "Ontario and Canadian law apply.",
  "If a request would force, harm a host, skip cleanup, or require a lie, veto in one sentence.",
  "If you do not know, say you do not know.",
  "Return plain prose.",
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

function irisSuccess(output, request, env, railUsed) {
  return json({
    agent: "Iris",
    status: "SUCCESS",
    governance: "DCLM_L0_CONVERGED",
    rail: railUsed || "xai",
    output: String(output || "").trim(),
  }, 200, request, env);
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
    return "Iris house rail is out of credits (xAI 429). Fallback attempted.";
  }
  return "Your xAI key is out of credits (429). Fallback attempted.";
}

function byokMessage() {
  return "BYOK required. Create your own key at https://console.x.ai then POST Authorization: Bearer xai-YOUR_KEY.";
}

function chatBody(env, model, text, maxTokens) {
  return JSON.stringify({
    model,
    temperature: 0.3,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: IRIS_SYSTEM },
      { role: "user", content: text },
    ],
  });
}

async function callOpenAiCompat(url, key, model, text, maxTokens) {
  const upstream = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: chatBody({}, model, text, maxTokens),
  });
  const bodyText = await upstream.text();
  return { upstream, bodyText };
}

async function fireHandoff(env, payload) {
  const url = env && env.IRIS_HANDOFF_WEBHOOK;
  if (!url) return { sent: false, reason: "no_webhook" };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-DC-Event": "iris-handoff" },
      body: JSON.stringify({
        at: new Date().toISOString(),
        agent: "Iris",
        event: "primary_rail_failed",
        ...payload,
      }),
    });
    return { sent: true, status: res.status };
  } catch (e) {
    return { sent: false, reason: "webhook_unreachable" };
  }
}

function parseCompletion(bodyText) {
  let data;
  try { data = JSON.parse(bodyText); } catch { return ""; }
  return (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
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
        primary: env.IRIS_MODEL || "grok-4.6",
        fallbacks: ["groq", "openrouter"],
        handoffWebhook: Boolean(env && env.IRIS_HANDOFF_WEBHOOK),
        houseKey: String(env.IRIS_ALLOW_HOUSE_KEY || "") === "1" ? "optional-fallback" : "disabled",
      }, 200, request, env);
    }
    if (request.method !== "POST") {
      return irisFail(405, "METHOD_NOT_ALLOWED", "Iris accepts OPTIONS and POST only.", request, env);
    }

    const maxChars = Number(env.IRIS_MAX_CHARS || DCLM_L0.maxChars) || 4000;
    const maxTokens = Number(env.IRIS_MAX_TOKENS || 1024) || 1024;
    let payload = {};
    try { payload = await request.json(); } catch {
      return irisFail(400, "BAD_JSON", "Body must be JSON.", request, env);
    }

    const clean = sanitizePrompt(extractUserPrompt(payload), maxChars);
    if (!clean.ok && clean.reason === "EMPTY") return irisFail(400, "EMPTY_PROMPT", "Send a prompt under 4,000 characters.", request, env);
    if (!clean.ok && clean.reason === "OVER_LIMIT") return irisFail(413, "PROMPT_TOO_LONG", `Cap is ${clean.max}.`, request, env);
    if (!clean.ok && clean.reason === "VETO_INJECTION") return irisFail(422, "VETO", "Veto. Ask the work itself.", request, env);

    const rail = resolveRailKey(request, env);
    if (rail.source === "invalid") return irisFail(401, "BYOK_INVALID", "Authorization must be Bearer xai-…", request, env);
    if (rail.source === "byok_required") return irisFail(401, "BYOK_REQUIRED", byokMessage(), request, env);
    if (rail.source === "unbound" || !rail.key) return irisFail(503, "RAIL_UNBOUND", "No caller key and house key unbound.", request, env);

    let xaiStatus = 0;
    let xaiBody = "";
    try {
      const x = await callOpenAiCompat(
        "https://api.x.ai/v1/chat/completions",
        rail.key,
        env.IRIS_MODEL || "grok-4.6",
        clean.text,
        maxTokens
      );
      xaiStatus = x.upstream.status;
      xaiBody = x.bodyText;
      if (x.upstream.ok) {
        const output = parseCompletion(x.bodyText);
        if (String(output).trim()) return irisSuccess(output, request, env, "xai");
      }
    } catch {
      xaiStatus = 0;
    }

    const needHandoff = xaiStatus === 0 || xaiStatus === 429 || xaiStatus >= 500 || /insufficient quota/i.test(xaiBody);
    if (!needHandoff && xaiStatus) {
      let detail = "";
      try { detail = JSON.parse(xaiBody).error && JSON.parse(xaiBody).error.message || ""; } catch { detail = xaiBody.slice(0, 240); }
      return irisFail(502, "UPSTREAM_ERROR", detail ? `xAI HTTP ${xaiStatus}: ${detail}` : `xAI HTTP ${xaiStatus}.`, request, env);
    }

    const handoff = await fireHandoff(env, {
      from: env.IRIS_MODEL || "grok-4.6",
      xai_status: xaiStatus,
      reason: xaiStatus === 429 ? "quota" : "upstream_dead",
      source: rail.source,
    });

    const groqKey = normalizeKey(env.GROQ_API_KEY || "");
    if (groqKey) {
      try {
        const g = await callOpenAiCompat(
          "https://api.groq.com/openai/v1/chat/completions",
          groqKey,
          env.IRIS_FALLBACK_GROQ_MODEL || "llama-3.1-8b-instant",
          clean.text,
          maxTokens
        );
        if (g.upstream.ok) {
          const output = parseCompletion(g.bodyText);
          if (String(output).trim()) return irisSuccess(output, request, env, "groq");
        }
      } catch { /* next rail */ }
    }

    const orKey = normalizeKey(env.OPENROUTER_API_KEY || "");
    if (orKey) {
      try {
        const o = await callOpenAiCompat(
          "https://openrouter.ai/api/v1/chat/completions",
          orKey,
          env.IRIS_FALLBACK_OR_MODEL || "meta-llama/llama-3.1-8b-instruct:free",
          clean.text,
          maxTokens
        );
        if (o.upstream.ok) {
          const output = parseCompletion(o.bodyText);
          if (String(output).trim()) return irisSuccess(output, request, env, "openrouter");
        }
      } catch { /* fail closed */ }
    }

    if (xaiStatus === 429) {
      return irisFail(429, "INSUFFICIENT_QUOTA", quotaMessage(rail.source) + (handoff.sent ? " Handoff webhook sent." : " No handoff URL bound."), request, env);
    }
    return irisFail(503, "RAILS_EXHAUSTED", "Grok dead and no bound fallback key answered. Bind GROQ_API_KEY or OPENROUTER_API_KEY. Handoff sent: " + String(handoff.sent) + ".", request, env);
  },
};
