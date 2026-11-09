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


### Wave 1d — Unicode known-answer vector and numeric boundary replay
- **Date:** 2026-11-02
- **Question:** does the restricted canonical profile produce the same bytes and SHA-256 across Python and Node for non-ASCII scalar string values, and are the exact safe-integer endpoints accepted consistently?
- **Evidence labels:** D = derived implementation result; M = observed test result; U = untested broader domain.
- **Implementation:** added a second shared known-answer manifest containing the Unicode scalar string `café μ 🌍`; added Python and Node tests for the same expected digest, rejection of an alternate escaped representation, and acceptance of positive and negative JavaScript safe-integer endpoints. CI path filters now include the Unicode fixture.
- **Known-answer digest:** `b7c0e2186b6680c8c1dd092e2d9f2f98db10bd264ff018c03092fa9c9d0ca720`.
- **Local results:** Python 3.13.5 — **19 tests passed** (5 hydrogen + 14 seed); Node.js 22.16.0 — **14 tests passed**. The suite includes the ASCII and Unicode known-answer vectors, duplicate-key rejection, noncanonical whitespace/order/escaping rejection, safe-integer boundaries, unsafe/fractional number rejection, non-ASCII key rejection, unpaired-surrogate rejection, invalid UTF-8 rejection, UTF-8 BOM rejection, schema rejection, and mutation sensitivity.
- **CI result:** Research reference run `41457310914` completed successfully on code head `5b41d505cdf6bde0fc3b3145a6e868584cd3106b`; its hydrogen, Python seed, and Node seed steps passed. Other repository workflows were still completing when this entry was written; their final statuses must be checked separately.
- **Commits:** Python Unicode test `1296045ffd7a2399391b7c5ca39fc43abe5516a8`; Node Unicode/boundary tests `4ee2183939040732b11cb7d0a616c99ca2927571`; Unicode fixture `e15dd0a8e0b070db16577a02b0f7e0b2cce28264`; workflow path update `5b41d505cdf6bde0fc3b3145a6e868584cd3106b`.
- **Assumptions:** object keys remain ASCII; numeric values remain safe integers only; string values are Unicode scalar sequences; Python and Node canonicalizers are compared only under this explicit profile.
- **Limitations / unknowns:** two known-answer vectors and selected adversarial cases are not an exhaustive proof over all nested manifests. Generated differential tests, additional Unicode edge cases, runtime-version matrix testing, and fuzzing remain outstanding. No physical measurements or cross-domain physical mappings were introduced.
- **Status:** **LOCAL PASS / RESEARCH CI PASS** for the tested fixtures and cases. No claim of general formal equivalence.
- **Next falsifiable question:** for a fixed-seed generator producing at least 1,000 valid nested manifests and malformed near-neighbours within the declared profile, do Python and Node always emit identical canonical UTF-8 bytes and SHA-256, and do both reject the same invalid cases?
- **Next actions:** implement deterministic cross-runtime generated fixtures; add a Python 3.12/3.13 and Node 20/22 matrix; then proceed to the hydrogen energy-level reference test. Keep visualization and physical integration gates unchanged.


### Wave 1e — generated cross-runtime replay, hydrogen energy residual, and cross-domain evidence review
- **Date:** 2026-11-09
- **Research branch / draft:** `research/diamond-floor-recursion-v1` · PR #109 · draft remains OPEN against `main`.
- **Code head reviewed:** `ff00aaa210d623ff970571dfe405d903f2491d9e`.
- **Question A:** for 1,000 fixed-seed nested manifests within the declared restricted seed profile, do Python and Node produce identical canonical UTF-8 bytes and SHA-256, and reject the same malformed near-neighbours?
- **Question B:** does the nonrelativistic Coulomb energy model, with the hydrogen reduced-mass correction, reproduce the NIST hydrogen ionization reference at precision-spectroscopy accuracy?
- **Evidence labels:** P = published/evaluated physical or mathematical reference; D = derived result from stated inputs; M = observed CI/test result; H = hypothesis awaiting falsification; A = analogy only; U = unknown or unmeasured; F = observed failure/blocker. Labels are local to this entry and do not confer authorization or finality outside this research layer.

