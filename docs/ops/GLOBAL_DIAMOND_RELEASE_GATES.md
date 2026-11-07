# Global Diamond Release Gates

**Status:** release blocked; no production promotion authorized by this document.
**Last evidence review:** 2026-10-23.
**Rule:** Trinity is the authorization gate. Unknown authority fails closed.

This document records verifiable release gates so a green build, static status page, or successful source commit cannot be mistaken for a complete production release.

## Verified current state

- `main` source commit reviewed: `426e6964d1471432ed9191c826cc57ca6e326a61`.
- Cloudflare Pages reported a successful deployment for that commit, while the separate Cloudflare Workers Builds check failed. These are distinct delivery paths; neither status alone proves the canonical domains and API routes work end to end.
- The repository's `wrangler.toml` names `dualiscapax-web` and documents `dualiscapax.ai`; the deployment notes identify a conflicting direct-upload target. Confirm the live project's domain binding and configured Git integration before changing either target.
- `/iris/status` is an infrastructure/route-owner response. It is not proof that the identity verifier, Trinity law adapter, or model provider is available.
- PR #152 contains a server-side xAI provider connector and fail-closed tests, but explicitly leaves the connector unwired because the canonical session verifier and authoritative law adapter are not connected.
- PR #147 contains autonomy and workflow-risk work but is not mergeable as currently reported. Reconcile it against current `main`; do not merge it wholesale or assume tests from an older commit apply to its current head.
- The deployment repository records that the previous `deploy-worker` run failed during key-material selection before probe/bootstrap/deploy steps. That run did not deploy.

## Gate A — source and ownership

- [ ] Name the one canonical source commit for each public surface: `dualiscapax.com`, `dualiscapax.ai`, and the Iris API.
- [ ] Record the actual Cloudflare Pages project, Worker name, repository, production branch, build command, root/output directory, and domain binding from the dashboard.
- [ ] Reconcile the Pages and Workers Builds checks; obtain the failing Workers build's actual diagnostic from Cloudflare build history.
- [ ] Capture live route responses and response headers for the public roots, identity handoff, `/iris/status`, HUD assets, and API routes. Record status, timestamp, and source commit without logging cookies or personal data.
- [ ] Export and review the live server routing configuration before any server deployment.
- [ ] Keep a known-good rollback target and a tested rollback procedure.

## Gate B — identity and Trinity authorization

- [ ] Locate the authoritative identity/session issuer and verifier in the maintained source. Do not infer it from a route name or another application's similarly named endpoint.
- [ ] Specify issuer, audience, relying-party/origin binding, signature verification, expiry, revocation, actor ID, session ID, and replay protections.
- [ ] Verify the exact signed receipt using the canonical law adapter. Bind it to actor, action, target, mutation class, request ID, and expiry.
- [ ] Require Father authority for write actions. Client strings, cookies without server verification, model output, static status routes, and unverified JSON must never grant authority.
- [ ] Ensure missing, invalid, expired, mismatched, replayed, or unavailable authority denies before provider invocation or any side effect.
- [ ] Do not invent a new session endpoint or identity store to fill a missing implementation.

## Additional finding — world session-verification backend is not established

A focused source audit on 2026-10-23 found the following:

- `website-packages/unified-frontend/world.html` calls `POST /api/session/verify` with a `session_token` held in `sessionStorage`.
- The page sets `GATE_BASE = ""` for non-local hosts, so the request is sent to the same origin that serves the static page unless a separate routing layer intercepts it.
- The maintained repository's `_worker.js` does not implement or name `/api/session/verify`; its `wrangler.toml` names the Pages project `dualiscapax-web`, not a session service.
- The maintained source search located the endpoint in the client page and a binding plan, but did not locate a server-side handler or `createSessionVerifier` implementation in the accessible repositories.

**Interpretation:** the front-end contract exists; the authoritative server-side verifier is **NOT LOCATED / UNKNOWN**, not proven absent from every possible host or private workspace. Do not connect a model provider or mark the user as seated based on the current page code alone. The page's catch branch correctly labels an unreachable check UNKNOWN, but a reachable static host returning HTML/404 must also be tested explicitly.

