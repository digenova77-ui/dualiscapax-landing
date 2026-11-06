# DualisCapax Protocol Discovery

**Status:** exploratory design note  
**Purpose:** discover the correct architecture from invariants and tested behavior, rather than forcing the project into a preselected technology category.

## Working hypothesis

DualisCapax may be best understood as a **law-governed decentralized execution protocol**: a system in which authorization, job state, execution, evidence, and economic settlement are distinct but coordinated by explicit rules.

This is a hypothesis, not a claim of novelty or an assertion that no comparable system exists. The design should be compared with distributed operating systems, blockchain protocols, decentralized compute markets, capability-based security, proof-carrying code, and autonomous-agent systems.

## Architecture should emerge from properties

The system is defined by properties that must hold regardless of the chosen implementation:

- **Authorization integrity:** each protected action is bound to a valid Trinity decision over the exact request.
- **State integrity:** state transitions are deterministic and independently checkable.
- **Execution neutrality:** no single provider is indispensable to routine job execution.
- **Verifiable completion:** result acceptance follows a task-specific verification policy.
- **Settlement integrity:** no job can cause duplicate payment or exceed its authorized budget.
- **Recoverability:** node, provider, website, or RPC failures do not corrupt the protocol's state; recovery follows explicit rules.
- **Portability:** a compatible implementation can join without requiring a proprietary central control plane.
- **Observability:** an independent auditor can reconstruct the lifecycle from signed evidence and public receipts, subject to privacy constraints.
- **Bounded autonomy:** agents may act only within explicit capability, budget, time, and risk limits.

## Five questions to resolve experimentally

1. What is the smallest unit of work the protocol recognizes?
2. What evidence is sufficient to prove that a job was authorized and completed correctly?
3. Which state must be globally agreed, and which computation can remain off-chain?
4. What incentives keep independent schedulers, compute providers, verifiers, and storage providers participating?
5. Which failures can be recovered from automatically, and which must stop safely for human or governance intervention?

## Discovery method

For every proposed rule:
1. State it as a testable invariant.
2. Identify the actors and trust assumptions.
3. Build a small reference model.
4. Test normal cases, malformed inputs, duplication, reordering, timeouts, collusion, and participant loss.
5. Compare the simplest implementations that satisfy the invariant.
6. Record evidence, limitations, and unresolved assumptions.
7. Only then select a chain, runtime, token model, or deployment mechanism.

## Do not assume

- A blockchain is required for every state transition.
- A token is required to create useful incentives.
- A hash proves that a computation is correct.
- Decentralization automatically provides privacy, availability, fairness, or security.
- A protocol is novel merely because it combines familiar components.
- A successful local simulation proves production safety.
- “Autonomous” means unbounded authority or the absence of governance.

## First experiment

Model one job from request to settlement. Use a deterministic job identifier, principal, action, input digest, budget, expiry, policy version, Trinity authorization reference, claim lease, result digest, verification receipt, and settlement state.

The reference model must prove:
- unauthorized jobs never reach the executable state;
- mismatched authorization fields are denied;
- duplicate requests and duplicate result submissions cannot settle twice;
- timeout is never interpreted as success;
- an invalid result cannot trigger payment;
- provider loss allows safe reassignment;
- all terminal outcomes are reproducible from the recorded inputs and policy version.

Use mock funds first. No token issuance, production deployment, or migration is implied by this specification.
