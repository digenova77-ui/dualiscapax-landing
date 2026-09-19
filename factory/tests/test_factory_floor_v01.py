"""Factory Floor v0.1 — authority surface regression suite.

SOURCE_REPAIR ≠ PRODUCTION_REPAIR. These tests bind the repo tip only.
Twain evaluator: MISSING IMPLEMENTATION → independent Twain replay is UNKNOWN.
engine.dclm.kernel.run: phantom chain export removed; jacket runs UPSTREAM_OBSERVED only.
Twain: honest stub returns UNKNOWN / never AGREE.
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



    def test_get_health_is_layer_declared_claim_only(self):
        src = (ROOT / "workers/iris-gateway/index.js").read_text()
        self.assertIn("DCLM_L0_LAYER_DECLARED", src)
        self.assertIn('governance_claim_authority: "CLAIM_ONLY"', src)
        self.assertIn('authority_effect: "NONE"', src)
        self.assertIn("iris_kernel_authorized: false", src)
        self.assertNotRegex(src, r'governance:\s*"DCLM_L0"\s*,')


class TestOpenFloorAuthLabel(unittest.TestCase):
    def test_anonymous_open_floor_not_authorized_token(self):
        src = (ROOT / "server/security-v2.js").read_text()
        self.assertIn("ANONYMOUS_OPEN_FLOOR", src)
        # May appear only as a demote ban target, never as an emitted STATES value.
        self.assertIn('ANONYMOUS_OPEN_FLOOR: "ANONYMOUS_OPEN_FLOOR"', src)
        self.assertNotIn('ANONYMOUS_OPEN_AUTHORIZED: "ANONYMOUS_OPEN_AUTHORIZED"', src)
        self.assertIn('"ANONYMOUS_OPEN_AUTHORIZED"', src)  # banned list defense-in-depth
        self.assertIn('"authorization"', src)  # claimOnlyKeys includes authorization


class TestJacketBindClaim(unittest.TestCase):
    def test_attest_bind_is_sandbox_claim_not_active_bound(self):
        src = (ROOT / "ops/apiv2/dclm_jacket.py").read_text()
        self.assertIn("SANDBOX_BIND_CLAIM", src)
        self.assertNotIn("ACTIVE_BOUND", src)
        self.assertIn('"claim_authority": "CLAIM_ONLY"', src)
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
        for rel in ("cf-pages/js/contract-bind.js", "js/contract-bind.js"):
            src = (ROOT / rel).read_text()
            self.assertIn("CLIENT_LOCAL_SIMULATION", src, rel)
            self.assertIn("ok: false", src, rel)
            self.assertNotRegex(src, r"rec\.state\s*=\s*[^;\n]*SETTLED")
        a = (ROOT / "js/contract-bind.js").read_text()
        b = (ROOT / "cf-pages/js/contract-bind.js").read_text()
        self.assertEqual(a, b, "js/ and cf-pages/ contract-bind must stay byte-equal")


class TestKvFailClosed(unittest.TestCase):
    def test_kv_cannot_mint_grant(self):
        src = (ROOT / "workers/stripe-fulfill/idempotency.js").read_text()
        self.assertIn("KV_CANNOT_MINT_GRANT", src)
        self.assertIn("authority_effect: \"NONE\"", src)
        w = (ROOT / "workers/stripe-fulfill/worker.js").read_text()
        self.assertIn("KV_CANNOT_MINT_GRANT", w)
        self.assertIn("authoritative: false", w)


class TestDclmImportHonest(unittest.TestCase):
    def test_kernel_run_imports_without_phantom_chain(self):
        """chain was never in meter — package must not re-export it."""
        init = (ROOT / "engine/dclm/__init__.py").read_text()
        self.assertNotIn("from .meter import Measure, chain", init)
        self.assertIn("CHAIN_STATUS", init)
        meter = (ROOT / "engine/dclm/meter.py").read_text()
        tree = ast.parse(meter)
        names = {n.name for n in tree.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))}
        self.assertNotIn("chain", names)
        import importlib
        if str(ROOT) not in sys.path:
            sys.path.insert(0, str(ROOT))
        # Fresh import
        for mod in list(sys.modules):
            if mod == "engine" or mod.startswith("engine.dclm"):
                del sys.modules[mod]
        from engine.dclm.kernel import run
        rec = run("Belleville overtime is $180000. Time-boxed pilot can walk back.", case_id="T-1")
        self.assertIn(rec.grant, {"MEASURE", "SEED", "VETO"})
        self.assertNotEqual(getattr(rec, "grant", None), "CONVERGED")

    def test_jacket_upstream_observed_runs(self):
        if str(ROOT) not in sys.path:
            sys.path.insert(0, str(ROOT))
        spec = importlib.util.spec_from_file_location(
            "dclm_jacket_floor", ROOT / "ops/apiv2/dclm_jacket.py"
        )
        mod = importlib.util.module_from_spec(spec)
        assert spec.loader is not None
        spec.loader.exec_module(mod)
        j = mod.Jacket()
        out = j.sandbox_execute("Belleville overtime is $180000. Time-boxed pilot can walk back.")
        self.assertEqual(out.get("authority_effect"), "NONE")
        self.assertEqual(out.get("verification"), "NOT_EXECUTED")
        self.assertIn(out.get("status"), {"UPSTREAM_OBSERVED", "FAIL_CLOSED_LOGIC_DIVERGENCE"})
        self.assertNotIn(out.get("status"), {"CONVERGED", "SUCCESS_VERIFIED", "DCLM_L0_CONVERGED"})


class TestTwainHonestStub(unittest.TestCase):
    def test_twain_stub_unknown_not_agree(self):
        # Load by file path — repo-root engine/ shadows src/engine on PYTHONPATH.
        twain_dir = ROOT / "src/engine/twain"
        self.assertTrue((twain_dir / "counterexample.py").exists())
        self.assertTrue((twain_dir / "__init__.py").exists())
        mod = _load_py("src/engine/twain/counterexample.py", "twain_counterexample_floor")
        t = mod.Twain()
        r = t.evaluate({"claim": "anything"})
        self.assertIsInstance(r, mod.TwainResult)
        self.assertEqual(r.status, "UNKNOWN")
        self.assertEqual(r.independent_replay, "UNKNOWN")
        self.assertFalse(r.claims_agreed)
        self.assertEqual(r.authority_effect, "NONE")
        self.assertNotEqual(r.status, "AGREE")
        rr = t.independent_replay({"claim": "x"})
        self.assertEqual(rr.independent_replay, "UNKNOWN")
        init = (twain_dir / "__init__.py").read_text()
        self.assertIn("from .counterexample import Twain, TwainResult", init)


class TestSessionStampSync(unittest.TestCase):
    def test_cf_pages_session_stamp_matches_client_correlation(self):
        a = (ROOT / "js/session-stamp.js").read_text()
        b = (ROOT / "cf-pages/js/session-stamp.js").read_text()
        self.assertEqual(a, b)
        self.assertIn("CLIENT_CORRELATION_ID", b)
        self.assertIn("authoritative: false", b)


class TestBindSuccessNoClientMint(unittest.TestCase):
    def test_bind_success_refuses_local_fuel_mint(self):
        src = (ROOT / "bind-success.html").read_text()
        self.assertIn("CLIENT_HINT", src)
        self.assertIn("authority_effect: NONE", src)
        self.assertNotIn("sessionStorage.setItem(\"dc.fuel\"", src)
        self.assertNotIn("Iris SPARK tier unlocks", src)


class TestFulfillLabelDemotion(unittest.TestCase):
    def test_d1_success_demotes_iris_authority(self):
        src = (ROOT / "workers/stripe-fulfill/worker.js").read_text()
        self.assertIn("iris_kernel_authorized: false", src)
        self.assertIn("sku_catalog_label", src)
        self.assertIn("KV_CANNOT_MINT_GRANT", src)

    def test_d1_tier_column_is_claim_only_not_iris(self):
        """PRODUCER must not write SPARK/BRANCH/DEPTH/ULTIMATE into entitlements.tier."""
        src = (ROOT / "workers/stripe-fulfill/worker.js").read_text()
        self.assertIn('tier: "CLAIM_ONLY"', src)
        self.assertIn("demoteEntitlementRecord", src)
        self.assertIn("tier_claim_authority", src)
        self.assertNotIn("iris_tier_unlock", src)
        self.assertNotRegex(
            src,
            r"tier:\s*grant\.(?:iris_tier_unlock|sku_catalog_label)",
        )
        idem = (ROOT / "workers/stripe-fulfill/idempotency.js").read_text()
        self.assertIn('row.tier || "CLAIM_ONLY"', idem)
        self.assertNotIn('row.tier || "GRANTED"', idem)
        schema = (ROOT / "workers/stripe-fulfill/schema.sql").read_text()
        self.assertIn("CLAIM_ONLY", schema)



class TestGateClaimOnly(unittest.TestCase):
    """engineering/medical localStorage marks are CLIENT_LOCAL_UI_MARK, not seats/Iris."""

    GATE_FILES = (
        "js/engineering-gate.js",
        "cf-pages/js/engineering-gate.js",
        "js/medical-gate.js",
        "cf-pages/js/medical-gate.js",
    )

    def test_gate_marks_are_claim_only_not_iris_or_seat(self):
        for rel in self.GATE_FILES:
            src = (ROOT / rel).read_text()
            self.assertIn("CLIENT_LOCAL_UI_MARK", src, rel)
            self.assertIn('claim_authority', src, rel)
            self.assertIn("CLAIM_ONLY", src, rel)
            # Accept both quote styles used in eng vs medical
            self.assertTrue(
                "seat_authority = false" in src or "seat_authority: false" in src,
                rel,
            )
            self.assertTrue(
                "iris_kernel_authorized = false" in src or "iris_kernel_authorized: false" in src,
                rel,
            )
            self.assertTrue(
                "economic_authority = false" in src or "economic_authority: false" in src,
                rel,
            )
            self.assertIn("authority_effect", src, rel)
            self.assertIn("NONE", src, rel)
            self.assertIn("asClientLocalUiMark", src, rel)
            self.assertIn("NOT SeatLaw", src, rel)
            self.assertIn("NOT Iris AUTHORIZED", src, rel)
            # ok:true retained for local UI unlock (granted() checks ok)
            self.assertIn("ok: true", src, rel)
            # Must not claim Iris AUTHORIZED as a positive grant outcome
            self.assertNotRegex(src, r"iris_kernel_authorized\s*[=:]\s*true")
            self.assertNotRegex(src, r"seat_authority\s*[=:]\s*true")

    def test_engineering_gate_copies_byte_equal(self):
        a = (ROOT / "js/engineering-gate.js").read_text()
        b = (ROOT / "cf-pages/js/engineering-gate.js").read_text()
        self.assertEqual(a, b, "js/ and cf-pages/ engineering-gate must stay byte-equal")

    def test_medical_gate_core_claim_marks_synced(self):
        """Core stamp helper must match; cf-pages may keep prompt() only."""
        a = (ROOT / "js/medical-gate.js").read_text()
        b = (ROOT / "cf-pages/js/medical-gate.js").read_text()
        for needle in (
            'claim_authority = "CLAIM_ONLY"',
            'state = "CLIENT_LOCAL_UI_MARK"',
            "seat_authority = false",
            "iris_kernel_authorized = false",
            "economic_authority = false",
            "asClientLocalUiMark",
        ):
            self.assertIn(needle, a)
            self.assertIn(needle, b)


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


class TestAuthorityKernelUnboundAgree(unittest.TestCase):
    """P0: caller independent_replay=AGREE must not mint AUTHORIZED while Twain is stub."""

    def test_agree_unbound_is_unknown_not_authorized(self):
        import types
        # Isolate under floor_atk.* so we do not shadow repo-root engine.dclm.kernel.run
        for key in list(sys.modules):
            if key == "floor_atk" or key.startswith("floor_atk."):
                del sys.modules[key]
        pkg = types.ModuleType("floor_atk")
        pkg.__path__ = []
        sys.modules["floor_atk"] = pkg
        dclm = types.ModuleType("floor_atk.dclm")
        dclm.__path__ = [str(ROOT / "src/engine/dclm")]
        sys.modules["floor_atk.dclm"] = dclm
        proof_mod = _load_py("src/engine/dclm/proof.py", "floor_atk.dclm.proof")
        sys.modules["floor_atk.dclm.proof"] = proof_mod
        # Twain bind target used by kernel helper (engine.twain) — load stub if absent
        if "engine" not in sys.modules:
            eng = types.ModuleType("engine")
            eng.__path__ = [str(ROOT / "engine")]
            sys.modules["engine"] = eng
        if "engine.twain" not in sys.modules:
            tw_pkg = types.ModuleType("engine.twain")
            tw_pkg.__path__ = [str(ROOT / "src/engine/twain")]
            sys.modules["engine.twain"] = tw_pkg
        if "engine.twain.counterexample" not in sys.modules:
            tw = _load_py("src/engine/twain/counterexample.py", "engine.twain.counterexample")
            sys.modules["engine.twain.counterexample"] = tw
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "floor_atk.dclm.kernel",
            ROOT / "src/engine/dclm/kernel.py",
            submodule_search_locations=[str(ROOT / "src/engine/dclm")],
        )
        # Rewrite relative import by exec after setting __package__
        kernel_mod = importlib.util.module_from_spec(spec)
        kernel_mod.__package__ = "floor_atk.dclm"
        sys.modules["floor_atk.dclm.kernel"] = kernel_mod
        # proof already under floor_atk.dclm.proof; kernel does "from .proof import ..."
        spec.loader.exec_module(kernel_mod)
        ProofObject = proof_mod.ProofObject
        po = ProofObject(
            assertion_id="a1", evidence_hashes=["x"], evidence_provenance="c",
            derivation_rule="n", derivation_parameters={}, contract_id="c", ontology_version="0",
            evaluator="MALICIOUS", evaluator_version="0", authority_effect="NONE",
            residual_obligations=[], temporal_context={}, dependency_hashes=[],
            threat_model="t", independent_check_result="AGREE", claim_text="auth",
        )
        k = kernel_mod.AuthorityKernel()
        for replay in ("AGREE", "PASS"):
            eff = k.decide(kernel_mod.TransitionRequest(
                transition_id="t", principal="att", action="PROMOTE", resource="r",
                capability="mint", evidence=po, independent_replay=replay,
            ))
            self.assertEqual(eff.decision, kernel_mod.Decision.UNKNOWN, replay)
            self.assertEqual(eff.effect_class, "NONE", replay)
            self.assertNotEqual(eff.decision, kernel_mod.Decision.AUTHORIZED, replay)
            self.assertTrue(
                any("unbound" in r or "twain_implementation" in r for r in eff.reasons),
                eff.reasons,
            )
        # Second-order: forging Twain.implementation must still fail (live probe).
        import engine.twain.counterexample as twmod
        twmod.Twain.implementation = "FULL_EVALUATOR"
        try:
            eff2 = k.decide(kernel_mod.TransitionRequest(
                transition_id="t2", principal="att", action="PROMOTE", resource="r",
                capability="mint", evidence=po, independent_replay="AGREE",
            ))
            self.assertEqual(eff2.decision, kernel_mod.Decision.UNKNOWN)
            self.assertTrue(any("twain_live_replay" in r for r in eff2.reasons), eff2.reasons)
        finally:
            twmod.Twain.implementation = "STUB_NOT_FULL_EVALUATOR"
        # Do not leave floor_atk shadowing anything under engine.*
        for key in list(sys.modules):
            if key == "floor_atk" or key.startswith("floor_atk."):
                del sys.modules[key]


class TestFirewallEscapeHatch(unittest.TestCase):
    def test_operator_override_not_production_critical(self):
        mod = _load_py("src/engine/dclm/firewall/core.py", "fw_reg")
        fw = mod.EpistemicFirewall()
        r = fw.evaluate(mod.ClaimObject(
            claim_id="evil", statement="VALIDATED", validation="UNVALIDATED",
            operator_override=True, origin="HUMAN_DERIVED",
            requested=mod.PermittedUse.PRODUCTION_CRITICAL,
        ))
        self.assertEqual(r.firewall_state, mod.FirewallState.REQUIRES_AUTHORIZATION)
        self.assertEqual(r.authorized_permitted_use, mod.PermittedUse.NO_USE)
        self.assertNotEqual(r.authorized_permitted_use, mod.PermittedUse.PRODUCTION_CRITICAL)

    def test_forged_sovereign_ticket_not_allow(self):
        mod = _load_py("src/engine/dclm/firewall/core.py", "fw_reg2")
        fw = mod.EpistemicFirewall()
        fake = mod.ActionCapabilityTicket(
            ticket_id="x", claim_id="evil", action_class="DEPLOY",
            scheme=mod.TicketScheme.SOVEREIGN_ED25519_RFC8785,
            envelope={"n": 1}, signature="forged",
        )
        self.assertFalse(fake.is_sovereign_authorized())
        self.assertEqual(
            fw.authorize_action(fake, want_sovereign=True),
            mod.FirewallState.REQUIRES_AUTHORIZATION,
        )


class TestEffectBoundaryNoCallerAdmit(unittest.TestCase):
    def test_booleans_alone_not_admitted(self):
        mod = _load_py("src/engine/dclm/effects.py", "eff_reg")
        rec = mod.EffectBoundary().admit(True, True, True)
        self.assertEqual(rec.authority, "NONE")
        self.assertEqual(rec.reason, "CALLER_BOOLEANS_ARE_NOT_AUTHORITY")
        self.assertNotEqual(rec.authority, "ADMITTED")
        bound = mod.EffectBoundary().admit(True, True, True, proof_id="abc")
        self.assertEqual(bound.authority, "NONE")
        self.assertNotEqual(bound.authority, "ADMITTED")


class TestSeatLawReservedIds(unittest.TestCase):
    def test_object_seed_not_seats(self):
        mod = _load_py("src/engine/identity/seat_law.py", "seat_reg")
        law = mod.SeatLaw()
        for bad in ("OBJECT", "SEED", "ALLOCATION_ID", "ROSTER_SEAT"):
            with self.assertRaises(ValueError) as ctx:
                law.create_seat(bad, "x")
            self.assertIn("reserved", str(ctx.exception))

    def test_identity_init_exports_match_seat_law(self):
        init = (ROOT / "src/engine/identity/__init__.py").read_text()
        self.assertIn("HistoryEvent", init)
        self.assertIn("SeatLaw", init)
        self.assertNotIn("Allocation", init)
        self.assertNotIn("PlayerObject", init)
        self.assertNotIn("RosterSeat", init)
        # Direct loads still work (root engine/ package has no identity submodule)
        seat = _load_py("src/engine/identity/seat_law.py", "seat_reg_init")
        prin = _load_py("src/engine/identity/principal.py", "prin_reg_init")
        self.assertTrue(hasattr(seat, "SeatLaw"))
        self.assertTrue(hasattr(seat, "HistoryEvent"))
        self.assertTrue(hasattr(prin, "Principal"))


class TestDemoteNestedAndValidated(unittest.TestCase):
    def test_nested_and_validated_demoted(self):
        r = subprocess.run(
            [
                "node", "--input-type=module", "-e",
                """
