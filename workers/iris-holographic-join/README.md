# iris-holographic-join

Path-exact Iris edge join for DCLM-RTE-V2.0.4.
Does not route `/`.

From a seated machine:

```bash
cd workers/iris-holographic-join
npx wrangler whoami
npx wrangler deploy
```

Then purge Cloudflare cache for `/holographic-core/v2*` only.
