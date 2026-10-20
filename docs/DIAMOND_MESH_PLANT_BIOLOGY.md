# Diamond Mesh and Plant-Biology Research Boundary

## Purpose

This document defines a cautious software foundation for exploring a connected
diamond/graphene/plant-biology research concept. The current implementation is
an evidence-first graph and observation validator. It is **not** a materials
simulation, biological grafting method, safety approval, or proof of physical
compatibility.

## Three modeled layers

- **Foundation:** verified identities, governing constraints, provenance, and
  reproducible decisions.
- **Mesh:** typed relationships among components, with topology and isolated
  nodes reported explicitly.
- **Biology:** timestamped measurements from identified sources, with units and
  a traceable evidence reference.

The terms *diamond* and *graphene* name the intended research inspiration and
architecture. The software does not infer diamond strength, graphene transport
properties, plant compatibility, or biological effects from a graph edge.

## Evidence rules

1. Every node has a unique identifier and one of the declared layers.
2. Every edge must reference existing nodes; self-edges and duplicate
   undirected edges with the same relation are rejected.
3. Every observation must identify its subject, metric, unit, timezone-aware
   measurement timestamp, source, and evidence reference.
4. Non-finite values, duplicate observation IDs, unknown subjects, and
   timezone-naive timestamps fail closed.
5. Connectivity is reported, never silently assumed. Isolated nodes and
   disconnected components remain visible.
6. A validated record means only that its structure and provenance fields
   passed software checks. It does not independently authenticate a sensor,
   calibrate a measurement, establish causation, or validate a scientific claim.

## Study protocol gate

`autonomy/research_protocol.py` checks the minimum structure of a proposed
non-invasive observation study: a falsifiable hypothesis, species, control
description, sample size, supported measurement metrics, calibration evidence,
predefined success criteria, stop conditions, and a recorded human review.
It rejects physical grafting and other interventions outside the observation
gate. Passing this software check means only that required fields and declared
constraints are present; it does not authenticate the reviewer or grant
scientific, ethical, legal, or laboratory approval.

## Real-world validation path

1. Define a specific, falsifiable hypothesis and success/failure criteria.
2. Establish material identity, characterization, and independent measurement
   methods before claiming material properties.
3. Start plant integration work with non-invasive sensing and controls; document
   species, growth conditions, calibration, sample sizes, and adverse effects.
4. Require qualified materials and plant-science review before any physical
   grafting, implantation, genetic modification, or field release.
5. Preserve raw observations and calibration metadata; separate measured data
   from model outputs and hypotheses.
6. Do not allow the software mesh to authorize lab procedures or actuate
   equipment. A separate, explicit human-reviewed safety process is required.

## Non-goals and limits

- No claim that software makes diamond and graphene physically compatible.
- No autonomous biological intervention, material fabrication, or lab control.
- No sensor authenticity guarantee from a source ID alone.
- No replacement for peer review, calibration, risk assessment, or regulatory
  requirements.

## Tests

Run the repository's Python test suite with:

```sh
python -m unittest discover -s tests -p 'test_*.py'
```


## Diamond Ceiling

`autonomy/diamond_ceiling.py` evaluates five evidence dimensions:
authority, evidence integrity, mesh integrity, execution safety, and scientific
validity. Each passing dimension must provide a non-empty evidence reference
and reviewer reference. The assessment also requires owner authorization and
an exact policy-version match. Missing, failed, duplicated, or unknown
dimensions block the ceiling.

The 0–100 score measures declared evidence coverage only. A score of 100 is
not sufficient for approval: authorization or policy drift still blocks the
ceiling. This validator cannot authenticate evidence or reviewers and cannot
prove actual OS isolation or scientific validity; those require independent
verification outside this software model.
