# DualisCapax Swarm Protocol v1

Status: **candidate implementation on an isolated branch**. This is not a claim that live swarms are connected or that a distributed ledger exists.

## Purpose

Give every specialist a shared, inspectable event envelope so Iris can coordinate discovery and review without letting a worker authorize itself. The protocol primitive is local Python and standard-library only; it does not call models, the network, host commands, Cloudflare, or production services.

## Roles and separation

- **Iris** — coordinates task assignment and consolidates reports; cannot self-authorize.
- **Scout** — read-only discovery; emits observations with evidence references.
- **Builder** — proposes a patch or plan; no direct merge/deploy permission.
- **Sentinel** — adversarial challenge and failure-path exploration.
- **Verifier** — independently checks the claimed result and attached evidence.
- **Infrastructure** — reports host/runtime readiness and constraints.
- **Economics & Ledger** — reports measured resource inputs and accounting consistency; never invents missing meter values.
- **Trinity/DCLM** — policy/gate layer, not a worker swarm. A gate event may record ACCEPT, DECLINE, or BLOCKED_WITH_EXACT_MISSING_PRIMITIVE; this local record is not by itself a cryptographic credential or production authorization.

## Required event fields

`dualis.swarm.event.v1` requires unique event ID, task ID, idempotency key, UTC `created_at` ending in `Z`, swarm, role, phase, status, issuer, all four laws, claims, and evidence references. Unknown roles, missing laws, malformed fields, unsupported phases/statuses, and unsafe actuator declarations fail closed.

Every event defaults to `authority: NONE` and `live_actuator: false`. A worker cannot set a gate decision. Only the `trinity_dclm` role can emit a gate-phase decision, and a blocked decision must name the exact missing primitive.

## Workflow

1. Iris issues a task envelope with a stable task ID and explicit scope.
2. Scout gathers read-only facts and source references.
3. Builder emits a proposal only; it does not land changes.
4. Sentinel challenges assumptions and tests failure cases.
5. Verifier checks the proposal independently against reproducible evidence.
6. Trinity/DCLM records ACCEPT, DECLINE, or BLOCKED with the missing primitive named.
7. An authorized external release process, if any, separately checks policy and requires explicit approval for production actions.

A missing worker, timeout, malformed event, absent evidence, disagreement, or unavailable authority means `BLOCKED`, never inferred success.

## Idempotency and ledger

`HashChainLedger` rejects duplicate idempotency keys and stores each event with sequence, previous hash, and event hash. Verification detects edits to prior rows. This is **tamper-evident, not tamper-proof**: a trusted head hash must be retained independently to detect full-file replacement. The implementation assumes a single writer. It does not claim cross-process atomicity; use a transactional datastore or external lock before concurrent production use.

## Explicit non-goals / limitations

- No live agent/model invocation.
- No authenticated issuer identity or signed messages.
- No distributed consensus or independent external anchor.
- No cross-process transaction guarantee.
- No server-side energy meter, joule accounting, eFuse settlement, or Merit calculation.
- No authority to execute shell commands, mutate production, publish Pages, change DNS, or touch databases.
- A passing unit test validates this local primitive only, not end-to-end swarm operation.

## Laws

- `TRUTH_OR_NOTHING`: claims require evidence; unknown stays unknown.
- `NO_FORCE`: proposals do not execute or override consent.
- `HOST_SAFE`: actuators remain false in this implementation.
- `CLEANUP_FIRST`: cleanup and rollback concerns are part of review, not deferred after execution.

## Test

Run:

```sh
PYTHONPATH=src/engine python3 -m unittest discover -s tests -p 'test_swarm_protocol.py' -v
```
