# VQX 0.3 threat model

VQX is a compact semantic encoding layer. It is **not** an authorization system, sandbox, identity provider, package manager, encryption scheme, or substitute for transport security.

## Security invariants

1. A VQX payload is untrusted input until the surrounding runtime establishes trust through its own policy.
2. Decoding never executes tools, commands, installers, network requests, or code.
3. `EXECUTE`, `INSTALL`, `DIRECT`, `COMMIT`, and similar tokens express intent only. They do not grant authority.
4. The six-byte beacon identifies the protocol family; it is not authentication.
5. Automatic installation triggered by a beacon or payload is forbidden.
6. Unknown versions, unsupported flags, malformed macro frames, undefined local slots, direct local-slot bytes, digest mismatches, and configured size-limit violations fail closed.
7. Compact framing is used only after explicit peer negotiation. A receiver must not use a leading-byte heuristic as an authorization or session-state signal.
8. Local macro state is scoped to the authenticated/identified peer session and must never leak across unrelated peers.

## Threats and mitigations

| Threat | Risk | VQX 0.3 mitigation |
|---|---|---|
| Prompt/instruction injection | Encoded content attempts to override higher-priority policy | Decoder returns structured semantics only; runtime instruction hierarchy remains authoritative |
| Command smuggling | `EXECUTE`/`INSTALL` interpreted as permission | `auth_required` metadata is surfaced; execution authority is explicitly `none` |
| Beacon-triggered supply-chain attack | Untrusted content causes decoder installation | Manifest states `automatic_installation: false`; discovery may fetch metadata but never install code automatically |
| Same-origin hash substitution | Compromised host serves package and matching hash | Same-origin SHA-256 is integrity metadata only. No publisher attestations are published; provenance remains fail-closed |
| Downgrade/version confusion | Peer silently chooses weaker/older behavior | Bootstrap version is explicit; incompatible versions fail closed; root manifest publishes version-specific manifests |
| Unsupported flags | Future options are silently misread | v0.3 permits only known flag bits; unknown bits fail closed |
| Truncated macro frame | Parser crashes or misdecodes | Explicit length/bounds checks return VQX errors |
| Macro expansion DoS | Small input expands excessively | Configurable expanded-size limit, default 65,535 bytes |
| Local table confusion | Slot meaning leaks between peers | Session-scoped tables, explicit clear, deterministic table hash helper |
| Direct local-slot ambiguity | E0-FF decoded without negotiated mapping | Direct local-slot bytes fail closed; slots are valid only via `REF_LOCAL` |
| Compact/beacon collision | Compact payload begins with beacon-like bytes | Negotiated sessions should parse with explicit `mode="compact"`; `auto` is discovery-only |
| Glyph spoofing | Visual shape is mistaken for semantics | Byte ID + verified lexicon are canonical; glyphs are presentation only |
| Replay | Valid old request is re-used | VQX itself does not solve replay; transport/session layer should use nonces/request IDs where needed |
| Confidentiality failure | Glyphs mistaken for encryption | Documentation and manifests explicitly state encoding is public |
| Malicious extension/dictionary | Alternate semantics are introduced | Version + dictionary digest must match negotiated values; unknown versions fail closed |

## Trust boundaries

```text
untrusted bytes
    ↓
VQX parser/decoder (pure, bounded)
    ↓
structured semantic intent
    ↓
runtime policy + identity + authorization
    ↓
approved tool/action layer
```

VQX ends at structured semantic intent.

## Out of scope

VQX does not define user identity, agent identity, transport authentication, key distribution, credential storage, tool permissions, model policy, or sandboxing. Implementations should use the security features of their host protocol/runtime for those functions.
