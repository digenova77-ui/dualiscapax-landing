#!/usr/bin/env python3
"""
Dualis APIv2 executable runtime (agent-plane harness).
Our space first; organs only via Bridges. Dual-TOS: no circumvention.
"""
from __future__ import annotations

import json
import urllib.request
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

ROOT = Path(__file__).resolve().parents[2]
STATE_PATH = ROOT / "state" / "UNITY-STATUS.json"
FRICTION_PATH = ROOT / "ops" / "friction-matrix.json"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def probe(url: str, timeout: float = 8.0) -> bool:
    try:
        req = urllib.request.Request(url, method="GET", headers={"User-Agent": "DualisAPIv2/1"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return 200 <= getattr(r, "status", 200) < 400
    except Exception:
        return False


# --- Law ---

ALLOWED_DONE = {
    "MAIL_UNITY_CLOSE DONE",
    "G2 DONE",
    "SIGNATURE LOADED",
}


@dataclass
class Runtime:
    state: dict = field(default_factory=dict)
    friction: dict = field(default_factory=dict)
    bridges: dict[str, Callable[..., Any]] = field(default_factory=dict)

    def __post_init__(self) -> None:
        self.state = load_json(STATE_PATH) or default_state()
        self.friction = load_json(FRICTION_PATH)
        self.bridges = {
            "organ.git": bridge_git_stub,
            "organ.google": bridge_google_stub,
            "organ.cf": bridge_cf_stub,
            "organ.sq": bridge_sq_stub,
        }

    def persist(self) -> None:
        self.state["updated"] = utc_now()
        save_json(STATE_PATH, self.state)

    # ----- verbs -----

    def call(self, verb: str, **kwargs: Any) -> dict:
        handlers = {
            "law.done": self.law_done,
            "law.unity": self.law_unity,
            "state.get": self.state_get,
            "state.transition": self.state_transition,
            "state.forward": self.state_forward,
            "tdi.dual_bind": self.tdi_dual_bind,
            "tdi.measure": self.tdi_measure,
            "mail.reply": self.mail_reply,
            "mail.unity.close": self.mail_unity_close,
            "domain.unity": self.domain_unity,
            "domain.redirect": self.domain_redirect,
            "web.health": self.web_health,
            "gate.evaluate": self.gate_evaluate,
            "forward.run": self.forward_run,
            "pack.ready": self.pack_ready,
        }
        if verb.startswith("organ."):
            return self.organ_bridge(verb, **kwargs)
        fn = handlers.get(verb)
        if not fn:
            return {"ok": False, "error": f"unknown_verb:{verb}", "hint": "APIv2 only"}
        return fn(**kwargs)

    def law_done(self, signal: str = "", **_: Any) -> dict:
        signal = (signal or "").strip()
        if signal not in ALLOWED_DONE:
            return {"ok": False, "error": "invalid_done", "allowed": sorted(ALLOWED_DONE)}
        dones = set(self.state.get("dones") or [])
        dones.add(signal)
        self.state["dones"] = sorted(dones)
        if signal == "MAIL_UNITY_CLOSE DONE":
            self._set_plane("mail_from", "Active", None)
            self.state.setdefault("P_mail", {})["auth"] = 1
        if signal == "G2 DONE":
            self._set_plane("web_com", "Active", None)
        if signal == "SIGNATURE LOADED":
            self._set_plane("signature", "Active", None)
        self.gate_evaluate()
        self.persist()
        return {"ok": True, "signal": signal, "dones": self.state["dones"]}

    def law_unity(self, **_: Any) -> dict:
        self.state["law"] = "YES TO ALL NEEDED TO MANIFEST UNITY"
        self.persist()
        return {"ok": True, "law": self.state["law"]}

    def state_get(self, **_: Any) -> dict:
        return {"ok": True, "state": self.state}

    def state_transition(
        self,
        plane: str = "",
        to: str = "",
        reason: str | None = None,
        **_: Any,
    ) -> dict:
        allowed = {"Active", "JustifiedHang", "Pausation", "Released", "Broken"}
        if to not in allowed:
            return {"ok": False, "error": "bad_state", "allowed": sorted(allowed)}
        if to in {"JustifiedHang", "Pausation", "Broken"} and not reason:
            return {"ok": False, "error": "reason_required"}
        if to == "Broken" and reason and not str(reason).startswith("HANG:"):
            # Broken must be re-engineered; still require reason
            pass
        self._set_plane(plane, to, reason)
        self.persist()
        return {"ok": True, "plane": plane, "to": to, "reason": reason}

    def state_forward(self, **_: Any) -> dict:
        """Keep non-blocked planes Active; do not clear justified FC hangs."""
        planes = self.state.setdefault("planes", {})
        for name, st in list(planes.items()):
            if st == "Broken":
                return {"ok": False, "error": "reengineer_broken", "plane": name}
        self.state["agent_plane"] = "forward"
        self.persist()
        return {"ok": True, "agent_plane": "forward"}

    def tdi_dual_bind(self, a: str = "", b: str = "", **_: Any) -> dict:
        if not a or not b:
            return {"ok": False, "error": "dual_bind_requires_two", "logical": False}
        return {"ok": True, "bound": [a, b], "logical": True}

    def tdi_measure(self, **_: Any) -> dict:
        g = self.gate_evaluate()
        return {
            "ok": True,
            "P_mail": self.state.get("P_mail"),
            "apiv2_level": g.get("apiv2_level"),
            "planes": self.state.get("planes"),
        }

    def mail_reply(self, **kwargs: Any) -> dict:
        # Content path always available at agent limit
        return {
            "ok": True,
            "path": "content",
            "from_native": "MAIL_UNITY_CLOSE DONE" in set(self.state.get("dones") or []),
            "note": "Bridge organ.google executes actual send",
            "args": kwargs,
        }

    def mail_unity_close(self, **_: Any) -> dict:
        if "MAIL_UNITY_CLOSE DONE" in set(self.state.get("dones") or []):
            return {"ok": True, "closed": True}
        return {
            "ok": False,
            "closed": False,
            "hang": "HANG: FC-1 MAIL_UNITY organ",
            "attack": "Workspace|SMTP + SPF + DKIM + Send-as",
        }

    def domain_unity(self, **_: Any) -> dict:
        if "G2 DONE" in set(self.state.get("dones") or []):
            return {"ok": True, "unity": True}
        return {
            "ok": False,
            "unity": False,
            "hang": "HANG: FC-2 G2 redirects",
            "attack": "CF Redirect Rules or token Bridge",
        }

    def domain_redirect(self, **kwargs: Any) -> dict:
        return self.organ_bridge("organ.cf", action="redirect", **kwargs)

    def web_health(self, **_: Any) -> dict:
        ai = probe("https://dualiscapax.ai/")
        self._set_plane("web_ai", "Active" if ai else "Pausation", None if ai else "HANG: vendor or edge")
        self.persist()
        return {"ok": ai, "dualiscapax.ai": ai}

    def gate_evaluate(self, **_: Any) -> dict:
        dones = set(self.state.get("dones") or [])
        f1 = "MAIL_UNITY_CLOSE DONE" in dones
        f2 = "G2 DONE" in dones
        ai = probe("https://dualiscapax.ai/")
        apiv2_level = bool(f1 and f2 and ai)
        self.state["apiv2_level"] = apiv2_level
        self.state["P_mail"] = {
            "reply": 1,
            "auth": 1 if f1 else 0,
            "scoreboard": self.state.get("P_mail", {}).get("scoreboard", 0.5),
        }
        report = {
            "ok": True,
            "apiv1": {"F1_mail_unity": f1, "F2_domain_unity": f2, "web_ai": ai},
            "apiv2_level": apiv2_level,
            "rule": "All required APIv1 true before APIv2 level",
        }
        self.state["gate"] = report
        return report

    def forward_run(self, **_: Any) -> dict:
        health = self.web_health()
        gate = self.gate_evaluate()
        self.state_forward()
        return {"ok": True, "health": health, "gate": gate, "state": self.state.get("planes")}

    def pack_ready(self, pack: str = "", **_: Any) -> dict:
        if not pack:
            return {"ok": False, "error": "pack_name_required"}
        self._set_plane("owner", "Released", f"RELEASED: ready-for-handoff/{pack}")
        self.persist()
        return {"ok": True, "released": True, "pack": pack, "owner_delivers": True}

    def organ_bridge(self, verb: str, **kwargs: Any) -> dict:
        fn = self.bridges.get(verb)
        if not fn:
            return {"ok": False, "error": f"no_bridge:{verb}"}
        result = fn(self, **kwargs)
        result["bridge"] = verb
        result["dual_tos"] = True
        return result

    def _set_plane(self, plane: str, to: str, reason: str | None) -> None:
        if not plane:
            return
        planes = self.state.setdefault("planes", {})
        planes[plane] = to
        if reason:
            planes[f"{plane}_reason"] = reason
        elif f"{plane}_reason" in planes and to == "Active":
            planes.pop(f"{plane}_reason", None)


def default_state() -> dict:
    return {
        "framework": "UNITY",
        "updated": utc_now(),
        "law": "YES TO ALL NEEDED TO MANIFEST UNITY",
        "dones": [],
        "apiv2_level": False,
        "planes": {
            "web_ai": "Active",
            "web_com": "JustifiedHang",
            "web_com_reason": "HANG: FC-2 G2 redirects not applied",
            "mail_reply": "Active",
            "mail_from": "JustifiedHang",
            "mail_from_reason": "HANG: FC-1 MAIL_UNITY organ",
            "knowledge": "Active",
            "owner": "Active",
            "signature": "JustifiedHang",
            "signature_reason": "HANG: FC-3 artifact optional",
        },
        "P_mail": {"reply": 1, "auth": 0, "scoreboard": 0.5},
        "agent_plane": "forward",
    }


# --- Bridges (stubs: real credentials enable real calls) ---

def bridge_git_stub(rt: Runtime, **kwargs: Any) -> dict:
    return {"ok": True, "mode": "stub", "note": "GitHub via connected tools / agent", "kwargs": kwargs}


def bridge_google_stub(rt: Runtime, **kwargs: Any) -> dict:
    native = "MAIL_UNITY_CLOSE DONE" in set(rt.state.get("dones") or [])
    return {
        "ok": True,
        "mode": "stub",
        "from_native": native,
        "note": "Gmail API as connected user until MAIL_UNITY",
        "kwargs": kwargs,
    }


def bridge_cf_stub(rt: Runtime, action: str = "", **kwargs: Any) -> dict:
    if action == "redirect":
        if "G2 DONE" in set(rt.state.get("dones") or []):
            return {"ok": True, "redirects": "declared_done"}
        token = kwargs.get("token")
        if not token:
            return {
                "ok": False,
                "error": "bridge_needs_token_or_G2_DONE",
                "attack": "CF API token Zone+Redirect or dashboard G2 DONE",
            }
        return {"ok": False, "error": "token_present_but_live_cf_call_not_wired_in_this_harness", "next": "wire CF API client"}
    return {"ok": True, "mode": "stub", "action": action}


def bridge_sq_stub(rt: Runtime, **kwargs: Any) -> dict:
    return {
        "ok": True,
        "mode": "stub",
        "note": "No Squarespace circumvention; bond is CF redirect away",
        "kwargs": kwargs,
    }


def main() -> None:
    rt = Runtime()
    report = rt.call("forward.run")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
