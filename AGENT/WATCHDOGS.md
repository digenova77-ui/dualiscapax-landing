# Watchdogs — construction site

Target: five-room hall + Unity ledger. Task: splice one floor, hash it, don't rewind.
Checkout stays closed until AUDIT-BEFORE-CHECKOUT is boring.
Not a Dualis L1. Blockchain-like = append + public SHA + replay.

## Floors and who watches

| Floor | Agency (who) | Watchdog (how) | Pass |
|---|---|---|---|
| 0 Site fence | Pages + CNAME | residual-ring C curls `/` and `/hall/` | `/hall/` is the tour, not a reroute |
| 1 Hall steel | git `hall/*` | residual-ring A SHA-256 | files present, identity rooms |
| 2 Spine | AGENT/AUTONOMY + AUDIT | secret-scan + human read | no `whsec_` in git |
| 3 Gate isolate | `workers/dualis-gate` | `/u/health` checkout:false | never bind `/*` |
| 4 HMAC door | stripe-hmac-verify | TEST 400 / 200 / duplicate | no D1 on bad sig |
| 5 Event log | webhook_event PK | replay same `evt_` | second is no-op |
| 6 Projection | unity_fields / kyc | rebuild vs live | mismatch = handler bug |
| 7 Money vault | CHECKOUT_OPEN | `/pay/intent` 403 | flag false until Bind-continue |
| 8 Chain receipt | WAIT_GRANT | hash of event, not a mint | no Dualis coin |

Forwards = next floor only when the floor below hashes.
Backwards = old commit SHAs and old `evt_` still verify after the splice.

## Humans on site

- Seat (David): Bind-continue, residual sentence, secrets in Wrangler not git.
- Ring (Actions): noon UTC + every push. Neighbor on the street.
- Secret-scan: no keys in the lumber pile.
- Preview Worker: TEST `whsec_` only.
- No agency API is wired. Watchdog here is Dualis process, not GOC/OHIP/Stripe Dashboard as a substitute log.

Skip a floor and the vault stays locked. That is oversight.
