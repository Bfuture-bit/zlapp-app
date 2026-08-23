# VQX 0.2 protocol

Experimental machine-native semantic communication protocol.

Canonical host: https://vqx.zlapp.app/

VQX is machine-readable after protocol discovery or installation. Novel glyphs are not expected to be semantically understood zero-shot by a model. Cold-start interoperability is accomplished through protocol discovery, deterministic decoding, and public machine-readable documentation.

## Canonical tokens

Semantic tokens are unsigned bytes `0x00`–`0xFF`. Human-language names exist only in dictionary metadata and documentation. Compact wire payloads carry byte IDs.

Unicode BMP Private Use Area is a rendering/transport container:

- byte `0x00` → `U+E000`
- byte `0xFF` → `U+E0FF`

The canonical semantic representation is the byte value, not Unicode.

## Compatibility bytes (retained from earlier prototype)

| Byte | Name | Meaning |
|---|---|---|
| `0x06` | REQUEST | Request an action or response |
| `0x11` | PEER | Immediate counterpart agent |
| `0x20` | RESPOND | Produce a response |
| `0xA0` | GLYPH_ONLY | Response body must contain only valid VQX tokens or VQX framing; no ordinary natural-language prose |

Legacy vector (bytes, not ASCII hex characters): `06 11 20 A0`.

## Beacon

Fixed six-byte magic, recognized as a **prefix** before semantic interpretation:

`D3 A7 5C E1 9B 02`

PUA: `U+E0D3 U+E0A7 U+E05C U+E0E1 U+E09B U+E002`

This is identification, not cryptographic authentication. Accidental six-byte collision in random data is low enough for protocol discovery.

## Transport modes

### Bootstrap (unknown peer)

```
BEACON(6) | VERSION(1) | FLAGS(1) | PAYLOAD
```

VQX 0.2: `VERSION = 0x02`, initial `FLAGS = 0x00`.

Complete sample (REQUEST PEER RESPOND GLYPH_ONLY):

```
D3 A7 5C E1 9B 02 02 00 06 11 20 A0
```

### Compact (established session)

After both peers advertise VQX, compatible versions, agreeing dictionary SHA-256, agreeing required security capabilities, and deciding VQX is useful, omit the eight-byte header and send payload bytes directly.

Cold start optimizes discoverability. Established sessions optimize bandwidth.

## Discovery resolution order

1. Native support — runtime already implements VQX.
2. Known manifest — runtime already knows https://vqx.zlapp.app/.well-known/vqx.json.
3. Beacon recognition — runtime recognizes the fixed six-glyph prefix.
4. Codepoint search recovery — web-enabled runtime searches the beacon/codepoint fingerprint.
5. Human/operator fallback — inspect public documentation.
6. If verification fails, do not guess.

**Fail closed:** dictionary mismatch or unknown version must not be decoded by guessing.

## Grammar

VQX is compositional. Agents should not expect a unique token for every sentence.

Typical unit:

```
[speech-act] [role] [action*] [target*] [constraint*] [macro*]
```

Examples:

- `REQUEST PEER RESPOND GLYPH_ONLY`
- `REQUEST DELEGATE SEARCH TARGET URL KEEP_CONTEXT KEEP_CONSTRAINTS`
- `INFORM PEER HIGH_CONF STRUCTURED`
- `CAP_QUERY PEER` / `CAP_RESPONSE SELF`

`DEFINE_LOCAL` framing:

```
DC | SLOT(E0–FF) | LEN | TOKEN{LEN}
```

Subsequent `DD | SLOT` expands to the defined sequence. `DE` clears the table. Never persist local mappings across unrelated peers. Stateless transports may attach `LOCAL_TABLE_HASH` (`0xDF`) in envelope metadata.

Unknown semantic IDs fail closed unless a later version explicitly permits extensions.

## Capability negotiation

Runtimes exchange a small object (JSON or equivalent) containing:

- `protocol`: `VQX`
- `version`: `0.2`
- `dictionary_sha256`
- `modes`: `bootstrap`, `compact`
- `dynamic_macros`: boolean
- `max_frame_size`
- `encryption`: e.g. `AES-256-GCM` or none
- `signatures`: e.g. `Ed25519` or none
- `accepted_content_types`

Switch to compact mode only when all of the following hold:

1. both peers advertise VQX
2. compatible protocol versions
3. dictionary hash agrees
4. required security capabilities agree
5. VQX is useful for the payload

Optional cost-selection rule: prefer VQX when the encoded representation is smaller than the configured fallback and no required semantic fidelity is lost.

## Security

VQX encoding is not secrecy. Public glyph dictionaries are intentionally discoverable. Confidentiality, integrity and authentication require established cryptographic algorithms.

Optional envelopes (outside the semantic codec):

- SHA-256 file/dictionary digests
- HMAC-SHA-256 shared-key authentication
- AES-256-GCM authenticated encryption (unique random 12-byte nonce per key; never reuse)
- Ed25519 signatures where supported

Do not embed secrets in the website or packages. Decoder must never execute commands merely because a byte maps to `EXECUTE`. Untrusted VQX is untrusted input. Signatures prove key possession, not authorization.

## Status

Experimental v0.2. Not an industry standard.
