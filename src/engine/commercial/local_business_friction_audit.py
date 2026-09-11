"""
DualisCapax: Local Commercial & Hospitality Friction Audit Engine
Document Control ID: ED-COMM-20260911-LOCAL-BIZ-AUDIT-V1
Tailored for Regional Hospitality, POS, and Thermal Operations (Trenton/Belleville Pilot)
"""
import os, sys, time, json, math, hashlib
from typing import Dict, Any, List

class LocalBusinessFrictionAuditor:
    def __init__(self, business_name: str, annual_revenue_cad: float):
        self.business_name = business_name
        self.annual_revenue_cad = annual_revenue_cad

    def audit_operational_friction(
        self,
        pos_transactions_annual: int,
        payment_processing_fee_pct: float = 2.75,
        refrigeration_units_count: int = 4,
        annual_energy_utility_cad: float = 24000.0,
        food_waste_spoilage_pct: float = 3.50,
        labor_payroll_annual_cad: float = 180000.0
    ) -> Dict[str, Any]:
        t0 = time.perf_counter()

        pos_friction = self.annual_revenue_cad * (payment_processing_fee_pct / 100.0) * 0.35
        energy_friction = annual_energy_utility_cad * (0.18 + (refrigeration_units_count * 0.02))
        food_cost_estimate = self.annual_revenue_cad * 0.32
        spoilage_friction = food_cost_estimate * (food_waste_spoilage_pct / 100.0) * 0.40
        labor_friction = labor_payroll_annual_cad * 0.085

        total_annual_friction = pos_friction + energy_friction + spoilage_friction + labor_friction

        year_1_client_retention_pct = 81.0
        year_1_retained_savings = total_annual_friction * (year_1_client_retention_pct / 100.0)

        five_year_projection = []
        for year in range(1, 6):
            retention_rate = 81.0 + (year - 1) * 4.75
            client_keeps = total_annual_friction * (min(100.0, retention_rate) / 100.0)
            five_year_projection.append({
                "year": year,
                "client_retention_rate_pct": min(100.0, retention_rate),
                "client_retained_savings_cad": round(client_keeps, 2),
                "ongoing_software_fee_cad": 0.00
            })

        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        audit_hash = hashlib.sha256(f"{self.business_name}::{total_annual_friction}::{time.time()}".encode()).hexdigest()

        return {
            "business_name": self.business_name,
            "annual_revenue_cad": self.annual_revenue_cad,
            "addressable_friction_breakdown_cad": {
                "payment_processing_drag": round(pos_friction, 2),
                "thermal_energy_hysteresis": round(energy_friction, 2),
                "inventory_spoilage_mismatch": round(spoilage_friction, 2),
                "labor_scheduling_misalignment": round(labor_friction, 2),
                "total_annual_friction_cad": round(total_annual_friction, 2)
            },
            "fiduciary_terms": {
                "upfront_retainer_cad": 0.00,
                "year_1_client_retained_savings_cad": round(year_1_retained_savings, 2),
                "year_1_client_retention_pct": 81.0,
                "five_year_asymptotic_trajectory": five_year_projection
            },
            "audit_proof_receipt": audit_hash,
            "latency_ms": round(elapsed_ms, 3)
        }

if __name__ == "__main__":
    auditor = LocalBusinessFrictionAuditor("Tomasso's Italian Grill & Jim's Pizzeria Pilot", 850000.0)
    report = auditor.audit_operational_friction(
        pos_transactions_annual=42000,
        payment_processing_fee_pct=2.85,
        refrigeration_units_count=5,
        annual_energy_utility_cad=28000.0,
        food_waste_spoilage_pct=3.8,
        labor_payroll_annual_cad=260000.0
    )
    print("=== DUALISCAPAX COMMERCIAL FRICTION AUDIT ===")
    print(f"Business:         {report['business_name']}")
    print(f"Total Friction:   ${report['addressable_friction_breakdown_cad']['total_annual_friction_cad']:,.2f} CAD / year")
    print(f"Year 1 Client Keeps: ${report['fiduciary_terms']['year_1_client_retained_savings_cad']:,.2f} CAD (81.0%)")
    print(f"Upfront Retainer: $0.00 CAD")
    print(f"Audit Proof:      0x{report['audit_proof_receipt'][:32]}...")
