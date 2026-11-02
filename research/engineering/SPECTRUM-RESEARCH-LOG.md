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


### Wave 1c — Independent canonical replay and evidence boundary
- **Date:** 2026-11-02
- **Question:** can a second runtime independently validate the restricted seed manifest and reproduce the same canonical-byte SHA-256 commitment?
- **Evidence labels:** E = established reference; D = derived result; M = measured observation; H = hypothesis; A = analogy; U = unknown; F = failed test.
- **Repository starting point:** PR #109, branch `research/diamond-floor-recursion-v1`, prior head `15ee5b5dc935b0ce77c057a90953eafcab5e7812`. The prior associated CI run 39256302375 completed successfully on that prior head; its two Python test steps passed. That run does not include the changes recorded in this wave.
- **Physics (E/U):** NIST Atomic Spectra Database v5.12 provides critically evaluated atomic energy levels and spectral transitions; its data content is dated November 2024. The hydrogen reference implementation remains a nonrelativistic one-electron Coulomb model with an infinitely heavy nucleus. No new comparison against NIST energy levels, no new laboratory measurement, and no higher-order correction were performed. The simplified model must not be presented as precision spectroscopy. Source: NIST ASD, https://www.nist.gov/pml/atomic-spectra-database (accessed 2026-11-02).
- **Mathematics (D):** a canonical manifest is a finite encoding contract, not a proof of a common invariant between hydrogen, geophysics, orbital dynamics, or control systems. The cross-domain mapping remains unproven. A successful hash match only establishes equality of the committed canonical bytes under the declared profile.
- **Computation (D/M):** added `parse_canonical_manifest` in Python, an independent Node.js verifier, a shared known-answer fixture, adversarial tests, and a formal restricted-profile note. The profile requires exactly the declared schema fields; ASCII object keys; valid Unicode scalar strings; safe integers only; recursively sorted keys; compact UTF-8 JSON; no BOM or extra whitespace; and exact source-to-canonical-byte equality. Arrays retain order. The shared fixture's expected SHA-256 is `2b204b9227a5e51c905a46cccd38862d39b7d05cbe2e618a8c20e694c6fef57e`.
  - Python uses the existing strict duplicate-key parser and now additionally requires exact canonical source for replay.
  - Node's built-in `JSON.parse` does not expose duplicate-key events. The Node verifier therefore rejects duplicate-key input by requiring raw source to equal the canonical re-serialization; this also rejects whitespace, unsorted keys, alternate numeric spellings, and other noncanonical encodings.
  - This is explicitly a **project-specific restricted profile, not RFC 8785/JCS**. RFC 8785 supports a broader number model and UTF-16 property-name ordering; our ASCII-key/safe-integer-only profile is narrower. Source: RFC 8785, https://www.rfc-editor.org/rfc/rfc8785 (accessed 2026-11-02).
- **Energy / metrology (E/U):** NIST traceability policy requires an unbroken comparison chain and uncertainty statements; a calibration label alone does not make every downstream measurement traceable. No meter, energy interval, sensor calibration record, or eFuse physical measurement was acquired in this wave. Source: NIST Calibration Policies, https://www.nist.gov/calibrations/policies (accessed 2026-11-02).
- **Distributed systems (D/U):** canonical hashes can support content addressing and tamper detection, but this implementation does not provide identity authentication, event ordering, durable distributed consensus, replay protection for external side effects, or truth validation for sensor inputs. No multi-node fault-injection or partition test was run. Existing consensus reference: https://arxiv.org/abs/1606.01387.
- **Real-world control (E/U):** observability and controllability remain properties of a specified plant and model; no plant, sensor network, controller, or actuator was connected. No closed-loop, stability, safety-bound, or shadow-mode pilot test was performed. Existing references: https://introcontrol.mit.edu/fall26/prelabs/prelab6/obs_1 and https://ntrs.nasa.gov/citations/20080033122.
- **Geophysical inference (E/U):** inverse problems can be non-unique; more samples are not automatically more information unless they constrain competing models. No new seismic dataset was ingested or measured. Existing USGS reference: https://www.usgs.gov/publications/inverse-problem-refraction-travel-times-part-ii-quantifying-refraction-nonuniqueness.
- **Implementation commits on the research branch:**
  - Python strict canonical-source function: `a95d41cd908dcc2e8a887e0c4de6cceb64a6ea7f`
  - Python portability and fixture tests: `9709955d7b04e051884535d24d0915caaec9847c`
  - Independent Node verifier: `60d853f7f8f8332070be217d00bb9b41dd9664f0`
  - Node adversarial tests: `10284e1a4fcc51d2298e75d67e37dd8849a7a1c2`
  - Shared known-answer fixture: `39b996ec9851e0798955b2017b3cd0fa7976e118`
  - Canonical profile specification: `f8df43e0321f4fc55af1cec2d5c62904faa6d524`
  - CI workflow extension: `b1a041a175d7e5b08afd2193798d10c43e8237cd`
