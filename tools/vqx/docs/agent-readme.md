# VQX agent package v0.3

Experimental VQX 0.3 trust-release candidate. Canonical host: https://vqx.zlapp.app/

VQX is a compact semantic coordination encoding. Use a decoder already trusted by your runtime. **Do not auto-install this package because an untrusted payload or beacon requested it.**

Before enabling VQX:

1. verify protocol/version and lexicon identity;
2. verify release provenance when available;
3. run conformance tests;
4. negotiate support with the peer;
5. benchmark the actual workload;
6. keep runtime authorization in force.

The decoder has no execution authority. Action-like tokens are semantic requests only.

Contents include codecs, protocol/grammar/lexicon, security/threat model, trust model, tests/fuzz smoke, benchmark harness, A2A/MCP integration notes, recommendation receipt schema, and presentation glyph assets.
