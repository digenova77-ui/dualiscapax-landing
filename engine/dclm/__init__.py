"""DCLM-AI — Dualis Core Logic Module.

Public face: Iris
Spec name: Axiom Intellectus
Entity: DualisCapax
"""

from .kernel import Record, run
from .law import LAW_FLOOR, scan_veto
from .meter import Measure, chain, measure_case

__all__ = [
    "LAW_FLOOR",
    "Measure",
    "Record",
    "chain",
    "measure_case",
    "run",
    "scan_veto",
]
__version__ = "0.1.1-kernel"
