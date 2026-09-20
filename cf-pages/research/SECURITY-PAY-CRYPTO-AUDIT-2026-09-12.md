<!-- Egg #15 FREEZE: concrete vault strings redacted on Absolute-served research surface. -->
# Security · payment / pricing / crypto audit

ED-COM-20260912-SEC-PAY · pages-slim scan

## Crypto addresses (canonical bind)

| Chain | Field | Address | Format | Bound in `DC_PAYMENTS` | Shown on `hall/rails.html` |
|---|---|---|---|---|---|
| Bitcoin | `research_btc` | `[PARKED_BTC]` | bech32 OK | **was missing → fixed** | yes |
| Ethereum | `research_eth` | `[PARKED_ETH]` | 0x+40 hex OK | yes | yes |
| Solana | `research_sol` | `[PARKED_SOL]` | base58 OK | yes | yes |

POL / LINK / BSC reuse the same ETH address (EVM). Confirm that is intentional for your wallets.

## Findings (threats to onboarders / money)

1. **HIGH — Fake settlement CTA** on `alacarte.html`: alert claimed settlement/download with no Stripe / no chain send. **Fixed** → routes to `payments.html` / `donate.html`.
2. **HIGH — `donate.html` 404 on live slim** while payments linked to it. **Restored** into pages-slim with BTC + ETH + SOL.
3. **HIGH — BTC unbound** in `js/payments-config.js` while hall listed it. **Bound `research_btc`.**
4. **MEDIUM — Stripe link gaps:** `fuel_10` and `fuel_1000` are `null` (good: refuse inventing buy.stripe.com). Do not sell those SKUs until links exist.
5. **MEDIUM — Client trust theater:** lander peel still has bounty / C-suite alert copy — not a money drain. Park for copy pass.
6. **OK — No sk_live / sk_test / TeamSnap client secret in pages-slim.** TeamSnap secret stays on worker env.
7. **OK — Stripe Payment Links** on payments.html are public checkout URLs (expected). Verify webhook HMAC on fulfill worker separately.
8. **OK — Ice paywall closed** (founder pay-skip only); seat claim is not a card charge path.

## Operator confirm needed

- Confirm BTC / ETH / SOL addresses above are still the live receive wallets you control (format checks only — not ownership proof).
- Confirm EVM reuse (ETH=POL=BSC=LINK) is intentional.