#### 1. Computation — generated canonical replay

- **Implementation [D]:** added a fixed-seed LCG generator (`0xD1A0C0DE`) and a checked-in fixture of 1,000 nested manifests. Each vector stores its canonical source bytes and SHA-256. Both Python and Node tests independently parse, validate, reserialize and hash every vector.
- **Adversarial cases [D]:** for every valid vector, both runtimes reject a trailing-whitespace near-neighbour and a duplicate-`model_id` near-neighbour. This is 1,000 valid vectors plus 2,000 invalid variants per runtime. Existing tests continue to cover Unicode scalar values, safe-integer endpoints, invalid UTF-8, BOM, duplicate keys, schema mismatch and mutation sensitivity.
- **Scope boundary [P/D]:** the project profile remains intentionally narrower than RFC 8785/JCS: ASCII object keys, Unicode scalar string values, safe integers only, recursive key ordering, compact UTF-8 JSON. It is not JCS-conformant. A SHA-256 match commits to bytes; it does not establish truth, model correctness, identity, authorization, event ordering or distributed consensus.
- **CI result [M]:** research workflow run `42634245187` passed all four matrix jobs: Python 3.12 + Node 20, Python 3.12 + Node 22, Python 3.13 + Node 20, and Python 3.13 + Node 22. In every job, the deterministic fixture regeneration check, hydrogen tests, Python seed tests and Node seed tests passed.
- **Interpretation:** this closes Wave 1d's stated generated-vector question for the fixed generator and declared profile. It is not a proof for arbitrary JSON, arbitrary runtimes, non-ASCII keys, floating-point values, or all parser implementations.

#### 2. Physics and energy — hydrogen reference with an explicit residual

- **Inputs [P]:** CODATA 2022 `R∞ = 10,973,731.568157 m⁻¹`, `m_e/m_p = 5.446170214889 × 10⁻⁴`, and exact SI values for `h`, `c`, and `e`. NIST ASD 5.12 reports neutral hydrogen's ionization energy as `13.598434599702 eV` with standard uncertainty `0.000000000012 eV`.
- **Implementation [D]:** added `nonrelativistic_energy_level_ev(n, electron_proton_mass_ratio)`. The helper computes the Coulomb/Rydberg level with the two-body reduced-mass factor; the default zero ratio preserves the infinite-nuclear-mass limit.
- **Derived result [D]:** the reduced-mass Schrödinger ground-state binding energy is `13.59828726428329 eV`. Against the NIST ASD value, the residual is `0.000147335418709815 eV`, or `1.08347337798 × 10⁻⁵` relative. That residual is about 12.3 million times the NIST quoted standard uncertainty.
- **Test result [M]:** the regression test asserts the derived value, the `1/n²` level scaling, and an explicitly bounded relative residual between `10⁻⁶` and `2 × 10⁻⁵`. It does **not** claim agreement within the NIST uncertainty.
- **Failure / limitation [F/U]:** the simple model is not precision spectroscopy. Dirac fine structure, radiative/QED (including the Lamb shift), nuclear-size and higher-order recoil terms are outside this helper. The observed residual is an expected model-scope gap, not evidence that the NIST reference is wrong.
- **Diamond material physics [P]:** NIST documents nitrogen-vacancy defects in diamond as real quantum-sensing elements: spin-state preparation/readout supports magnetic-field measurements, and NIST is developing photoelectric readout and material benchmarking. This is a genuine material-to-instrument mechanism. It does not establish a mapping from diamond physics to the DualisCapax architectural Floor or prove the Three Rings hypothesis.

#### 3. Mathematics and the Floor/Ceiling claims

