# DCLM Hockey Identification Ontology — V0 (minimal)

**Date:** 2026-09-14 (America/Toronto)  
**Status:** DRAFT · prove-first · no invent · no Sportlogiq/CV clone  
**Source law:** Video = ground-truth cross-ref / see→log attestation seat. Not a marketable video-AI product.  
**Prove path:** NHL historical broadcast defines identity classes cleanly → later same eyes on amateur / Dom #29 for measurable why-fail-vs-pro gaps.  
**Dom #29 Quinte:** deferred until NHL pipe proves READ → log.

## Product path (one sentence)

NHL tape teaches DCLM what a position / hit / block / goalie / goal *looks like*; amateur tape later measures the *gap* (why a youth play fails vs pro frame) — same ontology, different seat DB cross-ref.

## Conflict law (LiveBarn / Sportlogiq)

| Pipe | Dualis role | Forbidden |
|---|---|---|
| **LiveBarn paired session** | Partner meter; pointer + Dualis session chrome | Real-time CV engine; iframe scrape; re-host VOD |
| **Sportlogiq / LiveBarn PA** | Their $14.95 meter; optional paste TOI later | 500-metric clone; xG as Dualis IP |
| **This spike (historical NHL cite)** | Offline see→log prove on cited public highlight | Deploy as public product; claim auto CV on Ice |

Pipes stay separate: `tape_pipe=livebarn` ≠ `see_log.source=nhl_historical_cite`.

## Empty / awaiting rules (global)

1. If not clearly visible in frame(s) → `status: empty` or `awaiting` — never invent.  
2. Confidence only: `high` | `med` | `low` | `empty`. No float scores pretending precision.  
3. Jersey without readable digits → `jersey: null`.  
4. Position without ice-context cues → `observedPos: null` (do not copy roster).  
5. Event without multi-frame / scorebug corroboration → do not stamp goal/hit/block.  
6. Cite `source.url` always. Dualis does not provide the data; it logs what was seen.

---

## Role classes (identity)

### `role.goalie`
**Visual criteria (minimal):**
- Distinct large leg pads + catching glove / blocker silhouette
- Occupies crease / near goal line relative to net
- Often differently colored pads vs skaters; mask/cage

**PASS today if:** pads + net proximity co-visible.  
**FAIL / empty if:** far camera, obscured net-front scramble, or skater only.

### `role.skater`
**Visual criteria:** upright skate posture, stick, no goalie pads.  
Bucket later via position classes.

### `role.referee` (optional, ignore for seat)
Striped jersey / distinct armbands — exclude from player see→log.

---

## Position classes (on-ice location ≠ roster claim)

Roster `pos` (TeamSnap / seat DB) is **claim**. Video `observedPos` is **attestation**.

### `pos.G`
Same cues as `role.goalie`.

### `pos.D` (defense)
**Visual criteria:**
- Typically deeper in defensive zone when defending
- Point position on offensive blue line on OZ possession (two players near blueline)
- **Weak alone:** zone alone ≠ D without formation context

### `pos.F` then `pos.LW` | `pos.C` | `pos.RW`
**Visual criteria (NHL broadcast helps):**
- **F:** involved in forecheck / slot / cycle below hash marks more often than D
- **C:** faceoff dot alignment at draw; mid-ice lane between wings
- **LW / RW:** strong-side boards relative to attacking direction (viewer must know attack direction)

**Honest V0:** Single still → often only `F|D|G` at `med`/`low`. LW/C/RW needs sequence + attack direction + faceoff or boards context. Empty OK.

---

## Event classes

### `event.hit`
**Looks like:** one skater drives body into another; contact; often victim loses balance / puck separate; may show hit graphic on NHL broadcast.  
**Need:** contact frame + before/after if claiming.  
**Empty if:** near-miss, stick check only, or unclear who initiated.

### `event.blocked_shot`
**Looks like:** shooter winds / releases; defender in shooting lane; puck trajectory interrupted by defender body/stick **before** reaching goalie.  
**Need:** shooter + defender + puck path evidence (multi-frame preferred).  
**Empty if:** tip-in, goalie save, or puck not visible.

### `event.shot_on_goal`
Puck toward net; goalie attempts save; puck does **not** fully cross goal line.  
Distinct from block (goalie is last barrier).

### `event.goal` / `puck_in_net`
**Looks like when clock running:**
1. Puck fully crosses the goal line into the net (plane of posts), **and**
2. Play is live (clock running / no whistle freeze before), **and**
3. Prefer corroboration: scorebug increments, goal light/siren, net bulge, celebration.

**V0 rule:** Do **not** stamp `goal` from celebration alone. Prefer puck-over-line **or** scorebug +1 with cited window.  
**Empty if:** replay package without live clock context and no scorebug change visible.

### `event.faceoff`
Two centers at dot; referee drops puck.

### `event.save`
Goalie controls or redirects puck that would otherwise enter net; puck not fully over line.

---

## See→log schema (provisional)

```json
{
  "schema": "dc.dclm.see_log.v0",
  "seatId": null,
  "jersey": null,
  "observedPos": null,
  "source": {
    "kind": "nhl_historical_broadcast_cite",
    "url": "",
    "title": "",
    "window": { "t0": "00:00", "t1": "00:00" },
    "note": "cite only; Dualis does not host"
  },
  "ts": "",
  "observations": [],
  "note": ""
}
```

Observation object:

```json
{
  "class": "role.goalie|pos.D|event.hit|event.blocked_shot|event.goal|...",
  "status": "attested|empty|awaiting",
  "confidence": "high|med|low|empty",
  "evidence": "what was visible (cite frames/times)",
  "jersey": null,
  "observedPos": null
}
```

---

## Identification → decisions (why this ontology)

Once classes are stable, DCLM can ask per seat: *did video attest this jersey at this pos / in this event?*  
That unlocks cross-ref to digital seat DB (e.g. Dom #29 LW) — **after** NHL prove. Amateur gap analysis = same classes, different outcome rates / execution quality — not a new CV product.

## Out of scope V0

- Auto tracking / multi-object CV pipeline  
- xG, heat maps, 500 metrics  
- LiveBarn real-time engine  
- Public website deploy  
- Pricing lift before prove
