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
  const experiment = manifest.experiments.find((e) => e.id === id);
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
