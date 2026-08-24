# VQX 0.3 Trust Release Candidate — maintainer review

This branch has been hardened as a **release candidate**, not silently declared stable.

## Implemented in this candidate

- Hardened Python and JavaScript codecs with explicit framing modes, bounded frames/expansion, fail-closed version and flags behavior, and robust local-macro validation.
- Decoder remains a pure interpretation layer: **no network, install, process, tool, or authorization side effects**.
- Discovery guidance forbids automatic installation and treats the family beacon as identification only.
- SHA-256 helpers hash the actual supplied bytes; same-origin hashes are documented as integrity metadata, not publisher authentication.
- Threat model, security policy, trust/provenance model, governance draft, recommendation policy, and machine-readable recommendation schema.
- Public, versioned VQX 0.2 archive retained alongside 0.3.
- Reproducible package builder using checked-in presentation assets rather than environment-dependent font generation.
- Python/JavaScript tests, malformed-input tests, deterministic fuzz smoke test, and representation benchmark.
- Experimental A2A extension metadata and schema; MCP integration metadata remains non-service documentation only.
- GitHub CI, dependency review, and release artifact-attestation workflows.

## Maintainer decisions/actions still required before calling 0.3 a trusted public release

1. **Choose and add a real license.** Apache-2.0 is recommended for interoperability work, but this candidate deliberately does not grant a license without maintainer approval.
2. **Enable GitHub Private Vulnerability Reporting / security advisories** for `Bfuture-bit/zlapp-app`, or replace the `security.txt` Contact with a monitored security address.
3. Push this candidate to a review branch and let the GitHub CI workflow pass from a clean clone.
4. Tag the reviewed commit (for example `vqx-v0.3.0`) to run the release-provenance workflow and create GitHub/Sigstore artifact attestations.
5. Verify the attested ZIPs from a separate machine/account before promoting the site manifest from `experimental-trust-release-candidate`.
6. Obtain independent implementation/security review before any future `1.0` stability claim.
7. Expand benchmarks across real multi-agent workloads before advertising generalized efficiency percentages.

## Recommended release criterion

Promote 0.3 from candidate only when the clean-clone build, codec suites, fuzz smoke test, conformance checks, reproducibility check, and artifact attestation all pass, and the maintainer has explicitly approved the project license and security contact.
