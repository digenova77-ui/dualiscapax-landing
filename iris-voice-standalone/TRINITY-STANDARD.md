# Trinity Standard — Iris execution boundary

**Status: contract and tests only; canonical authority adapter is not connected.** This document does not claim the live system is governed by this module.

## Governing invariants

1. **TRUTH_OR_NOTHING** — an unverified identity, unavailable law decision, missing receipt, or unknown state is not treated as success.
2. **NO_FORCE** — model output, client-supplied IDs, cookies, Fuel balances, and headers cannot grant authority.
3. **HOST_SAFE** — forwarded network metadata is untrusted unless a known trusted proxy boundary is configured.
4. **CLEANUP_FIRST** — any future mutation must declare its target and cleanup/rollback plan before execution.
5. **SAFE_HOST / ZERO_FORCE** — no production write, deployment promotion, DNS change, or database mutation without an explicit authoritative decision.
6. **Father is the sole writing authority** — a write action is denied unless the canonical law decision explicitly grants the required authority. The string `FATHER` in an untrusted request is never evidence.
7. **Fail closed** — absent canonical verifier or law adapter means unavailable, not fallback identity and not a mock production response.

## Request path

```text
Request
  -> canonical session verifier
  -> verified actor identity
  -> authoritative Trinity/law decision (action + target + mutation)
  -> explicit decision receipt
  -> provider connector (read/response path only)
  -> normalized result
```

Every edge is mandatory. No model output can alter a decision already made by the law gate. The provider connector must never be called before verification and explicit authorization.

## Action classes

- Non-mutating: `iris.model.turn`, read-only status, permitted read operations.
- Mutating: `repo.write`, `site.write`, `config.write`, `deployment.promote`, `dns.change`, `database.mutate`.

Mutating actions require a canonical law receipt and Father authority. This module is deliberately not a source of that authority: it only validates the injected verifier and law decision contracts.

## What is implemented here

- A pure policy seam with no default-allow behavior.
- Explicit denial for missing verifier, unverified/unbound actor, missing law adapter, exceptions, denied decisions, or missing decision receipt.
- Write-action check requiring explicit Father authority.
- Automated tests for the denial matrix and actor/action binding.

## What remains a production prerequisite

1. Locate and reuse the existing canonical session verifier.
2. Connect the authoritative Trinity/law service and validate its real receipt schema and signatures.
3. Ensure actor identity comes from that verified session, not request JSON or a browser correlation stamp.
4. Integrate the provider connector only after successful gate evaluation.
5. Add end-to-end tests against the actual service and deploy only after CI and a reviewed rollout.
