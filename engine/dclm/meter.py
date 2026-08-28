"""DCLM meter — two poles, five layers, residual unit, invertibility, dual path.

Numbers that were not given stay SEED. Never invent a residual.
"""
from __future__ import annotations

import hashlib
import json
import re
from dataclasses import asdict, dataclass, field
from typing import Literal

PathKind = Literal["P1", "P2"]
Invert = Literal["yes", "no", "unknown"]
Status = Literal["live", "lifting", "seed"]

DOMAINS = {
    "municipal": (
        "city", "municipality", "council", "tax", "budget", "works",
        "ontario", "belleville", "kingston", "quinte",
    ),
    "school_board": (
        "school", "board", "ldsb", "hpedsb", "student", "classroom",
        "trustee", "enrol",
    ),
    "retail": (
        "shop", "pizza", "restaurant", "store", "inventory", "pos",
        "tomasso", "vendor",
    ),
    "healthcare_research": (
        "als", "cancer", "clinic", "hospital", "patient", "oncology",
        "neuro", "trial",
    ),
    "general": (),
}

LAYER_HINTS = {
    "L1": ("input", "statute", "data", "ligand", "feed", "invoice"),
    "L2": ("workflow", "process", "cascade", "transduction", "shift"),
    "L3": ("policy", "interpret", "narrative", "story", "minutes"),
    "L4": ("decision", "execute", "hire", "cut", "award", "sign"),
    "L5": ("population", "board", "city", "loop", "institution"),
}


@dataclass
class Measure:
    case_id: str
    domain: str
    object_name: str
    pole_a: str
    pole_b: str
    layers: dict[str, str]
    residual_unit: str
    residual_value: str
    invertibility: Invert
    path: PathKind
    status: Status
    missing: list[str] = field(default_factory=list)
    sentence: str = ""
    commitment: str = ""

    def as_dict(self) -> dict:
        return asdict(self)


def detect_domain(text: str) -> str:
    s = (text or "").lower()
    scores = {k: sum(1 for w in words if w in s) for k, words in DOMAINS.items() if k != "general"}
    best = max(scores, key=scores.get) if scores else "general"
    return best if scores.get(best, 0) > 0 else "general"


def detect_layers(text: str) -> dict[str, str]:
    s = (text or "").lower()
    out: dict[str, str] = {}
    for layer, hints in LAYER_HINTS.items():
        hits = [h for h in hints if h in s]
        if hits:
            out[layer] = ",".join(hits)
    return out


def extract_unit(text: str) -> str:
    s = text or ""
    money = re.search(r"\$[\d,]+(?:\.\d+)?", s)
    if money:
        return "CAD"
    if re.search(r"\b(hour|hours|fte|shift)\b", s, re.I):
        return "hours"
    if re.search(r"\b(percent|%|bp|basis)\b", s, re.I):
        return "percent"
    return ""


def extract_value(text: str) -> str:
    money = re.search(r"\$[\d,]+(?:\.\d+)?", text or "")
    if money:
        return money.group(0)
    pct = re.search(r"\b\d+(?:\.\d+)?\s*%", text or "")
    if pct:
        return pct.group(0)
    return ""


def infer_invertibility(text: str) -> Invert:
    s = (text or "").lower()
    if any(w in s for w in ("irreversible", "cannot undo", "can't walk back", "permanent cut")):
        return "no"
    if any(w in s for w in ("can undo", "reversible", "walk back", "pilot", "time-boxed")):
        return "yes"
    return "unknown"


def infer_path(text: str) -> PathKind:
    s = (text or "").lower()
    if any(w in s for w in ("model only", "simulation", "p2", "hypothesis")):
        return "P2"
    return "P1"


def name_object(text: str) -> str:
    s = (text or "").strip()
    if not s:
        return "unnamed-object"
    first = re.split(r"[.?\n]", s, maxsplit=1)[0].strip()
    return first[:80] or "unnamed-object"


def measure_case(text: str, case_id: str = "anon") -> Measure:
    domain = detect_domain(text)
    unit = extract_unit(text)
    value = extract_value(text)
    invert = infer_invertibility(text)
    path = infer_path(text)
    layers = detect_layers(text)
    pole_a, pole_b = _poles(domain, text)
    missing: list[str] = []
    if not pole_a:
        missing.append("pole_a")
    if not pole_b:
        missing.append("pole_b")
    if not unit:
        missing.append("residual_unit")
    if invert == "unknown":
        missing.append("invertibility")

    if value and unit and not missing:
        status: Status = "live"
    elif pole_a and pole_b:
        status = "lifting"
    else:
        status = "seed"

    if path == "P2" and status == "live":
        status = "lifting"

    m = Measure(
        case_id=case_id,
        domain=domain,
        object_name=name_object(text),
        pole_a=pole_a,
        pole_b=pole_b,
        layers=layers,
        residual_unit=unit or "unnamed",
        residual_value=value or "SEED",
        invertibility=invert,
        path=path,
        status=status,
        missing=missing,
    )
    m.sentence = _sentence(m)
    m.commitment = commit(m)
    return m


def _poles(domain: str, text: str) -> tuple[str, str]:
    catalog = {
        "municipal": (
            "statute / asset / payroll inside the municipality",
            "province, taxpayers, vendors, weather, capital markets outside the object",
        ),
        "school_board": (
            "collective agreement / enrolment / classroom load inside the board",
            "ministry formula, community, bus contractors, capital outside the board",
        ),
        "retail": (
            "recipe / labour / inventory / POS inside the shop",
            "rent, delivery apps, commodity price, inspector outside the shop",
        ),
        "healthcare_research": (
            "published marker / trial protocol / genotype inside the leaf",
            "host, access, cost, regulator outside the leaf",
        ),
        "general": ("", ""),
    }
    a, b = catalog.get(domain, ("", ""))
    return a, b


def _sentence(m: Measure) -> str:
    if m.path == "P2":
        path_line = "P2 model only — not a public fact."
    else:
        path_line = "P1 public residual only."
    miss = f" Missing: {', '.join(m.missing)}." if m.missing else ""
    return (
        f"{m.domain} · {m.object_name}. "
        f"Pole A: {m.pole_a or 'SEED'}. Pole B: {m.pole_b or 'SEED'}. "
        f"Cost of being wrong: {m.residual_value} {m.residual_unit}. "
        f"Walk-back: {m.invertibility}. {path_line} Status {m.status}.{miss}"
    )


def commit(m: Measure) -> str:
    ctx = json.dumps(
        {
            "case_id": m.case_id,
            "domain": m.domain,
            "pole_a": m.pole_a,
            "pole_b": m.pole_b,
            "unit": m.residual_unit,
            "value": m.residual_value,
            "invert": m.invertibility,
            "path": m.path,
            "status": m.status,
        },
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(ctx.encode("utf-8")).hexdigest()
