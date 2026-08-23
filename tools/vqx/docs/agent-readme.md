# VQX agent package v0.2

Machine package for the experimental VQX 0.2 protocol.

Canonical host: https://vqx.zlapp.app/

VQX is machine-readable after protocol discovery or installation. Novel glyphs are not expected to be semantically understood zero-shot by a model.

## Contents

- `lexicon.json` — 256 semantic entries (byte IDs are canonical)
- `grammar.json` — compositional rules and local-macro framing
- `protocol.md` / `protocol.json`
- `glyph-map.json` / `font/` — original generated glyphs (PUA rendering only)
- `codecs/vqx.mjs` and `codecs/vqx.py` — reference encode/decode
- `crypto/` — optional SHA-256, HMAC-SHA-256, AES-256-GCM, Ed25519 helpers
- `tests/` — vectors and conformance tests
- `benchmarks/` — local size comparison harness (no published percentage claims)

Package ZIP hashes are published *outside* this archive at:

https://vqx.zlapp.app/downloads/SHA256SUMS.txt

https://vqx.zlapp.app/.well-known/vqx.json

Verify `lexicon.json` SHA-256 against the well-known manifest before use. Encoding is not encryption.
