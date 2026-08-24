# DualisCapax depth API — server-side xAI key

## Rule

```text
XAI_API_KEY lives only in server environment / secrets
Never in Git, never in frontend JS, never in chat HTML
```

## What this does

`server/worker.js` — Cloudflare Worker (or compatible) that:

1. Accepts `POST /api/chat` with `{ messages: [...] }`
2. Reads `XAI_API_KEY` from env
3. Calls `https://api.x.ai/v1/chat/completions`
4. Returns assistant text
5. Never exposes the key to the client

## Deploy (Cloudflare Workers)

```bash
cd server
npm i -g wrangler
wrangler login
wrangler secret put XAI_API_KEY
# paste key from https://console.x.ai (or xAI cloud API keys)
wrangler deploy
```

Set the public worker URL in the site:

```js
// js/api-config.js
window.DC_API_BASE = "https://YOUR-WORKER.workers.dev";
```

## Local Node test (optional)

```bash
export XAI_API_KEY=xai-...
node server/local-dev.mjs
```

## Fuel

Production should debit Fuel **on the server** after a successful completion.
Client-side Fuel is demo-only until auth + ledger are live.
