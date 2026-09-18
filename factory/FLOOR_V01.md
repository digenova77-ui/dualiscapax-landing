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
