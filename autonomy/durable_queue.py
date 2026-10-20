"""Durable SQLite job queue with leases, idempotent submission, and bounded attempts."""
from __future__ import annotations

import hashlib
import json
import sqlite3
import time
import math
from contextlib import closing
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

MAX_TASK_TYPE_CHARS = 128
MAX_IDEMPOTENCY_KEY_CHARS = 256
MAX_PAYLOAD_BYTES = 65536
MAX_WORKER_ID_CHARS = 128


def _validate_worker_id(worker_id: str) -> None:
    if (not isinstance(worker_id, str) or not worker_id.strip()
            or len(worker_id) > MAX_WORKER_ID_CHARS
            or any(ord(char) < 32 for char in worker_id)):
        raise ValueError("worker_id must be a valid bounded string")


def _validate_lease(lease_seconds: int, now: object) -> float:
    if type(lease_seconds) is not int or not 1 <= lease_seconds <= 3600:
        raise ValueError("lease_seconds must be an integer between 1 and 3600")
    if now is None:
        return time.time()
    if isinstance(now, bool) or not isinstance(now, (int, float)):
        raise ValueError("now must be a finite timestamp")
    try:
        timestamp = float(now)
    except (OverflowError, ValueError):
        raise ValueError("now must be a finite timestamp") from None
    if not math.isfinite(timestamp):
        raise ValueError("now must be a finite timestamp")
    return timestamp


def _validate_generation(lease_generation: int | None) -> None:
    if type(lease_generation) is not int or lease_generation < 1:
        raise PermissionError("a valid lease generation is required")


@dataclass(frozen=True)
class QueueJob:
    job_id: str
    idempotency_key: str
    task_type: str
    payload: dict
    state: str
    attempts: int
    max_attempts: int
    lease_owner: Optional[str]
    lease_until: Optional[float]
    lease_generation: int = 0


def _canonical(value: object) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)


def _job_id(task_type: str, payload: dict, idempotency_key: str) -> str:
    return hashlib.sha256(_canonical({
        "task_type": task_type, "payload": payload, "idempotency_key": idempotency_key
    }).encode("utf-8")).hexdigest()


