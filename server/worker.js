/**
 * DualisCapax depth API v2 — Cloudflare Worker
 * Secret: wrangler secret put XAI_API_KEY
 */

const XAI_URL = 'https://api.x.ai/v1/chat/completions';
const API_VERSION = '2';

export default {
  async fetch(request, env) {
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
      return json({ ok: true, api_version: API_VERSION, service: 'dualiscapax-depth', has_key: Boolean(env.XAI_API_KEY) }, cors);
    }

    if (request.method === 'GET' && path === '/v2/capabilities') {
      return json({
        api_version: API_VERSION,
        service: 'dualiscapax-depth',
        features: ['chat', 'fuel_gate', 'system_prompt'],
        models: [env.MODEL || 'grok-4-fast'],
        fuel: { required_for_depth: true, open_research: false },
        has_key: Boolean(env.XAI_API_KEY),
      }, cors);
    }

    const isChat =
      request.method === 'POST' &&
      (path === '/v2/chat' || path === '/api/chat');

    if (!isChat) {
      return json({ api_version: API_VERSION, error: 'Not found', code: 'NOT_FOUND' }, cors, 404);
    }

    return handleChat(request, env, cors);
  },
};

async function handleChat(request, env, cors) {
  if (!env.XAI_API_KEY) {
    return json({
      api_version: API_VERSION,
      ok: false,
      error: 'XAI_API_KEY not configured',
      code: 'NO_KEY',
      hint: 'wrangler secret put XAI_API_KEY',
    }, cors, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ api_version: API_VERSION, ok: false, error: 'Invalid JSON', code: 'BAD_REQUEST' }, cors, 400);
  }

  const messages = Array.isArray(body.messages) ? body.messages : null;
  if (!messages || !messages.length) {
    return json({ api_version: API_VERSION, ok: false, error: 'messages[] required', code: 'BAD_REQUEST' }, cors, 400);
  }

  // Fuel gate (client-reported until server ledger)
  const fuelBal =
    body.fuel && typeof body.fuel.balance === 'number'
      ? body.fuel.balance
      : Number(request.headers.get('X-DC-Fuel'));
  const burn = (body.fuel && body.fuel.burn) || 1;

  if (!Number.isNaN(fuelBal) && fuelBal <= 0) {
    return json({
      api_version: API_VERSION,
      ok: false,
      error: 'Fuel empty',
      code: 'FUEL_EMPTY',
    }, cors, 402);
  }

  const model = body.model || env.MODEL || 'grok-4-fast';
  const system =
    env.SYSTEM_PROMPT ||
    'You are DualisCapax Adaptive Intelligence (API v2). Clear and direct. Open research is free; depth is Fuel-metered. No medical cure claims; no securities offers.';

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
    return json({
      api_version: API_VERSION,
      ok: false,
      error: 'Upstream unreachable',
      code: 'UPSTREAM',
      detail: String(e),
    }, cors, 502);
  }

  const data = await xaiRes.json().catch(() => ({}));
  if (!xaiRes.ok) {
    return json({
      api_version: API_VERSION,
      ok: false,
      error: 'xAI error',
      code: 'UPSTREAM',
      status: xaiRes.status,
      detail: data.error || data,
    }, cors, 502);
  }

  const text =
    data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content || ''
      : '';

  return json({
    api_version: API_VERSION,
    ok: true,
    content: text,
    model: data.model || model,
    usage: data.usage || null,
    fuel: {
      burned: burn,
      note: 'client_authoritative_until_server_ledger',
    },
    session_id: body.session_id || null,
  }, cors);
}

function json(obj, cors, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}
