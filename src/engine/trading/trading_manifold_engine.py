"""
DualisCapax: Symplectic Trading & Price Manifold Engine (Equities & Crypto)
Document Control ID: ED-TRADE-20260911-SYMPLECTIC-MANIFOLD-V1
Invariants: NO_FORCE, HOST_SAFE, TRUTH_OR_NOTHING
Paper Execution & Hamiltonian Phase-Space Optimization
"""
import os, sys, time, json, math, hashlib
from typing import Dict, Any, List

class SymplecticTradingEngine:
    def __init__(self, initial_cash_cad: float = 10000.0):
        self.cash_cad = initial_cash_cad
        self.portfolio: Dict[str, Dict[str, Any]] = {}
        self.trade_history: List[Dict[str, Any]] = []

    def evaluate_market_tick(self, symbol: str, asset_class: str, current_price: float, momentum_p: float) -> Dict[str, Any]:
        t0 = time.perf_counter_ns()
        q = current_price
        p = momentum_p
        h_energy = 0.5 * (p**2 + (q * 0.01)**2)

        if p < -0.05 and h_energy < 50.0:
            action = "BUY"
            allocation_cad = min(self.cash_cad * 0.20, 1000.0)
            quantity = allocation_cad / current_price if current_price > 0 else 0.0
        elif p > 0.10 and symbol in self.portfolio and self.portfolio[symbol]["quantity"] > 0:
            action = "SELL"
            quantity = self.portfolio[symbol]["quantity"] * 0.50
            allocation_cad = quantity * current_price
        else:
            action = "HOLD"
            quantity = 0.0
            allocation_cad = 0.0

        order_receipt = None
        if action == "BUY" and allocation_cad > 0 and self.cash_cad >= allocation_cad:
            self.cash_cad -= allocation_cad
            if symbol not in self.portfolio:
                self.portfolio[symbol] = {"quantity": 0.0, "total_cost": 0.0, "asset_class": asset_class}
            self.portfolio[symbol]["quantity"] += quantity
            self.portfolio[symbol]["total_cost"] += allocation_cad
            order_receipt = hashlib.sha256(f"ORDER_BUY::{symbol}::{quantity}::{current_price}::{time.time()}".encode()).hexdigest()
            self.trade_history.append({"action": "BUY", "symbol": symbol, "qty": quantity, "price": current_price, "receipt": order_receipt})

        elif action == "SELL" and quantity > 0:
            self.cash_cad += allocation_cad
            self.portfolio[symbol]["quantity"] -= quantity
            order_receipt = hashlib.sha256(f"ORDER_SELL::{symbol}::{quantity}::{current_price}::{time.time()}".encode()).hexdigest()
            self.trade_history.append({"action": "SELL", "symbol": symbol, "qty": quantity, "price": current_price, "receipt": order_receipt})

        elapsed_us = (time.perf_counter_ns() - t0) / 1000.0

        return {
            "symbol": symbol,
            "asset_class": asset_class,
            "price": current_price,
            "action": action,
            "quantity": round(quantity, 6),
            "order_value_cad": round(allocation_cad, 2),
            "cash_balance_cad": round(self.cash_cad, 2),
            "h_energy": round(h_energy, 4),
            "receipt": order_receipt,
            "latency_us": round(elapsed_us, 2)
        }

if __name__ == "__main__":
    engine = SymplecticTradingEngine(initial_cash_cad=10000.0)
    res_stock = engine.evaluate_market_tick("SHOP.TO", "EQUITY_CANADIAN", 112.50, momentum_p=-0.08)
    res_crypto = engine.evaluate_market_tick("BTC-CAD", "CRYPTOCURRENCY", 84500.00, momentum_p=-0.12)
    print("Trading engine test complete. Active portfolio:", list(engine.portfolio.keys()))
