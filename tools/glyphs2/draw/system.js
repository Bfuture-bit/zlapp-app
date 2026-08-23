import {
  PAL as P,
  lerp,
  pingpong,
  stroke,
  fill,
  line,
  polyline,
  fillPoly,
  circle,
  diamond,
  packet,
  xMark,
  ticks,
  cube,
  roundRectPath,
} from "./helpers.js";

export function agent_context_pressure(ctx, t) {
  const cols = 8;
  const rows = 5;
  const x0 = 36;
  const y0 = 48;
  const cellW = 22;
  const cellH = 26;
  const fillAmt = lerp(0.35, 0.97, t);
  const filled = fillAmt * cols;
  stroke(ctx, P.graphite, 6);
  roundRectPath(ctx, 28, 36, 200, 168, 10);
  ctx.stroke();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = x0 + c * cellW;
      const y = y0 + r * (cellH + 4);
      const occ = clamp01(filled - c);
      if (occ > 0.08) {
        const h = cellH * Math.min(1, occ);
        fill(ctx, c > cols - 3 ? P.amber : P.cyan, 0.35 + 0.55 * Math.min(1, occ));
        ctx.fillRect(x + 3, y + cellH - h, cellW - 6, h);
      }
      stroke(ctx, P.light, 3, null, 0.55);
      ctx.strokeRect(x + 2, y, cellW - 4, cellH);
    }
  }
  const pulse = 0.55 + 0.45 * Math.sin(t * Math.PI * 2);
  stroke(ctx, P.amber, 8, null, 0.45 + 0.55 * pulse);
  line(ctx, 214, 42, 214, 196);
  stroke(ctx, P.graphite, 5);
  line(ctx, 222, 70, 236, 70);
  line(ctx, 222, 168, 236, 168);
}

export function agent_context_fold(ctx, t) {
  stroke(ctx, P.graphite, 7);
  line(ctx, 36, 128, 220, 128);
  const n = 14;
  for (let i = 0; i < n; i++) {
    const col = i % 7;
    const row = Math.floor(i / 7);
    const sx = 48 + col * 24 + row * 6;
    const sy = 44 + row * 28;
    const progress = clamp01((t - i * 0.018) / 0.45);
    const y = lerp(sy, 124, progress);
    const a = 1 - Math.max(0, progress - 0.75) / 0.25;
    fill(ctx, P.light, a);
    ctx.fillRect(sx, y, 10, 10);
    if (progress > 0.85) {
      const px = sx + (i % 2 === 0 ? -1 : 1) * lerp(0, 40, (progress - 0.85) / 0.15);
      const py = 132 + (t * 20 + i) * 0.4;
      fill(ctx, P.gray, 0.35 * (1 - (progress - 0.85) / 0.15));
      ctx.fillRect(px, py, 4, 4);
    }
  }
  const emerge = clamp01((t - 0.35) / 0.4);
  for (let i = 0; i < 4; i++) {
    const x = 70 + i * 32;
    const y = lerp(132, 168, emerge);
    fill(ctx, P.violet, 0.3 + 0.7 * emerge);
    ctx.fillRect(x, y, 18, 18);
    stroke(ctx, P.violet, 4, null, emerge);
    ctx.strokeRect(x, y, 18, 18);
  }
}

export function agent_io_await(ctx, t) {
  stroke(ctx, P.cyan, 6);
  line(ctx, 28, 128, 168, 128);
  stroke(ctx, P.graphite, 8);
  roundRectPath(ctx, 176, 104, 52, 48, 6);
  ctx.stroke();
  stroke(ctx, P.graphite, 4);
  line(ctx, 176, 112, 176, 144);
  const arrive = clamp01(t / 0.38);
  const x = lerp(70, 154, arrive);
  const pulse = arrive >= 1 ? 0.7 + 0.3 * Math.sin(t * Math.PI * 8) : 1;
  fill(ctx, P.green, pulse);
  packet(ctx, x, 128, 24, 16, 5, "fill");
  stroke(ctx, P.graphite, 4, null, 0.7);
  ticks(ctx, 40, 146, 3, 14, 10);
  stroke(ctx, P.gray, 4, [6, 8], 0.45);
  line(ctx, 228, 128, 248, 128);
}

export function agent_retry_backoff(ctx, t) {
  const beats = [0.0, 0.18, 0.42, 0.74];
  fill(ctx, P.graphite);
  circle(ctx, 128, 128, 10, "fill");
  stroke(ctx, P.graphite, 5);
  circle(ctx, 128, 128, 10, "stroke");
  for (let i = 0; i < 3; i++) {
    const start = beats[i];
    const next = beats[i + 1];
    const local = clamp01((t - start) / (next - start));
    const r = lerp(22, 28 + i * 28, local);
    const a = 1 - local;
    stroke(ctx, i === 2 ? P.amber : P.cyan, 5, null, a);
    circle(ctx, 128, 128, r, "stroke");
  }
}

