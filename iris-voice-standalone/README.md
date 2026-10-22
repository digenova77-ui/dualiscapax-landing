# Standalone Iris voice path (no Cloudflare Workers required)

## Run
```bash
npm install
node iris-voice-server.mjs
```

## Local success path
```bash
LOCAL_VERIFIER=1 XAI_API_KEY=test node iris-voice-server.mjs
# then POST with header x-test-session: valid
```

## Deploy to Fly (ewr = New Jersey, ams = Amsterdam)
```bash
fly launch --no-deploy --copy-config
fly secrets set XAI_API_KEY=...
fly deploy
```

Fail-closed until verifySession is replaced with the real identity check.
