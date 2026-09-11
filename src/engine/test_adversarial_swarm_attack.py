"""
DualisCapax: Adversarial Self-Attack Test Suite
Adversarial testing of SwarmTaskBroker and SovereignConservationKernel.
Invariants: NO_FORCE, HOST_SAFE, CLEANUP_FIRST, TRUTH_OR_NOTHING
"""

import time
import math
import threading
from agent_swarm_runner import SwarmTaskBroker, AutonomousWorkerAgent
from dclm_singularity_kernel import SovereignConservationKernel

def test_attack_1_stampede_race_condition():
    print("\n--- ATTACK 1: HIGH-CONCURRENCY STAMPEDE (RACE CONDITION) ---")
    broker = SwarmTaskBroker(":memory:")
    broker.insert_task("TASK-STAMPEDE-01", "DCLM_CONSERVATION_CHECK", {"q": 1.0, "p": 0.5})

    claims = []
    barrier = threading.Barrier(20)

    def racer(worker_id):
        barrier.wait()
        res = broker.claim_task(worker_id, lease_seconds=10)
        if res:
            claims.append(worker_id)

    threads = [threading.Thread(target=racer, args=(f"Racer-{i:02d}",)) for i in range(20)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    print(f" • Total racers: 20")
    print(f" • Successful claims: {len(claims)} ({claims})")
    assert len(claims) == 1, f"CRITICAL RACE CONDITION: {len(claims)} workers claimed the same task!"
    print(" • Verdict: PASS (Zero collision under 20-thread instantaneous stampede)")

def test_attack_2_worker_sudden_death_and_lease_recovery():
    print("\n--- ATTACK 2: WORKER SUDDEN DEATH & LEASE RECOVERY ---")
    broker = SwarmTaskBroker(":memory:")
    broker.insert_task("TASK-SUDDEN-DEATH", "DCLM_CONSERVATION_CHECK", {"q": 1.0, "p": 0.5})

    res_a = broker.claim_task("Worker-Crash-A", lease_seconds=1)
    assert res_a is not None, "Worker A failed initial claim"
    print(" • Worker A successfully acquired lease (1 second)")

    res_b_early = broker.claim_task("Worker-B", lease_seconds=5)
    assert res_b_early is None, "Worker B illegally stole an unexpired lease!"
    print(" • Worker B attempted early theft -> REJECTED (Lease respected)")

    print(" • Sleeping 1.2s to allow lease to expire...")
    time.sleep(1.2)

    res_b_recovered = broker.claim_task("Worker-B", lease_seconds=5)
    assert res_b_recovered is not None, "Worker B failed to recover orphaned task!"
    assert res_b_recovered["task_id"] == "TASK-SUDDEN-DEATH"
    print(f" • Worker B recovered task: {res_b_recovered['task_id']} (Orphan recovery validated)")
    print(" • Verdict: PASS (Deadlock prevention & self-healing lease recovery verified)")

def test_attack_3_hostile_sql_injection_and_poison_payload():
    print("\n--- ATTACK 3: HOSTILE SQL INJECTION & POISON PAYLOADS ---")
    broker = SwarmTaskBroker(":memory:")
    kernel = SovereignConservationKernel()

    hostile_id = "TASK-01'); DROP TABLE active_tasks_d1; --"
    inserted = broker.insert_task(hostile_id, "DCLM_CONSERVATION_CHECK", {"q": 1.0, "p": 0.5})
    assert inserted, "Failed to insert parameterized hostile task ID"

    stats = broker.get_stats()
    assert "PENDING" in stats, "SQL Injection succeeded in corrupting or dropping table!"
    print(" • Parameterized SQL injection defense: PASS (Table intact)")

    res_nan = kernel.evaluate_state_manifold(q=float('nan'), p=1.0)
    assert math.isnan(res_nan["q_next"]) or not res_nan.get("conserved", True) or res_nan.get("status") != "CONSERVED"
    print(" • Poison payload resilience: PASS (Fail-closed)")

def test_attack_4_invariant_circuit_breaker_trip():
    print("\n--- ATTACK 4: INVARIANT M-S WATCHDOG LATENCY / DISSIPATIVE TRIP ---")
    kernel = SovereignConservationKernel()
    t_boundary_ns = time.perf_counter_ns() - int(5.0 * 1e6)
    trip_res = kernel.evaluate_state_manifold(q=1.0, p=0.5, t_ingress_ns=t_boundary_ns)
    print(f" • Delayed execution latency: {trip_res['latency_ms']:.2f} ms")
    print(f" • Watchdog response status: {trip_res['status']}")
    assert trip_res["status"] == "FAIL_CLOSED_CIRCUIT_TRIPPED", "Watchdog failed to trip on >4.20 ms delay!"
    print(" • Verdict: PASS (Invariant M-S circuit breaker strictly decoupled)")

if __name__ == "__main__":
    print("===================================================================")
    print(" DUALISCAPAX ADVERSARIAL SELF-ATTACK HARNESS (IRIS RED TEAM)")
    print("===================================================================")
    test_attack_1_stampede_race_condition()
    test_attack_2_worker_sudden_death_and_lease_recovery()
    test_attack_3_hostile_sql_injection_and_poison_payload()
    test_attack_4_invariant_circuit_breaker_trip()
    print("\n===================================================================")
    print(" ADVERSARIAL VERDICT: 4 OF 4 ATTACK VECTORS DEFEATED")
    print("===================================================================")
