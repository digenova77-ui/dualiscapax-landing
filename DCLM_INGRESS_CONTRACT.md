# DCLM Ingress Contract

**Status:** local, read-only, fail-closed boundary.

The whole Dualis playground feeds the DCLM machine through one ingress. The builder, Unity prototype, WebGL clients, and future local surfaces must not create parallel authority paths.

## Endpoint

```text
POST /v2/dclm/ingest
```

The current origin is loopback-only at `http://127.0.0.1:8080`.

## Envelope

```json
{
  "source": "builder | unity | webgl | origin",
  "payload": {
    "api_version": "2",
    "law": ["NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING"],
    "authority": "NONE",
    "pii_coefficient": 0
  }
}
```

## Guarantees

- only allowlisted sources are admitted;
- payloads must be JSON objects;
- nested sensitive keys are rejected before admission;
- payloads larger than 64 KiB become `HOLE`;
- the origin never grants authority or performs external writes;
- successful responses are observations (`SEE`) with a receipt, not execution approvals;
- missing origin, malformed JSON, law drift, PII, unknown source, or attempted authority escalation becomes `HOLE`;
- receipts retain only a hash and verdict in memory and can be purged.

## Client behavior

The public builder may prepare an envelope, but it can receive a real receipt only when served from the local origin. When hosted publicly without a protected origin, it must display `HOLE` rather than silently routing to an arbitrary machine.

Unity sends a startup scene-manifold observation only: six rings, DCLM/IRIS towers, zero PII, and `authority: NONE`. Its `HOLE` path is the default when the loopback origin is unavailable.

This boundary is not a Unity ID issuer, wallet, token contract, deployment authority, or privileged write gate.
