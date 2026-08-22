'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createCanvas } = require('canvas');
const { GIFEncoder, quantize, applyPalette } = require('gifenc');
const { glyphs } = require('./src/glyphs');
const { SIZE, BG, layer } = require('./src/lib/helpers');
const { drawFrame, DELAY } = require('./src/lib/export');
const master = require('./specs/AGENT_GLYPH_MASTER.json');

const OUT = path.join(__dirname, '..', '..', 'site', 'public', 'agent-glyphs');
const FPS = 20;
const BATCH_FRAMES = 24;
const MASTER_FRAMES = 20;

const BATCHES = [
  { id: 'B1', slug: 'b1-muse-spark', model: 'Muse Spark', count: 29 },
  { id: 'B2', slug: 'b2-glm-52', model: 'GLM 5.2', count: 29 },
  { id: 'B3', slug: 'b3-sol', model: 'Sol', count: 29 },
  { id: 'B4', slug: 'b4-gemini', model: 'Gemini', count: 29 },
  { id: 'B5', slug: 'b5-grok', model: 'Grok', count: 29 },
  { id: 'B6', slug: 'b6-sonnet', model: 'Sonnet', count: 28 },
];

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function encodeGif(frames, w, h) {
  const sample = [];
  const step = Math.max(1, Math.floor(frames.length / 8));
  for (let i = 0; i < frames.length; i += step) {
    const data = frames[i];
    for (let p = 0; p < data.length; p += 64) {
      sample.push(data[p], data[p + 1], data[p + 2], data[p + 3]);
    }
  }
  const palette = quantize(Uint8ClampedArray.from(sample), 256, { format: 'rgb565' });
  const gif = GIFEncoder();
  for (let i = 0; i < frames.length; i++) {
    const index = applyPalette(frames[i], palette, 'rgb565');
    gif.writeFrame(index, w, h, { palette, delay: DELAY, repeat: 0 });
  }
  gif.finish();
  return Buffer.from(gif.bytes());
}

function blit(dst, dx, dy, dw, srcCanvas, cell) {
  const ctx = dst.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(srcCanvas, dx, dy, cell, cell);
}

function gridFor(n, cols) {
  const rows = Math.ceil(n / cols);
  return { cols, rows };
}

function composeGrid(list, { cols, cell, frames, pad = 4, label = false }) {
  const { rows } = gridFor(list.length, cols);
  const w = cols * cell + (cols + 1) * pad;
  const h = rows * cell + (rows + 1) * pad + (label ? 18 : 0);
  const outFrames = [];
  for (let f = 0; f < frames; f++) {
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);
    list.forEach((g, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const t = ((f + 0.5) / frames) * g.duration;
      const tile = drawFrame(g, t);
      const x = pad + c * (cell + pad);
      const y = pad + r * (cell + pad);
      blit(canvas, x, y, cell, tile, cell);
    });
    outFrames.push(new Uint8ClampedArray(ctx.getImageData(0, 0, w, h).data));
  }
  return { gif: encodeGif(outFrames, w, h), w, h };
}

function contactSheet(list, { cols, cell, pad = 6 }) {
  const { rows } = gridFor(list.length, cols);
  const w = cols * cell + (cols + 1) * pad;
  const h = rows * cell + (rows + 1) * pad;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);
  list.forEach((g, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const tile = drawFrame(g, g.duration * 0.4);
    const x = pad + c * (cell + pad);
    const y = pad + r * (cell + pad);
    ctx.drawImage(tile, x, y, cell, cell);
  });
  return canvas.toBuffer('image/png');
}

function csvEscape(v) {
  const s = v == null ? '' : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, 'batches'), { recursive: true });

const byBatch = Object.fromEntries(BATCHES.map((b) => [b.id, glyphs.filter((g) => g.id.startsWith(b.id + '.'))]));

const hashes = {};
const assets = [];

for (const b of BATCHES) {
  const list = byBatch[b.id];
  if (list.length !== b.count) throw new Error(`${b.id} expected ${b.count} got ${list.length}`);
  const { gif, w, h } = composeGrid(list, { cols: 6, cell: 88, frames: BATCH_FRAMES });
  const rel = `batches/${b.slug}.gif`;
  fs.writeFileSync(path.join(OUT, rel), gif);
  hashes[rel] = sha256(gif);
  assets.push({ kind: 'batch_gif', batch: b.id, file: rel, bytes: gif.length, width: w, height: h });
  console.log('batch', b.id, rel, `${(gif.length / 1024).toFixed(1)}KB`, `${w}x${h}`);
}

