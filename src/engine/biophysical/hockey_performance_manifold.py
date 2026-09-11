"""
DualisCapax: Biophysical Athletic Performance Manifold (SEC-01) V2
Document Control ID: ED-BIO-20260911-HOCKEY-LOOP-V2
Invariants: NO_FORCE, HOST_SAFE, CLEANUP_FIRST, TRUTH_OR_NOTHING

Closes model holes in the U16AAA knowledge loop:
  burst → shift → bench (two-lobe PCr) → period/game (glycogen)
Position priors (F/D), optional LT fraction as PCr-rate covariate,
maturity band as a prior — never a named minor.

Every numeric default is a LITERATURE_PRIOR or HOUSE_KNOB.
No Quinte tape, no athlete PII, not a training prescription.
"""
from __future__ import annotations

import hashlib
import math
import time
from typing import Any, Dict, List, Literal, Optional

Position = Literal["F", "D", "G"]
MaturityBand = Literal["PRE_PHV", "MID_PHV", "POST_PHV", "UNSPECIFIED"]
EvidenceClass = Literal["LITERATURE_PRIOR", "HOUSE_KNOB", "MEASURED_TAPE", "ABSENT"]

LN2 = math.log(2)
T_HALF_FAST_S = 22.0
T_HALF_SLOW_S = 170.0

# Literature-shaped position priors (not a Quinte roster).
POSITION_PRIOR = {
    "F": {
        "shift_s": 42.0,
        "bench_s": 90.0,
        "shifts_per_period": 7,
        "bursts_per_shift": 6,
        "peak_kmh": 32.0,
        "mean_kmh": 16.5,
        "toi_min_per_period": 5.0,
        "high_intensity_share": 0.54,
    },
    "D": {
        "shift_s": 48.0,
        "bench_s": 110.0,
        "shifts_per_period": 8,
        "bursts_per_shift": 5,
        "peak_kmh": 28.0,
        "mean_kmh": 15.0,
        "toi_min_per_period": 6.5,
        "high_intensity_share": 0.40,
    },
    "G": {
        "shift_s": 1200.0,
        "bench_s": 0.0,
        "shifts_per_period": 1,
        "bursts_per_shift": 2,
        "peak_kmh": 12.0,
        "mean_kmh": 4.0,
        "toi_min_per_period": 20.0,
        "high_intensity_share": 0.10,
    },
}


def _pcr_remaining(t_s: float, a_fast: float, a_slow: float, tau_fast_s: float = T_HALF_FAST_S) -> float:
    """Fraction of RESTING PCr after t seconds of refill from a given hole."""
    hole = a_fast * math.exp(-LN2 * t_s / tau_fast_s) + a_slow * math.exp(-LN2 * t_s / T_HALF_SLOW_S)
    return max(0.0, min(1.0, 1.0 - hole))


def _seconds_to_target(a_fast: float, a_slow: float, target: float, tau_fast_s: float) -> float:
    lo, hi = 0.0, 900.0
    for _ in range(40):
        mid = 0.5 * (lo + hi)
        if _pcr_remaining(mid, a_fast, a_slow, tau_fast_s) >= target:
            hi = mid
        else:
            lo = mid
    return hi


