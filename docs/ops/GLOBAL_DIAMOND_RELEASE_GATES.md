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
