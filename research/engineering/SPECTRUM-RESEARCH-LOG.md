# Spectrum-to-System Research Log

**Project:** DualisCapax / Three Rings · One Seed  
**Log version:** 0.1  
**Started:** 2026-10-17  
**Current state:** Research branch only; draft PR #109  
**Production boundary:** No production deployment, DNS mutation, or live-server changes authorized or performed.

## Mission

Study recurring structure across physical, mathematical, computational, and operational systems; separate observation from interpretation; convert only well-defined claims into reproducible tests and real-world prototypes.

The phrase “full spectrum” is operationalized as a coverage map, not a claim that every possible domain has been exhausted.

## Evidence labels

- **E — Established:** supported by a standard model, reference data, or repeated observation within a stated domain.
- **D — Derived:** follows from explicit assumptions and a reproducible derivation.
- **M — Measured:** tied to a specific measurement, source, units, uncertainty, and time.
- **H — Hypothesis:** a proposed relation requiring tests.
- **A — Analogy:** a conceptual or visual resemblance without a demonstrated structure-preserving mapping.
- **U — Unknown:** insufficient information or untested implementation.
- **F — Falsified / failed:** a claim or test did not survive its stated criteria. Preserve the failure record.

A claim may have more than one label, but must not be promoted merely because a visualization looks convincing.

## Domain coverage matrix

| Domain | Minimum object to record | Candidate invariant / relation | Practical implication to investigate | Current evidence status |
|---|---|---|---|---|
| Quantum / hydrogen | Hamiltonian, quantum state, boundary conditions, constants | Normalization, symmetries, allowed energy levels | Reference solver and numerical verification | E within declared nonrelativistic model; implementation tests passed in CI |
| Electromagnetism | Fields, sources, constitutive laws, gauge/boundary conditions | Charge conservation; Maxwell constraints | Sensor calibration, energy measurement | U until a concrete test case is selected |
| Classical mechanics | State, forces, masses, initial conditions | Energy/angular momentum in an isolated model | Predictive simulation and fault detection | E within stated assumptions |
| Thermodynamics | State variables, flows, reservoirs, constraints | First/second law balances; entropy production | Energy efficiency and heat-loss accounting | E in standard domains; application model U |
| Geophysics / Earth | Composition, pressure, temperature, phases, uncertainties | Conservation and equilibrium relations in selected model | Infrastructure, water, thermal-resource monitoring | E as a distinct physical model; no orbital mapping established |
| Celestial dynamics | Masses, positions, velocities, forces, time model | Conserved quantities in idealized isolated systems | Trajectory prediction and scheduling | E within stated assumptions; visual overlay is A |
| Complex / adaptive systems | State, feedback, disturbance, control policy | Stability and boundedness conditions | Homeostatic control with safe limits | H until a concrete plant and objective are defined |
| Information / computation | Canonical inputs, rules, execution semantics, output | Reproducibility; specified invariants | Independent verification and auditable decisions | D/U per implementation |
| Distributed systems | Event IDs, ordering, identity/authentication, durable log | Replay protection, consistency properties, append-only commitments | Fault-tolerant workflow and audit | U until adversarial integration tests pass |
| Energy / eFuse | Metered energy, units, interval, sensor calibration, tariff/valuation rule | Dimensional consistency; reconciled energy balance | Metered cost and resource allocation | H/U; do not equate joules with economic value without an explicit conversion and policy |
| Human / organizational systems | Observable outcomes, consent, context, constraints | No universal scalar invariant assumed | Workflow ergonomics, accountability | U; avoid reducing people to a single score |
| Safety / governance | Authority, allowed actions, limits, failure modes, recovery | Fail-closed behavior and least privilege | Prevent unintended writes and irreversible actions | Required engineering control; must be tested |

## Recursion test — operational definition

A “recurring pattern” is not accepted on appearance alone. For each proposed pair of domains, log:

1. **Objects:** what mathematical objects are being compared?
2. **Map:** define the function from objects in domain A to domain B.
3. **Preserved structure:** state which property the map preserves.
4. **Domain and assumptions:** specify where the map is valid and where it fails.
5. **Prediction:** derive an outcome not used to invent the mapping.
6. **Baseline:** compare with the best domain-specific model.
7. **Falsifier:** record a result that would reject the mapping.
8. **Independent reproduction:** rerun using a separately implemented path.

If no mapping or falsifier can be stated, classify the connection as analogy or open question.

## Real-world candidate applications and gates

### A. Energy-aware industrial control
- Inputs: calibrated meter readings, time interval, equipment state, process output, ambient conditions.
- Metrics: energy per unit output, peak demand, uncertainty, downtime, safety constraints.
- Baseline: current control strategy under comparable operating conditions.
- Gate: shadow-mode observation first; no actuator writes until safety review and explicit approval.
- Falsifier: no repeatable improvement outside measurement uncertainty, or any safety/quality regression.

