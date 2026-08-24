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
  ticks,
} from "./helpers.js";

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

export function agent_fanout_barrier(ctx, t) {
  fill(ctx, P.cyan);
  circle(ctx, 48, 128, 10, "fill");
  const ys = [64, 104, 152, 192];
  const speeds = [1, 0.92, 0.4, 0.85];
  stroke(ctx, P.graphite, 7);
  line(ctx, 200, 48, 200, 208);
  for (let i = 0; i < 4; i++) {
    const p = clamp01(t / speeds[i]);
    const x = lerp(64, 188, p);
    stroke(ctx, P.cyan, 5);
    line(ctx, 56, 128, 88, ys[i]);
    line(ctx, 88, ys[i], x, ys[i]);
    fill(ctx, p >= 1 ? P.green : P.cyan);
    circle(ctx, x, ys[i], 7, "fill");
  }
}

export function agent_state_handoff(ctx, t) {
  stroke(ctx, P.graphite, 6, [4, 6]);
  line(ctx, 128, 40, 128, 216);
  const p = clamp01(t);
  const x = lerp(52, 204, p);
  const crossed = x > 128;
  if (!crossed) {
    fill(ctx, P.cyan);
    ctx.beginPath();
    ctx.moveTo(x, 112);
    ctx.lineTo(x + 22, 128);
    ctx.lineTo(x, 144);
    ctx.lineTo(x - 22, 128);
    ctx.closePath();
    ctx.fill();
  } else {
    fill(ctx, P.violet);
    packet(ctx, x, 128, 28, 20, 4, "fill");
  }
  const flash = Math.abs(x - 128) < 10 ? 1 : 0.15;
  stroke(ctx, P.amber, 6, null, flash);
  line(ctx, 128, 40, 128, 216);
  fill(ctx, P.green);
  circle(ctx, x, 156, 6, "fill");
  stroke(ctx, P.green, 3);
  circle(ctx, x, 156, 6, "stroke");
}

export function agent_human_gate(ctx, t) {
  stroke(ctx, P.graphite, 5);
  polyline(ctx, [
    [36, 80],
    [64, 128],
    [36, 176],
  ]);
  fill(ctx, P.cyan);
  circle(ctx, 36, 80, 7, "fill");
  circle(ctx, 64, 128, 7, "fill");
  circle(ctx, 36, 176, 7, "fill");
  stroke(ctx, P.yellow, 8);
  line(ctx, 120, 48, 120, 208);
  line(ctx, 152, 48, 152, 208);
  line(ctx, 120, 48, 152, 48);
  line(ctx, 120, 208, 152, 208);
  stroke(ctx, P.gray, 4, [7, 8], 0.4 + 0.2 * Math.sin(t * 4));
  polyline(ctx, [
    [168, 96],
    [196, 128],
    [168, 160],
    [220, 128],
  ]);
}

export function agent_dependency_invalidation(ctx, t) {
  const src = [64, 72];
  const kids = [0, 1, 2, 3, 4, 5].map((i) => [48 + (i % 3) * 64, 150 + Math.floor(i / 3) * 44]);
  const rot = t < 0.35 ? 0 : lerp(0, Math.PI / 4, clamp01((t - 0.35) / 0.15));
  const broken = t > 0.5;
  ctx.save();
  ctx.translate(src[0], src[1]);
  ctx.rotate(rot);
  fill(ctx, broken ? P.amber : P.cyan);
  ctx.fillRect(-14, -14, 28, 28);
  stroke(ctx, P.graphite, 4);
  ctx.strokeRect(-14, -14, 28, 28);
  ctx.restore();
  for (let i = 0; i < kids.length; i++) {
    const [x, y] = kids[i];
    if (broken) {
      const restore = t > 0.78 && i % 2 === 0;
      stroke(ctx, P.red, 4, [5, 5], 0.7);
      const mx = (src[0] + x) / 2;
      const my = (src[1] + 14 + y) / 2;
      line(ctx, src[0], src[1] + 14, mx - 6, my);
      line(ctx, mx + 6, my, x, y - 10);
      if (restore) {
        fill(ctx, P.cyan, 0.8);
        circle(ctx, x, y, 8, "fill");
      } else {
        stroke(ctx, P.gray, 5);
        circle(ctx, x, y, 8, "stroke");
      }
    } else {
      stroke(ctx, P.graphite, 4);
      line(ctx, src[0], src[1] + 14, x, y - 10);
      fill(ctx, P.violet);
      circle(ctx, x, y, 8, "fill");
    }
  }
}

