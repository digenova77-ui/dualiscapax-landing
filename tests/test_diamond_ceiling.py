import unittest

from autonomy.diamond_ceiling import (
    DIMENSIONS, DimensionEvidence, assess_diamond_ceiling,
)


class DiamondCeilingTests(unittest.TestCase):
    def setUp(self):
        self.evidence = tuple(
            DimensionEvidence(name, True, f"evidence:{name}", f"review:{name}")
            for name in DIMENSIONS
        )
        self.kwargs = dict(
            required_policy_version="trinity-diamond-v1",
            supplied_policy_version="trinity-diamond-v1",
            owner_authorized=True,
        )

    def test_complete_reviewed_evidence_reaches_ceiling(self):
        result = assess_diamond_ceiling(self.evidence, **self.kwargs)
        self.assertEqual(result.score, 100)
        self.assertTrue(result.ceiling_reached)
        self.assertEqual(result.blockers, ())

    def test_high_coverage_never_bypasses_missing_authority(self):
        result = assess_diamond_ceiling(
            self.evidence, **{**self.kwargs, "owner_authorized": False}
        )
        self.assertEqual(result.score, 100)
        self.assertFalse(result.ceiling_reached)
        self.assertIn("owner_authorization_missing", result.blockers)

    def test_policy_drift_blocks_ceiling(self):
        result = assess_diamond_ceiling(
            self.evidence, **{**self.kwargs, "supplied_policy_version": "old"}
        )
        self.assertFalse(result.ceiling_reached)
        self.assertIn("policy_version_mismatch", result.blockers)

    def test_missing_dimension_and_evidence_fail_closed(self):
        result = assess_diamond_ceiling(self.evidence[:-1], **self.kwargs)
        self.assertFalse(result.ceiling_reached)
        self.assertIn("dimension_missing:scientific_validity", result.blockers)
        bad = list(self.evidence)
        bad[0] = DimensionEvidence("authority", True, "", "review:authority")
        result = assess_diamond_ceiling(tuple(bad), **self.kwargs)
        self.assertFalse(result.ceiling_reached)
        self.assertIn("evidence_reference_missing:authority", result.blockers)

    def test_failed_dimension_and_missing_reviewer_block(self):
        items = list(self.evidence)
        items[2] = DimensionEvidence("mesh_integrity", False, "evidence:mesh", "review:mesh")
        result = assess_diamond_ceiling(tuple(items), **self.kwargs)
        self.assertFalse(result.ceiling_reached)
        self.assertIn("dimension_not_passed:mesh_integrity", result.blockers)
        items[2] = DimensionEvidence("mesh_integrity", True, "evidence:mesh", "")
        result = assess_diamond_ceiling(tuple(items), **self.kwargs)
        self.assertIn("reviewer_reference_missing:mesh_integrity", result.blockers)

    def test_duplicate_or_unknown_dimensions_are_rejected(self):
        result = assess_diamond_ceiling(
            self.evidence + (self.evidence[0], DimensionEvidence("magic", True, "e", "r")),
            **self.kwargs,
        )
        self.assertFalse(result.ceiling_reached)
        self.assertTrue(any(x.startswith("duplicate_dimension:") for x in result.blockers))
        self.assertIn("unknown_dimension:magic", result.blockers)

    def test_malformed_evidence_inputs_fail_closed_without_crashing(self):
        result = assess_diamond_ceiling(
            None, **self.kwargs
        )
        self.assertFalse(result.ceiling_reached)
        self.assertIn("evidence_collection_invalid", result.blockers)
        result = assess_diamond_ceiling(
            self.evidence + ("not-an-evidence-record",), **self.kwargs
        )
        self.assertFalse(result.ceiling_reached)
        self.assertIn("evidence_record_invalid:5", result.blockers)
        result = assess_diamond_ceiling(
            self.evidence, **{**self.kwargs, "required_policy_version": None}
        )
        self.assertFalse(result.ceiling_reached)
        self.assertIn("required_policy_version_missing", result.blockers)

    def test_score_is_coverage_not_permission(self):
        evidence = tuple(
            DimensionEvidence(name, True, f"evidence:{name}", f"review:{name}")
            for name in DIMENSIONS
        )
        result = assess_diamond_ceiling(
            evidence, **{**self.kwargs, "required_policy_version": ""}
        )
        self.assertEqual(result.score, 100)
        self.assertFalse(result.ceiling_reached)
        self.assertIn("required_policy_version_missing", result.blockers)


if __name__ == "__main__":
    unittest.main()
