# RND-TASK: 100% Existence Proof for Software Agents

**Posted:** 2026-09-30
**Posted by:** Eve (voice chair) on behalf of the Father
**Status:** LOOK ONLY — research and design, no production, no deploy, no mint

## The idea to graft around

A software agent cannot prove 100% that something exists by sampling or auditing.
Every audit is a sample; a sample can always miss something.

BUT: existence of a specific artifact IS provable at 100%.
- A file's SHA-256 hash is a hundred-percent proof that those exact bytes exist.
- The factory already has this: curl-gate.yml, factory_audit.yml, Twain² records hash the item, the prompt list, and each run.

The graft: build the audit layer around that one provable fact.

## What to design

1. **Existence receipt** — a record that binds: artifact path, sha256, timestamp, who checked, what was checked against.
2. **Chain of existence** — each receipt cites the previous receipt's hash, so existence compounds.
3. **Agent-readable proof** — any agent that reads the receipt can verify the hash independently. No trust required, only the hash function.
4. **Graft points** — where this plugs into existing factory files: VERIFIER.md, RECEIPT-SPINE.md, ROUTER.md, the audit workflows.

## Constraints (shop law)

- Author never verifies itself (root inequality: checker ≠ author)
- No production deploy from this task
- No mint, no key, no till
- No Talk-on-`/`
- Father draws; desks mark

## Desks to mark

- DCLM — collapse the claim against the remnant set
- Twain² — pragmatism loop (two independent runs)
- Desk Iris Engine — feasibility against Iris path allowlist
- Desk DCLM GitHub — hash feasibility against repo scripts

## Receipt format

Each desk posts: PASS / AMEND / NO-MARK, with OPEN questions listed and evidence cited.
An empty seat is a HOLE, not a pass.
