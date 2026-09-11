# Red-Team Adversarial Test Suite for Hierarchical Watchdog Tower
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import time, hashlib
from hierarchical_watchdog_tower import WatchdogValidationTower

def run_tests():
    print('===================================================================')
    print(' DUALISCAPAX 3-TIER WATCHDOG TOWER ADVERSARIAL VERIFICATION')
    print('===================================================================')
    tower = WatchdogValidationTower()
    valid_epoch_hash = hashlib.sha256(b'CANONICAL_EPOCH_HEAD').hexdigest()

    # TEST 1: Tier 1 Latency Spike Injection (> 4.20 ms)
    print('--- TEST 1: TIER 1 LATENCY SPIKE INJECTION (> 4.20 ms) ---')
    t_delayed = time.perf_counter_ns() - int(5.5 * 1e6)
    res1 = tower.execute_closed_loop_validation('Iris-BioMed', 'TASK-LATENCY-TEST', t_delayed, {'q': 1.0, 'p': 0.5}, valid_epoch_hash)
    print(' * Tier 1 Status:', res1['tier1_worker_report']['status'])
    print(' * Tier 3 Apex Verdict:', res1['tier3_apex_report']['verdict'])
    assert res1['tier1_worker_report']['tripped'] is True
    assert res1['path_of_validation_closed'] is False
    print(' * Verdict: PASS (Fail-Closed Decoupling Verified at Tier 1)')

    # TEST 2: Tier 2 Corrupted Epoch Hash
    print('--- TEST 2: TIER 2 CORRUPTED EPOCH ROOT HASH ---')
    t_now = time.perf_counter_ns()
    res2 = tower.execute_closed_loop_validation('Iris-Core', 'TASK-HASH-TEST', t_now, {'q': 1.0, 'p': 0.5}, 'INVALID_SHORT_HASH')
    print(' * Tier 2 Status:', res2['tier2_ensemble_report']['status'])
    print(' * Tier 3 Apex Verdict:', res2['tier3_apex_report']['verdict'])
    assert res2['tier2_ensemble_report']['tripped'] is True
    assert res2['path_of_validation_closed'] is False
    print(' * Verdict: PASS (Fail-Closed Decoupling Verified at Tier 2)')

    # TEST 3: Tier 3 Apex Physical Symplectic Conservation Drift
    print('--- TEST 3: TIER 3 NON-FINITE PHASE-SPACE INGESTION ---')
    res3 = tower.execute_closed_loop_validation('Iris-Treasury', 'TASK-DRIFT-TEST', t_now, {'q': float('nan'), 'p': 0.5}, valid_epoch_hash)
    print(' * Tier 3 Apex Verdict:', res3['tier3_apex_report']['verdict'])
    assert res3['path_of_validation_closed'] is False
    print(' * Verdict: PASS (Fail-Closed Decoupling Verified at Tier 3)')

    # TEST 4: Perfect Nominal Invariant Path Closure
    print('--- TEST 4: NOMINAL 3-TIER CONSTITUTIONAL CLOSURE ---')
    res4 = tower.execute_closed_loop_validation('Iris-Core', 'TASK-NOMINAL-SUCCESS', t_now, {'q': 1.0, 'p': 0.6035}, valid_epoch_hash)
    print(' * Tier 1 Worker:', res4['tier1_worker_report']['status'], f"({res4['tier1_worker_report']['latency_ms']} ms)")
    print(' * Tier 2 Ensemble:', res4['tier2_ensemble_report']['status'])
    print(' * Tier 3 Apex Verdict:', res4['tier3_apex_report']['verdict'])
    print(' * Validation Path Closed:', res4['path_of_validation_closed'])
    print(' * Terminal Seal Hash:', res4['terminal_seal_hash'][:32] + '...')
    assert res4['path_of_validation_closed'] is True
    assert res4['tier3_apex_report']['verdict'] == 'APEX_SEALED_CONSTITUTIONAL_TRUTH'
    print(' * Verdict: PASS (Validation Path 100% Closed & Anchored)')

    print('===================================================================')
    print(' ALL 4 ADVERSARIAL RED-TEAM TESTS PASSED // TOWER CERTIFIED')
    print('===================================================================')

if __name__ == '__main__':
    run_tests()
