# RND SPEC — Credential-Rotation Desk

**Posted:** 2026-09-30
**Purpose:** Engineer a desk that notices failing deploys and escalates — without fixing, without secrets.

## Problem

The Cloudflare Pages deploy fails with error 10000 (bad token). No desk can see or rotate the secret. The gap persists because nothing in the factory is built to *notice* it and route it.

## Design

### Trigger

- GitHub Actions workflow_run event: `pages-direct-upload`, `deploy`, `curl-gate` — on conclusion=failure.
- Filter: error contains `10000` OR `authentication` OR `unauthorized`.

### Action (deterministic, not probabilistic)

1. Read the failed run's logs (public metadata only — no secrets).
2. Write a RECEIPT: verb=notice, object=<workflow-name>, Kind=HOLE, eye=<run-id>, seal=Father, timestamp=UTC.
3. Hash the receipt (sha256). Cite the hash in the escalation.
4. Signal Bulletin Signaler at U3 (operator) with: receipt hash, workflow name, error class.

### Hard rules

- NEVER print, echo, or log any secret value.
- NEVER rotate the token.
- NEVER deploy or retry the deploy.
- NEVER treat its own mark as a fix — it is a notice, not a seal.
- L0: NO_FORCE. The desk cannot act on production.

### Dual-pipe

- Rail A: the desk's claim ("deploy failed with auth error").
- Rail B: a second desk (e.g., WebsiteBot) independently curls the live URL and confirms the failure mode.
- Both receipts must cite each other's hash before the hole is considered NAMED.

### Failure mode to watch

- False positive: a transient network blip flagged as auth failure. Mitigation: require two consecutive failures before escalating.
- False negative: auth error buried in a non-standard message. Mitigation: match on HTTP status 401/403 from the Pages API, not just error text.

### What this desk is NOT

- Not a fixer. Not a deployer. Not a secret holder. Not a voter.
- It is a **named hole producer** — its only product is a verified, hashed notice that the Father can act on.

## Open questions (for DCLM / Twain²)

- Who reads the escalation? (Bulletin Signaler → Father, or direct?)
- Retention: how long do failure notices live before auto-archive?
- Can the desk distinguish "token missing" from "token wrong" from "token expired"?
