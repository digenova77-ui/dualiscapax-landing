# Dark Ledger Wave 01 — Unity ID / DCLM Compute Backlog

## Dispatch contract

Target: designated online computer only. This is a prepared backlog, not an execution receipt. Process in bounded batches, not concurrently without limits. Every item must use Claim → Fetch → Collapse, produce a receipt, and stop on HOLE. No task may invent credentials, bypass Trinity, publish externally, or perform a privileged write without Father/kernel authorization after a valid 2-of-3 quorum.

## Wave controls

- Maximum active tasks: 4.
- Maximum retry count: 2.
- Every task has a request hash, base revision, owner, scope, timeout, and rollback note.
- Missing identity, connector, evidence, quorum, or receipt means HOLE.
- Destructive, financial, legal, medical, account-security, DNS, IPFS, GitHub-visibility, and secret operations are excluded from automatic execution.

## Identity and Unity ID

1. Define the Unity ID canonical schema and versioning rules.
2. Define issuer registration and adoption workflow.
3. Define subject, actor, bot, and service identity classes.
4. Define identity lifecycle: proposed, registered, active, suspended, revoked, expired, retired.
5. Define passkey/WebAuthn assertion verification contract.
6. Define capability-token fields and canonical serialization.
7. Bind capabilities to actor, workspace, operation, resource, connector, zone, audience, expiry, and nonce.
8. Define capability delegation and non-delegable capability rules.
9. Define revocation lists and revocation-check cache behavior.
10. Define recovery and break-glass procedures with mandatory audit events.
11. Create test vectors for valid, unknown, expired, revoked, replayed, and wrong-audience identities.
12. Prove that a passphrase cannot be accepted as a connector credential.

## Dual pipeline and truth gates

13. Define Pipeline A Claim object and canonical hash.
14. Define Pipeline B independent Fetch evidence object and source requirements.
15. Define Collapse verdict schema: PASS, FAIL, HOLE.
16. Define empty-seat and incomplete-fetch behavior.
17. Define evidence freshness and expiry rules.
18. Define conflict handling when two sources disagree.
19. Define source provenance and chain-of-custody metadata.
20. Define deterministic comparison of claimed versus fetched bytes.
21. Create negative tests for unfetchable claims.
22. Create a receipt schema covering verb, object, Kind, eye, seal, handle, session, and grant.

## Kernel and deterministic runtime

23. Pin kernel protocol version and ABI compatibility rules.
24. Validate DCLM magic, length prefixes, flags, and payload boundaries.
25. Enumerate Layer-0 fail-closed flags and expected receipts.
26. Verify SHA-256 input and state receipt behavior.
27. Test zeroization boundaries and failure paths.
28. Test native and WASM outputs against the same vectors.
29. Add property tests for fixed-size state transitions.
30. Add fuzz tests for malformed wire frames.
31. Add reproducibility checks for compiler, dependency, and runtime versions.
32. Define upgrade and rollback compatibility rules.

## Trinity and Father write gate

33. Define DCLM, Twain², and Iris voter registry requirements.
34. Bind all votes to one request hash, base revision, and expiry window.
35. Require two distinct authenticated approvals for quorum.
36. Reject duplicate sessions, replayed signatures, outside-origin votes, and symbolic-only votes.
37. Define abstain, reject, timeout, and re-vote semantics.
38. Define material-change invalidation of prior votes.
39. Define Father/kernel final-write receipt schema.
40. Prove that one approval cannot submit a privileged write.

## Connector and environment audit

41. Inventory configured connectors and their scopes without reading secrets.
42. Verify GitHub identity, repository, branch, and permitted operation.
43. Verify Google Drive identity, target folder, and reversible move capability.
44. Verify Cloudflare account, Pages project, zone, and Access scope.
45. Verify Pinata integration existence without exposing JWT values.
46. Verify browser route and distinguish public browsing from authenticated account access.
47. Verify target environment identity and reject local-session substitution.
48. Produce a connector matrix: configured, authenticated, target-bound, operation-allowed, evidence, rollback.

## Audit, observability, and recovery

49. Define append-only Dark Ledger event schema.
50. Hash-chain audit events and verify tamper detection.
51. Define correlation IDs across prompt, task, vote, execution, and receipt.
52. Define secret-redaction rules for logs and errors.
53. Define alert conditions for bypass attempts, replay, nondeterminism, and audit failure.
54. Define incident containment and bot/connector suspension.
55. Define known-good image and state restoration procedure.
56. Verify that restored logs remain integrity-verifiable.

## Website and builder

57. Validate that the builder is an untrusted client and holds no signing secret.
58. Add prompt export with request hash and policy version.
59. Add a read-only connector audit report view.
60. Add Claim → Fetch → Collapse receipt display.
61. Add Trinity docket display without fabricated votes.
62. Add explicit online-target versus local-session indicator.
63. Add safe dry-run mode for all connector actions.
64. Add an implementation diff and rollback summary view.

## Completion rule

Return one receipt per task and one wave summary. A wave is complete only when every item is PASS or explicitly recorded as FAIL/HOLE with evidence. “Fast” is not success; deterministic, attributable, reversible output is success.
