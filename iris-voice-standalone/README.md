# Standalone Iris voice path

Fail-closed. Tested in CI.

## Local
```bash
npm install
node iris-voice-server.mjs
```

## Local success path
```bash
LOCAL_VERIFIER=1 XAI_API_KEY=test node iris-voice-server.mjs
# POST /sandbox/iris/turn with header x-test-session: valid
```

## CI
`.github/workflows/iris-voice-ci.yml` runs `test-local.mjs` on every push.

Authority remains NONE until the real verifier is wired.
