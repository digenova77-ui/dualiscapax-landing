# Unity ID / Google Drive Bridge — Draft Factory Bulletin

**Status:** DRAFT / WAIT_GRANT  
**Purpose:** connect the current Google Drive connector to the local API v2 bootstrap through a read-only, redacted adapter.

## Agreement boundary

This is an implementation draft, not a legal agreement, government filing, sovereignty declaration, or human signature. No party has signed it. A future issuer, operator, or counsel must review any binding agreement.

## Current bridge

The bridge uses the configured `gws` CLI only from the local bootstrap host. It exposes:

- connector health;
- redacted account metadata;
- read-only Drive inventory;
- a connector receipt;
- no OAuth token, refresh token, password, or passphrase.

It does not expose raw credentials to the browser or public builder. It does not implement Drive move, archive, trash, deletion, or arbitrary writes.

## Dual Pipeline contract

**Claim:** Unity ID should be able to request bounded Google Drive measurement and inventory.  
**Fetch:** the local bridge invokes `gws drive about get` or a bounded `gws drive files list`, with metadata-only fields and a maximum page size.  
**Collapse:** return `PASS` only when the connector responds and the result is redacted; return `HOLE` when the connector is unavailable, unauthorized, or incomplete.  
**Write:** remain `WAIT_GRANT` until a real Unity ID capability, target, scope, expiry, and rollback path exist.

## Planned capability grant

```json
{
  "connector": "google-drive",
  "operation": "files.read.metadata",
  "resource_scope": "explicit-file-or-folder-scope",
  "actor": "unity:opaque-subject",
  "expires_at": "required",
  "revocable": true,
  "receipt_required": true
}
```

The Google password is not part of this record.

## Father/kernel decision

The Father/kernel layer may approve a future read-only capability only when:

1. Unity ID issuer identity is real and verified.
2. The connector scope is narrow and visible.
3. The target computer is verified.
4. The request has a stable hash.
5. The operation is read-only or reversible.
6. Credentials remain in the connector vault.
7. Receipt and rollback behavior are tested.
8. No sovereignty or government claim is implied.

Until then: **DRAFT / WAIT_GRANT**.
