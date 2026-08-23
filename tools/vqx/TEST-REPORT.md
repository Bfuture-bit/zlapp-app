# VQX 0.3 trust-release candidate — local verification report

Verification date: 2026-08-23

## Results

- VQX conformance suite: **59 passed, 0 failed**
- Python codec tests: **pass**
- JavaScript codec tests: **pass**
- Deterministic malformed-input fuzz smoke test: **pass**
- All published JSON parsing: **pass**
- Public internal-link resolution: **pass**
- Unsafe auto-install discovery wording in current public surface: **none detected**
- Repeat-build package reproducibility: **pass**
- Workflow YAML parse check: **pass**
- Local static HTTP checks for homepage and root manifest: **pass**

## Reproducible VQX 0.3 package hashes

- `vqx-agent-package-v0.3.zip`: `e535515a736969ffc65341e9f0b94223677517d4b9e9d16f07b8030db498841b`
- `vqx-human-dictionary-v0.3.zip`: `c2063db636e397666dd73de6c07b03a77630e6a94e1431f929e59b399969eee5`
- `lexicon.json`: `09519315f013f7f70bd11ae5604dea3c4d2c19bc071da26f519bf7f51014b537`

These hashes reproduced identically across consecutive builds from the same checked-in source/assets in this environment.

## Benchmark scope

`python tools/vqx/benchmarks/benchmark.py` passes semantic round-trip on the included sample corpus and reports representation byte sizes. The benchmark intentionally does **not** infer universal LLM-token savings, latency improvements, model-quality gains, or production task success.

## Browser note

Static HTTP delivery of the homepage and manifest passed. The container's headless Chromium process did not terminate reliably because its DBus/zygote environment is incomplete, so visual-browser completion is not counted as a release criterion in this report. GitHub CI should run the deterministic protocol/site checks from a clean clone; a real browser/platform smoke test can be added separately.

## External checks still required

See `VQX-0.3-REVIEW.md`. In particular, release provenance does not exist until the GitHub tag workflow runs and creates attestations, and the maintainer must explicitly choose a license and enable/verify the advertised security-reporting route.
