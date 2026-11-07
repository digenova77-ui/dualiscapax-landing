"""Link a validated frontier signal to decision accounting as a non-authoritative event."""
from __future__ import annotations
import uuid
from typing import Any, Mapping
from decision_energy import evaluate_decision_cost
from derivative_registry import validate_signal
from swarm_protocol import HashChainLedger, ProtocolError, make_event

STATUS = {
    "OBSERVED": "OBSERVED", "INFERRED": "PROPOSED", "HYPOTHESIS": "PROPOSED",
    "INDEPENDENTLY_VALIDATED": "VERIFIED", "REJECTED": "REJECTED", "UNRESOLVED": "BLOCKED",
}

def build_frontier_decision_event(*, signal: Any, decision_cost: Any, task_id: str,
                                  issuer: str, created_at: str, idempotency_key: str) -> dict[str, Any]:
    checked = validate_signal(signal)
    if not isinstance(decision_cost, Mapping):
        raise ProtocolError("FRONTIER_DECISION_COST_MUST_BE_OBJECT")
    linked = decision_cost.get("linked_signal_ids")
    if not isinstance(linked, list) or checked["signal_id"] not in linked:
        raise ProtocolError("DECISION_COST_MUST_LINK_FRONTIER_SIGNAL")
    metrics = evaluate_decision_cost(decision_cost)
    evidence = [
        {"kind": "signal_provenance", "ref": checked["source"]},
        {"kind": "frontier_signal", "ref": checked["signal_id"]},
    ]
    for ref in checked.get("validation_refs", []):
        evidence.append({"kind": "signal_validation", "ref": ref})
    for decision in decision_cost["decisions"]:
        if decision.get("validation_ref"):
            evidence.append({"kind": "decision_validation", "ref": decision["validation_ref"]})
    claims = {
        "record_type": "frontier_decision_link.v1",
        "frontier_signal": {
            "signal_id": checked["signal_id"], "signal_class": checked["signal_class"],
            "source": checked["source"], "observed_at": checked["observed_at"],
            "evidence_state": checked["evidence_state"], "content": checked["content"],
            "measurement_context": checked.get("measurement_context"),
        },
        "decision_accounting": metrics,
        "linked_signal_ids": list(linked),
        "authority": "NONE",
        "live_actuator": False,
    }
    return make_event(
        event_id=str(uuid.uuid4()), task_id=task_id, idempotency_key=idempotency_key,
        created_at=created_at, swarm="dualis-frontier", role="economics_ledger",
        phase="record", status=STATUS[checked["evidence_state"]], issuer=issuer,
        claims=claims, evidence=evidence,
    )

def append_frontier_decision(ledger: HashChainLedger, **kwargs: Any) -> dict[str, Any]:
    return ledger.append(build_frontier_decision_event(**kwargs))
