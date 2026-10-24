# DualisCapax — Full Project Scope and Real-World Effects

**Status:** Scope charter and impact map; not a claim that every subsystem is implemented or deployed.  
**Applies to:** DualisCapax, DCLM / DC³, Iris, Trinity, Unity, Merit, eFuse / Fusion Meter, the Playground, and related research and infrastructure.  
**Principle:** Identity is one boundary of the system, not the system's purpose.

## 1. What DualisCapax is

DualisCapax is a governed, deterministic-first, decentralized/hybrid intelligence and compute architecture intended to connect reasoning, execution, resource accounting, durable evidence, and real-world outcomes under explicit law and authority.

It spans software, compute infrastructure, AI orchestration, identity and authorization, memory and records, energy/resource measurement, economic coordination, scientific inquiry, and real-world operational optimization. The system is not accurately described as merely a biometric, passphrase, passkey, identity, or authentication product. Those mechanisms can establish who is requesting an operation; they do not define what the system computes, decides, meters, records, or changes in the world.

Its central engineering question is: **How can intelligence and computation produce useful real-world outcomes while every consequential action remains authorized, bounded, measurable, auditable, and reversible where the world permits?**

## 2. System scope — connected layers

### A. Human interface and immersive environment
- `dualiscapax.com`: intended human-facing, two-dimensional entry and identity plane.
- `dualiscapax.ai`: intended immersive three-dimensional world, Iris experience, and governed runtime surface.
- The handoff should be secure and short-lived, with independent server-side validation, replay resistance, and no credentials or authorization secrets in URLs or browser storage.
- Public reading, research, and viewing should not be conflated with permission to perform privileged, metered, private, or consequential operations.

**Real-world effect:** reduces friction for people to inspect, understand, and interact with complex systems, while making the boundary between observation and action explicit.

### B. Identity, provenance, and authorization
- **Unity** represents identity/provenance and the binding of actors, agents, devices, resources, and records where the design requires it.
- Passkeys, biometrics, or passphrases are possible authentication mechanisms—not the project itself and not standalone authority.
- **Trinity** is the authorization gate for protected execution. Authorization must bind the verified principal, exact action, request, input, policy decision, and applicable resource limits.
- Identity proves neither truth nor permission by itself. A valid login must never imply blanket authority.

**Real-world effect:** supports accountable delegation, least privilege, traceable responsibility, and safer cooperation among people, AI agents, services, and physical or digital infrastructure.

### C. Deterministic compute and hybrid AI
- **DCLM / DC³** is the intended deterministic decision and compute discipline: explicit inputs, rules, invariants, bounded execution, reproducible outcomes where determinism is possible, and recorded evidence.
- **Iris** is the intelligence/orchestration interface: it may interpret requests, coordinate tools, and propose actions, but it does not grant itself authority.
- Deterministic computation and probabilistic inference are separate lanes. Use deterministic logic for tasks that can be solved exactly; use probabilistic models where interpretation or generation is needed, with uncertainty labeled.
- External solvers, hardware, model providers, and remote services must be identified honestly. A hash is not automatically a proof, a model response is not automatically a fact, and a simulation is not production evidence.

**Real-world effect:** can reduce repeated work, inconsistency, operational error, and inference cost; can make decisions easier to reproduce and challenge. These benefits must be measured per workload rather than presumed.

### D. Edge, cloud, and decentralized/hybrid infrastructure
- The intended architecture spans local/edge execution, remote services, and distributed content or record infrastructure where appropriate.
- Interfaces, gateways, APIs, service bindings, storage, queues, compute nodes, and content-addressed artifacts must have explicit trust boundaries.
- Decentralization is an architectural objective, not a label conferred by using IPFS, hashes, multiple servers, or a blockchain. Fault tolerance, independent control, data availability, consensus, and recovery need separate evidence.
- Local execution, remote execution, and hybrid fallback must state which party controls the action and where data travels.

**Real-world effect:** can improve locality, resilience, deployment flexibility, data control, and utilization; may also introduce synchronization, availability, governance, and security trade-offs that must be documented.

### E. Memory, evidence, and the ledger
- Memory/context is data, not authority. It must be scoped to the correct identity and purpose, with retention and privacy rules.
- Durable receipts should bind the principal, request ID, authorized action, input and result digests, and the storage contract. Replay, conflict, and uncertain outcomes must be distinguished.
- Append-only or content-addressed records can improve integrity and auditability, but do not alone prove that an observation was true, that a physical event occurred, or that a service was independent.
- Missing evidence must remain missing. Unknown, estimated, simulated, and verified states must not be silently merged.

