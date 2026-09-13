# Sportlogiq × Dualis — integration doors

Document: ED-COM-20260911-SPORTLOGIQ-V1  
Binds to: `research/SEC01-UNIFY-TAPEPIPE.md`  
Not a partnership. Not a scrape. Not an NHL iCE clone.

## What Sportlogiq is now

Montreal CV shop. iCE trusted by ~31 NHL clubs. Acquired by **Teamworks** (2026).  
Data leaves the building through **private partner API / bulk feed**. No public developer portal, no OpenAPI, no self-serve key.

Youth door that already exists: **LiveBarn**.

| Product | What you get | Price (published) | Dualis use |
|---|---|---|---|
| Player Analysis | spotlight clip, TOI, zone split, heat map | **USD $14.95 / game / player** | shift list + TOI → `measured_tape` |
| Player Analysis Hub | 10k+ already-cut games; any account can order a jersey | same | pointer, not a re-host |
| LiveBarn Analytics / iCE Elite | 500+ metrics, xG, entries/exits (2025–26 youth roll-out) | LiveBarn SKU | events stay on LiveBarn |
| iCE pro export | `.mp4` + `.xml` tags → Catapult Focus | contract | XML is the only file-shaped door |
| Partner API | tracking + events | Teamworks contract | Crown / wet-ink only |

Turnaround on a LiveBarn VOD order: ~2–3 hours, no manual cutter.

## Field map (honest)

Sportlogiq can feed. Dualis needs. Gap.

| Dualis `measured_tape` | Sportlogiq / LiveBarn PA | Gap |
|---|---|---|
| `shift_s` | shift cuts + TOI | **yes** |
| `bench_s` | infer from TOI gaps if shifts are timestamped | maybe |
| `peak_kmh` / `mean_kmh` | pro tracking yes; youth pano **variable** | do not invent |
| `bursts` | not a PA field | watch / HELIOS / prior |
| `hr_peak` / `hr_bench` | **never** (no wearable) | Garmin / HPT / prior |
| position F/D | jersey + roster | TeamSnap |
| xG, entries, heat map | iCE Elite / PA | **stay on their page** |

CV does not measure PCr, ADP, Pi, or glycogen. That is the Dualis job after the tape lands.

## Three doors we may build (in order)

1. **Paste** — parent/coach copies TOI + shift count from a $14.95 PA page into Leaf. No API. Legal. Ugly. Ships first.
2. **File** — if a club has iCE and exports XML (same path Catapult documents), map tags → `measured_tape[]`. Grant required to touch their file schema.
3. **Partner** — Teamworks / Sportlogiq / LiveBarn wet-ink. Never advertised as live. Crown only.

Forbidden: scrape Hub, re-host spotlight video, say "powered by Sportlogiq" without a license, sell xG as Dualis IP.

## Pricing effect

The $14.95 is **their** meter. Dualis does not wrap it into Leaf $49.  
Leaf = clocks on numbers the buyer already has (PA page, watch, or prior).  
Trunk = roster slot + VOD pointer, not a Sportlogiq seat.  
Residual still needs a *measured* waste dollar, not an xG model.

## Website one-liner

> Sportlogiq sees the shift. Dualis names what is left in the tank. We do not host their clip.
