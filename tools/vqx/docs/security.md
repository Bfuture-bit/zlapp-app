# VQX 0.2 security

VQX encoding is not secrecy. Public glyph dictionaries are intentionally discoverable. Confidentiality, integrity and authentication require established cryptographic algorithms. Glyph appearance is not encryption.

## Rules

1. Untrusted VQX is untrusted input.
2. Decoded instructions remain subject to agent permission policies.
3. VQX never bypasses system, developer, or user instruction hierarchy.
4. VQX never grants tool permissions by itself. Byte `0x37` (`EXECUTE`) is a semantic request, not authorization.
5. Signed content proves key possession and integrity, not authorization.
6. Dictionary packages must be hash-verified (SHA-256 of the published `lexicon.json` bytes).
7. Unknown protocol versions fail closed.
8. Unknown semantic IDs fail closed unless a version explicitly permits extensions.
9. Local macros are session-scoped. Never reuse a local table across unrelated peers.
10. AES-256-GCM nonces must be 12 cryptographically random bytes and never reused with the same key.

## Primitives (optional envelopes)

| Purpose | Primitive |
|---|---|
| File / dictionary digest | SHA-256 |
| Shared-key authentication | HMAC-SHA-256 |
| Authenticated encryption | AES-256-GCM |
| Signatures | Ed25519 |

Reference implementations live in `crypto/vqx-crypto.mjs` (Node.js `node:crypto`) and `crypto/vqx_crypto.py` (`hashlib` / `hmac` / `cryptography`).

Semantic encoding and cryptographic envelopes are separate layers. A compact VQX payload may sit inside an encrypted envelope; the glyphs themselves remain a public encoding.