**Real-world effect:** enables audit trails, reproducibility, dispute resolution, incident analysis, and accountability—subject to privacy, lawful retention, and the limits of what each record actually proves.

### F. Resource accounting and economic coordination
- **eFuse / Fusion Meter** concerns capacity, resource boundaries, or energy-linked accounting according to the applicable design version.
- **Merit** concerns access/permission or allocation under the governing tokenomics design; it must not be represented as a deployed, tradable, issued, or settled asset unless the relevant contract, controls, and records prove that state.
- External payments and settlement are separate from internal accounting. Meter readings, energy-price indices, provider costs, service costs, credits, and settlement must each have a source and evidence grade.
- A caller-supplied joule value or “measured” label is not calibrated metering. An estimated cost is not a charge; a quote is not settlement; a local counter is not token issuance.
- The repository contains terminology and design variants that need reconciliation before any public claim about Merit transferability, Fusion Meter semantics, issuance, or pricing is treated as canonical.

**Real-world effect:** can make compute/resource costs visible, support fair allocation, align incentives with useful work, reduce waste, and help distinguish free public access from cost-bearing adaptive or enterprise work. These outcomes require real metering, auditable accounting, lawful payment design, and measured results.

### G. Real-world applications and operational systems
The architecture may be applied to workflows where evidence-backed decisions and optimization matter, including:
- energy use, utility consumption, and resource efficiency;
- logistics, routing, fleet operations, and scheduling;
- industrial, municipal, and enterprise workflows;
- document/data analysis, reconciliation, anomaly detection, and administrative work;
- scientific research, simulation, model comparison, and reproducible analysis;
- coordination of digital agents and authorized tools.

These are application domains, not claims of existing customer deployments or achieved savings. Each use case requires a defined baseline, data rights, safety constraints, human escalation path, measurement method, and post-deployment review. Safety-critical or regulated actions require domain-specific validation and legally required oversight.

**Real-world effect:** the intended downstream impact is not merely successful authentication or a working website. It is demonstrable improvement in outcomes such as energy consumed per task, cost per completed operation, latency, availability, error rate, waste, service quality, accessibility, and human time recovered—measured against a credible baseline.

### H. Research, knowledge, and the Playground
- The Playground is an environment to inspect, explore, build, test, compare hypotheses, and learn from system behavior.
- The project’s philosophical and scientific work should connect abstract claims to declared assumptions, competing models, empirical evidence, and reproducible tests.
- Simulation, projection, prototype, pilot, and production must be labeled distinctly.
- Publicly disclosed methods should be reproducible where possible; protected information must not be falsely presented as independently verifiable.

**Real-world effect:** enables experimentation and shared learning without confusing a narrative, model, or demonstration with evidence of a real-world result.

### I. Governance, safety, privacy, and law
- Governing invariants include `TRUTH_OR_NOTHING`, `NO_FORCE`, `HOST_SAFE`, and `CLEANUP_FIRST`.
- Trinity is the authorization gate; the configured write authority must remain explicit and constrained. No agent may self-authorize a protected operation.
- Fail closed when required authority, identity, policy, persistence, or evidence is absent or contradictory.
- Protect personal information, credentials, keys, and private context. Apply minimization, access controls, retention limits, and incident response.
- Follow applicable Ontario, Canadian, and other relevant law, including privacy, consumer protection, payments, financial/AML, accessibility, and sector-specific obligations as applicable.

**Real-world effect:** limits unauthorized actions and avoidable harm, creates accountable operating boundaries, and helps ensure that gains in automation do not come at the expense of human agency, privacy, safety, or lawful process.

## 3. How downstream effects must be described

Every claimed effect must be placed on an evidence ladder:

1. **Concept** — intended capability or hypothesis.
2. **Designed** — a specification or architecture exists.
3. **Implemented** — code exists in a named revision.
4. **Unit-tested** — isolated tests pass.
5. **Integration-tested** — real components interact under controlled conditions.
6. **Staging-verified** — the configured system passes end-to-end tests in staging.
7. **Production-observed** — a named production version demonstrably performs the operation.
8. **Outcome-measured** — a real-world baseline and post-change results establish the effect.
9. **Independently audited** — methods and results have been independently reviewed.

A status at one level must not be described as a higher level. Passing unit tests does not prove a live service; a live service does not prove economic savings; a cryptographic digest does not prove the underlying claim; and an architectural goal does not establish decentralization.

For each material real-world impact, record:
- the affected actor, system, or community;
- the causal mechanism connecting the change to the outcome;
- the baseline and counterfactual;
- the measured metric, unit, sample, and observation period;
- uncertainty, failure modes, external factors, and adverse effects;
- who has authority, who bears cost, who benefits, and who can contest the result;
- source revision, deployment identifier, evidence, and rollback/remediation path.

