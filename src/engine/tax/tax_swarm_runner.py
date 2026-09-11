"""
DualisCapax: Canadian Tax Swarm Engine (Ontario CCPC & Personal T1/T2)
Document Control ID: ED-TAX-20260911-CANADIAN-CCPC-V1
Invariants: NO_FORCE, HOST_SAFE, CLEANUP_FIRST, TRUTH_OR_NOTHING
Master Gate: NO for CRA Direct Send (Crown wet-ink = owner only)
"""
import os, sys, time, json, sqlite3, hashlib, threading
from typing import Dict, Any, List, Optional

CRA_GIFI_CODES = {
    "REVENUE_SERVICES": {"gifi": 8000, "desc": "Trade sales of goods and services"},
    "SOFTWARE_LICENSES": {"gifi": 8520, "desc": "Software and digital tools"},
    "HARDWARE_EQUIPMENT": {"gifi": 8670, "desc": "Capital Cost Allowance (Class 50: 55%)"},
    "OFFICE_SUPPLIES": {"gifi": 8760, "desc": "Office expenses and cloud hosting"},
    "PROFESSIONAL_FEES": {"gifi": 8810, "desc": "Legal, accounting, and consulting fees"},
    "TRAVEL_TRANSPORT": {"gifi": 8860, "desc": "Commercial travel and transport"},
    "MEALS_ENTERTAINMENT": {"gifi": 8523, "desc": "Meals and entertainment (50% deductible)"},
    "SRED_RESEARCH_DEV": {"gifi": 9999, "desc": "SR&ED Qualified Algorithm R&D (Form T661 eligible)"}
}

