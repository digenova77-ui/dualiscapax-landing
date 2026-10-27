# DualisCapax Decentralized Playground — Architecture Laws v0.1

**Status:** design proposal; not deployed, not a claim of current capability  
**Scope:** protocol architecture for autonomous, decentralized execution and settlement  
**Boundary:** Cloudflare may serve the public website only. GitHub may hold source and review history only. Neither is a runtime authority or required job executor.

## 1. Design objective

Build a protocol in which a user can submit an authorized job, independent network participants can execute it, verifiers can assess its result, and settlement can occur according to deterministic rules—without requiring a DualisCapax-owned server, Cloudflare Worker, or GitHub workflow to keep the job system running.

“Decentralized” is a testable property, not a label. Each critical role must have independent participants, replaceable implementations, and a documented failure mode.

## 2. Foundational laws

1. **Truth-or-deny:** missing, invalid, stale, contradictory, or unverifiable evidence cannot authorize a state transition.
2. **Trinity is the authorization gate:** no scheduler, token, provider, agent, UI, or governance participant can create an alternate authorization path.
3. **No-force:** a job cannot exceed the permissions, budget, scope, or expiry explicitly granted by its authorization.
4. **Replay resistance:** each job has a unique request ID, principal, action, input digest, expiry, and authorization reference. Duplicate delivery cannot cause duplicate settlement.
5. **Deterministic state transitions:** the same valid prior state and inputs produce the same protocol decision.
6. **Evidence before settlement:** payment is released only when the configured verification policy is satisfied; exceptions are explicit and governed by the job policy.
7. **Least authority:** execution providers receive only the data and capabilities required for a job, not general authority over the protocol or treasury.
8. **Provider neutrality:** no one cloud, repository, RPC endpoint, storage gateway, or compute vendor is the only way to operate the protocol.
9. **Fail closed, recover openly:** uncertain authorization or verification stops the affected job; recovery is explicit, auditable, and cannot silently bypass Trinity.
10. **Secrets stay secret:** private keys and credentials are never committed to source, public logs, or on-chain plaintext.
11. **Upgrade transparency:** protocol changes are versioned, reviewed, authorized under explicit rules, and accompanied by migration and rollback plans where possible.
12. **No fictitious autonomy:** automation is considered operational only when independent triggers, execution, verification, and settlement have passed adversarial tests without a central operator.

## 3. Separate the five planes

### A. Presentation plane
A static website on Cloudflare (or any replaceable host) lets users inspect the protocol, connect a wallet, sign requests, view receipts, and monitor status. It is not authoritative. Users must be able to submit via a compatible client or direct protocol interface if the website is unavailable.

### B. Authorization and policy plane
Trinity evaluates the principal, action, request ID, input digest, scope, budget, expiry, and policy version. Its decision is signed or otherwise verifiably bound to the exact job. On-chain contracts must enforce the authorization reference for all protected state changes and payments. If the current Trinity implementation cannot be verified on-chain, do not claim the protocol is fully trustless; document the trusted component and migrate carefully.

### C. Coordination plane
A decentralized trigger/scheduler mechanism discovers eligible jobs and incentivizes participants to claim them. It must not be a single always-on DualisCapax service. Claims are atomic and idempotent. Expired claims can be reclaimed under deterministic timeout rules. Multiple independent keepers/indexers should be able to observe the same public job state.

### D. Execution plane
Independent providers execute jobs in isolated environments. Providers submit outputs plus evidence. The protocol defines job types and deterministic resource limits. Arbitrary AI output cannot generally be proven correct merely by storing its hash; use task-specific checks, redundant execution, challenge/dispute mechanisms, trusted hardware only where explicitly accepted, or human review for tasks that cannot be objectively verified.

### E. Evidence and settlement plane
The ledger stores compact commitments, state transitions, policy versions, and settlement records. Large artifacts live in content-addressed storage with replication/pinning across independent operators. Payment contracts enforce escrow, caps, fee rules, deadlines, dispute paths, and idempotent release/refund. Public chain data is public: sensitive payloads must remain off-chain and encrypted, with access controlled separately.

## 4. Canonical job lifecycle

DRAFT -> SIGNED -> AUTHORIZED -> QUEUED -> CLAIMED -> EXECUTING -> RESULT_SUBMITTED -> VERIFIED -> SETTLED

Alternative terminal states: DENIED, EXPIRED, FAILED, DISPUTED, CANCELLED, REFUNDED.

