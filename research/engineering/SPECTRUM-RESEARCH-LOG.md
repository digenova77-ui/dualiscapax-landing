# Spectrum-to-System Research Log

**Project:** DualisCapax / Three Rings · One Seed  
**Log version:** 0.2  
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
- Result: interactive schematic workbench, research plan, analytic hydrogen reference module, strict seed-manifest verifier, adversarial unit tests, and pull-request CI were added on `research/diamond-floor-recursion-v1`.
- Evidence: repository artifacts and CI result associated with draft PR #109.
- Status: PARTIAL PASS for the initial hydrogen reference tests. The expanded CI run after adding seed-verifier tests is pending re-check; browser rendering and cross-domain mapping remain NOT TESTED.
- Limits: no claim of unified physics, physical causation, or production readiness.

### Wave 1 — Canonical seed and independent verification
- Question: can the seed be serialized unambiguously and independently checked without executing user-supplied code?
- Implemented on branch: `research/engineering/seed_verifier.py` and `research/engineering/test_seed_verifier.py`.
- Scope: strict required-field/version validation; rejects duplicate keys, NaN/Infinity, binary floats, unknown fields and schema versions; canonical JSON bytes; SHA-256 commitment; tests for key-order stability and mutation. Manifest contents are treated as data; no embedded code is executed.
- Important limit: this is schema validation and content commitment only, not proof of mathematical correctness or an independent replay implementation.
- Status: IMPLEMENTED; expanded CI run pending re-check; independent second implementation remains NEXT.

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


### Wave 1a — Canonical manifest boundary
- Date: 2026-10-17
- Question: can ambiguous manifests be rejected before any model-specific processing?
- Artifacts: `research/engineering/seed_verifier.py`; `research/engineering/test_seed_verifier.py`; expanded `.github/workflows/hydrogen-reference-tests.yml`.
- Expected behavior: duplicate JSON keys, binary floats, non-finite values, unsupported schema versions, missing fields, and extra fields are rejected; key order does not change canonical bytes; changed content changes the SHA-256 commitment.
- Execution status: code and CI workflow committed to the research branch; expanded workflow result not yet verified at log time.
- Known limitation: Python JSON canonicalization here is a project-specific constrained format, not a claim of full RFC 8785 compliance. Cross-language independent replay is not yet implemented.
- Next: verify CI; add an independent implementation and a formal canonical encoding specification before treating hashes as cross-language stable.


### Wave 1b — Portable manifest boundary and cross-domain evidence review
- Date: 2026-10-19
- Question: what minimum contract is needed before a model manifest can be replayed consistently across implementations, and which measurement disciplines inform that contract?
- Evidence labels: E = established reference/documented result; D = derived engineering implication; H = hypothesis; U = unknown/not tested.
- Physics (E): NIST Atomic Spectra Database v5.12 lists hydrogen spectral and energy-level references; its data content was last updated November 2024. The current hydrogen module remains a nonrelativistic Coulomb model; no energy-level comparison was added in this wave. Source: https://www.nist.gov/pml/atomic-spectra-database
- Mathematics (D): state, rules, units, boundary conditions, observables, invariants, and limits form a useful schema, but that shared vocabulary does not establish shared governing equations or a cross-domain invariant. No Three Rings mapping is proven.
- Computation (E/D): reproducible-build guidance requires the same source, environment, and instructions to recreate byte-identical artifacts. A hash is a byte-identity check, not a correctness proof. Source: https://reproducible-builds.org/docs/definition/
- Energy/metrology (E/D): joule is the SI unit of energy; watt is joule per second. Measurement claims need a defined quantity, instrument/method, calibration chain, and uncertainty. Traceability alone does not establish fitness for purpose. Sources: https://www.nist.gov/pml/special-publication-811/nist-guide-si-chapter-4-two-classes-si-units-and-si-prefixes and https://www.nist.gov/calibrations/traceability
- Distributed systems (E/D): formally verified consensus algorithms establish agreement/safety under stated assumptions, not the truth of external sensor inputs. Treat input provenance and scientific validity as separate gates. Source: https://arxiv.org/abs/1606.01387
- Real-world control (E/D): observability and controllability are model-dependent properties; controller verification must account for uncertainty and closed-loop requirements. No actuator path is authorized or tested. Sources: https://introcontrol.mit.edu/fall26/prelabs/prelab6/obs_1 and https://ntrs.nasa.gov/citations/20080033122
- Inverse problems (E): USGS research documents non-uniqueness in seismic refraction inversions, including cases where exact data can admit multiple models. More observations help only when they reduce ambiguity or add independent constraints. Source: https://www.usgs.gov/publications/inverse-problem-refraction-travel-times-part-ii-quantifying-refraction-nonuniqueness
- Implementation change: `research/engineering/seed_verifier.py` now rejects non-ASCII object keys, unpaired surrogate code points, non-JSON Python values, and integers outside the JavaScript safe-integer range, in addition to rejecting binary floats. This narrows the accepted value space toward portable cross-language encoding.
- Execution result: GitHub Actions run 39256013130 passed on commit `0c4c819c03682d9d4acef66f8f18df6631a6c56b`: https://github.com/digenova77-ui/dualiscapax-landing/actions/runs/39256013130 . The run executed the existing hydrogen and seed-verifier tests only; tests for the new portability restrictions, a shared known-answer vector, and an independent Node.js verifier have NOT been added or run.
- Assumptions/limits: safe integers and ASCII object keys are an explicit project restriction, not a universal JSON requirement. No energy meter, seismometer, solar data stream, Moon/Mars archive, or closed-loop controller was connected or measured in this wave.
- Failure/uncertainty: independent cross-language replay remains BLOCKED; browser/accessibility smoke test remains NOT TESTED; hydrogen energy reference comparison remains NOT TESTED; no physical cross-scale mapping has passed a falsifiable test.
- Next falsifiable question: can a fixed canonical manifest produce identical canonical bytes and SHA-256 in Python and a second implementation, while both implementations reject duplicate keys, noncanonical encodings, unsafe integers, and unsupported schema fields? Acceptance requires shared known-answer vectors and adversarial tests in CI.
- Status: PARTIAL PASS for the existing CI suite; portable-boundary coverage and independent replay remain NOT TESTED.
