"""Standard-library tests for strict seed manifest validation."""
import unittest

from seed_verifier import (
    ManifestError,
    canonical_bytes,
    commitment_sha256,
    parse_manifest,
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

    def test_report_states_actual_scope(self):
        report = verification_report(BASE)
        self.assertEqual(report["status"], "PASS")
        self.assertEqual(report["truth_claim"], "not-established-by-hash")
        self.assertEqual(report["execution"], "no-user-code-executed")


if __name__ == "__main__":
    unittest.main(verbosity=2)
