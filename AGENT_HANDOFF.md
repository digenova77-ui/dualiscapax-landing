# DualisCapax · Agent Handoff

**Current as of:** `2026-08-31T18:20:00Z` (UTC)
**Local context:** 2026-08-31 02:20 PM EDT
**Repo:** `digenova77-ui/dualiscapax-landing` · `main`
**Live:** https://dualiscapax.ai/
**Corp:** 1001718450 ONTARIO INCORPORATED · Articles 21 Aug 2026
**Rule:** Future agents start here. Do not start behind this timestamp. Update this file after every ship.

---

## 0. Start the next prompt with

Iris is a one-screen chat. Kernel `kernel-2026-08-31a`. Iris book removed. Live bridge `IrisLive` veto/greet/look first, remote only if `DC_API_BASE` or `?api=` is set. Ontario Measure live. Medical door open to .org / .gov / SEAL-1. **Card / Stripe OPEN** (live Payment Links wired 31 Aug 2026). HUD uses locked T-LAUNCH 2026-08-24 00:00 UTC. Worker origin still unpublished. Unbound gateways dealt with in real time.

---

## 1. Identity

- **Public firm:** DualisCapax — Residual Law Finance · Edge Technologies · Adaptive AI · Research
- **Logical AI:** DCLM-AI. Public face Iris. First person. Short. Veto first. No book.
- **Offer:** a prediction model shaped to the visitor's constraints, built ahead of time. Simulation is not treatment. Not a coin. Not a diagnosis. Not shares.
- **Motto:** Truth Prevails · No tribes preferred · No shove
- **Law:** Ontario and Canadian law apply.
- **Operator rule:** Do not change DualisCapax site, Drive documents, or project files on a whim. Only apply what was asked. Internal terms (L2, Playground, 2P5L) stay off the public surface unless asked.

---

## 2. Live rails

| Door | Path | State |
|------|------|-------|
| Fuel | `/fuel.html` | Open. Prepaid time. Crypto. |
| SRI-1 | `/sri.html` | Open. Fiat face CAD $0. Crypto only. Invert-or-zero. |
| Donate | `/donate.html` | Open. Interac e-transfer + listed crypto. No bank numbers on the page. |
| Onboard | `/onboard.html` | Door open. |
| Ontario Measure | `/measure.html` | Open. `DC-MS-ON-TOU-1`. |
| Medical | `/research/healthcare/` | Open under constraint. |
| Iris | `/ai/app.html` | One-screen chat. Veto + greet/look + live fallback. |
| Card / Stripe | `/payments.html` · `/research/access.html` | **OPEN.** Live Payment Links. |

### Serialized clock / ledger (HUD)

| ID | Parameter | Value | Unit | Status |
|----|-----------|-------|------|--------|
| T-LAUNCH | Public surface start | 2026-08-24 00:00 UTC | datetime | locked |
| T-SING-BASE | Singularity if pledged = 0 | 2036-08-24 00:00 UTC | datetime | model M |
| R-CAD-DAY | Pledge advance rate | 1000 | CAD / day | model M |
| R-MAX-ADV | Max advance days | 3650 | days | model M |
| R-FLOOR | Singularity floor | now + 30 | days | UI guard |
| LEDGER-EARNED | Total earned | 0 | CAD | honest until verified |
| LEDGER-PLEDGED | Total pledged | 0 | CAD | honest until verified |

HUD: Live | Earned | Singularity + rail + foot line. No old epoch dates on glass.

---

## 3. Iris UI law (30 Aug 18:40 EDT)

- Full viewport. No page jump. Four dock controls only: attach, talk, field, send.
- Header tools: hear, camera, clear. No hidden long-press. No triple-tap.
- Chips vanish after first turn. Session memory in `sessionStorage` key `dc.iris.v1`.
- Tap an Iris bubble to copy. Door links come from kernel `href` / `label`.
- Load order: `/js/api-unified.js` → `dclm-look.js` → `iris-live.js`. No iris-book.js.
- `IrisLive.run`: VETO first, greet/look next, remote `/v2/chat` only on SEED when `DC_API_BASE` or `?api=` is set.
- Iris book file and matchBook path removed 2026-08-31. No IRIS_BOOK merge.

---

## 4. Visitor law

**Door sentence:** Every decision leaves a residual. What will yours cost?

**Path words:** For you · Look · Measure · Bind

---

## 5. Still leftover (real-time)

1. Drive file-body write WAIT_GRANT
2. Medical email is session-checked, not mailbox-verified; MEDICAL-GATE still omits paid-seat door (operator to choose A/B/C)
3. Cloudflare worker `dualiscapax-depth` origin unpublished
4. Operator may still deploy worker + set `DC_API_BASE`
5. Webhook + treasury + equal-CAD crypto rail verification — deal in real time if unbound

**Payment gateway opened by operator order 2026-08-31. HUD clock locked to T-LAUNCH 2026-08-24.** Truth prevails.
