"""Typed ProofObject. A hash of a claim is not proof of the claim.

Mutation of any material field changes proof_id. Status strings are labels
derived from a ProofObject; they are not themselves authority.
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional


def _canon(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), default=str)


@dataclass
class ProofObject:
    assertion_id: str
    evidence_hashes: List[str]
    evidence_provenance: str
    derivation_rule: str
    derivation_parameters: Dict[str, Any]
    contract_id: str
    ontology_version: str
    evaluator: str
    evaluator_version: str
    authority_effect: str
    residual_obligations: List[str]
    temporal_context: Dict[str, Any]
    dependency_hashes: List[str]
    threat_model: str
    independent_check_result: str
    claim_text: str = ""
    informational: Dict[str, Any] = field(default_factory=dict)

    def material(self) -> Dict[str, Any]:
        d = asdict(self)
        d.pop("informational", None)
        return d

    @property
    def proof_id(self) -> str:
        return hashlib.sha256(_canon(self.material()).encode("utf-8")).hexdigest()

    def mutated(self, **kwargs) -> "ProofObject":
        data = asdict(self)
        data.update(kwargs)
        return ProofObject(**data)

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["proof_id"] = self.proof_id
        return d


class ProofRequired(Exception):
    pass
