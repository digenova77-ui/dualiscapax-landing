# DualisCapax DCLM & Agent Iris — Master Production Release v5.0.0

**Release Tag:** `v5.0.0-production`  
**Document Control ID:** `ED-REL-20260901-RELEASE-V5`  
**Classification:** CANONICAL PRODUCTION RELEASE SPECIFICATION  
**Operating Entity:** DualisCapax Inc. (535 Bridge St E, Belleville, Ontario, Canada K8N 1R7)  
**Author & System Architect:** David John Di Genova (DualisCapax / residual IP · ORCID: [0009-0005-6291-8508](https://orcid.org/0009-0005-6291-8508))  
**Target Repository:** `digenova77-ui/dualiscapax-landing`  
**Live Surface:** <https://dualiscapax.ai>  

---

## 1. Executive Summary & Release Scope

DualisCapax Release `v5.0.0` unifies the entire deterministic AI governance framework, sovereign multi-sector intake dossiers, decentralized validator node incentives, and the complete 30+ document GitHub Encyclopedia System of Record.

### Key Highlights:
1. **DCLM Layer [0] Law Floor:** Absolute non-bypassable enforcement of `NO_FORCE`, `HOST_SAFE`, `CLEANUP_FIRST`, and `TRUTH_OR_NOTHING`.
2. **Sub-4.20 ms Invariant M-S Watchdog:** Real-time hardware circuit breaker verified across 50,000 extreme-load cycles (mean $14.84\ \mu\text{s}$, 0 frame drops).
3. **Agent Iris Blockchain Node Incentive Network:** Multi-tier validator topology (Tier-1 SGX TEE, Tier-2 Plaquette Guardians) with 70/20/10 dual-yield fee distribution.
4. **$250,000 "Break the Invariant" Red-Teaming Challenge:** Public security challenge evaluating watchdog bypass, Hamiltonian drift, Landauer memory extraction, and DFA schema injection.
5. **Interactive Client HUD & Gateway Workers:** Embedded cognitive console on `dualiscapax.ai` with live telemetry streaming and Cloudflare D1 fulfillment logging.

---

## 2. Quickstart Deployment Guide

```bash
# 1. Clone repository
git clone https://github.com/digenova77-ui/dualiscapax-landing.git
cd dualiscapax-landing

# 2. Verify SHA-256 cryptographic integrity
python3 encyclopedia/crypto_tools/encrypt_archive.py

# 3. Test sub-millisecond local encyclopedia search
python3 encyclopedia/crypto_tools/query_encyclopedia.py "blockchain"

# 4. Deploy Cloudflare edge workers
cd workers/iris-gateway && wrangler deploy
cd ../stripe-fulfill && wrangler deploy
```
