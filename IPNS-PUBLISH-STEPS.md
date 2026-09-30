# IPNS Publish Steps — DualisCapax

Date: 2026-09-30
Status: LOOK (paper). Execute only after Rung 1 (pinned CID) is verified.

## Prerequisites

- Complete tree zipped: index.html + iris.html + 404.html (no catchall in _redirects).
- CID verified by a second eye (curl the gateway, compare bytes to the zip).
- Father holds the IPNS key (Ed25519). The key is generated once, offline if possible, and never pasted into chat or a repo.

## Steps

1. **Generate the key** (once, locally):
   ```
   ipfs key gen --type ed25519 dualiscapax
   ```
   The peer id (k51…) is the name. Record it; do not commit the private key.

2. **Publish the record**:
   ```
   ipfs name publish --key=dualiscapax /ipfs/<CID>
   ```
   This signs a record: name → CID, sequence 1, validity window (default 24h).
   Republish before expiry or the name goes stale. Bump sequence on every new CID.

3. **Verify resolution**:
   ```
   ipfs resolve /ipns/<k51…>
   ```
   Must return `/ipfs/<CID>`.

4. **Point DNSLink** (Father writes the TXT, no desk):
   ```
   TXT  _dnslink.dualiscapax.ai   dnslink=/ipns/<k51…>
   ```
   Short TTL (60–300s) while testing; longer once frozen.

5. **Verify the public path**:
   ```
   curl -sI https://dualiscapax.ai.ipns.dweb.link/
   ```
   or any IPFS gateway with /ipns/ support.

## Sequence and validity rules

- Higher sequence wins. A new publish must bump seq and re-sign.
- After the validity window, republish or the name is dead.
- Old records cached at gateways are residue until TTL expires.

## What stays outside IPFS

- The IPNS signing key (Father only).
- The DNS zone (Father only).
- The Cloudflare account (Father only).
- The Pinata/Filebase accounts (Father only).

Everything else — the bytes, the scripts, the receipts — lives in IPFS or git.
