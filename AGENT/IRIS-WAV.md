# Iris greet WAV — watchdog

Stamp: 2026-09-23T14:36Z
Clerk: `unity:wav.clerk`
Watch: `unity:wav.watch`
Publish: `unity:publisher.clerk` on-drop

TTS is not success. TTS is a hole with a mute-guard.
We do not want to fall back to TTS. Until a speech take 200s on the street, the watch stays CRITICAL.

## Street probe (must all pass)

1. `GET https://dualiscapax.ai/audio/iris-greet.wav` → 200, Content-Type audio/*, bytes ≥ 50000 (speech, not the 0.38s jewelry chime)
2. Root `index.html` loads `js/iris-wav.js`
3. `js/iris-wav.js` reports `IrisWav.hole === false` after greet

Fail any one → ticket L-WAV stays CRITICAL → escalate pipe → develop drops the take on root `audio/` → publisher.clerk pushes main → watch curls again the same minute.

## Law

- Jewelry chime is not the take.
- Phone TTS of a novel sentence is a mute-guard only. Watch still holes it.
- Do not delete the TTS function until the wav 200s. Silence is worse than a flagged hole.
- New sentences need a new take, not speechSynthesis pretending to be DSAP.
