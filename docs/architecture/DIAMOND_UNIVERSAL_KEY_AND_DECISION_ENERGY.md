# Diamond, Universal Key, Domain Keys, and Decision-Level Energy

**Status:** Proposed architecture  
**Date:** 2026-10-17  
**Branch:** `feat/swarm-protocol-v1-20261017`  
**Scope:** Design only. No production keys, identity provider, DNS, server, or actuator changed.

## 1. Diamond iteration: ceiling ↔ floor

The diamond is a two-direction learning loop:

1. **Ceiling / universal constraints:** state the broadest model, invariants, unknowns, and limits of inference.
2. **Spectrum / domains:** separate physics, logic, language, life, energy, law, economics, and human meaning.
3. **Floor / individual decisions:** define concrete identities, permissions, events, resource usage, and outcomes.
4. **Upward pass:** compare observed outcomes against predictions and assumptions; revise or reject the higher-level model.
5. **Downward pass:** derive domain rules and scoped permissions only where the higher-level contract justifies them.

Every cycle terminates with a recorded state: validated, rejected, blocked, or unresolved. No loop may rewrite evidence merely to force agreement.

## 2. Universal Key versus domain master key

These are architectural roles, not claims that humanity owns the cosmos.

- **Universal Key (formal root):** the versioned root-of-derivation contract: seed identity, protocol version, canonical rules, domain registry, key-derivation policy, and integrity verification. It is not a universal password, an all-powerful credential, or authority over reality.
- **Domain master key:** a scoped cryptographic or policy root for one domain (for example, energy accounting, evidence ledger, identity, or deployment). It can authorize only within that domain's declared scope.
- **Derivative key ring:** a set of narrower keys provisioned for a service, role, environment, purpose, or time window.
- **Individual key:** the smallest practical credential or capability, bound to a specific principal, purpose, scope, expiry, and revocation policy.

### Critical security rule

Do not make one operational private key the source of every production credential in a way that allows compromise of the root to compromise the entire system. The universal root should primarily be a public/versioned policy and trust anchor. Use separately protected roots, domain separation, short-lived scoped credentials, rotation, revocation, and independent authorization. Where cryptographic derivation is appropriate, use a reviewed standard such as HKDF with explicit context labels; never invent a custom cryptographic derivation scheme.

The word “key” must be typed: `POLICY_ROOT`, `PUBLIC_TRUST_ANCHOR`, `DOMAIN_MASTER`, `DERIVED_SERVICE_KEY`, `INDIVIDUAL_CREDENTIAL`, or `HUMAN_DECISION_AUTHORIZATION`. These types are not interchangeable.

## 3. Key identity and derivation labels

Every derivative should be reproducible and auditable from non-secret metadata:

`seed_version / domain_id / purpose / principal_id / environment / scope / expiry / algorithm_id / key_version`

Do not put secret key material in the manifest, ledger, logs, prompts, or client-side code. A domain key cannot grant permissions in another domain. A universal manifest cannot itself authenticate a human or authorize a consequential operation.

Numbers and letters are identifiers, not proof of authority. A string such as `U-01`, `D-PHYS-01`, or `R-LAW-03` becomes meaningful only when a canonical registry defines its scope and lifecycle.

## 4. Decision-level communication accounting

The unit of value is not output volume. It is a decision event with a traceable outcome.

Each communication record should separate:
- **Input/output size:** tokens, bytes, or another named unit.
- **Energy:** joules with basis `MEASURED`, `ESTIMATED`, `SIMULATED`, or `UNKNOWN`.
- **Decision outcomes:** proposed, accepted, rejected, unresolved, or validated.
- **Evidence:** validation reference required before a decision counts as validated.
- **Context:** task class, model/service version, hardware boundary, measurement window, and whether energy includes accelerator, host, networking, storage, and cooling.
- **Quality and safety:** correctness, reversibility, harm, fairness, and whether the decision genuinely advanced the user's stated objective.

Derived metrics can include joules per output unit, joules per resolved decision, and joules per independently validated decision.

Only compare metrics when system boundaries, task class, and energy basis are sufficiently comparable. If energy is unknown, leave energy ratios unknown. Never silently turn an estimate into a measurement.

A lower joules-per-decision figure is not automatically better. A cheap but wrong or coercive decision is a failure. Optimize for useful, safe, human-authorized outcomes under transparent resource accounting—not maximum decisions per joule at any cost.

## 5. Human decision-level communication

A decision record should include the question, available options, evidence, uncertainty, responsible authority, affected parties, chosen action (if any), reversibility, expected outcome, and follow-up result. Communication quality is assessed by whether it improves informed choice and outcomes, not by persuasion, compliance, or raw message count.

No single score should collapse truth, human welfare, rights, and energy into one number. Keep them as separate dimensions and use explicit constraints for non-negotiable safety and consent requirements.

## 6. Implementation status

This document is a design specification. It does not measure joules, authenticate validation references, evaluate decision quality, mint credentials, or establish a universal physical law. The key hierarchy remains a design until a reviewed key-management service and policy enforcement are implemented.
