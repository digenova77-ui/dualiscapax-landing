# DualisCapax client payment gateway

Clients pay **DualisCapax**. Dualis may then buy xAI credits on the house team if the house rail is on.
This is not Interac-to-EQ and not a client checkout on console.x.ai.

## Two products

| Path | Who pays xAI |
|---|---|
| BYOK (`Authorization: Bearer xai-…`) | The client on their own console team |
| Fuel / seat (this worker) | Dualis house team — only after Dualis has a working card there |

Do not invite clients onto the house xAI team.

## Fiat

Stripe Payment Links + this fulfill webhook. SKUs: `depth_s` $20 / `depth_m` $50 / `depth_l` $120 Fuel; `leaf` $49 / `branch` $149 / `library` $499 seats (CAD).

Turn on card, Link, Apple Pay, Google Pay (and any CAD bank methods Stripe enables) on the **Dualis** Stripe account. No `sk_` on dualiscapax.ai.

## Crypto

Receive-only USDC / BTC / ETH / SOL at published Dualis wallets, 1:1 CAD-matched, memo = sku. Grant only after confirm. Addresses stay with the operator — not invented in git.

## After pay

Grant Fuel or seat. House `IRIS_ALLOW_HOUSE_KEY` stays `0` unless Fuel is being spent on a house key and a cap exists. Auto top-up on console.x.ai stays off until then.
