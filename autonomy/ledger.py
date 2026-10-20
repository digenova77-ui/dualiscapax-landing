"""Deterministic hash-chained ledger for autonomy decisions and outcomes.

The ledger is an in-memory reference implementation. Durable storage, signatures,
and external anchoring must be added by a reviewed persistence adapter.
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Any, Dict, Iterable, Tuple

GENESIS = "0" * 64


def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


@dataclass(frozen=True)
class Event:
    sequence: int
    previous_hash: str
    payload: Dict[str, Any]
    event_hash: str


def _digest(sequence: int, previous_hash: str, payload: Dict[str, Any]) -> str:
    body = {"sequence": sequence, "previous_hash": previous_hash, "payload": payload}
    return hashlib.sha256(canonical_json(body).encode("utf-8")).hexdigest()


class HashChainLedger:
    def __init__(self) -> None:
        self._events: list[Event] = []

    @property
    def events(self) -> Tuple[Event, ...]:
        return tuple(self._events)

    def append(self, payload: Dict[str, Any]) -> Event:
        # Round-trip through canonical JSON to detach caller-owned nested objects.
        safe_payload = json.loads(canonical_json(payload))
        previous = self._events[-1].event_hash if self._events else GENESIS
        event = Event(
            sequence=len(self._events) + 1,
            previous_hash=previous,
            payload=safe_payload,
            event_hash=_digest(len(self._events) + 1, previous, safe_payload),
        )
        self._events.append(event)
        return event

    def verify(self) -> bool:
        previous = GENESIS
        for expected_sequence, event in enumerate(self._events, start=1):
            if event.sequence != expected_sequence or event.previous_hash != previous:
                return False
            if _digest(event.sequence, event.previous_hash, event.payload) != event.event_hash:
                return False
            previous = event.event_hash
        return True

    @classmethod
    def from_events(cls, events: Iterable[Event]) -> "HashChainLedger":
        ledger = cls()
        ledger._events = list(events)
        if not ledger.verify():
            raise ValueError("ledger integrity verification failed")
        return ledger
