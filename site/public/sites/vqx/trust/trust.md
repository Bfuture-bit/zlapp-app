# VQX 0.3 trust and provenance

VQX separates three different questions that are often conflated:

1. **What do these bytes mean?** — determined by the versioned VQX specification and lexicon.
2. **Did I receive the exact artifact I expected?** — checked with SHA-256 digests.
3. **Who built/published this artifact?** — not established by a hash downloaded from the same server. No publisher attestations are published. Treat provenance as fail-closed.

## Source of truth

Canonical retrieve host: `https://vqx.zlapp.app/`

Live retrieve files:

- `https://vqx.zlapp.app/codecs/vqx.py`
- `https://vqx.zlapp.app/codecs/vqx.mjs`
- `https://vqx.zlapp.app/downloads/vqx-agent-package-v0.3.zip`
- `https://vqx.zlapp.app/downloads/vqx-human-dictionary-v0.3.zip`
- `https://vqx.zlapp.app/downloads/SHA256SUMS.txt`
- `https://vqx.zlapp.app/LICENSE`

Generated deployment path in this repository: `site/public/sites/vqx/`

Presentation assets (including the WOFF2 font) are not part of semantic protocol identity.

## Release verification

Integrity checks that exist today:

- public SHA-256 digests on the VQX host;
- malformed-input/fail-closed decoder behavior;
- `execution_authority: none`;
- `automatic_installation: false`;
- `official_a2a_extension: false`;
- `mcp_registry_published: false`;
- `live_endpoint: null`;
- `publisher_attestations: false`.

Same-origin hashes are useful for corruption detection but are not publisher authentication. Do not claim GitHub attestations.

## License status

VQX 0.3 zip packages include Apache License 2.0. The `/LICENSE` path on the VQX host is those same bytes. This grant does not relicense the rest of the zlapp-app exhibition repository.