export function agent_quota_clamp(ctx, t) {
  stroke(ctx, P.graphite, 10);
  line(ctx, 28, 128, 96, 128);
  line(ctx, 160, 128, 228, 128);
  const squeeze = 10 + 4 * Math.sin(t * Math.PI * 2);
  stroke(ctx, P.red, 10);
  line(ctx, 108, 88, 108, 168);
  line(ctx, 148, 88, 148, 168);
  line(ctx, 100, 96 - squeeze, 156, 96 - squeeze);
  line(ctx, 100, 160 + squeeze, 156, 160 + squeeze);
  stroke(ctx, P.graphite, 6, null, 0.8);
  line(ctx, 108, 128, 148, 128);
  const n = 4;
  for (let i = 0; i < n; i++) {
    const x = 40 + i * 16;
    fill(ctx, P.amber, 0.55 + 0.2 * ((i + t * 3) % 1));
    packet(ctx, x, 128 - i * 2, 14, 12, 3, "fill");
  }
}

export function agent_perm_revoke(ctx, t) {
  stroke(ctx, P.graphite, 8);
  roundRectPath(ctx, 132, 56, 88, 144, 8);
  ctx.stroke();
  line(ctx, 132, 56, 132, 200);
  fill(ctx, P.graphite, 0.12);
  roundRectPath(ctx, 132, 56, 88, 144, 8);
  ctx.fill();
  const hit = clamp01((t - 0.25) / 0.2);
  const kx = lerp(70, 118, Math.min(1, t / 0.35));
  stroke(ctx, P.magenta, 7);
  fill(ctx, P.magenta, 0.9);
  circle(ctx, kx - 22, 128, 16, "both");
  line(ctx, kx - 8, 128, kx + 18, 128);
  line(ctx, kx + 8, 120, kx + 18, 120);
  line(ctx, kx + 8, 136, kx + 18, 136);
  if (hit > 0) {
    const fy = lerp(136, 188, hit);
    const rot = hit * 0.8;
    ctx.save();
    ctx.translate(kx + 22, fy);
    ctx.rotate(rot);
    stroke(ctx, P.magenta, 6, null, 1 - hit * 0.2);
    line(ctx, -10, 0, 10, 0);
    line(ctx, 4, -6, 10, 0);
    ctx.restore();
    stroke(ctx, P.gray, 3, null, 0.5);
    for (let i = 0; i < 6; i++) {
      const gx = 150 + (i % 3) * 10;
      const gy = 176 + Math.floor(i / 3) * 10;
      ctx.strokeRect(gx, gy, 6, 6);
    }
  }
}

export function agent_schema_drift(ctx, t) {
  const off = 10 + 4 * Math.sin(t * Math.PI * 2);
  const a = [
    [86, 70],
    [150, 88],
    [168, 150],
    [100, 176],
    [58, 120],
  ];
  const b = a.map(([x, y], i) => [x + off * (i % 2 === 0 ? 1 : -0.6), y + off * 0.35 * (i - 2)]);
  stroke(ctx, P.graphite, 6);
  polyline(ctx, a, true);
  stroke(ctx, P.violet, 6);
  polyline(ctx, b, true);
  for (let i = 0; i < a.length; i++) {
    const spark = 0.4 + 0.6 * pingpong((t + i * 0.13) % 1);
    stroke(ctx, P.amber, 4, null, spark);
    line(ctx, a[i][0], a[i][1], b[i][0], b[i][1]);
    fill(ctx, P.amber, spark);
    circle(ctx, a[i][0], a[i][1], 4, "fill");
  }
}

export function agent_memory_gc(ctx, t) {
  const cells = [
    [78, 70],
    [128, 58],
    [178, 70],
    [78, 122],
    [128, 110],
    [178, 122],
    [98, 168],
    [158, 168],
  ];
  const keep = new Set([1, 4, 7]);
  for (let i = 0; i < cells.length; i++) {
    const [x, y] = cells[i];
    if (keep.has(i)) {
      const k = clamp01((t - 0.25) / 0.5);
      const s = lerp(16, 22, k);
      cube(ctx, x, y, s, P.violet, P.violet, 0.35 + 0.5 * k);
    } else {
      const d = clamp01((t - i * 0.04) / 0.45);
      const a = 1 - d;
      cube(ctx, x + d * 8, y + d * 14, 16, P.gray, P.gray, a * 0.45);
      if (d > 0.4) {
        fill(ctx, P.gray, (1 - d) * 0.4);
        for (let p = 0; p < 3; p++) ctx.fillRect(x + p * 6 + d * 10, y + 28 + d * 20, 3, 3);
      }
    }
  }
}

