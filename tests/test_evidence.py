"""Tests for bounded deterministic evidence envelopes and secret redaction."""
import unittest

from autonomy.evidence import (
    MAX_ENVELOPE_BYTES,
    create_evidence_envelope,
    redact,
)


class EvidenceTests(unittest.TestCase):
    def test_envelope_is_deterministic_for_equivalent_mappings(self):
        first = create_evidence_envelope(
            task_id="task-1", outcome="succeeded",
            evidence={"z": 2, "a": {"ok": True}},
        )
        second = create_evidence_envelope(
            task_id="task-1", outcome="succeeded",
            evidence={"a": {"ok": True}, "z": 2},
        )
        self.assertEqual(first.canonical_json, second.canonical_json)
        self.assertEqual(first.sha256, second.sha256)
        self.assertEqual(len(first.sha256), 64)

    def test_secret_keys_are_redacted_recursively(self):
        clean = redact({
            "password": "do-not-leak",
            "nested": {"github_token": "ghp_abcdefghijklmnop123456"},
            "safe": "visible",
        })
        self.assertEqual(clean["password"], "[REDACTED]")
        self.assertEqual(clean["nested"]["github_token"], "[REDACTED]")
        self.assertEqual(clean["safe"], "visible")
        self.assertNotIn("do-not-leak", repr(clean))

    def test_bearer_and_inline_key_patterns_are_redacted(self):
        clean = redact({
            "message": "request failed with Bearer abc.def-123 and api_key=supersecretvalue"
        })
        self.assertNotIn("abc.def-123", clean["message"])
        self.assertNotIn("supersecretvalue", clean["message"])
        self.assertIn("[REDACTED]", clean["message"])

    def test_unsupported_values_do_not_call_arbitrary_string_methods(self):
        class Dangerous:
            def __str__(self):
                raise AssertionError("must not call user-defined __str__")
        self.assertEqual(redact(Dangerous()), "[UNSUPPORTED:Dangerous]")

    def test_deep_payload_is_bounded(self):
        value = {"leaf": True}
        for _ in range(20):
            value = {"child": value}
        self.assertIn("TRUNCATED:MAX_DEPTH", repr(redact(value)))

    def test_large_envelope_fails_closed(self):
        with self.assertRaises(ValueError):
            create_evidence_envelope(
                task_id="task-1", outcome="succeeded",
                evidence={"data": "x" * MAX_ENVELOPE_BYTES},
            )

    def test_required_identity_and_outcome_are_validated(self):
        with self.assertRaises(ValueError):
            create_evidence_envelope(task_id=" ", outcome="succeeded", evidence={})
        with self.assertRaises(ValueError):
            create_evidence_envelope(task_id="task-1", outcome="maybe", evidence={})

    def test_unsupported_objects_and_nonfinite_numbers_are_json_safe(self):
        clean = redact({"value": object(), "infinity": float("inf")})
        self.assertIn("UNSUPPORTED:object", clean["value"])
        envelope = create_evidence_envelope(
            task_id="task-1", outcome="unknown", evidence=clean
        )
        self.assertEqual(len(envelope.sha256), 64)


if __name__ == "__main__":
    unittest.main()
