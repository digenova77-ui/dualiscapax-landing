"""Fail-closed tests for the Iris arbiter.

Purpose
-------
Verify that the arbiter refuses or abstains when the inputs are
missing, malformed, or outside the registered domain set. These tests
do not call live services.

Cases covered
-------------
- No domain → ABSTAIN
- Known deterministic math → PASS
- Negative amount → ValueError
- Non-dict judge result → REFUSE
- Unregistered domain → REFUSE
- Invalid judge verdict → REFUSE
"""
import importlib
import unittest

# Core arbiter always available
MODULES = [importlib.import_module("ai.iris_arbiter")]

# GUI module requires tkinter; skip it when the display library is absent
try:
    import tkinter  # noqa: F401
    MODULES.append(importlib.import_module("ai.arbiter_gui"))
except ImportError:
    pass


class IrisArbiterFailClosedTests(unittest.TestCase):
    """Fail-closed coverage for the arbiter decision path."""

    def setUp(self):
        # Clear judges so each test starts from a known empty registry.
        for module in MODULES:
            module.LAW_JUDGES.clear()

    def test_no_domain_abstains(self):
        """No domain supplied → ABSTAIN.

        The arbiter must not invent a decision when no domain is given.
        """
        for module in MODULES:
            with self.subTest(module=module.__name__):
                self.assertEqual(module.arbitrate()["verdict"], "ABSTAIN")

    def test_known_deterministic_math(self):
        """Registered deterministic domain → PASS with expected rate.

        plus_one_math is a known domain. The rate is computed from the
        supplied amount, growth, and tier.
        """
        for module in MODULES:
            with self.subTest(module=module.__name__):
                result = module.arbitrate(
                    "plus_one_math",
                    {"usdc_amount": 100, "cohort_growth_rate": 0.2, "tier": 1},
                )
                self.assertEqual(result["verdict"], "PASS")          # decision is pass
                self.assertEqual(result["deterministic"]["rate"], 0.12)  # expected rate

    def test_negative_amount_is_rejected(self):
        """Negative amount must raise ValueError.

        The math domain rejects invalid numeric input rather than
        producing a silent wrong rate.
        """
        for module in MODULES:
            with self.subTest(module=module.__name__):
                with self.assertRaises(ValueError):
                    module.plus_one_rate(-1, 0.2, 1)                 # invalid amount

    def test_non_dict_judge_result_refuses(self):
        """Judge that returns a non-dict → REFUSE.

        The arbiter expects a structured verdict. Anything else is
        treated as invalid and refused.
        """
        for module in MODULES:
            with self.subTest(module=module.__name__):
                module.register_judge("malformed", lambda _: None)   # non-dict result
                result = module.arbitrate("malformed", {}, {"forced_lean": "PURE"})
                self.assertEqual(result["verdict"], "REFUSE")        # refused
                self.assertIn("invalid judge verdict", result["deterministic"]["reason"])

    def test_unregistered_domain_refuses(self):
        """Domain with no registered judge → REFUSE.

        Unknown domains must not fall through to a default decision.
        """
        for module in MODULES:
            with self.subTest(module=module.__name__):
                result = module.arbitrate("unknown_domain", {}, {"forced_lean": "PURE"})
                self.assertEqual(result["verdict"], "REFUSE")        # refused
                self.assertIn("no judge registered", result["deterministic"]["reason"])

    def test_invalid_judge_verdict_refuses(self):
        """Judge that returns an unrecognized verdict → REFUSE.

        Only known verdict values are accepted. "MAYBE" is not one of them.
        """
        for module in MODULES:
            with self.subTest(module=module.__name__):
                module.register_judge("bad", lambda _: {"verdict": "MAYBE"})  # unknown verdict
                result = module.arbitrate("bad", {}, {"forced_lean": "PURE"})
                self.assertEqual(result["verdict"], "REFUSE")        # refused
