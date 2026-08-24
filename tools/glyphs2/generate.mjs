import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas } from "canvas";
import gifenc from "gifenc";
const { GIFEncoder, quantize, applyPalette } = gifenc;
import { SVGContext } from "./svg-context.js";
import { GLYPHS, ANIMATED, SCHEMA, SIZE, FPS } from "./catalog.js";
import { drawers } from "./draw/index.js";
import { reset } from "./draw/helpers.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outRoot = path.join(root, "site", "public", "agent-glyphs2");
const DELAY = Math.round(1000 / FPS);

function ensureDirs() {
  for (const d of ["svg", "png", "gif"]) {
    fs.mkdirSync(path.join(outRoot, d), { recursive: true });
  }
}

function drawToCanvas(id, t) {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, SIZE, SIZE);
  reset(ctx);
  const fn = drawers[id];
  if (!fn) throw new Error(`Missing drawer: ${id}`);
  ctx.save();
  fn(ctx, t);
  ctx.restore();
  return canvas;
}

function drawToSvg(id, t) {
  const ctx = new SVGContext(SIZE, SIZE);
  reset(ctx);
  drawers[id](ctx, t);
  const inner = ctx.toSVG();
  if (!inner || inner.length < 40) throw new Error(`Empty SVG for ${id}`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" role="img" aria-label=":${id}:">
${inner}
</svg>
`;
}

function encodeTransparentGif(frames) {
  const sample = [];
  for (const data of frames) {
    for (let i = 0; i < data.length; i += 24) {
      if (data[i + 3] > 32) sample.push(data[i], data[i + 1], data[i + 2], 255);
    }
  }
  if (sample.length < 16) sample.push(32, 36, 43, 255, 35, 199, 232, 255);
  const quantized = quantize(Uint8ClampedArray.from(sample), 255, { format: "rgb565" });
  const palette = new Uint8Array(quantized.length + 3);
  palette[0] = 1;
  palette[1] = 0;
  palette[2] = 1;
  palette.set(quantized, 3);
  const gif = GIFEncoder();
  frames.forEach((data, f) => {
    const mapped = applyPalette(data, quantized, "rgb565");
    const index = new Uint8Array(mapped.length);
    for (let i = 0; i < mapped.length; i++) {
      index[i] = data[i * 4 + 3] < 24 ? 0 : mapped[i] + 1;
    }
    gif.writeFrame(index, SIZE, SIZE, {
      palette,
      delay: DELAY,
      repeat: f === 0 ? 0 : undefined,
      transparent: true,
      transparentIndex: 0,
      dispose: 2,
    });
  });
  gif.finish();
  return Buffer.from(gif.bytes());
}

function countGifFrames(buf) {
  let n = 0;
  for (let i = 0; i < buf.length; i++) if (buf[i] === 0x2c) n++;
  return n;
}

function svgLooksValid(text) {
  if (!text.includes('viewBox="0 0 256 256"')) return "missing viewBox";
  if (/<image[\s>]/i.test(text)) return "embedded raster";
  if (!/(<path|<circle|<rect|<ellipse|<polygon|<polyline)/i.test(text)) return "no geometry";
  return null;
}

function writeContactSheet(glyphs) {
  const cols = 6;
  const rows = Math.ceil(glyphs.length / cols);
  const cell = 128;
  const canvas = createCanvas(cols * cell, rows * cell);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  glyphs.forEach((g, i) => {
    const img = drawToCanvas(g.id, g.staticT ?? 0.5);
    const c = i % cols;
    const r = Math.floor(i / cols);
    ctx.drawImage(img, c * cell, r * cell, cell, cell);
  });
  const dest = path.join(outRoot, "contact-sheet.png");
  fs.writeFileSync(dest, canvas.toBuffer("image/png"));
  return dest;
}

function buildManifest(glyphs) {
  return {
    schema_version: SCHEMA,
    library: "GLYPHS 2",
    route: "/agent-glyphs2",
    canvas: "256x256",
    background: "transparent",
    static_format: "svg",
    animated_format: "gif",
    gif_fps: FPS,
    totals: {
      static: glyphs.length,
      animated: glyphs.filter((g) => ANIMATED.has(g.id)).length,
    },
    emojis: glyphs.map((g) => {
      const animated = ANIMATED.has(g.id);
      return {
        id: g.id,
        emoji: `:${g.id}:`,
        category: g.category,
        meaning: g.meaning,
        svg: `/agent-glyphs2/svg/${g.id}.svg`,
        png: `/agent-glyphs2/png/${g.id}.png`,
        gif: animated ? `/agent-glyphs2/gif/${g.id}.gif` : null,
        animated,
      };
    }),
  };
}

function verify(manifest) {
  const errors = [];
  if (manifest.emojis.length !== 30) errors.push(`expected 30 glyphs, got ${manifest.emojis.length}`);
  const svgs = fs.readdirSync(path.join(outRoot, "svg")).filter((f) => f.endsWith(".svg"));
  const pngs = fs.readdirSync(path.join(outRoot, "png")).filter((f) => f.endsWith(".png"));
  const gifs = fs.readdirSync(path.join(outRoot, "gif")).filter((f) => f.endsWith(".gif"));
  if (svgs.length !== 30) errors.push(`expected 30 SVGs, got ${svgs.length}`);
  if (pngs.length !== 30) errors.push(`expected 30 PNGs, got ${pngs.length}`);
  if (gifs.length !== 15) errors.push(`expected 15 GIFs, got ${gifs.length}`);
  for (const g of manifest.emojis) {
    const svgPath = path.join(root, "site/public") + g.svg.replace("/agent-glyphs2", "/agent-glyphs2");
    const svgFile = path.join(outRoot, "svg", `${g.id}.svg`);
    const pngFile = path.join(outRoot, "png", `${g.id}.png`);
    if (!fs.existsSync(svgFile)) errors.push(`missing ${g.svg}`);
    else {
      const bad = svgLooksValid(fs.readFileSync(svgFile, "utf8"));
      if (bad) errors.push(`${g.id} svg: ${bad}`);
    }
    if (!fs.existsSync(pngFile)) errors.push(`missing ${g.png}`);
    if (g.animated) {
      const gifFile = path.join(outRoot, "gif", `${g.id}.gif`);
      if (!fs.existsSync(gifFile)) errors.push(`missing ${g.gif}`);
      else {
        const buf = fs.readFileSync(gifFile);
        if (buf.slice(0, 6).toString() !== "GIF89a") errors.push(`${g.id} not GIF89a`);
        const frames = countGifFrames(buf);
        if (frames < 8) errors.push(`${g.id} gif has ${frames} frames`);
      }
    } else if (g.gif != null) errors.push(`${g.id} should have gif:null`);
    if (!drawers[g.id]) errors.push(`no drawer for ${g.id}`);
  }
  if (errors.length) {
    console.error(errors.map((e) => ` - ${e}`).join("\n"));
    throw new Error(`GLYPHS 2 verification failed (${errors.length})`);
  }
  console.log("Verified 30 SVG, 30 PNG, 15 GIF, manifest paths OK.");
}

export function generate() {
  ensureDirs();
  if (GLYPHS.length !== 30) throw new Error("catalog must contain 30 glyphs");
  for (const g of GLYPHS) {
    const svg = drawToSvg(g.id, g.staticT ?? 0.5);
    fs.writeFileSync(path.join(outRoot, "svg", `${g.id}.svg`), svg);
    const png = drawToCanvas(g.id, g.staticT ?? 0.5).toBuffer("image/png");
    fs.writeFileSync(path.join(outRoot, "png", `${g.id}.png`), png);
    if (ANIMATED.has(g.id)) {
      const seconds = g.duration ?? 3;
      const n = Math.round(seconds * FPS);
      const frames = [];
      for (let i = 0; i < n; i++) {
        const canvas = drawToCanvas(g.id, i / n);
        frames.push(canvas.getContext("2d").getImageData(0, 0, SIZE, SIZE).data);
      }
      const gif = encodeTransparentGif(frames);
      fs.writeFileSync(path.join(outRoot, "gif", `${g.id}.gif`), gif);
      console.log(`gif ${g.id} ${n}f ${gif.length}b`);
    }
    console.log(`wrote ${g.id}`);
  }
  writeContactSheet(GLYPHS);
  const manifest = buildManifest(GLYPHS);
  fs.writeFileSync(path.join(outRoot, "manifest.json"), JSON.stringify(manifest, null, 2));
  verify(manifest);
  return manifest;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  if (process.argv.includes("--verify-only")) {
    const manifest = JSON.parse(fs.readFileSync(path.join(outRoot, "manifest.json"), "utf8"));
    verify(manifest);
  } else {
    generate();
  }
}
