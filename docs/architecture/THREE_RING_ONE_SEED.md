# DualisCapax Three-Ring, One-Seed Architecture

**Status:** Initial implementation on feature branch; review required before adoption  
**Date:** 2026-10-17  
**Canonical seed:** `config/dualis.seed.v1.json`  
**Runtime primitive:** `src/engine/domain_architecture.py`  
**Production:** No deployment, DNS, server, database, or live-actuator changes are authorized.

## Design

One seed is the canonical versioned definition of the architecture. It does not mean one process or one point of failure. Components consume the same versioned domain identities, pipeline definitions, correlation types, governing laws, and invariants.

### Three rings

- **Ring A — Philosophy:** definitions, assumptions, meaning, values, scope, counterexamples.
- **Ring B — Physics:** observations, measurements, units, uncertainty, predictions, resource effects.
- **Ring C — Law:** authority, consent, rights, safety, privacy, responsibility, reversibility.

Each ring returns SUPPORT, CHALLENGE, NOT_APPLICABLE_WITH_REASON, or UNRESOLVED. Not-applicable findings require a reason. The rings review the same material claim but retain distinct remits. There is no majority-vote truth rule.

### Two pipelines

- **P1 — Discovery and bounded work:** observations, hypotheses, proposals, and only work already permitted by an external authorization boundary.
- **P2 — Independent validation:** evidence inspection, challenge, reproduction where applicable, and preservation of disagreement.

Different labels or agent IDs do not establish real independence. Production identity and permission enforcement remain separate implementation requirements.

### Typed correlations

Every cross-domain relationship must declare one type:

- `PHYSICAL_COUPLING`
- `MATHEMATICAL_CORRESPONDENCE`
- `EMPIRICAL_HYPOTHESIS`
- `PHILOSOPHICAL_CORRESPONDENCE`

A correlation marked SUPPORTED must include independent validation references. The label alone does not prove the relationship. Evidence references must resolve in the evidence system before production use; this local primitive validates shape, not reachability or authenticity.

### Gate

The local gate returns ACCEPT, DECLINE, BLOCKED_WITH_EXACT_MISSING_PRIMITIVE, or UNRESOLVED. Missing rings, missing independent validation, or missing explicit authorization block. A material challenge is not outvoted. Even ACCEPT does **not** grant execution authority; a separate authenticated policy enforcement layer must authorize and constrain side effects.

## Integration boundary

The seed is a shared contract, not a replacement for the existing swarm protocol, lifecycle, planner, ledger, or DCLM. Existing components should reference the canonical definitions over time rather than maintaining conflicting copies. Integration should be incremental and tested; no broad rewrite is required.

## Current implementation limits

- The local seed, protocol binding, correlation validator, and gate are deterministic Python primitives.
- They do not authenticate identities, resolve evidence references, provide distributed consensus, measure physical energy, or execute work.
- The local `authorized` input is a caller-supplied boolean, not an authentication mechanism. It demonstrates fail-closed decision logic only.
- The JSON seed status is PROPOSED. It is not a production policy deployment.
- CI results must be checked after the branch update; this document itself is not proof that tests passed.
