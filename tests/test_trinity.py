import unittest
from autonomy.trinity import GateEvidence, TRINITY_POLICY_VERSION, decide

class TrinityGateTests(unittest.TestCase):
    def test_complete_unique_reviewed_evidence_passes(self):
        gates = ("authority", "integrity")
        evidence = (GateEvidence("authority", True, "artifact:a", "review:a"), GateEvidence("integrity", True, "artifact:b", "review:b"))
        result = decide(gates, evidence, required_policy_version=TRINITY_POLICY_VERSION, supplied_policy_version=TRINITY_POLICY_VERSION, owner_authorized=True)
        self.assertTrue(result.allowed)
        self.assertEqual(result.blockers, ())

    def test_unknown_missing_duplicate_or_unreviewed_evidence_blocks(self):
        gates = ("authority", "integrity")
        cases = (
            (GateEvidence("authority", True, "a", "r"),),
            (GateEvidence("authority", True, "a", "r"), GateEvidence("authority", True, "b", "r"), GateEvidence("integrity", True, "b", "r")),
            (GateEvidence("authority", True, "a", "r"), GateEvidence("integrity", True, "b", "")),
        )
        for evidence in cases:
            with self.subTest(evidence=evidence):
                result = decide(gates, evidence, required_policy_version=TRINITY_POLICY_VERSION, supplied_policy_version=TRINITY_POLICY_VERSION, owner_authorized=True)
                self.assertFalse(result.allowed)

    def test_policy_drift_and_missing_authority_block(self):
        evidence = (GateEvidence("authority", True, "a", "r"),)
        result = decide(("authority",), evidence, required_policy_version=TRINITY_POLICY_VERSION, supplied_policy_version="stale", owner_authorized=False)
        self.assertFalse(result.allowed)
        self.assertIn("policy_version_mismatch", result.blockers)
        self.assertIn("owner_authorization_missing", result.blockers)

    def test_malformed_records_and_non_boolean_pass_block(self):
        result = decide(("authority",), (GateEvidence("authority", 1, "a", "r"), "bad"), required_policy_version=TRINITY_POLICY_VERSION, supplied_policy_version=TRINITY_POLICY_VERSION, owner_authorized=True)
        self.assertFalse(result.allowed)
        self.assertIn("gate_not_passed:authority", result.blockers)
        self.assertIn("evidence_record_invalid:1", result.blockers)

if __name__ == "__main__": unittest.main()
