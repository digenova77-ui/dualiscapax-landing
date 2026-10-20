import unittest

from autonomy.diamond_mesh import (
    MeshEdge,
    MeshNode,
    PlantObservation,
    validate_mesh,
)


class DiamondMeshTests(unittest.TestCase):
    def setUp(self):
        self.nodes = (
            MeshNode("diamond-core", "foundation", "Verified foundation"),
            MeshNode("graphene-mesh", "mesh", "Computational mesh"),
            MeshNode("plant-sensor-1", "biology", "Plant sensor"),
        )
        self.edges = (
            MeshEdge("diamond-core", "graphene-mesh", "supports"),
            MeshEdge("graphene-mesh", "plant-sensor-1", "observes"),
        )
        self.observation = PlantObservation(
            observation_id="obs-001",
            subject_id="plant-sensor-1",
            metric="leaf_temperature",
            value=22.4,
            unit="degC",
            measured_at="2026-10-20T17:00:00-04:00",
            source_id="sensor-serial-001",
            evidence_ref="lab-notebook:page-12",
        )

    def test_valid_three_layer_mesh_and_sourced_observation(self):
        result = validate_mesh(self.nodes, self.edges, (self.observation,))
        self.assertEqual(result.node_count, 3)
        self.assertEqual(result.edge_count, 2)
        self.assertEqual(result.component_count, 1)
        self.assertEqual(result.isolated_nodes, ())
        self.assertEqual(result.observation_count, 1)

    def test_duplicate_node_fails_closed(self):
        with self.assertRaisesRegex(ValueError, "duplicate_node_id"):
            validate_mesh(self.nodes + (self.nodes[0],), self.edges)

    def test_unknown_layer_fails_closed(self):
        bad = MeshNode("unknown", "magic", "Unsupported physical layer")
        with self.assertRaisesRegex(ValueError, "unknown_node_layer"):
            validate_mesh(self.nodes + (bad,), self.edges)

    def test_missing_endpoint_fails_closed(self):
        with self.assertRaisesRegex(ValueError, "edge_endpoint_missing"):
            validate_mesh(self.nodes, self.edges + (MeshEdge("diamond-core", "ghost", "supports"),))

    def test_self_edge_and_duplicate_undirected_edge_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "self_edge_forbidden"):
            validate_mesh(self.nodes, (MeshEdge("diamond-core", "diamond-core", "loops"),))
        with self.assertRaisesRegex(ValueError, "duplicate_edge"):
            validate_mesh(self.nodes, self.edges + (MeshEdge("graphene-mesh", "diamond-core", "supports"),))

    def test_observation_requires_source_and_evidence(self):
        bad = PlantObservation(
            "obs-002", "plant-sensor-1", "moisture", 0.3, "fraction",
            "2026-10-20T17:00:00Z", "", "notebook:page-13",
        )
        with self.assertRaisesRegex(ValueError, "source_id_required"):
            validate_mesh(self.nodes, self.edges, (bad,))

    def test_observation_rejects_nonfinite_value(self):
        bad = PlantObservation(
            "obs-003", "plant-sensor-1", "moisture", float("nan"), "fraction",
            "2026-10-20T17:00:00Z", "sensor-1", "notebook:page-14",
        )
        with self.assertRaisesRegex(ValueError, "observation_value_must_be_finite"):
            validate_mesh(self.nodes, self.edges, (bad,))

    def test_unknown_metric_and_wrong_unit_fail_closed(self):
        unknown = PlantObservation(
            "obs-005", "plant-sensor-1", "quantum_vitality", 1.0, "units",
            "2026-10-20T17:00:00Z", "sensor-1", "notebook:page-16",
        )
        with self.assertRaisesRegex(ValueError, "observation_metric_unknown"):
            validate_mesh(self.nodes, self.edges, (unknown,))

        wrong_unit = PlantObservation(
            "obs-006", "plant-sensor-1", "relative_humidity", 42.0, "fraction",
            "2026-10-20T17:00:00Z", "sensor-1", "notebook:page-17",
        )
        with self.assertRaisesRegex(ValueError, "observation_unit_mismatch"):
            validate_mesh(self.nodes, self.edges, (wrong_unit,))

    def test_implausible_measurement_is_rejected(self):
        bad = PlantObservation(
            "obs-007", "plant-sensor-1", "relative_humidity", 142.0, "percent",
            "2026-10-20T17:00:00Z", "sensor-1", "notebook:page-18",
        )
        with self.assertRaisesRegex(ValueError, "observation_value_out_of_range"):
            validate_mesh(self.nodes, self.edges, (bad,))

    def test_observation_timestamp_must_include_timezone(self):
        bad = PlantObservation(
            "obs-004", "plant-sensor-1", "moisture", 0.3, "fraction",
            "2026-10-20T17:00:00", "sensor-1", "notebook:page-15",
        )
        with self.assertRaisesRegex(ValueError, "observation_timestamp_must_be_timezone_aware"):
            validate_mesh(self.nodes, self.edges, (bad,))

    def test_disconnected_and_isolated_nodes_are_visible(self):
        result = validate_mesh(self.nodes, (self.edges[0],))
        self.assertEqual(result.component_count, 2)
        self.assertEqual(result.isolated_nodes, ("plant-sensor-1",))

    def test_empty_mesh_is_valid_empty_inventory(self):
        result = validate_mesh((), ())
        self.assertEqual((result.node_count, result.edge_count, result.component_count), (0, 0, 0))


if __name__ == "__main__":
    unittest.main()
