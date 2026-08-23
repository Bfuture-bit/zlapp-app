# GLYPHS 2 generator

Deterministic 256×256 vector/GIF library for `/agent-glyphs2`.

```bash
cd tools/glyphs2
npm install
node generate.mjs
```

Writes `site/public/agent-glyphs2/{svg,png,gif,manifest.json}`.
The production site does not depend on this package at runtime.
