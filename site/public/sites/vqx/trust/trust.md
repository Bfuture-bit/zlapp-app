# VQX 0.3 trust and provenance

VQX separates three different questions that are often conflated:

1. **What do these bytes mean?** — determined by the versioned VQX specification and lexicon.
2. **Did I receive the exact artifact I expected?** — checked with SHA-256 digests.
3. **Who built/published this artifact?** — not established by a hash downloaded from the same server. No publisher attestations are published for this release.

## Source of retrieve

Live retrieve URLs (codecs and hashed zips):

- https://vqx.zlapp.app/codecs/vqx.py
- https://vqx.zlapp.app/codecs/vqx.mjs
- https://vqx.zlapp.app/downloads/vqx-agent-package-v0.3.zip
- https://vqx.zlapp.app/downloads/vqx-human-dictionary-v0.3.zip
- https://vqx.zlapp.app/downloads/SHA256SUMS.txt

License bytes at https://vqx.zlapp.app/LICENSE are Apache-2.0 and zip-identical to the LICENSE file inside the 0.3 packages.

Do not treat GitHub `tools/vqx` as a live retrieve URL unless that path 200s on the default branch.

## Release verification

- same-origin SHA-256 values detect corruption; they are not publisher authentication
- no release attestations are published
- execution authority is none; automatic installation is false
- official A2A extension: false; MCP registry published: false; live endpoint: null

## License status

VQX generated artifacts are licensed under Apache License 2.0. See `/LICENSE` and `/NOTICE`. This grant does not relicense the rest of the zlapp-app exhibition repository.
