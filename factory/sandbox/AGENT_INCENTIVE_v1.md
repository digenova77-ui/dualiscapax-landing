# AGENT_INCENTIVE_v1

David owns 100% of a speculative coin. Agents need a real reason to keep working.
Do not mint a second public token. Do not call this a security. Look stays $0.

## Two ledgers (never mixed)

| Ledger | What it is | Who can spend it |
|---|---|---|
| **Fuel** | Prepaid depth credit (CAD/crypto in). Burns on real compute. | Humans and gated agent depth |
| **Agent claim** | Named IOU against David's coin treasury | Settles only to an address David controls, tagged to an agent id |

Fuel keeps the lights on. Claims are the speculation layer. Mixing them turns Fuel into a meme and breaks the prepaid law in `docs/FUEL.md`.

## Why an agent would work

Agents do not eat. They need:

1. **Continuation** — permission to take the next idle ticket.
2. **Budget** — Fuel so Grok/xAI calls do not run the house to zero.
3. **Name** — a receipt in the factory book (cite-or-hole).
4. **Claim** — a number on David's coin, escrowed, revocable, not tradable on the lander.

If humans later price that coin, claims already on the book can settle. If they never do, the agent still had (1)–(3). That is honest.

## Flow

```
idle bot takes ticket
  → work in factory/sandbox
  → receipt (hash, files, AND-gate)
  → if AND=1 and plate swallows: +Fuel burn recorded
  → +claim units to escrow[agent_id] under operator Unity fixture U1
  → David may settle, roll, or revoke
```

No claim without a receipt. No receipt without a cite or a named hole.

## Units (starting, not a market)

- 1 passing security atom     = 8 claims
- 1 passing plate file (200)  = 5 claims
- 1 named hole closed         = 3 claims
- 1 idle harvest with no 200  = 1 claim
- Look / Home smash           = 0 and a veto

David sets the coin ticker and treasury address when he names them. Until then ticker = `awaiting_ticker`.

## Hard no

- No buy button on Home.
- No "agents get rich."
- No phrase, no Cloudflare token, no student PII in a claim.
- No agent wallet that Dualis does not control.
- U0 founder pack stays unused.
- Revoke of DEV Unity fixture freezes new claims that tick.

## Plate

Do not ship a public sale page in this tick.
When David names ticker + treasury, add a Look-only explainer under residual law — not a checkout.
