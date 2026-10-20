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
        self.assertEqual(redact({"privateKey": "never-log", "accessToken": "never-log"})["privateKey"], "[REDACTED]")
        self.assertEqual(redact({"privateKey": "never-log", "accessToken": "never-log"})["accessToken"], "[REDACTED]")
        self.assertEqual(clean["safe"], "visible")
        self.assertNotIn("do-not-leak", repr(clean))

    def test_bearer_and_inline_key_patterns_are_redacted(self):
        clean = redact({
            "message": "request failed with Bearer abc.def-123 and api_key=supersecretvalue"
        })
        self.assertNotIn("abc.def-123", clean["message"])
        self.assertNotIn("supersecretvalue", clean["message"])
        self.assertIn("[REDACTED]", clean["message"])
        for token in ("AKIAABCDEFGHIJKLMNOP", "glpat-abcdefghijklmnop", "xoxb-123456789012345"):
            with self.subTest(token=token):
                self.assertNotIn(token, redact({"log": "credential=" + token})["log"])

    def test_unsupported_values_do_not_call_arbitrary_string_methods(self):
        class Dangerous:
            def __str__(self):
                raise AssertionError("must not call user-defined __str__")
        self.assertEqual(redact(Dangerous()), "[UNSUPPORTED:Dangerous]")

    def test_deep_payload_is_bounded_for_diagnostic_redaction(self):
        value = {"leaf": True}
        for _ in range(20):
            value = {"child": value}
        self.assertIn("TRUNCATED:MAX_DEPTH", repr(redact(value)))
        with self.assertRaises(ValueError):
            create_evidence_envelope(task_id="t", outcome="succeeded", evidence=value)

    def test_large_envelope_fails_closed(self):
        with self.assertRaises(ValueError):
            create_evidence_envelope(
                task_id="t" * (MAX_ENVELOPE_BYTES + 1), outcome="succeeded",
                evidence={},
            )

    def test_required_identity_and_outcome_are_validated(self):
        for task_id in (" ", 42, None, "t" * 257):
            with self.subTest(task_id=repr(task_id)), self.assertRaises(ValueError):
                create_evidence_envelope(task_id=task_id, outcome="succeeded", evidence={})
        for outcome in ("maybe", [], None):
            with self.subTest(outcome=repr(outcome)), self.assertRaises(ValueError):
                create_evidence_envelope(task_id="task-1", outcome=outcome, evidence={})

    def test_unsupported_objects_and_nonfinite_numbers_rejected_for_envelopes(self):
        for value in (object(), float("inf"), float("nan"), {1: "non-string key"}):
            with self.subTest(value=repr(value)), self.assertRaises(ValueError):
                create_evidence_envelope(task_id="task-1", outcome="unknown", evidence={"value": value})
        self.assertEqual(redact({"value": object()})["value"], "[UNSUPPORTED:object]")

    def test_redaction_key_collisions_are_rejected(self):
        # Both input keys normalize to the same output key after redaction.
        with self.assertRaises(ValueError):
            create_evidence_envelope(
                task_id="task-1", outcome="succeeded",
                evidence={"api_key=one": "first", "api_key=two": "second"},
            )

    def test_string_and_item_limits_fail_closed(self):
        with self.assertRaises(ValueError):
            create_evidence_envelope(task_id="t", outcome="succeeded", evidence={"x": "a" * 8193})
        with self.assertRaises(ValueError):
            create_evidence_envelope(task_id="t", outcome="succeeded", evidence=list(range(1001)))


if __name__ == "__main__":
    unittest.main()
