# DualisCapax

### Trinity-governed computing, identity, and human–AI collaboration

[Website](https://dualiscapax.ai) · [GitHub repository](https://github.com/digenova77-ui/dualiscapax-landing)

DualisCapax is an evolving engineering project exploring how human-facing interfaces, AI agents, identity, deterministic computation, and controlled execution can operate within one auditable system.

Its central principle is:

> **Capability does not confer authority.**

Trinity defines the governing framework. Agents may observe, reason, and propose; protected operations must pass the applicable authorization checks before execution. Missing authority or required evidence must result in a refusal, not an implicit grant.

This repository contains the website and related interface and edge-runtime assets. The wider DualisCapax architecture spans additional services and experiments; the presence of a concept or interface here does not imply that every related service is connected or production-ready.

## Unity Seal (UNITY_SEAL_v1)

Canonical measure from efuse-unity. Empty center, Mirror ∈ {0,1}, exempt=false∀, same toll, fail-closed.

Read-only verification routes (Cloudflare Pages Advanced Mode, no-store):

- https://dualiscapax.ai/seal
- https://dualiscapax.ai/unity/status

Expected unity_hash: d95aa793e6bc330710ea6b9acab1ce6ed127c2c89c21715adba5a15e2e5fda41

Match reports PASS; drift or error reports DRIFT or 503. Apex remains Pages assets.

## Principles

- **Trinity governs.** Authorization rules must be enforced at the execution boundary, not merely described in prompts or documentation.
- **Fail closed.** If a mandatory identity, session, authorization, or validation check fails, reject the protected operation.
- **Read and propose before writing.** Inspection, reasoning, and proposals do not grant write permission.
- **Verify before claiming success.** A build, HTTP 200, health response, or existing source file is not proof of end-to-end functionality.
- **Minimize complexity.** Reuse sound existing components and remove redundant scaffolding without removing necessary security boundaries.
- **Preserve host safety.** Production changes require explicit authorization and verification.

## Architecture

The intended control flow is:

```text
Human / Operator
      |
      v
Website and Interface
      |
      v
Iris — conversational AI experience
      |
      v
Trinity — identity, law, authorization
      |
      v
DCLM — controlled execution boundary
      |
      v
Authorized APIs and computation
      |
      v
Verified results and audit evidence
```

This is the target architecture, not a claim that every connection is currently complete.

### Trinity

The governance framework defines which operations may proceed and under what conditions. It is intended to keep identity, policy, and execution authority explicit.

### Iris

Iris is the intended human-facing AI experience. Its capabilities should be reported according to observed behavior: what it can access, what it can infer, what it proposes, what it is authorized to do, and what has actually succeeded.

A missing provider, invalid session, unavailable service, or missing credential must be reported honestly. A placeholder connector must not be presented as a working integration.

### DCLM

DCLM is the execution-control component, not an independent source of authority. It should validate requests and applicable governance requirements before allowing protected operations.

### Three-ring model

| Ring | Domain | Intended responsibility |
|---|---|---|
| Physics | Energy and resources | Account for computational work and resource consumption. |
| Philosophy | Identity and meaning | Establish identity-related context and evidence. |
| Law | Authority and constraints | Govern permitted actions and state transitions. |

Related concepts include **UniFi³** (identity), **eFuse** (energy/resource accounting), and **Merit** (contribution and value). These concepts should remain distinct; operational claims require implemented mechanisms and testable evidence.

## Repository scope

This repository is the website/interface and edge-related portion of the wider project. The root includes static HTML/CSS/JavaScript assets and deployment-related files, including a Cloudflare Worker and Wrangler configuration.

Relevant files may include:

- `_worker.js` — edge request handling (includes Unity seal routes).
- `wrangler.toml` — Wrangler/Cloudflare configuration.
- `_headers` and `_redirects` — hosting headers and redirect rules.
- `unity-id.html`, `unity-id.js`, and related Unity pages — identity-facing interface assets.
- `tests/` — repository tests, where present.
- `DualisCapax_Master_Index_V244.html` — a project index/interface artifact.

Inspect the current source and configuration before changing these files. Deployment behavior depends on the active hosting configuration and may differ from local behavior.

## Compute interface

A related interface documented in the project is:

`POST /api/v2/compute`

The expected request contract has included:

- `Content-Type: application/x-www-form-urlencoded`
- An `x-trinity-mode` header
- Explicit `box` and `op` form fields
- A bounded input payload (the documented limit is 256 bytes for the relevant input)

Confirm the live implementation before relying on this contract. A successful request proves only the behavior exercised by that request; it does not prove that all identity, authorization, or downstream integration requirements are satisfied.

## Security expectations

- Keep credentials, private keys, and session secrets out of URLs and logs.
- Use least-privilege access for provider and service integrations.
- Validate request formats and input bounds at the server boundary.
- Test both allowed and denied operations.
- Keep development, staging, and production permissions distinct.
- Do not treat hashes as proof of authorization or truth.
- Do not allow an agent, monitor, or deployment process to grant itself authority.
- Record appropriate evidence while avoiding sensitive-data leakage.
- Obtain explicit authorization before production writes or deployments.

The following governance labels are used in the project design:

- `TRUTH_OR_NOTHING` — claims and transitions require supporting evidence.
- `NO_FORCE` — reject unauthorized or coercive state transitions.
- `HOST_SAFE` — respect host-system boundaries and operational safety.
- `CLEANUP_FIRST` — handle temporary state and residue where required before proceeding.

These are requirements to verify in the actual code, not proof of universal enforcement.

## Development workflow

1. Inspect the current implementation and its dependencies before adding another layer.
2. Identify the target service, environment, and expected behavior.
3. Make the smallest change that preserves the governing invariants.
4. Test normal behavior, invalid inputs, missing credentials, and denied operations.
5. Verify the actual runtime behavior; do not rely on build success alone.
6. Document limitations and retain relevant verification evidence.
7. Obtain explicit authorization before production changes.

Do not remove security controls merely to simplify the architecture. Simplification is successful when it reduces unnecessary complexity while preserving correctness and authorization boundaries.

## Development status

DualisCapax is under active development. Treat the following as the standard for status claims:

| Area | How to assess it |
|---|---|
| Website | Verify the deployed site and current hosting configuration. |
| Trinity | Verify enforcement at each protected execution path. |
| Iris | Verify the real session-to-provider-to-interface path end to end. |
| Compute API | Test the deployed contract, validation, and authorization behavior. |
| Identity/actor binding | Require valid, verifiable session and actor evidence. |
| Accounting/ledger experiments | Verify the measurement method, implementation, and tests. |
| Autonomous deployment | Require explicit authorization and independent result verification. |
| Unity seal | Verify /seal and /unity/status report match against UNITY_SEAL_v1. |

A feature is complete only when evidence appropriate to that feature supports the claim. Source files, configuration values, health endpoints, and placeholders alone are insufficient.

## Project direction

The long-term objective is a coherent and auditable environment for human–AI collaboration and governed computation:

- One explicit governance model.
- A real, verifiable Iris service path.
- Bounded, deterministic computation where applicable.
- Clear separation between identity, authority, and resource/value accounting.
- Minimal architecture with enforceable security boundaries.
- Evidence-backed operation and carefully controlled autonomy.
- Unity seal consistent across surfaces (empty center, Mirror, same toll).

## Contributing

Before proposing or implementing a change, explain the intended effect, identify the affected authorization boundary, and specify how success and failure will be tested. Production changes require explicit authorization. Report what was actually tested and what remains unverified.

## Governing principle

**Intelligence may propose. Computation may execute. Trinity governs whether execution is permitted.**

Autonomy is not the absence of governance; it is reliable operation within defined authority boundaries.

---

*This README describes project intent, repository scope, and verification expectations. Operational capabilities should be treated as established only when supported by current implementation evidence and reproducible tests.*
