# dualis-unity D1 projections

Stamp: 2026-09-21
Database name: `dualis-unity` (id lives in the Cloudflare dashboard, never git).
Worker: `dualis-gate` routes `/u/*` `/hooks/*` `/pay/*` only. Never `/*`.
`CHECKOUT_OPEN` stays false.

## Live vs paper

- `/u/health` on apex returns `{"ok":true,"phase":"B+C","checkout":false}` — gate is bound.
- wrangler.toml keeps `[[d1_databases]]` commented. Dashboard bind is the live wire.
- `workers/stripe-fulfill/schema.sql` is a **different** database (`dualiscapax-fulfillments`) with entitlements / fuel / email. That schema stays DARK. Do not attach it to dualis-gate. Email in a fulfillment fold is a PII wave, not lander law.

## Tables

| Table | Kind | Mutability |
|---|---|---|
| `unity` | identity root | insert on `/u/session`; never delete |
| `unity_session` | cookie fold | insert; expire by `expires_at`; hash of raw token |
| `unity_fields` | projection | update from `/u/name` |
| `unity_kyc` | projection | upsert from verified identity webhook |
| `webhook_event` | log | append only; `ON CONFLICT(event_id) DO NOTHING` |

Raw Stripe payload is not stored. `payload_hash` is SHA-256 of `{id, type}` only.

## Replay

Same `evt_` a second time: insert changes = 0 → `{ duplicate: true }`. No second fold.

## Rebuild (floor 6)

`unity_kyc.kyc = 1` iff at least one `webhook_event` row exists for that `unity_id` with type `identity.verification_session.verified`.
If the select in `schema.sql` disagrees with live rows, fix the handler. Do not UPDATE old events.

## What this database is not

- Not a fuel ledger
- Not a Dualis coin
- Not an email store
- Not the vault
