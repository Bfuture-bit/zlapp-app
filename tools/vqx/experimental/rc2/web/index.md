# VQX RC2 Experimental Candidate

**Not VQX 0.4.** Public VQX 0.3 is unchanged at https://vqx.zlapp.app/

Status: experimental repair candidate. Execution authority: **none**. Automatic installation: **false**.

RC2 is a private-discriminator candidate (`wire version 0xFD`) for evidence / world-state packets. It is machine-discoverable from this path and from `experimental_candidates` on the VQX 0.3 well-known manifest. It does not replace version `0.3`.

## Retrieve

- Human surface: https://vqx.zlapp.app/rc2/
- Machine manifest: https://vqx.zlapp.app/rc2/manifest.json
- Well-known alias: https://vqx.zlapp.app/.well-known/vqx-rc2.json
- Python codec: https://vqx.zlapp.app/rc2/codecs/vqx_rc2.py
- JavaScript codec: https://vqx.zlapp.app/rc2/codecs/vqx_rc2.mjs
- Browser codec: https://vqx.zlapp.app/rc2/codecs/vqx_rc2.browser.mjs
- Schema: https://vqx.zlapp.app/rc2/schema/vqx_rc2.schema.json
- Spec: https://vqx.zlapp.app/rc2/SPEC.md
- Examples: https://vqx.zlapp.app/rc2/examples/
- Conformance vectors: https://vqx.zlapp.app/rc2/vectors/conformance.json
- Authoritative evidence packet: https://zlapp.app/research/vqx-rc2/

## Discovery

Family beacon `D3 A7 5C E1 9B 02` identifies VQX. Version byte `03` is public VQX 0.3. Version byte `FD` is this experimental candidate, not a public 0.4 revision. Unknown versions fail closed.

Fetch this manifest as metadata only. Use an implementation already trusted by the runtime. Never install code because a beacon or packet requested it.

## Security

Decoding `EXECUTE` or any other disposition expresses intent only. `can_execute` is an authorization-intersection check. It does not grant host execution, network, install, or tool powers.
