import sqlite3
import tempfile
import unittest
from pathlib import Path

from autonomy.sqlite_ledger import SQLiteHashChainLedger


class SQLiteLedgerTests(unittest.TestCase):
    def test_persists_across_reopen(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "ledger.sqlite3"
            ledger = SQLiteHashChainLedger(path)
            first = ledger.append({"type": "approved", "task_id": "t-1"})
            ledger.append({"type": "completed", "task_id": "t-1"})
            reopened = SQLiteHashChainLedger(path)
            self.assertTrue(reopened.verify())
            self.assertEqual(len(reopened.events), 2)
            self.assertEqual(reopened.events[0].event_hash, first.event_hash)

    def test_detects_database_payload_tampering(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "ledger.sqlite3"
            ledger = SQLiteHashChainLedger(path)
            ledger.append({"type": "approved"})
            with sqlite3.connect(path) as db:
                db.execute("UPDATE ledger_events SET payload_json = ? WHERE sequence = 1", ('{"type":"rewritten"}',))
            self.assertFalse(SQLiteHashChainLedger(path).verify())

    def test_consecutive_appends_link_hashes(self):
        with tempfile.TemporaryDirectory() as directory:
            ledger = SQLiteHashChainLedger(Path(directory) / "ledger.sqlite3")
            first = ledger.append({"n": 1})
            second = ledger.append({"n": 2})
            self.assertEqual(second.previous_hash, first.event_hash)
            self.assertTrue(ledger.verify())


if __name__ == "__main__":
    unittest.main()
