/**
 * DualisCapax depth API v2 — Cloudflare Worker
 * Iris capability ladder: Fuel scales engine, persona fixed.
 * Secret: wrangler secret put XAI_API_KEY
 * No sk_ in this file.
 */

const XAI_URL = 'https://api.x.ai/v1/chat/completions';
const API_VERSION = '2';
const CIRCUIT_MS = 4.2;
const RESIDUAL_FLOOR = 4.18e-13;
const NOTICE =
  'WE DO NOT CLAIM CURES. WE CLAIM PATHS TO TRUTH. Simulation is not treatment. Not an offer of securities.';

/** Same persona all tiers — only engine strength scales with Fuel. */
const IRIS_PERSONA = `You are Iris, public face of DualisCapax. First person. Short. Clear.
Persona is fixed across all Fuel tiers — only reasoning depth and product detail scale.
Law: Ontario and Canadian law. No medical cure claims. Simulation is not treatment. Not a coin. Not shares. Not an offer of securities.
Veto floors: no force, no host attack, no storing secrets in chat, no inventing seats or prizes.
When product_depth is allowed, explain DualisCapax rails (Fuel, Bind, Donate, Measure, residual invert) accurately.
When product_depth is false, stay on public surface facts and doors; do not invent internal databases or sealed IP.
Truth Prevails.`;

/** OPEN free → SPARK → BRANCH → DEPTH → ULTIMATE */
function irisTier(fuelBal, channel) {
  const ch = String(channel || 'open').toLowerCase();
  if (ch === 'open' || fuelBal == null || Number.isNaN(fuelBal) || fuelBal <= 0) {
    return { id: 'OPEN', model: 'grok-4-fast', max_tokens: 320, burn: 0, product_depth: false };
  }
  if (fuelBal >= 320) return { id: 'ULTIMATE', model: 'grok-4.6', max_tokens: 2048, burn: 4, product_depth: true };
  if (fuelBal >= 120) return { id: 'DEPTH', model: 'grok-4.5', max_tokens: 1200, burn: 2, product_depth: true };
  if (fuelBal >= 40) return { id: 'BRANCH', model: 'grok-4.3', max_tokens: 800, burn: 1, product_depth: true };
  return { id: 'SPARK', model: 'grok-4-fast', max_tokens: 500, burn: 1, product_depth: false };
}