export function agent_commit_race(ctx, t) {
  stroke(ctx, P.graphite, 6);
  circle(ctx, 128, 128, 22, "stroke");
  const p = clamp01(t / 0.45);
  const a = lerp(48, 106, p);
  const b = lerp(48, 106, p);
  fill(ctx, P.cyan);
  packet(ctx, a, 128, 22, 14, 4, "fill");
  fill(ctx, P.violet);
  packet(ctx, 128, b, 14, 22, 4, "fill");
  if (t > 0.45) {
    fill(ctx, P.green);
    circle(ctx, 128, 128, 14, "fill");
    const back = clamp01((t - 0.55) / 0.35);
    const by = lerp(106, 48, back);
    fill(ctx, P.violet, 0.7);
    packet(ctx, 128, by, 14, 22, 4, "fill");
    if (t > 0.82) {
      const rx = lerp(128, 168, (t - 0.82) / 0.18);
      fill(ctx, P.violet);
      packet(ctx, rx, 168, 14, 22, 4, "fill");
    }
  }
}

export function agent_side_effect_uncertain(ctx, t) {
  const send = clamp01(t / 0.28);
  const px = lerp(70, 168, send);
  fill(ctx, t > 0.28 && Math.floor(t * 6) % 2 === 0 ? P.cyan : "rgba(0,0,0,0)");
  if (t <= 0.28 || Math.floor(t * 6) % 2 === 0) {
    fill(ctx, P.cyan, t > 0.28 ? 0.55 : 1);
    packet(ctx, 64, 128, 24, 16, 4, "fill");
  } else {
    stroke(ctx, P.cyan, 5);
    packet(ctx, 64, 128, 24, 16, 4, "stroke");
  }
  if (t < 0.35) {
    fill(ctx, P.cyan);
    packet(ctx, px, 128, 16, 12, 3, "fill");
  }
  stroke(ctx, P.graphite, 6);
  line(ctx, 108, 48, 108, 208);
  stroke(ctx, P.violet, 6);
  hexagon(ctx, 186, 128, 36);
  stroke(ctx, P.red, 8);
  line(ctx, 40, 168, 92, 168);
  line(ctx, 40, 168, 40, 158);
  line(ctx, 92, 168, 92, 158);
}

export function agent_lock_starve(ctx, t) {
  const ys = [72, 128, 184];
  stroke(ctx, P.red, 8);
  line(ctx, 168, 48, 168, 208);
  line(ctx, 188, 48, 188, 208);
  for (let i = 0; i < 3; i++) {
    stroke(ctx, P.graphite, 5);
    line(ctx, 28, ys[i], 160, ys[i]);
    const n = 2 + Math.floor(t * 3);
    for (let k = 0; k < n; k++) {
      fill(ctx, P.amber, 0.7);
      packet(ctx, 50 + k * 28, ys[i], 18, 12, 4, "fill");
    }
  }
}

export function agent_consensus_pending(ctx, t) {
  const nodes = [
    [128, 64],
    [68, 176],
    [188, 176],
  ];
  stroke(ctx, P.graphite, 5);
  polyline(ctx, [nodes[0], nodes[1], nodes[2]], true);
  fill(ctx, P.graphite);
  diamond(ctx, 128, 128, 16, "both");
  for (let i = 0; i < 3; i++) {
    fill(ctx, P.cyan);
    circle(ctx, nodes[i][0], nodes[i][1], 10, "fill");
  }
  fill(ctx, P.green);
  circle(ctx, 104, 112, 7, "fill");
  circle(ctx, 152, 148, 7, "fill");
  stroke(ctx, P.amber, 5, null, 0.6 + 0.4 * pingpong(t));
  circle(ctx, 152, 108, 7, "stroke");
}

function hexagon(ctx, x, y, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
  }
  polyline(ctx, pts, true);
}
