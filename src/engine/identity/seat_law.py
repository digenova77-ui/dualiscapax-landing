"""Seat law: PLAYER_OBJECT_ID != ROSTER_SEAT_ID != ALLOCATION_ID."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional
import time
import uuid


def _now() -> int:
    return int(time.time())


@dataclass
class HistoryEvent:
    event_id: str
    player_id: str
    kind: str
    payload: Dict[str, Any]
    at: int
    allocation_id: Optional[str] = None
    seat_id: Optional[str] = None
    epoch: int = 0


RESERVED_SEAT_IDS = frozenset({
    "OBJECT", "SEED", "PLAYER_OBJECT", "PLAYER_OBJECT_ID",
    "ROSTER_SEAT", "ROSTER_SEAT_ID", "ALLOCATION", "ALLOCATION_ID",
})


class SeatLaw:
    def __init__(self) -> None:
        self.players: Dict[str, Dict[str, Any]] = {}
        self.seats: Dict[str, Dict[str, Any]] = {}
        self.allocations: Dict[str, Dict[str, Any]] = {}
        self.history: Dict[str, List[HistoryEvent]] = {}
        self.epoch = 0
        self._revoked_allocations: set[str] = set()

    def create_player(self, player_id: str, name: str) -> Dict[str, Any]:
        if player_id in self.players:
            raise ValueError("player_exists")
        self.players[player_id] = {"player_id": player_id, "name": name, "created_at": _now()}
        self.history.setdefault(player_id, [])
        return dict(self.players[player_id])

    def create_seat(self, seat_id: str, label: str) -> Dict[str, Any]:
        if seat_id in self.seats:
            raise ValueError("seat_exists")
        if str(seat_id).upper() in RESERVED_SEAT_IDS:
            raise ValueError("reserved_id_is_not_a_seat")
        self.seats[seat_id] = {"seat_id": seat_id, "label": label, "occupant": None, "allocation_id": None}
        return dict(self.seats[seat_id])

    def assign(self, player_id: str, seat_id: str) -> Dict[str, Any]:
        if player_id not in self.players:
            raise KeyError("unknown_player")
        if seat_id not in self.seats:
            raise KeyError("unknown_seat")
        seat = self.seats[seat_id]
        if seat["occupant"] is not None:
            raise ValueError("seat_occupied")
        self.epoch += 1
        aid = "alloc_" + uuid.uuid4().hex[:16]
        alloc = {
            "allocation_id": aid,
            "player_id": player_id,
            "seat_id": seat_id,
            "epoch": self.epoch,
            "active": True,
            "issued_at": _now(),
        }
        self.allocations[aid] = alloc
        seat["occupant"] = player_id
        seat["allocation_id"] = aid
        ev = HistoryEvent(
            event_id="ev_" + uuid.uuid4().hex[:12],
            player_id=player_id,
            kind="ASSIGNED",
            payload={"seat_id": seat_id},
            at=_now(),
            allocation_id=aid,
            seat_id=seat_id,
            epoch=self.epoch,
        )
        self.history.setdefault(player_id, []).append(ev)
        return dict(alloc)

    def release(self, seat_id: str) -> Dict[str, Any]:
        seat = self.seats[seat_id]
        aid = seat["allocation_id"]
        occupant = seat["occupant"]
        if occupant is None or aid is None:
            return {"released": False, "reason": "empty"}
        self.epoch += 1
        self.allocations[aid]["active"] = False
        self.allocations[aid]["released_at"] = _now()
        self.allocations[aid]["release_epoch"] = self.epoch
        self._revoked_allocations.add(aid)
        ev = HistoryEvent(
            event_id="ev_" + uuid.uuid4().hex[:12],
            player_id=occupant,
            kind="RELEASED",
            payload={"seat_id": seat_id, "allocation_id": aid},
            at=_now(),
            allocation_id=aid,
            seat_id=seat_id,
            epoch=self.epoch,
        )
        self.history[occupant].append(ev)
        seat["occupant"] = None
        seat["allocation_id"] = None
        return {"released": True, "player_id": occupant, "allocation_id": aid, "epoch": self.epoch}

    def history_of(self, player_id: str) -> List[Dict[str, Any]]:
        return [e.__dict__ for e in self.history.get(player_id, [])]

    def write_checklist(self, player_id: str, item: str, allocation_id: Optional[str] = None) -> Dict[str, Any]:
        if player_id not in self.players:
            raise KeyError("unknown_player")
        if allocation_id:
            alloc = self.allocations.get(allocation_id)
            if alloc is None:
                return {"ok": False, "reason": "unknown_allocation", "authority_effect": "NONE"}
            if not alloc["active"] or allocation_id in self._revoked_allocations:
                return {"ok": False, "reason": "revoked_or_inactive_allocation", "authority_effect": "NONE"}
            if alloc["player_id"] != player_id:
                return {"ok": False, "reason": "allocation_belongs_to_other_player", "authority_effect": "NONE"}
        ev = HistoryEvent(
            event_id="ev_" + uuid.uuid4().hex[:12],
            player_id=player_id,
            kind="CHECKLIST",
            payload={"item": item},
            at=_now(),
            allocation_id=allocation_id,
            seat_id=self.allocations.get(allocation_id, {}).get("seat_id") if allocation_id else None,
            epoch=self.epoch,
        )
        self.history.setdefault(player_id, []).append(ev)
        return {"ok": True, "player_id": player_id, "event_id": ev.event_id, "authority_effect": "NONE"}

    def replay_allocation(self, allocation_id: str) -> Dict[str, Any]:
        alloc = self.allocations.get(allocation_id)
        if alloc is None:
            return {"decision": "UNKNOWN", "reason": "missing"}
        if allocation_id in self._revoked_allocations or not alloc["active"]:
            return {"decision": "REVOKED", "reason": "stale_allocation", "authority_effect": "NONE"}
        return {"decision": "ACTIVE", "allocation": dict(alloc)}

    def write_old_seat_into(self, source_player_id: str, dest_player_id: str) -> Dict[str, Any]:
        return {
            "ok": False,
            "reason": "history_follows_player_object_not_seat",
            "source": source_player_id,
            "dest": dest_player_id,
            "authority_effect": "NONE",
        }