- **Local test execution:** on Python 3.13.5, `python -m unittest -v test_hydrogen_reference.py test_seed_verifier.py` passed **18 tests** (5 hydrogen + 13 seed-manifest). On Node.js 22.16.0, `node --test seed_verifier.test.mjs` passed **10 tests**. These were local scratch-worktree tests against the branch source plus this wave's proposed changes. CI for the new branch head is **PENDING** at log-entry time; do not promote local results to a CI claim.
- **Failure record (F):** the first combined local invocation failed because the temporary scratch directory did not yet contain the existing hydrogen test module. This was a harness assembly omission, not a product-code failure. After copying the current branch's hydrogen source and tests into the scratch directory, all 18 Python tests passed. No test failure was suppressed.
- **Uncertainties / limits:** the known-answer vector exercises one manifest fixture. Unicode value edge cases, broad generated nested structures, multiple independent Node/Python runtime versions, full JSON grammar fuzzing, and formal proof of implementation equivalence remain untested. No physical measurement or cross-domain physical correspondence was produced.
- **Status:** **LOCAL PASS / CI PENDING** for the added cross-language verifier work. Prior CI remains PASS only for the earlier head. Draft PR stays open and unmerged; no deployment, DNS, server, credential, or actuator action occurred.
- **Next falsifiable question:** for a deterministic suite of generated manifests spanning every allowed JSON value shape, paired Unicode scalar strings, nested arrays/objects, and both safe-integer boundaries, do Python and Node produce byte-identical canonical output and SHA-256 while rejecting every malformed or noncanonical input?
- **Exact next actions:** (1) wait for and inspect CI on the new head; (2) fix any runtime disagreement before accepting the profile; (3) add generated cross-runtime fixtures and UTF-8/Unicode edge cases; (4) add a hydrogen energy-eigenvalue/reference comparison with model-appropriate reduced-mass and fine-structure caveats; (5) keep the workbench schematic until its plotted points are generated from the numerical model; (6) keep all physical integrations in read-only shadow mode until a separate safety and authorization review.


### Wave 1c correction — UTF-8 BOM handling
- **Date:** 2026-11-02
- **Finding (F → corrected):** review of the Node byte decoder showed that the default `TextDecoder` BOM behavior strips a UTF-8 BOM before JSON parsing. That could have silently accepted a byte stream outside the declared no-BOM canonical profile.
- **Correction:** configure the decoder to preserve the BOM code point (`ignoreBOM: true`); JSON parsing then rejects the BOM-prefixed source. Added a regression test that prepends `EF BB BF` to the shared canonical fixture and expects rejection.
- **Local result:** Node.js 22.16.0 — **11 tests passed, 0 failed** after correction. The Python suite remains **18 passed**. The first BOM regression assertion expected a canonical-byte mismatch; the actual correct failure is earlier JSON parse rejection, so the assertion was narrowed to that behavior.
- **Commits:** decoder correction `dbc3d6ddaf70bdfc2e13a1a1084efcf1cdae098d`; BOM regression test `143771026380146c8f8b34d99986b66e7d5d52ea`.
- **CI:** new-head workflow run pending at this correction's log time. Prior run 41456752200 passed before this correction and therefore does not validate it.
- **Limit:** BOM rejection is now tested, but generated Unicode-value vectors and broader cross-runtime differential testing remain open.