- **D6 archival result [DOCUMENT/IDRIS]:** Deliverable 6 (Library file `libfile_88aeee2a9fb48191b47ed82a9280fc40`, modified 2026-11-08) reports from its first-hand corpus examination the material Floor (F1) and law-of-four Floor (F2) as distinct formulations with identity unresolved; the documentary route found no author who identifies them as one or explicitly distinguishes them. The founder ruling remains reserved.
- **D6 physics verdict [DOCUMENT/IDRIS]:** the governing architecture has no demonstrated mechanical dependency on diamond's physical properties; diamond is an analogy, while the code mechanisms (structural refusal and explicit gates) must stand on their own. D6 also records one factual defect in the canon's refractive-index superlative; correction/corrigendum remains a founder decision and was not made here.
- **Span / derivative [H]:** the lower-bound / potential-upper-bound span remains hypothesis-grade. It still lacks a fully specified domain, codomain, variables, units, sampling, uncertainty propagation, failure conditions and a falsifiable mapping. No common calculus object or shared physical law has been derived across hydrogen, Earth, planetary dynamics and the software schema.
- **No identity promotion:** the generic tuple `(state, rules, interactions, observables, invariants, limits)` is a useful software vocabulary, not a structure-preserving map between physical systems. Visual resemblance and common vocabulary remain analogy, not mechanism.

#### 4. Energy metrology and eFuse

- **Metrology rule [P]:** NIST's traceability policy defines traceability at the level of a measurement result through a documented, unbroken calibration chain, with each link contributing uncertainty. Traceability alone does not guarantee fitness for purpose.
- **Current state [U]:** no physical meter readings, calibration certificates, instrument identity, measurement method, uncertainty budget, or end-to-end energy traceability chain were supplied or verified in this research branch. No value has been assigned to `E` / `peg_ratio_E`; no energy peg was derived or tested.
- **Consequence:** eFuse remains an uninstantiated energy primitive at this evidence layer. A software constant or an uncalibrated power estimate cannot be promoted to measured joules or to a validated peg.

#### 5. Distributed systems

- **Theory [P]:** the Fischer–Lynch–Paterson result shows that in a fully asynchronous message-passing system, deterministic consensus may fail to terminate with even one crash-faulty process, despite reliable message delivery.
- **Implementation status [U]:** the generated hash tests establish deterministic serialization and digest agreement for a shared input corpus. They do not test independent nodes, message reordering, partitions, leader failure, quorum intersection, replay after crash, or consensus termination.
- **Required before any consensus claim:** state the timing/failure model, fault threshold, quorum rule, durable log semantics, recovery procedure, and liveness assumptions. A matching digest is not a consensus receipt.

#### 6. Real-world control and safety

- **Mathematical baseline [P]:** linear state-space controllability and observability are properties of a specified plant model; their classical rank tests require matrices `A`, `B`, and `C` (or their discrete-time equivalents). A generic schema without a plant model cannot pass these tests.
- **Safety baseline [P]:** NASA systems-engineering guidance separates verification, validation, qualification testing, acceptance testing and the safety/certification evidence needed before field use.
- **Current state [U]:** no real plant, state-space matrices, sensor inventory, calibration records, actuator boundary, operating envelope, hazard analysis or recorded sensor dataset is in this branch. No controller was designed or connected; no actuator or external system was operated.
- **Safe next experiment:** a read-only shadow-mode study on an explicitly selected noncritical plant, using recorded data only, with observability/controllability analysis, uncertainty and hazard review, and a hard-disabled actuator path. This is a proposal, not permission to actuate.

#### 7. Repository, CI and deployment boundary

- **PR state [M]:** PR #109 remains draft/open; no review records were returned and it has not been merged.
- **Research CI [M]:** run `42634245187` — all four matrix jobs passed.
- **Other CI [M]:** `42634245190` (Iris/Trinity gauntlet), `42634245228` (Iris authorize CI), `42634245273` (Elite CI), `42634245497` (static i18n), and `42634245274` (symplectic invariant tests) completed successfully. The `Live Trinity edge verification` job was **SKIPPED**, not passed.
- **Preview status [M/F]:** Vercel reported both branch preview projects Ready at 2026-11-09 14:23:49 UTC for code head `ff00aaa`. After this entry was drafted, the Cloudflare Workers preview bot reported that the same code head `ff00aaa` failed at 2026-11-09 14:23:56 UTC (build `f19c9599-6870-4b2d-a14e-9e19933e49bc`); preceding commits `15a2adb` and `f7c49e2` also failed. The Cloudflare dashboard log was not accessible to this run, so the root cause remains unknown. This is a preview-build blocker, not evidence of a production outage.
- **Boundary:** no merge, production deployment, DNS change, live-server change, policy amendment, eFuse emission, transaction, or external actuation was performed. Vercel preview generation was automatic on the pushed research branch; no production target was selected.

