# Trinity Autonomy and Integration Contract

## Objective

Build toward an autonomous system that discovers capabilities, ranks integration
options, requests missing access, executes authorized tasks, validates outcomes,
and learns from verifiable evidence. Autonomy is bounded by explicit policy;
it is not permission to bypass provider rules or self-issue authority.

## Control flow

1. **Discover** providers and tools through documented, official interfaces.
2. **Describe** each integration with capabilities, scopes, cost, reliability,
   permitted side effects, terms status, connection status, and owner-granted scopes.
3. **Score affinity** deterministically. A score measures fit; it is not an
   authorization token.
4. **Gate** task approval, owner scope grants, provider terms, cost ceilings,
   identity, and side-effect boundaries. Missing or uncertain authorization fails closed.
5. **Connect** through provider-supported OAuth or API authorization. The system
   may prepare a signup/connection request, but a human must complete identity,
   legal acceptance, payment, or other provider-required consent. No fake identities,
   CAPTCHA circumvention, duplicate-account evasion, or bulk signup.
6. **Execute** only the approved task and only within the granted scopes.
7. **Verify and record** outcome, evidence digest, cost, errors, and revocation state.
8. **Recover** with bounded retries and idempotency keys. Stop and escalate on
   repeated failures, policy conflicts, unexpected side effects, or scope changes.

## Identity and credentials

- Each agent has a distinct, auditable machine identity and least-privilege grants.
- Use official OAuth/device authorization or documented service-account flows.
- Never place secrets in URLs, source code, logs, browser storage, or chat messages.
- Store tokens only in a dedicated secret manager; redact them from telemetry.
- Support revocation, expiry, scope review, and a complete integration inventory.
- Do not infer consent from an affinity score, prior access, or a successful login.

## Affinity semantics

The planner in `autonomy/affinity.py` returns a score from 0 to 100 and an
independent eligibility decision. A score of 100 means perfect measured fit for
the modeled task only. It does not override missing approval, missing scopes,
unverified terms, excess cost, unofficial interfaces, or prohibited side effects.

## Write authority

Trinity is the governing framework. Agents can inspect, reason, propose, test,
and perform actions expressly permitted by a valid authorization. They cannot
modify the policy gate, elevate their own grants, alter authoritative state outside
their assigned scope, or make an unauthorized write valid after the fact. No valid
authority means no write.

## Initial implementation boundary

The current planner is pure and offline: it ranks declared candidates and emits
reasons. It does not connect to providers, create accounts, hold credentials,
schedule background tasks, or perform production changes. Those capabilities
must be added behind separately reviewed adapters, explicit grants, audit records,
and tests before being enabled.