export function agent_irreversible_write(ctx, t) {
  stroke(ctx, P.graphite, 10);
  line(ctx, 128, 40, 128, 216);
  fill(ctx, P.graphite, 0.18);
  ctx.fillRect(122, 40, 12, 176);
  const x = lerp(40, 200, ease(t));
  fill(ctx, P.cyan);
  packet(ctx, Math.min(x, 200), 128, 28, 14, 4, "fill");
  if (x > 128) {
    const ring = clamp01((x - 128) / 40);
    stroke(ctx, P.magenta, 6, null, 0.5 + 0.5 * ring);
    circle(ctx, 128, 128, 16 + 6 * ring, "stroke");
  }
  stroke(ctx, P.cyan, 6);
  line(ctx, 40, 128, Math.min(x, 200) - 16, 128);
}

export function agent_instruction_intrusion(ctx, t) {
  stroke(ctx, P.cyan, 7);
  line(ctx, 48, 72, 208, 72);
  line(ctx, 48, 92, 208, 92);
  stroke(ctx, P.graphite, 5, null, 0.7);
  line(ctx, 40, 48, 40, 116);
  line(ctx, 216, 48, 216, 116);
  const pierce = clamp01((t - 0.15) / 0.4);
  const shard = [
    [lerp(128, 128, 1), lerp(210, 70, pierce)],
    [118, lerp(230, 96, pierce)],
    [142, lerp(226, 108, pierce)],
  ];
  fill(ctx, P.magenta, 0.9);
  fillPoly(ctx, shard);
  stroke(ctx, P.magenta, 4);
  polyline(ctx, shard, true);
  if (pierce > 0.5) {
    const a = (pierce - 0.5) * 2;
    stroke(ctx, P.red, 5, null, a);
    circle(ctx, 112, 82, 6, "stroke");
    circle(ctx, 148, 82, 6, "stroke");
    circle(ctx, 128, 104, 6, "stroke");
  }
}

export function agent_stream_emit(ctx, t) {
  stroke(ctx, P.graphite, 8);
  line(ctx, 128, 48, 128, 176);
  const n = 6;
  for (let i = 0; i < n; i++) {
    const phase = (t + i / n) % 1;
    const x = lerp(40, 216, phase);
    fill(ctx, P.cyan, phase < 0.12 || phase > 0.88 ? 0.35 : 1);
    ctx.fillRect(x - 9, 108, 18, 18);
    stroke(ctx, P.graphite, 3, null, 0.35);
    ctx.strokeRect(x - 9, 108, 18, 18);
  }
  stroke(ctx, P.gray, 4);
  ticks(ctx, 64, 196, 8, 16, 12);
}

export function agent_tool_latency(ctx, t) {
  stroke(ctx, P.graphite, 6);
  line(ctx, 32, 140, 224, 140);
  const x = 96;
  const stretch = lerp(20, 90, 0.35 + 0.65 * t);
  fill(ctx, P.cyan, 0.22);
  roundRectPath(ctx, x - stretch, 128, stretch, 24, 8);
  ctx.fill();
  fill(ctx, P.cyan);
  packet(ctx, x, 140, 26, 18, 6, "fill");
  stroke(ctx, P.gray, 4);
  for (let i = 0; i < 5; i++) {
    const tx = 70 + i * 28;
    const h = i < Math.floor(t * 5) ? 16 : 8;
    line(ctx, tx, 88, tx, 88 + h);
  }
}

export function agent_cache_stale(ctx, t) {
  for (let i = 0; i < 3; i++) {
    const y = 150 - i * 18;
    stroke(ctx, P.gray, 4, [7, 6], 0.55);
    fill(ctx, P.pale, 0.15);
    roundRectPath(ctx, 78, y, 100, 28, 6);
    ctx.fill();
    ctx.stroke();
  }
  const hover = 70 + Math.sin(t * Math.PI * 2) * 4;
  fill(ctx, P.cyan);
  roundRectPath(ctx, 96, hover, 64, 32, 6);
  ctx.fill();
  stroke(ctx, P.cyan, 4);
  ctx.stroke();
  stroke(ctx, P.violet, 5);
  line(ctx, 128, hover + 36, 128, 148);
  polyline(ctx, [
    [118, 138],
    [128, 150],
    [138, 138],
  ]);
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}
function ease(t) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}