const masterComp = composeGrid(glyphs, { cols: 15, cell: 36, frames: MASTER_FRAMES, pad: 3 });
fs.writeFileSync(path.join(OUT, 'master.gif'), masterComp.gif);
hashes['master.gif'] = sha256(masterComp.gif);
assets.push({
  kind: 'master_gif',
  file: 'master.gif',
  bytes: masterComp.gif.length,
  width: masterComp.w,
  height: masterComp.h,
  glyph_count: glyphs.length,
});
console.log('master.gif', `${(masterComp.gif.length / 1024).toFixed(1)}KB`, `${masterComp.w}x${masterComp.h}`);

const sheet = contactSheet(glyphs, { cols: 15, cell: 48, pad: 4 });
fs.writeFileSync(path.join(OUT, 'contact-sheet.png'), sheet);
hashes['contact-sheet.png'] = sha256(sheet);
assets.push({ kind: 'contact_sheet', file: 'contact-sheet.png', bytes: sheet.length });
console.log('contact-sheet.png', `${(sheet.length / 1024).toFixed(1)}KB`);

const exhibitionManifest = {
  schema_version: 'AGENT_GLYPH_MASTER_1.0',
  title: 'Agent Glyph — AI-Native Visual State Language',
  total_glyphs: master.total_glyphs,
  acceptance_threshold: master.acceptance_threshold,
  preserved_pass_count: master.preserved_pass_count,
  revision_count: master.revision_count,
  canvas: { size: SIZE, background: BG, fps: FPS },
  batch_map: master.batch_map,
  revision_policy: master.revision_policy,
  assets: {
    batches: BATCHES.map((b) => `/agent-glyphs/batches/${b.slug}.gif`),
    master: '/agent-glyphs/master.gif',
    contact_sheet: '/agent-glyphs/contact-sheet.png',
    manifest_json: '/agent-glyphs/manifest.json',
    manifest_csv: '/agent-glyphs/manifest.csv',
    verification: '/agent-glyphs/verification.json',
  },
  glyphs: master.glyphs.map((s) => {
    const g = glyphs.find((x) => x.id === s.id);
    return {
      id: s.id,
      source_model: s.source_model,
      source_state_id: s.source_state_id,
      status: s.status,
      concept: s.concept || null,
      duration_ms: g.duration,
      loop: g.loop !== false,
      static_form: s.static_form,
      motion: s.motion,
      color_logic: s.color_logic,
    };
  }),
};

const manifestBuf = Buffer.from(JSON.stringify(exhibitionManifest, null, 2));
fs.writeFileSync(path.join(OUT, 'manifest.json'), manifestBuf);
hashes['manifest.json'] = sha256(manifestBuf);

const csvHeader = [
  'id',
  'source_model',
  'source_state_id',
  'status',
  'concept',
  'duration_ms',
  'loop',
].join(',');
const csvRows = exhibitionManifest.glyphs.map((g) =>
  [
    g.id,
    g.source_model,
    g.source_state_id,
    g.status,
    g.concept,
    g.duration_ms,
    g.loop,
  ]
    .map(csvEscape)
    .join(',')
);
const csvBuf = Buffer.from([csvHeader, ...csvRows].join('\n') + '\n');
fs.writeFileSync(path.join(OUT, 'manifest.csv'), csvBuf);
hashes['manifest.csv'] = sha256(csvBuf);

const verification = {
  schema_version: 'AGENT_GLYPH_MASTER_1.0',
  generated_at: new Date().toISOString(),
  totals: {
    glyphs: glyphs.length,
    preserved: glyphs.filter((g) => g.status === 'passed').length,
    revised: glyphs.filter((g) => g.status === 'revised').length,
    batches: BATCHES.length,
    acceptance_threshold: master.acceptance_threshold,
  },
  expected: {
    glyphs: 173,
    preserved: 150,
    revised: 23,
    batches: 6,
  },
  match:
    glyphs.length === 173 &&
    glyphs.filter((g) => g.status === 'passed').length === 150 &&
    glyphs.filter((g) => g.status === 'revised').length === 23,
  sha256: hashes,
  assets,
  revised_ids: glyphs.filter((g) => g.status === 'revised').map((g) => g.id),
};
const verBuf = Buffer.from(JSON.stringify(verification, null, 2));
fs.writeFileSync(path.join(OUT, 'verification.json'), verBuf);
console.log('verification match', verification.match);
console.log('wrote', OUT);
