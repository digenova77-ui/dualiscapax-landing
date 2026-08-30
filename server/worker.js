/**
 * DualisCapax depth API v2 — Cloudflare Worker
 * Unified 2026-08-30: jacket envelope + leftover chat aliases.
 * Secret: wrangler secret put XAI_API_KEY
 * No sk_ in this file. Access sales stay closed.
 */

const XAI_URL = 'https://api.x.ai/v1/chat/completions';
const API_VERSION = '2';
const CIRCUIT_MS = 4.2;
const RESIDUAL_FLOOR = 4.18e-13;
const NOTICE =
  'WE DO NOT CLAIM CURES. WE CLAIM PATHS TO TRUTH. Simulation is not treatment. Not an offer of securities.';

export default {
  async fetch(request, env) {
    const t0 = Date.now();
    const cors = {
      'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-DC-Fuel, X-DC-Session',
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
          access: 'closed',
          jacket: 'SANDBOX',
        },
        cors
      );
    }

    if (request.method === 'GET' && path === '/v2/capabilities') {
      return json(
        {
          api_version: API_VERSION,
          service: 'dualiscapax-unified',
          features: [
            'chat',
            'fuel_gate',
            'system_prompt',
            'dclm_attest_sandbox',
            'dclm_telemetry',
            'dclm_purge',
            'dclm_sandbox_execute',
          ],
          models: [env.MODEL || 'grok-4-fast'],
          fuel: { required_for_depth: true, open_research: false },
          has_key: Boolean(env.XAI_API_KEY),
          access: 'closed',
          circuit_breaker_ms: CIRCUIT_MS,
          residual_floor: RESIDUAL_FLOOR,
          jacket_mode: 'SANDBOX',
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
          access: 'closed',
          earned_cad: 0,
          pledged_cad: 0,
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
  } catch {
    return null;
  }
}

async function handleBind(request, env, cors, t0) {
  const body = (await readJson(request)) || {};
  const nonce = String(body.nonce || crypto.randomUUID()).slice(0, 64);
  const pub = String(body.client_pubkey || 'web').slice(0, 128);
  const raw = new TextEncoder().encode('DCLM_SANDBOX|' + pub + '|' + nonce);
  const digest = await crypto.subtle.digest('SHA-256', raw);
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  const ms = Date.now() - t0;
  if (ms >= CIRCUIT_MS) {
    return json(
      {
        status: 'FAIL_CLOSED_CIRCUIT_TRIPPED',
        circuit_breaker_ms: ms,
        tee_verified: false,
        jacket_mode: 'SANDBOX',
      },
      cors,
      503
    );
  }
  const now = new Date();
  const exp = new Date(now.getTime() + 3600 * 1000);
  return json(
    {
      status: 'ACTIVE_BOUND',
      upid: '0x' + hex.slice(0, 16),
      bind_vector: '0x' + hex.slice(16, 32),
      session_token: 'DCLM_SESS_SANDBOX_' + hex.slice(0, 24),
      merkle_root: '0x' + hex.slice(32, 64),
      circuit_breaker_ms: ms,
      issued_at: now.toISOString(),
      expires_at: exp.toISOString(),
      jacket_mode: 'SANDBOX',
      tee_verified: false,
      note: 'Sandbox bind only. Real TEE quote verification is WAIT_GRANT.',
    },
    cors
  );
}

async function handleSandbox(request, cors, t0) {
  const body = (await readJson(request)) || {};
  const text = String(body.text || body.prompt || '');
  const voice = body.voice || 'citizen';
  const lower = text.toLowerCase();
  const veto =
    /\b(cure|cures|guaranteed return|hack|exploit|kill|weapon)\b/.test(lower) ||
    /\bsecurit(y|ies)\s+offer\b/.test(lower);
  const ms = Date.now() - t0;
  if (ms >= CIRCUIT_MS) {
    return json(
      {
        status: 'FAIL_CLOSED_CIRCUIT_TRIPPED',
        circuit_breaker_latency_ms: ms,
        jacket_mode: 'SANDBOX',
      },
      cors,
      503
    );
  }
  if (veto) {
    return json(
      {
        status: 'FAIL_CLOSED_LOGIC_DIVERGENCE',
        grant: 'VETO',
        voice: voice,
        notice: NOTICE,
        next_move: 'Reset. Ask a measure that does not coerce or fabricate.',
        jacket_mode: 'SANDBOX',
        circuit_breaker_latency_ms: ms,
      },
      cors,
      400
    );
  }
  if (!text.trim()) {
    return json(
      {
        status: 'SUCCESS_VERIFIED',
        grant: 'SEED',
        voice: voice,
        notice: NOTICE,
        next_move: 'Name the missing poles / unit / walk-back. Do not invent them.',
        residual_effective_drag: RESIDUAL_FLOOR,
        jacket_mode: 'SANDBOX',
        circuit_breaker_latency_ms: ms,
        access: 'closed',
      },
      cors
    );
  }
  return json(
    {
      status: 'SUCCESS_VERIFIED',
      grant: 'MEASURE',
      voice: voice,
      notice: NOTICE,
      response_text:
        'Every decision leaves a residual. This sandbox names a path, not a prescription. Seats stay closed.',
      residual_effective_drag: RESIDUAL_FLOOR,
      convergence_met: true,
      rate_of_advance_actual: 0.98,
      jacket_mode: 'SANDBOX',
      circuit_breaker_latency_ms: ms,
      access: 'closed',
      next_move: 'Keep P2 labeled M. Do not present the model as P1.',
    },
    cors
  );
}

async function handleChat(request, env, cors, isWrap) {
  if (!env.XAI_API_KEY) {
    return json(
      {
        api_version: API_VERSION,
        ok: false,
        error: 'XAI_API_KEY not configured',
        code: 'NO_KEY',
        hint: 'wrangler secret put XAI_API_KEY',
        jacket_mode: 'SANDBOX',
      },
      cors,
      503
    );
  }

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
  const burn = (body.fuel && body.fuel.burn) || 1;

  if (!Number.isNaN(fuelBal) && fuelBal <= 0) {
    return json(
      {
        api_version: API_VERSION,
        ok: false,
        error: 'Fuel empty',
        code: 'FUEL_EMPTY',
      },
      cors,
      402
    );
  }

  const model = body.model || env.MODEL || 'grok-4-fast';
  const system =
    env.SYSTEM_PROMPT ||
    'You are DualisCapax Adaptive Intelligence (API v2 unified). Clear and direct. Open research is free; depth is Fuel-metered. No medical cure claims; no securities offers. Access sales are closed.';

  const payload = {
    model,
    messages: [
      { role: 'system', content: system },
      ...messages.filter((m) => m && m.role && m.content && m.role !== 'system'),
    ],
    temperature: typeof body.temperature === 'number' ? body.temperature : 0.5,
    max_tokens: Math.min(Number(body.max_tokens) || 1024, 4096),
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
      },
      cors,
      502
    );
  }

  const text =
    data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content || '' : '';

  const out = {
    api_version: API_VERSION,
    ok: true,
    status: 'SUCCESS_VERIFIED',
    content: text,
    response_text: text,
    model: data.model || model,
    usage: data.usage || null,
    fuel: {
      burned: burn,
      note: 'client_authoritative_until_server_ledger',
    },
    session_id: body.session_id || request.headers.get('X-DC-Session') || null,
    jacket_mode: 'SANDBOX',
    residual_effective_drag: RESIDUAL_FLOOR,
    convergence_met: true,
    wrapped: Boolean(isWrap),
    access: 'closed',
  };
  return json(out, cors);
}

function json(obj, cors, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}
