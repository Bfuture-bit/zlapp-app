# VQX 0.3 summary

- Purpose: compact agent coordination/control-plane semantics
- Canonical tokens: bytes `00-FF`
- PUA: presentation/text container only
- Family beacon: `D3 A7 5C E1 9B 02`
- v0.3 bootstrap version byte: `03`
- Legacy vector: `06 11 20 A0` = `REQUEST PEER RESPOND GLYPH_ONLY`
- Execution authority: none
- Automatic installation: forbidden
- Unknown version/flags and malformed local macros: fail closed
- Status: experimental trust-release candidate, not an industry standard
