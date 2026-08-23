# VQX 0.3 Trust Release Report

Status: **shipped to production**, with two remaining GitHub-side actions documented below.

This report records only checks that were actually run.

## Identity

| Item | Value |
|---|---|
| Protocol | VQX 0.3 |
| Status | experimental |
| Canonical host | https://vqx.zlapp.app/ |
| Git branch | `cursor/vqx-0.3-trust-3d1b` |
| Release commit | `eedc7fbb863381809d8f3dbc22bf83dcabf8572a` |
| Git tag | `vqx-v0.3.0` (pushed) |
| Pull request | https://github.com/Bfuture-bit/zlapp-app/pull/4 (base retargeted to `cursor/vqx-0.2-3d1b`; **do not merge into `master`**, which is behind production) |
| Vercel production deploy | `dpl_4aWmEFLcXCMtW8qLva8n2RFcZepp` (aliased to https://zlapp.app) |

## License

Apache License 2.0 applies to **VQX only**:

- `tools/vqx/LICENSE`
- `tools/vqx/NOTICE`
- `tools/vqx/LICENSE.md` (scope: does not relicense exhibition works, Agent Glyph, GLYPHS 2, Brent, or other non-VQX paths)

The rest of `zlapp-app` is unchanged.

## Trust invariants (verified in code, manifests, and live HTML/JSON)

- Decoder is parse-only: no network, install, process, or authorization side effects.
- `execution_authority: none` on the root manifest, trust metadata, and capabilities.
- `automatic_installation: false` everywhere checked.
- Beacon is identification, not authentication, and not an install trigger.
- Unknown versions, unknown flags, unknown names, malformed macros, digest mismatches, and limit violations fail closed.
- `EXECUTE` / `INSTALL` remain `auth_required` metadata; decoding them grants no authority.
- Same-origin SHA-256 is documented as integrity metadata, not publisher authentication.

## Packages (SHA-256)

Verified locally, in two independent rebuilds, and on https://vqx.zlapp.app:

| Artifact | SHA-256 |
|---|---|
| `vqx-agent-package-v0.3.zip` | `ace109e88d9ac8f90b1f4ade323519d74a5d54b652968fb305fe0f44cff4a707` |
| `vqx-human-dictionary-v0.3.zip` | `94ae0c5022bc2494aea8acb172b9b93f78cda18b6dcccf9e69c7b98ba18c7ed2` |
| `vqx-agent-package-v0.2.zip` (immutable) | `9b3d72914b63cd7dcae52a6f6a66c7b9e500aef16083f60e824f1da63d7e2a7f` |
| `vqx-human-dictionary-v0.2.zip` (immutable) | `87b8dbe24a31cb4c41f6a4223578881f835a8b0a1bada3ac67a3d46cd862d213` |
| `lexicon.json` | `09519315f013f7f70bd11ae5604dea3c4d2c19bc071da26f519bf7f51014b537` |

Two consecutive clean builds into `/tmp/vqx-a` and `/tmp/vqx-b` produced **identical** 0.3 ZIP hashes, matching the committed site tree.

## Tests

| Suite | Result |
|---|---|
| `tools/vqx/tests/conformance.py` | **72 passed, 0 failed** (candidate baseline was 59/59; coverage was not reduced) |
| Python codec tests | pass |
| JavaScript codec tests | pass |
| Fuzz smoke (5,000 deterministic malformed frames) | pass (via conformance; standalone path also fixed) |
| Cross-language Python encode / JS decode and reverse | pass |
| MCP scaffold tests | pass |
| Representation benchmark | pass; numbers published at `/benchmarks/results.json` |

No tests were deleted to obtain a green result.

## Live production checks (2026-08-23, after Vercel alias)

All of the following returned HTTP 200 on https://vqx.zlapp.app:

- `/`
- `/.well-known/vqx.json`
- `/.well-known/security.txt`
- `/spec/0.3/`, `/spec/latest/`
- `/dictionary/0.3/`
- `/schema/`
- `/trust/`, `/provenance/`
- `/benchmarks/`
- `/conformance/`
- `/releases/`
- `/extensions/vqx/0.3/`
- `/versions/0.2/manifest.json`
- `/downloads/vqx-agent-package-v0.2.zip`
- `/downloads/vqx-agent-package-v0.3.zip`
- `/machine/trust.json`
- `/mcp/`

Live `/.well-known/vqx.json` reports `version: 0.3`, `status: experimental`, `execution_authority: none`, `automatic_installation: false`, Apache-2.0, and the 0.3 agent hash above.

Homepage copy includes the control-plane line, experimental status, no automatic installation, and no execution authority.

https://zlapp.app exhibition card still points at `https://vqx.zlapp.app/` and uses the 0.3 positioning line.

A full headed-browser visual pass was **not** completed in this environment. Protocol and discovery success is based on HTTP, JSON parse, and hash checks, not on a GUI crawl.

## A2A

Unofficial, optional extension descriptor is published at `/extensions/vqx/0.3/`. `required` is false. This is **not** an official A2A extension.

## MCP

Local stdio scaffold at `tools/vqx/mcp/` exposing `vqx.describe`, `vqx.negotiate`, `vqx.encode`, `vqx.decode`, `vqx.validate`, `vqx.verify`, and `vqx.benchmark`. `mcp_registry_published: false`. **Not** listed in the MCP Registry.

## GitHub security

Private vulnerability reporting: **enabled** (`GET /repos/Bfuture-bit/zlapp-app/private-vulnerability-reporting` returned `{"enabled":true}`).

`security.txt` Contact is `https://github.com/Bfuture-bit/zlapp-app/security/advisories/new`.

Dependabot security updates remain disabled. Secret scanning is enabled. Push protection is enabled.

## GitHub Actions / attestations — incomplete

The GitHub token available to this agent has scopes `repo` and `write:packages` only. GitHub rejected pushing files under `.github/workflows/` without the `workflow` scope.

Workflow YAML is committed at:

- `tools/vqx/github-workflows/vqx-ci.yml`
- `tools/vqx/github-workflows/vqx-dependency-review.yml`
- `tools/vqx/github-workflows/vqx-release.yml`

**Manual step:** copy those three files to `.github/workflows/` with a token that has `workflow` scope, then re-run the `vqx-v0.3.0` tag workflow so Sigstore/GitHub artifact attestations can be created. Until then, publisher authentication is **not** established by attestation; same-origin checksums remain integrity checks only.

The tag `vqx-v0.3.0` is on GitHub. It did not run the release workflow because those workflows are not installed under `.github/workflows/`.

## Benchmarks (measured, not invented)

Public corpus in `tools/vqx/benchmarks/benchmark.py`, wire bytes only:

| Sample | NL UTF-8 | Compact JSON | VQX payload | VQX bootstrap |
|---|---:|---:|---:|---:|
| legacy glyph-only | 162 | 77 | 4 | 12 |
| handoff preserve | 158 | 162 | 8 | 16 |
| verify fail-closed | 99 | 66 | 4 | 12 |

These are representation sizes for this corpus. They do not show model-token counts, latency, task success, or universal efficiency. Optional CBOR/MessagePack rows appear only if those libraries are installed; they were not required for this run.

## What this release does not claim

- Not an industry standard
- Not an official A2A or MCP extension
- Not registered in the MCP Registry
- No third-party security audit
- No adoption, endorsement, or performance testimonials
- No Sigstore attestation yet (blocked on `workflow` scope)

## Remaining manual actions

1. Copy `tools/vqx/github-workflows/*.yml` → `.github/workflows/` using a GitHub token with the `workflow` scope.
2. Re-dispatch or re-push `vqx-v0.3.0` so the release workflow can attest the two 0.3 ZIPs.
3. Do **not** merge PR #4 into `master` until `master` contains the production lineage (GLYPHS 2, Brent, VQX). The PR base is `cursor/vqx-0.2-3d1b`.
4. Optional: a headed browser crawl of the codec demo on a complete desktop environment.

## 0.4 priorities (recommended, not promised)

- Independent second implementation
- External threat review before any 1.0 language
- Workload-level benchmarks with latency and task-success, published even when VQX loses
- Official A2A/MCP submission only after those processes exist and accept optional extensions
- Install GitHub Actions and verify attestations on a second machine
