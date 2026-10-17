# Diamond Floor / Diamond Ceiling — Recursion Research & Build Plan

**Status:** Research prototype specification; not a validated physical theory  
**Date:** 2026-10-17  
**Repository:** `digenova77-ui/dualiscapax-landing`  
**Branch:** `research/diamond-floor-recursion-v1`  
**Production:** Not deployed; no DNS, server, or production configuration changed.

## Purpose

Investigate whether a compact generative description can connect recurring mathematical ideas across:
1. Hydrogen quantum states,
2. Earth's layered interior,
3. Solar-system dynamics,
4. The proposed DualisCapax “Three Rings · One Seed” architecture.

The current claim is a **research hypothesis**, not an established law of physics: different systems may share formal features (state, constraints, interactions, invariants, evolution) even when their physical mechanisms differ.

## Diamond floor: minimum defensible description

For each system, record:

- **State:** the variables sufficient to describe the system for the question being asked.
- **Rules:** the governing equations and boundary conditions.
- **Interactions:** the couplings and environment.
- **Observables:** what can be measured or inferred.
- **Invariants / conservation laws:** what remains constant under stated assumptions.
- **Model limits:** scale, approximations, uncertainty, and omitted physics.

A generic schema is:

`Model = (state, rules, interactions, observables, invariants, limits)`

The generic schema is a software abstraction, not a claim that all three systems obey the same equations.

## Diamond ceiling: what a valid unification would require

A correspondence is stronger than a visual resemblance only if it defines a mapping between formal objects and survives tests. Require at least one of:

1. A shared invariant with a precise definition and domain.
2. A structure-preserving mapping between two mathematical models.
3. A common generative rule that reproduces known results at more than one scale.
4. A novel, falsifiable prediction that differs from a baseline model and can be measured.

Do not infer common physical causation from concentric shapes, a central point, or a recurring visual motif alone.

## Physics baseline

### Hydrogen

For a nonrelativistic hydrogen-like atom, stationary states are solutions to the Schrödinger equation with a Coulomb potential. In spherical coordinates the wavefunction separates into radial and angular parts:

`ψₙₗₘ(r,θ,φ) = Rₙₗ(r) Yₗₘ(θ,φ)`

The quantum numbers specify allowed states; `|ψ|²` gives the position probability density for the relevant state. Orbital renderings often show a selected probability isosurface, not a material shell. Real precision work must state whether it uses a nonrelativistic Schrödinger model or includes fine structure, QED, recoil, hyperfine effects, and other corrections.

Reference: NIST Atomic Spectroscopy Compendium, “Atomic States, Shells, and Configurations” and hydrogen energy levels; OpenStax, *University Physics Vol. 3*, §8.1.

### Earth

A layered interior is a geophysical model of composition, pressure, temperature, phase, and material properties. Its shells are physical regions; they are not quantum orbitals. The Earth's current structure is a result of formation and subsequent thermal and chemical evolution.

### Solar system

Planetary orbits are dynamical trajectories. At a first approximation, Newtonian gravity and initial masses/positions/velocities define the evolution; precision ephemerides add corrections as required. Orbit paths are not probability-density lobes.

## Candidate common formal vocabulary

| Candidate | Hydrogen | Earth | Solar system | Status |
|---|---|---|---|---|
| State variables | quantum state / amplitudes | density, temperature, composition, rotation | positions, velocities, masses | Common abstract idea; variables differ |
| Governing rules | quantum dynamics / Coulomb Hamiltonian | continuum physics, thermodynamics, geophysics | gravitational dynamics | Not the same equations |
| Symmetry | rotational symmetries of idealized Hamiltonian | approximate spherical symmetry | approximate central symmetry | Test case, not identity |
| Invariants | normalization; energy/angular momentum under stated conditions | conservation laws in a chosen model | energy/angular momentum in idealized isolated model | Must define assumptions |
| Emergence across scales | atomic structure from quantum states | layers from formation/evolution | orbital architecture from formation/evolution | Different mechanisms |
| Three rings | proposed software/interpretive roles | no physical mapping established | no physical mapping established | Metaphor until formally mapped |

## DualisCapax implementation concept

Treat the seed as a **model manifest**, not as a physical assertion:

`seed = { model_id, schema_version, state, rules, units, precision, boundary_conditions, observables, invariants, limits }`

A verifier should:

1. Parse and validate a canonical manifest.
2. Reject missing units, ambiguous precision, unsupported rules, and noncanonical encodings.
3. Execute the declared model with deterministic semantics where possible.
4. Check declared invariants and model-specific reference cases.
5. Serialize results canonically and compute a content hash as a commitment.
6. Let an independent implementation reconstruct the result and compare both values and canonical output.
7. Report **PASS / FAIL / INSUFFICIENT INPUT / MODEL OUT OF SCOPE** with exact reasons.

A hash identifies bytes; it does not prove that the mathematics, inputs, or physical interpretation are true. Independent replay checks reproducibility, not the truth of external measurements. Where floating-point execution differs across platforms, define numerical tolerances and report them; do not falsely promise bit-identical results.

## Test gates

- **T0 — schema:** required fields, units, ranges, version, canonical serialization.
- **T1 — known answers:** hydrogen ground-state energy and selected energy levels compared against a cited reference within declared tolerances.
- **T2 — invariants:** normalization / conservation checks appropriate to the model and assumptions.
- **T3 — independent replay:** second implementation computes from the same canonical inputs.
- **T4 — mutation:** change one input/rule/unit; the expected output or validation verdict must change.
- **T5 — model boundaries:** unsupported relativistic/QED/geophysical/dynamical cases must be labeled out of scope, not silently approximated.
- **T6 — security:** untrusted manifests are data only; no dynamic code execution, network fetch, or implicit authority.
- **T7 — production gate:** manual approval required before adding links to the public navigation, changing DNS, or deploying.

## First build slice

The accompanying `/diamond-floor.html` page is a visual research workbench. It is deliberately labelled conceptual and does not claim to calculate hydrogen wavefunctions or Earth/solar-system trajectories. It lets us compare the visual seed with three domains without confusing the analogy with evidence.

## Next engineering sequence

1. Replace illustrative drawings with separately sourced, correctly labeled scientific data/plots.
2. Add a small pure-function hydrogen reference calculator with explicit units and test fixtures.
3. Add canonical JSON manifest and SHA-256 commitment.
4. Implement independent replay and invariant checks in a second implementation.
5. Add an explicit cross-scale mapping proposal only after defining mathematical objects, domains, and falsifiable criteria.
6. Keep all work on a non-production branch until reviewed and approved.

## Acceptance rule

No statement may be promoted from **analogy** to **verified correspondence** unless the mapping, assumptions, test inputs, tolerances, reference results, and failure conditions are recorded. No statement may be promoted to **new physics** without a derivation and empirical evidence.
