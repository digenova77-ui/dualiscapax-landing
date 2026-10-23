import unittest

from decision_energy import evaluate_decision_cost
from swarm_protocol import ProtocolError


class DecisionEnergyTests(unittest.TestCase):
    def test_cost_per_validated_decision(self):
        result = evaluate_decision_cost({
            "communication_id": "comm-001",
            "output_units": 100,
            "output_unit": "tokens",
            "energy_joules": 12.0,
            "energy_basis": "MEASURED",
            "decisions": [
                {"state": "VALIDATED", "validation_ref": "audit:001"},
                {"state": "UNRESOLVED"},
                {"state": "REJECTED"},
            ],
        })
        self.assertEqual(result["validated_decision_count"], 1)
        self.assertEqual(result["resolved_decision_count"], 2)
        self.assertEqual(result["joules_per_validated_decision"], 12.0)
        self.assertEqual(result["joules_per_output_unit"], 0.12)

    def test_unknown_energy_is_not_fabricated(self):
        result = evaluate_decision_cost({
            "communication_id": "comm-002",
            "output_units": 20,
            "output_unit": "tokens",
            "energy_joules": None,
            "energy_basis": "UNKNOWN",
            "decisions": [{"state": "UNRESOLVED"}],
        })
        self.assertIsNone(result["joules_per_output_unit"])
        self.assertIsNone(result["joules_per_resolved_decision"])

    def test_validated_decision_requires_evidence_reference(self):
        with self.assertRaisesRegex(ProtocolError, "DECISION_0_VALIDATION_REF_REQUIRED"):
            evaluate_decision_cost({
                "communication_id": "comm-003",
                "output_units": 10,
                "output_unit": "tokens",
                "energy_joules": 2,
                "energy_basis": "ESTIMATED",
                "decisions": [{"state": "VALIDATED"}],
            })

    def test_unknown_energy_must_be_null(self):
        with self.assertRaisesRegex(ProtocolError, "UNKNOWN_ENERGY_MUST_BE_NULL"):
            evaluate_decision_cost({
                "communication_id": "comm-004",
                "output_units": 10,
                "output_unit": "tokens",
                "energy_joules": 1,
                "energy_basis": "UNKNOWN",
                "decisions": [],
            })


if __name__ == "__main__":
    unittest.main()
