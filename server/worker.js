/**
 * DualisCapax depth proxy — Cloudflare Worker
 * XAI_API_KEY must be set via: wrangler secret put XAI_API_KEY
 */

const XAI_URL = 'https://api.x.ai/v1/chat/completions';

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
      return json({ ok: true, service: 'dualiscapax-depth', hasKey: Boolean(env.XAI_API_KEY) }, cors);
    }

    if (request.method !== 'POST' || !url.pathname.endsWith('/api/chat')) {
      return json({ error: 'Not found' }, cors, 404);
    }

    if (!env.XAI_API_KEY) {
      return json({
        error: 'XAI_API_KEY not configured',
        hint: 'Run: wrangler secret put XAI_API_KEY',
      }, cors, 503);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, cors, 400);
    }

    const messages = Array.isArray(body.messages) ? body.messages : null;
    if (!messages || !messages.length) {
      return json({ error: 'messages[] required' }, cors, 400);
    }

    // Optional: reject when client claims zero fuel (demo header)
    const fuelHdr = request.headers.get('X-DC-Fuel');
    if (fuelHdr !== null && fuelHdr !== '' && Number(fuelHdr) <= 0) {
      return json({ error: 'Fuel empty', code: 'FUEL_EMPTY' }, cors, 402);
    }

    const model = body.model || env.MODEL || 'grok-4-fast';
    const system = env.SYSTEM_PROMPT || 'You are DualisCapax Adaptive Intelligence.';

    const payload = {
      model,
      messages: [{ role: 'system', content: system }, ...messages.filter((m) => m.role !== 'system')],
      temperature: typeof body.temperature === 'number' ? body.temperature : 0.5,
      max_tokens: Math.min(body.max_tokens || 1024, 4096),
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
      return json({ error: 'Upstream unreachable', detail: String(e) }, cors, 502);
    }

    const data = await xaiRes.json().catch(() => ({}));
    if (!xaiRes.ok) {
      return json({
        error: 'xAI error',
        status: xaiRes.status,
        detail: data.error || data,
      }, cors, 502);
    }

    const text =
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
        ? data.choices[0].message.content
        : '';

    return json({
      ok: true,
      content: text,
      model: data.model || model,
      usage: data.usage || null,
    }, cors);
  },
};

function json(obj, cors, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}
