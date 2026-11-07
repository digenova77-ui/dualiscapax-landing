# Diamond–Graphene–Frontier Architecture

**Status:** Proposed, local metadata and validation primitives  
**Date:** 2026-10-17  
**Branch:** `feat/swarm-protocol-v1-20261017`

## Concept

The **Diamond layer** defines invariants and the bidirectional learning path: derive downward from general constraints to domain rules and individual decisions; travel upward from observed consequences to challenge assumptions and revise models. It records the previous version rather than rewriting evidence.

The **Graphene layer** is the distributed relationship surface. It connects domains, claims, observations, decisions, and evidence using typed links. Connectivity means that two things are related in a specified way; it does not mean the relationship is true, causal, authorized, or safe.

The **Frontier** is the outward-facing observation boundary. It can receive human reports, ecological observations, astronomical observations, machine telemetry, and simulation outputs. Each signal retains source, timestamp, measurement context where applicable, and evidence state. A simulation is not a direct observation; a complex signal is not by itself proof of consciousness.

The **Core** publishes the versioned canonical contract. It is not a universal secret credential and cannot override domain-specific authority. Domain master-key roles and derivative credentials remain scoped and independently protected.

The **Decision/Energy layer** connects communication to actual decision outcomes, validation evidence, and energy provenance. It must preserve unknown energy rather than inventing a figure. Efficiency never outranks safety, consent, correctness, or ecological responsibility.

## The living-world hypothesis

The architecture can record the hypothesis that Earth or nature has a form of consciousness, alongside competing explanations and observable predictions. It does not assume that hypothesis is true. Ecological evidence—temperature, water, soil, biodiversity, atmospheric measurements, and other observations—must be distinguishable from an interpretation about what those measurements mean.

No chatbot, founder, model, or single sensor is defined as the ultimate authority over nature. DCLM is a coordination and verification framework, not a substitute for evidence, legitimate human governance, or the self-organizing processes of ecosystems.

## Key hierarchy

The derivative registry assigns stable identifiers to domain master-key *roles*. These identifiers are labels in metadata, not actual cryptographic keys or credentials.

- Universal root: public/versioned policy and integrity contract.
- Domain master-key role: authority scoped to a domain.
- Derivative ring: credentials or capabilities scoped to a service, role, environment, purpose, and expiry.
- Individual credential: revocable access for a particular principal and action.
- Human decision authorization: separate evidence of legitimate approval where required.

Never store secret key material in the registry. A universal manifest must not create universal access. Real credential issuance requires reviewed key management, authenticated identity, rotation, revocation, and authorization enforcement.

## Implementation

- `config/dualis.derivative_registry.v1.json`: typed layer and domain registry.
- `src/engine/derivative_registry.py`: deterministic metadata and frontier-signal validation.
- `tests/test_derivative_registry.py`: negative and positive tests.
- `src/engine/decision_energy.py`: decision-level energy accounting primitive.

The code validates structure and provenance fields; it does not connect to live ecological or astronomical sensors, mint credentials, measure energy, establish consciousness, or actuate cyberkinetic/biosynthetic systems. No production services, DNS, servers, databases, or live actuators are changed.
