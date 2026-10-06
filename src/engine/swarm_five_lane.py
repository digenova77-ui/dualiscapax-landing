"""
DualisCapax five-minute swarm lanes.
Document: ED-OPS-20261006-SWARM-FIVE-V1
Invariants: NO_FORCE, HOST_SAFE, CLEANUP_FIRST, TRUTH_OR_NOTHING

One lane per tick. Live actuators stay false.
Does not publish the lander, broadcast, file T2, or trade live.
"""
from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from agent_swarm_runner import (  # noqa: E402
    SECTOR_ROTATION,
    AutonomousWorkerAgent,
    SwarmTaskBroker,
)
from dclm_singularity_kernel import SovereignConservationKernel  # noqa: E402

LANES = {
    "iris-core": "Iris-Core",
    "iris-biomed": "Iris-BioMed",
    "iris-treasury": "Iris-Treasury",
}


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _out(lane: str) -> Path:
    path = ROOT / "ledgers" / "five" / lane
    path.mkdir(parents=True, exist_ok=True)
    return path


def _write(lane: str, doc: dict) -> None:
    doc["live_actuators"] = False
    doc["cra_send"] = False
    doc["target"] = "STUB"
    (_out(lane) / "LATEST.json").write_text(json.dumps(doc, indent=2) + "\n")
    print(json.dumps({"lane": lane, "status": doc.get("status"), "live_actuators": False}))


def run_agent(lane: str) -> None:
    name = LANES[lane]
    broker = SwarmTaskBroker(":memory:")
    kernel = SovereignConservationKernel()
    sector = SECTOR_ROTATION[datetime.now(timezone.utc).hour % len(SECTOR_ROTATION)]
    for i in range(1, 10):
        broker.insert_task(
            f"{sector['id']}-{lane}-{i:02d}",
            sector["task_type"],
            {
                "sector": sector["name"],
                "domain": sector["domain"],
                "q": 1.0 + (i % 5) * 0.01,
                "p": 0.5,
                "lane": lane,
            },
        )
    worker = AutonomousWorkerAgent(name, broker, kernel)
    worker.start()
    deadline = time.time() + 25
    while time.time() < deadline:
        if broker.get_stats().get("COMPLETED", 0) >= 9:
            break
        time.sleep(0.01)
    worker.running = False
    worker.join(timeout=5)
    completed = broker.get_stats().get("COMPLETED", 0)
    epoch = broker.flush_epoch_docket(base_dir=str(_out(lane)))
    _write(lane, {
        "kind": "five_minute_lane",
        "timestamp_utc": _now(),
        "lane": lane,
        "agent": name,
        "sector": sector["id"],
        "sector_name": sector["name"],
        "status": "COMPLETED" if completed >= 9 else "FAIL_CLOSED",
        "completed_count": completed,
        "epoch_root_hash": epoch.get("epoch_root_hash"),
    })
    if completed < 9:
        raise SystemExit(f"REFUSE {lane} completed {completed}/9")


def run_adversarial() -> None:
    import test_adversarial_swarm_attack as adv

    adv.test_attack_1_stampede_race_condition()
    adv.test_attack_2_worker_sudden_death_and_lease_recovery()
    adv.test_attack_3_hostile_sql_injection_and_poison_payload()
    adv.test_attack_4_invariant_circuit_breaker_trip()
    _write("adversarial", {
        "kind": "five_minute_lane",
        "timestamp_utc": _now(),
        "lane": "adversarial",
        "agent": "Iris-Gate",
        "status": "4_OF_4_DEFEATED",
    })


def run_sectors() -> None:
    os.environ["DUALIS_TARGET"] = "STUB"
    from sector_autonomy_agents import run_epoch

    docket = run_epoch(str(_out("sectors")))
    if docket.get("live_actuators") is not False:
        raise SystemExit("REFUSE sector live_actuators")
    bad = [a["agent"] for a in docket.get("agents", []) if a.get("live_actuator") is not False]
    if bad:
        raise SystemExit(f"REFUSE live actuator on {bad}")
    print(json.dumps({"lane": "sectors", "status": "SIMULATION", "live_actuators": False}))


def run_seal() -> None:
    five = ROOT / "ledgers" / "five"
    lanes = {}
    for path in sorted(five.glob("*/LATEST.json")):
        if path.parent.name == "seal":
            continue
        lanes[path.parent.name] = json.loads(path.read_text())
    leaked = [name for name, doc in lanes.items() if doc.get("live_actuators") is not False]
    if leaked:
        raise SystemExit(f"REFUSE seal leak {leaked}")
    _write("seal", {
        "kind": "five_minute_seal",
        "timestamp_utc": _now(),
        "lane": "seal",
        "status": "HELD",
        "lanes_seen": sorted(lanes),
        "note": "actuator floor held; not a lander publish",
    })


def main() -> None:
    lane = os.environ.get("SWARM_LANE", "").strip()
    if lane not in {"iris-core", "iris-biomed", "iris-treasury", "adversarial", "sectors", "seal"}:
        raise SystemExit(f"DROPPED unknown lane {lane!r}")
    if os.environ.get("LIVE_ACTUATORS", "false") != "false":
        raise SystemExit("REFUSE LIVE_ACTUATORS")
    if lane in LANES:
        run_agent(lane)
    elif lane == "adversarial":
        run_adversarial()
    elif lane == "sectors":
        run_sectors()
    else:
        run_seal()


if __name__ == "__main__":
    main()