## 4. Required engineering consequences

- Maintain one project-scope source of truth and link subsystem memos back to it.
- Describe biometric/passkey handoff as one identity-plane capability only.
- Keep the `.com` identity plane and `.ai` immersive/runtime plane distinct while ensuring secure, explicit handoff.
- Keep authorization, deterministic execution, probabilistic inference, memory, receipts, resource metering, and settlement as separately testable contracts.
- Build staging adapters against actual service implementations; do not invent service endpoints or infer functionality from names.
- Use real measurements and honest status labels for compute, energy, pricing, savings, and operational impact.
- Do not promote to production or change production infrastructure without the applicable explicit approval and a documented rollback plan.

## 5. Current evidence boundary

The governed Iris runtime currently has passing isolated CI evidence on its integration branch. That does **not** establish a live end-to-end staging deployment, configured identity/Trinity/memory/provider bindings, production integration, real energy metering, token issuance, settlement, or measured customer savings. The historical source audit identifies prototype and telemetry claims that require source/runtime verification.

This boundary is not a reduction in project ambition. It is the rule that the size of the vision and the truth of the evidence must grow together.

## 6. Canonical summary

**DualisCapax is a governed deterministic-first hybrid intelligence, compute, resource-accounting, evidence, and real-world operations architecture. Identity is one input; authorization is one control; compute and intelligence are capabilities; evidence and measurement connect execution to reality; and verified outcomes are the standard for claiming impact.**


## 7. Residual Law Finance — strategic application

Residual Law Finance is a proposed financial and operational application of the wider DualisCapax architecture. It seeks to identify residual value—waste, underused capacity, discrepancies, avoidable cost, or unrealized operational value—then establish a credible baseline, classify uncertainty, authorize any intervention, measure actual results, and reconcile value before any financial claim or settlement.

It is not merely identity or authentication, and it is not permission to label every estimated gap as money, profit, debt, or an asset. A candidate residual must be distinguished from a verified and attributable outcome. No finding automatically authorizes a protected action, creates an obligation, mints a token, or triggers payment.

The business thesis, candidate initial markets, outcome-based fee hypotheses, measurement protocol, unit economics, safeguards, regulatory boundary, and milestone plan are documented in [Residual Law Finance](RESIDUAL-LAW-FINANCE.md). The thesis is ambitious but not yet market-validated; its scale must be established through repeatable pilots and independently reproducible outcomes.


## 8. Quantum-capable compute strategy across x86 and ARM

DualisCapax should treat compute capability as a portable workload layer rather than assume that one processor architecture is the universal execution target. x86-64 and ARM systems can both host deterministic workloads, quantum-inspired classical algorithms, and classical simulation of small quantum circuits, subject to library, compiler, instruction-set, memory, and performance constraints. ARM edge nodes may be attractive where power efficiency and deployment footprint matter; x86 servers may be attractive for existing infrastructure, high-memory workloads, and accelerator availability. Neither advantage should be assumed without benchmarking the actual workload.

Three execution classes must remain distinct:

1. **Deterministic classical compute:** reproducible, explicitly specified calculations and policy checks, with versioned inputs, outputs, and evidence.
2. **Quantum-inspired or quantum-simulated compute:** classical algorithms influenced by quantum methods, or classical simulation of quantum circuits. These may support optimization and research, but are not actual quantum execution. Simulation costs can grow exponentially with simulated qubit count for general state-vector methods.
3. **Quantum processor execution:** work submitted to an actual quantum processing unit through a provider or locally connected device. An ARM or x86 host may prepare, schedule, validate, and post-process a job, but the host CPU itself does not become quantum hardware.

A future quantum adapter must be an optional, capability-declared backend behind the same workload contract. It must record backend identity, software and circuit versions, input/output digests, job identifiers, shots or repetitions where relevant, calibration/context supplied by the provider, uncertainty, cost, latency, and verification method. Probabilistic quantum output must not be mislabeled as deterministic proof. Where a result controls a consequential action, it must be checked against an explicit acceptance criterion and, where feasible, a classical reference or independent validation path.

The first engineering milestone is not to claim “quantum on ARM.” It is to implement and benchmark the same well-defined workload on available x86 and ARM targets, compare energy per accepted result, latency, memory, reproducibility, and total cost, then separately evaluate a quantum-inspired algorithm or small simulation. Actual QPU execution remains a distinct future integration requiring accessible hardware/provider credentials and its own validation.

No quantum hardware, quantum advantage, production ARM parity, or measured energy savings is claimed by this scope document. These are capabilities to test, not assumed outcomes.
