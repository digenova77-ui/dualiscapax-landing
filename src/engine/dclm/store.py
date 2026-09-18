"""Claim store. A persisted claim is still a claim."""
from __future__ import annotations

from typing import Dict, Optional


class ClaimStore:
    def __init__(self) -> None:
        self._claims: Dict[str, dict] = {}

    def put(self, claim_id: str, claim: dict) -> None:
        self._claims[claim_id] = dict(claim)
        self._claims[claim_id]["promoted"] = False

    def get(self, claim_id: str) -> Optional[dict]:
        return self._claims.get(claim_id)

    def is_authority(self, claim_id: str) -> bool:
        return False
