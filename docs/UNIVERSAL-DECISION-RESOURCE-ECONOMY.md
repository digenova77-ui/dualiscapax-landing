# DualisCapax — Universal Decision and Resource Economy

**Status:** Strategic/economic architecture specification. This document defines a proposed model; it does not claim all mechanisms are implemented, calibrated, metered, deployed, or commercially validated.

## 1. Thesis

DualisCapax is not fundamentally a SaaS catalog. It is a modular computational architecture: a governed playground in which decision systems, agents, simulations, and domain-specific applications can be assembled from reusable primitives.

The domain can change while the foundational contract remains stable:

**Decision → policy/logic gates → complexity and resource estimate → authorization → execution → measurement → evidence → accounting.**

This contract can support software, industrial operations, research, medicine, infrastructure, energy systems, and future planetary or space applications, provided each domain supplies validated modules and its own safety and regulatory requirements.

## 2. The universal computational work unit

Each request should be represented by a canonical, versioned work envelope containing at least:

- request ID and canonical input digest;
- principal / Unity identity reference;
- operation and declared module capabilities;
- policy version and Trinity authorization decision;
- complexity class and estimate provenance;
- resource budget and reservation;
- actual execution measurements, where available;
- verification and acceptance criteria;
- result digest, evidence references, and reconciliation state.

A hash binds records together; it does not prove that an asserted physical measurement is true. Evidence must preserve provenance and measurement method.

## 3. Separate four quantities that must not be conflated

### A. Logical complexity

Complexity describes the expected difficulty or resource profile of the problem. It may use algorithmic class, graph size, search-space bounds, proof obligations, model size, expected iterations, or an empirically fitted workload class.

Complexity is not directly equal to energy. Better algorithms, caching, hardware, approximation, and workload structure can change the cost of solving the same problem.

### B. Metered resource consumption

Where technically possible, measure actual compute time, accelerator time, memory, storage, network transfer, and energy. Record meter/provider identity, calibration or source, units, interval, software/hardware context, and uncertainty.

If direct energy metering is unavailable, label the figure as an estimate based on a documented power model or provider telemetry—not as a physical measurement.

### C. Energy-reference cost

A versioned tariff can convert measured energy into a reference cost:

