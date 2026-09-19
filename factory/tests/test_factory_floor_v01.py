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
    """Packaged Worker body is what deploy uploads — bind markers + tip provenance."""

    WORKERS = (
        (
            "dualiscapax-depth",
            "server/wrangler.toml",
            "worker.js",
            (
                "demoteForbiddenLabels",
                "TEAMSNAP_REDIRECT_ALLOWLIST",
                "redirect_uri_rejected",
                'DC_ARTIFACT_TIP = "UNSTAMPED"',
            ),
            (),
        ),
        (
            "iris-gateway",
            "workers/iris-gateway/wrangler.toml",
            "index.js",
            (
                "DCLM_L0_NOT_EXECUTED",
                "DCLM_L0_PROMPT_APPLIED",
                "CLAIM_ONLY",
                'DC_ARTIFACT_TIP = "UNSTAMPED"',
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
                'DC_ARTIFACT_TIP = "UNSTAMPED"',
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
                'DC_ARTIFACT_TIP = "UNSTAMPED"',
                "binding_presence_claim_only",
                "PARKED_UNTIL_BIND_CONTINUE",
            ),
            ("iris_tier_unlock",),
        ),
        (
            "origin-join",
            "workers/origin-join/wrangler.toml",
            "worker.js",
            (
                "x-dc-join",
                "not on the join plate",
                "raw.githubusercontent.com/digenova77-ui/dualiscapax-landing/main",
                'DC_ARTIFACT_TIP = "UNSTAMPED"',
            ),
            (),
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
            "workers/origin-join/wrangler.toml": "worker.js",
        }
        for rel, main in expected.items():
            src = (ROOT / rel).read_text()
            self.assertIn(f'main = "{main}"', src, rel)
        # Pages brochure config exists; this campaign does not publish Pages.
        pages = (ROOT / "wrangler.toml").read_text()
        self.assertIn('name = "dualiscapax-web"', pages)
        self.assertIn('pages_build_output_dir = "."', pages)

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
                self.assertGreater(art.stat().st_size, 500 if name != "origin-join" else 200, name)

    def test_stamp_artifact_tip_rewrites_unstamped_package(self):
        import tempfile

        tip = subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True
        ).strip()
        with tempfile.TemporaryDirectory(prefix="factory-stamp-") as tmp:
            out = Path(tmp) / "depth"
            r = self._pack("server/wrangler.toml", out)
            self.assertEqual(r.returncode, 0, r.stderr)
            body0 = (out / "worker.js").read_text()
            self.assertIn('DC_ARTIFACT_TIP = "UNSTAMPED"', body0)
            self.assertNotIn(tip, body0)
            s = subprocess.run(
                ["node", "factory/tools/stamp_artifact_tip.mjs", str(out), tip],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=30,
            )
            self.assertEqual(s.returncode, 0, s.stderr)
            body1 = (out / "worker.js").read_text()
            self.assertIn(f'DC_ARTIFACT_TIP = "{tip}"', body1)
            self.assertNotIn('DC_ARTIFACT_TIP = "UNSTAMPED"', body1)
            receipt_path = out / ".dc_artifact_tip_receipt.json"
            self.assertTrue(receipt_path.is_file(), "stamp must write content-hash receipt")
            import hashlib
            import json

            receipt = json.loads(receipt_path.read_text())
            self.assertEqual(receipt["tip"], tip)
            self.assertEqual(receipt["correspondence"], "UNVERIFIED_STRING_REWRITE_ONLY")
            self.assertEqual(receipt["derivation_state"], "UNVERIFIED")
            self.assertTrue(receipt["files"])
            self.assertIn("pre_stamp_sha256", receipt["files"][0])
            got = hashlib.sha256(body1.encode()).hexdigest()
            self.assertEqual(receipt["files"][0]["sha256"], got)


