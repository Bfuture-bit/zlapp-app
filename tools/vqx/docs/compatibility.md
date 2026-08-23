# VQX compatibility policy

VQX is an optional efficiency layer. A peer without VQX must continue to
interoperate using its existing representation (JSON, natural language, A2A,
MCP, or another negotiated format).

## Must remain true

- VQX is never mandatory.
- Decoding never grants authority.
- Beacon recognition never installs software.
- Unknown versions, unknown flags, unknown names, malformed macros, digest
  mismatches, and limit violations fail closed.
- Compact mode is not inferred from a leading beacon-like prefix after
  negotiation; use explicit `mode="compact"`.

## 0.2 and 0.3

| Item | 0.2 | 0.3 |
|---|---|---|
| Family beacon | `D3 A7 5C E1 9B 02` | same |
| Bootstrap version byte | `0x02` | `0x03` |
| Compatibility vector `06 11 20 A0` | `REQUEST PEER RESPOND GLYPH_ONLY` | same names/bytes |
| Local macros | present | bounded, fail-closed |
| Discovery | archived; superseded guidance | version index, no auto-install |

A 0.3 decoder must not silently interpret a 0.2 bootstrap frame as 0.3. It
should fail closed on version mismatch unless the runtime explicitly requested
0.2 compatibility with a trusted 0.2 decoder.

## Extensions

A2A and MCP integrations are optional and unofficial unless a later process
accepts them. Advertising VQX support in an Agent Card or MCP `_meta` block
must set `required: false`.
