"""Lease fencing. claimed_by equality is not a generation."""
from __future__ import annotations

import time
import uuid
from dataclasses import dataclass
from typing import Optional


@dataclass
class Fence:
    lease_id: str
    generation: int
    authority_epoch: int
    worker_id: str
    expires_at: int
    status: str = "IN_PROGRESS"


class FenceStore:
    def __init__(self, authority_epoch: int = 1) -> None:
        self.epoch = authority_epoch
        self._rows = {}

    def claim(self, task_id: str, worker_id: str, lease_seconds: int) -> Optional[Fence]:
        now = int(time.time())
        row = self._rows.get(task_id)
        if row is None:
            fence = Fence(lease_id=str(uuid.uuid4()), generation=1, authority_epoch=self.epoch, worker_id=worker_id, expires_at=now + lease_seconds)
            self._rows[task_id] = fence
            return fence
        if row.status == "COMPLETED":
            return None
        if row.status == "IN_PROGRESS" and now < row.expires_at:
            return None
        fence = Fence(lease_id=str(uuid.uuid4()), generation=row.generation + 1, authority_epoch=self.epoch, worker_id=worker_id, expires_at=now + lease_seconds)
        self._rows[task_id] = fence
        return fence

    def complete(self, task_id: str, worker_id: str, lease_id: str, generation: int, authority_epoch: Optional[int] = None) -> dict:
        now = int(time.time())
        row = self._rows.get(task_id)
        if row is None:
            return {"authorized": False, "reason": "UNKNOWN_TASK", "rowcount": 0}
        if row.status == "COMPLETED":
            return {"authorized": False, "reason": "ALREADY_COMPLETED", "rowcount": 0}
        if row.worker_id != worker_id:
            return {"authorized": False, "reason": "WRONG_WORKER", "rowcount": 0}
        if row.lease_id != lease_id:
            return {"authorized": False, "reason": "STALE_LEASE", "rowcount": 0}
        if row.generation != generation:
            return {"authorized": False, "reason": "STALE_GENERATION", "rowcount": 0}
        if authority_epoch is not None and row.authority_epoch != authority_epoch:
            return {"authorized": False, "reason": "EXPIRED_EPOCH", "rowcount": 0}
        if now >= row.expires_at:
            return {"authorized": False, "reason": "EXPIRED", "rowcount": 0}
        row.status = "COMPLETED"
        return {"authorized": True, "reason": "FENCE_MATCH", "rowcount": 1, "generation": row.generation, "lease_id": row.lease_id}
