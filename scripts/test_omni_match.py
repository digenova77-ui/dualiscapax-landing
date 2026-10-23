"""Tests for live /omni match grading. No network."""
import unittest
from omni_match import grade


class OmniMatchTests(unittest.TestCase):
    def test_200_nostore_measured(self):
        g = grade(200, "no-store")
        self.assertEqual(g["grade"], "MEASURED")
        self.assertTrue(g["pass"])

    def test_200_nostore_with_other_directives(self):
        g = grade(200, "Cache-Control: no-store, max-age=0")
        self.assertEqual(g["grade"], "MEASURED")

    def test_404_hypothetical(self):
        g = grade(404, "no-store")
        self.assertEqual(g["grade"], "HYPOTHETICAL")
        self.assertFalse(g["pass"])

    def test_200_missing_nostore(self):
        g = grade(200, "public, max-age=60")
        self.assertEqual(g["grade"], "HYPOTHETICAL")
        self.assertEqual(g["reason"], "missing no-store")

    def test_500(self):
        g = grade(500, "")
        self.assertEqual(g["grade"], "HYPOTHETICAL")
        self.assertEqual(g["reason"], "not 200")



class MatchNotFoundTests(unittest.TestCase):
    def test_match_not_found(self):
        from omni_match import grade, match_found, odds
        g = grade(404, "no-store")
        self.assertEqual(g["grade"], "HYPOTHETICAL")
        self.assertEqual(g["reason"], "not 200")
        self.assertFalse(match_found(404, "no-store"))
        self.assertEqual(odds(404, "")["odds"], 0.0)

    def test_match_not_found_zero_status(self):
        from omni_match import match_found
        self.assertFalse(match_found(0, ""))


class LiveOddsTests(unittest.TestCase):
    def test_measured_odds_one(self):
        from omni_match import odds
        o = odds(200, "no-store")
        self.assertEqual(o["odds"], 1.0)
        self.assertTrue(o["pass"])

    def test_hypothetical_odds_zero(self):
        from omni_match import odds
        for status, cc in ((404, "no-store"), (200, "public"), (500, "")):
            o = odds(status, cc)
            self.assertEqual(o["odds"], 0.0)
            self.assertFalse(o["pass"])

    def test_no_invented_mid_odds(self):
        from omni_match import odds
        o = odds(200, "")
        self.assertIn(o["odds"], (0.0, 1.0))


if __name__ == "__main__":
    unittest.main()
