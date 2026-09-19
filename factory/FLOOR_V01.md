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

## Residual boundary attacks (2026-09-19)

Attack log: `/workspace/BOUNDARY_RESIDUAL_ATTACK_LOG.md` (written before repairs).

Repairs in this campaign:
- `DC_ARTIFACT_TIP = "UNSTAMPED"` in Worker entrypoints; `factory/tools/stamp_artifact_tip.mjs` stamps tip into dry-run outdir.
- Factory pins origin-join + fail-closed wrangler defaults (`CHECKOUT_OPEN`, `IRIS_ALLOW_HOUSE_KEY`).
- Dual-kernel cwd=`src/` hazard locked; `src/engine/__init__.py` must stay absent.
- medical-gate prompt() drift allowlisted as cf-pages suffix-only.

Still NOT deploy-ready: live bindings/secrets NOT_VERIFIED, Stripe PARKED, Twain UNKNOWN,
marker tests ≠ semantic proof, origin-join still proxies GitHub `main` (explicit).


## Rabbit-hole hunt (2026-09-19)

Attack log extension: `/workspace/BOUNDARY_RESIDUAL_ATTACK_LOG.md` + `/workspace/RABBIT_HOLE_REPORT.md`.

Repairs:
- Tip stamp writes `.dc_artifact_tip_receipt.json` (sha256 of stamped bytes); correspondence stays `UNVERIFIED_STRING_REWRITE_ONLY`.
- Adversarial tip-stamp tests: orphan stamp, post-stamp mutate, omit marker, foreign tip.
- Dual-kernel semantic API fence (measure `Record`/`grant` ≠ Authority `Decision`/`decide`); unification still speculative.
- Stripe fulfill health: `binding_presence_claim_only` + `operational_authority: NONE` + `PARKED_UNTIL_BIND_CONTINUE`.
- origin-join proof: RAW `/main` pin ≠ factory-floor-v01 verified artifact (left on main).
- Marker admissible-evidence table + recursive Factory belief fences.

Still NOT deploy-ready: live bindings/secrets NOT_VERIFIED, Stripe PARKED, Twain UNKNOWN,
marker tests ≠ semantic proof, tip correspondence unverified, origin-join still proxies GitHub `main`.
