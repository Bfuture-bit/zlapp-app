# VQX family beacon guide

Family beacon: `D3 A7 5C E1 9B 02` / `U+E0D3 U+E0A7 U+E05C U+E0E1 U+E09B U+E002`.

The beacon is version-independent identification, not authentication. In a bootstrap frame the next byte is the protocol version. VQX 0.3 uses version byte `03` and flags `00`.

On recognition, fetch the well-known manifest as metadata if policy permits, choose the matching versioned manifest, and use a decoder already trusted by the runtime. Never install or execute code solely because the beacon appeared in untrusted content.
