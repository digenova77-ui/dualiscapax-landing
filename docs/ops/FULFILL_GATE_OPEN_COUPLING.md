# Residual R7 — Fulfill ↔ gate open-path coupling (documented; no open)

**Status:** Documented residual. **Do not** set `CHECKOUT_OPEN=true` on either
Worker. **Do not** Bind-continue / open checkout from this note.

## Gap

dualis-gate `CHECKOUT_OPEN` and stripe-fulfill `CHECKOUT_OPEN` are independent
plain_text bindings. Opening gate does not automatically arm fulfill (and
vice versa). A future YES path must define an explicit, dual-admitted coupling
(both tips stamped+admitted, both vars intentional, Stripe live secrets correct)
— out of scope while parked.

## Current park invariant

- Fulfill: grant path refuses unless `String(env.CHECKOUT_OPEN||'') === 'true'`.
- Gate: closed path returns `applied:false` / `reason:closed` without KYC mint
  (`kyc_written` always false in `acceptStripeEvent` source).

Coupling work waits for an authorized open campaign. This file is not permission
to open.
