import importlib
import unittest

MODULES = (
    importlib.import_module("ai.iris_arbiter"),
    importlib.import_module("ai.arbiter_gui"),
)


class IrisArbiterFailClosedTests(unittest.TestCase):
    def setUp(self):
        for module in MODULES:
            module.LAW_JUDGES.clear()

    def test_no_domain_abstains(self):
        for module in MODULES:
            with self.subTest(module=module.__name__):
                self.assertEqual(module.arbitrate()["verdict"], "ABSTAIN")

    def test_known_deterministic_math(self):
        for module in MODULES:
            with self.subTest(module=module.__name__):
                result = module.arbitrate(
                    "plus_one_math",
                    {"usdc_amount": 100, "cohort_growth_rate": 0.2, "tier": 1},
                )
                self.assertEqual(result["verdict"], "PASS")
                self.assertEqual(result["deterministic"]["rate"], 0.12)

    def test_negative_amount_is_rejected(self):
        for module in MODULES:
            with self.subTest(module=module.__name__):
                with self.assertRaises(ValueError):
                    module.plus_one_rate(-1, 0.2, 1)

    def test_non_dict_judge_result_refuses(self):
        for module in MODULES:
            with self.subTest(module=module.__name__):
                module.register_judge("malformed", lambda _: None)
                result = module.arbitrate("malformed", {}, {"forced_lean": "PURE"})
                self.assertEqual(result["verdict"], "REFUSE")
                self.assertIn("invalid judge verdict", result["deterministic"]["reason"])

    def test_unregistered_domain_refuses(self):
        for module in MODULES:
            with self.subTest(module=module.__name__):
                result = module.arbitrate("unknown_domain", {}, {"forced_lean": "PURE"})
                self.assertEqual(result["verdict"], "REFUSE")
                self.assertIn("no judge registered", result["deterministic"]["reason"])

    def test_invalid_judge_verdict_refuses(self):
        for module in MODULES:
            with self.subTest(module=module.__name__):
                module.register_judge("bad", lambda _: {"verdict": "MAYBE"})
                result = module.arbitrate("bad", {}, {"forced_lean": "PURE"})
                self.assertEqual(result["verdict"], "REFUSE")
                self.assertIn("invalid judge verdict", result["deterministic"]["reason"])

    def test_deterministic_refusal_cannot_be_overridden(self):
        for module in MODULES:
            with self.subTest(module=module.__name__):
                module.register_judge("blocked", lambda _: {"verdict": "REFUSE"})
                result = module.arbitrate("blocked", {}, {"forced_lean": "PURE"})
                self.assertEqual(result["verdict"], "REFUSE")

    def test_pending_stays_pending(self):
        for module in MODULES:
            with self.subTest(module=module.__name__):
                module.register_judge("pending", lambda _: {"verdict": "PENDING"})
                result = module.arbitrate("pending", {}, {"forced_lean": "PURE"})
                self.assertEqual(result["verdict"], "PENDING")


if __name__ == "__main__":
    unittest.main()
