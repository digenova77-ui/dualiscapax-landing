# DualisCapax API v2

Base (after deploy): `https://YOUR-WORKER.workers.dev`

## Endpoints

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/v2/capabilities` | Discovery — models, fuel rules, features |
| POST | `/v2/chat` | Depth completion (Grok via server key) |
| GET | `/health` | Liveness |

Legacy: `POST /api/chat` still accepted (maps to v2).

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
  "fuel": { "burned": 1, "note": "client_authoritative_until_server_ledger" }
}
```

### Errors

| status | code | meaning |
|--------|------|--------|
| 402 | FUEL_EMPTY | balance ≤ 0 |
| 400 | BAD_REQUEST | missing messages |
| 503 | NO_KEY | XAI_API_KEY not set |
| 502 | UPSTREAM | xAI error |

## GET /v2/capabilities

```json
{
  "api_version": "2",
  "service": "dualiscapax-depth",
  "features": ["chat", "fuel_gate", "system_prompt"],
  "models": ["grok-4-fast"],
  "fuel": { "required_for_depth": true, "open_research": false },
  "has_key": true
}
```

## Auth

- **xAI key**: Worker secret `XAI_API_KEY` only
- **User Fuel**: v2 accepts client-reported balance until server ledger + auth exists
