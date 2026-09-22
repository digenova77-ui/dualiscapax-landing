# crypto-gate

Public settlement language for DualisCapax after Stripe retirement.

- Rail: receive-only USDC (CAD-matched). BTC / ETH / SOL remain operator receive-only per CLIENT-GATEWAY.md.
- `CHECKOUT_OPEN=false` and `CRYPTO_OPEN=false` until Bind-continue.
- This worker does **not** hold keys, does **not** call `DCLMVault.routeUsdc`, and does **not** invent wallets.
- Stripe fulfill + HMAC stay DARK for identity later. Public plates must not link `buy.stripe.com`.

## Routes

| Method | Path | Live contract |
| --- | --- | --- |
| GET | `/` `/pay/quote` `/pay/dry-run` `/pay/crypto` | `open:false` envelope |
| POST | `/pay/intent` | `403 closed` |

Do not bind `/*`. Pages owns `/`.
