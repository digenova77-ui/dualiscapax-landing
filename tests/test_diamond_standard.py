import unittest

from autonomy.diamond_standard import (
    REQUIREMENTS, STANDARD_ID, RequirementEvidence, evaluate_conformance,
)


class DiamondStandardTests(unittest.TestCase):
    def setUp(self):
        self.evidence = tuple(
            RequirementEvidence(name, "PASS", f"test-artifact:{name}", f"review:{name}")
            for name in REQUIREMENTS
        )
        self.kwargs = dict(
            required_policy_version="trinity-diamond-v1",
            supplied_policy_version="trinity-diamond-v1",
            owner_authorized=True,
        )

    def test_complete_conformance_evidence_passes(self):
        report = evaluate_conformance(self.evidence, **self.kwargs)
        self.assertEqual(report.standard_id, STANDARD_ID)
        self.assertEqual(report.score, 100)
        self.assertTrue(report.passed)
        self.assertEqual(report.blockers, ())

    def test_unknown_or_missing_requirement_blocks_even_at_high_score(self):
        report = evaluate_conformance(self.evidence[:-1], **self.kwargs)
        self.assertFalse(report.passed)
        self.assertIn("requirement_missing:scientific_validity", report.blockers)

    def test_failed_unknown_or_duplicate_requirement_blocks(self):
        items = list(self.evidence)
        items[0] = RequirementEvidence("authority_fail_closed", "UNKNOWN", "test", "review")
        items.append(self.evidence[0])
        items.append(RequirementEvidence("made_up", "PASS", "test", "review"))
        report = evaluate_conformance(tuple(items), **self.kwargs)
        self.assertFalse(report.passed)
        self.assertTrue(any(x.startswith("requirement_not_passed:authority_fail_closed") for x in report.blockers))
        self.assertIn("duplicate_requirement:authority_fail_closed", report.blockers)
        self.assertTrue(any(x.startswith("unknown_requirement:") for x in report.blockers))

    def test_missing_evidence_reviewer_authority_or_policy_blocks(self):
        items = list(self.evidence)
        items[0] = RequirementEvidence("authority_fail_closed", "PASS", "", "review")
        report = evaluate_conformance(tuple(items), **self.kwargs)
        self.assertFalse(report.passed)
        self.assertIn("evidence_reference_missing:authority_fail_closed", report.blockers)
        report = evaluate_conformance(self.evidence, **{**self.kwargs, "owner_authorized": False})
        self.assertFalse(report.passed)
        self.assertIn("owner_authorization_missing", report.blockers)
        report = evaluate_conformance(self.evidence, **{**self.kwargs, "supplied_policy_version": "old"})
        self.assertFalse(report.passed)
        self.assertIn("policy_version_mismatch", report.blockers)

    def test_malformed_inputs_fail_closed(self):
        report = evaluate_conformance(None, **self.kwargs)
        self.assertFalse(report.passed)
        self.assertIn("evidence_collection_invalid", report.blockers)
        report = evaluate_conformance(self.evidence + ("bad",), **self.kwargs)
        self.assertFalse(report.passed)
        self.assertIn("evidence_record_invalid:8", report.blockers)


if __name__ == "__main__":
    unittest.main()
