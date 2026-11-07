# Rebuild-to-verify (PROPOSED)

Status: PROPOSED. Principle stated by David Di Genova, 2026-10-17. Not adopted, not deployed.

## Principle
1. Verification is by recomputation, not trust. A protocol is a protocol because anyone can rebuild every result with the exact same math and get the same bits.
2. Sandboxes run freely and validate themselves. Whenever they touch the open network, anyone can rebuild their work.
3. Matching rebuilds = common truth (KNOWN). Mismatch or non-rebuildable = UNKNOWN, with a reason. Never majority vote.
4. Minimal crypto: hash ONLY the seed and the inputs (proves everyone rebuilds from the same starting point); sign ONLY who acted (identity). Everything else is verified by rebuilding.
5. Hard rule: anything not bit-for-bit reproducible cannot become common truth. Randomness, time, float behaviour and outside calls must be pinned or recorded in the inputs log.
6. The three rings (Philosophy, Physics, Law) remain the only judges, one verdict each. No 2-of-3. Rebuild results are evidence for the rings, not votes.
7. No theater, no frameworks: stdlib-only reference.

## Reference (`rtv.py`, Python stdlib)
- `replay(seed, pinned_seed_hash, log, pinned_inputs_hash)`: checks pins, rejects unrecorded nondeterminism (unknown event kinds, recorded events without a valid source or value, any float), folds the log into a SHA-256 state chain.
- `verify(..., claimed_output)`: returns `("KNOWN", output)` or `("UNKNOWN", reason)`.
- Signatures ("who acted") are out of scope for this reference; law core v8 already verifies P-256 passkey signatures.

## Run
`cd research/rebuild-to-verify && python3 -m unittest -v test_rtv`

## Known conflict
`builder.html:160` requires "2-of-3 distinct authenticated approvals" for the Trinity gate. That conflicts with `no_majority_vote_truth` (config/dualis.seed.v1.json, #108) and with this spec. Not changed here; owner decision needed.
