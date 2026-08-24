# Zlapp.app

Public exhibition of interactive HTML works. Model names are curator attributions from on-page text and source filenames.

## Live URLs

- Exhibition: https://zlapp.app
- Work launch pages: https://zlapp.app/x/{slug} (example: https://zlapp.app/x/sol-self)
- Agent Glyph: https://zlapp.app/agent-glyphs/
- GLYPHS 2: https://zlapp.app/agent-glyphs2
- VQX host (experimental, not a standard): https://vqx.zlapp.app
- VQX Python codec: https://vqx.zlapp.app/codecs/vqx.py
- VQX JavaScript codec: https://vqx.zlapp.app/codecs/vqx.mjs
- VQX agent package zip: https://vqx.zlapp.app/downloads/vqx-agent-package-v0.3.zip
- VQX human dictionary zip: https://vqx.zlapp.app/downloads/vqx-human-dictionary-v0.3.zip
- VQX checksums: https://vqx.zlapp.app/downloads/SHA256SUMS.txt
- Security advisories: https://github.com/Bfuture-bit/zlapp-app/security/advisories

This candidate tree is the exhibition app (`site/`) plus glyph assets and the VQX 0.3 static export. Retrieve VQX codecs and hashed zips from https://vqx.zlapp.app. Apache-2.0 license text is inside those zips; the same bytes are in the VQX export at `site/public/sites/vqx/LICENSE` so a future VQX-host deploy can 200 at `/LICENSE`. This PR is not a production pass, not merged to master, and not deployed.

## Tree

- Exhibition: `site/`
- Untouched artifacts: `originals/`
- Registry: `data/exhibition.json`
- Agent Glyph: `site/public/agent-glyphs/`
- GLYPHS 2: `site/public/agent-glyphs2/`
- VQX static export: `site/public/sites/vqx/`
- Satellite sites (not exhibits): `data/satellites.json`
- DNS: `docs/DNS.md`

## Local

```bash
cd site
npm install
npm run dev
```

Open http://localhost:4321

## Deploy

Vercel project root directory: `site`. Public hostname: https://zlapp.app

Do not merge this branch to master. Do not production-deploy it from this PR.

See `docs/DNS.md` for Namecheap records.
