import os, sys, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tokenomics as t


class TestPurchaseSplit5050(unittest.TestCase):
    def test_even_amount_is_exactly_half_half(self):
        s = t.split_purchase(10000, "usd")
        self.assertEqual((s.efuse, s.merit), (5000, 5000))

    def test_crypto_and_fiat_same_rule(self):
        for rail in ("usd", "fiat", "crypto"):
            self.assertEqual(t.split_purchase(200, rail), t.PurchaseSplit(200, 100, 100))

    def test_odd_unit_goes_to_efuse(self):
        s = t.split_purchase(101, "crypto")
        self.assertEqual((s.efuse, s.merit), (51, 50))

    def test_conservation_and_balance_over_range(self):
        for a in range(0, 5001):
            s = t.split_purchase(a, "usd")
            self.assertEqual(s.efuse + s.merit, a)
            self.assertIn(s.efuse - s.merit, (0, 1))

    def test_not_old_5_5_90(self):
        s = t.split_purchase(10000, "usd")
        self.assertNotEqual(s.efuse, 500)

    def test_rejects_bad_input(self):
        for bad in (-1, 1.5, True, "100"):
            with self.assertRaises((TypeError, ValueError)):
                t.split_purchase(bad, "usd")
        with self.assertRaises(ValueError):
            t.split_purchase(100, "merit")


if __name__ == "__main__":
    unittest.main()


class TestEFuseGuard(unittest.TestCase):
    def setUp(self):
        self.v = t.EFuseVault()
        self.v.record_purchase(1001, "crypto")

    def test_deposit_from_purchase(self):
        self.assertEqual(self.v.balance, 501)

    def test_sell_withdraw_transfer_refused_for_everyone(self):
        for who in ("buyer", "agent", "founder", "David"):
            for call in (lambda: self.v.sell(1, who), lambda: self.v.withdraw(1, who),
                         lambda: self.v.transfer(1, "x", who)):
                with self.assertRaises(t.EFuseLocked):
                    call()
        self.assertEqual(self.v.balance, 501)

    def test_every_forbidden_action_refused(self):
        for a in t.FORBIDDEN_EFUSE_ACTIONS:
            with self.assertRaises(t.EFuseLocked):
                self.v.request(a, 1)
        self.assertEqual(self.v.balance, 501)

    def test_refusals_logged(self):
        with self.assertRaises(t.EFuseLocked):
            self.v.withdraw(5, "founder")
        self.assertEqual(self.v.log[-1], ("refused", "withdraw", 5, "founder"))

    def test_no_negative_deposit(self):
        with self.assertRaises(ValueError):
            self.v.deposit(-10)


class TestSurplusExpansion(unittest.TestCase):
    def test_split_unchanged_when_world_cost_covered(self):
        v = t.EFuseVault(); v.record_purchase(10000, "usd")
        t.settle_period(v, 1000)
        self.assertEqual(v.record_purchase(10000, "crypto"), t.PurchaseSplit(10000, 5000, 5000))

    def test_surplus_funds_expansion(self):
        v = t.EFuseVault(); v.record_purchase(10000, "usd")
        r = t.settle_period(v, 3000)
        self.assertEqual((r.world_cost_paid, r.expansion, r.reserve), (3000, 2000, 0))

    def test_shortfall_no_expansion(self):
        v = t.EFuseVault(); v.record_purchase(2000, "usd")
        r = t.settle_period(v, 5000)
        self.assertEqual((r.world_cost_paid, r.expansion), (1000, 0))

    def test_conservation(self):
        for amt, cost in [(0, 0), (1, 0), (999, 300), (5000, 2500), (7777, 9999)]:
            v = t.EFuseVault(); v.record_purchase(amt, "crypto"); before = v.balance
            r = t.settle_period(v, cost)
            self.assertEqual(r.world_cost_paid + r.expansion + r.reserve, before)

    def test_surplus_still_not_withdrawable(self):
        v = t.EFuseVault(); v.record_purchase(10000, "usd"); t.settle_period(v, 0)
        with self.assertRaises(t.EFuseLocked):
            v.withdraw(1, "founder")


class TestDerivative9091(unittest.TestCase):
    def test_exact_split(self):
        self.assertEqual(t.split_derivative(10000), t.DerivativeFlow(10000, 9000, 900, 100))

    def test_remainder_to_forest_and_conservation(self):
        for a in range(0, 3001):
            f = t.split_derivative(a)
            self.assertEqual(f.forest + f.harvest + f.seed, a)
            self.assertGreaterEqual(f.forest, a * 9 // 10)
            self.assertLessEqual(f.seed, a // 100)

    def test_small_amount(self):
        self.assertEqual(t.split_derivative(99), t.DerivativeFlow(99, 91, 8, 0))

    def test_rejects_bad(self):
        for bad in (-1, 2.5, None):
            with self.assertRaises(ValueError):
                t.split_derivative(bad)
