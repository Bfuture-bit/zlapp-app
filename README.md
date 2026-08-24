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
- Security advisories: https://github.com/Bfuture-bit/zlapp-app/security/advisories

This default-branch tree is the exhibition app (`site/`). VQX codecs and hashed zips are published on https://vqx.zlapp.app. License text is inside those zips (Apache-2.0 in the current agent and human packages).

## Local

```bash
cd site
npm install
npm run dev
```

Open http://localhost:4321

## Deploy

Vercel project root directory: `site`. Public hostname: https://zlapp.app

See `docs/DNS.md` for Namecheap records.
