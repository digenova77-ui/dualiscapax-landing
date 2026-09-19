"""DCLM-AI — Dualis Core Logic Module.

Public face: Iris
Spec name: Axiom Intellectus
Entity: DualisCapax

Note: meter.chain / parent receipt chaining was advertised in package
exports and README but never implemented in meter.py. Do not re-export
a phantom `chain`. Parent/nonce binding remains NOT_IMPLEMENTED —
do not invent commitment semantics here.
"""

from .kernel import Record, run
from .law import LAW_FLOOR, scan_veto
from .meter import Measure, measure_case

__all__ = [
    "LAW_FLOOR",
    "Measure",
    "Record",
    "measure_case",
    "run",
    "scan_veto",
]
__version__ = "0.1.1-kernel"

# Honest absence — callers must not treat this as a live chain API.
CHAIN_STATUS = "NOT_IMPLEMENTED"
