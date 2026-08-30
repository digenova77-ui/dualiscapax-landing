# DualisCapax API v2

**Current as of:** 2026-08-30  
**Unified contract:** [`docs/API-UNIFIED.md`](API-UNIFIED.md)

Base (after deploy): `https://YOUR-WORKER.workers.dev`  
Set `DC_API_BASE` on the client. No trailing slash. No `sk_` on the site.

## Endpoints

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/v2/capabilities` | Discovery — models, fuel rules, jacket flags |
| GET | `/health` | Liveness |
| POST | `/v2/chat` | Depth completion (Grok via server key) |
| POST | `/api/v2/chat` | Alias of `/v2/chat` |
| POST | `/api/chat` | Legacy alias of `/v2/chat` |
| POST | `/v2/dclm/attest/bind` | Sandbox session token |
| POST | `/v2/dclm/inference/wrap` | Same fuel gate as chat, jacket envelope |
| POST | `/v2/dclm/sandbox/execute` | Local measure / veto envelope |
| GET | `/v2/dclm/telemetry/circuit-breaker` | HUD ping |
| POST | `/v2/dclm/session/purge` | CLEANUP_FIRST |

## POST /v2/chat

### Request

```json
{
  "api_version": "2",
  "messages": [
    { "role": "user", "content": "What is DualisCapax?" }
  ],
  "fuel": {
    "balance": 12,
    "burn": 1
  },
  "session_id": "optional-client-id",
  "model": "optional-override",
  "max_tokens": 1024
}
```

### Response (ok)

```json
{
  "api_version": "2",
  "ok": true,
  "content": "…",
  "model": "grok-4-fast",
  "usage": { "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0 },
  "fuel": { "burned": 1, "note": "client_authoritative_until_server_ledger" },
  "access": "closed"
}
```

### Errors

| status | code | meaning |
|--------|------|--------|
| 402 | FUEL_EMPTY | balance ≤ 0 |
| 400 | BAD_REQUEST | missing messages |
| 503 | NO_KEY | XAI_API_KEY not set |
| 502 | UPSTREAM | xAI error |

## Auth

- **xAI key**: Worker secret `XAI_API_KEY` only
- **User Fuel**: v2 accepts client-reported balance until server ledger + auth exists
- **Jacket session**: `DCLM_SESS_SANDBOX_*` from `/v2/dclm/attest/bind` — not a TEE quote

## Client

Prefer `js/api-unified.js` (`dcApi`).  
`dcChatV2` and `dcApiV2Chat` remain as wrappers.

| ID | name | value | unit | status |
|----|------|-------|------|--------|
| ACCESS | Document packs | closed | flag | locked |
| LEDGER-EARNED | Total earned | 0 | CAD | closed |
| JACKET | Mode | SANDBOX | enum | live |
