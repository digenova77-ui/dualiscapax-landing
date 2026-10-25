# Unity .com → .ai security gate

This branch supplies the Related Origin Requests file and fail-closed browser ceremony helpers. It does not deploy or activate the experience.

## Required server implementation

1. Server-issued one-time challenges (32+ unpredictable bytes), bounded lifetime, single-use consumption.
2. Registration stores credential ID, COSE public key, RP ID and account binding after validating attestation/clientData origin and challenge.
3. Authentication verifies clientData challenge and allowed origin, authenticatorData RP ID hash, UV and UP flags, signature over authenticatorData || SHA256(clientDataJSON), credential/account binding, and counter/backup policy.
4. The .com completion must be verified before navigation. A new .ai challenge must be independently verified after navigation; no browser assertion is sent through URL, cookies or postMessage.
5. Jacket authorization must consume a server-side, one-time verified assertion grant bound to the specific principal, request ID, digest and action; Trinity remains the sole authorization gate.
6. The legacy DCCP/2 line is **not proof**. A POST containing only that line and flags cannot establish passkey possession. Never return accepted:true solely on that payload.
7. Publish /.well-known/webauthn on the actual .com host as application/json, verify 200 and exact origins. Ensure the build preserves extensionless dotfiles.
8. Keep the 3D world closed on every failure and never log credentials, private keys or biometric data.

The original FRONT-INTERFACE.md contract needs an explicit server-proof mechanism before it can safely authorize compute.