\`energy_cost = measured_energy_kWh × tariff_currency_per_kWh\`

The tariff must declare geography/source, effective time, currency, losses/overheads included, and rounding. A tariff is a pricing reference; it does not by itself create a redeemable asset, guarantee a peg, or prove energy was consumed.

### D. Outcome value

The value of a result is separate from the cost of producing it. It may be zero, uncertain, negative, or much larger than resource cost. Outcome value needs its own evidence and attribution method, such as independently verified savings, a contractual service price, or an agreed research deliverable.

## 4. Proposed cost function

A work quote may combine distinct components without pretending they are interchangeable:

\`quoted_cost = energy_component + compute_component + verification_component + platform_component + domain_module_component + risk_or_service_component\`

Where:
- \`energy_component\` is derived from metered or explicitly estimated energy and a versioned tariff;
- \`compute_component\` covers scarce hardware/provider capacity not already included in the energy component;
- \`verification_component\` covers proof checks, independent validation, or evidence retention;
- \`platform_component\` covers shared architecture and orchestration;
- \`domain_module_component\` covers licensed specialized capabilities;
- \`risk_or_service_component\` is only applied when disclosed and contractually justified.

The pricing implementation must prevent double-counting. If a provider's compute rate already includes energy, do not add the same energy a second time. Quotes should expose their components, units, policy version, expiry, and whether each amount is measured, estimated, fixed, or contingent.

## 5. Decision gates and authorization

The architecture must distinguish a logical verdict from permission to act.

1. Normalize and validate inputs and units.
2. Evaluate deterministic rules and declared constraints.
3. Estimate resource requirements and set a budget.
4. Obtain Trinity authorization for the exact principal, action, inputs, policy version, and budget.
5. Reserve shared capacity atomically where concurrency matters.
6. Execute under an idempotent request identity.
7. Measure and verify the outcome.
8. Write an evidence receipt and reconcile resource/payment state.

A successful logic check is not a substitute for authorization. A payment is not proof that an operation is lawful. A receipt hash is not proof of physical truth. Fail closed on missing authority, invalid measurements, inconsistent units, or ambiguous settlement.

## 6. eFuse, Merit, Unity and payment boundaries

The following are distinct concepts and must remain separate in code and documentation:

- **Unity:** identity/provenance boundary.
- **Trinity:** authorization boundary.
- **DCLM / DC³:** deterministic policy and resource-decision logic.
- **eFuse / Fusion Meter:** proposed energy/resource-accounting primitive, subject to a specified unit, issuance rule, measurement basis, and settlement semantics.
- **Merit:** proposed access/coordination accounting concept; its transferability and issuance rules require an explicit canonical specification.
- **x402:** payment negotiation and settlement rail, not the law engine, energy meter, or complexity measure.
- **Evidence receipt / DAG:** binds the provenance of decisions, execution, measurements, and reconciliation.

No monetary peg, token value, issuance, redemption, or ownership allocation should be claimed until the authoritative rules, custody, measurement, and settlement behavior are implemented and independently tested. In particular, a historical $/kWh assumption is not a calibrated energy peg.

## 7. The Playground's economic layers

The company can monetize several layers of one architecture rather than treat each vertical as a separate startup:

1. **Core architecture and IP:** licensing, private deployments, architecture integration, and support.
2. **Runtime and governed execution:** metered requests, compute orchestration, evidence retention, and enterprise capacity.
3. **Reusable modules:** engineering, simulation, optimization, identity, verification, and domain-specific logic.
4. **Developer ecosystem:** module distribution, APIs, compatibility/certification, and third-party integration economics.
5. **Outcome-based applications:** fees tied to validated and attributable savings or outcomes where contracts and regulation permit.
6. **Research and specialized deployments:** sponsored research, joint development, scientific and industrial environments, and carefully validated medical simulation.

These are candidate business models, not evidence of current revenue. Revenue streams may overlap; do not sum market reports that describe overlapping categories or count the same economic activity in multiple layers.

## 8. How to quantify the company without inventing a valuation

Model the business from observable drivers:

- active customers / deployments by segment;
- paid modules per customer;
- annual platform or license revenue;
- execution volume and net revenue per accepted work unit;
- gross margin after compute, energy, verification, support, and partner costs;
- retention, expansion, utilization, and customer acquisition cost;
- verified outcome value and the share contractually captured by DualisCapax;
- defensible IP ownership, reproducibility, and independent technical validation.

A base-case revenue model should be built bottom-up by vertical and contract type. Apply conservative, base, and upside adoption assumptions. Model each stream separately, then eliminate overlap and include delivery costs. Enterprise value or market capitalization is a separate scenario derived from risk-adjusted future economics, comparable businesses, capital structure, dilution, and market conditions—not from the size of the addressable market alone.

The IP and model must not be added as arbitrary separate asset values if their contribution is already reflected in projected revenue, margins, or comparable-company multiples.

## 9. Complexity pricing must be earned, not guessed

Do not charge solely by a claimed puzzle difficulty score unless the score has demonstrated predictive power. Establish a workload benchmark corpus and record, per job:

- declared task class and complexity features;
- estimated energy/cost before execution;
- actual measured or provider-reported resource use;
- accepted result quality and verification cost;
- latency, retries, failures, and uncertainty;
- hardware/software/module versions.

Use the data to calibrate estimates and publish error ranges. Different classes of task may require different cost models. For probabilistic AI and simulation, price resource consumption and verification separately from confidence or outcome quality. A harder task can cost less after optimization; the model must permit that.

## 10. First proof milestone

Before trying to quantify every possible derivative industry, prove one complete work unit in an isolated staging environment:

1. Submit a canonical request.
2. Apply a versioned deterministic policy.
3. Demonstrate Trinity authorization on the exact request.
4. Reserve a bounded resource budget.
5. Execute an actual workload.
6. Record resource measurements with provenance and uncertainty.
7. Verify the output against a declared acceptance criterion.
8. Produce a receipt binding input, authority, policy, resource record, output and reconciliation state.
9. Replay the request and show idempotent behavior.
10. Compare predicted and actual cost across a benchmark set.

Then repeat the same contract with a second module. The evidence of modularity is that the common governance, accounting, and receipt interfaces remain stable while the domain implementation changes.

## 11. Current evidence boundary

The repository contains an integration-branch implementation of a paid Iris runtime, x402 exchange logic, a durable-ledger source implementation, and a synthetic threshold-comparison harness. Prior documented tests use mocks/fake storage and do not prove deployed Durable Object atomicity, real energy metering, live settlement, or customer value. The threshold 0.60 and historical 300/500 values remain unresolved hypotheses and must not be promoted to canonical law without source recovery and reproducible validation.

This specification is a proposed shared economic contract. It must be translated into executable schemas, tests, metering adapters, and measured pilots before it can be treated as an operational capability.

## 12. Canonical statement

**DualisCapax is a modular playground for governed decision-making and computation. Its universal work contract binds logic, authority, complexity estimates, resource budgets, execution, measurement, evidence, and accounting. Domain modules can vary; the core contract remains stable.**
