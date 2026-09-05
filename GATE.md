# Gates on this origin

Allowed:
- DCLM L0: NO_FORCE, HOST_SAFE, CLEANUP_FIRST, TRUTH_OR_NOTHING
- WebAuthn passkey on the visitor device
- Passphrase SHA-256 on the visitor device
- Stripe CAD amount + metadata.sku on fulfill
- BYOK xAI key on Iris (house key off unless IRIS_ALLOW_HOUSE_KEY=1)

Not a gate:
- DNA
- Helix
- helix.html / helix-tongue / plane-engine / logo-dna-x
- L5 private cell as a login

Old landers that drew a helix or required one are not loaded by Gateway, Onboard, Pay, or Runtime.
