import json
import tempfile
import unittest
import uuid
from pathlib import Path

from swarm_protocol import (
    HashChainLedger, LAWS, PROTOCOL, ProtocolError, make_event, validate_event,
)


def event(key="once", **overrides):
    value = make_event(
        event_id=str(uuid.uuid4()),
        task_id="task-001",
        idempotency_key=key,
        created_at="2026-10-17T14:00:00Z",
        swarm="scout",
        role="scout",
        phase="discover",
        status="OBSERVED",
        issuer="test-runner",
        claims={"finding": "read-only observation"},
        evidence=[{"kind": "test", "ref": "unit-test"}],
    )
    value.update(overrides)
    return value


class ProtocolTests(unittest.TestCase):
    def test_valid_observation_is_non_authoritative(self):
        value = event()
        self.assertEqual(validate_event(value)["authority"], "NONE")
        self.assertIs(value["live_actuator"], False)
        self.assertEqual(set(value["laws"]), set(LAWS))

    def test_missing_law_fails_closed(self):
        value = event()
        value["laws"].remove("HOST_SAFE")
        with self.assertRaisesRegex(ProtocolError, "GOVERNING_LAWS_MISMATCH"):
            validate_event(value)

    def test_worker_cannot_issue_gate_decision(self):
        value = event(phase="gate", decision="ACCEPT")
        with self.assertRaisesRegex(ProtocolError, "GATE_PHASE_REQUIRES_TRINITY_DCLM"):
            validate_event(value)

    def test_gate_block_requires_exact_missing_primitive(self):
        value = event(role="trinity_dclm", phase="gate", decision="BLOCKED_WITH_EXACT_MISSING_PRIMITIVE")
        with self.assertRaisesRegex(ProtocolError, "BLOCKED_REQUIRES_EXACT_MISSING_PRIMITIVE"):
            validate_event(value)

    def test_live_actuator_must_remain_false(self):
        value = event(live_actuator=True)
        with self.assertRaisesRegex(ProtocolError, "LIVE_ACTUATOR_FORBIDDEN"):
            validate_event(value)

    def test_duplicate_idempotency_key_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            ledger = HashChainLedger(Path(tmp) / "events.jsonl")
            ledger.append(event("same-key"))
            with self.assertRaisesRegex(ProtocolError, "DUPLICATE_IDEMPOTENCY_KEY"):
                ledger.append(event("same-key"))

    def test_hash_chain_verifies_two_events(self):
        with tempfile.TemporaryDirectory() as tmp:
            ledger = HashChainLedger(Path(tmp) / "events.jsonl")
            ledger.append(event("key-1"))
            ledger.append(event("key-2"))
            result = ledger.verify()
            self.assertTrue(result["ok"])
            self.assertEqual(result["events"], 2)
            self.assertEqual(len(result["head_hash"]), 64)

    def test_mutation_is_detected(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "events.jsonl"
            ledger = HashChainLedger(path)
            ledger.append(event("key-1"))
            row = json.loads(path.read_text())
            row["event"]["claims"]["finding"] = "silently changed"
            path.write_text(json.dumps(row) + "\n")
            with self.assertRaisesRegex(ProtocolError, "LEDGER_HASH_MISMATCH"):
                ledger.verify()

    def test_invalid_timestamp_fails_closed(self):
        value = event(created_at="2026-10-17T10:00:00-04:00")
        with self.assertRaisesRegex(ProtocolError, "TIMESTAMP_MUST_BE_UTC_Z"):
            validate_event(value)


if __name__ == "__main__":
    unittest.main()
