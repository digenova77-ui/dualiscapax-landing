import json
import unittest
from pathlib import Path

ATLAS_PATH = Path(__file__).with_name("education-bedrock-atlas.v1.json")


class EducationBedrockAtlasTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.atlas = json.loads(ATLAS_PATH.read_text(encoding="utf-8"))

    def test_schema_and_candidate_status_are_explicit(self):
        self.assertEqual(self.atlas["schema"], "dualis.education-bedrock-atlas.v1")
        self.assertEqual(self.atlas["status"], "CANDIDATE")
        self.assertTrue(self.atlas["policy"]["source_backed_claims_required_for_acceptance"])
        self.assertTrue(self.atlas["policy"]["independent_review_required"])
        self.assertFalse(self.atlas["policy"]["automatic_promotion"])
        self.assertFalse(self.atlas["policy"]["fabricated_verification"])

    def test_discipline_ids_are_unique_and_broad_domains_exist(self):
        disciplines = self.atlas["disciplines"]
        ids = [item["id"] for item in disciplines]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertGreaterEqual(len(disciplines), 15)
        required = {
            "logic-mathematics", "computer-information", "physics",
            "chemistry-materials", "biology-life", "earth-environment",
            "astronomy-space", "engineering-design", "medicine-public-health",
            "psychology-neuroscience", "social-sciences", "economics-management",
            "humanities", "arts-media", "law-governance", "education-learning",
            "agriculture-food", "interdisciplinary",
        }
        self.assertTrue(required.issubset(set(ids)))

    def test_dependencies_resolve_or_are_explicitly_cross_domain(self):
        ids = {item["id"] for item in self.atlas["disciplines"]}
        for discipline in self.atlas["disciplines"]:
            for dependency in discipline.get("dependencies", []):
                self.assertTrue(
                    dependency in ids or dependency in {"bedrock", "formal-foundations", "all disciplines"},
                    f"Unresolved dependency {dependency!r} in {discipline['id']}"
                )

    def test_vertical_stack_and_edge_types_are_defined(self):
        layer_ids = [item["id"] for item in self.atlas["vertical_layers"]]
        self.assertEqual(len(layer_ids), len(set(layer_ids)))
        self.assertGreaterEqual(len(layer_ids), 6)
        for edge in ("depends_on", "evidence_supports", "contradicts", "applies_to", "derived_from"):
            self.assertIn(edge, self.atlas["edge_types"])

    def test_earth_information_claim_is_bounded_and_falsifiable(self):
        earth = next(item for item in self.atlas["disciplines"] if item["id"] == "earth-environment")
        self.assertIn("falsifiable mechanism", earth["caution"])
        self.assertIn("not exhaustive", self.atlas["generated_scope"])


if __name__ == "__main__":
    unittest.main()
