"""Adversarial tests for reviewer attestation trust boundaries.

The verifier below is a test double, not cryptography. Production verification
must use a reviewed signature implementation and managed public-key trust roots.
"""
import unittest
from datetime import datetime, timedelta, timezone

from autonomy.attestations import (
    ReviewerAttestation,
    canonical_signed_payload,
    verify_reviewer_attestation,
)


class AttestationTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 10, 20, 16, 0, tzinfo=timezone.utc)
        self.attestation = ReviewerAttestation(
            attestation_id="att-001",
            subject_digest="a" * 64,
            reviewer_id="reviewer-1",
            key_id="key-1",
            policy_version="trinity-v1",
            decision="approve",
            issued_at=(self.now - timedelta(minutes=1)).isoformat(),
            expires_at=(self.now + timedelta(hours=1)).isoformat(),
            signature="test-signature",
        )
        self.trusted_keys = {"key-1": "reviewer-1"}

    def verify(self, attestation=None, **overrides):
        args = {
            "trusted_keys": self.trusted_keys,
            "signature_verifier": lambda key, payload, signature: (
                key == "key-1" and signature == "test-signature"
                and payload == canonical_signed_payload(self.attestation)
            ),
            "expected_subject_digest": "a" * 64,
            "required_policy_version": "trinity-v1",
            "now": self.now,
        }
        args.update(overrides)
        return verify_reviewer_attestation(attestation or self.attestation, **args)

    def test_valid_attestation_is_bound_to_subject_and_policy(self):
        result = self.verify()
        self.assertTrue(result.verified)
        self.assertEqual(result.blockers, ())
        self.assertTrue(result.signed_payload)

    def test_wrong_subject_digest_fails_closed(self):
        result = self.verify(expected_subject_digest="b" * 64)
        self.assertFalse(result.verified)
        self.assertIn("subject_digest_mismatch", result.blockers)

    def test_policy_drift_fails_closed(self):
        result = self.verify(required_policy_version="trinity-v2")
        self.assertIn("policy_version_mismatch", result.blockers)

    def test_untrusted_or_misbound_key_fails_closed(self):
        result = self.verify(trusted_keys={"key-1": "someone-else"})
        self.assertIn("reviewer_key_untrusted", result.blockers)

    def test_expired_or_overlong_attestation_fails_closed(self):
        expired = ReviewerAttestation(**{
            **self.attestation.__dict__,
            "expires_at": (self.now - timedelta(seconds=1)).isoformat(),
        })
        self.assertIn("attestation_expired", self.verify(expired).blockers)
        long_lived = ReviewerAttestation(**{
            **self.attestation.__dict__,
            "expires_at": (self.now + timedelta(days=32)).isoformat(),
        })
        self.assertIn("attestation_lifetime_invalid", self.verify(long_lived).blockers)

    def test_signature_must_verify_exact_canonical_payload(self):
        changed = ReviewerAttestation(**{
            **self.attestation.__dict__, "decision": "reject"
        })
        result = self.verify(changed)
        self.assertFalse(result.verified)
        self.assertIn("signature_verification_failed", result.blockers)

    def test_reviewer_rejection_never_passes(self):
        rejected = ReviewerAttestation(**{
            **self.attestation.__dict__, "decision": "reject"
        })
        result = self.verify(
            rejected,
            signature_verifier=lambda key, payload, signature: True,
        )
        self.assertFalse(result.verified)
        self.assertIn("reviewer_rejected_subject", result.blockers)

    def test_naive_time_and_malformed_attestation_fail_closed(self):
        result = self.verify(now=datetime(2026, 10, 20, 16, 0))
        self.assertIn("verification_time_must_be_timezone_aware", result.blockers)
        self.assertFalse(verify_reviewer_attestation(
            None,
            trusted_keys=self.trusted_keys,
            signature_verifier=lambda *_: True,
            expected_subject_digest="a" * 64,
            required_policy_version="trinity-v1",
            now=self.now,
        ).verified)

    def test_signature_verifier_exception_fails_closed(self):
        result = self.verify(signature_verifier=lambda *_: (_ for _ in ()).throw(RuntimeError("no")))
        self.assertIn("signature_verification_failed", result.blockers)


if __name__ == "__main__":
    unittest.main()
