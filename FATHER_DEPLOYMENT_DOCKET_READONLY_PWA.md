# Father Deployment Docket — Read-Only Dual Pipeline PWA

**Status:** PENDING / WAIT_GRANT  
**Authority:** verified Father/kernel only  
**Requested operation:** publish the compiled static Builder PWA surface after canonical `cf-pages` synchronization.

## Proposed public payload

Publish only the static, non-secret front end:

- Builder PWA HTML and UI.
- PWA manifest and icon.
- Scoped service worker.
- Deterministic scene assets already approved for the builder.
- Dual Pipeline claim/fetch/collapse panel.
- Local simulation controls.
- Security text that explicitly forbids password collection.

## Explicitly excluded from static Pages

Do not execute or expose these as public static authority:

- `dualis-api-v2-bootstrap.mjs` as a backend.
- `dualis-google-drive-bridge.mjs` as a public endpoint.
- Google OAuth tokens, refresh tokens, passwords, or passphrases.
- Father/kernel signing material.
- Dark Ledger private records.
- Any write-capable connector.

Those components require a separate protected backend with authentication, authorization, scope, expiry, revocation, redaction, rate limits, and audit receipts.

## Architecture

```text
Cloudflare Pages
  └── static Builder PWA
        └── prepare / inspect / simulate / receipt display

Protected API service
  ├── API v2
  ├── Unity ID passkey/OAuth boundary
  ├── Google Drive read-only bridge
  ├── Dark Ledger
  └── Father/kernel write gate
```

## Current evidence

- Local PWA shell exists and passes HTML validation.
- Local API v2 bootstrap passes health and task preparation tests.
- Google Drive bridge passes read-only status and bounded inventory tests.
- Father-only write endpoint returns `403 FATHER_KERNEL_REQUIRED` and `WAIT_GRANT`.
- Real-time audit status is `HOLE` because public API v2 health/chat routes are not deployed.
- Canonical deployment workflow is dispatch-only and requires an explicit `DEPLOY` input.
- Repository notes a standing Cloudflare token authorization hole; this must be resolved by the account owner without pasting tokens into chat.

## Father decision

Approve only the static PWA payload after:

1. syncing the Builder files into canonical `cf-pages`;
2. adding an explicit `/builder` redirect or route;
3. verifying the PWA manifest and service worker from the deployment artifact;
4. running the Pages leak scan;
5. compiling a zero-nest checksum package;
6. receiving a valid Cloudflare Pages deployment receipt;
7. re-running the real-time audit.

Decision field: `WAIT_GRANT` until those conditions are met.

## Peace and legal boundary

This is a technical deployment docket only. It is not a Canadian sovereignty declaration, government communication, legal agreement, or authorization to infiltrate or interfere with any institution. Ontario and Canadian law remain controlling.
