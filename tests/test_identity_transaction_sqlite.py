"""Local SQLite conformance for the exact SQL in the imported handler. No D1 calls."""
import concurrent.futures
import pathlib
import re
import sqlite3
import tempfile
import threading
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "server/identity.js").read_text()
UPDATE = re.search(r"`(UPDATE identity_handoff_proof_v2\s+SET state = 'CONSUMED'.*?)`", SOURCE, re.S)[1]
INSERT = re.search(r"`(INSERT INTO identity_session\s+.*?SELECT session_hash.*?)`", SOURCE, re.S)[1]


class IdentityTransactionSqlite(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = str(pathlib.Path(self.tmp.name) / "identity.sqlite")
        self.db = sqlite3.connect(self.path)
        self.db.executescript((ROOT / "server/identity-schema.sql").read_text())
        self.db.executescript((ROOT / "server/migrations/0008_web_authn_handoff_proof_v2.sql").read_text())
        self.db.execute("""
          INSERT INTO identity_handoff_proof_v2
          (request_id,proof_version,challenge_hash,subject_id,issuer_origin,rp_id,
           target_origin,target_path,action,state,created_at,challenge_expires_at,
           assertion_digest,jti_hash,nonce_hash,session_binding_hash,issued_at,expires_at)
          VALUES ('request',2,'challenge','subject','https://dualiscapax.com',
           'dualiscapax.com','https://dualiscapax.ai','/holographic-core/v2/',
           'OPEN_PROTECTED_WORLD','ISSUED',0,120000,'assertion','jti','nonce','binding',1000,31000)
        """)
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.tmp.cleanup()

    def issue(self, db, session="session", now=2000):
        args = (now, session, "jti", "nonce", "request", 2, "subject",
                "OPEN_PROTECTED_WORLD", "assertion", "binding")
        # Models documented D1 batch atomicity; not a claim of live D1 testing.
        with db:
            consumed = db.execute(UPDATE, args).rowcount
            inserted = db.execute(INSERT, (*args, now + 28800000)).rowcount
        return consumed, inserted

    def test_commit_and_replay(self):
        self.assertEqual(self.issue(self.db), (1, 1))
        self.assertEqual(self.issue(self.db, "other"), (0, 0))
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM identity_session").fetchone()[0], 1)
        self.assertEqual(self.db.execute("SELECT subject_id,revoked_at FROM identity_session").fetchone(),
                         ("subject", None))

    def test_insert_failure_rolls_back_consume_and_retry(self):
        self.db.execute("""CREATE TRIGGER fail_insert BEFORE INSERT ON identity_session
                           BEGIN SELECT RAISE(ABORT, 'fixture failure'); END""")
        with self.assertRaises(sqlite3.IntegrityError):
            self.issue(self.db)
        self.assertEqual(self.db.execute(
            "SELECT state,session_hash,consumed_at FROM identity_handoff_proof_v2"
        ).fetchone(), ("ISSUED", None, None))
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM identity_session").fetchone()[0], 0)
        self.db.execute("DROP TRIGGER fail_insert")
        self.assertEqual(self.issue(self.db), (1, 1))

    def test_existing_session_collision_rolls_back(self):
        self.db.execute("INSERT INTO identity_session VALUES ('session','other',0,999999,NULL)")
        self.db.commit()
        with self.assertRaises(sqlite3.IntegrityError):
            self.issue(self.db)
        self.assertEqual(self.db.execute("SELECT state FROM identity_handoff_proof_v2").fetchone()[0], "ISSUED")

    def test_expired_and_revoked(self):
        self.assertEqual(self.issue(self.db, now=31000), (0, 0))
        self.db.execute("UPDATE identity_handoff_proof_v2 SET state='REVOKED',revoked_at=1500")
        self.db.commit()
        self.assertEqual(self.issue(self.db), (0, 0))

    def test_guarded_insert_cannot_use_another_attempt(self):
        self.assertEqual(self.issue(self.db, "winner"), (1, 1))
        args = (2000, "loser", "jti", "nonce", "request", 2, "subject",
                "OPEN_PROTECTED_WORLD", "assertion", "binding", 999999)
        with self.db:
            self.assertEqual(self.db.execute(INSERT, args).rowcount, 0)

    def test_concurrent_connections(self):
        barrier = threading.Barrier(2)
        def contender(session):
            db = sqlite3.connect(self.path, timeout=5)
            try:
                barrier.wait(timeout=5)
                return self.issue(db, session)
            finally:
                db.close()
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(contender, ["one", "two"]))
        self.assertEqual(sorted(results), [(0, 0), (1, 1)])
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM identity_session").fetchone()[0], 1)


if __name__ == "__main__":
    unittest.main()
