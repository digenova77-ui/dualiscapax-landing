#!/usr/bin/env python3
"""
Iris Arbiter GUI — complete self-contained executable.
Uses only the Python standard library (tkinter).
Run: python ai/arbiter_gui.py
"""

import tkinter as tk
from tkinter import ttk, scrolledtext
import json
import math
from typing import Any, Callable, Dict, Optional

# ---------------------------------------------------------------------------
# Arbiter logic (self-contained; mirrors iris_arbiter.py)
# ---------------------------------------------------------------------------

def plus_one_rate(usdc_amount: float, cohort_growth_rate: float, tier: int = 1) -> float:
    if not math.isfinite(usdc_amount) or usdc_amount < 0:
        raise ValueError("usdc_amount must be finite and >= 0")
    if not math.isfinite(cohort_growth_rate):
        raise ValueError("cohort_growth_rate must be finite")
    if not isinstance(tier, int) or isinstance(tier, bool) or tier < 1:
        raise ValueError("tier must be a positive integer")
    rate = 0.001 * (1 + cohort_growth_rate) * (1 + 0.1 * (tier - 1))
    return round(usdc_amount * rate, 6)


LAW_JUDGES: Dict[str, Callable[[Dict[str, Any]], Dict[str, Any]]] = {}


def register_judge(domain: str, judge_fn: Callable[[Dict[str, Any]], Dict[str, Any]]) -> None:
    if not callable(judge_fn):
        raise TypeError("judge_fn must be callable")
    LAW_JUDGES[domain] = judge_fn


def pattern_score(features: Dict[str, Any]) -> Dict[str, Any]:
    if "forced_lean" in features:
        lean = features["forced_lean"]
        margin = float(features.get("forced_margin", 0.5))
        return {"lean": lean, "margin": margin, "honest_label": f"forced lean={lean}"}
    return {"lean": "TIE", "margin": 0.0, "honest_label": "pattern side abstained"}


