"""
DualisCapax: Sector autonomy agents (simulation)
Document: ED-SYS-20260911-AGENTS-V1
Invariants: NO_FORCE, HOST_SAFE, CLEANUP_FIRST, TRUTH_OR_NOTHING

Runs every landed session engine once per epoch.
Writes receipts. Does not broadcast chain, file T2, trade live,
touch municipal SCADA, or treat an athlete.
"""
from __future__ import annotations

import json
import os
import sys
import time
import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, List

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)
sys.path.insert(0, os.path.join(ROOT, "biophysical"))
sys.path.insert(0, os.path.join(ROOT, "municipal"))
sys.path.insert(0, os.path.join(ROOT, "commercial"))
sys.path.insert(0, os.path.join(ROOT, "crypto"))
sys.path.insert(0, os.path.join(ROOT, "tax"))
sys.path.insert(0, os.path.join(ROOT, "trading"))
sys.path.insert(0, os.path.join(ROOT, "unity"))


def _safe(name: str, fn) -> Dict[str, Any]:
    t0 = time.perf_counter()
    try:
        payload = fn()
        status = "SIMULATION_OK"
        err = None
    except Exception as exc:
        payload = {}
        status = "SIMULATION_FAIL_CLOSED"
        err = f"{type(exc).__name__}: {exc}"
    return {
        "agent": name,
        "status": status,
        "error": err,
        "live_actuator": False,
        "latency_ms": round((time.perf_counter() - t0) * 1000.0, 3),
        "payload": payload,
    }


def _hockey() -> Dict[str, Any]:
    from hockey_performance_manifold import HockeyKinematicManifold
    m = HockeyKinematicManifold(athlete_id="ATHLETE-PLACEHOLDER", position="F")
    row = m.evaluate_game_shift_kinematics(
        shift_duration_seconds=42.0,
        peak_skating_velocity_kmh=34.2,
        acceleration_bursts_count=5,
        heart_rate_peak_bpm=188,
        heart_rate_rest_bpm=135,
        mean_skating_velocity_kmh=16.5,
        bench_seconds=91.0,
    )
    return {
        "pcr_after_bench": row.get("pcr", {}).get("pcr_frac_after_bench"),
        "seconds_to_80": row.get("pcr", {}).get("seconds_to_pcr_target"),
        "flag": row.get("readiness_status"),
        "tape": row.get("claim_floor", {}).get("quinte_tape_present", False),
        "receipt": row.get("proof_receipt"),
    }


def _municipal() -> Dict[str, Any]:
    from hpedsb_municipal_optimizer import MunicipalHPEDSBOptimizer
    res = MunicipalHPEDSBOptimizer().optimize_transport_and_scada()
    return {
        "total_model_cad": res.get("total_annual_taxpayer_savings_cad"),
        "receipt": res.get("audit_receipt_hash"),
        "signed_board_book": False,
    }


def _hospitality() -> Dict[str, Any]:
    from local_business_friction_audit import LocalBusinessFrictionAuditor
    report = LocalBusinessFrictionAuditor(
        "Tomasso's Italian Grill & Jim's Pizzeria Pilot", 850000.0
    ).audit_operational_friction(
        pos_transactions_annual=42000,
        payment_processing_fee_pct=2.85,
        refrigeration_units_count=5,
        annual_energy_utility_cad=28000.0,
        food_waste_spoilage_pct=3.8,
        labor_payroll_annual_cad=260000.0,
    )
    return {
        "friction_cad": report["addressable_friction_breakdown_cad"]["total_annual_friction_cad"],
        "year1_client_keep_cad": report["fiduciary_terms"]["year_1_client_retained_savings_cad"],
        "signed_msa": False,
        "receipt": report.get("audit_proof_receipt"),
    }


def _anchor() -> Dict[str, Any]:
    from sovereign_anchors import MultiChainSovereignAnchor
    latest = os.path.join(ROOT, "ledgers", "LATEST.json")
    epoch_hash = "0c5f5297c1abb52e3dc10032d756e441eb36c42b637b818136753beb5bcd0041"
    completed = 50
    if os.path.isfile(latest):
        with open(latest) as f:
            doc = json.load(f)
        epoch_hash = doc.get("epoch_root_hash", epoch_hash)
        completed = int(doc.get("completed_count", completed))
    res = MultiChainSovereignAnchor().compile_multi_chain_payloads(epoch_hash, completed)
    return {
        "epoch_root_hash": res["epoch_root_hash"],
        "btc_status": res["bitcoin_taproot"]["status"],
        "evm_status": res["ethereum_evm"]["status"],
        "sol_status": res["solana_poh"]["status"],
        "broadcast": False,
    }


def _tax() -> Dict[str, Any]:
    path = os.path.join(ROOT, "tax", "T2_DRAFT_RETURN.json")
    if not os.path.isfile(path):
        return {"present": False}
    with open(path) as f:
        doc = json.load(f)
    return {
        "present": True,
        "cra_send": False,
        "keys": list(doc.keys())[:12],
    }


def _trading() -> Dict[str, Any]:
    try:
        from trading_manifold_engine import TradingManifoldEngine
        eng = TradingManifoldEngine()
        if hasattr(eng, "run_paper"):
            out = eng.run_paper()
        elif hasattr(eng, "evaluate"):
            out = eng.evaluate()
        else:
            out = {"class": type(eng).__name__, "paper_only": True}
        return {"paper_only": True, "live_order": False, "out_type": type(out).__name__}
    except Exception as exc:
        return {"paper_only": True, "live_order": False, "note": str(exc)[:160]}


def _unity() -> Dict[str, Any]:
    return {
        "orchestrator_present": os.path.isfile(os.path.join(ROOT, "unity", "unity_mesh_orchestrator.py")),
        "live_vendor_calls": False,
        "note": "unity_mesh.yml stays issue/dispatch; this tick does not spend API keys",
    }


def run_epoch(out_dir: str) -> Dict[str, Any]:
    agents = [
        _safe("SEC-01-hockey", _hockey),
        _safe("SEC-02-04-municipal", _municipal),
        _safe("SEC-05-hospitality", _hospitality),
        _safe("SEC-09-anchor-encode", _anchor),
        _safe("SEC-09-t2-draft", _tax),
        _safe("SEC-09-paper-trading", _trading),
        _safe("UNITY-mesh-stub", _unity),
    ]
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    blob = json.dumps(agents, sort_keys=True, default=str)
    root = hashlib.sha256(blob.encode()).hexdigest()
    docket = {
        "timestamp_utc": now,
        "agent_root_hash": root,
        "live_actuators": False,
        "agents": agents,
    }
    os.makedirs(out_dir, exist_ok=True)
    latest = os.path.join(out_dir, "LATEST.json")
    with open(latest, "w") as f:
        json.dump(docket, f, indent=2)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    with open(os.path.join(out_dir, f"epoch-{stamp}.json"), "w") as f:
        json.dump(docket, f, indent=2)
    return docket


def main() -> None:
    out = os.environ.get("SWARM_AGENT_DIR", os.path.join(ROOT, "ledgers", "agents"))
    docket = run_epoch(out)
    print("=== DUALISCAPAX SECTOR AUTONOMY AGENTS ===")
    print(f"root={docket['agent_root_hash'][:16]} live_actuators={docket['live_actuators']}")
    for a in docket["agents"]:
        print(f"  {a['agent']}: {a['status']}")


if __name__ == "__main__":
    main()
