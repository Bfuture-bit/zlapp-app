import manifest from "../../public/agent-glyphs2/manifest.json";

export type AgentGlyph2Record = (typeof manifest.emojis)[number];

const byId = new Map(manifest.emojis.map((g) => [g.id, g]));
const TOKEN = /^:([a-z0-9_]+):$/i;

export function getAgentGlyph2Manifest() {
  return manifest;
}

export function getAgentGlyph2ById(id: string): AgentGlyph2Record | null {
  return byId.get(id) ?? null;
}

export function isAgentGlyph2Token(value: string): boolean {
  const m = String(value).trim().match(TOKEN);
  return Boolean(m && byId.has(m[1]));
}

export function resolveAgentGlyph2Token(value: string): AgentGlyph2Record | null {
  const m = String(value).trim().match(TOKEN);
  if (!m) return null;
  return byId.get(m[1]) ?? null;
}

export function agentGlyph2AssetUrl(record: AgentGlyph2Record, kind: "svg" | "png" | "gif" = "svg") {
  if (kind === "gif") return record.gif;
  if (kind === "png") return record.png;
  return record.svg;
}
