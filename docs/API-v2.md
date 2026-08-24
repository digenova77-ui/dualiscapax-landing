# DualisCapax API v2

**Version:** `2.0`  
**Transport:** HTTPS JSON  
**Auth (depth):** Fuel-backed session (server enforces)  
**Model backend:** xAI Grok via server-side key only

---

## Endpoint

```http
POST /api/v2/chat
Content-Type: application/json
X-DC-Fuel: <client_balance_hint>   # optional demo; server ledger wins in production
X-DC-Session: <session_id>        # optional
```

Legacy: `POST /api/chat` remains as alias → v2 handler.

---

## Request envelope

```json
{
  "v": 2,
  "id": "client-uuid-or-ulid",
  "type": "chat.completion",
  "plane": "dualiscapax",
  "channel": "depth",
  "payload": {
    "messages": [
      { "role": "user", "content": "…" }
    ],
    "model": "grok-4-fast",
    "max_tokens": 1024,
    "temperature": 0.5
  },
  "fuel": {
    "intent": "burn",
    "units": 1
  },
  "capabilities": {
    "want": ["text"],
    "have": ["text"]
  }
}
```

### Fields

| Field | Required | Notes |
|-------|----------|--------|
| `v` | yes | Must be `2` |
| `id` | recommended | Idempotency / client correlation |
| `type` | yes | `chat.completion` for depth dialogue |
| `plane` | no | Default `dualiscapax` |
| `channel` | no | `depth` \| `open` — open never burns Fuel |
| `payload.messages` | yes | OpenAI-style roles |
| `fuel.intent` | no | `burn` \| `quote` \| `none` |
| `fuel.units` | no | Suggested burn; server may adjust |
| `capabilities` | no | Intersection with server (text, future haptic) |

---

## Response envelope

```json
{
  "v": 2,
  "id": "client-uuid-or-ulid",
  "ok": true,
  "type": "chat.completion",
  "payload": {
    "content": "assistant text",
    "model": "grok-4-fast",
    "usage": { "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0 }
  },
  "fuel": {
    "burned": 1,
    "balance": null,
    "code": null
  },
  "error": null
}
```

### Error shape

```json
{
  "v": 2,
  "ok": false,
  "error": {
    "code": "FUEL_EMPTY",
    "message": "Fuel empty"
  },
  "fuel": { "burned": 0, "balance": 0 }
}
```

### Error codes

| Code | HTTP | Meaning |
|------|------|--------|
| `FUEL_EMPTY` | 402 | Depth blocked |
| `NO_KEY` | 503 | Server missing `XAI_API_KEY` |
| `BAD_REQUEST` | 400 | Invalid envelope |
| `UPSTREAM` | 502 | xAI failure |
| `UNSUPPORTED_V` | 400 | `v` ≠ 2 |

---

## Capability intersection

```text
client.capabilities.want ∩ server.capabilities.have → effective
```

Server baseline v2: `{ "have": ["text"] }`  
Future: `haptic`, `voice` when channel supports.

---

## Open vs depth

| Channel | Fuel | Backend |
|---------|------|--------|
| `open` | never | static / docs / local policy |
| `depth` | required | Grok via server key |

---

## Idempotency

If `id` is repeated within a short window with the same payload, server may return the prior result (when durable ledger exists).

---

## Security

- API key **only** on server env
- No key in GitHub Pages JS
- Production Fuel balance from **server ledger**, not client claim alone
