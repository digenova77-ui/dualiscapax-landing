"""Contract tests for the proposed Diamond spectral registry."""
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "config" / "dualis.spectral_registry.v1.json"


class SpectralRegistryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.registry = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))

    def test_protocol_and_proposed_status(self):
        self.assertEqual(self.registry["protocol"], "dualis.spectra.v1")
        self.assertEqual(self.registry["status"], "PROPOSED")

    def test_required_decomposition_axes_exist(self):
        axes = {axis["key"]: axis for axis in self.registry["decomposition_axes"]}
        for key in (
            "electromagnetic_frequency_spectrum",
            "non_electromagnetic_wave_observations",
            "particle_and_radiation_channels",
            "energy_forms_and_transfer",
            "spatial_temporal_and_system_scales",
            "information_and_model_outputs",
        ):
            self.assertIn(key, axes)

    def test_em_bands_and_energy_forms_are_separate_axes(self):
        axes = {axis["key"]: axis for axis in self.registry["decomposition_axes"]}
        em_items = {item["key"] for item in axes["electromagnetic_frequency_spectrum"]["items"]}
        energy_items = {item["key"] for item in axes["energy_forms_and_transfer"]["items"]}
        self.assertIn("visible", em_items)
        self.assertIn("gamma_ray", em_items)
        self.assertIn("thermal_internal", energy_items)
        self.assertNotIn("thermal_internal", em_items)

    def test_unknowns_and_provenance_are_preserved(self):
        invariants = self.registry["invariants"]
        self.assertTrue(invariants["absence_of_detection_is_not_proof_of_absence"])
        self.assertTrue(invariants["preserve_unknowns_and_negative_results"])
        self.assertTrue(invariants["energy_values_must_have_units_and_provenance"])

    def test_no_claim_of_exhaustive_coverage(self):
        self.assertTrue(self.registry["invariants"]["no_claim_of_exhaustive_inventory"])

    def test_repetition_alone_does_not_upgrade_evidence(self):
        self.assertTrue(self.registry["invariants"]["repeated_runs_do_not_upgrade_evidence_by_themselves"])


if __name__ == "__main__":
    unittest.main()
