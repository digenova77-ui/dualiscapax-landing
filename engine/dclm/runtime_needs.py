"""Need-class tags for residual end-runtime.

Maps a person's stated need to poles / unit hints for the measure loop.
Does not invent numbers. Does not open settlement. Does not track location
without an explicit locale token in the text.

Current as of: 2026-08-30
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

NeedClass = Literal["cost", "schedule", "location", "plant", "lab", "other"]


@dataclass(frozen=True)
class NeedHint:
    need_class: NeedClass
    pole_a_hint: str
    pole_b_hint: str
    residual_unit_hint: str
    invert_door: str
    notes: str


NEEDS: dict[NeedClass, NeedHint] = {
    "cost": NeedHint(
        need_class="cost",
        pole_a_hint="named waste / leak spend",
        pole_b_hint="recoverable residual",
        residual_unit_hint="CAD",
        invert_door="Cut the named leak or keep paying it.",
        notes="Numbers only if present in the ask; else SEED.",
    ),
    "schedule": NeedHint(
        need_class="schedule",
        pole_a_hint="friction / lost hours",
        pole_b_hint="protected focus hours",
        residual_unit_hint="h",
        invert_door="Drop one low-invert block.",
        notes="No calendar read without WAIT_GRANT connector.",
    ),
    "location": NeedHint(
        need_class="location",
        pole_a_hint="place waste (strokes, delay, deadhead)",
        pole_b_hint="place residual (GIR, on-time, short path)",
        residual_unit_hint="stroke|min|km",
        invert_door="One place measure; not a professional guarantee.",
        notes="Locale only if the person supplies it. No silent GPS.",
    ),
    "plant": NeedHint(
        need_class="plant",
        pole_a_hint="scrap / downtime",
        pole_b_hint="units recovered",
        residual_unit_hint="unit",
        invert_door="Time-boxed pilot with walk-back.",
        notes="Industrial measure; not a safety system.",
    ),
    "lab": NeedHint(
        need_class="lab",
        pole_a_hint="protocol friction",
        pole_b_hint="reproducible residual",
        residual_unit_hint="run|sample",
        invert_door="Name poles before scale.",
        notes="Not medical treatment.",
    ),
    "other": NeedHint(
        need_class="other",
        pole_a_hint="unnamed waste",
        pole_b_hint="unnamed residual",
        residual_unit_hint="unknown",
        invert_door="Name poles, unit, invertibility — or stay SEED.",
        notes="Default when the ask cannot be classified.",
    ),
}


_KEYWORDS: list[tuple[NeedClass, tuple[str, ...]]] = [
    ("cost", ("cost", "overtime", "waste", "bill", "leak", "cad", "dollar", "$", "budget")),
    ("schedule", ("schedule", "calendar", "today", "plan", "hours", "focus", "day")),
    ("location", ("golf", "course", "hole", "yardage", "map", "location", "place", "gps")),
    ("plant", ("plant", "line", "scrap", "downtime", "plc", "factory")),
    ("lab", ("lab", "protocol", "sample", "assay", "experiment")),
]


def classify_need(text: str) -> NeedHint:
    t = (text or "").lower()
    for need_class, keys in _KEYWORDS:
        if any(k in t for k in keys):
            return NEEDS[need_class]
    return NEEDS["other"]


def need_prompt_prefix(text: str) -> str:
    """Optional prefix for lab voice — does not invent poles."""
    h = classify_need(text)
    return (
        f"[need={h.need_class} unit_hint={h.residual_unit_hint} "
        f"door={h.invert_door!r}] "
    )
