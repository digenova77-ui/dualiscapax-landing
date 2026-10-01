# Crypto-Only Fuel Gateway — Decision Base Unit

**Status:** protocol scaffold / testnet-only / `WAIT_GRANT`  
**Settlement:** crypto-only Unity token; no CAD, Stripe, bank, or fiat field is accepted by the API contract.  
**Base unit:** `1 Fuel unit`.

## Decision base unit

The repository already defines Fuel as closed prepaid capacity for Adaptive Depth and Fusion Meter as the internal residual-cost meter. This gateway uses **one integer Fuel unit** as the smallest decision and burn unit. It does not create a new tradable coin.

- Open research: 0 Fuel required.
- Depth/adaptive work: burns Fuel after successful completion.
- Illustrative burn: `max(1, ceil(measured_residual_cost_units))`; provider-specific cost and Importance may increase the burn.
- Fuel is non-transferable inside the product ledger and cannot be redeemed for CAD.

## Burn-to-access modes

1. **Unity token settlement:** a verified Unity-token event is the sellable settlement proof; the gateway issues a non-transferable Fuel entitlement.
2. **eFuse covenant:** the eFuse token is non-sellable and is used only as a Father/kernel authority or covenant reference.
3. **No custody:** the current scaffold does not hold, exchange, redeem, or route tokens; it only defines the receipt shape and remains `WAIT_GRANT`.

The current implementation supports neither live asset verification nor custody. It treats Unity as sellable settlement, eFuse as non-sellable authority, and Fuel as the internal decision base unit. It returns `WAIT_GRANT` until a Father-approved verifier configuration exists.

## Required configuration before live use

- chain ID;
- Unity token contract/address;
- eFuse covenant contract/address or authority reference;
- burn contract or receiving contract;
- finality requirement;
- oracle/indexing source;
- Unity ID issuer and audience;
- Father/kernel signer or quorum;
- jurisdiction/compliance review;
- replay protection and refund policy.

These values are deliberately unset. The site must not invent them.

## API v2 contract

- `GET /api/v2/pricing/catalog` — returns unit-based plans; no fiat values.
- `POST /api/v2/crypto/quote` — returns a nonce-bound quote with chain/asset marked `UNSET` until configured.
- `POST /api/v2/crypto/verify` — accepts a transaction reference for verification but remains `WAIT_GRANT` without a configured verifier.
- `POST /api/v2/unity-id/bind-entitlement` — remains Father/kernel-gated; payment proof never grants machine-write authority.

## Boundary

This architecture is not a claim that avoiding CAD avoids regulation. Receiving, issuing, transferring, or burning crypto for access can create tax, consumer, AML/MSB, securities, sanctions, and other obligations. Live deployment requires qualified Ontario/Canadian counsel and a real compliance decision.
