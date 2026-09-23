# Iris speak-stream

Stamp: 2026-09-23T14:56Z
Watch: `unity:wav.watch`
This is the ticket for *timbre on a live reply*. Tone is `AGENT/IRIS-TONE.md`. Greet file is `AGENT/IRIS-WAV.md`.

A WAV bank cannot cover a question nobody asked before.
Perfect voice on a novel line is a stream, not a file.

## Pipe

1. She thinks a short coffee-shop sentence (`iris-ring.js` `think()`).
2. Browser `POST /speak` `{ text, lang }` to a Worker. No key in the page.
3. Worker holds the vendor secret. Same voice id as the greet take (SoniaNeural-class).
4. First audio bytes stream back as `audio/mpeg`. Target: hear something under ~800ms.
5. `IrisAV` plays the blob through the same Web Audio graph DSAP already uses.
6. Hash(text+voice+lang) in Cache/KV. Repeat lines skip the vendor.
7. If the Worker 4xx/5xx: speechSynthesis mute-guard. Watch still holes it.

## What is not the pipe

- Browser `speechSynthesis` as the happy path
- Recording every possible sentence
- Putting `sk_` / `xai-` / XI keys in `js/`
- Deleting TTS before the stream 200s

## Secrets (Seat, not git)

One of: Edge/Azure neural, XI, or an xAI audio endpoint if/when it exists.
`wrangler secret put` on the speak Worker. `AGENT/NEVER-COMMIT.md` still wins.

## Dual pipe

Clerk builds the Worker + `IrisAV.speak` tries `/speak` first.
Watch curls `/speak` with a fixed line and checks audio/* and byte size, same as L-WAV.
