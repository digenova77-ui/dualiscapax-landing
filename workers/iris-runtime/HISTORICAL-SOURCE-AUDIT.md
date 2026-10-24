# Historical DCLM / x402 source audit

## Provenance

The source excerpts summarized here were supplied in the engineering conversation as "exact recovered source." They have not been independently checked against the historical Vultr filesystem, Git objects, or build artifacts. Treat them as recovered records pending host-side hash or repository verification; do not silently promote them to verified live source.

## Confirmed from the supplied excerpts

- `main.py` exposes a static JSON object at `GET /` and `{"status":"ok"}` at `GET /health`. The displayed telemetry, counters, grade, and signature are hardcoded. The code does not verify payments or compute a signature at request time.
- `x402-gateway.service` launches Uvicorn on `0.0.0.0:8080`, making the application listen on all interfaces unless host/network controls restrict access.
- The supplied Nginx snippet proxies `/live/api/` to `127.0.0.1:8080/live/api/`; the supplied `main.py` defines no such route. In that pairing, the proxy target would return 404. The separate Python HTTP server in `dclm_core_node.py` defines `/live/api/ledger` and `/telemetry`.
- `dclm_core_node.py` chooses proposals and telemetry latency with Python's `random`, uses ordinary conditional expressions rather than a Z3 solver, and appends JSON lines to a local file. Its HMAC route is not a payment verifier. The shown `STATE` and ledger writes are not a transactional database or distributed consensus.
- The displayed `Z3_INVARIANTS` name is a label, not evidence that the Z3 solver is invoked. The code's proof wording and `PROVEN-UPSTREAM` grade are not cryptographic or independent validation.
- The TypeScript `dclm_engine.ts` hashes proposal fields with SHA-256 and enforces numeric conditions with ordinary `if` statements. A SHA-256 digest of proposal fields is not a Z3 proof, a signature, or evidence that energy was metered. Its Merit arithmetic is a local counter update, not evidence of a deployed issuance or settlement mechanism.
- The deployment script's final `curl` requests `/live/api/ledger`, but the script starts `uvicorn x402_server:app` while the service excerpt starts `uvicorn main:app`. The supplied snippets therefore describe different launch targets and should not be assumed to work together without reconciliation.
- The Rust jacket source is not present in the supplied excerpts. Its implementation cannot be reconstructed from the systemd service name alone.

## Required before any reuse or deployment

1. Recover and hash the actual files from the host or a trustworthy backup, if available. Record path, SHA-256, retrieval time, and whether each artifact is source, binary, or log.
2. Reconcile the actual active systemd unit, process command line, listening sockets, Nginx enabled-site symlinks, and route behavior. Do not infer the current state from historical snippets.
3. Keep the historical gateway isolated. Do not expose a static telemetry endpoint as payment verification, identity verification, authorization, metering, or proof.
4. Port only useful deterministic logic into version-controlled modules with explicit contracts and tests. Use a real SMT solver if solver-backed proofs are claimed; use calibrated metering evidence if measured energy is claimed; use a payment processor's verified server-side contract if payment validation is claimed.
5. Never copy the redacted shared secret or introduce a replacement secret into source control. Rotate any historical secret if it may have been exposed.

## Current integration boundary

The governed Iris runtime on the integration branch is a separate, not-yet-deployed Worker. Its fake-adapter tests validate runtime behavior only; they do not prove the historical services satisfy the adapter contracts. No production change is authorized by this audit.
