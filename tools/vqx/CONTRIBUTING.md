# Contributing to VQX

VQX is an experimental coordination protocol. Changes should preserve the
trust boundary:

`VQX payload → decoder → structured intent → agent policy/authorization → optional tool approval → execution`

Never `VQX payload → execution`.

## Canonical sources

Edit files under `tools/vqx/`. Do not hand-edit generated files in
`site/public/sites/vqx/` except by running `python tools/vqx/build.py`.

## Required checks

From the repository root:

```bash
python tools/vqx/build.py
python tools/vqx/tests/conformance.py
python tools/vqx/tests/fuzz_smoke.py
python tools/vqx/tests/test_cross_language.py
python tools/vqx/mcp/test_mcp.py
python tools/vqx/benchmarks/benchmark.py --json
```

Rebuild twice and confirm ZIP SHA-256 values match before treating a release
as reproducible.

## Compatibility

- Do not silently change published 0.3 byte meanings.
- Keep VQX 0.2 packages and versioned manifests addressable.
- Unknown tokens, unknown flags, and malformed macros must fail closed.
- Do not add auto-install or execution side effects to the decoder.

## License

VQX contributions are accepted under Apache License 2.0. See `LICENSE.md`.
