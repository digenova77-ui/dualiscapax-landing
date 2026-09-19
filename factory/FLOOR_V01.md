# Factory Floor v0.1 — elevation that is actually importable

This directory's Python modules under `src/engine/dclm/` are the executable
authority surface added in the factory-floor-v01 repair.

- `AuthorityKernel.decide` is the only typed decision point added.
- `ProofObject.proof_id` changes if material fields change.
- `EntitlementMediator` treats client fuel as a claim.
- `FenceStore` requires lease_id + generation + unexpired + worker_id.
- `SeatLaw` keeps history on player_id.

Twain evaluator object: still MISSING IMPLEMENTATION.
Independent replay against Twain is therefore UNKNOWN, not AGREEMENT.

Source patch of `server/worker.js` is not a Cloudflare deploy.
LIVE dualiscapax-depth remains the HEAD worker until wrangler deploy
is itself an authorized transition.

## Campaign 2026-09-19 (self-attack)

- AuthorityKernel refuses caller AGREE/PASS unless Twain live replay confirms (stub → UNKNOWN).
- EpistemicFirewall: operator_override is CLAIM; sovereign ticket presence ≠ Ed25519 verify.
- EffectBoundary: caller booleans never ADMITTED.
- demoteForbiddenLabels: recursive; VALIDATED/PROMOTABLE banned.
- SeatLaw: OBJECT/SEED/ALLOCATION_ID reserved — not seats.
- identity/__init__.py exports match seat_law (HistoryEvent, SeatLaw).

Twain: still STUB → independent replay UNKNOWN (not AGREE/CONVERGED).

## Source→artifact boundary (2026-09-19)

- Factory suite now dry-runs wrangler packages and asserts security markers
  (`TestSourceArtifactBoundary`).
- `engine/dclm/kernel.py` (measure `run`) and `src/engine/dclm/kernel.py`
  (AuthorityKernel) remain divergent by design; import `engine` ≠ src file load
  (`TestEngineImportSurfaceDivergence`).
- Twain still STUB → UNKNOWN. Env/bindings still NOT_VERIFIED. No deploy.