#### 8. Assumptions, uncertainties and next falsifiable question

- **Assumptions:** the generated corpus represents the declared restricted seed profile only; all object keys are ASCII; numeric values are safe integers; strings are Unicode scalar sequences. The hydrogen helper uses the CODATA 2022 constants and a nonrelativistic one-electron Coulomb model with a reduced-mass correction.
- **Uncertainties:** full cross-runtime behavior outside the tested profile; the physical Floor's relation to the law-of-four Floor; the span candidate's formal domain/codomain; the value and evidence bar for `E`; distributed liveness under an explicit network model; and the observability/safety of any real plant.
- **Next falsifiable question:** can an independently implemented Dirac-Coulomb hydrogen reference, with reduced-mass/recoil, radiative/QED and proton-size corrections and propagated CODATA uncertainties, predict the NIST ASD 1s ionization reference and resolved 2p fine-structure levels within their stated uncertainties **without fitting to those same reference values**?
- **Next actions:** (1) derive the correction terms from primary references and document correlated constants; (2) implement an independent high-precision reference path and known-answer tests for 1s and 2p; (3) preserve the current nonrelativistic helper as a baseline and assert its expected residual; (4) separately specify one span candidate to the measurement-contract acceptance standard; (5) design a no-actuation shadow-mode control test only after a real plant and data provenance are identified.
- **Commit references:** generator `fc920afc788ab98b214f3243c713126861c9f8e9`; generated fixture `15a2adbefc9bb76ff9fc032f76952ad4aeb11de0`; Python generated-vector tests `fae12ceac9ba8793aeee6e7d4a4f03559820d662`; Node generated-vector tests `ba50f50a382b3c044ea8d952620042c9c07805ae`; runtime matrix workflow `1f63d3c5b640e572eb98e0e80472b4846349e81f`; hydrogen energy helper `a4d7fd5b336167a36c0a4a7697954742d8a68d46`; hydrogen energy tests `af4ad1833d80b800413a7fb4d95ffb921b45d498`; profile update / code head `ff00aaa210d623ff970571dfe405d903f2491d9e`.
- **Status:** **RESEARCH CI PASS** for the exact generated corpus and the bounded hydrogen model tests; **PHYSICS MODEL NOT PRECISION-VALIDATED**; **ENERGY / DISTRIBUTED CONSENSUS / REAL-WORLD CONTROL NOT ESTABLISHED**. No promotion from hypothesis or analogy to law, mechanism, consensus or authorization.

**Primary sources**
1. NIST CODATA 2022 values: https://physics.nist.gov/cgi-bin/cuu/Value?ryd%7Csearch_for=Rydberg ; https://physics.nist.gov/cgi-bin/cuu/Value?mesmp%7Csearch_for=mass+proton ; https://physics.nist.gov/cgi-bin/cuu/Value?rydhcev%7Csearch_for=Rydberg
2. NIST Atomic Spectra Database 5.12, neutral hydrogen ionization energy (query): https://physics.nist.gov/cgi-bin/ASD/ie.pl?spectra=H&units=1&at_num_out=on&el_name_out=on&seq_out=on&shells_out=on&level_out=on&e_out=0&unc_out=on&biblio=on
3. NIST Diamond NV Center Magnetometry: https://www.nist.gov/noac/technology/magnetic-and-electric-fields/nv-center-magnetometry
4. NIST metrological traceability policy / Technical Note 2156: https://www.nist.gov/metrology/metrological-traceability
5. RFC 8785, JSON Canonicalization Scheme: https://www.rfc-editor.org/rfc/rfc8785.html
6. Fischer, Lynch & Paterson, “Impossibility of Distributed Consensus with One Faulty Process,” JACM 32(2), 1985: https://groups.csail.mit.edu/tds/papers/Lynch/jacm85.pdf
7. Kalman, “Lectures on Controllability and Observability,” NASA-CR-113869, 1968: https://ntrs.nasa.gov/citations/19700032148
8. NASA Systems Engineering Handbook, verification and validation guidance: https://www.nasa.gov/reference/system-engineering-handbook-appendix/


