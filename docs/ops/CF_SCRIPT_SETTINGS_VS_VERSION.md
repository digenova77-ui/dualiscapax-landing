# Residual R8 — Script settings API omits D1 (+ gate deploy footgun)

## Footgun A — settings vs version

`GET /accounts/{id}/workers/scripts/{name}/settings` often returns
`plain_text` / `secret_text` only. **D1 bindings may be absent** even when the
serving version has `type: d1`.

**Always observe bindings from the serving version resource:**

```text
GET .../workers/scripts/{name}/versions/{serving_version_id}
→ result.resources.bindings
```

Use `scripts/cf_worker_bindings_observe.mjs` (this repo).

Observed 2026-09-19 (fulfill serving `5599c24d…`):

| Surface | Bindings seen |
|---|---|
| `/settings` | CHECKOUT_OPEN, STRIPE_WEBHOOK_SECRET (**no D1**) |
| `/versions/5599c24d…` | CHECKOUT_OPEN, **DB (d1)**, STRIPE_WEBHOOK_SECRET |

## Footgun B — bare wrangler deploy strips D1 (dualis-gate)

**Observed (parent, 2026-09-19):** Accidental `wrangler deploy` for
`dualis-gate` **without** local D1 config dropped the DB binding. Rebound via
**uncommitted** `workers/dualis-gate/wrangler.local.toml` pointing at
`dualis-unity` database id `603c0c02-…` (NOT committed to git).

### Operator rule

1. Never deploy dualis-gate from a machine/toml that lacks the D1 binding
   stanza you intend to keep.
2. Prefer `wrangler.local.toml` (gitignored) or dashboard bind — **do not**
   commit live `database_id` into tracked `wrangler.toml`.
3. After every gate deploy: observe **version** bindings (not settings) and
   confirm `d1` / `DB` present before claiming KYC/idempotency live.
4. Serving gate version after rebound (parent): `d692555a-bdf4-48f4-9e77-4ea8e856bf86`.

This is an ops observability / deploy-process residual, not an HTTP park bypass.