Rules:
- Every transition has a named actor, preconditions, emitted evidence, and a deterministic failure result.
- AUTHORIZED must reference a Trinity decision bound to the exact principal/action/request ID/input digest and policy version.
- CLAIMED is an atomic lease with an expiry and unique claim ID.
- RESULT_SUBMITTED binds output digest, provider identity, execution metadata, and artifact references.
- VERIFIED records which verification policy passed and by what evidence.
- SETTLED can occur once only; the contract rejects duplicate release.
- Timeouts do not imply success. They lead to retry, reassignment, dispute, or refund according to the job policy.
- Cancellation cannot reverse already-finalized external effects; irreversible actions require stronger preauthorization and explicit limits.

## 5. Tokens are not the architecture

Do not launch a new coin merely to make the system “decentralized.” First specify the job protocol and test with valueless test assets on a test network. Then compare:
- existing network token for transaction fees;
- stable-denominated accounting for predictable job budgets;
- a protocol utility token only if it provides a necessary, defensible function;
- non-transferable reputation/credentials where transferable tokens would create perverse incentives.

A token balance is not proof of useful work. Reward distribution must depend on verified service, and token governance must not silently override Trinity authorization. No token issuance, market value, or revenue claim is implied by this design.

## 6. Network-selection criteria

Select a base chain and execution network only after a measured comparison of:
- permissionless participation and credible decentralization;
- finality, reorg behavior, fees, throughput, and outage history;
- contract/runtime security and upgrade model;
- job triggering/keeper economics;
- compute capacity, isolation, reproducibility, verification, and dispute support;
- content-addressed storage durability and independent replication;
- wallet accessibility and key recovery;
- jurisdictional and privacy requirements;
- provider exit/migration and protocol portability.

Do not choose by token price, marketing, or one vendor's SDK convenience alone. A multi-chain design is not automatically better; bridge risk can outweigh portability benefits.

## 7. Threat model and limits

- Consensus failure, chain reorganization, censorship, fee spikes, and network partitions remain possible.
- Public contracts cannot natively prove arbitrary off-chain computation correct.
- Decentralized compute providers may collude, disappear, lie, or return nondeterministic results.
- Oracle inputs can be false or unavailable; external facts need explicit source and dispute rules.
- Smart-contract bugs and governance capture can cause irreversible losses.
- User keys can be lost or stolen; signing must be explicit and transaction previews understandable.
- Decentralized storage can lose availability if nobody pins or pays to retain artifacts.
- “Autonomous” jobs need a trigger mechanism and an incentive budget; blockchains do not spontaneously wake up.
- No system can guarantee both immediate finality and uninterrupted operation under every network failure.
- Privacy on a public ledger is limited; do not put personal, confidential, or regulated payloads on-chain.

## 8. Minimum viable proof

Before any real-value token or production migration, demonstrate on a public test network or local multi-node test environment:

1. Submit and sign a job from a wallet.
2. Trinity authorizes the exact job; mismatched digest, principal, action, or request ID is denied.
3. Independent schedulers discover the job without a central DualisCapax server.
4. Two independent execution providers can claim/execute or one can fail and another can take over.
5. Duplicate claims and duplicate result submissions do not double-run settlement.
6. A verifier rejects a fabricated or mismatched output.
7. A valid result causes exactly one test-token settlement; invalid/expired work follows refund/dispute policy.
8. The website, one RPC endpoint, one scheduler, and one provider can each be taken offline without corrupting protocol state or permanently blocking recovery.
9. Artifacts can be fetched from independent storage providers using content hashes.
10. Every lifecycle transition has an inspectable receipt and reproducible test.
11. No privileged server key is needed for routine job execution.
12. No production funds, DNS changes, or existing server deletion are involved in the proof.

## 9. Implementation sequence

**Phase 0 — Specify:** freeze the canonical job schema, threat model, state machine, authorization binding, and acceptance tests.

**Phase 1 — Simulate:** implement a deterministic local reference model and adversarial tests. Use mock assets only.

**Phase 2 — Test network:** deploy a minimal escrow/job-registry contract to a test network, connect a wallet UI, and run independent scheduler/executor/verifier participants.

**Phase 3 — Decentralize operations:** test multiple RPCs, schedulers, compute providers, storage replicas, monitoring, and recovery with the website offline.

**Phase 4 — Security review:** independent contract review, property/invariant tests, fuzzing, economic attack review, and a limited testnet/beta.

**Phase 5 — Controlled value:** only after passing gates, consider capped real-value settlement and a separately reviewed token decision.

Existing Cloudflare routes, servers, repositories, and services remain unchanged until the replacement is proven and an explicit migration plan is approved.

## 10. Acceptance definition

The playground is not “decentralized and autonomous” because it uses a blockchain. It earns that description only when the minimum viable proof demonstrates that independent participants can trigger, execute, verify, and settle authorized work while central web hosting and any single operator are unavailable—and that unauthorized or unverifiable work cannot settle.