#### 9. Final recheck after the log append (2026-11-09 14:28 UTC)

- **Branch head:** `2ccd257157738e858748682266aab1631862c18c` (log-only follow-up; implementation files are unchanged from code head `ff00aaa`).
- **Research matrix [M]:** run `42634921392` passed all four Python 3.12/3.13 × Node 20/22 jobs again.
- **Repository CI [M]:** `42634921400` Iris/Trinity gauntlet passed with live edge verification skipped; `42634921322` Iris authorize passed; `42634921395` static i18n passed; `42634921480` Elite CI passed. Symplectic invariant run `42634245274` on the implementation head also passed.
- **Vercel [M]:** both Vercel status contexts were SUCCESS on branch head `2ccd257`; preview only.
- **Cloudflare [F]:** latest published Worker result remains FAILED for implementation head `ff00aaa` (build `f19c9599-6870-4b2d-a14e-9e19933e49bc`). No Cloudflare result for log-only head `2ccd257` was present at this recheck. The failure log remains inaccessible to this run; exact root cause is not known.
- **Disposition:** PR #109 remains OPEN / DRAFT / unreviewed / unmerged. No production deployment, DNS or live-server operation was performed.


#### 10. Preview integration follow-up (2026-11-09 14:29 UTC)

- The branch head at this check was `be6d384ab3210dad0e468132956674e4bc11cc67`. All six GitHub workflow runs listed above had completed; the four-way research matrix and the repository regression, authorization, static, Elite and symplectic workflows passed. The live Trinity edge check remained skipped.
- Both Vercel status contexts were SUCCESS. Cloudflare Pages reported the branch preview successful at `https://84a0503c.dualiscapax-landing.pages.dev`.
- Cloudflare Workers had not yet completed the newer preview build for log-only commit `2ccd257` (build `5f986fdd-4a0d-47b6-ac94-0c213bfdbb03`); the preceding implementation commit `ff00aaa` remained a failed Worker build. Root cause still requires the Cloudflare build log.
- All Cloudflare/Vercel actions above were automatic branch-preview integrations. No manual deploy or production promotion was initiated.


#### 11. CI and Worker recheck (2026-11-09 14:31 UTC)

- **Implementation tree:** unchanged from `ff00aaa`; later commits `be6d384` and `25335a2` update only this research log.
- **Latest completed GitHub CI on the log-only head `25335a2` [M]:** research run `42635393010` passed all four runtime combinations; Iris/Trinity gauntlet `42635393042` passed with live edge verification skipped; Iris authorize `42635392999`, static i18n `42635392662`, symplectic invariants `42635392762`, and Elite CI `42635392920` all passed.
- **Vercel [M]:** both status contexts were SUCCESS on `25335a2`.
- **Cloudflare Pages [M]:** preview for `be6d384` completed successfully. The latest log-only commit may trigger a further preview.
- **Cloudflare Workers [F]:** the Worker build for log-only commit `be6d384` failed (build `42dafb58-5004-45e3-9753-ab20ee492f3d`), even though the implementation tree was unchanged from `ff00aaa`. This repetition on log-only commits is evidence for a Worker-specific integration/configuration problem, but that diagnosis remains **HYPOTHESIS** until the dashboard log is inspected. The Worker build for `2ccd257` was still marked IN PROGRESS; no result for `25335a2` had appeared.
- **Next action for the Worker blocker:** inspect the failed build logs for `f19c9599-6870-4b2d-a14e-9e19933e49bc` and `42dafb58-5004-45e3-9753-ab20ee492f3d`; compare the configured Worker root directory, build command, Wrangler entry point and required bindings against the repository. Do not change the integration or production configuration until the failure cause is evidenced.