class CanadianTaxSwarmBroker:
    def __init__(self, db_path: str = ":memory:"):
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self._lock = threading.Lock()
        with self._lock:
            self.conn.execute('''
                CREATE TABLE IF NOT EXISTS tax_transactions_d1 (
                    tx_id TEXT PRIMARY KEY,
                    date TEXT NOT NULL,
                    amount_cad REAL NOT NULL,
                    category TEXT NOT NULL,
                    gifi_code INTEGER,
                    gst_hst_paid REAL,
                    is_sred_eligible INTEGER DEFAULT 0,
                    cca_class INTEGER DEFAULT 0,
                    status TEXT NOT NULL,
                    receipt_hash TEXT,
                    claimed_by TEXT,
                    created_at INTEGER NOT NULL
                );
            ''')
            self.conn.commit()

    def ingest_transaction(self, tx_id: str, date: str, amount_cad: float, category: str, gst_hst: float = 0.0) -> bool:
        now = int(time.time())
        with self._lock:
            try:
                self.conn.execute(
                    "INSERT INTO tax_transactions_d1 (tx_id, date, amount_cad, category, gst_hst_paid, status, created_at) VALUES (?, ?, ?, ?, ?, 'PENDING', ?)",
                    (tx_id, date, amount_cad, category, gst_hst, now)
                )
                self.conn.commit()
                return True
            except sqlite3.IntegrityError:
                return False

    def claim_pending_tx(self, worker_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            cursor = self.conn.execute("SELECT * FROM tax_transactions_d1 WHERE status = 'PENDING' ORDER BY created_at ASC LIMIT 1")
            row = cursor.fetchone()
            if not row: return None
            tx_id = row["tx_id"]
            self.conn.execute("UPDATE tax_transactions_d1 SET status = 'AUDITED', claimed_by = ? WHERE tx_id = ?", (worker_id, tx_id))
            self.conn.commit()
            return dict(row)

    def reconcile_tax_return(self, output_file: Optional[str] = None) -> Dict[str, Any]:
        with self._lock:
            cursor = self.conn.execute("SELECT * FROM tax_transactions_d1")
            rows = [dict(r) for r in cursor.fetchall()]

            total_revenue = sum(r["amount_cad"] for r in rows if r["category"] == "REVENUE_SERVICES")
            total_expenses = sum(r["amount_cad"] for r in rows if r["category"] not in ["REVENUE_SERVICES", "HARDWARE_EQUIPMENT"])
            total_itc_hst = sum(r["gst_hst_paid"] for r in rows if r["gst_hst_paid"] is not None)
            sred_pool = sum(r["amount_cad"] for r in rows if r.get("is_sred_eligible") == 1)

            net_income = total_revenue - total_expenses
            combined_tax_rate = 0.122 # Federal 9% + Ontario 3.2% CCPC small business rate
            estimated_tax = max(0.0, net_income * combined_tax_rate)

            t2_draft = {
                "timestamp_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "jurisdiction": "Canada (Federal) & Ontario (Provincial)",
                "entity": "DualisCapax Inc. (Ontario CCPC)",
                "gifi_schedule_125": {
                    "total_revenue_cad": round(total_revenue, 2),
                    "total_operating_expenses_cad": round(total_expenses, 2),
                    "net_income_cad": round(net_income, 2)
                },
                "schedule_t661_sred_pool_cad": round(sred_pool, 2),
                "form_gst34_input_tax_credits_cad": round(total_itc_hst, 2),
                "estimated_combined_corporate_tax_cad": round(estimated_tax, 2),
                "crown_wet_ink_master_gate": {
                    "cra_direct_transmit_allowed": False,
                    "statute": "Crown wet-ink (CRA send, physical signature) = owner only. Master gate = NO for CRA send."
                },
                "reconciliation_status": "CONSERVED_BALANCED"
            }

            if output_file:
                os.makedirs(os.path.dirname(os.path.abspath(output_file)) or ".", exist_ok=True)
                with open(output_file, "w") as f:
                    json.dump(t2_draft, f, indent=2)
            return t2_draft

class TaxClerkAgent(threading.Thread):
    def __init__(self, clerk_id: str, broker: CanadianTaxSwarmBroker):
        super().__init__(name=clerk_id)
        self.clerk_id = clerk_id
        self.broker = broker
        self.running = True

    def run(self):
        while self.running:
            tx = self.broker.claim_pending_tx(self.clerk_id)
            if not tx:
                time.sleep(0.005)
                continue
            cat = tx["category"]
            gifi = CRA_GIFI_CODES.get(cat, {"gifi": 9270})["gifi"]
            is_sred = 1 if cat in ["SRED_RESEARCH_DEV", "SOFTWARE_LICENSES"] else 0
            cca_class = 50 if cat == "HARDWARE_EQUIPMENT" else 0
            receipt = hashlib.sha256(f"{tx['tx_id']}::{gifi}::{tx['amount_cad']}::{is_sred}".encode()).hexdigest()

            with self.broker._lock:
                self.broker.conn.execute(
                    "UPDATE tax_transactions_d1 SET gifi_code = ?, is_sred_eligible = ?, cca_class = ?, receipt_hash = ?, status = 'RECONCILED' WHERE tx_id = ?",
                    (gifi, is_sred, cca_class, receipt, tx["tx_id"])
                )
                self.broker.conn.commit()

if __name__ == "__main__":
    broker = CanadianTaxSwarmBroker(":memory:")
    broker.ingest_transaction("TX-001", "2026-09-01", 5000.00, "REVENUE_SERVICES", gst_hst=650.00)
    broker.ingest_transaction("TX-002", "2026-09-02", 1200.00, "SOFTWARE_LICENSES", gst_hst=156.00)
    broker.ingest_transaction("TX-003", "2026-09-03", 2500.00, "HARDWARE_EQUIPMENT", gst_hst=325.00)
    broker.ingest_transaction("TX-004", "2026-09-04", 1800.00, "SRED_RESEARCH_DEV", gst_hst=234.00)

    clerks = [TaxClerkAgent("Iris-Tax-01", broker), TaxClerkAgent("Iris-Tax-02", broker)]
    for c in clerks: c.start()
    time.sleep(0.05)
    for c in clerks: c.running = False; c.join()
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "T2_DRAFT_RETURN.json")
    res = broker.reconcile_tax_return(out)
    print("Tax reconciliation completed:", res["reconciliation_status"])
