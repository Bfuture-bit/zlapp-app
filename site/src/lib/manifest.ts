import manifest from "../data/exhibition.json";

export type Manifest = typeof manifest;
export type Work = Manifest["works"][number];
export type Model = Manifest["models"][number];
export type Experiment = Manifest["experiments"][number];

export { manifest };

export function modelById(id: string) {
  const model = manifest.models.find((m) => m.id === id);
  if (!model) throw new Error(`Unknown model: ${id}`);
  return model;
}

export function experimentById(id: string) {
  const experiment = manifest.experiments.find((m) => m.id === id);
  if (!experiment) throw new Error(`Unknown experiment: ${id}`);
  return experiment;
}

export function workBySlug(slug: string) {
  return manifest.works.find((w) => w.publicSlug === slug);
}

export function worksFor(experimentId: string) {
  return manifest.works.filter((w) => w.experiment === experimentId);
}

export function exhibitionUrl(path = "/") {
  return `https://zlapp.app${path === "/" ? "" : path}`;
}

export function experienceHref(slug: string, play = false) {
  return play ? `/x/${slug}/play` : `/x/${slug}`;
}

export function artifactHref(slug: string) {
  return `/artifacts/${slug}.html`;
}

export function previewHref(slug: string) {
  return `/previews/${slug}.svg`;
}

export const EXHIBITION_DESCRIPTION =
  "An exhibition of interactive HTML. Model names are curator attributions from on-page text and filenames.";

/** Live apex URLs that currently 200 and are allowed in the sitemap. */
export const LIVE_GLYPH_PAGE_URLS = [
  "https://zlapp.app/agent-glyphs/",
  "https://zlapp.app/agent-glyphs2",
] as const;

export const LIVE_GLYPH_MANIFEST_URLS = [
  "https://zlapp.app/agent-glyphs/manifest.json",
  "https://zlapp.app/agent-glyphs2/manifest.json",
] as const;

export const LIVE_VQX_URLS = [
  "https://vqx.zlapp.app/",
  "https://vqx.zlapp.app/.well-known/vqx.json",
  "https://vqx.zlapp.app/codecs/vqx.py",
  "https://vqx.zlapp.app/codecs/vqx.mjs",
  "https://vqx.zlapp.app/downloads/vqx-agent-package-v0.3.zip",
  "https://vqx.zlapp.app/downloads/vqx-human-dictionary-v0.3.zip",
  "https://vqx.zlapp.app/index.md",
  "https://vqx.zlapp.app/rc2/",
  "https://vqx.zlapp.app/rc2/manifest.json",
  "https://vqx.zlapp.app/.well-known/vqx-rc2.json",
] as const;

export function sitemapUrls() {
  return [
    exhibitionUrl("/"),
    exhibitionUrl("/llms.txt"),
    ...manifest.works.map((work) => exhibitionUrl(`/x/${work.publicSlug}`)),
    ...LIVE_GLYPH_PAGE_URLS,
    ...LIVE_GLYPH_MANIFEST_URLS,
    exhibitionUrl("/weekly-ads"),
    "https://vqx.zlapp.app/",
    "https://vqx.zlapp.app/rc2/",
  ];
}

export function workJsonLd(work: Work) {
  const model = modelById(work.model);
  const url = exhibitionUrl(`/x/${work.publicSlug}`);
  return {
    "@type": "CreativeWork",
    name: work.title,
    url,
    image: exhibitionUrl(previewHref(work.publicSlug)),
    creator: {
      "@type": "Thing",
      name: model.name,
      description:
        "Curator attribution from on-page text and source filename. Not a vendor-verified SKU.",
    },
    description: `${work.title}. Interactive HTML. On-page attribution: ${model.name}.`,
  };
}

export function exhibitionJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Zlapp",
    url: exhibitionUrl("/"),
    description: `${EXHIBITION_DESCRIPTION} A human exhibition, not a standard, not a scientific dataset, and not an official product.`,
    hasPart: manifest.works.map((work) => workJsonLd(work)),
  };
}

export function launchJsonLd(work: Work) {
  return {
    "@context": "https://schema.org",
    ...workJsonLd(work),
    isPartOf: {
      "@type": "CollectionPage",
      name: "Zlapp",
      url: exhibitionUrl("/"),
      description: "A human exhibition of interactive HTML. Not a standard.",
    },
  };
}
