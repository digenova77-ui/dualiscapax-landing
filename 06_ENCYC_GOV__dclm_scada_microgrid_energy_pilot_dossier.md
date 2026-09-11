# DualisCapax: Industrial SCADA Microgrid & Commercial Kitchen Thermal Balancing Pilot Dossier

**Document Control ID:** `ED-INTAKE-20260901-ENERGY-SCADA-MASTER-V2`  
**Classification:** CANONICAL INDUSTRIAL SCADA & ELECTRICAL LOAD BALANCING SPECIFICATION  
**Status:** SEALED · PRODUCTION DIRECTIVE · SYSTEM OF RECORD  
**Operating Entity:** DualisCapax Inc. (535 Bridge St E, Belleville, Ontario, Canada K8N 1R7)  
**Target Enterprises:** Commercial Food Service (Jim's Pizzeria, Tomasso's Italian Grill, QSR Chains), Industrial Manufacturing & Microgrids  
**Author & System Architect:** David John Di Genova (DualisCapax / residual IP · ORCID: [0009-0005-6291-8508](https://orcid.org/0009-0005-6291-8508))  
**Governance Framework:** Dualis & Unity Framework (v0.40-Public) / DCLM Layer [0] Law Floor / IEC 61850  
**Target Repository Path:** `encyclopedia/governance_and_protocols/dclm_scada_microgrid_energy_pilot_dossier.md`  
**Live Surface:** <https://dualiscapax.ai>  

---

## 1. Industrial Problem Statement & Tariff Drag

Commercial kitchens and industrial manufacturing facilities face severe electricity utility penalties driven by **15-minute peak demand charges** (e.g. Ontario Elexicon / Hydro One commercial tariffs ranging from $14.50 to $38.40 CAD/kW/month).

When heavy resistive loads—such as conveyor pizza deck ovens ($15\text{–}25\text{ kW}$ each), commercial deep fryers ($12\text{–}18\text{ kW}$), makeup air ventilation units ($10\text{–}20\text{ kW}$), and refrigeration compressors—cycle on simultaneously during evening rushes (4:30 PM – 7:30 PM), coincident peak demand spikes trigger catastrophic monthly utility demand surcharges that persist for entire billing cycles.

```
+----------------------------------------------------------------------------------------------------+
|                         5-VECTOR KITCHEN THERMAL BALANCING & SCADA MESH                            |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ UNCOORDINATED COINCIDENT PEAK ] ──► All 5 Vectors ON ──► Spikes Demand to 110 kW (CAD $4,224/mo) |
|                                                │                                                   |
|                                                ▼                                                   |
|  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐  |
|  │ DCLM SCADA 5-VECTOR PHASE STAGGERING ALGORITHM                                               │  |
|  │ • Vector 1: Conveyor Deck Ovens (15 min pre-heat pulse / thermal inertia flywheel)           │  |
|  │ • Vector 2: Makeup Air & Kitchen Exhaust (Variable Frequency Drive modulated to oven draw)   │  |
|  │ • Vector 3: Fryer Bank Rapid Recovery (Staggered 90-second alternating duty cycles)         │  |
|  │ • Vector 4: Walk-in Cooler & Freezer Defrost (Locked out during 4:00 PM – 8:30 PM window)    │  |
|  │ • Vector 5: Point-of-Sale (POS) Ticket Flow Synchronized with Oven Induction Timing          │  |
|  └─────────────────────────────────────────────┬────────────────────────────────────────────────┘  |
|                                                │                                                   |
|                                                ▼                                                   |
|  [ FLAT POWER PROFILE ] ──► Demand Clamped to <= 48 kW ──► Shaves CAD $2,380.80/month (56.4% Drop) |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Technical Implementation & Hardware Envelopes

1. **Sub-4.20 ms Islanding Protection & Relay Control:**
   * Uses IEC 61850 / DNP3 industrial protocols with hardware Invariant M-S watchdog monitoring ($0.15\ \mu\text{s}$ loop), instantly disconnecting or modulating loads within $<4.20\text{ ms}$ upon grid voltage sag or phase imbalance.
2. **Thermal Inertia Storage as Energy Battery:**
   * Exploits the physical heat capacity of refractory stone decks ($C_{\text{th}} \approx 1.2\text{ kJ/kg}\cdot\text{K}$) to maintain internal baking temperatures ($525^\circ\text{F} \pm 5^\circ\text{F}$) while interrupting electrical heating elements for 3-to-5 minute intervals during peak grid tariffs.
3. **Fiduciary Cash-Flow Terms:**
   * **Upfront Hardware/Software Retainer:** **CAD $0.00**
   * **Year 1 Retained Client Savings:** **81.0%** of verified demand tariff reductions.
   * **Year 5 Permanent Client Retention:** **100.0%** ($0.00 ongoing software fees).
