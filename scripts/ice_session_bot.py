#!/usr/bin/env python3
"""Ice session bot — GitHub worker for this chat's instruction set.

Not Grok/Harper/Benjamin/Lucas. Not Eyes/Meaning/Watchdog.
Audit + honest receipt. Optional one xAI brief when key + non-AUDIT task.
Never writes ice-portal.js.
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LAW = ROOT / "units" / "infra" / "ice-session-bot" / "INSTRUCTION-SET.md"
LEDGER = ROOT / "src" / "engine" / "ledgers" / "session"
PACKS = ROOT / "units" / "infra" / "ice-session-bot" / "packs"
PORTAL = ROOT / "cf-pages" / "js" / "ice-portal.js"
OVERLAY = ROOT / "cf-pages" / "js" / "ice-seat-teamsnap-only.js"
FOREST = ROOT / "units" / "FOREST.json"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def read_text(path: Path) -> str:
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def audit() -> dict:
    portal = read_text(PORTAL)
    overlay = read_text(OVERLAY)
    blob = portal + "\n" + overlay
    findings = []
    ok = True

    if not PORTAL.exists():
        ok = False
        findings.append({"id": "portal_missing", "ok": False})
    elif portal.strip() == "PLACEHOLDER":
        ok = False
        findings.append({"id": "portal_placeholder", "ok": False, "law": "never write PLACEHOLDER over ice-portal.js"})
    else:
        findings.append({"id": "portal_placeholder", "ok": True, "bytes": len(portal.encode("utf-8"))})

    if "cdn.jsdelivr.net" in portal or "__DC_ICE_PORTAL_LOADING" in portal:
        findings.append({"id": "portal_is_loader", "ok": True, "note": "inline engine not restored; loader allowed if last-good pin exists"})

    spordle_btn = 'data-prove="spordle"' in portal or "Continue with Spordle" in portal
    overlay_hides = OVERLAY.exists() and (
        "spordle" in overlay.lower() and ("remove" in overlay.lower() or "hide" in overlay.lower() or "teamsnap" in overlay.lower())
    )
    if spordle_btn and not overlay_hides:
        ok = False
        findings.append({"id": "seat_spordle_option", "ok": False})
    else:
        findings.append({"id": "seat_spordle_option", "ok": True, "portal_has_button": spordle_btn, "overlay_present": OVERLAY.exists()})

    forest_ok = FOREST.exists()
    findings.append({"id": "forest_present", "ok": forest_ok})
    if not forest_ok:
        ok = False

    return {"ok": ok, "findings": findings}


def maybe_xai(task: str, law: str) -> dict:
    key = (os.getenv("XAI_API_KEY") or "").strip()
    t = (task or "AUDIT").strip() or "AUDIT"
    if t.upper() in {"AUDIT", "STUB", ""}:
        return {"status": "SKIP_TASK", "task": t}
    if not key:
        return {"status": "AWAITING_KEYS", "task": t, "note": "XAI_API_KEY missing — no invented Grok paragraph"}
    payload = {
        "model": "grok-3",
        "temperature": 0,
        "messages": [
            {"role": "system", "content": law[:12000]},
            {"role": "user", "content": "Task for Dualis ice-session-bot (honest, cite-only, no destiny):\n" + t[:4000]},
        ],
    }
    req = urllib.request.Request(
        "https://api.x.ai/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            body = json.loads(resp.read().decode("utf-8"))
        text = (((body.get("choices") or [{}])[0].get("message") or {}).get("content")) or ""
        return {"status": "LIVE_BRIEF", "task": t, "model": "grok-3", "chars": len(text), "text": text[:8000]}
    except Exception as exc:  # noqa: BLE001 — honest fail
        return {"status": "CALL_FAIL", "task": t, "error": str(exc)[:400]}


def main() -> int:
    task = os.getenv("SESSION_DESK_TASK") or os.getenv("ICE_SESSION_TASK") or "AUDIT"
    law = read_text(LAW)
    receipt = {
        "kind": "ice_session_bot",
        "unit": "infra/ice-session-bot",
        "captured_at": utc_now(),
        "law": "same instruction set as the Ice chat team — not a GrokBot clone",
        "task": task,
        "audit": audit(),
        "model": maybe_xai(task, law),
    }
    LEDGER.mkdir(parents=True, exist_ok=True)
    PACKS.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out = LEDGER / f"receipt_{stamp}.json"
    out.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    latest = LEDGER / "LATEST.json"
    latest.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    brief = receipt["model"].get("text")
    if receipt["model"].get("status") == "LIVE_BRIEF" and brief:
        (PACKS / f"brief_{stamp}.md").write_text(
            "# Ice session brief\n\n" + brief + "\n", encoding="utf-8"
        )
    print(json.dumps({k: receipt[k] for k in ("kind", "captured_at", "task", "audit", "model") if k != "text"}, indent=2))
    slim = dict(receipt)
    if "text" in slim.get("model", {}):
        slim["model"] = {k: v for k, v in slim["model"].items() if k != "text"}
        slim["model"]["text_omitted"] = True
    print("---")
    print(json.dumps(slim, indent=2))
    if not receipt["audit"]["ok"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
