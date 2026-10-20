"""Small deterministic task supervisor; does not execute external side effects."""
from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from enum import Enum
from typing import Dict, Optional

from autonomy.ledger import HashChainLedger


class JobState(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    RETRYABLE_FAILURE = "retryable_failure"
    BLOCKED = "blocked"
    EXHAUSTED = "exhausted"


@dataclass(frozen=True)
class Job:
    job_id: str
    task_type: str
    payload: dict
    max_attempts: int = 3
    attempts: int = 0
    state: JobState = JobState.QUEUED
    result_digest: Optional[str] = None


def _stable_id(task_type: str, payload: dict, idempotency_key: str) -> str:
    body = json.dumps(
        {"task_type": task_type, "payload": payload, "idempotency_key": idempotency_key},
        sort_keys=True, separators=(",", ":"), ensure_ascii=False,
    )
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


class Supervisor:
    def __init__(self, ledger: Optional[HashChainLedger] = None) -> None:
        self.ledger = ledger or HashChainLedger()
        self._jobs: Dict[str, Job] = {}
        self._idempotency: Dict[str, str] = {}

    @property
    def jobs(self) -> Dict[str, Job]:
        return dict(self._jobs)

    def submit(
        self, task_type: str, payload: dict, *, idempotency_key: str,
        max_attempts: int = 3,
    ) -> Job:
        if not task_type.strip() or not idempotency_key.strip():
            raise ValueError("task_type and idempotency_key are required")
        if not 1 <= max_attempts <= 10:
            raise ValueError("max_attempts must be between 1 and 10")
        canonical = json.loads(json.dumps(payload, sort_keys=True))
        fingerprint = hashlib.sha256(json.dumps(
            {"task_type": task_type, "payload": canonical},
            sort_keys=True, separators=(",", ":"),
        ).encode("utf-8")).hexdigest()
        prior = self._idempotency.get(idempotency_key)
        if prior:
            existing = self._jobs[prior]
            existing_fingerprint = hashlib.sha256(json.dumps(
                {"task_type": existing.task_type, "payload": existing.payload},
                sort_keys=True, separators=(",", ":"),
            ).encode("utf-8")).hexdigest()
            if fingerprint != existing_fingerprint:
                raise ValueError("idempotency key reused for a different task")
            return existing
        job_id = _stable_id(task_type, canonical, idempotency_key)
        job = Job(job_id, task_type, canonical, max_attempts=max_attempts)
        self._jobs[job_id] = job
        self._idempotency[idempotency_key] = job_id
        self.ledger.append({"type": "job_submitted", "job_id": job_id, "task_type": task_type})
        return job

    def start(self, job_id: str, *, authorized: bool) -> Job:
        job = self._require(job_id)
        if not authorized:
            blocked = Job(**{**job.__dict__, "state": JobState.BLOCKED})
            self._jobs[job_id] = blocked
            self.ledger.append({"type": "job_blocked", "job_id": job_id, "reason": "authorization_missing"})
            return blocked
        if job.state not in {JobState.QUEUED, JobState.RETRYABLE_FAILURE}:
            raise ValueError(f"job cannot start from {job.state.value}")
        if job.attempts >= job.max_attempts:
            exhausted = Job(**{**job.__dict__, "state": JobState.EXHAUSTED})
            self._jobs[job_id] = exhausted
            self.ledger.append({"type": "job_exhausted", "job_id": job_id})
            return exhausted
        running = Job(**{**job.__dict__, "state": JobState.RUNNING, "attempts": job.attempts + 1})
        self._jobs[job_id] = running
        self.ledger.append({"type": "job_started", "job_id": job_id, "attempt": running.attempts})
        return running

    def finish(self, job_id: str, *, success: bool, result: dict | None = None) -> Job:
        job = self._require(job_id)
        if job.state != JobState.RUNNING:
            raise ValueError("only running jobs can finish")
        result_digest = hashlib.sha256(json.dumps(
            result or {}, sort_keys=True, separators=(",", ":"), ensure_ascii=False
        ).encode("utf-8")).hexdigest()
        if success:
            updated = Job(**{**job.__dict__, "state": JobState.SUCCEEDED, "result_digest": result_digest})
            self.ledger.append({"type": "job_succeeded", "job_id": job_id, "result_digest": result_digest})
        elif job.attempts >= job.max_attempts:
            updated = Job(**{**job.__dict__, "state": JobState.EXHAUSTED})
            self.ledger.append({"type": "job_exhausted", "job_id": job_id, "attempts": job.attempts})
        else:
            updated = Job(**{**job.__dict__, "state": JobState.RETRYABLE_FAILURE})
            self.ledger.append({"type": "job_retryable_failure", "job_id": job_id, "attempts": job.attempts})
        self._jobs[job_id] = updated
        return updated

    def _require(self, job_id: str) -> Job:
        try:
            return self._jobs[job_id]
        except KeyError as exc:
            raise KeyError("unknown job") from exc
