"""Standard-library tests for strict seed manifest validation."""
import hashlib
import json
import unittest
from pathlib import Path

from seed_verifier import (
    ManifestError,
    canonical_bytes,
    commitment_sha256,
    parse_manifest,
    parse_canonical_manifest,
    verification_report,
)

BASE = {
    "model_id": "hydrogen.reference.v1",
    "schema_version": "dualis.seed.v1",
    "state": {"n": 1, "ell": 0, "m": 0},
    "rules": ["nonrelativistic-coulomb"],
    "units": {"length": "bohr_radius", "energy": "hartree"},
    "precision": "exact-integer-quantum-numbers; numeric outputs require declared tolerance",
    "boundary_conditions": ["bound-state", "r>=0"],
    "observables": ["radial_probability_density"],
    "invariants": ["radial_normalization"],
    "limits": ["no-fine-structure", "no-QED", "no-recoil"],
}


class SeedVerifierTests(unittest.TestCase):
    def test_key_order_does_not_change_canonical_bytes(self):
        a = dict(BASE)
        b = dict(reversed(list(BASE.items())))
        self.assertEqual(canonical_bytes(a), canonical_bytes(b))
        self.assertEqual(commitment_sha256(a), commitment_sha256(b))

    def test_mutation_changes_commitment(self):
        a = dict(BASE)
        b = dict(BASE)
        b["model_id"] = "hydrogen.reference.v2"
        self.assertNotEqual(commitment_sha256(a), commitment_sha256(b))

    def test_duplicate_keys_rejected(self):
        source = (
            '{"model_id":"a","model_id":"b","schema_version":"dualis.seed.v1",'
            '"state":{},"rules":[],"units":{},"precision":"x",'
            '"boundary_conditions":[],"observables":[],"invariants":[],"limits":[]}'
        )
        with self.assertRaisesRegex(ManifestError, "duplicate JSON key"):
            parse_manifest(source)

    def test_float_rejected(self):
        manifest = dict(BASE)
        manifest["state"] = {"radius": 0.1}
        with self.assertRaisesRegex(ManifestError, "binary floating-point"):
            canonical_bytes(manifest)

    def test_non_finite_constant_rejected(self):
        with self.assertRaisesRegex(ManifestError, "non-finite"):
            parse_manifest('{"bad":NaN}')

    def test_missing_and_unknown_fields_rejected(self):
        missing = dict(BASE)
        missing.pop("limits")
        with self.assertRaisesRegex(ManifestError, "missing required"):
            canonical_bytes(missing)
        extra = dict(BASE)
        extra["execute"] = "print(1)"
        with self.assertRaisesRegex(ManifestError, "unsupported fields"):
            canonical_bytes(extra)

    def test_wrong_schema_rejected(self):
        manifest = dict(BASE)
        manifest["schema_version"] = "dualis.seed.v99"
        with self.assertRaisesRegex(ManifestError, "unsupported schema_version"):
            canonical_bytes(manifest)

    def test_portable_safe_integer_boundaries(self):
        for value in (-(1 << 53) + 1, (1 << 53) - 1):
            manifest = dict(BASE)
            manifest["state"] = {"value": value}
            canonical_bytes(manifest)
        for value in (-(1 << 53), 1 << 53):
            manifest = dict(BASE)
            manifest["state"] = {"value": value}
            with self.assertRaisesRegex(ManifestError, "safe range"):
                canonical_bytes(manifest)

    def test_non_ascii_object_key_rejected(self):
        manifest = dict(BASE)
        manifest["state"] = {"é": 1}
        with self.assertRaisesRegex(ManifestError, "non-ASCII object key"):
            canonical_bytes(manifest)

    def test_unpaired_surrogate_rejected(self):
        manifest = dict(BASE)
        manifest["state"] = {"text": "\ud800"}
        with self.assertRaisesRegex(ManifestError, "unpaired surrogate"):
            canonical_bytes(manifest)

    def test_unsupported_python_value_rejected(self):
        manifest = dict(BASE)
        manifest["state"] = {"not_json": {1, 2}}
        with self.assertRaisesRegex(ManifestError, "unsupported value type"):
            canonical_bytes(manifest)

    def test_canonical_source_fixture_and_noncanonical_rejection(self):
        fixture_path = Path(__file__).parent / "fixtures" / "seed-v1-known-answer.json"
        fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
        source = fixture["canonical_manifest"]
        manifest = parse_canonical_manifest(source)
        self.assertEqual(commitment_sha256(manifest), fixture["sha256"])
        with self.assertRaisesRegex(ManifestError, "not canonical JSON"):
            parse_canonical_manifest("\n" + source)
        duplicate = source.replace(
            '"model_id":"hydrogen.reference.v1"',
            '"model_id":"x","model_id":"hydrogen.reference.v1"',
        )
        with self.assertRaisesRegex(ManifestError, "duplicate JSON key"):
            parse_canonical_manifest(duplicate)

    def test_unicode_value_known_answer_and_escape_rejection(self):
        fixture_path = Path(__file__).parent / "fixtures" / "seed-v1-unicode-known-answer.json"
        fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
        source = fixture["canonical_manifest"]
        manifest = parse_canonical_manifest(source)
        self.assertEqual(commitment_sha256(manifest), fixture["sha256"])
        escaped = source.replace("café", r"caf\u00e9")
        with self.assertRaisesRegex(ManifestError, "not canonical JSON"):
            parse_canonical_manifest(escaped)

    def test_1000_generated_cross_runtime_vectors_and_malformed_neighbours(self):
        fixture_path = Path(__file__).parent / "fixtures" / "seed-v1-generated-known-answers.json"
        fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
        self.assertEqual(fixture["fixture_version"], "dualis.seed.generated-known-answers.v1")
        self.assertEqual(fixture["seed"], "0xD1A0C0DE")
        self.assertEqual(fixture["case_count"], 1000)
        self.assertEqual(len(fixture["cases"]), 1000)

        for index, vector in enumerate(fixture["cases"]):
            self.assertEqual(vector["index"], index)
            source = vector["canonical_manifest"]
            manifest = parse_canonical_manifest(source)
            rebuilt = canonical_bytes(manifest)
            self.assertEqual(rebuilt.decode("utf-8"), source, f"canonical bytes differ at vector {index}")
            self.assertEqual(
                hashlib.sha256(rebuilt).hexdigest(),
                vector["sha256"],
                f"SHA-256 differs at vector {index}",
            )
            with self.assertRaisesRegex(ManifestError, "not canonical JSON"):
                parse_canonical_manifest(source + "\n")
            duplicate = source.replace(
                f'"model_id":"generated.seed.v1.{index}"',
                f'"model_id":"duplicate","model_id":"generated.seed.v1.{index}"',
                1,
            )
            with self.assertRaisesRegex(ManifestError, "duplicate JSON key"):
                parse_canonical_manifest(duplicate)

    def test_report_states_actual_scope(self):
        report = verification_report(BASE)
        self.assertEqual(report["status"], "PASS")
        self.assertEqual(report["truth_claim"], "not-established-by-hash")
        self.assertEqual(report["execution"], "no-user-code-executed")


if __name__ == "__main__":
    unittest.main(verbosity=2)
