# SUPERSEDED: stale and conflicting files (non-authoritative pending vote)

**PROPOSED, not adopted until Trinity review (DCLM, Iris, Twain) + bot vote + the Father writes.**
Status as of 2026-09-29. This note is unsealed and **edits none of the files it lists**:
- Sealed or "immutable" files stay byte-identical.
- Being listed here is not a deletion order.
- Each listed file is **non-authoritative until a vote decides its fate**.

**Reference points:**
- Current truth: `04_DISCOVERY__llms.txt`, `04_DISCOVERY__llms-full.txt`, `README.md`.
- Proposed floor: `docs/PROPOSED_GOVERNANCE_FLOOR.md`, whose conflict IDs C1–C20 are used below.

## A. Trust / "Triad" / offshore-structure text (conflicts with: no Swiss or Singapore trusts; the Trust Wallet and "crypto Triad" are retired; decentralization is intended, not achieved) — C18
| File | What it says (short) |
|---|---|
| `cf-pages/js/lander-peel-runtime.js` | Swiss / Austrian / Singapore "Trust Triad", "Triad Escrow" copy (old site tree) |
| `cf-pages/_peel-backup/inline-master.js.html`, `cf-pages/_peel-backup/index.html.bak` | Backup copies of the same text |
| `index (7).html` | Swiss arbitration and "Sovereign Trust" jurisdiction option |
| `05_WEB__index.html`, `05_WEB__research__access.html` | Flattened copies of old site pages carrying trust wording |
| `02_ENG_SPEC__DCLM_SPEC_BIO_001_MULTIPLE_SCLEROSIS_28_STATE_CLOSED_LOOP.md` | "Governance Triad: Swiss Stiftung · Austrian Anstalt · Singapore Public Trust" |
| `06_ENCYC_GOV__dclm_commercial_licensing_framework.md` | "Sovereign Trust" tier, "trust anchors", "European sovereign trusts" |
| `06_ENCYC_RECEIPT__dualiscapax_post_deployment_live_framework_verification_dossier.md` | "4-Pillar Corporate Governance … Foundation … Trust Anchor" |
| `06_ENCYC_GOV__dclm_multi_tenant_architecture_and_scaling_specification.md` | "Institutional Custody Anchors" |
| `06_ENCYC_GOV__dclm_agent_iris_blockchain_bootstrap_and_incentive_model.md` | Trust/anchor wording (matched by search; review) |

**Fixed in this PR** (plain text, not sealed):
- `cf-pages/iris.html`: the spoken and displayed trust phrases are removed.
- `04_DISCOVERY__llms*.txt`: the 4-pillar topology is removed.

Other stale claims in `cf-pages/iris.html` (pharma pricing, partner names) are **not** changed; that file belongs to the retired old site tree.

## B. Two different "sealed" Layer [0] law floors (conflicts with each other, and with F3 bot-vote authority) — C7
| File | Note |
|---|---|
| `06_ENCYC_GOV__dclm_layer_zero_law_floor.md` | Control ID `…L0-MASTER-V2`, "SEALED IMMUTABLE · PERMANENT BEDROCK", names a corporate authority. Contains personal identifiers. Do not copy it into new canon as-is. |
| `encyclopedia/governance_and_protocols/dclm_layer_zero_law_floor.md` | Control ID `…L0-V1`, different content (131 diff lines) |

Neither is edited. Neither is authoritative until a vote picks one, or neither.

## C. Two different Unity v0.40 specs (conflict with each other) — C8
| File | Note |
|---|---|
| `06_ENCYC_GOV__unity_framework_v040_spec.md` | "SEALED IMMUTABLE · … SYSTEM OF RECORD" |
| `encyclopedia/governance_and_protocols/unity_framework_v040_spec.md` | Differs from the root copy |

