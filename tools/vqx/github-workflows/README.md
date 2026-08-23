# VQX GitHub Actions

Canonical workflow files live in `.github/workflows/`:

- `vqx-ci.yml` — conformance, reproducibility, and generated-site check
- `vqx-dependency-review.yml` — dependency review on VQX PRs
- `vqx-release.yml` — package attestation and GitHub Release on `vqx-v*` tags

Copies in this directory are kept in sync for documentation and for
environments that cannot write `.github/workflows/`.

The release workflow also accepts `workflow_dispatch` from this branch so
attestations can be produced without moving the `vqx-v0.3.0` tag.