class HockeyKinematicManifold:
    def __init__(
        self,
        athlete_id: str = "ATHLETE-PLACEHOLDER",
        position: Position = "F",
        maturity: MaturityBand = "UNSPECIFIED",
        lt_fraction_vo2: Optional[float] = None,
        evidence_class: EvidenceClass = "LITERATURE_PRIOR",
    ):
        self.athlete_id = athlete_id
        self.position = position
        self.maturity = maturity
        self.lt_fraction_vo2 = lt_fraction_vo2
        self.evidence_class = evidence_class
        self.pcr_frac = 1.0
        self.glycogen_frac = 1.0
        self.shift_index = 0
        self.period = 1
        self.history: List[Dict[str, Any]] = []

    def _tau_fast(self) -> float:
        tau = T_HALF_FAST_S
        if self.lt_fraction_vo2 is not None:
            # Higher LT fraction → faster fast-lobe. House scale around 0.70.
            tau = T_HALF_FAST_S * (0.70 / max(0.45, min(0.90, self.lt_fraction_vo2)))
        if self.maturity == "PRE_PHV":
            tau *= 1.08
        elif self.maturity == "POST_PHV":
            tau *= 0.96
        return tau

    def _depletion(self, shift_s: float, bursts: int) -> tuple[float, float]:
        raw = min(0.80, 0.10 * bursts + 0.006 * shift_s)
        raw *= 1.0 + 0.15 * (1.0 - self.glycogen_frac)
        a_fast = 0.62 * raw
        a_slow = 0.38 * raw
        return a_fast, a_slow

    def evaluate_game_shift_kinematics(
        self,
        shift_duration_seconds: float,
        peak_skating_velocity_kmh: float,
        acceleration_bursts_count: int,
        heart_rate_peak_bpm: int,
        heart_rate_rest_bpm: int,
        skate_hollow_radius_inch: float = 0.50,
        mean_skating_velocity_kmh: Optional[float] = None,
        bench_seconds: Optional[float] = None,
        recovery_mode: Literal["PASSIVE", "STAND_PACE"] = "PASSIVE",
        pcr_target: float = 0.80,
    ) -> Dict[str, Any]:
        t0 = time.perf_counter()
        prior = POSITION_PRIOR[self.position]
        mean_kmh = mean_skating_velocity_kmh if mean_skating_velocity_kmh is not None else prior["mean_kmh"]

        v_peak_ms = peak_skating_velocity_kmh / 3.6
        v_mean_ms = mean_kmh / 3.6
        p_peak = v_peak_ms * (1.0 + acceleration_bursts_count * 0.15)
        p_mean = v_mean_ms * (1.0 + acceleration_bursts_count * 0.08)
        q_strain = (shift_duration_seconds / 45.0) * (heart_rate_peak_bpm / 185.0)
        h_peak = 0.5 * p_peak ** 2 + 0.5 * 1.25 * q_strain ** 2
        h_mean = 0.5 * p_mean ** 2 + 0.5 * 1.25 * q_strain ** 2

        a_fast, a_slow = self._depletion(shift_duration_seconds, acceleration_bursts_count)
        # Enter the shift already carrying residual hole.
        residual_hole = max(0.0, 1.0 - self.pcr_frac)
        a_fast += 0.62 * residual_hole
        a_slow += 0.38 * residual_hole
        tau = self._tau_fast()

        pcr_gate_off = max(0.05, self.pcr_frac - (a_fast + a_slow) * 0.35)
        rest_for_target = _seconds_to_target(a_fast, a_slow, pcr_target, tau)

        bench = bench_seconds if bench_seconds is not None else prior["bench_s"]
        if recovery_mode == "STAND_PACE":
            # Literature: Q held up; PCr effect uncertain at hockey-shift scale.
            bench_effective = bench * 1.04
            recovery_note = "STAND_PACE holds cardiac output; PCr benefit UNCERTAIN at shift scale"
        else:
            bench_effective = bench
            recovery_note = "PASSIVE bench; 3 min > 2 min on speed in RSSA, HR is a bad PCr proxy"

        pcr_after_bench = _pcr_remaining(bench_effective, a_fast, a_slow, tau)
        self.pcr_frac = pcr_after_bench

        # Glycogen: slow leak per shift, larger for high-TOI / high-burst.
        leak = 0.012 * (shift_duration_seconds / 45.0) * (1.0 + 0.08 * acceleration_bursts_count)
        if self.position == "D":
            leak *= 1.15
        self.glycogen_frac = max(0.35, self.glycogen_frac - leak)

        hr_delta = max(10, heart_rate_peak_bpm - heart_rate_rest_bpm)
        recovery_coefficient = hr_delta / max(1.0, shift_duration_seconds)
        hr_heuristic_rest = shift_duration_seconds * (2.8 - min(1.0, recovery_coefficient * 0.5))

        self.shift_index += 1
        edge_fatigue_pct = min(100.0, shift_duration_seconds * 0.18 + acceleration_bursts_count * 0.45)

        if pcr_after_bench >= 0.80 and q_strain < 1.10:
            flag = "OPTIMAL_BURST"
        elif pcr_after_bench >= 0.70:
            flag = "PARTIAL_PCR_REFILL"
        else:
            flag = "FATIGUE_MANAGED"

        elapsed_us = (time.perf_counter() - t0) * 1e6
        receipt = hashlib.sha256(
            f"{self.athlete_id}::{self.position}::{self.shift_index}::{h_mean}::{pcr_after_bench}".encode()
        ).hexdigest()

        row = {
            "claim_floor": {
                "evidence_class": self.evidence_class,
                "simulation_is_not_treatment": True,
                "named_minor_pii": False,
                "quinte_tape_present": False,
            },
            "athlete_id": self.athlete_id,
            "position": self.position,
            "maturity_band": self.maturity,
            "shift_index": self.shift_index,
            "period": self.period,
            "shift_duration_seconds": shift_duration_seconds,
            "peak_kmh_input": peak_skating_velocity_kmh,
            "mean_kmh_used": mean_kmh,
            "peak_used_as_shift_mean": False,
            "kinematic_momentum_p_peak": round(p_peak, 3),
            "kinematic_momentum_p_mean": round(p_mean, 3),
            "momentum_units": "m/s * burst_gain (NOT kg·m/s; mass absent)",
            "neuromuscular_strain_q": round(q_strain, 3),
            "hamiltonian_h_peak": round(h_peak, 4),
            "hamiltonian_h_mean": round(h_mean, 4),
            "pcr": {
                "t_half_fast_s": round(tau, 2),
                "t_half_slow_s": T_HALF_SLOW_S,
                "lt_fraction_vo2": self.lt_fraction_vo2,
                "a_fast": round(a_fast, 4),
                "a_slow": round(a_slow, 4),
                "pcr_frac_gate_off_est": round(pcr_gate_off, 3),
                "pcr_frac_after_bench": round(pcr_after_bench, 3),
                "seconds_to_pcr_target": round(rest_for_target, 1),
                "pcr_target": pcr_target,
                "bench_seconds_applied": bench,
                "recovery_mode": recovery_mode,
                "recovery_note": recovery_note,
            },
            "glycogen_frac_est": round(self.glycogen_frac, 3),
            "heart_rate_recovery_coeff": round(recovery_coefficient, 3),
            "hr_heuristic_rest_s": round(hr_heuristic_rest, 1),
            "edge_fatigue_delta_pct": round(edge_fatigue_pct, 2),
            "readiness_status": flag,
            "proof_receipt": receipt,
            "latency_us": round(elapsed_us, 2),
        }
        self.history.append(row)
        return row

    def run_period(
        self,
        period: int = 1,
        measured_tape: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Simulate one period from position priors, or replay a consented tape.

        Tape fields if present: shift_s, peak_kmh, mean_kmh, bursts, hr_peak, hr_bench, bench_s.
        Absent tape → LITERATURE_PRIOR. Never invent a named player.
        """
        self.period = period
        prior = POSITION_PRIOR[self.position]
        n = prior["shifts_per_period"] if not measured_tape else len(measured_tape)
        rows = []
        evidence: EvidenceClass = "MEASURED_TAPE" if measured_tape else "LITERATURE_PRIOR"
        self.evidence_class = evidence

        for i in range(n):
            if measured_tape:
                t = measured_tape[i]
                row = self.evaluate_game_shift_kinematics(
                    shift_duration_seconds=float(t["shift_s"]),
                    peak_skating_velocity_kmh=float(t.get("peak_kmh", prior["peak_kmh"])),
                    acceleration_bursts_count=int(t.get("bursts", prior["bursts_per_shift"])),
                    heart_rate_peak_bpm=int(t.get("hr_peak", 188)),
                    heart_rate_rest_bpm=int(t.get("hr_bench", 135)),
                    mean_skating_velocity_kmh=t.get("mean_kmh"),
                    bench_seconds=t.get("bench_s", prior["bench_s"]),
                )
            else:
                row = self.evaluate_game_shift_kinematics(
                    shift_duration_seconds=prior["shift_s"],
                    peak_skating_velocity_kmh=prior["peak_kmh"],
                    acceleration_bursts_count=prior["bursts_per_shift"],
                    heart_rate_peak_bpm=188 if self.position != "G" else 160,
                    heart_rate_rest_bpm=135,
                    mean_skating_velocity_kmh=prior["mean_kmh"],
                    bench_seconds=prior["bench_s"],
                )
            rows.append(row)

        glycogen_end = self.glycogen_frac
        return {
            "period": period,
            "position": self.position,
            "evidence_class": evidence,
            "shifts": len(rows),
            "pcr_frac_end": round(self.pcr_frac, 3),
            "glycogen_frac_end": round(glycogen_end, 3),
            "glycogen_drop_vs_game_literature": {
                "model_period_drop": round(1.0 - glycogen_end, 3),
                "youth_game_mean_drop": 0.31,
                "high_toi_drop": 0.48,
                "restore_hours": 38,
                "note": "Model leak is per-shift house knob; 31/48% are full-game biopsy priors (U20), not this roster.",
            },
            "shifts_detail": rows,
        }


def compare_fd_priors() -> Dict[str, Any]:
    out = {}
    for pos in ("F", "D"):
        m = HockeyKinematicManifold(athlete_id="ATHLETE-PLACEHOLDER", position=pos)
        out[pos] = m.run_period(period=1)
        out[pos]["shifts_detail"] = [
            {
                "i": r["shift_index"],
                "pcr_after_bench": r["pcr"]["pcr_frac_after_bench"],
                "sec_to_80": r["pcr"]["seconds_to_pcr_target"],
                "glycogen": r["glycogen_frac_est"],
                "flag": r["readiness_status"],
            }
            for r in out[pos]["shifts_detail"]
        ]
    return out


if __name__ == "__main__":
    demo = HockeyKinematicManifold(position="F")
    one = demo.evaluate_game_shift_kinematics(
        shift_duration_seconds=42.0,
        peak_skating_velocity_kmh=34.2,
        acceleration_bursts_count=5,
        heart_rate_peak_bpm=188,
        heart_rate_rest_bpm=135,
        mean_skating_velocity_kmh=16.5,
        bench_seconds=91.0,
    )
    print("=== SEC-01 LOOP V2 SINGLE SHIFT (F, peak 34.2 labeled PEAK not mean) ===")
    print(f"H_mean={one['hamiltonian_h_mean']}  H_peak={one['hamiltonian_h_peak']}")
    print(f"PCr after 91s bench={one['pcr']['pcr_frac_after_bench']}  seconds_to_80%={one['pcr']['seconds_to_pcr_target']}")
    print(f"HR heuristic rest={one['hr_heuristic_rest_s']}s  flag={one['readiness_status']}")
    print(f"evidence={one['claim_floor']['evidence_class']} tape={one['claim_floor']['quinte_tape_present']}")
    print()
    cmp = compare_fd_priors()
    print("=== PERIOD 1 PRIORS F vs D ===")
    for pos, block in cmp.items():
        print(f"{pos}: shifts={block['shifts']} pcr_end={block['pcr_frac_end']} gly_end={block['glycogen_frac_end']}")
        print("   last3:", block["shifts_detail"][-3:])
