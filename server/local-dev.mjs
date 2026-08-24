/**
 * Local depth API for testing — reads XAI_API_KEY from environment only.
 *   export XAI_API_KEY=xai-...
 *   node server/local-dev.mjs
 */
import http from 'node:http';

const KEY = process.env.XAI_API_KEY;
const PORT = Number(process.env.PORT || 8787);
const MODEL = process.env.MODEL || 'grok-4-fast';

if (!KEY) {
  console.error('Set XAI_API_KEY in the environment. Do not put it in source files.');
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-DC-Fuel');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, local: true }));
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/chat') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  const chunks = [];
  for await (const c of req) chunks.push(c);
  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const messages = body.messages || [];
  const xai = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + KEY,
    },
    body: JSON.stringify({
      model: body.model || MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are DualisCapax Adaptive Intelligence. Clear and direct. Open research free; depth is Fuel-metered.',
        },
        ...messages,
      ],
      max_tokens: 1024,
    }),
  });

  const data = await xai.json();
  if (!xai.ok) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'xAI error', detail: data }));
    return;
  }

  const content = data.choices?.[0]?.message?.content || '';
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true, content, usage: data.usage || null }));
});

server.listen(PORT, () => {
  console.log('DualisCapax depth API local on http://127.0.0.1:' + PORT + '/api/chat');
  console.log('Key loaded from env only.');
});
