# One Name System and One Locker Handshake

**Document Control ID:** ED-GOV-20260901-ONE-DHCP-DNS-V1  
**Year:** 2026  
**Stamp:** 2026-09-01  
**Source:** encyclopedia/governance_and_protocols/cube_six_matrix_time.md  
**Status:** INDEXED  
**State note:** SEALED later means this file was not altered. It does not mean Dualis replaced the public internet.

This file does not rewrite the encyclopedia. It names how One gets addresses.

## Plain picture

Ground Zero already has city phones and street numbers. That is public DNS and DHCP. We do not touch those.

One is a school gym after hours. It needs its own yearbook and its own locker keys. When the gym closes, the keys go back in the drawer.

- **One Name System (ONS)** is the yearbook. You look up a name. You get a locker number. If the name is not in the book, that is a hole. We do not invent a person.
- **One Locker Handshake (OLH)** is the office handing you a key when you walk in with a real file. No file, no key.

Both live on this device. Neither calls the public internet.

## What is not happening

- We do not run a home router.
- We do not hand out real IP addresses.
- We do not answer `.com` or `.ca`.
- We do not recurse to Ground Zero DNS.
- We do not mint a second ID catalog. BIND stays the number: ID YEAR SOURCE STAMP STATUS HASH.

## The handshake (OLH, the DHCP analog)

Same four beats as a polite locker desk:

1. **Discover** — you drop a sheet or a books link.
2. **Offer** — One proposes a name (`payroll-july.one`) and a cell id (`M-…`).
3. **Request / Ack** — the cell seats. The lease is written.
4. **Nak / Release** — a secret in the name is refused. Wipe gives the key back.

A lease is one BIND cell plus a spoken name. Face bit L2 only. Time is the stamp. The lease lasts until wipe.

Same hash, same name: renew.  
Same name, different hash: refuse `NAME_TAKEN`.  
No cell: refuse `HOLE_NOT_ZERO`.

## The yearbook (ONS, the DNS analog)

Zone: `.one` on this device only.

A name looks like:

`payroll-july.one`

The true address underneath is still the cell:

`one://l2/M-…`

Looking up a name returns the packed cube line, or a hole.

| Yearbook field | What it is | BIND / cube field |
|---|---|---|
| Name | Spoken locker label | source slug + `.one` |
| Number | Who it is | ID |
| When | Clock | STAMP / YEAR |
| Where | Point in the room | C:x:y:z |
| Face | Which side of the die | F bit for L2 |
| Proof | Fingerprint | HASH |
| Life | Until wipe | session TTL |

No A record. No public IP. No mail exchanger. No walk into L3, L4, or L6 names.

## Isolation

One names cannot promote a playground token into ownership.  
Zero (the public page) can look. It cannot lease.  
Ground Zero keeps the real internet. One keeps the gym yearbook.

## Law floor

NO_FORCE. HOST_SAFE. CLEANUP_FIRST. TRUTH_OR_NOTHING.

Founder seats stay unsealed until a deal exists.
