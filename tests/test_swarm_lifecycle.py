import unittest

from swarm_protocol import ProtocolError
from swarm_lifecycle import initiate_work, record_finding, validate_finding


class AutonomousWorkTests(unittest.TestCase):
    def setUp(self):
        self.item = initiate_work(
            task_id="autonomous-task-1",
            worker_id="scout-7",
            worker_role="scout",
            scope="Inspect repository routes read-only; propose findings only.",
        )

    def test_worker_can_self_initiate_without_assignment(self):
        self.assertEqual(self.item.status, "PROPOSED")
        self.assertEqual(self.item.originator_id, "scout-7")

    def test_finding_stays_unverified_until_independent_validation(self):
        claim = record_finding(
            self.item, author_id="scout-7",
            statement="Route exists in source",
            evidence_refs=["src/routes.py#L10"],
        )
        self.assertEqual(claim["truth_status"], "UNVERIFIED")
        with self.assertRaisesRegex(ProtocolError, "SELF_VALIDATION_FORBIDDEN"):
            validate_finding(
                self.item, claim_id=claim["claim_id"], validator_id="scout-7",
                verdict="PASS", evidence_refs=["src/routes.py#L10"],
            )

    def test_independent_validator_can_verify_with_evidence(self):
        claim = record_finding(
            self.item, author_id="scout-7",
            statement="Route exists in source",
            evidence_refs=["src/routes.py#L10"],
        )
        result = validate_finding(
            self.item, claim_id=claim["claim_id"], validator_id="verifier-2",
            verdict="PASS", evidence_refs=["test-route-presence:passed"],
        )
        self.assertEqual(result["truth_status"], "VERIFIED")
        self.assertEqual(self.item.status, "VALIDATED")

    def test_failed_validation_rejects_claim(self):
        claim = record_finding(
            self.item, author_id="scout-7",
            statement="Route exists in source",
            evidence_refs=["src/routes.py#L10"],
        )
        result = validate_finding(
            self.item, claim_id=claim["claim_id"], validator_id="verifier-2",
            verdict="FAIL", evidence_refs=["route-check:failed"],
        )
        self.assertEqual(result["truth_status"], "REJECTED")

    def test_empty_scope_is_rejected(self):
        with self.assertRaisesRegex(ProtocolError, "INITIATIVE_SCOPE_REQUIRED"):
            initiate_work(task_id="x", worker_id="scout", worker_role="scout", scope=" ")

    def test_missing_verification_evidence_is_rejected(self):
        claim = record_finding(
            self.item, author_id="scout-7", statement="Found something",
            evidence_refs=[],
        )
        with self.assertRaisesRegex(ProtocolError, "VERIFICATION_EVIDENCE_REQUIRED"):
            validate_finding(
                self.item, claim_id=claim["claim_id"], validator_id="verifier-2",
                verdict="PASS", evidence_refs=[],
            )


if __name__ == "__main__":
    unittest.main()