class SQLiteJobQueue:
    """Persistent coordination primitives, not an executor or authorization gate.

    Callers must authorize each job before handing it to a worker. Leases prevent
    two healthy workers from claiming the same queued job at once; they do not
    make external side effects exactly-once. Provider-side idempotency is still needed.
    """

    def __init__(self, path: str | Path) -> None:
        self.path = str(path)
        with closing(self._connect()) as db:
            db.execute("""
                CREATE TABLE IF NOT EXISTS autonomy_jobs (
                    job_id TEXT PRIMARY KEY,
                    idempotency_key TEXT NOT NULL UNIQUE,
                    task_type TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    state TEXT NOT NULL,
                    attempts INTEGER NOT NULL,
                    max_attempts INTEGER NOT NULL,
                    lease_owner TEXT,
                    lease_until REAL,
                    lease_generation INTEGER NOT NULL DEFAULT 0
                )
            """)
            # Forward-only migration for databases created before lease fencing.
            columns = {row[1] for row in db.execute("PRAGMA table_info(autonomy_jobs)")}
            if "lease_generation" not in columns:
                db.execute("ALTER TABLE autonomy_jobs ADD COLUMN lease_generation INTEGER NOT NULL DEFAULT 0")

    def _connect(self) -> sqlite3.Connection:
        db = sqlite3.connect(self.path, timeout=10, isolation_level=None)
        db.execute("PRAGMA busy_timeout = 10000")
        db.execute("PRAGMA journal_mode = WAL")
        db.execute("PRAGMA synchronous = FULL")
        return db

    def enqueue(
        self, task_type: str, payload: dict, *, idempotency_key: str,
        max_attempts: int = 3,
    ) -> QueueJob:
        if (
            not isinstance(task_type, str) or not task_type.strip()
            or len(task_type) > MAX_TASK_TYPE_CHARS
            or any(ord(char) < 32 for char in task_type)
        ):
            raise ValueError("task_type is required and must be a valid bounded string")
        if (
            not isinstance(idempotency_key, str) or not idempotency_key.strip()
            or len(idempotency_key) > MAX_IDEMPOTENCY_KEY_CHARS
            or any(ord(char) < 32 for char in idempotency_key)
        ):
            raise ValueError("idempotency_key is required and must be a valid bounded string")
        if not 1 <= max_attempts <= 10:
            raise ValueError("max_attempts must be between 1 and 10")
        if not isinstance(payload, dict):
            raise ValueError("payload must be a JSON object")
        try:
            payload_json = _canonical(payload)
            safe_payload = json.loads(payload_json)
        except (TypeError, ValueError, RecursionError) as exc:
            raise ValueError("payload must be valid finite JSON") from exc
        if len(payload_json.encode("utf-8")) > MAX_PAYLOAD_BYTES:
            raise ValueError("payload exceeds maximum size")
        job_id = _job_id(task_type, safe_payload, idempotency_key)
        with closing(self._connect()) as db:
            db.execute("BEGIN IMMEDIATE")
            prior = db.execute(
                "SELECT job_id, task_type, payload_json FROM autonomy_jobs WHERE idempotency_key = ?",
                (idempotency_key,),
            ).fetchone()
            if prior:
                if prior[1] != task_type or prior[2] != payload_json:
                    db.execute("ROLLBACK")
                    raise ValueError("idempotency key reused for a different task")
                db.execute("COMMIT")
                return self.get(prior[0])
            db.execute(
                """INSERT INTO autonomy_jobs
                (job_id, idempotency_key, task_type, payload_json, state, attempts,
                 max_attempts, lease_owner, lease_until)
                VALUES (?, ?, ?, ?, 'queued', 0, ?, NULL, NULL)""",
                (job_id, idempotency_key, task_type, payload_json, max_attempts),
            )
            db.execute("COMMIT")
        return self.get(job_id)

    def claim(self, worker_id: str, *, lease_seconds: int = 60, now: Optional[float] = None) -> Optional[QueueJob]:
        _validate_worker_id(worker_id)
        now = _validate_lease(lease_seconds, now)
        with closing(self._connect()) as db:
            db.execute("BEGIN IMMEDIATE")
            # Expired running jobs can be reclaimed only within their retry budget.
            db.execute(
                """UPDATE autonomy_jobs
                   SET state = CASE
                       WHEN state = 'cancel_requested' THEN 'cancelled'
                       WHEN attempts >= max_attempts THEN 'exhausted'
                       ELSE 'retryable_failure' END,
                       lease_owner = NULL, lease_until = NULL
                   WHERE state IN ('running', 'cancel_requested') AND lease_until <= ?""",
                (now,),
            )
            row = db.execute(
                """SELECT job_id, attempts, max_attempts FROM autonomy_jobs
                   WHERE state IN ('queued', 'retryable_failure') AND attempts < max_attempts
                   ORDER BY rowid LIMIT 1"""
            ).fetchone()
            if row is None:
                db.execute("COMMIT")
                return None
            job_id, attempts, max_attempts = row
            db.execute(
                """UPDATE autonomy_jobs SET state = 'running', attempts = attempts + 1,
                   lease_owner = ?, lease_until = ?, lease_generation = lease_generation + 1 WHERE job_id = ?""",
                (worker_id, now + lease_seconds, job_id),
            )
            db.execute("COMMIT")
        return self.get(job_id)

    def renew_lease(
        self, job_id: str, worker_id: str, *, lease_generation: int | None = None, lease_seconds: int = 60,
        now: Optional[float] = None,
    ) -> QueueJob:
        """Extend a live lease held by this worker; expired leases cannot be revived."""
        _validate_worker_id(worker_id)
        _validate_generation(lease_generation)
        now = _validate_lease(lease_seconds, now)
        with closing(self._connect()) as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute(
                "SELECT state, lease_owner, lease_until, lease_generation FROM autonomy_jobs WHERE job_id = ?",
                (job_id,),
            ).fetchone()
            if row is None:
                db.execute("ROLLBACK")
                raise KeyError("unknown job")
            state, owner, lease_until, generation = row
            if state != "running" or owner != worker_id or lease_generation is None or generation != lease_generation or lease_until is None or now >= lease_until:
                db.execute("ROLLBACK")
                raise PermissionError("worker does not hold a live lease for this job")
            db.execute(
                "UPDATE autonomy_jobs SET lease_until = ? WHERE job_id = ?",
                (now + lease_seconds, job_id),
            )
            db.execute("COMMIT")
        return self.get(job_id)

    def request_cancel(self, job_id: str) -> QueueJob:
        """Cancel queued work immediately or request cooperative cancellation of a worker."""
        with closing(self._connect()) as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute(
                "SELECT state FROM autonomy_jobs WHERE job_id = ?", (job_id,)
            ).fetchone()
            if row is None:
                db.execute("ROLLBACK")
                raise KeyError("unknown job")
            state = row[0]
            if state in {"succeeded", "cancelled", "blocked", "exhausted"}:
                db.execute("ROLLBACK")
                raise ValueError(f"job cannot be cancelled from {state}")
            if state in {"queued", "retryable_failure"}:
                db.execute(
                    "UPDATE autonomy_jobs SET state = 'cancelled', lease_owner = NULL, lease_until = NULL WHERE job_id = ?",
                    (job_id,),
                )
            elif state == "running":
                db.execute(
                    "UPDATE autonomy_jobs SET state = 'cancel_requested' WHERE job_id = ?",
                    (job_id,),
                )
            elif state == "cancel_requested":
                db.execute("COMMIT")
                return self.get(job_id)
            else:
                db.execute("ROLLBACK")
                raise ValueError(f"unsupported job state: {state}")
            db.execute("COMMIT")
        return self.get(job_id)

    def is_cancel_requested(self, job_id: str) -> bool:
        """Workers must poll this before side effects and during long-running work."""
        job = self.get(job_id)
        return job.state in {"cancel_requested", "cancelled"}

    def acknowledge_cancel(
        self, job_id: str, worker_id: str, *, lease_generation: int | None = None, now: Optional[float] = None
    ) -> QueueJob:
        """Acknowledge cooperative cancellation while the worker still owns a live lease."""
        _validate_worker_id(worker_id)
        _validate_generation(lease_generation)
        now = _validate_lease(60, now)
        with closing(self._connect()) as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute(
                "SELECT state, lease_owner, lease_until, lease_generation FROM autonomy_jobs WHERE job_id = ?",
                (job_id,),
            ).fetchone()
            if row is None:
                db.execute("ROLLBACK")
                raise KeyError("unknown job")
            state, owner, lease_until, generation = row
            if state != "cancel_requested" or owner != worker_id or lease_generation is None or generation != lease_generation or lease_until is None or now >= lease_until:
                db.execute("ROLLBACK")
                raise PermissionError("worker does not hold a live cancellation lease")
            db.execute(
                "UPDATE autonomy_jobs SET state = 'cancelled', lease_owner = NULL, lease_until = NULL WHERE job_id = ?",
                (job_id,),
            )
            db.execute("COMMIT")
        return self.get(job_id)

    def complete(self, job_id: str, worker_id: str, *, lease_generation: int | None = None, success: bool, retryable: bool = False,
                 now: Optional[float] = None) -> QueueJob:
        _validate_worker_id(worker_id)
        _validate_generation(lease_generation)
        now = _validate_lease(60, now)
        if type(success) is not bool or type(retryable) is not bool:
            raise ValueError("success and retryable must be booleans")
        with closing(self._connect()) as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute(
                "SELECT state, attempts, max_attempts, lease_owner, lease_until, lease_generation FROM autonomy_jobs WHERE job_id = ?",
                (job_id,),
            ).fetchone()
            if row is None:
                db.execute("ROLLBACK")
                raise KeyError("unknown job")
            state, attempts, max_attempts, owner, lease_until, generation = row
            if state not in {"running", "cancel_requested"} or owner != worker_id or lease_generation is None or generation != lease_generation or lease_until is None or now >= lease_until:
                db.execute("ROLLBACK")
                raise PermissionError("worker does not hold a live lease for this job")
            if state == "cancel_requested":
                # Cancellation cannot erase an external side effect already in flight.
                # Preserve success; block failures instead of scheduling a retry.
                next_state = "succeeded" if success else "blocked"
            elif success:
                next_state = "succeeded"
            elif retryable and attempts < max_attempts:
                next_state = "retryable_failure"
            elif retryable:
                next_state = "exhausted"
            else:
                next_state = "blocked"
            db.execute(
                """UPDATE autonomy_jobs SET state = ?, lease_owner = NULL, lease_until = NULL
                   WHERE job_id = ?""",
                (next_state, job_id),
            )
            db.execute("COMMIT")
        return self.get(job_id)

    def get(self, job_id: str) -> QueueJob:
        with closing(self._connect()) as db:
            row = db.execute(
                """SELECT job_id, idempotency_key, task_type, payload_json, state, attempts,
                   max_attempts, lease_owner, lease_until, lease_generation FROM autonomy_jobs WHERE job_id = ?""",
                (job_id,),
            ).fetchone()
        if row is None:
            raise KeyError("unknown job")
        return QueueJob(
            row[0], row[1], row[2], json.loads(row[3]), row[4], row[5], row[6], row[7], row[8], row[9]
        )