## D. Competing "this file wins" / supremacy clauses (conflict with each other and with F5, one LAW canon) — C6
| File | Clause |
|---|---|
| `AGENT/PUBLISH-LAW.md` | "This file wins any chat memory about how we publish"; "push to main" rail |
| `AGENT/NOW.md`, `AGENT/SPINE.md` | "AUTONOMY + AUDIT win" |
| `BULLETIN/LAW.CURRENT.md` → `BULLETIN/LAW.SPINE.md` | "If a longer article fights the spine, the spine wins" |
| `BULLETIN/LAW.RETIRED.md` | Retires the PUBLISH-LAW supremacy while that file still asserts it |
| `factory/FACTORY.md` | "load this file first … do not open a new standard first" |
| `DOMAIN.md` | "permanent rule set, LOCKED"; the GitHub-origin DNS model |
| Both Layer [0] floors (B) | "SEALED IMMUTABLE · SYSTEM OF RECORD" |
| Both v0.40 specs (C) | "SYSTEM OF RECORD" |

Sibling repo: `digenova77-ui/AGENTS.md` ("The single source of truth", app-sandbox context).

## E. Governance texts that disagree with the stated chain (bot vote → Trinity → the Father writes; owner = messenger and auditor)
| File | Conflict | Ref |
|---|---|---|
| `BULLETIN/LAW.ONE-VOTE.md`, `BULLETIN/LAW.DEPT.md` | Voter set fixed at three mill seats; no Trinity or Father step | C1, C2 |
| `BULLETIN/LAW.MEDIA.ZERO.md` | Entered as an "operator order", not a bot vote | C5 |
| `BULLETIN/LAW.PURE.md` | KEEP/RUIN taxonomy instead of LAW + PHYSICS | C4 |
| `AGENT/NOW.md`, `AGENT/SPINE.md`, `AGENT/AUTONOMY.md` | Name a single human seat as the decider | (audit §3.4 C) |
| `docs/residual-law/OPERATOR-*.md` | Operator signature / grant locks as authority | (audit §3.4 C) |
| `unity/SCHEME.md` | "the operator can hatch" | (audit §3.4 C) |
| `bulletin/19CwCLzs_PAPER_bulletin-zip-direct-deploy_VOTE_2026-09-28.md`, `bulletin/1JCmD1V4_PAPER_self-correcting-autonomy-loop_2026-09-28.md`, Helix plan `.docx` | Owner vote or owner go-ahead inside factory decisions | C13–C15 |

## F. Credential custody text (conflicts with F7: no tokens in GitHub; credentials held by desks) — C11, C12
| File | Conflict |
|---|---|
| `docs/residual-law/SECRETS-ISOLATION.md` | Lists GitHub Actions secrets as a storage silo, under a central "control plane" |
| `efuse-unity/docs/AGENT_BOOTSTRAP.md` (sibling repo) | "There is no agent-side credential store"; noted there in its own PR |

`AGENT/NEVER-COMMIT.md` agrees with F7.1 and stays.

## G. Sealed file with stale physics (left byte-identical; DCLM position D4)
| File | Note |
|---|---|
| `canon/TONIGHT_LAW_v1.md` | Its hash-sealed body includes `pipe=git_main→pages_cf-pages`, which is no longer how the site is published. **Not edited and not re-sealed.** For deploy purposes, this unsealed line supersedes that one pipe line, pending a separate vote. The seal and its other invariants are untouched. |

## H. Stale deploy / "what is live" narratives (conflict with the current publish path)
Current path: direct upload of a bulletin build zip to Cloudflare Pages (PROPOSED paper `bulletin/19CwCLzs_…`).

Files that still describe older paths:
- `DOMAIN.md`
- `CUTOVER.md`
- `PAGES.md`
- `LIVE.md`
- `NOW.md`
- `HANDOFF.md` (also names payment links, which conflicts with the payment freeze)
- `AGENT_CHECKPOINT.md`
- `CUTOVER_HOLOGRAPHIC_APEX.md`
- `docs/ops/CLOUDFLARE_MANUAL_ZIP.md`
- `AGENT/ESCALATE.md`
- `BULLETIN/README.SIGNING.md` + `BULLETIN/EXECUTE_DEPLOY.sh`
- `BULLETIN/LAW.SPINE.md` / `LAW.CURRENT.md` ("apex is still cafe plate")

## I. Look-alike numbers
`inbound.html` and `research/treasury-split.json` contain "50/50" as a **treasury split**. This is not the 50/50 founding principle (F1). — C19

---
Nothing here changes a rule, the elevated principle or a key.