def _arbitrate_domain(domain: str, law_input: Dict[str, Any],
                      pattern_input: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    judge_registered = domain in LAW_JUDGES
    try:
        law_result = LAW_JUDGES[domain](law_input) if judge_registered else None
    except Exception as exc:
        # A judge crash is a refusal, never an implicit approval.
        law_result = {
            "mode": "deterministic",
            "verdict": "REFUSE",
            "reason": f"judge raised {type(exc).__name__} — fail closed",
        }
    if law_result is None and domain == "plus_one_math" and not judge_registered:
        try:
            r = plus_one_rate(**law_input)
            law_result = {
                "mode": "deterministic", "verdict": "PASS",
                "law": "PLUS_ONE_INCENTIVE.md §1.2",
                "reason": "exact function evaluated", "rate": r,
            }
        except (TypeError, ValueError, OverflowError) as exc:
            law_result = {
                "mode": "deterministic", "verdict": "REFUSE",
                "reason": f"invalid plus_one_math input ({type(exc).__name__}) — fail closed",
            }
    if law_result is None and not judge_registered:
        law_result = {
            "mode": "deterministic",
            "verdict": "REFUSE",
            "reason": "no judge registered — fail closed",
        }

    # A malformed judge result must never be interpreted as approval.
    if not isinstance(law_result, dict) or law_result.get("verdict") not in {"PASS", "REFUSE", "PENDING"}:
        law_result = {
            "mode": "deterministic",
            "verdict": "REFUSE",
            "reason": "missing or invalid judge verdict — fail closed",
        }

    if pattern_input is None:
        pattern = {"lean": "TIE", "margin": 0.0, "honest_label": "pattern side abstained — no features supplied"}
    else:
        pattern = pattern_score(pattern_input)

    law_v = law_result["verdict"]
    lean = pattern["lean"]

    if law_v == "REFUSE":
        verdict, confidence, note = "REFUSE", 1.0, "LAW WINS — deterministic refusal stands; pattern lean recorded, never acted on"
    elif law_v == "PENDING":
        if lean == "IMPURE":
            verdict, confidence, note = "PENDING", 0.35, "held for evidence; pattern intuition dissents — do not act"
        elif lean == "PURE":
            verdict, confidence, note = "PENDING", 0.75, "held for evidence; pattern intuition agrees it is honest"
        else:
            verdict, confidence, note = "PENDING", 0.5, "held for evidence"
    else:
        if lean == "PURE":
            verdict, confidence, note = "PASS", 0.95, "law and intuition agree — confidence amplified"
        elif lean == "IMPURE":
            verdict, confidence, note = "PASS", 0.6, "RESIDUAL: law passes but pattern intuition dissents — verdict stands (law wins), flagged for watch layer"
        else:
            verdict, confidence, note = "PASS", 0.8, "law passes; pattern side abstained"

    return {
        "mode": "hybrid-arbiter",
        "domain": domain,
        "verdict": verdict,
        "confidence": confidence,
        "integration_note": note,
        "deterministic": law_result,
        "probabilistic": pattern,
        "conflict_rule": "LAW WINS — intuition never overrides a deterministic refusal",
    }


def arbitrate(domain: Optional[str] = None,
              law_input: Optional[Dict[str, Any]] = None,
              pattern_input: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    if domain is None:
        return {
            "mode": "hybrid-arbiter",
            "verdict": "ABSTAIN",
            "confidence": 0.0,
            "integration_note": "no domain supplied — abstaining",
            "conflict_rule": "LAW WINS — intuition never overrides a deterministic refusal",
        }
    return _arbitrate_domain(domain, law_input or {}, pattern_input)


# ---------------------------------------------------------------------------
# GUI
# ---------------------------------------------------------------------------

class ArbiterApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Iris Arbiter")
        self.geometry("560x640")
        self.configure(bg="#0f172a")
        self._build()

    def _build(self):
        style = ttk.Style(self)
        style.theme_use("clam")
        style.configure("TLabel", background="#0f172a", foreground="#e2e8f0")
        style.configure("TButton", background="#38bdf8", foreground="#0f172a")
        style.configure("TCombobox", fieldbackground="#1e293b", background="#1e293b", foreground="#e2e8f0")

        pad = {"padx": 12, "pady": 6}

        ttk.Label(self, text="Iris Arbiter", font=("Segoe UI", 16, "bold")).pack(pady=(16, 8))

        frm = ttk.Frame(self)
        frm.pack(fill="x", padx=16)

        ttk.Label(frm, text="Domain").grid(row=0, column=0, sticky="w", **pad)
        self.domain = ttk.Combobox(frm, values=["", "plus_one_math", "custom"], state="readonly", width=28)
        self.domain.grid(row=0, column=1, sticky="ew", **pad)
        self.domain.set("plus_one_math")

        ttk.Label(frm, text="USDC amount").grid(row=1, column=0, sticky="w", **pad)
        self.usdc = ttk.Entry(frm, width=30)
        self.usdc.insert(0, "100")
        self.usdc.grid(row=1, column=1, sticky="ew", **pad)

        ttk.Label(frm, text="Cohort growth rate").grid(row=2, column=0, sticky="w", **pad)
        self.growth = ttk.Entry(frm, width=30)
        self.growth.insert(0, "0.2")
        self.growth.grid(row=2, column=1, sticky="ew", **pad)

        ttk.Label(frm, text="Tier").grid(row=3, column=0, sticky="w", **pad)
        self.tier = ttk.Entry(frm, width=30)
        self.tier.insert(0, "1")
        self.tier.grid(row=3, column=1, sticky="ew", **pad)

        ttk.Label(frm, text="Pattern lean").grid(row=4, column=0, sticky="w", **pad)
        self.lean = ttk.Combobox(frm, values=["", "PURE", "IMPURE", "TIE"], state="readonly", width=28)
        self.lean.grid(row=4, column=1, sticky="ew", **pad)
        self.lean.set("")

        frm.columnconfigure(1, weight=1)

        btn = ttk.Button(self, text="Arbitrate", command=self.run)
        btn.pack(pady=12)

        self.out = scrolledtext.ScrolledText(self, height=18, width=64, bg="#1e293b", fg="#e2e8f0",
                                             insertbackground="#e2e8f0", font=("Consolas", 10))
        self.out.pack(fill="both", expand=True, padx=16, pady=(0, 16))
        self.out.insert("1.0", "Result will appear here.\n")

    def run(self):
        domain = self.domain.get() or None
        try:
            usdc = float(self.usdc.get() or 0)
            growth = float(self.growth.get() or 0)
            tier = int(self.tier.get() or 1)
        except ValueError:
            self.out.delete("1.0", "end")
            self.out.insert("1.0", "Invalid numeric input.")
            return

        law_input = {"usdc_amount": usdc, "cohort_growth_rate": growth, "tier": tier}
        lean = self.lean.get()
        pattern_input = {"forced_lean": lean} if lean else None

        result = arbitrate(domain, law_input, pattern_input)
        text = json.dumps(result, indent=2)
        self.out.delete("1.0", "end")
        self.out.insert("1.0", text)

        verdict = result.get("verdict", "")
        color = {"PASS": "#22c55e", "REFUSE": "#ef4444", "PENDING": "#f59e0b", "ABSTAIN": "#94a3b8"}.get(verdict, "#e2e8f0")
        self.out.tag_configure("v", foreground=color)
        self.out.tag_add("v", "1.0", "end")


if __name__ == "__main__":
    app = ArbiterApp()
    app.mainloop()
