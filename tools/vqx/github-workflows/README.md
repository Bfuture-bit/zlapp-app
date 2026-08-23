# VQX GitHub Actions

These workflow files are the VQX 0.3 CI and release definitions.

They are stored here because the token used to publish this branch did not have
the GitHub `workflow` scope required to create files under `.github/workflows/`.

To activate them:

1. Use a token or GitHub App with the `workflow` scope.
2. Copy `vqx-ci.yml`, `vqx-dependency-review.yml`, and `vqx-release.yml` into
   `.github/workflows/` at the repository root.
3. Push to GitHub.
4. Re-push or dispatch the `vqx-v0.3.0` tag so the release workflow can attest
   the packages.

Until that copy happens, GitHub Actions will not run these checks, and Sigstore
attestations will not be produced.
