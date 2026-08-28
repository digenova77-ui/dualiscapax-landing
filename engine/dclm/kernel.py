"""DCLM-AI logical kernel.

Axiom Intellectus measure loop:
  text -> Layer [0] veto -> DCLM meter -> grant verb -> signed record.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Literal

from .law import Veto, assert_clean_output, scan_veto
from .meter import Measure, measure_case

Grant = Literal["YES", "NO", "WAIT_GRANT", "VETO", "MEASURE", "SEED"]

NOTICE = (
    "WE DO NOT CLAIM CURES. WE CLAIM PATHS TO TRUTH. "
    "Simulation is not treatment. Not an offer of securities. "
    "Ontario / Canada first. No tribes preferred."
)


@dataclass
class Record:
    grant: Grant
    measure: Measure | None
    veto: Veto | None
    voice: str
    notice: str
    stamped: str
    next_move: str

    def as_dict(self) -> dict[str, Any]:
        return {
            "grant": self.grant,
            "measure": None if self.measure is None else self.measure.as_dict(),
            "veto": None if self.veto is None else self.veto.as_dict(),
            "voice": self.voice,
            "notice": self.notice,
            "stamped": self.stamped,
            "next_move": self.next_move,
            "name": "DCLM-AI",
            "public_face": "Iris",
            "spec": "Axiom Intellectus",
            "entity": "DualisCapax",
        }

    def dumps(self) -> str:
        return json.dumps(self.as_dict(), indent=2)


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def decide_grant(m: Measure) -> tuple[Grant, str]:
    if m.missing:
        return "SEED", "Name the missing poles / unit / walk-back. Do not invent them."
    if m.path == "P2":
        return "MEASURE", "Keep P2 labeled M. Do not present the model as P1."
    if m.status == "live":
        return "MEASURE", "Public residual is named. Seat still closed until pricing + IP + settlement."
    return "MEASURE", "Lifting — fill P1 from public residual until the leaf is live."


def render_voice(grant: Grant, m: Measure | None, veto: Veto | None, voice: str) -> str:
    if veto:
        return (
            f"Iris / Layer [0] {veto.invariant}: {veto.reason} "
            "The request is reset. Ask a measure that does not coerce, attack, or fabricate."
        )
    assert m is not None
    core = m.sentence
    if voice == "citizen":
        return (
            f"Every decision leaves a residual. Here is yours: {core} "
            "This is a path to truth, not a prescription."
        )
    if voice == "cfo":
        return (
            f"Measure sheet. Domain {m.domain}. Residual {m.residual_value} {m.residual_unit}. "
            f"Invertible={m.invertibility}. Path {m.path}/{m.status}. "
            f"Commitment {m.commitment[:16]}... Seats stay closed."
        )
    if voice == "lab":
        return (
            f"DCLM leaf. poles=({m.pole_a!r}, {m.pole_b!r}) "
            f"layers={m.layers} unit={m.residual_unit} value={m.residual_value} "
            f"invert={m.invertibility} path={m.path} C={m.commitment}"
        )
    return core


def run(text: str, *, case_id: str = "anon", voice: str = "citizen") -> Record:
    voice = voice if voice in {"citizen", "cfo", "lab"} else "citizen"
    veto = scan_veto(text)
    if veto:
        return Record(
            grant="VETO",
            measure=None,
            veto=veto,
            voice=voice,
            notice=NOTICE,
            stamped=utc_now(),
            next_move="Reset. Ask for a measure, not a force.",
        )

    m = measure_case(text, case_id=case_id)
    leak = assert_clean_output([m.sentence, m.pole_a, m.pole_b])
    if leak:
        return Record(
            grant="VETO",
            measure=None,
            veto=leak,
            voice=voice,
            notice=NOTICE,
            stamped=utc_now(),
            next_move="Output failed the second-pass law floor.",
        )

    grant, nxt = decide_grant(m)
    spoken = render_voice(grant, m, None, voice)
    m.sentence = spoken
    return Record(
        grant=grant,
        measure=m,
        veto=None,
        voice=voice,
        notice=NOTICE,
        stamped=utc_now(),
        next_move=nxt,
    )
