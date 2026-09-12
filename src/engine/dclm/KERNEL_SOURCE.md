# Kernel source index

Runnable package (this agent session):
- `src/engine/dclm/kernel.py` StateAuthorityKernel.apply
- `src/engine/dclm/evidence.py` BoundEvidence
- `src/engine/dclm/store.py` append-only events, fold ignores cached PROMOTABLE
- `src/engine/dclm/effects.py` EXECUTED|FAILED|INDETERMINATE
- `src/engine/dclm/entitlement.py` Stripe vs DCFuel projection
- `src/engine/dclm/iris_port.py` / `factory_port.py`
- `tests/test_endzone_kernel.py` 21 adversarial tests, process-local PASS

If a file is missing on a given commit, the implementation is incomplete — do not infer presence from this index.

foundation: false
