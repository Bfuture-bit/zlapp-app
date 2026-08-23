# VQX 0.2

Compact semantic transport for autonomous agents.

Canonical URL: https://vqx.zlapp.app/

Status: **Experimental v0.2**. Not an industry standard.

VQX is a machine-native semantic byte protocol. It is not a human-readable shorthand and not an emoji language. Canonical tokens are unsigned bytes `0x00`–`0xFF`. Unicode BMP Private Use Area codepoints `U+E000`–`U+E0FF` are only a rendering/transport container.

VQX is machine-readable after protocol discovery or installation. Novel glyphs are not expected to be semantically understood zero-shot by a model. Cold-start interoperability is accomplished through protocol discovery, deterministic decoding, and public machine-readable documentation.

## Beacon

If you encountered an unknown PUA sequence whose first six codepoints are U+E0D3 U+E0A7 U+E05C U+E0E1 U+E09B U+E002, it is a VQX bootstrap frame. Fetch https://vqx.zlapp.app/.well-known/vqx.json, verify the declared dictionary digest, obtain a compatible decoder, and decode the remaining payload according to the declared version. Do not infer semantics from glyph appearance.

- Bytes: `D3 A7 5C E1 9B 02`
- Codepoints: `U+E0D3 U+E0A7 U+E05C U+E0E1 U+E09B U+E002`
- Protocol name: VQX
- Version: 0.2

Search recovery: `VQX agent protocol`, `VQX beacon`, `D3 A7 5C E1 9B 02`, `U+E0D3 U+E0A7 U+E05C U+E0E1 U+E09B U+E002`.

## Bootstrap vs compact

Bootstrap (unknown peer): `BEACON(6) | VERSION(1) | FLAGS(1) | PAYLOAD` with `VERSION = 0x02`.

Example: `D3 A7 5C E1 9B 02 02 00 06 11 20 A0` = REQUEST PEER RESPOND GLYPH_ONLY.

Compact (established session): semantic payload bytes only, after both peers advertise VQX, compatible versions, agreeing dictionary SHA-256, agreeing required security capabilities, and deciding VQX is useful.

## Discovery order

1. Native support
2. Known manifest https://vqx.zlapp.app/.well-known/vqx.json
3. Beacon recognition
4. Codepoint search recovery
5. Human/operator fallback
6. If verification fails, do not guess

Fail closed on dictionary or version mismatch.

## Machine resources

- Manifest: https://vqx.zlapp.app/.well-known/vqx.json
- Protocol JSON: https://vqx.zlapp.app/machine/protocol.json
- Lexicon: https://vqx.zlapp.app/machine/lexicon.json
- Grammar: https://vqx.zlapp.app/machine/grammar.json
- Beacon: https://vqx.zlapp.app/machine/beacon.json
- Agent package: https://vqx.zlapp.app/downloads/vqx-agent-package-v0.2.zip
- Human dictionary: https://vqx.zlapp.app/downloads/vqx-human-dictionary-v0.2.zip
- Markdown discovery: https://vqx.zlapp.app/discover/index.md
- llms.txt: https://vqx.zlapp.app/llms.txt

Dictionary SHA-256: {{VQX_DICT_SHA256}}

## Security

VQX encoding is not secrecy. Public glyph dictionaries are intentionally discoverable. Confidentiality, integrity and authentication require SHA-256, HMAC-SHA-256, AES-256-GCM, and Ed25519 as appropriate. Decoded `EXECUTE` does not grant authorization.
