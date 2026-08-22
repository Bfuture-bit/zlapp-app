'use strict';

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const { GIFEncoder, quantize, applyPalette } = require('gifenc');
const { SIZE, BG, layer } = require('./helpers');
const { SVGContext } = require('./svg-context');
const { glyphs } = require('../glyphs/index');

const FPS = 20;
const DELAY = Math.round(1000 / FPS);
const SVG_FRAMES = 10;

function resetCtx(ctx) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2;
  ctx.fillStyle = BG;
  ctx.strokeStyle = '#ffffff';
}

function drawFrame(glyph, tMs) {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  resetCtx(ctx);
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.save();
  layer(ctx, () => {
    glyph.draw(ctx, tMs);
  });
  ctx.restore();
  return canvas;
}

function canvasToRgba(canvas) {
  const ctx = canvas.getContext('2d');
  return new Uint8ClampedArray(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
}

function encodeGif(frames, w, h) {
  const sample = [];
  const step = Math.max(1, Math.floor(frames.length / 6));
  for (let i = 0; i < frames.length; i += step) {
    const data = frames[i];
    for (let p = 0; p < data.length; p += 32) {
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

function drawSvgFrame(glyph, tMs) {
  const ctx = new SVGContext(SIZE, SIZE);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2;
  try {
    glyph.draw(ctx, tMs);
    return ctx.toSVG();
  } catch (e) {
    return null;
  }
}

function vectorAnimatedSvg(glyph) {
  const n = SVG_FRAMES;
  const bodies = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * glyph.duration;
    const inner = drawSvgFrame(glyph, t);
    if (inner == null) return null;
    bodies.push(inner);
  }
  const dur = (glyph.duration / 1000).toFixed(2);
  const pct = 100 / n;
  const styles = bodies.map((_, i) => {
    const a = (i * pct).toFixed(2);
    const b = ((i + 1) * pct - 0.01).toFixed(2);
    return `.f${i}{opacity:0;animation:k${i} ${dur}s steps(1,end) infinite}@keyframes k${i}{${a}%{opacity:1}${b}%{opacity:1}}`;
  }).join('');
  const groups = bodies.map((inner, i) => `<g class="f${i}">${inner}</g>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" role="img" aria-label="${glyph.id} ${glyph.state}">
  <title>${glyph.id} — ${glyph.state}</title>
  <desc>${glyph.source} · ${glyph.state} · procedural vector ${dur}s loop</desc>
  <style>${styles}</style>
  <rect width="100%" height="100%" fill="${BG}"/>
${groups}
</svg>
`;
}

function rasterFallbackSvg(glyph) {
  const canvas = drawFrame(glyph, glyph.duration * 0.4);
  const b64 = canvas.toBuffer('image/png').toString('base64');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" role="img" aria-label="${glyph.id} ${glyph.state}">
  <title>${glyph.id} — ${glyph.state}</title>
  <rect width="100%" height="100%" fill="${BG}"/>
  <image href="data:image/png;base64,${b64}" width="${SIZE}" height="${SIZE}"/>
</svg>
`;
}

function exportGlyph(glyph, outGif, outSvg) {
  const n = Math.max(12, Math.round((glyph.duration / 1000) * FPS));
  const frames = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * glyph.duration;
    frames.push(canvasToRgba(drawFrame(glyph, t)));
  }
  const gif = encodeGif(frames, SIZE, SIZE);
  fs.writeFileSync(outGif, gif);
  let svg = vectorAnimatedSvg(glyph);
  let svgKind = 'vector';
  if (!svg || svg.length < 400) {
    svg = rasterFallbackSvg(glyph);
    svgKind = 'raster';
  }
  fs.writeFileSync(outSvg, svg);
  return { frames: n, gifBytes: gif.length, svgBytes: svg.length, svgKind };
}

function exportAll({ only } = {}) {
  const root = path.join(__dirname, '..', '..');
  const gifDir = path.join(root, 'dist', 'gif');
  const svgDir = path.join(root, 'dist', 'svg');
  fs.mkdirSync(gifDir, { recursive: true });
  fs.mkdirSync(svgDir, { recursive: true });
  const list = only ? glyphs.filter((g) => only.includes(g.id)) : glyphs;
  const catalog = [];
  for (const g of list) {
    const info = exportGlyph(
      g,
      path.join(gifDir, `${g.id}.gif`),
      path.join(svgDir, `${g.id}.svg`)
    );
    catalog.push({
      id: g.id,
      state: g.state,
      source: g.source,
      status: g.status,
      concept: g.concept || null,
      duration: g.duration,
      loop: g.loop !== false,
      gif: `dist/gif/${g.id}.gif`,
      svg: `dist/svg/${g.id}.svg`,
      ...info,
    });
    process.stdout.write(`exported ${g.id}  ${g.state}  ${info.frames}f  gif=${(info.gifBytes / 1024).toFixed(1)}KB svg=${info.svgKind}\n`);
  }
  return catalog;
}

module.exports = { drawFrame, exportGlyph, exportAll, FPS, DELAY };
