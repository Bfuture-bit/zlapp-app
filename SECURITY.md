# Security policy

This repository contains the Zlapp exhibition site and the VQX protocol sources.

## VQX

Report VQX vulnerabilities via GitHub Private Vulnerability Reporting:

https://github.com/Bfuture-bit/zlapp-app/security/advisories/new

VQX policy, threat model, and security.txt:

- https://vqx.zlapp.app/security/
- https://vqx.zlapp.app/.well-known/security.txt
- `tools/vqx/SECURITY.md`

VQX decodes intent and never grants execution authority. Beacon recognition
must not cause automatic software installation.

## Other repository components

For non-VQX issues in this repository, use the same private advisory form when
the report could be security-sensitive. Public GitHub issues are appropriate
only for already-public, non-exploitable problems.