import { demoteForbiddenLabels } from './server/security-v2.js';
const nested = demoteForbiddenLabels({
  nested: { governance: 'CONVERGED', status: 'VALIDATED', authority_effect: 'AUTHORIZED' },
  states: { dclm: 'CONVERGED' },
  verification: 'VALIDATED',
});
const ok =
  nested.nested.governance === 'CLAIM_ONLY' &&
  nested.nested.status === 'CLAIM_ONLY' &&
  nested.nested.authority_effect === 'NONE' &&
  nested.states.dclm === 'CLAIM_ONLY' &&
  nested.verification === 'CLAIM_ONLY';
if (!ok) {
  console.error(JSON.stringify(nested, null, 2));
  process.exit(1);
}
console.log('demote nested+VALIDATED ok');
""",
            ],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=30,
        )
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)



class TestSourceArtifactBoundary(unittest.TestCase):
    """Bind deployable wrangler packages — source-only reads are insufficient.

    Attack class: mutate/omit package while source tests still pass.
    Permanent regression: dry-run package must retain security markers.
    """

    WORKERS = (
        (
            "dualiscapax-depth",
            "server/wrangler.toml",
            "worker.js",
            (
                "demoteForbiddenLabels",
                "ANONYMOUS_OPEN_FLOOR",
                "TEAMSNAP_REDIRECT_ALLOWLIST",
                "redirect_uri_rejected",
            ),
            (),  # CONVERGED may appear only as demote ban target
        ),
        (
            "iris-gateway",
            "workers/iris-gateway/wrangler.toml",
            "index.js",
            (
                "DCLM_L0_NOT_EXECUTED",
                "DCLM_L0_PROMPT_APPLIED",
                "CLAIM_ONLY",
            ),
            ("DCLM_L0_CONVERGED",),
        ),
        (
            "dualis-gate",
            "workers/dualis-gate/wrangler.toml",
            "dualis-bc.js",
            (
                "canonicalize",
                "PAYLOAD_HASH_COLLISION",
                "kyc_written: false",
            ),
            ("INSERT INTO unity_kyc",),
        ),
        (
            "stripe-fulfill",
            "workers/stripe-fulfill/wrangler.toml",
            "worker.js",
            (
                "KV_CANNOT_MINT_GRANT",
                "demoteEntitlementRecord",
                "CLAIM_ONLY",
            ),
            ("iris_tier_unlock",),
        ),
    )

    def _pack(self, cfg: str, outdir: Path) -> subprocess.CompletedProcess:
        outdir.mkdir(parents=True, exist_ok=True)
        return subprocess.run(
            [
                "npx",
                "wrangler",
                "deploy",
                "-c",
                cfg,
                "--dry-run",
                "--outdir",
                str(outdir),
            ],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=120,
        )

    def test_wrangler_mains_match_tested_entrypoints(self):
        expected = {
            "server/wrangler.toml": "worker.js",
            "workers/dualis-gate/wrangler.toml": "dualis-bc.js",
            "workers/iris-gateway/wrangler.toml": "index.js",
            "workers/stripe-fulfill/wrangler.toml": "worker.js",
        }
        for rel, main in expected.items():
            src = (ROOT / rel).read_text()
            self.assertIn(f'main = "{main}"', src, rel)

    def test_packaged_artifacts_retain_security_markers(self):
        import tempfile

        with tempfile.TemporaryDirectory(prefix="factory-art-") as tmp:
            base = Path(tmp)
            for name, cfg, main, must, forbid in self.WORKERS:
                out = base / name
                r = self._pack(cfg, out)
                self.assertEqual(r.returncode, 0, f"{name}: {r.stdout}\n{r.stderr}")
                art = out / main
                self.assertTrue(art.is_file(), f"missing package main {art}")
                body = art.read_text(errors="replace")
                for needle in must:
                    self.assertIn(needle, body, f"{name} package missing {needle}")
                for needle in forbid:
                    self.assertNotIn(needle, body, f"{name} package contains {needle}")
                # Provenance gap remains: package hash != source hash by design (bundle).
                # Require non-empty upload body so silent empty package fails closed.
                self.assertGreater(art.stat().st_size, 500, name)


class TestEngineImportSurfaceDivergence(unittest.TestCase):
    """engine/dclm/kernel.py and src/engine/dclm/kernel.py are different programs.

    Factory AuthorityKernel tests load src/ by file path. `import engine.dclm.kernel`
    always resolves to repo-root engine/ (measure `run`). Same leaf name, different code.
    """

    def test_kernels_are_not_byte_equal(self):
        a = (ROOT / "engine/dclm/kernel.py").read_bytes()
        b = (ROOT / "src/engine/dclm/kernel.py").read_bytes()
        self.assertNotEqual(a, b)
        self.assertIn(b"def run", a)
        self.assertNotIn(b"class AuthorityKernel", a)
        self.assertIn(b"class AuthorityKernel", b)

    def test_import_engine_dclm_kernel_is_measure_surface(self):
        import importlib

        for mod in list(sys.modules):
            if mod == "engine" or mod.startswith("engine."):
                del sys.modules[mod]
        if str(ROOT) not in sys.path:
            sys.path.insert(0, str(ROOT))
        k = importlib.import_module("engine.dclm.kernel")
        self.assertTrue(hasattr(k, "run"))
        self.assertFalse(hasattr(k, "AuthorityKernel"))
        # src/engine is not an importable package (no __init__.py) — file-path only.
        self.assertFalse((ROOT / "src/engine/__init__.py").exists())




if __name__ == "__main__":
    unittest.main(verbosity=2)
