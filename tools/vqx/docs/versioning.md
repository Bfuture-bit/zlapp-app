# VQX versioning policy

VQX 0.x is experimental. Published byte meanings are not silently changed
inside a released minor version.

## Version identity

A VQX message's semantic identity is the tuple:

1. protocol version (bootstrap `VERSION` byte, currently `0x03` for 0.3)
2. lexicon SHA-256 (raw `lexicon.json` bytes)
3. grammar SHA-256 (raw `grammar.json` bytes)

Presentation assets (WOFF2, atlas SVG, HTML chrome) are not semantic identity.

## What requires a new version

- changing the meaning of an assigned byte
- changing bootstrap layout, allowed flags, or fail-closed rules
- changing local-macro framing

New documentation, tests, benchmarks, and presentation assets may ship inside
0.3 without a version bump if they do not change wire semantics.

## Historical versions

VQX 0.2 remains an immutable archived release. Current discovery must not tell
agents to auto-install 0.2 (or 0.3). Select 0.2 only for an explicitly
identified 0.2 peer.

## Negotiation

Peers advertise supported versions and dictionary digests, then agree on one
compatible pair. Incompatible versions fail closed. Compact mode is allowed
only after explicit negotiation.
