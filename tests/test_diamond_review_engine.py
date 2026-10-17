import unittest

from diamond_review_engine import run_diamond_review, validate_coverage, validate_observation
from swarm_protocol import ProtocolError


def observation(**overrides):
    value = {
        "record_id": "obs-001",
        "axis_id": "AXIS-EM",
        "channel": "visible-light-imaging",
        "source": "provided-test-fixture",
        "observed_at": "2026-10-17T00:00:00Z",
        "value_or_payload": {"relative_intensity": 0.5},
        "units_or_encoding": "normalized_relative_intensity",
        "method": "fixture",
        "calibration_or_method_version": "fixture-v1",
        "uncertainty": {"type": "declared_fixture_value"},
        "detection_limits": {"type": "declared_fixture_value"},
        "evidence_state": "OBSERVED",
    }
    value.update(overrides)
    return value


def coverage(status="MEASURED", refs=None, domain="optics", observable="visible_band"):
    return {
        "domain_id": domain,
        "observable": observable,
        "status": status,
        "method_or_reason": "fixture-only coverage declaration",
        "evidence_refs": refs if refs is not None else (["obs-001"] if status == "MEASURED" else []),
    }


def rings(**overrides):
    result = {
        "philosophy": {"verdict": "SUPPORT", "reason": "Claim scope is defined."},
        "physics": {"verdict": "SUPPORT", "reason": "Measurement fields are supplied."},
        "law": {"verdict": "SUPPORT", "reason": "Declared invariants are respected."},
    }
    result.update(overrides)
    return result


def validation(verdict="PASS", refs=None):
    return {"verdict": verdict, "evidence_refs": refs if refs is not None else ["independent-review:fixture-1"]}


class DiamondReviewEngineTests(unittest.TestCase):
    def test_complete_declared_scope_is_not_claimed_as_universal_truth(self):
        result = run_diamond_review(
            claim="Fixture claim for a bounded review.",
            observations=[observation()],
            coverage=[coverage()],
            ring_reviews=rings(),
            independent_validation=validation(),
        )
        self.assertEqual(result["disposition"], "REVIEW_COMPLETE_WITHIN_DECLARED_SCOPE")
        self.assertFalse(result["coverage_inventory_is_exhaustive"])
        self.assertEqual(result["authority"], "NONE")
        self.assertFalse(result["live_actuator"])
        self.assertEqual(len(result["review_hash"]), 64)

    def test_missing_ring_returns_exact_missing_primitive(self):
        result = run_diamond_review(
            claim="Bounded fixture claim.",
            observations=[observation()],
            coverage=[coverage()],
            ring_reviews={"philosophy": rings()["philosophy"], "physics": rings()["physics"]},
            independent_validation=validation(),
        )
        self.assertEqual(result["disposition"], "BLOCKED_WITH_EXACT_MISSING_PRIMITIVE")
        self.assertIn("ring_review:law", result["missing_primitives"])

    def test_unknown_coverage_blocks_completion(self):
        result = run_diamond_review(
            claim="Bounded fixture claim.",
            observations=[observation()],
            coverage=[coverage(status="UNKNOWN", refs=[])],
            ring_reviews=rings(),
            independent_validation=validation(),
        )
        self.assertEqual(result["disposition"], "BLOCKED_WITH_EXACT_MISSING_PRIMITIVE")
        self.assertIn("coverage:optics::visible_band", result["missing_primitives"])

    def test_simulation_cannot_be_called_observed(self):
        with self.assertRaisesRegex(ProtocolError, "SIMULATION_CANNOT_BE_LABELED_DIRECT_OBSERVATION"):
            validate_observation(observation(signal_class="SIMULATION_OUTPUT"))

    def test_independently_validated_observation_requires_refs(self):
        with self.assertRaisesRegex(ProtocolError, "OBSERVATION_VALIDATION_REFS_REQUIRED"):
            validate_observation(observation(evidence_state="INDEPENDENTLY_VALIDATED"))

    def test_measured_coverage_requires_evidence(self):
        with self.assertRaisesRegex(ProtocolError, "MEASURED_COVERAGE_REQUIRES_EVIDENCE"):
            validate_coverage(coverage(status="MEASURED", refs=[]))

    def test_challenge_is_not_voted_away(self):
        result = run_diamond_review(
            claim="Bounded fixture claim.",
            observations=[observation()],
            coverage=[coverage()],
            ring_reviews=rings(physics={"verdict": "CHALLENGE", "reason": "Fixture evidence conflicts."}),
            independent_validation=validation(),
        )
        self.assertEqual(result["disposition"], "DECLINE")
        self.assertIn("ring_challenge_resolution:physics", result["missing_primitives"])

    def test_pass_number_must_be_positive(self):
        with self.assertRaisesRegex(ProtocolError, "PASS_NUMBER_MUST_BE_POSITIVE_INTEGER"):
            run_diamond_review(
                claim="Bounded fixture claim.",
                observations=[],
                coverage=[coverage()],
                ring_reviews=rings(),
                independent_validation=validation(),
                pass_number=0,
            )


if __name__ == "__main__":
    unittest.main()
