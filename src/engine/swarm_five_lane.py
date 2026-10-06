"""
DualisCapax five-minute swarm lanes.
Document: ED-OPS-20261006-SWARM-FIVE-V1
Cue law: ED-OPS-20261006-CUE-REFILL-V1
Invariants: NO_FORCE, HOST_SAFE, CLEANUP_FIRST, TRUTH_OR_NOTHING

Jobs, tasks, and cues refill. A lane does not exit on an empty cue.
Live actuators stay false. Does not publish the lander.
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
FLOOR = {
    "iris-core": 12,
    "iris-biomed": 12,
    "iris-treasury": 12,
    "adversarial": 4,
    "sectors": 7,
    "seal": 4,
}
ATTACKS = (
    "stampede",
    "lease_recovery",
    "poison_payload",
    "circuit_breaker",
)
SECTOR_NAMES = (
    "SEC-01-hockey",
    "SEC-02-04-municipal",
    "SEC-05-hospitality",
    "SEC-09-anchor-encode",
    "SEC-09-t2-draft",
    "SEC-09-paper-trading",
    "UNITY-mesh-stub",
)


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _cue_path(lane: str) -> Path:
    path = ROOT / "ledgers" / "cue"
    path.mkdir(parents=True, exist_ok=True)
    return path / f"{lane}.json"


def _out(lane: str) -> Path:
    path = ROOT / "ledgers" / "five" / lane
    path.mkdir(parents=True, exist_ok=True)
    return path


def load_cue(lane: str) -> dict:
    path = _cue_path(lane)
    if path.is_file():
        doc = json.loads(path.read_text())
    else:
        doc = {"lane": lane, "pending": []}
    doc["pending"] = [row for row in doc.get("pending") or [] if row.get("status", "PENDING") == "PENDING"]
    doc["floor"] = FLOOR[lane]
    doc["live_actuators"] = False
    return doc


def _task(lane: str, kind: str, seq: int) -> dict:
    sector = SECTOR_ROTATION[datetime.now(timezone.utc).hour % len(SECTOR_ROTATION)]
    stamp = datetime.now(timezone.utc).strftime("%H%M%S")
    return {
        "task_id": f"{sector['id']}-{lane}-{stamp}-{seq:04d}",
        "task_type": sector["task_type"] if kind == "agent" else kind,
        "kind": kind,
        "status": "PENDING",
        "enqueued_at": _now(),
        "payload": {
            "sector": sector["name"],
            "domain": sector["domain"],
            "lane": lane,
            "q": 1.0,
            "p": 0.5,
        },
    }


def refill(doc: dict) -> dict:
    lane = doc["lane"]
    floor = FLOOR[lane]
    pending = doc["pending"]
    seq = len(pending) + 1
    while len(pending) < floor:
        if lane in LANES:
            pending.append(_task(lane, "agent", seq))
        elif lane == "adversarial":
            name = ATTACKS[(seq - 1) % len(ATTACKS)]
            row = _task(lane, "adversarial", seq)
            row["payload"]["attack"] = name
            pending.append(row)
        elif lane == "sectors":
            row = _task(lane, "sector", seq)
            row["payload"]["agent"] = SECTOR_NAMES[(seq - 1) % len(SECTOR_NAMES)]
            pending.append(row)
        else:
            row = _task(lane, "seal", seq)
            row["payload"]["check"] = "actuator_floor"
            pending.append(row)
        seq += 1
    doc["pending"] = pending[: floor * 2]
    doc["refilled_at"] = _now()
    doc["pending_count"] = len(doc["pending"])
    doc["live_actuators"] = False
    doc["cra_send"] = False
    doc["target"] = "STUB"
    if doc["pending_count"] < floor:
        raise SystemExit(f"REFUSE {lane} cue below floor")
    return doc


def save_cue(doc: dict) -> None:
    doc = refill(doc)
    _cue_path(doc["lane"]).write_text(json.dumps(doc, indent=2) + "\n")
    print(json.dumps({
        "lane": doc["lane"],
        "pending": doc["pending_count"],
        "floor": doc["floor"],
        "live_actuators": False,
    }))


def refill_all() -> None:
    for lane in list(LANES) + ["adversarial", "sectors", "seal"]:
        save_cue(load_cue(lane))


def _write(lane: str, doc: dict) -> None:
    doc["live_actuators"] = False
    doc["cra_send"] = False
    doc["target"] = "STUB"
    (_out(lane) / "LATEST.json").write_text(json.dumps(doc, indent=2) + "\n")


def run_agent(lane: str) -> None:
    name = LANES[lane]
    cue = refill(load_cue(lane))
    budget = time.time() + int(os.environ.get("CUE_BUDGET_SECONDS", "45"))
    completed = 0
    broker = SwarmTaskBroker(":memory:")
    kernel = SovereignConservationKernel()
    take = cue["pending"][:8]
    cue["pending"] = cue["pending"][8:]
    for row in take:
        broker.insert_task(row["task_id"], row["task_type"], row["payload"])
    worker = AutonomousWorkerAgent(name, broker, kernel)
    worker.start()
    while time.time() < budget:
        if broker.get_stats().get("COMPLETED", 0) >= len(take):
            break
        time.sleep(0.01)
    worker.running = False
    worker.join(timeout=5)
    completed = broker.get_stats().get("COMPLETED", 0)
    unfinished = take[completed:]
    for row in unfinished:
        row["status"] = "PENDING"
    cue["pending"] = unfinished + cue["pending"]
    epoch = broker.flush_epoch_docket(base_dir=str(_out(lane)))
    save_cue(cue)
    _write(lane, {
        "kind": "five_minute_lane",
        "timestamp_utc": _now(),
        "lane": lane,
        "agent": name,
        "status": "REFILLED",
        "completed_count": completed,
        "pending_count": load_cue(lane)["pending_count"],
        "epoch_root_hash": epoch.get("epoch_root_hash"),
        "note": "cue refilled; not waiting empty",
    })


def run_adversarial() -> None:
    import test_adversarial_swarm_attack as adv

    cue = refill(load_cue("adversarial"))
    ran = [row.get("payload", {}).get("attack") for row in cue["pending"][:4]]
    cue["pending"] = cue["pending"][4:]
    adv.test_attack_1_stampede_race_condition()
    adv.test_attack_2_worker_sudden_death_and_lease_recovery()
    adv.test_attack_3_hostile_sql_injection_and_poison_payload()
    adv.test_attack_4_invariant_circuit_breaker_trip()
    save_cue(cue)
    _write("adversarial", {
        "kind": "five_minute_lane",
        "timestamp_utc": _now(),
        "lane": "adversarial",
        "agent": "Iris-Gate",
        "status": "REFILLED",
        "ran": ran,
        "pending_count": load_cue("adversarial")["pending_count"],
    })


def run_sectors() -> None:
    os.environ["DUALIS_TARGET"] = "STUB"
    from sector_autonomy_agents import run_epoch

    cue = refill(load_cue("sectors"))
    cue["pending"] = cue["pending"][1:]
    docket = run_epoch(str(_out("sectors")))
    if docket.get("live_actuators") is not False:
        raise SystemExit("REFUSE sector live_actuators")
    bad = [a["agent"] for a in docket.get("agents", []) if a.get("live_actuator") is not False]
    if bad:
        raise SystemExit(f"REFUSE live actuator on {bad}")
    save_cue(cue)


def run_seal() -> None:
    five = ROOT / "ledgers" / "five"
    cue = refill(load_cue("seal"))
    cue["pending"] = cue["pending"][1:]
    lanes = {}
    for path in sorted(five.glob("*/LATEST.json")):
        if path.parent.name == "seal":
            continue
        lanes[path.parent.name] = json.loads(path.read_text())
    leaked = [name for name, doc in lanes.items() if doc.get("live_actuators") is not False]
    if leaked:
        raise SystemExit(f"REFUSE seal leak {leaked}")
    save_cue(cue)
    _write("seal", {
        "kind": "five_minute_seal",
        "timestamp_utc": _now(),
        "lane": "seal",
        "status": "REFILLED",
        "lanes_seen": sorted(lanes),
        "pending_count": load_cue("seal")["pending_count"],
        "note": "actuator floor held; cue refilled",
    })


def main() -> None:
    if os.environ.get("LIVE_ACTUATORS", "false") != "false":
        raise SystemExit("REFUSE LIVE_ACTUATORS")
    lane = os.environ.get("SWARM_LANE", "").strip()
    if lane == "refill-all":
        refill_all()
        return
    if lane not in FLOOR:
        raise SystemExit(f"DROPPED unknown lane {lane!r}")
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
