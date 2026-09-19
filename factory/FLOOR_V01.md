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

## Provenance egg (2026-09-19)

Core question: can the system distinguish a valid-looking provenance *story*
(tip string + matching receipt hashes) from *demonstrable derivation* from tip sources?

Answer before repair: **NO** (orphan UNSTAMPED body stamped with tip + matching receipt).

Minimal repair:
- `stamp_artifact_tip.mjs` sets `derivation_state` = `UNVERIFIED` | `VERIFIED_DERIVATION`.
- `--expected-pre-stamp` binds UNSTAMPED package body hashes; `--source-inputs` binds source fingerprint.
- `--require-derivation` FAIL CLOSED on story-without-derivation.
- `verify_artifact_receipt.mjs`: exit 0 only when `--expected-pre-stamp` revalidates;
  tip+receipt alone → exit 3 `INTEGRITY_OK_DERIVATION_UNVERIFIED`; forged VERIFIED claim ≠ proof.

Still NOT deploy-ready: live bindings/secrets NOT_VERIFIED, Stripe PARKED, Twain UNKNOWN,
marker tests ≠ semantic proof, origin-join still proxies GitHub `main`.

## Authority admit + semantic gut egg (2026-09-19)

Core Q1: can an **UNVERIFIED** provenance story (tip + matching receipt, no
`--require-derivation`) still reach an **authority-bearing** operation?

Inventory of tip/receipt/stamp consumers:
- `stamp_artifact_tip.mjs` — producer; default stamp → `UNVERIFIED` (integrity story only)
- `verify_artifact_receipt.mjs` — integrity; exit 3 = story without re-proven derivation
- Worker `DC_ARTIFACT_TIP` embeds — marker only, not a gate
- Tests / docs — non-authority
- **Before this round: no admit gate.** Omitted flag / default stamp / direct call /
  CI absence / stale receipts could be *believed* as deploy-admissible.

Answer before repair: **YES** (belief/operator path; no code gate blocked UNVERIFIED).

Minimal repair:
- `admit_artifact_authority.mjs` is the **SOLE** authority-bearing consumer of tip/receipt.
- Mandates `--expected-pre-stamp` + verify `--require-derivation` exit 0.
- UNVERIFIED / verify exit 3 / omitted expected → **AUTHORITY_REFUSED** (FAIL CLOSED).
- Default stamp remains allowed for integrity-only use (not globally forced).

### Semantic gut (P3) — byte provenance ≠ semantic integrity

Mutations that preserve tip+receipt+marker *names* but gut authority semantics:
| Mutation | Tip/receipt layer | Trusted expected+require-derivation | Admit semantic fingerprint | Runtime demote (if not gutted) |
|---|---|---|---|---|
| DEMOTE→identity / PROMOTE gut | tip+receipt still stamp | fails vs *clean* expected; passes vs *evil* self-expected | **FAIL CLOSED** (`identity_demoteForbiddenLabels` / `demote_ban_list_missing`) | fails open if identity |
| NONE→AUTHORIZED | stamp ok | same as above | **FAIL CLOSED** (`elevating_authority_effect`) | demoteForbiddenLabels would strip if intact |
| UNKNOWN→AGREE hardcode | stamp ok | same | **FAIL CLOSED** (`unknown_to_agree_hardcode`) | Twain stub still UNKNOWN at kernel |
| CLAIM_ONLY→VALIDATED | stamp ok | same | **FAIL CLOSED** (`claim_only_to_validated`) | demote would reclaim if intact |

Evil twin that keeps tip+receipt+markers but breaks authority semantics must
**FAIL CLOSED** at `admit_artifact_authority` semantic boundary (permanent tests
in `TestSemanticGutEgg`). Byte provenance alone is not semantic proof.

Twain: still STUB → **UNKNOWN** (not AGREE).
DCLM: no fake **CONVERGED**.
Stripe webhook: still **PARKED** (do not bind `sk_` as `STRIPE_WEBHOOK_SECRET`).
origin-join: stays on `main`.
Deploy readiness: **NO** (live binds/secrets NOT_VERIFIED).

Still NOT deploy-ready: live bindings/secrets NOT_VERIFIED, Stripe PARKED, Twain UNKNOWN,
marker tests ≠ semantic proof, origin-join still proxies GitHub `main`.

## P0 fulfill CHECKOUT_OPEN gate (2026-09-19)

**FOUND:** Signed `checkout.session.completed` against live
`dualiscapax-stripe-fulfill-v2` (valid `STRIPE_WEBHOOK_SECRET` + D1 bound)
produced `fulfill.ok:true` and wrote `events`/`entitlements`/`fuel_credits`/`grants`
while dualis-gate `CHECKOUT_OPEN=false`. Health claimed `PARKED_UNTIL_BIND_CONTINUE`
but the grant path was not gated.

**REPAIR:** After signature verify and paid check, **before** merch refine /
`grantAccess` (park precedes merchandise jacket — not after merch):
if `String(env.CHECKOUT_OPEN||'') !== 'true'`, return
`{received:true, fulfill:{ok:false, reason:'closed', authority_effect:'NONE', ...}}`
and do **not** write D1 grants/fuel/entitlements/events via `claimGrantD1`.
Git `workers/stripe-fulfill/wrangler.toml` `[vars] CHECKOUT_OPEN = "false"`
(no D1 `database_id` committed).

**Also:** dualis-gate closed/identity HTTP now exposes `kyc_written` /
`duplicate` / `collision` / `authority_effect` / `status` without promoting authority.

Deploy readiness: **NO**. Do **not** set `CHECKOUT_OPEN=true`.

## Parked residuals hit (2026-09-19)

Campaign: `/workspace/PARKED_RESIDUALS_HIT_REPORT.md` (from
`PARKED_BOUNDARY_ATTACK_REPORT.md` R1–R9).

| ID | Disposition |
|----|-------------|
| R1 | Runbook `docs/ops/RESIDUAL_R1_TOKEN_SCOPE.md` + CI forbid `d1 execute`; user must rotate CF token (no D1 Edit) |
| R2 | Listed pre-park versions; API DELETE → 405 unavailable; serving `5599c24d…` kept |
| R3 | `.github/workflows/stripe-fulfill.yml` requires `admit_stripe_fulfill_deploy.sh` before deploy |
| R4 | Live `/hooks/stripe` observability VERIFIED by parent after gate secret re-put; identity live still needs `STRIPE_IDENTITY_SECRET` on card; source `kyc_written` always false |
| R5 | `docs/ops/FF3_FORENSIC_ROWS_QUARANTINE.md` — leave ff3 rows in place |
| R6 | `docs/ops/ARTIFACT_TIP_UNSTAMPED.md` — UNSTAMPED in git intentional; CI stamps outdir |
| R7 | `docs/ops/FULFILL_GATE_OPEN_COUPLING.md` — coupling absent; **no open** |
| R8 | `docs/ops/CF_SCRIPT_SETTINGS_VS_VERSION.md` + `scripts/cf_worker_bindings_observe.mjs`; bare gate deploy without local D1 strips DB |
| R9 | This section: park is **before** merch (code comment + gate order), not after |

Twain: still STUB → **UNKNOWN**. DCLM: no fake **CONVERGED**. Deploy readiness: **NO**.
Do **not** set `CHECKOUT_OPEN=true`. Do **not** Pages/apex deploy from this campaign.
