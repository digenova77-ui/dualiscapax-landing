/**
 * DualisCapax API v2 — depth proxy (Cloudflare Worker)
 * Secret: wrangler secret put XAI_API_KEY
 */

const XAI_URL = 'https://api.x.ai/v1/chat/completions';
const SERVER_CAPS = ['text'];

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-DC-Fuel, X-DC-Session',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);

    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/health' || url.pathname === '/api/v2/health')) {
      return envelope(
        {
          v: 2,
          ok: true,
          type: 'health',
          payload: {
            service: 'dualiscapax-depth',
            hasKey: Boolean(env.XAI_API_KEY),
            capabilities: { have: SERVER_CAPS },
          },
        },
        cors
      );
    }

    const isV2 = url.pathname.endsWith('/api/v2/chat');
    const isLegacy = url.pathname.endsWith('/api/chat');
    if (request.method !== 'POST' || (!isV2 && !isLegacy)) {
      return envelope({ v: 2, ok: false, error: { code: 'NOT_FOUND', message: 'Not found' } }, cors, 404);
    }

    if (!env.XAI_API_KEY) {
      return envelope(
        {
          v: 2,
          ok: false,
          error: { code: 'NO_KEY', message: 'XAI_API_KEY not configured', hint: 'wrangler secret put XAI_API_KEY' },
        },
        cors,
        503
      );
    }

    let raw;
    try {
      raw = await request.json();
    } catch {
      return envelope({ v: 2, ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON' } }, cors, 400);
    }

    // Normalize legacy → v2
    const req = normalizeRequest(raw);
    if (req.error) {
      return envelope({ v: 2, ok: false, id: raw.id || null, error: req.error }, cors, 400);
    }

    const fuelHdr = request.headers.get('X-DC-Fuel');
    if (req.channel === 'depth' && fuelHdr !== null && fuelHdr !== '' && Number(fuelHdr) <= 0) {
      return envelope(
        {
          v: 2,
          ok: false,
          id: req.id,
          error: { code: 'FUEL_EMPTY', message: 'Fuel empty' },
          fuel: { burned: 0, balance: 0 },
        },
        cors,
        402
      );
    }

    const model = req.model || env.MODEL || 'grok-4-fast';
    const system = env.SYSTEM_PROMPT || 'You are DualisCapax Adaptive Intelligence. Clear and direct. Open research free; depth is Fuel-metered.';

    const payload = {
      model,
      messages: [{ role: 'system', content: system }, ...req.messages],
      temperature: req.temperature,
      max_tokens: req.max_tokens,
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
      return envelope(
        { v: 2, ok: false, id: req.id, error: { code: 'UPSTREAM', message: 'Upstream unreachable', detail: String(e) } },
        cors,
        502
      );
    }

    const data = await xaiRes.json().catch(() => ({}));
    if (!xaiRes.ok) {
      return envelope(
        {
          v: 2,
          ok: false,
          id: req.id,
          error: { code: 'UPSTREAM', message: 'xAI error', status: xaiRes.status, detail: data.error || data },
        },
        cors,
        502
      );
    }

    const text =
      data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
        ? data.choices[0].message.content
        : '';

    const burn = req.channel === 'depth' ? req.fuelUnits : 0;

    return envelope(
      {
        v: 2,
        ok: true,
        id: req.id,
        type: 'chat.completion',
        payload: {
          content: text,
          model: data.model || model,
          usage: data.usage || null,
        },
        fuel: {
          burned: burn,
          balance: null,
          code: null,
        },
        capabilities: { have: SERVER_CAPS, effective: ['text'] },
      },
      cors
    );
  },
};

function normalizeRequest(raw) {
  // Already v2
  if (raw && raw.v === 2) {
    if (raw.type && raw.type !== 'chat.completion') {
      return { error: { code: 'BAD_REQUEST', message: 'Unsupported type' } };
    }
    const messages = raw.payload && Array.isArray(raw.payload.messages) ? raw.payload.messages : null;
    if (!messages || !messages.length) {
      return { error: { code: 'BAD_REQUEST', message: 'payload.messages[] required' } };
    }
    return {
      id: raw.id || null,
      channel: raw.channel === 'open' ? 'open' : 'depth',
      messages: messages.filter((m) => m && m.role !== 'system'),
      model: (raw.payload && raw.payload.model) || null,
      temperature: typeof (raw.payload && raw.payload.temperature) === 'number' ? raw.payload.temperature : 0.5,
      max_tokens: Math.min((raw.payload && raw.payload.max_tokens) || 1024, 4096),
      fuelUnits: (raw.fuel && raw.fuel.units) || 1,
    };
  }

  // Legacy { messages }
  if (raw && Array.isArray(raw.messages) && raw.messages.length) {
    return {
      id: raw.id || null,
      channel: 'depth',
      messages: raw.messages.filter((m) => m && m.role !== 'system'),
      model: raw.model || null,
      temperature: typeof raw.temperature === 'number' ? raw.temperature : 0.5,
      max_tokens: Math.min(raw.max_tokens || 1024, 4096),
      fuelUnits: 1,
    };
  }

  if (raw && raw.v && raw.v !== 2) {
    return { error: { code: 'UNSUPPORTED_V', message: 'Only v:2 supported' } };
  }

  return { error: { code: 'BAD_REQUEST', message: 'v2 envelope or legacy messages[] required' } };
}

function envelope(obj, cors, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}
