import unittest
from rtv import h, inputs_hash, replay, verify

SEED = b"dualis.seed.v1"
LOG = [
    {"kind": "input", "value": {"op": "add", "n": 3}},
    {"kind": "recorded", "source": "time", "value": "2026-10-17T18:00:00Z"},
    {"kind": "recorded", "source": "random", "value": 42},
]


def pins(log=LOG, seed=SEED):
    return h(seed), inputs_hash(log)


class T(unittest.TestCase):
    def test_match_is_known_and_deterministic(self):
        sh, ih = pins()
        out = replay(SEED, sh, LOG, ih)
        self.assertEqual(out, replay(SEED, sh, LOG, ih))
        self.assertEqual(verify(SEED, sh, LOG, ih, out), ("KNOWN", out))

    def test_mismatch_is_unknown(self):
        sh, ih = pins()
        v, reason = verify(SEED, sh, LOG, ih, "0" * 64)
        self.assertEqual(v, "UNKNOWN"); self.assertIn("mismatch", reason)

    def test_wrong_seed_is_unknown(self):
        sh, ih = pins()
        out = replay(SEED, sh, LOG, ih)
        v, reason = verify(b"other.seed", sh, LOG, ih, out)
        self.assertEqual(v, "UNKNOWN"); self.assertIn("seed", reason)

    def test_tampered_inputs_is_unknown(self):
        sh, ih = pins()
        out = replay(SEED, sh, LOG, ih)
        bad = LOG[:-1] + [{"kind": "recorded", "source": "random", "value": 43}]
        v, reason = verify(SEED, sh, bad, ih, out)
        self.assertEqual(v, "UNKNOWN"); self.assertIn("inputs", reason)

    def test_unrecorded_nondeterminism_rejected(self):
        for ev in ({"kind": "live_call", "value": "https://x"},
                   {"kind": "recorded", "source": "clock_now_unpinned", "value": 1},
                   {"kind": "recorded", "source": "random"}):
            log = LOG + [ev]
            sh, ih = pins(log)
            v, reason = verify(SEED, sh, log, ih, "x")
            self.assertEqual(v, "UNKNOWN"); self.assertIn("not rebuildable", reason)

    def test_float_rejected(self):
        log = [{"kind": "input", "value": 0.1}]
        sh = h(SEED)
        with self.assertRaises(ValueError):
            inputs_hash(log)


if __name__ == "__main__":
    unittest.main(verbosity=2)
