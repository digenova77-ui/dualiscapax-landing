import copy
import unittest

from domain_architecture import (
    CORRELATION_TYPES,
    evaluate_gate,
    load_seed,
    validate_correlation,
    validate_seed,
)
from swarm_protocol import LAWS, ROLES, ProtocolError


def reviews(**overrides):
    result = {
        "philosophy": {"verdict": "SUPPORT"},
        "physics": {"verdict": "SUPPORT"},
        "law": {"verdict": "SUPPORT"},
    }
    result.update(overrides)
    return result


class DomainArchitectureTests(unittest.TestCase):
    def test_canonical_seed_has_three_distinct_rings_and_two_pipelines(self):
        seed = load_seed()
        self.assertEqual(len(seed["rings"]), 3)
        self.assertEqual({ring["key"] for ring in seed["rings"]}, {"philosophy", "physics", "law"})
        self.assertEqual({pipe["key"] for pipe in seed["pipelines"]}, {
            "discovery_execution", "independent_validation"
        })
        self.assertFalse(seed["invariants"]["live_actuators_enabled_by_seed"])
        self.assertEqual(list(LAWS), seed["governing_laws"])
        self.assertEqual(ROLES, set(seed["roles"]))
        self.assertEqual(seed["event_protocol"], "dualis.swarm.event.v1")

    def test_seed_rejects_removed_ring(self):
        seed = copy.deepcopy(load_seed())
        seed["rings"].pop()
        with self.assertRaisesRegex(ProtocolError, "SEED_REQUIRES_EXACTLY_THREE_RINGS"):
            validate_seed(seed)

    def test_seed_rejects_disabled_independent_validation(self):
        seed = copy.deepcopy(load_seed())
        seed["invariants"]["independent_validation_required"] = False
        with self.assertRaisesRegex(ProtocolError, "SEED_REQUIRED_INVARIANT_DISABLED"):
            validate_seed(seed)

    def test_correlation_requires_typed_cross_domain_link(self):
        correlation = {
            "correlation_id": "corr-1",
            "source_domain": "light",
            "target_domain": "logic",
            "type": "MATHEMATICAL_CORRESPONDENCE",
            "claim": "A specified transformation is represented in both models.",
            "evidence_refs": ["model:optics-1", "proof:logic-1"],
            "status": "PROPOSED",
        }
        self.assertEqual(validate_correlation(correlation)["type"], "MATHEMATICAL_CORRESPONDENCE")
        self.assertEqual(set(CORRELATION_TYPES), {
            "PHYSICAL_COUPLING", "MATHEMATICAL_CORRESPONDENCE",
            "EMPIRICAL_HYPOTHESIS", "PHILOSOPHICAL_CORRESPONDENCE",
        })

    def test_correlation_cannot_claim_supported_without_validation_refs(self):
        correlation = {
            "correlation_id": "corr-2",
            "source_domain": "light",
            "target_domain": "logic",
            "type": "EMPIRICAL_HYPOTHESIS",
            "claim": "Unverified claim.",
            "evidence_refs": ["observation:1"],
            "status": "SUPPORTED",
        }
        with self.assertRaisesRegex(ProtocolError, "SUPPORTED_CORRELATION_REQUIRES_VALIDATION_REFS"):
            validate_correlation(correlation)

    def test_missing_ring_blocks_with_exact_primitive(self):
        result = evaluate_gate(
            ring_reviews={"philosophy": {"verdict": "SUPPORT"}, "physics": {"verdict": "SUPPORT"}},
            independent_validation={"verdict": "PASS"},
            authorized=True,
        )
        self.assertEqual(result["decision"], "BLOCKED_WITH_EXACT_MISSING_PRIMITIVE")
        self.assertEqual(result["missing_primitive"], "ring_review:law")
        self.assertFalse(result["execution_authorized"])

    def test_missing_authorization_blocks(self):
        result = evaluate_gate(
            ring_reviews=reviews(),
            independent_validation={"verdict": "PASS"},
            authorized=False,
        )
        self.assertEqual(result["decision"], "BLOCKED_WITH_EXACT_MISSING_PRIMITIVE")
        self.assertEqual(result["missing_primitive"], "explicit_authorization")

    def test_material_challenge_is_not_outvoted(self):
        result = evaluate_gate(
            ring_reviews=reviews(physics={"verdict": "CHALLENGE"}),
            independent_validation={"verdict": "PASS"},
            authorized=True,
        )
        self.assertEqual(result["decision"], "UNRESOLVED")

    def test_not_applicable_requires_reason(self):
        with self.assertRaisesRegex(ProtocolError, "NOT_APPLICABLE_REQUIRES_REASON:physics"):
            evaluate_gate(
                ring_reviews=reviews(physics={"verdict": "NOT_APPLICABLE_WITH_REASON"}),
                independent_validation={"verdict": "PASS"},
                authorized=True,
            )

    def test_accept_does_not_grant_execution_authority(self):
        result = evaluate_gate(
            ring_reviews=reviews(),
            independent_validation={"verdict": "PASS"},
            authorized=True,
        )
        self.assertEqual(result["decision"], "ACCEPT")
        self.assertFalse(result["execution_authorized"])

    def test_independent_failure_declines(self):
        result = evaluate_gate(
            ring_reviews=reviews(),
            independent_validation={"verdict": "FAIL"},
            authorized=True,
        )
        self.assertEqual(result["decision"], "DECLINE")


if __name__ == "__main__":
    unittest.main()
