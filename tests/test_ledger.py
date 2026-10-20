import unittest

from autonomy.ledger import HashChainLedger


class LedgerTests(unittest.TestCase):
    def test_chain_verifies_and_preserves_order(self):
        ledger = HashChainLedger()
        first = ledger.append({"type": "approved", "scope": ["read"]})
        second = ledger.append({"type": "executed", "result": "ok"})
        self.assertEqual(first.sequence, 1)
        self.assertEqual(second.sequence, 2)
        self.assertEqual(second.previous_hash, first.event_hash)
        self.assertTrue(ledger.verify())

    def test_append_detaches_caller_payload(self):
        ledger = HashChainLedger()
        payload = {"nested": {"value": 1}}
        ledger.append(payload)
        payload["nested"]["value"] = 99
        self.assertEqual(ledger.events[0].payload["nested"]["value"], 1)
        self.assertTrue(ledger.verify())

    def test_tampered_event_fails_verification(self):
        from autonomy.ledger import Event
        ledger = HashChainLedger()
        ledger.append({"type": "approved"})
        event = ledger.events[0]
        ledger._events[0] = Event(
            event.sequence, event.previous_hash, {"type": "rewritten"}, event.event_hash
        )
        self.assertFalse(ledger.verify())

    def test_import_rejects_invalid_chain(self):
        from autonomy.ledger import Event
        with self.assertRaises(ValueError):
            HashChainLedger.from_events([Event(1, "bad", {"type": "x"}, "bad")])


if __name__ == "__main__":
    unittest.main()
