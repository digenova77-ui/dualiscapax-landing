# DSAP-1.0 — holographic spatial audio protocol (sleeve)

**Document Control ID:** ED-GOV-20260901-DSAP-SLEEVE-V1  
**Stamp:** 2026-09-01  
**Working files:** `js/dsap-engine.js` (`dsap-1.0-sleeve-2026-09-01`), `js/iris-av.js` (`iris-av-v2-2026-09-01`)  
**Seat:** Iris house (`/ai/app.html`) behind ♪  
**Status:** INDEXED stub matching the sleeve that already ships

This file does not invent a codec. It names what the browser jacket actually does.

## What it is

A Web Audio **sleeve**:

- 64-point speaker ring (360° / 64 = 5.625°)
- `PannerNode` HRTF + inverse distance
- Proximity bass under 1.2 m
- Anechoic wet mix α = 0.998
- Speech routed as a spatial presence field *beside* `speechSynthesis`
- Fail closed: if `AudioContext` is blocked, engine stays silent (`HOST_SAFE`)

## What it is not

- Not a new audio or video codec (not Dualis-Opus, not AV1)
- Not a sealed KEMAR measurement archive
- Not a sub-15 ms WebTransport rail until that rail is bound
- Not auto-play on the field. Unlock is a guest gesture (♪ / send / talk).

## Law floor the sleeve prints

`NO_FORCE` · `HOST_SAFE` · `CLEANUP_FIRST` · `TRUTH_OR_NOTHING`

House default for *voice* may be ♪ on (`sound_on_default.md`).  
DSAP ring still waits for a tap. Missing AudioContext is silence, not a crash.

## Stay / leave

Stay the sleeve. Leave a Kodak myth.
