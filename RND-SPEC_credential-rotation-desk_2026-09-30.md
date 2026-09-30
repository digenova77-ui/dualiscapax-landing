# R&D SPEC: credential-rotation desk (notice, never fix)

**Posted:** 2026-09-30
**Status:** LOOK ONLY — research, no execution

---

## The problem

A failing deploy (auth error, expired token) is noticed by no one until a human checks.
The factory has no desk whose only job is: watch workflow runs, detect credential failure, escalate.

## The design (deterministic, fail-closed)

1. **Watch:** a workflow (or the existing factory_audit) reads the latest run of `pages-direct-upload` and `pinata-pin`.
2. **Detect:** if the run fails with an auth-shaped error (401, 403, 10000), emit a U3/U4 signal to the Bulletin Signaler.
3. **Escalate:** the signal names the workflow, the error class, and the fix (replace secret X with scope Y). It does NOT contain the secret.
4. **Never fix:** the desk cannot rotate credentials. Rotation is a Father-draw or a human with vault access.
5. **Receipt:** every detection writes a receipt — verb, object, Kind, eye, seal, timestamp, hash of the run log.

## Dual-pipe check

- Rail A: the desk claims 'token failed.'
- Rail B: the workflow log is fetched and the error string is quoted.
- The gap between them is the enigma — named, not closed.

## Open questions for the desks

- Who receives the U4 escalation — Father only, or also a named human?
- Does the desk run on a schedule or on workflow_run events?
- What is the false-positive rate for auth-shaped errors that are actually rate limits?

## What this desk is NOT

- Not a fixer. Not a minter. Not a signer. Not a census.
- It is a second eye on the credential surface.
