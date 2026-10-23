# Diamond Spectral Decomposition — v1

Status: PROPOSED  
Registry: `config/dualis.spectral_registry.v1.json`

## Purpose

Run the Three Rings through the Diamond ceiling-to-floor and floor-to-ceiling without flattening different kinds of evidence into one bucket. “Every spectrum of everything” is an extensible search objective, not a claim that this registry is complete.

The registry separates six axes:

1. Electromagnetic frequency bands: radio, microwave, infrared, visible, ultraviolet, X-ray, gamma-ray.
2. Non-electromagnetic waves: acoustic/seismic, mechanical, plasma, and gravitational waves.
3. Particle/radiation channels: charged particles, neutrons, neutrinos, cosmic rays, and particle-flux measurements.
4. Energy forms and transfer quantities: kinetic, potential, thermal/internal, chemical, electrical, magnetic-field, radiant, nuclear, elastic, mass-energy relationships, work, heat, power, and flux.
5. Spatial/temporal/system scales: quantum through cosmological, including biological/ecological and planetary/geophysical scopes.
6. Information/model channels: human reports, instrument telemetry, derived measurements, simulations, predictions, and unresolved observations.

These axes are not interchangeable. An electromagnetic spectrum is organized by frequency, wavelength, or photon energy; an energy form is an accounting category; a sensor channel is a method of observation; and a model output is not a direct observation. Some boundaries depend on convention and production mechanism.

## Diamond ceiling → floor

1. State the claim and its scope.
2. Identify the applicable ring questions and constraints.
3. Choose relevant decomposition axes without assuming every axis applies.
4. Name the observable, measurement method, units, calibration, uncertainty, and detection limits.
5. Capture the source record with a stable ID and timestamp.
6. Run independent validation and retain the original record.

## Diamond floor → ceiling

1. Verify record integrity, source, timestamp, and method version.
2. Check units, calibration, uncertainty, and instrument detection limits.
3. Distinguish no detection from evidence of absence.
4. Compare independent observations and competing explanations.
5. Check consistency with physical and mathematical constraints.
6. Ask the Philosophy ring whether definitions or assumptions exceed the evidence.
7. Revise the higher-level claim while preserving prior versions and contrary evidence.

## Three-ring review

- **Philosophy (A):** definitions, assumptions, scope, epistemic limits, and ethical implications.
- **Physics (B):** measurable quantities, methods, units, calibration, uncertainty, detection limits, and reproducibility.
- **Law (C):** physical and mathematical constraints, protocol invariants, and applicable legal/policy constraints. A human-made rule must not be mislabeled as a law of nature.

All required rings review the same claim, but no majority vote turns a claim into truth. Record each ring's SUPPORT, CHALLENGE, NOT_APPLICABLE_WITH_REASON, or UNRESOLVED verdict. Unresolved disagreement stays visible.

## Repeated passes

Every pass records the input version, question, changed assumptions, evidence added, tests performed, result, reviewer, and next unresolved item. Re-running identical data is a reproducibility check; it does not independently strengthen the evidence. Promote a status only when new evidence or stronger independent validation warrants it. Rejected hypotheses remain in the history with reasons.

## Minimum observation record

Each record needs a stable ID, axis and channel, source, time, value/payload, units or encoding, method and calibration version, uncertainty, detection limits, evidence state, and links to raw evidence. If a field is unavailable, mark it UNKNOWN rather than inventing it. Energy accounting must preserve units and provenance; an unknown joule value stays unknown.

## Boundary conditions

- This registry is a proposed taxonomy, not an exhaustive inventory of all phenomena.
- It does not infer consciousness from complexity, connectivity, or unexplained observations.
- It does not convert simulation output into observed fact.
- It does not claim eFuse is a validated universal physical law.
- It does not connect to live instruments or control devices.
- New domains are added as versioned entries with provenance and definitions, not by silently changing prior records.

## Acceptance test for each iteration

An iteration is useful only if it improves coverage, traceability, reproducibility, contradiction detection, uncertainty handling, or decision quality. “Ran again” alone is not a pass.
