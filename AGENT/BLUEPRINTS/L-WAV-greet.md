# Blueprint L-WAV — greet take on the street

State: DESIGN done. DEVELOP next. CRITICAL on-drop.
Cause: KNOWN. File missing. Player missing from the lander.
Exists in the world: `js/iris-wav.js` is on main. The take is not.
Invented: the SoniaNeural take itself must be recorded and committed as a binary.

## Backward compatible

Keep Talk, Voice, orb, camera. Keep `IrisAV.speak` in the file as mute-guard.
Watch treats a TTS greet as HOLE even if the visitor heard something.

## Forward compatible

Later lines get their own files under `audio/iris-*.wav`. Same player, more sources. Do not invent a second voice stack.

## Develop splice

1. Commit `audio/iris-greet.wav` (≥ 50KB speech take, SoniaNeural or equal). Optional `audio/iris-greet.mp3`.
2. On root `index.html`, after `js/iris-av.js`:
   `<script src="js/iris-wav.js"></script>`
3. `unity:publisher.clerk` pushes main.
4. `unity:wav.watch` curls `/audio/iris-greet.wav` the same minute.
5. Until that curl is 200 + audio/* + ≥ 50KB, ticket stays DEVELOP/PUBLISH.
