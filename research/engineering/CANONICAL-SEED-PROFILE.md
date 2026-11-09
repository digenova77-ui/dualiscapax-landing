# DualisCapax canonical seed profile v1

**Status:** project-specific restricted profile; not RFC 8785 / JCS.

## Accepted data

- Root is one JSON object with exactly the ten required fields in `seed_verifier.py`.
- Object keys are ASCII strings. Keys are recursively sorted in ascending ASCII order.
- String values must be valid Unicode scalar sequences; unpaired UTF-16 surrogates are rejected.
- Numeric values are integers in the inclusive range `[-(2^53-1), +(2^53-1)]`. Fractions, exponent forms, negative-zero spellings, NaN, and Infinity are not accepted.
- Arrays preserve element order. Objects are recursively sorted.
- User-supplied rules are data only; this verifier never executes them.

## Canonical source representation

A canonical source is compact JSON with no leading/trailing whitespace, no BOM, no insignificant whitespace, sorted object keys, and UTF-8 encoding. The parsed value is validated, re-serialized using the profile, and the original source must match the re-serialized form byte-for-byte.

Python uses UTF-8 encoding of `json.dumps(..., ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False)` after validation. The Node implementation sorts the same restricted ASCII keys recursively and uses `JSON.stringify`. A shared known-answer fixture fixes the expected canonical source and SHA-256.

The Node parser does not expose duplicate-key events. Duplicate names are rejected because their raw source cannot equal the canonical re-serialization of the parsed object. Python additionally rejects duplicates during parsing.

## Commitment semantics

SHA-256 commits to the canonical bytes. It does **not** prove truth of input measurements, mathematical correctness, model validity, identity, authorization, event ordering, or consensus.

## Why this is not JCS

RFC 8785 specifies a broader interoperable JSON canonicalization scheme, including IEEE-754 number serialization and UTF-16 property-name ordering. This profile intentionally forbids all non-integer numeric values and restricts object keys to ASCII. It must not be labelled RFC 8785 compliant.

## Test contract

Both runtimes consume `fixtures/seed-v1-known-answer.json`. CI checks the same canonical fixture and digest plus malformed-source, duplicate-key, alternate-encoding, safe-integer, Unicode, schema, and mutation cases. Cross-language agreement is limited to this declared profile and the vectors actually tested. The generated suite contains 1,000 fixed-seed nested manifests, each with a shared canonical source and SHA-256; both runtimes reject whitespace and duplicate-key near-neighbours for every vector. The fixture is reproducibly rebuilt by generate_seed_vectors.py and checked in CI.
