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
