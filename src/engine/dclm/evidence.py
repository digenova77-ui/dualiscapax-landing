"""Bound evidence. Observation ≠ claim ≠ proof."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Optional


@dataclass(frozen=True)
class BoundEvidence:
    evidence_id: str
    kind: str
    payload_hash: str
    observed_at: str
    observer: str
    repository_commit: Optional[str] = None
    configuration_hash: Optional[str] = None
    ontology_version: Optional[str] = None
    evaluator_version: Optional[str] = None
    authority_epoch: Optional[int] = None
    dependency_hashes: tuple = ()
    notes: Dict[str, Any] = field(default_factory=dict)

    def is_proof(self) -> bool:
        return False
