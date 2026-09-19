"""Factory Floor v0.1 — authority surface regression suite.

SOURCE_REPAIR ≠ PRODUCTION_REPAIR. These tests bind the repo tip only.
Twain evaluator: MISSING IMPLEMENTATION → independent Twain replay is UNKNOWN.
engine.dclm.kernel.run: BLOCKED (meter.chain ImportError) → jacket tests report blocker, not fabricate pass.
"""
from __future__ import annotations

import ast
import importlib.util
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def _load_py(rel: str, name: str):
    path = ROOT / rel
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    return mod


class TestProtectedSurfaces(unittest.TestCase):
    def test_worker_imports_security_v2(self):
        src = (ROOT / "server/worker.js").read_text()
        self.assertIn('from "./security-v2.js"', src)
        self.assertIn("demoteForbiddenLabels", src)

    def test_session_stamp_is_client_correlation(self):
        src = (ROOT / "js/session-stamp.js").read_text()
        self.assertIn("CLIENT_CORRELATION_ID", src)
        self.assertIn("authoritative: false", src)

    def test_entitlement_mediator_ledger_present_not_authorized(self):
        mod = _load_py("src/engine/dclm/entitlement.py", "ent_floor")
        m = mod.EntitlementMediator()
        out = m.resolve(1, 1, 5)
        self.assertEqual(out["decision"], "LEDGER_PRESENT")
        self.assertNotEqual(out.get("decision"), "AUTHORIZED")
        self.assertEqual(out["authority_effect"], "NONE")
        none = m.resolve(None, None, None)
        self.assertEqual(none["decision"], "INSUFFICIENT_EVIDENCE")

    def test_seat_law_history_follows_player(self):
        mod = _load_py("src/engine/identity/seat_law.py", "seat_floor")
        law = mod.SeatLaw()
        law.create_player("p1", "Ada")
        law.create_seat("s1", "G")
        law.assign("p1", "s1")
        denied = law.write_old_seat_into("p1", "p2")
        self.assertFalse(denied["ok"])
        self.assertEqual(denied["authority_effect"], "NONE")

    def test_jacket_status_upstream_observed_not_success_verified(self):
        src = (ROOT / "ops/apiv2/dclm_jacket.py").read_text()
        self.assertIn("UPSTREAM_OBSERVED", src)
        self.assertNotIn("SUCCESS_VERIFIED", src)


class TestIrisGovernance(unittest.TestCase):
    def test_no_converged_without_evaluator(self):
        src = (ROOT / "workers/iris-gateway/index.js").read_text()
        self.assertNotIn("DCLM_L0_CONVERGED", src)
        self.assertIn("DCLM_L0_NOT_EXECUTED", src)
        self.assertTrue(
            "DCLM_L0_PROMPT_APPLIED" in src or "UPSTREAM_OBSERVED" in src
        )


class TestStripeProvenance(unittest.TestCase):
    def test_full_canonical_hash_and_no_metadata_kyc(self):
        src = (ROOT / "workers/dualis-gate/d1-idempotency.js").read_text()
        self.assertIn("function canonicalize", src)
        self.assertIn("PAYLOAD_HASH_COLLISION", src)
        self.assertIn("kyc_written: false", src)
        self.assertNotIn("INSERT INTO unity_kyc", src)
        self.assertNotIn("JSON.stringify({ id: event.id, type:", src)


class TestTeamSnapAllowlist(unittest.TestCase):
    def test_redirect_allowlist_fail_closed(self):
        src = (ROOT / "cf-pages/workers/teamsnap-token-route.js").read_text()
        self.assertIn("TEAMSNAP_REDIRECT_ALLOWLIST", src)
        self.assertIn("redirect_uri_rejected", src)
        self.assertIn("TEAMSNAP_CLIENT_ID not set", src)


class TestContractBind(unittest.TestCase):
    def test_client_local_simulation(self):
        src = (ROOT / "cf-pages/js/contract-bind.js").read_text()
        self.assertIn("CLIENT_LOCAL_SIMULATION", src)
        self.assertIn('ok: false', src)
        self.assertNotRegex(src, r'rec\.state\s*=\s*[^;\n]*SETTLED')


class TestKvFailClosed(unittest.TestCase):
    def test_kv_cannot_mint_grant(self):
        src = (ROOT / "workers/stripe-fulfill/idempotency.js").read_text()
        self.assertIn("KV_CANNOT_MINT_GRANT", src)
        self.assertIn("authority_effect: \"NONE\"", src)
        w = (ROOT / "workers/stripe-fulfill/worker.js").read_text()
        self.assertIn("KV_CANNOT_MINT_GRANT", w)
        self.assertIn("authoritative: false", w)


class TestBlockers(unittest.TestCase):
    def test_jacket_kernel_run_blocker(self):
        """engine.dclm.kernel.run cannot be imported — meter.chain missing."""
        init = (ROOT / "engine/dclm/__init__.py").read_text()
        self.assertIn("chain", init)
        meter = (ROOT / "engine/dclm/meter.py").read_text()
        tree = ast.parse(meter)
        names = {n.name for n in tree.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))}
        self.assertNotIn("chain", names)  # documents the hole

    def test_twain_missing_implementation(self):
        twain_dir = ROOT / "src/engine/twain"
        self.assertTrue((twain_dir / "__init__.py").exists())
        files = [p.name for p in twain_dir.iterdir() if p.suffix == ".py"]
        self.assertEqual(files, ["__init__.py"])  # counterexample.py absent


class TestReplayHarness(unittest.TestCase):
    def test_replay_tester_green(self):
        r = subprocess.run(
            ["node", "workers/dualis-gate/replay-test.mjs"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=60,
        )
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn("all greens", r.stdout.lower() + r.stderr.lower() if False else r.stdout)


if __name__ == "__main__":
    unittest.main(verbosity=2)
