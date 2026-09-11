# Unify: TeamSnap · LiveBarn · Hudl · Dualis

Document: ED-COM-20260911-TAPEPIPE-V1  
Binds to: `research/SEC01-ALACARTE.md`, `src/engine/biophysical/LOOP.md`  
Not a partnership announcement. Not an API we own. A seat-order for the website hatch.

## Who owns what (do not steal their job)

| System | Job | Dualis does **not** |
|---|---|---|
| **TeamSnap** | Who is on the roster, when they play, who RSVP'd, who paid the club | scheduling, chat, registration |
| **LiveBarn** | The tape. Pano VOD ~30 days. Venue camera. Sportlogiq Player Analysis Hub already sells shift cuts from that tape | install cameras, stream families |
| **Hudl** | Coach language. Clip the shift, tag the forecheck, share to the room | replace Sportscode / Instat |
| **Dualis** | Four clocks + a receipt. Peak ≠ mean. PCr after bench. Glycogen is the period. Residual only if a tape proves waste | NHL xG, LiveBarn CDN, TeamSnap payments |

LiveBarn × Sportlogiq already exists (Player Analysis Hub). HELIOS already swallows LiveBarn 30-min downloads. We do not pretend that layer is empty.

## The unified object

One game becomes one Dualis docket:

```
TeamSnap event_id + roster seats
        ↓ consent (guardian / 18+)
LiveBarn venue + start + surface  →  VOD window (30 d)
        ↓ clip or Sportlogiq shift list OR coach Hudl tags
Dualis measured_tape[]  →  PCr / Pi-ADP / glycogen / F|D
        ↓
receipt hash on LATEST.json
residual $ only if ice-waste is measured, not modeled
```

Fields the engine already accepts:

`shift_s, peak_kmh, mean_kmh, bursts, hr_peak, hr_bench, bench_s`

Anything else (jersey CV, xG, clip URL) stays on Hudl/LiveBarn. Dualis stores a **pointer**, not the video.

## Website hatch (pipe Hub)

Scale **Social / Provincial**:

1. Bind TeamSnap team (or paste roster seats). Consent first.
2. Point at a LiveBarn VOD window. If none, use literature prior — `quinte_tape_present: false`.
3. Optional: Hudl playlist URL as coach tags.
4. Run SEC-01. Print clocks. CTA while closed: CLOSED — request grant.

One sentence:

> TeamSnap knows who showed up. LiveBarn is the tape. Hudl is the clip. Dualis names the leftover.

## Pricing (unchanged ladder)

They already pay TeamSnap (~$0–$26 USD/mo/team) and LiveBarn (family sub) and maybe Hudl. Dualis does not bundle those fees.

| Dualis SKU | Uses their stack how |
|---|---|
| L0 / L1 $0 | no import |
| Leaf $49 | one seat; paste numbers from a watch or one LiveBarn shift cut |
| Branch $299 | coach: Hudl tags → period F/D print |
| Trunk $499 | club: TeamSnap roster cap 20 de-identified + LiveBarn window slot |
| Residual 19% Y1 | only after a season book shows wasted ice minutes that then moved |

Do not sell "Hudl included." Do not sell "LiveBarn replacement."

## Consent / youth

TeamSnap already holds the family graph. That is the consent door. Dualis never hosts a named minor's clip. Hash in, PII out. Guardian token or 18+.

## What we build vs what we do not

Build: import adapters (CSV / pasted shift list / later official APIs if granted).  
Do not build: a second TeamSnap. A rink camera network. A Sportscode clone.

If a grant never comes, the unify is still true as a **story of the pipe**. The engine already has the tape slot. The other three companies already have the tape.
