"""Durable SQLite hash-chain ledger using only the Python standard library."""
from __future__ import annotations

import hashlib
import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, Tuple

from autonomy.ledger import Event, GENESIS, canonical_json


def _event_hash(sequence: int, previous_hash: str, payload: Dict[str, Any]) -> str:
    body = {"sequence": sequence, "previous_hash": previous_hash, "payload": payload}
    return hashlib.sha256(canonical_json(body).encode("utf-8")).hexdigest()


class SQLiteHashChainLedger:
    """Append-only API backed by SQLite transactions; verify before trusting reads.

    The database file must be protected by OS permissions and backups. Hash chaining
    detects modification but is not a digital signature and cannot defeat an attacker
    who can rewrite the entire database and recompute every hash.
    """

    def __init__(self, path: str | Path) -> None:
        self.path = str(path)
        with self._connect() as db:
            db.execute("""
                CREATE TABLE IF NOT EXISTS ledger_events (
                    sequence INTEGER PRIMARY KEY,
                    previous_hash TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    event_hash TEXT NOT NULL UNIQUE
                )
            """)

    def _connect(self) -> sqlite3.Connection:
        db = sqlite3.connect(self.path, timeout=10, isolation_level=None)
        db.execute("PRAGMA busy_timeout = 10000")
        db.execute("PRAGMA journal_mode = WAL")
        db.execute("PRAGMA synchronous = FULL")
        return db

    def append(self, payload: Dict[str, Any]) -> Event:
        safe_payload = json.loads(canonical_json(payload))
        payload_json = canonical_json(safe_payload)
        with self._connect() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute(
                "SELECT sequence, event_hash FROM ledger_events ORDER BY sequence DESC LIMIT 1"
            ).fetchone()
            sequence = (row[0] + 1) if row else 1
            previous_hash = row[1] if row else GENESIS
            event_hash = _event_hash(sequence, previous_hash, safe_payload)
            db.execute(
                "INSERT INTO ledger_events(sequence, previous_hash, payload_json, event_hash) VALUES (?, ?, ?, ?)",
                (sequence, previous_hash, payload_json, event_hash),
            )
            db.execute("COMMIT")
        return Event(sequence, previous_hash, safe_payload, event_hash)

    @property
    def events(self) -> Tuple[Event, ...]:
        with self._connect() as db:
            rows = db.execute(
                "SELECT sequence, previous_hash, payload_json, event_hash FROM ledger_events ORDER BY sequence"
            ).fetchall()
        return tuple(
            Event(seq, prev, json.loads(payload_json), digest)
            for seq, prev, payload_json, digest in rows
        )

    def verify(self) -> bool:
        previous = GENESIS
        for expected_sequence, event in enumerate(self.events, start=1):
            if event.sequence != expected_sequence or event.previous_hash != previous:
                return False
            if _event_hash(event.sequence, event.previous_hash, event.payload) != event.event_hash:
                return False
            previous = event.event_hash
        return True
