import unittest

from autonomy.research_protocol import ResearchProtocol, validate_protocol


class ResearchProtocolTests(unittest.TestCase):
    def setUp(self):
        self.protocol = ResearchProtocol(
            protocol_id="study-001",
            hypothesis="Non-invasive sensors can measure leaf temperature without damaging the plant.",
            species="Ocimum basilicum",
            intervention="non_invasive_observation",
            sample_size_per_group=6,
            control_description="Matched plants without sensor contact, same light and watering schedule.",
            measurement_metrics=("leaf_temperature", "relative_humidity"),
            calibration_evidence_ref="calibration:thermometer-2026-10",
            success_criteria="Predefined measurement error remains within 1.0 degC across the observation period.",
            stop_conditions="Stop on visible damage, abnormal wilting, or sensor heating.",
            human_reviewer_id="reviewer-role-plant-science",
            human_review_record="review-record:study-001",
        )

    def test_complete_observation_protocol_passes_structure_gate(self):
        decision = validate_protocol(self.protocol)
        self.assertTrue(decision.accepted)
        self.assertEqual(decision.blockers, ())

    def test_missing_human_review_fails_closed(self):
        decision = validate_protocol(ResearchProtocol(
            **{**self.protocol.__dict__, "human_review_record": ""}
        ))
        self.assertFalse(decision.accepted)
        self.assertIn("human_review_record_required", decision.blockers)

    def test_grafting_is_not_authorized_by_observation_gate(self):
        decision = validate_protocol(ResearchProtocol(
            **{**self.protocol.__dict__, "intervention": "physical_grafting"}
        ))
        self.assertFalse(decision.accepted)
        self.assertIn("intervention_not_authorized_by_observation_gate", decision.blockers)

    def test_tiny_sample_and_unsupported_metric_fail_closed(self):
        decision = validate_protocol(ResearchProtocol(
            **{**self.protocol.__dict__, "sample_size_per_group": 1,
               "measurement_metrics": ("quantum_vitality",)}
        ))
        self.assertIn("sample_size_per_group_must_be_at_least_2", decision.blockers)
        self.assertIn("measurement_metric_not_supported", decision.blockers)

    def test_duplicate_metrics_are_rejected(self):
        decision = validate_protocol(ResearchProtocol(
            **{**self.protocol.__dict__, "measurement_metrics": ("soil_ph", "soil_ph")}
        ))
        self.assertIn("duplicate_measurement_metric", decision.blockers)


if __name__ == "__main__":
    unittest.main()
