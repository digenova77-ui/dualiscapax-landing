# DualisCapax All-Plans Simulation Manifest

## Purpose

This manifest is the project’s planning index for the DualisCapax Builder, Unity ID, DCLM kernel, RTE, API v2 jacket, connectors, Dark Ledger, and Dual Pipeline. It is a **simulation input and implementation map**, not an authorization to execute every plan at once.

## Keep-going policy

The simulation continues through the next planned step when the current step returns `PASS` and its receipt is valid. It pauses and returns a structured result when it encounters:

- `HOLE`: missing identity, evidence, dependency, target, connector, or rollback path.
- `FAIL`: a test or invariant failed.
- `WAIT_GRANT`: authenticated quorum or Father/kernel authorization is required.
- `VETO`: policy forbids the requested operation.
- budget, timeout, retry, memory, disk, or rate limit.
- a material change to the request hash or base revision.

“Keep going” never means infinite loops, silent persistence, bypassing approval, guessing missing facts, collecting passwords, or executing arbitrary commands.

Recommended simulation limits:

```json
{
  "mode": "simulation",
  "max_active_tasks": 4,
  "max_steps_per_task": 12,
  "max_retries_per_step": 2,
  "max_runtime_seconds": 900,
  "external_writes": false,
  "stop_on": ["HOLE", "FAIL", "WAIT_GRANT", "VETO", "budget", "timeout", "material_change"],
  "receipt_required": true
}
```

## Plan groups

### A. Identity and access

- Unity ID issuer and opaque subject schema.
- WebAuthn/passkey registration and assertion.
- OAuth PKCE connector flow.
- Google account binding without storing a Google passphrase.
- Capability scopes, audience, expiry, nonce, and revocation.
- Dark Ledger redaction and audit chain.
- Human, bot, service, and swarm identity classes.
- Recovery, suspension, re-issue, and break-glass review.

### B. Dual Pipeline

- Claim object and canonical request hash.
- Fetch plan with independent sources.
- Evidence freshness and source provenance.
- Collapse to PASS, FAIL, or HOLE.
- Material-change invalidation.
- Deterministic before/after comparison.
- Receipts, rollback references, and review docket.

### C. Builder application

- Installable Builder PWA shell.
- 3D deterministic manifest compiler.
- Dual Pipeline workspace.
- Dark Ledger prompt generator.
- Local-only dry-run and request hash.
- Connector status view with redacted scopes.
- Simulation run dashboard.
- Receipt verifier and export.
- Explicit local-session versus verified-online-target indicator.

### D. API v2 jacket

- `/api/v2/health`.
- `/api/v2/tasks/prepare`.
- `/api/v2/tasks/{id}`.
- `/api/v2/tasks/{id}/dry-run`.
- `/api/v2/receipts/{id}`.
- Authenticated `/api/v2/chat` only after the security boundary exists.
- Explicit compatibility with `/api/iris`.
- Rate limits, request size limits, redaction, and no secret echo.

### E. RTE

- Browser invited runtime.
- Node invited runtime.
- Python invited runtime.
- Device bind and unbind receipts.
- Local manifest and hash validation.
- Derived-cell-only outbound boundary.
- No raw books, passwords, tokens, private keys, face templates, or GPS.
- Local receipt versus public-chain `WAIT_GRANT` distinction.

### F. Kernel and deterministic execution

- Manifest schema and compiler version pinning.
- WASM receipt validation.
- ABI and length-prefix checks.
- Layer-0 fail-closed flags.
- Reproducible fixtures.
- Fuzzing malformed frames.
- Hash-chain provenance.
- Rollback and upgrade compatibility.

### G. Connectors

- GitHub read-only audit and scoped actions.
- Google Drive read and reversible archive/move.
- Cloudflare Pages/Workers status and scoped deployment.
- Pinata/IPFS status and named-pin dry-run.
- Browser public versus authenticated-session distinction.
- Connector matrix: identity, target, scope, evidence, rollback.

### H. Operations and observability

- Health checks and status endpoints.
- Structured logs with secret redaction.
- Correlation IDs.
- Append-only audit events.
- Alerts for replay, bypass, nondeterminism, and failed gates.
- Incident containment.
- Restore and rollback drills.
- Capacity, rate, timeout, and retry budgets.

### I. Website and publication

- Builder route and PWA shell.
- RTE hall and explicit unconfirmed states.
- API v2 availability indicator.
- Cloudflare live-surface verification.
- GitHub source/provenance.
- Pinata spare-copy rules.
- No fabricated CID, live badge, or settlement claim.

## Simulation wave order

1. Inspect local and public surfaces.
2. Verify repository/base revision.
3. Validate builder manifest and kernel fixtures.
4. Validate API v2 bootstrap health and dry-run.
5. Validate Unity ID schemas without real credentials.
6. Validate connector capability matrix without reading secrets.
7. Run negative tests.
8. Produce a dependency and implementation report.
9. Pause at `WAIT_GRANT` before any external write.
10. Resume only with the same request hash and valid receipt.

## Universal task envelope

```json
{
  "schema": "dualis.simulation.task.v1",
  "plan_group": "identity|pipeline|builder|api|rte|kernel|connector|ops|publication",
  "task_id": "opaque-id",
  "claim": "what should be true",
  "fetch": ["independent evidence to collect"],
  "target": "verified-target-or-local-simulation",
  "base_revision": "git-sha-or-manifest-hash",
  "constraints": {
    "simulation": true,
    "external_writes": false,
    "non_destructive": true,
    "reversible": true
  },
  "stop_conditions": ["HOLE", "FAIL", "WAIT_GRANT", "VETO", "budget", "timeout"],
  "receipt_required": true
}
```

## What “all at once” means safely

All plans can be loaded into the **planning index** at once. They should not all execute at once. The simulation scheduler may fan out only bounded, independent, read-only or local-dry-run tasks. Dependent tasks wait for their predecessor’s receipt. Privileged tasks remain queued behind Father/kernel quorum.

## Final simulation result

The simulation produces:

- plan coverage;
- PASS / FAIL / HOLE / WAIT_GRANT counts;
- dependency blockers;
- connector readiness matrix;
- changed files and hashes;
- test output;
- rollback references;
- next recommended bounded wave.

A green simulation is not a production deployment, identity issuance, legal conclusion, medical conclusion, financial action, or universal-machine claim.