Required closure:
1. Identify the real existing session issuer/verifier and its maintained source; do not invent a parallel identity system.
2. Prove the configured `GATE_BASE` and route owner from deployment configuration.
3. Test 404, 405, HTML instead of JSON, malformed JSON, timeout, expired/replayed token, wrong origin/audience, and unavailable law authority.
4. Verify server-side signature, expiry, revocation, issuer, audience, origin/RP binding, and single-use handoff before provider invocation.
5. Ensure the browser never treats a syntactically valid response as authority unless the server verifies the canonical signed assertion and law receipt.

## Additional finding — the currently documented API/provider rails are not live proof

A second cross-repository review found:

- The landing site's default chat origin is `https://dualiscapax-depth.digenova77.workers.dev`; the maintained environment document explicitly records that host returning **404** as of its last update (2026-10-17). Current reachability from this review environment could not be independently established because the external endpoint fetch was unavailable. Treat the API as **NOT VERIFIED / release-blocking**, not as connected.
- `iris-voice-standalone/iris-voice-server.mjs` currently treats a real cookie as `verifier-not-wired` outside local test mode. Its provider call is a local echo fixture when local verifier mode is enabled; it is not a production xAI conversation path. The provider adapter in PR #152 must not be wired until the canonical identity and Trinity/law gates are connected.
- `dualiscapax-hud/workers/iris-bridge.js` is a static HUD origin bridge. It explicitly does not overwrite the apex and does not implement chat/session verification. It is not the missing API worker.
- The published Replit app `dualiscapax` reports a successful last publish at `https://dualiscapax.replit.app`; that status alone does not establish its current backend routes or prove the GitHub source is synchronized with the Replit workspace. The read-only Replit audit request could not yet be submitted because the Replit agent was already busy.

## Additional finding — cross-domain WebAuthn design is invalid as written

The execution plan records a WebAuthn relying-party mismatch: an `.ai` page cannot use `dualiscapax.com` as its RP ID, because an RP ID must be the caller's host or a registrable-domain suffix of it. Do not implement or mark this handoff as passing. The safe direction is to verify the ceremony at a valid RP origin, then issue a short-lived, unpredictable, single-use, audience-bound handoff grant and atomically consume it at the trusted `.ai` backend. No credential or reusable token may be carried in a URL, browser storage, or logs. This remains blocked until the existing authoritative backend/session store is identified.

## Gate C — Iris provider path

- [ ] Keep provider credentials server-side and out of URLs, browser storage, logs, and error responses.
- [ ] Connect the existing provider adapter only after Gate B succeeds.
- [ ] Test invalid/missing/expired sessions, wrong actor, malformed receipt, provider timeout, rate limit, invalid provider response, oversized input, and provider credential failure.
- [ ] Prove by test instrumentation that denied requests make zero provider calls.
- [ ] Distinguish process health, verifier readiness, law readiness, provider readiness, and end-to-end conversation readiness in status responses.

## Gate D — autonomy and compute

- [ ] Rebase/reconcile existing autonomy work in small reviewed units; preserve work already present in open PRs.
- [ ] Resolve workflow-risk findings and run the full current-head test suite after reconciliation.
- [ ] Verify bounded queues, idempotency, cancellation, lease expiry, durable append-only audit evidence, and uncertain-side-effect reconciliation.
- [ ] Verify compute requests are bound to the authorized request and validated result digest. Missing kernel/provider/authority must never be reported as success.
- [ ] Keep untrusted research and generated code read-only until the same Trinity gate explicitly authorizes a scoped write.

## Gate E — staging and production release

- [ ] Run CI against the exact candidate SHA; preserve links to each required check.
- [ ] Deploy to an isolated preview/staging environment with production credentials and data excluded.
- [ ] Run identity, authorization, API-contract, browser/mobile, accessibility, error-path, security-header, and route smoke tests.
- [ ] Independently verify deployed bytes/runtime identity and public behavior, not only CI status.
- [ ] Obtain explicit approval for the exact candidate SHA, target project/domain, migration or mutation list, and rollback plan.
- [ ] Promote once, verify critical routes, monitor errors, and record the final release receipt.
- [ ] If verification fails, stop and roll back; do not auto-retry unknown external side effects.

## Release decision

**Current decision: BLOCKED.** At minimum, the authoritative session verifier/law adapter and actual Cloudflare delivery ownership remain unverified. The correct next action is to resolve those facts from the maintained source and provider dashboard, then integrate and test. This document does not authorize DNS, credential, database, server, or production deployment changes.