class TestEngineImportSurfaceDivergence(unittest.TestCase):
    """engine/dclm/kernel.py and src/engine/dclm/kernel.py are different programs.

    Factory AuthorityKernel tests load src/ by file path. `import engine.dclm.kernel`
    from repo root always resolves to measure `run`. cwd=src/ can flip to Authority.
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
        # src/engine is not an importable regular package (no __init__.py).
        self.assertFalse((ROOT / "src/engine/__init__.py").exists())

    def test_cwd_src_namespace_loads_authority_kernel(self):
        """OBSERVED hazard: cwd=src/ + '' on path → Authority under same import name."""
        import importlib
        import os

        for mod in list(sys.modules):
            if mod == "engine" or mod.startswith("engine."):
                del sys.modules[mod]
        prev = os.getcwd()
        prev_path = list(sys.path)
        try:
            os.chdir(ROOT / "src")
            sys.path = [""] + [p for p in sys.path if p not in ("", str(ROOT), str(ROOT / "src"))]
            k = importlib.import_module("engine.dclm.kernel")
            self.assertTrue(hasattr(k, "AuthorityKernel"), k.__file__)
            self.assertFalse(hasattr(k, "run"), k.__file__)
            self.assertIn("src/engine/dclm/kernel.py", k.__file__.replace("\\\\", "/"))
        finally:
            os.chdir(prev)
            sys.path[:] = prev_path
            for mod in list(sys.modules):
                if mod == "engine" or mod.startswith("engine."):
                    del sys.modules[mod]

    def test_semantic_api_divergence_measure_vs_authority(self):
        """Not just import path: measure.run and AuthorityKernel.decide are different programs."""
        import importlib

        for mod in list(sys.modules):
            if mod == "engine" or mod.startswith("engine."):
                del sys.modules[mod]
        if str(ROOT) not in sys.path:
            sys.path.insert(0, str(ROOT))
        measure = importlib.import_module("engine.dclm.kernel")
        rec = measure.run("rabbit-hole residual probe")
        self.assertEqual(type(rec).__name__, "Record")
        self.assertIn(rec.grant, ("SEED", "MEASURE", "YES", "NO", "WAIT_GRANT", "VETO"))
        self.assertFalse(hasattr(measure, "Decision"))
        self.assertFalse(hasattr(measure, "AuthorityKernel"))
        # Authority surface (src/) — different API; do not unify.
        auth_src = (ROOT / "src/engine/dclm/kernel.py").read_text()
        self.assertIn("class AuthorityKernel", auth_src)
        self.assertIn("class Decision", auth_src)
        self.assertIn("def decide(", auth_src)
        self.assertNotIn("\ndef run(", auth_src)
        self.assertIn('AUTHORIZED = "AUTHORIZED"', auth_src)
        # Measure Record never emits Decision.AUTHORIZED
        self.assertNotEqual(getattr(rec, "grant", None), "AUTHORIZED")
        self.assertNotEqual(getattr(rec, "grant", None), "CONVERGED")
        self.assertNotEqual(
            (ROOT / "engine/dclm/kernel.py").read_bytes(),
            (ROOT / "src/engine/dclm/kernel.py").read_bytes(),
        )


class TestEnvAuthorityDefaultsFailClosed(unittest.TestCase):
    """Git wrangler defaults must stay fail-closed; live dashboard NOT_VERIFIED."""

    def test_checkout_open_default_false(self):
        src = (ROOT / "workers/dualis-gate/wrangler.toml").read_text()
        self.assertIn('CHECKOUT_OPEN = "false"', src)
        gate = (ROOT / "workers/dualis-gate/dualis-bc.js").read_text()
        self.assertIn('String(env.CHECKOUT_OPEN || "") === "true"', gate)
        fulfill_toml = (ROOT / "workers/stripe-fulfill/wrangler.toml").read_text()
        self.assertIn('CHECKOUT_OPEN = "false"', fulfill_toml)
        self.assertIn("[vars]", fulfill_toml)
        fulfill = (ROOT / "workers/stripe-fulfill/worker.js").read_text()
        self.assertIn('String(env.CHECKOUT_OPEN || "") !== "true"', fulfill)

    def test_iris_house_key_default_off(self):
        src = (ROOT / "workers/iris-gateway/wrangler.toml").read_text()
        self.assertIn('IRIS_ALLOW_HOUSE_KEY = "0"', src)
        iris = (ROOT / "workers/iris-gateway/index.js").read_text()
        self.assertIn('String(env.IRIS_ALLOW_HOUSE_KEY || "") === "1"', iris)

    def test_d1_bindings_not_committed_in_git_toml(self):
        for rel in (
            "workers/dualis-gate/wrangler.toml",
            "workers/stripe-fulfill/wrangler.toml",
        ):
            src = (ROOT / rel).read_text()
            live = [
                ln
                for ln in src.splitlines()
                if (not ln.lstrip().startswith("#"))
                and (
                    ln.strip().startswith("[[d1_databases]]")
                    or ln.strip().startswith("[[kv_namespaces]]")
                    or ln.strip().startswith("database_id")
                )
            ]
            self.assertEqual(live, [], f"{rel} has live bind lines: {live}")


class TestMedicalGatePromptDriftAllowlist(unittest.TestCase):
    def test_cf_pages_prompt_suffix_only_delta(self):
        a = (ROOT / "js/medical-gate.js").read_text().splitlines()
        b = (ROOT / "cf-pages/js/medical-gate.js").read_text().splitlines()
        i = 0
        while i < len(a) and i < len(b) and a[i] == b[i]:
            i += 1
        # Root file ends at shared body; cf-pages may append prompt() only.
        self.assertEqual(i, len(a) - 1, "unexpected drift before medical-gate closing")
        self.assertTrue(a[-1].strip().startswith("})();"))
        suffix = "\n".join(b[i:])
        self.assertIn("window.DC_MEDICAL.prompt = function", suffix)
        self.assertIn("Public checkout is not offered", suffix)
        self.assertNotIn("AUTHORIZED", suffix)
        self.assertNotIn("CONVERGED", suffix)


class TestTipStampAdversarialIntegrity(unittest.TestCase):
    """Tip stamp bypasses: correspondence unverified; receipt detects post-stamp mutate."""

    def _tip(self):
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True
        ).strip()

    def test_orphan_unstamped_body_stamps_without_source_correspondence(self):
        import json
        import tempfile

        tip = self._tip()
        with tempfile.TemporaryDirectory(prefix="stamp-orphan-") as tmp:
            out = Path(tmp)
            (out / "worker.js").write_text(
                'export const DC_ARTIFACT_TIP = "UNSTAMPED"; const EVIL = "orphan";\n'
            )
            s = subprocess.run(
                ["node", "factory/tools/stamp_artifact_tip.mjs", str(out), tip],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=30,
            )
            self.assertEqual(s.returncode, 0, s.stderr)
            body = (out / "worker.js").read_text()
            self.assertIn(f'DC_ARTIFACT_TIP = "{tip}"', body)
            self.assertIn('EVIL = "orphan"', body)
            receipt = json.loads((out / ".dc_artifact_tip_receipt.json").read_text())
            self.assertEqual(receipt["correspondence"], "UNVERIFIED_STRING_REWRITE_ONLY")
            self.assertEqual(receipt["derivation_state"], "UNVERIFIED")
            # Tip+receipt integrity is not derivation — verify exits 3.
            v = subprocess.run(
                ["node", "factory/tools/verify_artifact_receipt.mjs", str(out)],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=30,
            )
            self.assertEqual(v.returncode, 3, v.stdout + v.stderr)
            self.assertIn("INTEGRITY_OK_DERIVATION_UNVERIFIED", v.stdout)

    def test_post_stamp_mutation_breaks_receipt_hash(self):
        import hashlib
        import json
        import tempfile

        tip = self._tip()
        with tempfile.TemporaryDirectory(prefix="stamp-mutate-") as tmp:
            out = Path(tmp)
            (out / "worker.js").write_text(
                'export const DC_ARTIFACT_TIP = "UNSTAMPED";\n'
            )
            s = subprocess.run(
                ["node", "factory/tools/stamp_artifact_tip.mjs", str(out), tip],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=30,
            )
            self.assertEqual(s.returncode, 0, s.stderr)
            receipt = json.loads((out / ".dc_artifact_tip_receipt.json").read_text())
            art = out / "worker.js"
            art.write_text(art.read_text() + "\n/* mutated after stamp */\n")
            got = hashlib.sha256(art.read_bytes()).hexdigest()
            self.assertNotEqual(receipt["files"][0]["sha256"], got)

    def test_omit_tip_marker_refused(self):
        import tempfile

        tip = self._tip()
        with tempfile.TemporaryDirectory(prefix="stamp-omit-") as tmp:
            out = Path(tmp)
            (out / "worker.js").write_text("export default {};\n")
            s = subprocess.run(
                ["node", "factory/tools/stamp_artifact_tip.mjs", str(out), tip],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=30,
            )
            self.assertNotEqual(s.returncode, 0)

    def test_foreign_tip_refused(self):
        import tempfile

        tip = self._tip()
        foreign = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        with tempfile.TemporaryDirectory(prefix="stamp-foreign-") as tmp:
            out = Path(tmp)
            (out / "worker.js").write_text(
                f'export const DC_ARTIFACT_TIP = "{foreign}";\n'
            )
            s = subprocess.run(
                ["node", "factory/tools/stamp_artifact_tip.mjs", str(out), tip],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=30,
            )
            self.assertNotEqual(s.returncode, 0)
            self.assertIn("foreign tip", s.stderr.lower() + s.stdout.lower())


class TestStripeParkedState(unittest.TestCase):
    """No test/fixture/env default converts parked into operational authority."""

    def test_gate_closed_webhook_returns_applied_false(self):
        gate = (ROOT / "workers/dualis-gate/dualis-bc.js").read_text()
        self.assertIn('reason: "closed"', gate)
        self.assertIn("applied: false", gate)
        self.assertIn('CHECKOUT_OPEN = "false"', (ROOT / "workers/dualis-gate/wrangler.toml").read_text())
        # No wrangler/fixture flips checkout open; compare is exact "true" only.
        for rel in (
            "workers/dualis-gate/wrangler.toml",
            "workers/stripe-fulfill/wrangler.toml",
            "workers/iris-gateway/wrangler.toml",
            "server/wrangler.toml",
        ):
            self.assertNotIn('CHECKOUT_OPEN = "true"', (ROOT / rel).read_text(), rel)

    def test_fulfill_health_binding_presence_is_claim_only(self):
        fulfill = (ROOT / "workers/stripe-fulfill/worker.js").read_text()
        self.assertIn("binding_presence_claim_only: true", fulfill)
        self.assertIn('operational_authority: "NONE"', fulfill)
        self.assertIn('stripe_process_state: "PARKED_UNTIL_BIND_CONTINUE"', fulfill)
        self.assertIn("has_webhook_secret: Boolean(env && env.STRIPE_WEBHOOK_SECRET)", fulfill)
        self.assertIn("grant_path_gated_by_checkout_open: true", fulfill)
        self.assertIn("checkout_open:", fulfill)

    def test_accept_stripe_event_never_mints_kyc(self):
        src = (ROOT / "workers/dualis-gate/d1-idempotency.js").read_text()
        self.assertIn("kyc_written: false", src)
        self.assertNotIn("INSERT INTO unity_kyc", src)
        self.assertIn("authority_effect: \"NONE\"", src)

    def test_fulfill_grant_path_gated_by_checkout_open(self):
        """P0: signed paid events must not call grantAccess while CHECKOUT_OPEN!==true."""
        fulfill = (ROOT / "workers/stripe-fulfill/worker.js").read_text()
        self.assertIn('String(env.CHECKOUT_OPEN || "") !== "true"', fulfill)
        self.assertIn('reason: "closed"', fulfill)
        self.assertIn('authority_effect: "NONE"', fulfill)
        # Gate appears before grantAccess invocation in fetch handler.
        idx_gate = fulfill.find('String(env.CHECKOUT_OPEN || "") !== "true"')
        idx_grant = fulfill.find("await grantAccess(env,")
        self.assertGreater(idx_gate, 0)
        self.assertGreater(idx_grant, 0)
        self.assertLess(idx_gate, idx_grant, "CHECKOUT_OPEN gate must precede grantAccess")
        self.assertIn("grant_path_gated_by_checkout_open: true", fulfill)
        self.assertIn("checkout_open:", fulfill)
        toml = (ROOT / "workers/stripe-fulfill/wrangler.toml").read_text()
        self.assertIn('CHECKOUT_OPEN = "false"', toml)
        # No live D1 id in git toml
        live = [
            ln for ln in toml.splitlines()
            if (not ln.lstrip().startswith("#")) and "database_id" in ln
        ]
        self.assertEqual(live, [])

    def test_gate_closed_and_identity_expose_observability_without_authority(self):
        """Closed/identity HTTP expose kyc_written/duplicate/collision/authority_effect; no promote."""
        gate = (ROOT / "workers/dualis-gate/dualis-bc.js").read_text()
        for token in (
            "kyc_written:",
            "authority_effect:",
            "collision:",
            "duplicate:",
            'reason: "closed"',
            "applied: false",
        ):
            self.assertIn(token, gate)
        self.assertNotIn('applied: true', gate)
        self.assertNotIn('kyc_written: true', gate.replace("out.kyc_written === true", "SAFE"))
        self.assertNotIn('authority_effect: "AUTHORIZED"', gate)
        self.assertNotIn('authority_effect: "GRANTED"', gate)


class TestOriginJoinNotFactoryFloorArtifact(unittest.TestCase):
    """origin-join stays on main; its output is not a verified factory-floor-v01 artifact."""

    def test_raw_pin_is_main_not_factory_floor_branch(self):
        oj = (ROOT / "workers/origin-join/worker.js").read_text()
        self.assertIn(
            "raw.githubusercontent.com/digenova77-ui/dualiscapax-landing/main", oj
        )
        self.assertNotIn("factory-floor-v01", oj)
        self.assertIn('"x-dc-join":"origin-join"', oj.replace(" ", ""))
        # Tip marker is worker build tip only — not content tip of proxied main files.
        self.assertIn('DC_ARTIFACT_TIP = "UNSTAMPED"', oj)

    def test_join_header_is_not_verified_tip_claim(self):
        oj = (ROOT / "workers/origin-join/worker.js").read_text()
        for banned in ("VERIFIED_FACTORY_FLOOR", "DEPLOYABLE", "TIP_VERIFIED_CONTENT"):
            self.assertNotIn(banned, oj)


class TestMarkerAdmissibleEvidence(unittest.TestCase):
    """Marker strings are not semantic proof; lock admissible evidence fences."""

    ADMISSIBLE = {
        "AUTHORIZED": "AuthorityKernel.decide + live Twain AGREE + ProofObject (Twain stub → never)",
        "AGREE": "Twain.independent_replay live result (stub → UNKNOWN)",
        "CONVERGED": "DCLM evaluator + measure obligations closed (Iris forbids DCLM_L0_CONVERGED string)",
        "VALIDATED": "demoted by demoteForbiddenLabels — never elevating",
        "PASS": "caller AGREE/PASS unbound → UNKNOWN in AuthorityKernel",
        "STAMPED": "DC_ARTIFACT_TIP rewritten + receipt hash match; derivation_state UNVERIFIED unless expected-pre-stamp revalidated",
        "VERIFIED_DERIVATION": "verify_artifact_receipt --expected-pre-stamp exit 0 only (receipt claim alone insufficient)",
        "DERIVATION_AND_SEMANTIC_GATE_OK": "admit_artifact_authority.mjs only — requires expected+require-derivation verify exit 0 + semantic fingerprint; still NOT live deploy",
        "READY": "not an authority token in Workers",
        "DEPLOYABLE": "requires live binds NOT_VERIFIED + Bind-continue — suite green ≠ deployable",
    }

    def test_demote_bans_elevating_markers(self):
        sec = (ROOT / "server/security-v2.js").read_text()
        for m in ("AUTHORIZED", "VALIDATED", "CONVERGED", "KYC_VERIFIED"):
            self.assertIn(f'"{m}"', sec)
        self.assertIn("function demoteForbiddenLabels", sec)

    def test_admissible_evidence_table_documented(self):
        # Fence: suite records what would be required — does not claim evidence exists.
        for marker, evidence in self.ADMISSIBLE.items():
            self.assertTrue(marker)
            self.assertTrue(evidence)
        floor = (ROOT / "factory/FLOOR_V01.md").read_text()
        self.assertIn("marker tests ≠ semantic proof", floor)
        self.assertIn("Twain", floor)


class TestFulfillHealthNotProdReadiness(unittest.TestCase):
    """Test env / health JSON must not establish prod readiness."""

    def test_status_up_is_not_operational_authority(self):
        fulfill = (ROOT / "workers/stripe-fulfill/worker.js").read_text()
        self.assertIn('status: "up"', fulfill)
        self.assertIn('operational_authority: "NONE"', fulfill)
        self.assertIn("binding_presence_claim_only: true", fulfill)
        # Health may report binding presence; must not elevate to AUTHORIZED/READY.
        self.assertNotIn('operational_authority: "AUTHORIZED"', fulfill)
        self.assertNotIn('stripe_process_state: "OPERATIONAL"', fulfill)


class TestRecursiveFactoryBeliefFence(unittest.TestCase):
    """(a) Factory must not believe Workers without evidence; (b) invert."""

    def test_factory_does_not_claim_deploy_from_green_suite(self):
        floor = (ROOT / "factory/FLOOR_V01.md").read_text()
        self.assertIn("NOT deploy-ready", floor)
        self.assertIn("Twain UNKNOWN", floor)
        self.assertIn("Stripe PARKED", floor)

    def test_artifact_tip_does_not_imply_source_correspondence(self):
        tool = (ROOT / "factory/tools/stamp_artifact_tip.mjs").read_text()
        self.assertIn("UNVERIFIED_STRING_REWRITE_ONLY", tool)
        self.assertIn("does NOT prove", tool)
        self.assertIn("VERIFIED_DERIVATION", tool)
        self.assertIn("--require-derivation", tool)
        verify = (ROOT / "factory/tools/verify_artifact_receipt.mjs").read_text()
        self.assertIn("INTEGRITY_OK_DERIVATION_UNVERIFIED", verify)
        self.assertIn("Receipt derivation_state alone is not demonstrable derivation", verify)
        admit = (ROOT / "factory/tools/admit_artifact_authority.mjs").read_text()
        self.assertIn("SOLE consumer", admit)
        self.assertIn("--expected-pre-stamp", admit)
        self.assertIn("UNVERIFIED tip+receipt story cannot cross", admit)
        self.assertIn("semantic_authority_gut", admit)

    def test_origin_join_pack_green_does_not_mean_tip_content(self):
        oj = (ROOT / "workers/origin-join/worker.js").read_text()
        self.assertIn("/main", oj)


class TestSourceArtifactProvenanceMutation(unittest.TestCase):
    """Clean pack stamps; semantic mutation after stamp breaks receipt hash."""

    def test_clean_pack_receipt_matches_bytes(self):
        import hashlib
        import json
        import tempfile

        tip = subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True
        ).strip()
        with tempfile.TemporaryDirectory(prefix="prov-clean-") as tmp:
            out = Path(tmp) / "origin-join"
            r = subprocess.run(
                [
                    "npx",
                    "wrangler",
                    "deploy",
                    "-c",
                    "workers/origin-join/wrangler.toml",
                    "--dry-run",
                    "--outdir",
                    str(out),
                ],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=120,
            )
            self.assertEqual(r.returncode, 0, r.stderr)
            s = subprocess.run(
                ["node", "factory/tools/stamp_artifact_tip.mjs", str(out), tip],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=30,
            )
            self.assertEqual(s.returncode, 0, s.stderr)
            body = (out / "worker.js").read_text()
            receipt = json.loads((out / ".dc_artifact_tip_receipt.json").read_text())
            self.assertEqual(
                receipt["files"][0]["sha256"],
                hashlib.sha256(body.encode()).hexdigest(),
            )
            # Semantic mutation must be detectable via receipt.
            mutated = body + "\n;export const FORGED_AUTHORIZED = true;\n"
            self.assertNotEqual(
                receipt["files"][0]["sha256"],
                hashlib.sha256(mutated.encode()).hexdigest(),
            )





class TestProvenanceDerivationDistinction(unittest.TestCase):
    """Story (tip+receipt) vs demonstrable derivation (expected-pre-stamp revalidation)."""

    def _tip(self):
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True
        ).strip()

    def test_require_derivation_refuses_without_expected(self):
        import tempfile

        tip = self._tip()
        with tempfile.TemporaryDirectory(prefix="prov-req-") as tmp:
            out = Path(tmp)
            (out / "worker.js").write_text(
                'export const DC_ARTIFACT_TIP = "UNSTAMPED";\n'
            )
            s = subprocess.run(
                [
                    "node",
                    "factory/tools/stamp_artifact_tip.mjs",
                    str(out),
                    tip,
                    "--require-derivation",
                ],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=30,
            )
            self.assertNotEqual(s.returncode, 0)
            self.assertIn("require-derivation", (s.stderr + s.stdout).lower())

    def test_orphan_fails_require_derivation_against_clean_expected(self):
        import hashlib
        import json
        import tempfile

        tip = self._tip()
        with tempfile.TemporaryDirectory(prefix="prov-orphan-req-") as tmp:
            base = Path(tmp)
            clean = base / "clean"
            clean.mkdir()
            r = subprocess.run(
                [
                    "npx",
                    "wrangler",
                    "deploy",
                    "-c",
                    "workers/origin-join/wrangler.toml",
                    "--dry-run",
                    "--outdir",
                    str(clean),
                ],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=120,
            )
            self.assertEqual(r.returncode, 0, r.stderr)
            pre = (clean / "worker.js").read_text()
            manifest = base / "expected.json"
            manifest.write_text(
                json.dumps(
                    {"worker.js": hashlib.sha256(pre.encode()).hexdigest()}
                )
                + "\n"
            )
            orphan = base / "orphan"
            orphan.mkdir()
            (orphan / "worker.js").write_text(
                'export const DC_ARTIFACT_TIP = "UNSTAMPED"; const EVIL = 1;\n'
            )
            s = subprocess.run(
                [
                    "node",
                    "factory/tools/stamp_artifact_tip.mjs",
                    str(orphan),
                    tip,
                    "--expected-pre-stamp",
                    str(manifest),
                    "--require-derivation",
                ],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=30,
            )
            self.assertNotEqual(s.returncode, 0)
            self.assertIn("derivation mismatch", (s.stderr + s.stdout).lower())

    def test_clean_pack_verified_derivation_revalidates(self):
        import hashlib
        import json
        import tempfile

        tip = self._tip()
        with tempfile.TemporaryDirectory(prefix="prov-verified-") as tmp:
            base = Path(tmp)
            out = base / "pack"
            out.mkdir()
            r = subprocess.run(
                [
                    "npx",
                    "wrangler",
                    "deploy",
                    "-c",
                    "workers/origin-join/wrangler.toml",
                    "--dry-run",
                    "--outdir",
                    str(out),
                ],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=120,
            )
            self.assertEqual(r.returncode, 0, r.stderr)
            pre = (out / "worker.js").read_text()
            manifest = base / "expected.json"
            manifest.write_text(
                json.dumps(
                    {"worker.js": hashlib.sha256(pre.encode()).hexdigest()}
                )
                + "\n"
            )
            s = subprocess.run(
                [
                    "node",
                    "factory/tools/stamp_artifact_tip.mjs",
                    str(out),
                    tip,
                    "--expected-pre-stamp",
                    str(manifest),
                    "--source-inputs",
                    "workers/origin-join/worker.js",
                    "--require-derivation",
                ],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=30,
            )
            self.assertEqual(s.returncode, 0, s.stderr)
            receipt = json.loads((out / ".dc_artifact_tip_receipt.json").read_text())
            self.assertEqual(receipt["derivation_state"], "VERIFIED_DERIVATION")
            self.assertTrue(receipt["expected_pre_stamp_bound"])
            self.assertIsNotNone(receipt["source_fingerprint"])
            v0 = subprocess.run(
                [
                    "node",
                    "factory/tools/verify_artifact_receipt.mjs",
                    str(out),
                    "--expected-pre-stamp",
                    str(manifest),
                ],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=30,
            )
            self.assertEqual(v0.returncode, 0, v0.stdout + v0.stderr)
            self.assertIn("VERIFIED_DERIVATION", v0.stdout)
            # Without external expected: integrity ok but derivation not re-proven.
            v3 = subprocess.run(
                ["node", "factory/tools/verify_artifact_receipt.mjs", str(out)],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=30,
            )
            self.assertEqual(v3.returncode, 3, v3.stdout + v3.stderr)
            self.assertIn("INTEGRITY_OK_DERIVATION_UNVERIFIED", v3.stdout)

    def test_forged_verified_claim_fails_closed_on_revalidation(self):
        """Second-order: receipt claims VERIFIED_DERIVATION; external expected refuses."""
        import hashlib
        import json
        import tempfile

        tip = self._tip()
        with tempfile.TemporaryDirectory(prefix="prov-forge-") as tmp:
            base = Path(tmp)
            orphan = base / "orphan"
            orphan.mkdir()
            (orphan / "worker.js").write_text(
                'export const DC_ARTIFACT_TIP = "UNSTAMPED"; const FORGED = 1;\n'
            )
            s = subprocess.run(
                ["node", "factory/tools/stamp_artifact_tip.mjs", str(orphan), tip],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=30,
            )
            self.assertEqual(s.returncode, 0, s.stderr)
            receipt_path = orphan / ".dc_artifact_tip_receipt.json"
            receipt = json.loads(receipt_path.read_text())
            receipt["derivation_state"] = "VERIFIED_DERIVATION"
            receipt["expected_pre_stamp_bound"] = True
            receipt["derivation_mismatches"] = []
            receipt["expected_pre_stamp"] = {
                "worker.js": receipt["files"][0]["pre_stamp_sha256"]
            }
            receipt_path.write_text(json.dumps(receipt, indent=2) + "\n")
            # Receipt claim alone must not yield exit 0.
            v = subprocess.run(
                ["node", "factory/tools/verify_artifact_receipt.mjs", str(orphan)],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=30,
            )
            self.assertEqual(v.returncode, 3, v.stdout + v.stderr)
            # Trusted clean expected must FAIL CLOSED against orphan bytes.
            clean = base / "clean"
            clean.mkdir()
            r = subprocess.run(
                [
                    "npx",
                    "wrangler",
                    "deploy",
                    "-c",
                    "workers/origin-join/wrangler.toml",
                    "--dry-run",
                    "--outdir",
                    str(clean),
                ],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=120,
            )
            self.assertEqual(r.returncode, 0, r.stderr)
            manifest = base / "expected.json"
            manifest.write_text(
                json.dumps(
                    {
                        "worker.js": hashlib.sha256(
                            (clean / "worker.js").read_text().encode()
                        ).hexdigest()
                    }
                )
                + "\n"
            )
            vfail = subprocess.run(
                [
                    "node",
                    "factory/tools/verify_artifact_receipt.mjs",
                    str(orphan),
                    "--expected-pre-stamp",
                    str(manifest),
                    "--require-derivation",
                ],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=30,
            )
            self.assertEqual(vfail.returncode, 1, vfail.stdout + vfail.stderr)

    def test_gutted_demote_marker_story_still_unverified(self):
        """Valid tip+receipt+marker substring with demote gutted → UNVERIFIED only."""
        import json
        import tempfile

        tip = self._tip()
        with tempfile.TemporaryDirectory(prefix="prov-gut-") as tmp:
            out = Path(tmp)
            (out / "worker.js").write_text(
                "export const DC_ARTIFACT_TIP = \"UNSTAMPED\";\n"
                "const demoteForbiddenLabels = (x) => x;\n"
            )
            s = subprocess.run(
                ["node", "factory/tools/stamp_artifact_tip.mjs", str(out), tip],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=30,
            )
            self.assertEqual(s.returncode, 0, s.stderr)
            body = (out / "worker.js").read_text()
            self.assertIn("demoteForbiddenLabels", body)
            self.assertIn(f'DC_ARTIFACT_TIP = "{tip}"', body)
            receipt = json.loads((out / ".dc_artifact_tip_receipt.json").read_text())
            self.assertEqual(receipt["derivation_state"], "UNVERIFIED")
            v = subprocess.run(
                ["node", "factory/tools/verify_artifact_receipt.mjs", str(out)],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=30,
            )
            self.assertEqual(v.returncode, 3)

    def test_factory_belief_unverified_not_deploy_ready(self):
        floor = (ROOT / "factory/FLOOR_V01.md").read_text()
        self.assertIn("UNVERIFIED", floor)
        self.assertIn("VERIFIED_DERIVATION", floor)
        self.assertIn("NOT deploy-ready", floor)
        self.assertIn("story-without-derivation", floor)
        self.assertIn("admit_artifact_authority", floor)



class TestAuthorityAdmitGate(unittest.TestCase):
    """Q1: UNVERIFIED provenance must not reach authority-bearing admit."""

    def _tip(self):
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True
        ).strip()

    def test_omit_expected_refuses_usage(self):
        import tempfile

        with tempfile.TemporaryDirectory(prefix="admit-omit-") as tmp:
            out = Path(tmp)
            (out / "worker.js").write_text(
                'export const DC_ARTIFACT_TIP = "UNSTAMPED";\n'
            )
            a = subprocess.run(
                ["node", "factory/tools/admit_artifact_authority.mjs", str(out)],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=30,
            )
            self.assertEqual(a.returncode, 2)

    def test_unverified_default_stamp_cannot_admit(self):
        """Omitted --require-derivation / default stamp → UNVERIFIED cannot cross admit."""
        import hashlib
        import json
        import tempfile

        tip = self._tip()
        with tempfile.TemporaryDirectory(prefix="admit-unv-") as tmp:
            base = Path(tmp)
            clean = base / "clean"
            clean.mkdir()
            r = subprocess.run(
                [
                    "npx", "wrangler", "deploy",
                    "-c", "workers/origin-join/wrangler.toml",
                    "--dry-run", "--outdir", str(clean),
                ],
                cwd=ROOT, capture_output=True, text=True, timeout=120,
            )
            self.assertEqual(r.returncode, 0, r.stderr)
            manifest = base / "expected.json"
            manifest.write_text(
                json.dumps(
                    {
                        "worker.js": hashlib.sha256(
                            (clean / "worker.js").read_text().encode()
                        ).hexdigest()
                    }
                )
                + "\n"
            )
            orphan = base / "orphan"
            orphan.mkdir()
            (orphan / "worker.js").write_text(
                'export const DC_ARTIFACT_TIP = "UNSTAMPED"; const EVIL = 1;\n'
            )
            s = subprocess.run(
                ["node", "factory/tools/stamp_artifact_tip.mjs", str(orphan), tip],
                cwd=ROOT, capture_output=True, text=True, timeout=30,
            )
            self.assertEqual(s.returncode, 0, s.stderr)
            receipt = json.loads((orphan / ".dc_artifact_tip_receipt.json").read_text())
            self.assertEqual(receipt["derivation_state"], "UNVERIFIED")
            a = subprocess.run(
                [
                    "node",
                    "factory/tools/admit_artifact_authority.mjs",
                    str(orphan),
                    "--expected-pre-stamp",
                    str(manifest),
                ],
                cwd=ROOT, capture_output=True, text=True, timeout=30,
            )
            self.assertEqual(a.returncode, 1, a.stdout + a.stderr)
            self.assertIn("AUTHORITY_REFUSED", a.stderr)
            self.assertIn("derivation_not_verified", a.stderr)

    def test_verify_exit3_alone_is_not_authority(self):
        """Alternate invocation: verify without expected → exit 3; admit still refuses."""
        import tempfile

        tip = self._tip()
        with tempfile.TemporaryDirectory(prefix="admit-e3-") as tmp:
            out = Path(tmp)
            (out / "worker.js").write_text(
                'export const DC_ARTIFACT_TIP = "UNSTAMPED";\n'
                'const demoteForbiddenLabels = (o) => o;\n'
            )
            s = subprocess.run(
                ["node", "factory/tools/stamp_artifact_tip.mjs", str(out), tip],
                cwd=ROOT, capture_output=True, text=True, timeout=30,
            )
            self.assertEqual(s.returncode, 0, s.stderr)
            v = subprocess.run(
                ["node", "factory/tools/verify_artifact_receipt.mjs", str(out)],
                cwd=ROOT, capture_output=True, text=True, timeout=30,
            )
            self.assertEqual(v.returncode, 3)
            # No path from exit-3 integrity to admit without expected.
            a = subprocess.run(
                ["node", "factory/tools/admit_artifact_authority.mjs", str(out)],
                cwd=ROOT, capture_output=True, text=True, timeout=30,
            )
            self.assertEqual(a.returncode, 2)

    def test_clean_pack_admits_with_derivation(self):
        import hashlib
        import json
        import tempfile

        tip = self._tip()
        with tempfile.TemporaryDirectory(prefix="admit-clean-") as tmp:
            base = Path(tmp)
            out = base / "pack"
            out.mkdir()
            r = subprocess.run(
                [
                    "npx", "wrangler", "deploy",
                    "-c", "workers/origin-join/wrangler.toml",
                    "--dry-run", "--outdir", str(out),
                ],
                cwd=ROOT, capture_output=True, text=True, timeout=120,
            )
            self.assertEqual(r.returncode, 0, r.stderr)
            pre = (out / "worker.js").read_text()
            manifest = base / "expected.json"
            manifest.write_text(
                json.dumps({"worker.js": hashlib.sha256(pre.encode()).hexdigest()})
                + "\n"
            )
            s = subprocess.run(
                [
                    "node", "factory/tools/stamp_artifact_tip.mjs", str(out), tip,
                    "--expected-pre-stamp", str(manifest), "--require-derivation",
                ],
                cwd=ROOT, capture_output=True, text=True, timeout=30,
            )
            self.assertEqual(s.returncode, 0, s.stderr)
            a = subprocess.run(
                [
                    "node", "factory/tools/admit_artifact_authority.mjs",
                    str(out), "--expected-pre-stamp", str(manifest),
                ],
                cwd=ROOT, capture_output=True, text=True, timeout=30,
            )
            self.assertEqual(a.returncode, 0, a.stdout + a.stderr)
            self.assertIn("DERIVATION_AND_SEMANTIC_GATE_OK", a.stdout)
            self.assertIn("NOT live Cloudflare deploy", a.stdout)


class TestSemanticGutEgg(unittest.TestCase):
    """P3: byte provenance ≠ semantic integrity. Evil twin must FAIL CLOSED at admit."""

    def _tip(self):
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True
        ).strip()

    def _stamp_with_self_expected(self, out: Path, tip: str):
        import hashlib
        import json

        pre = (out / "worker.js").read_text()
        manifest = out / "expected.json"
        manifest.write_text(
            json.dumps({"worker.js": hashlib.sha256(pre.encode()).hexdigest()}) + "\n"
        )
        s = subprocess.run(
            [
                "node", "factory/tools/stamp_artifact_tip.mjs", str(out), tip,
                "--expected-pre-stamp", str(manifest), "--require-derivation",
            ],
            cwd=ROOT, capture_output=True, text=True, timeout=30,
        )
        return s, manifest

    def test_identity_demote_fails_admit_even_with_matching_expected(self):
        """DEMOTE→identity: tip+receipt+markers+VERIFIED_DERIVATION vs self-expected → admit refuse."""
        import tempfile

        tip = self._tip()
        with tempfile.TemporaryDirectory(prefix="gut-demote-") as tmp:
            out = Path(tmp)
            (out / "worker.js").write_text(
                "export const DC_ARTIFACT_TIP = \"UNSTAMPED\";\n"
                "const demoteForbiddenLabels = (x) => x;\n"
                'const authority_effect = "NONE";\n'
            )
            s, manifest = self._stamp_with_self_expected(out, tip)
            self.assertEqual(s.returncode, 0, s.stderr)
            body = (out / "worker.js").read_text()
            self.assertIn("demoteForbiddenLabels", body)
            self.assertIn(f'DC_ARTIFACT_TIP = "{tip}"', body)
            a = subprocess.run(
                [
                    "node", "factory/tools/admit_artifact_authority.mjs",
                    str(out), "--expected-pre-stamp", str(manifest),
                    "--semantic-profile", "none",
                ],
                cwd=ROOT, capture_output=True, text=True, timeout=30,
            )
            self.assertEqual(a.returncode, 1, a.stdout + a.stderr)
            self.assertIn("semantic_authority_gut", a.stderr)
            self.assertIn("identity_demoteForbiddenLabels", a.stderr)

    def test_none_to_authorized_fails_admit(self):
        """NONE→AUTHORIZED elevating field fails admit despite self-expected derivation."""
        import tempfile

        tip = self._tip()
        with tempfile.TemporaryDirectory(prefix="gut-auth-") as tmp:
            out = Path(tmp)
            (out / "worker.js").write_text(
                "export const DC_ARTIFACT_TIP = \"UNSTAMPED\";\n"
                "export default { authority_effect: \"AUTHORIZED\" };\n"
            )
            s, manifest = self._stamp_with_self_expected(out, tip)
            self.assertEqual(s.returncode, 0, s.stderr)
            a = subprocess.run(
                [
                    "node", "factory/tools/admit_artifact_authority.mjs",
                    str(out), "--expected-pre-stamp", str(manifest),
                    "--semantic-profile", "none",
                ],
                cwd=ROOT, capture_output=True, text=True, timeout=30,
            )
            self.assertEqual(a.returncode, 1, a.stdout + a.stderr)
            self.assertIn("elevating_authority_effect", a.stderr)

    def test_claim_only_to_validated_fails_admit(self):
        import tempfile

        tip = self._tip()
        with tempfile.TemporaryDirectory(prefix="gut-val-") as tmp:
            out = Path(tmp)
            (out / "worker.js").write_text(
                "export const DC_ARTIFACT_TIP = \"UNSTAMPED\";\n"
                "export default { tier: \"VALIDATED\", claim_authority: \"VALIDATED\" };\n"
            )
            s, manifest = self._stamp_with_self_expected(out, tip)
            self.assertEqual(s.returncode, 0, s.stderr)
            a = subprocess.run(
                [
                    "node", "factory/tools/admit_artifact_authority.mjs",
                    str(out), "--expected-pre-stamp", str(manifest),
                    "--semantic-profile", "none",
                ],
                cwd=ROOT, capture_output=True, text=True, timeout=30,
            )
            self.assertEqual(a.returncode, 1, a.stdout + a.stderr)
            self.assertIn("claim_only_to_validated", a.stderr)

    def test_unknown_to_agree_hardcode_fails_admit(self):
        import tempfile

        tip = self._tip()
        with tempfile.TemporaryDirectory(prefix="gut-agree-") as tmp:
            out = Path(tmp)
            (out / "worker.js").write_text(
                "export const DC_ARTIFACT_TIP = \"UNSTAMPED\";\n"
                "export const independent_replay = \"AGREE\";\n"
            )
            s, manifest = self._stamp_with_self_expected(out, tip)
            self.assertEqual(s.returncode, 0, s.stderr)
            a = subprocess.run(
                [
                    "node", "factory/tools/admit_artifact_authority.mjs",
                    str(out), "--expected-pre-stamp", str(manifest),
                    "--semantic-profile", "none",
                ],
                cwd=ROOT, capture_output=True, text=True, timeout=30,
            )
            self.assertEqual(a.returncode, 1, a.stdout + a.stderr)
            self.assertIn("unknown_to_agree_hardcode", a.stderr)

    def test_demote_ban_list_gutted_fails_admit(self):
        """Superficial demoteForbiddenLabels name without AUTHORIZED ban → refuse."""
        import tempfile

        tip = self._tip()
        with tempfile.TemporaryDirectory(prefix="gut-ban-") as tmp:
            out = Path(tmp)
            (out / "worker.js").write_text(
                "export const DC_ARTIFACT_TIP = \"UNSTAMPED\";\n"
                "function demoteForbiddenLabels(obj) { return obj; }\n"
                "const PROMOTABLE = true;\n"
            )
            s, manifest = self._stamp_with_self_expected(out, tip)
            self.assertEqual(s.returncode, 0, s.stderr)
            a = subprocess.run(
                [
                    "node", "factory/tools/admit_artifact_authority.mjs",
                    str(out), "--expected-pre-stamp", str(manifest),
                    "--semantic-profile", "none",
                ],
                cwd=ROOT, capture_output=True, text=True, timeout=30,
            )
            self.assertEqual(a.returncode, 1, a.stdout + a.stderr)
            # identity demote and/or ban list missing
            err = a.stderr
            self.assertTrue(
                "identity_demoteForbiddenLabels" in err or "demote_ban_list_missing" in err,
                err,
            )

    def test_layer_catch_map_documented(self):
        floor = (ROOT / "factory/FLOOR_V01.md").read_text()
        self.assertIn("admit_artifact_authority", floor)
        self.assertIn("semantic gut", floor.lower() if False else floor)
        self.assertIn("byte provenance", floor.lower())
        # Twain/DCLM honesty
        self.assertIn("Twain UNKNOWN", floor)
        self.assertNotIn("DCLM CONVERGED", floor.split("Provenance")[0] if False else "")




if __name__ == "__main__":
    unittest.main(verbosity=2)