### B. Independent computation verification
- Inputs: canonical model manifest and versioned rules.
- Metrics: reproducibility, false acceptance/rejection, execution cost, numerical discrepancy.
- Baseline: one implementation and its existing tests.
- Gate: second implementation, known-answer fixtures, mutation tests, malformed-input tests, and bounded resource use.
- Falsifier: two implementations agree only because they share the same bug or trusted unverified oracle.

### C. Adaptive homeostasis
- Inputs: measured state, target range, disturbance, actuator limits, observation latency.
- Metrics: deviation integral, settling time, overshoot, resource use, constraint violations.
- Baseline: no-control or existing control policy.
- Gate: simulation, historical replay, shadow mode, then bounded pilot with manual stop.
- Falsifier: instability, unsafe overshoot, unmeasured disturbance sensitivity, or no benefit against baseline.

### D. Audit and ledger integrity
- Inputs: event schema, unique operation ID, canonical payload, authorization evidence, previous record commitment.
- Metrics: duplicate acceptance, altered-record detection, recovery, and replay behavior.
- Gate: idempotency, durable writes, crash recovery, tamper tests, and explicit authorization before external effects.
- Falsifier: a duplicate can execute twice, unauthorized input is committed, or an interrupted operation leaves an ambiguous outcome.

## Follow-up wave protocol

Each wave produces a dated append-only entry with:
- question and scope;
- source URLs / bibliographic identifiers and access date;
- evidence label;
- assumptions and units;
- computation / test command;
- expected and observed result;
- logs, commit SHA, and artifact paths;
- failure and uncertainty record;
- next question and owner;
- explicit status: PROPOSED, RUNNING, PASS, FAIL, BLOCKED, or NOT TESTED.

Do not rewrite earlier conclusions to make a new result look inevitable. Append a correction with its reason and links.

## Current wave ledger

### Wave 0 — Concept and repository checkpoint
- Date: 2026-10-17
- Question: can the recurring three-ring visual motif be turned into a testable research and implementation plan?
- Result: interactive schematic workbench, research plan, analytic hydrogen reference module, unit tests, and pull-request CI were added on `research/diamond-floor-recursion-v1`.
- Evidence: repository artifacts and CI result associated with draft PR #109.
- Status: PARTIAL PASS for the software reference tests; NOT TESTED for browser rendering and cross-domain mapping.
- Limits: no claim of unified physics, physical causation, or production readiness.

### Wave 1 — Canonical seed and independent verification
- Question: can the seed be serialized unambiguously and independently checked without executing user-supplied code?
- Required work: strict schema; reject duplicate keys, NaN/Infinity, ambiguous floating-point values, and unknown rule versions; hash canonical bytes; test mutation and independent replay.
- Status: NEXT.

### Wave 2 — Hydrogen numerical integration
- Question: do numerical radial and angular distributions normalize within declared error bounds, and do calculated energies agree with the stated model/reference?
- Reference: NIST Atomic Spectra Database and hydrogen/deuterium energy-level resources.
- Status: PARTIAL — radial/angular normalization tests exist; energy reference comparison and visualization data connection remain.

### Wave 3 — Cross-domain mapping
- Question: does any defined mapping preserve a meaningful invariant between hydrogen, Earth layering, celestial dynamics, and the seed schema?
- Status: OPEN; no mapping is established.

### Wave 4 — Real-world pilot selection
- Question: which measured system has the cleanest baseline, safe shadow mode, and objective success criterion?
- Status: OPEN; energy/resource monitoring and independent computation verification are candidates, not approved live pilots.

## Initial source register

- NIST, *Energy Levels of Hydrogen and Deuterium*: https://www.nist.gov/pml/energy-levels-hydrogen-and-deuterium
- NIST Atomic Spectra Database, neutral hydrogen levels: https://physics.nist.gov/PhysRefData/Handbook/Tables/hydrogentable5.htm
- NIST, *Critical Compilation of Experimental Data on Spectral Lines and Energy Levels of Hydrogen, Deuterium, and Tritium*: https://www.nist.gov/publications/critical-compilation-experimental-data-spectral-lines-and-energy-levels-hydrogen
- OpenStax, *University Physics Volume 3*, §8.1, The Hydrogen Atom: https://openstax.org/books/university-physics-volume-3/pages/8-1-the-hydrogen-atom

## Hard limits

- Never describe a metaphor as a measured physical result.
- Never claim all spectra or all physics have been exhaustively studied.
- Never execute code from a model manifest.
- Never claim a hash proves correctness or truth.
- Never use a physical resemblance as a basis for a medical, financial, industrial, or safety-critical action.
- Never change live DNS, production, or external actuators without explicit approval.
