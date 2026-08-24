# VQX 0.3 source

Canonical source for the VQX experimental trust-release candidate.

Build from repository root:

```bash
python tools/vqx/build.py
python tools/vqx/tests/conformance.py
python tools/vqx/tests/fuzz_smoke.py
python tools/vqx/benchmarks/benchmark.py
```

Generated deployment files are written to `site/public/sites/vqx/`.

## Trust model

- Decoding is pure and has execution authority `none`.
- Beacon discovery never authorizes automatic installation.
- Version/dictionary hashes establish semantic identity/integrity, not publisher identity.
- Release provenance is intended to be verified through GitHub artifact attestations.
- Presentation font/atlas bytes are checked-in canonical assets so release archives reproduce across font tooling versions.
- Historical v0.2 metadata/packages are preserved under `legacy/0.2/` and emitted to versioned/archive URLs.

See `docs/security.md`, `docs/threat-model.md`, `docs/trust.md`, `LICENSE`, and `LICENSE.md`.
