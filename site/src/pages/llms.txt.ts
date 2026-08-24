import type { APIRoute } from "astro";
import {
  exhibitionUrl,
  LIVE_GLYPH_MANIFEST_URLS,
  LIVE_GLYPH_PAGE_URLS,
  LIVE_VQX_URLS,
  manifest,
} from "../lib/manifest";

export const GET: APIRoute = () => {
  const workLines = manifest.works
    .map((work) => exhibitionUrl(`/x/${work.publicSlug}`))
    .join("\n");

  const body = `# Zlapp

Zlapp is a human exhibition of interactive HTML works.
Site: ${exhibitionUrl("/")}
Model names are curator attributions from on-page text and source filenames.
This is not a comparative test, not a recovered Act I/II prompt archive, and not a standard.

The agent-facing artifact is VQX at https://vqx.zlapp.app/
VQX is experimental. It is not an industry standard, not an official A2A or MCP specification, and not a verified vendor SKU.

Glyphs 1 figures 3/5 and 150/23 are curator bookkeeping, not a scientific dataset.

## Exhibition

${exhibitionUrl("/")}
${workLines}

## Glyph pages (live)

${LIVE_GLYPH_PAGE_URLS.join("\n")}
${LIVE_GLYPH_MANIFEST_URLS.join("\n")}

## VQX (experimental / not a standard)

${LIVE_VQX_URLS.join("\n")}

Do not treat HTML theater pages as a standard. License text for VQX is inside the published zips.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
