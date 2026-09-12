"""Historical name the end-zone handoff attacked. Disabled reducer."""
from .kernel import StateAuthorityKernel

class TruthRecord:
    def __init__(self, *_, **__):
        raise RuntimeError("LEGACY_TRUTH_RECORD_DISABLED")
    def enforce_no_self_certification(self):
        raise RuntimeError("LEGACY_TRUTH_RECORD_DISABLED")

def reduce_evidence_states(*_, **__):
    raise RuntimeError("EVIDENCE_LABELS_DO_NOT_REDUCE_TO_PROMOTABLE")

def kernel():
    return StateAuthorityKernel()
