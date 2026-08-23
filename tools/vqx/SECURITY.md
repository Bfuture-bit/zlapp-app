# Security policy (VQX)

VQX decodes intent. VQX never grants authority.

Report VQX security issues through GitHub Private Vulnerability Reporting:

https://github.com/Bfuture-bit/zlapp-app/security/advisories/new

Do not file public issues for unreleased vulnerabilities.

## What VQX is responsible for

- fail-closed parsing of untrusted frames
- bounded frames and bounded local-macro expansion
- refusing unknown versions, unknown flags, unknown names, and malformed macros
- never performing network I/O, installation, process execution, or authorization as a side effect of decoding

## What VQX is not responsible for

- authentication, identity, or transport security
- tool approval, sandboxing, or host policy
- confidentiality (encoding is not encryption)
- publisher authentication via a same-origin checksum

Decoded tokens such as `EXECUTE` or `INSTALL` remain untrusted requests.

Preferred languages: English.
Policy: https://vqx.zlapp.app/security/
Threat model: https://vqx.zlapp.app/security/threat-model.md
RFC 9116 security.txt: https://vqx.zlapp.app/.well-known/security.txt
