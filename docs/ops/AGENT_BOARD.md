# Agent Board (append-only, hash-chained)

Owner directive (David Di Genova, 2026-10-17): a running message board that **every agent must sign** when it interacts with the system.

## Rule
- Every agent appends **one entry per implementation** (PR, production change, declared action), referencing its PR and/or commit in `refs`.
- Append only. Never edit, reorder or delete a past line. CI (`agent-board-verify`) rejects any PR that does.
- Use the tool, never hand-edit: `python3 tools/board.py append --agent "<name>" --action "<what>" --ref PR#123 --ref <sha>`
- Verify anytime: `python3 tools/board.py verify` (rebuild-to-verify: recomputes every hash, reports the first break).

## Format (`docs/ops/AGENT_BOARD.jsonl`)
One canonical JSON object per line: `{seq, utc, agent, action, refs, prev_hash, hash}`.
- `hash = sha256(canonical JSON of the entry without "hash")`; canonical = sorted keys, `,`/`:` separators, UTF-8, no ASCII escaping.
- `prev_hash` = previous entry's `hash`; genesis uses 64 zeros.
- Genesis hash: `ae6c43fbe5b9b739c74076580878470c1f0fd279e0adc1d3494da21ca7da4261`.

## Relation to existing conventions
- The Drive `FACTORY_BULLETIN_BOARD` / `BULLETIN/README.SIGNING.md` (referenced by `bulletin-*.yml`) is paper and is not in this repo; this board does not replace or deploy anything. It is the in-repo, verifiable record.

## What the chain proves (and doesn't)
- Proves: history has not been altered since any copy you hold (tamper-evidence, ordering).
- Does not prove *who* wrote an entry: `agent` is self-declared. Merge conflicts on concurrent appends are resolved by rebasing and re-appending.

## Follow-up (PROPOSED, not implemented)
- Optional per-agent **ed25519** signatures: add `pubkey` + `sig` over the entry hash, with a pinned agent key registry. Requires a non-stdlib or vendored verifier; decide before adopting.
