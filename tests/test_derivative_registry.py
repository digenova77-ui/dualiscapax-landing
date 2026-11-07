import copy
import unittest

from derivative_registry import load_registry, validate_registry, validate_signal
from swarm_protocol import ProtocolError


class DerivativeRegistryTests(unittest.TestCase):
    def test_registry_has_typed_layers_and_domain_derivatives(self):
        registry = load_registry()
        self.assertEqual(
            {layer["key"] for layer in registry["layers"]},
            {"diamond", "graphene", "frontier", "core", "derivative_keys", "decision_energy"},
        )
        self.assertGreaterEqual(len(registry["domain_registry"]), 8)
        self.assertTrue(registry["invariants"]["connections_do_not_grant_authority"])

    def test_registry_rejects_duplicate_domain_ids(self):
        registry = copy.deepcopy(load_registry())
        registry["domain_registry"].append(copy.deepcopy(registry["domain_registry"][0]))
        with self.assertRaisesRegex(ProtocolError, "DOMAIN_ID_INVALID_OR_DUPLICATE"):
            validate_registry(registry)

    def test_registry_rejects_disabling_cosmic_hypothesis_guard(self):
        registry = copy.deepcopy(load_registry())
        registry["invariants"]["cosmic_consciousness_is_hypothesis_not_default_fact"] = False
        with self.assertRaisesRegex(ProtocolError, "DERIVATIVE_REQUIRED_INVARIANT_DISABLED"):
            validate_registry(registry)

    def test_ecological_signal_requires_measurement_context(self):
        with self.assertRaisesRegex(ProtocolError, "FRONTIER_MEASUREMENT_CONTEXT_REQUIRED"):
            validate_signal({
                "signal_id": "eco-1",
                "signal_class": "ECOLOGICAL_OBSERVATION",
                "source": "sensor-A",
                "observed_at": "2026-10-17T00:00:00Z",
                "content": {"temperature_c": 18.2},
                "evidence_state": "OBSERVED",
            })

    def test_validated_signal_requires_validation_refs(self):
        with self.assertRaisesRegex(ProtocolError, "VALIDATED_SIGNAL_REQUIRES_VALIDATION_REFS"):
            validate_signal({
                "signal_id": "astro-1",
                "signal_class": "ASTRONOMICAL_OBSERVATION",
                "source": "telescope-A",
                "observed_at": "2026-10-17T00:00:00Z",
                "content": {"object": "target"},
                "evidence_state": "INDEPENDENTLY_VALIDATED",
                "measurement_context": {"instrument": "telescope-A"},
            })

    def test_simulation_output_cannot_be_direct_observation(self):
        with self.assertRaisesRegex(ProtocolError, "SIMULATION_CANNOT_BE_LABELED_DIRECT_OBSERVATION"):
            validate_signal({
                "signal_id": "sim-1",
                "signal_class": "SIMULATION_OUTPUT",
                "source": "model-A",
                "observed_at": "2026-10-17T00:00:00Z",
                "content": {"result": 1},
                "evidence_state": "OBSERVED",
            })

    def test_well_formed_frontier_signal_preserves_hypothesis_state(self):
        signal = {
            "signal_id": "eco-2",
            "signal_class": "ECOLOGICAL_OBSERVATION",
            "source": "sensor-A",
            "observed_at": "2026-10-17T00:00:00Z",
            "content": {"temperature_c": 18.2},
            "evidence_state": "HYPOTHESIS",
            "measurement_context": {"instrument": "sensor-A", "unit": "C"},
        }
        self.assertEqual(validate_signal(signal)["evidence_state"], "HYPOTHESIS")


if __name__ == "__main__":
    unittest.main()
