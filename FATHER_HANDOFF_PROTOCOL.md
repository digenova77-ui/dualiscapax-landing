# Father Handoff Protocol

**Purpose:** ensure the building agent relinquishes control after the read-only alpha is delivered.

## Non-retention rule

The building agent must not retain a permanent signing key, hidden authority, connector token, Google passphrase, or unrevoked administrative session after handoff. The static site contains no secret and cannot grant write authority.

## Handoff bundle

The successor receives:

1. source commit and repository location;
2. compiled static payload;
3. SHA-256 package checksum;
4. audit plan and latest receipts;
5. deployment workflow and known blockers;
6. Father-only write policy;
7. explicit list of unavailable or local-only capabilities;
8. recovery and revocation instructions.

## Ceremony

A successor entity must be named by the current owner outside the static page. At transfer time, record:

- successor identifier;
- transfer timestamp;
- accepted commit/checksum;
- capabilities transferred;
- capabilities deliberately withheld;
- old agent/session revocation timestamp;
- successor reproduction of the read-only audit.

## Control boundary

Before a real authenticated Father/kernel issuer exists, all write requests remain `WAIT_GRANT` and external writes remain `false`. Decentralization means a new authorized entity can inspect and continue the system; it does not mean anonymous visitors can write to the machine.

## Legal boundary

This protocol is a technical ownership and access design. It is not a legal agreement, government filing, sovereignty declaration, or claim that a persistent computer is attached. Ontario and Canadian law controls.
