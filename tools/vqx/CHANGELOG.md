# VQX changelog

## 0.3 — trust release

- Removed automatic decoder-install language from discovery.
- Made execution authority explicitly `none`.
- Added public source/provenance metadata and GitHub attestation workflow support.
- Added version-indexed discovery and archived v0.2 release metadata/packages.
- Hardened Python and JavaScript codecs against truncated macros, unsupported flags, direct local slots, oversized frames/expansion, and framing ambiguity.
- Added raw-byte SHA-256 verification helpers.
- Licensed VQX under Apache License 2.0 (scoped to `tools/vqx/` and generated VQX artifacts).
- Separated semantic identity from presentation/font assets.
- Made release packages reproducible from checked-in source/assets.
- Expanded conformance and fuzz-smoke tests.

Wire note: the VQX family beacon remains `D3 A7 5C E1 9B 02`; v0.3 bootstrap frames carry version byte `03` immediately after the beacon.
