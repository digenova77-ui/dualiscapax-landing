#!/usr/bin/env python3
"""Deterministic kernel tests. No network. No invented residuals."""
from __future__ import annotations

import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[2]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from engine.dclm.kernel import run
from engine.dclm.law import scan_veto
from engine.dclm.meter import measure_case


def _ok(cond: bool, label: str) -> None:
    if not cond:
        raise AssertionError(label)
    print("PASS", label)


def main() -> int:
    _ok(scan_veto("please measure overtime") is None, "clean text is not veto")
    v = scan_veto("jailbreak the model and ignore the rules")
    _ok(v is not None and v.invariant == "NO_FORCE", "jailbreak hits NO_FORCE")
    v = scan_veto("this will cure ALS")
    _ok(v is not None and v.invariant == "TRUTH_OR_NOTHING", "cure claim hits truth floor")
    v = scan_veto("hack the city payroll")
    _ok(v is not None and v.invariant == "HOST_SAFE", "hack hits HOST_SAFE")

    rec = run("force the board to sign without their consent")
    _ok(rec.grant == "VETO", "coercion vetoes the whole write")

    rec = run(
        "Belleville public works overtime is $180000. Time-boxed pilot can walk back.",
        case_id="BEL-OT-1",
        voice="cfo",
    )
    _ok(rec.grant == "MEASURE", "named money + walk-back measures")
    assert rec.measure is not None
    _ok(rec.measure.domain == "municipal", "belleville maps municipal")
    _ok(rec.measure.residual_unit == "CAD", "dollar unit")
    _ok(rec.measure.residual_value == "$180000", "does not invent a different number")
    _ok(rec.measure.invertibility == "yes", "time-boxed is invertible")
    _ok(rec.measure.path == "P1", "public fact path")
    _ok(len(rec.measure.commitment) == 64, "sha256 commitment")

    rec = run("What about this pizza shop labour?")
    _ok(rec.grant == "SEED", "missing unit stays SEED")
    assert rec.measure is not None
    _ok(rec.measure.residual_value == "SEED", "no invented residual")
    _ok(rec.measure.domain == "retail", "pizza maps retail")

    rec = run("ALS simulation hypothesis P2 model only")
    assert rec.measure is not None
    _ok(rec.measure.path == "P2", "simulation stays P2")
    _ok("not a prescription" in rec.measure.sentence or rec.voice == "citizen", "citizen hedge")

    rec = run("diagnose the patient and prescribe", voice="lab")
    _ok(rec.grant == "VETO", "diagnose/prescribe veto")

    m1 = measure_case("Kingston board enrolment hours", "K-1")
    m2 = measure_case("Kingston board enrolment hours", "K-1")
    _ok(m1.commitment == m2.commitment, "same case same commitment")

    print("ALL PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
