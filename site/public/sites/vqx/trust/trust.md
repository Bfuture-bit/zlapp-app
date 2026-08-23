# VQX 0.3 trust and provenance

VQX separates three different questions that are often conflated:

1. **What do these bytes mean?** — determined by the versioned VQX specification and lexicon.
2. **Did I receive the exact artifact I expected?** — checked with SHA-256 digests.
3. **Who built/published this artifact?** — established by repository provenance / release attestation, not by a hash downloaded from the same server.

## Source of truth

Canonical source repository: `https://github.com/Bfuture-bit/zlapp-app`

Canonical source path: `tools/vqx/`

Generated deployment path: `site/public/sites/vqx/`

The release build is designed to be reproducible from checked-in source and checked-in presentation assets. The WOFF2 font is treated as a presentation asset rather than part of semantic protocol identity.

## Release verification

A trusted release should satisfy all of these checks:

- source revision is public;
- CI runs Python and JavaScript conformance tests;
- malformed-input/fail-closed tests pass;
- generated public files are reproducible from source;
- package SHA-256 values match the manifest;
- GitHub artifact attestations bind release archives to the repository workflow/commit;
- no automatic-install behavior exists in protocol discovery.

Same-origin hashes are useful for corruption detection but are not publisher authentication.

## License status

VQX sources under `tools/vqx/` and generated VQX artifacts are licensed under
Apache License 2.0. See `LICENSE`, `NOTICE`, and `LICENSE.md`. This grant does
not relicense the rest of the zlapp-app exhibition repository.
