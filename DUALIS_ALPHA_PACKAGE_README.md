# DualisCapax Read-Only Alpha Package

**Package class:** simulation / local bootstrap / read-only connector bridge  
**Status:** usable for inspection and dry-run preparation; not production identity or privileged execution.

## Included

- Installable Builder PWA shell and Dual Pipeline UI.
- Local API v2 bootstrap jacket.
- Read-only Google Drive bridge through the configured `gws` connector.
- Unity ID / RTE / API v2 secure-access blueprint.
- Ubuntu / Unix filesystem command Bible.
- All-plans simulation manifest with bounded “keep going” policy.
- Draft Father bulletin for the Google Drive bridge.

## Current guarantees

The package does not collect Google passwords, store passphrases, expose connector tokens, execute privileged writes, or silently install persistence. The Drive adapter is metadata-oriented and read-only. Missing evidence returns `HOLE`; unimplemented authentication returns `WAIT_GRANT` or `NOT_IMPLEMENTED`.

## Run locally

```bash
node dualis-api-v2-bootstrap.mjs
curl http://127.0.0.1:8787/api/v2/health
curl http://127.0.0.1:8787/api/v2/connectors/google-drive/status
curl 'http://127.0.0.1:8787/api/v2/connectors/google-drive/inventory?limit=10'
```

The process binds to `127.0.0.1` by default. Do not expose it publicly until authentication, authorization, rate limits, logging redaction, and deployment controls are implemented.

## Required before production

1. Real Unity ID issuer with WebAuthn/passkeys.
2. OAuth PKCE for Google, with encrypted server-side token storage.
3. Capability grants with scope, audience, expiry, nonce, and revocation.
4. Authenticated receipts and Father/kernel quorum.
5. Cloudflare Pages source synchronization for all Builder PWA assets.
6. API v2 deployment behind the real auth boundary.
7. Independent security review and recovery drill.

## Packaging rule

This package is a truthful alpha artifact. It is not a government instrument, sovereignty declaration, legal agreement, universal identity, or claim that a persistent online computer is attached.