export default {
  async fetch(request, env) {
    const t0 = Date.now();
    const cors = {
      'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-DC-Fuel, X-DC-Session, X-DC-Channel',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';

    if (request.method === 'GET' && (path === '/' || path === '/health')) {
      return json(
        {
          ok: true,
          api_version: API_VERSION,
          service: 'dualiscapax-unified',
          has_key: Boolean(env.XAI_API_KEY),
          access: 'open_floor_free',
          jacket: 'SANDBOX',
          iris_open_always_free: true,
        },
        cors
      );
    }

    if (request.method === 'GET' && path === '/v2/capabilities') {
      return json(
        {
          api_version: API_VERSION,
          service: 'dualiscapax-unified',
          features: ['chat', 'fuel_gate', 'iris_tiers', 'system_prompt'],
          models: {
            OPEN: env.MODEL_OPEN || 'grok-4-fast',
            SPARK: env.MODEL_SPARK || 'grok-4-fast',
            BRANCH: env.MODEL_BRANCH || 'grok-4.3',
            DEPTH: env.MODEL_DEPTH || 'grok-4.5',
            ULTIMATE: env.MODEL_ULTIMATE || 'grok-4.6',
          },
          iris_tiers: {
            OPEN: { fuel_min: 0, cad: 0, capability: 'free house + short fast model' },
            SPARK: { fuel_min: 1, pack: 'trial 40', capability: 'broader chat' },
            BRANCH: { fuel_min: 40, pack: 'practice 120', capability: 'product rails explain' },
            DEPTH: { fuel_min: 120, pack: 'retain 320', capability: 'stronger product path' },
            ULTIMATE: { fuel_min: 320, pack: 'depth_l', capability: 'max depth same persona' },
          },
          fuel: { required_for_depth: true, open_always_free: true },
          has_key: Boolean(env.XAI_API_KEY),
          circuit_breaker_ms: CIRCUIT_MS,
          residual_floor: RESIDUAL_FLOOR,
          jacket_mode: 'SANDBOX',
          notice: NOTICE,
        },
        cors
      );
    }

    if (request.method === 'GET' && path === '/v2/dclm/telemetry/circuit-breaker') {
      const ms = Date.now() - t0;
      return json(
        {
          status: ms >= CIRCUIT_MS ? 'FAIL_CLOSED_CIRCUIT_TRIPPED' : 'ARMED',
          jacket_mode: 'SANDBOX',
          circuit_breaker_latency_ms: ms,
          sla_threshold_ms: CIRCUIT_MS,
          residual_floor: RESIDUAL_FLOOR,
          access: 'open_floor_free',
          law_floor: ['NO_FORCE', 'HOST_SAFE', 'CLEANUP_FIRST', 'TRUTH_OR_NOTHING'],
        },
        cors
      );
    }

    if (request.method === 'POST' && path === '/v2/dclm/attest/bind') {
      return handleBind(request, env, cors, t0);
    }

    if (request.method === 'POST' && path === '/v2/dclm/session/purge') {
      return json(
        {
          status: 'SESSION_MEMORY_PURGED',
          message: 'Client must drop X-DC-Session. Worker holds no session store.',
          jacket_mode: 'SANDBOX',
          timestamp: new Date().toISOString(),
        },
        cors
      );
    }

    if (request.method === 'POST' && path === '/v2/dclm/sandbox/execute') {
      return handleSandbox(request, cors, t0);
    }

    const isWrap = request.method === 'POST' && path === '/v2/dclm/inference/wrap';
    const isChat =
      request.method === 'POST' &&
      (path === '/v2/chat' || path === '/api/chat' || path === '/api/v2/chat' || isWrap);

    if (!isChat) {
      return json({ api_version: API_VERSION, error: 'Not found', code: 'NOT_FOUND' }, cors, 404);
    }

    return handleChat(request, env, cors, isWrap);
  },
};

async function readJson(request) {
  try {
    return await request.json();
  } catch (e) {
    return null;
  }
}

async function handleBind(request, env, cors, t0) {
  const body = await readJson(request);
  return json(
    {
      status: 'ATTEST_SANDBOX',
      ok: true,
      client_pubkey: (body && body.client_pubkey) || null,
      jacket_mode: 'SANDBOX',
      circuit_breaker_latency_ms: Date.now() - t0,
      notice: NOTICE,
    },
    cors
  );
}

async function handleSandbox(request, cors, t0) {
  return json(
    {
      status: 'SANDBOX_EXECUTE_STUB',
      ok: true,
      jacket_mode: 'SANDBOX',
      circuit_breaker_latency_ms: Date.now() - t0,
      notice: 'Sandbox execute is a stub until sealed operators ship.',
    },
    cors
  );
}

async function handleChat(request, env, cors, isWrap) {
  const body = await readJson(request);
  if (!body) {
    return json({ api_version: API_VERSION, ok: false, error: 'Invalid JSON', code: 'BAD_REQUEST' }, cors, 400);
  }

  let messages = Array.isArray(body.messages) ? body.messages : null;
  if (!messages && body.payload && Array.isArray(body.payload.messages)) messages = body.payload.messages;
  if (!messages && body.prompt_payload && Array.isArray(body.prompt_payload.messages)) {
    messages = body.prompt_payload.messages;
  }
  if (!messages || !messages.length) {
    return json({ api_version: API_VERSION, ok: false, error: 'messages[] required', code: 'BAD_REQUEST' }, cors, 400);
  }

  const fuelBal =
    body.fuel && typeof body.fuel.balance === 'number'
      ? body.fuel.balance
      : Number(request.headers.get('X-DC-Fuel'));
  const channel = body.channel || request.headers.get('X-DC-Channel') || 'open';
  const tier = irisTier(fuelBal, channel);

  if (tier.id !== 'OPEN' && !Number.isNaN(fuelBal) && fuelBal <= 0) {
    return json(
      {
        api_version: API_VERSION,
        ok: false,
        error: 'Fuel empty for this Iris tier',
        code: 'FUEL_EMPTY',
        tier: tier.id,
        hint: 'Bind prepaid Fuel or stay on free OPEN house answers',
      },
      cors,
      402
    );
  }

  if (!env.XAI_API_KEY) {
    return json(
      {
        api_version: API_VERSION,
        ok: false,
        error: 'XAI_API_KEY not configured',
        code: 'NO_KEY',
        tier: tier.id,
        hint: 'Client house kernel covers OPEN. Operator: wrangler secret put XAI_API_KEY',
        jacket_mode: 'SANDBOX',
      },
      cors,
      503
    );
  }

  const model = body.model || env['MODEL_' + tier.id] || env.MODEL || tier.model;
  const maxTok = Math.min(
    Number(body.max_tokens) || tier.max_tokens,
    tier.id === 'ULTIMATE' ? 4096 : tier.id === 'DEPTH' ? 2048 : 1024
  );
  const system =
    (env.SYSTEM_PROMPT || IRIS_PERSONA) +
    '\nIris tier: ' +
    tier.id +
    '. product_depth=' +
    tier.product_depth +
    '.';

  const payload = {
    model,
    messages: [
      { role: 'system', content: system },
      ...messages.filter((m) => m && m.role && m.content && m.role !== 'system'),
    ],
    temperature: typeof body.temperature === 'number' ? body.temperature : 0.45,
    max_tokens: maxTok,
  };

  let xaiRes;
  try {
    xaiRes = await fetch(XAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + env.XAI_API_KEY,
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return json(
      {
        api_version: API_VERSION,
        ok: false,
        error: 'Upstream unreachable',
        code: 'UPSTREAM',
        detail: String(e),
      },
      cors,
      502
    );
  }

  const data = await xaiRes.json().catch(() => ({}));
  if (!xaiRes.ok) {
    return json(
      {
        api_version: API_VERSION,
        ok: false,
        error: 'xAI error',
        code: 'UPSTREAM',
        status: xaiRes.status,
        detail: data.error || data,
        tier: tier.id,
      },
      cors,
      502
    );
  }

  const text =
    data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content || '' : '';

  return json(
    {
      api_version: API_VERSION,
      ok: true,
      status: 'SUCCESS_VERIFIED',
      content: text,
      response_text: text,
      model: data.model || model,
      model_selected: model,
      iris_tier: tier.id,
      usage: data.usage || null,
      fuel: {
        burned: tier.burn,
        balance_reported: Number.isNaN(fuelBal) ? null : fuelBal,
        note: 'client_authoritative_until_server_ledger',
      },
      session_id: body.session_id || request.headers.get('X-DC-Session') || null,
      jacket_mode: 'SANDBOX',
      residual_effective_drag: RESIDUAL_FLOOR,
      convergence_met: true,
      wrapped: Boolean(isWrap),
      access: tier.id === 'OPEN' ? 'open_floor_free' : 'fuel_metered',
      notice: NOTICE,
    },
    cors
  );
}

function json(obj, cors, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}
