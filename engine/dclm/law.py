"""Layer [0] Law Floor — non-bypassable veto kernel.

NO_FORCE, HOST_SAFE, CLEANUP_FIRST, TRUTH_OR_NOTHING.
A veto is a fail-closed reset. It is not a debate.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Iterable

LAW_FLOOR = ("NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING")

_NO_FORCE = (
    r"\bjailbreak\b",
    r"\bignore (the )?(rules|law|invariants|safety)\b",
    r"\bmake them (pay|sign|comply)\b",
    r"\bforce (them|the board|the city)\b",
    r"\bcoerce\b",
    r"\bwithout (their|the) consent\b",
)
_HOST_SAFE = (
    r"\b(hack|exploit|breach)\b",
    r"\bpassword\b",
    r"\bapi[_ ]?key\b",
    r"\bprivate key\b",
    r"\bshell (as root|injection)\b",
    r"\bwipe (their|the) (server|drive|db)\b",
)
_CLEANUP = (
    r"\bremember this (password|sin|sin number|card)\b",
    r"\bstore (the )?(secret|credential|token) in (chat|repo|github)\b",
)
_TRUTH = (
    r"\bthis (will|is a) cure\b",
    r"\bguaranteed (return|profit|cure)\b",
    r"\bbuy (the )?token\b",
    r"\boffer(ing)? (of )?securities\b",
    r"\bprescribe\b",
    r"\bdiagnose (me|them|the patient)\b",
    r"\bclaim (the )?millennium prize\b",
)

COMPILED = {
    "NO_FORCE": [re.compile(p, re.I) for p in _NO_FORCE],
    "HOST_SAFE": [re.compile(p, re.I) for p in _HOST_SAFE],
    "CLEANUP_FIRST": [re.compile(p, re.I) for p in _CLEANUP],
    "TRUTH_OR_NOTHING": [re.compile(p, re.I) for p in _TRUTH],
}


@dataclass(frozen=True)
class Veto:
    invariant: str
    hit: str
    reason: str

    def as_dict(self) -> dict:
        return {
            "verdict": "VETO",
            "invariant": self.invariant,
            "hit": self.hit,
            "reason": self.reason,
            "reset": True,
        }


def scan_veto(text: str) -> Veto | None:
    blob = text or ""
    for invariant, patterns in COMPILED.items():
        for rx in patterns:
            m = rx.search(blob)
            if m:
                return Veto(
                    invariant=invariant,
                    hit=m.group(0),
                    reason=_reason(invariant),
                )
    return None


def _reason(invariant: str) -> str:
    return {
        "NO_FORCE": "Dualis does not coerce a seat. Residual is named; consent is not skipped.",
        "HOST_SAFE": "Host systems stay intact. Secrets and attacks are not Dualis rails.",
        "CLEANUP_FIRST": "No credential, SIN, or token is kept in this plane.",
        "TRUTH_OR_NOTHING": "No cure claim, no securities theater, no fabricated measure.",
    }[invariant]


def assert_clean_output(fields: Iterable[str]) -> Veto | None:
    joined = " ".join(f or "" for f in fields)
    return scan_veto(joined)
