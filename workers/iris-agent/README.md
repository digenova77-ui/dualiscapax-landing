# Iris Cloudflare Agent Bridge (staging only)

This is an isolated Cloudflare Agents SDK integration for Iris Studio. It is intentionally planning-only: it can ask Workers AI to draft a plan and persist the latest plan metadata in an Agent Durable Object. It cannot run shell commands, write repository files, call production services, authorize actions, or deploy.

## Security model

- GET /health is a minimal unauthenticated health endpoint.
- POST /v1/plan requires a dedicated IRIS_AGENT_GATE_TOKEN secret and validates bounded JSON input.
- The gate token is an Iris-to-bridge credential, not the user's Cloudflare API token.
- IRIS_AGENT_ALLOWED_ORIGIN is an origin check, not authentication; bearer authentication remains mandatory.
- No credential is stored in source control. Never place a Cloudflare API token in this directory, frontend code, logs, or chat.
- The Worker name is dualiscapax-iris-agent-staging. It does not reuse or replace production routes.
- Execution and deployment are disabled. A proposed plan is not authorization; Trinity remains the sole authorization authority.

## Configure and test locally

Requires Node.js and npm.

1. npm install
2. npm test
3. npm run check
4. npm run dev

Local model inference requires a working local Workers AI binding. Do not treat unit tests as proof of live Cloudflare connectivity.

## Staging deployment gate

Before deploying, an operator must verify the Cloudflare account, inspect the generated diff, and explicitly approve deployment of this isolated Worker. Configure IRIS_AGENT_GATE_TOKEN with Wrangler secret storage (never in vars or committed files), then deploy from this directory. Do not add production routes.

After deployment, verify /health, then issue an authenticated test plan with a harmless goal. Record the exact deployment revision and returned status: proposed. A 200 response alone does not prove Trinity authorization or production integration.

## Next integration stages

1. Connect repository read-only inspection via a dedicated tool interface.
2. Add a task/evidence ledger that records actual commands, outputs, hashes, and test outcomes.
3. Add Trinity authorization as a mandatory service-side gate before any side effect.
4. Add isolated branch execution and CI-backed verification.
5. Add a separate deployment gate that verifies the exact live revision.

Do not skip directly to unrestricted code execution. This bridge is the safe first vertical slice.

## Read-only repository inspection (implementation in review)

`POST /v1/repository/inspect` is a read-only file observation endpoint. It requires the same dedicated `IRIS_AGENT_GATE_TOKEN` and the separate `GITHUB_READ_TOKEN` Worker secret. The GitHub credential must be least-privilege and read-only; it is never returned in responses.

The first repository allowlist is compiled into `src/repository-inspector.ts`. The caller cannot provide arbitrary URLs. The handler resolves the requested ref to a commit SHA first, then reads the file at that immutable commit. It returns the resolved commit, blob SHA, SHA-256 of the exact bytes, size, source URL, observation timestamp, and explicit limitations.

Requests reject unknown repositories, traversal paths, sensitive-looking filenames, invalid refs, and oversized payloads. Responses are limited to small text files. This is not a general repository crawler and does not grant command execution, write access, authorization power, or deployment capability.

Before staging, configure both secrets through Wrangler secret storage. Do not put them in `vars`, source files, or logs. The implementation remains unverified until the CI workflow passes on the exact revision and the endpoint is separately tested in isolated staging.
