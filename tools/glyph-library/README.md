# Agent Glyph Library

Procedural canvas/SVG animations for **AGENT_GLYPH_MASTER_1.0** (173 glyphs), exported as looping GIFs and vector SVG flipbooks.

Built in one pass from the finalized JSON specs. Passing glyphs keep their source geometry; revised glyphs (`status: "revised"`) use the replacement specifications.

## Outputs

| Path | Contents |
|---|---|
| `dist/gif/*.gif` | 128×128 looping GIFs, 20 fps |
| `dist/svg/*.svg` | Animated vector SVG (10 CSS-keyed path frames) |
| `dist/preview.html` | Filterable gallery |
| `dist/catalog.json` | id, state, source, duration, file paths |

## Batches

| Batch | Source | Count |
|---|---|---|
| B1 | Muse Spark | 29 |
| B2 | GLM 5.2 | 29 |
| B3 | Sol | 29 |
| B4 | Gemini | 29 |
| B5 | Grok | 29 |
| B6 | Sonnet | 28 |

## Regenerate

```bash
cd glyph-library
npm install
node export.js              # all 173
node export.js B1.01 B2.12  # subset
```

Draw functions live in `src/glyphs/b1.js`–`b6.js`. Shared primitives and easing are in `src/lib/helpers.js`. Each glyph is `(ctx, tMs) => void` on a 128×128 dark canvas (`#12141A`).

## Design

- Stroke-first geometry; hue is secondary to topology
- Teal `#20C7C7` = healthy / completed / verified
- Amber `#FFA500` = caution / gap / active frontier
- Motion matches each spec’s loop duration and easing
- Variable params from the spec are encoded as default mid-range values in the drawing (jitter, gap, fill ratio, etc.)
