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
  node,
} from "./helpers.js";

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

export function agent_verification_fail(ctx, t) {
  const pts = [
    [70, 80],
    [128, 64],
    [186, 80],
    [96, 128],
    [160, 128],
    [128, 176],
  ];
  stroke(ctx, P.graphite, 5);
  line(ctx, 70, 80, 128, 64);
  line(ctx, 128, 64, 186, 80);
  line(ctx, 70, 80, 96, 128);
  line(ctx, 186, 80, 160, 128);
  const snap = clamp01((t - 0.25) / 0.2);
  if (snap < 1) {
    stroke(ctx, P.graphite, 5, null, 1 - snap);
    line(ctx, 160, 128, 128, 176);
  } else {
    stroke(ctx, P.red, 4, [5, 6], 0.7);
    line(ctx, 154, 136, 140, 150);
    line(ctx, 122, 164, 112, 176);
  }
  line(ctx, 96, 128, 128, 176);
  for (let i = 0; i < 5; i++) {
    fill(ctx, P.violet);
    circle(ctx, pts[i][0], pts[i][1], 7, "fill");
  }
  stroke(ctx, P.red, 6);
  xMark(ctx, 128, 176, 12);
}

export function agent_grounding_loss(ctx, t) {
  const left = [
    [56, 80],
    [88, 128],
    [56, 176],
    [108, 96],
    [108, 160],
  ];
  stroke(ctx, P.cyan, 5);
  line(ctx, 56, 80, 88, 128);
  line(ctx, 56, 176, 88, 128);
  line(ctx, 88, 128, 108, 96);
  line(ctx, 88, 128, 108, 160);
  for (const [x, y] of left) {
    fill(ctx, P.cyan);
    circle(ctx, x, y, 8, "fill");
  }
  const fade = clamp01((t - 0.15) / 0.7);
  const right = [
    [160, 72],
    [196, 108],
    [168, 148],
    [204, 180],
    [148, 188],
  ];
  const edges = [
    [108, 96, 160, 72],
    [108, 160, 168, 148],
    [160, 72, 196, 108],
    [196, 108, 204, 180],
    [168, 148, 148, 188],
  ];
  for (let i = 0; i < edges.length; i++) {
    const gone = fade > 0.2 + i * 0.15;
    stroke(ctx, gone ? P.gray : P.cyan, 4, gone ? [6, 7] : null, gone ? 0.4 : 0.9);
    line(ctx, edges[i][0], edges[i][1], edges[i][2], edges[i][3]);
  }
  for (let i = 0; i < right.length; i++) {
    const hollow = fade > 0.35 + i * 0.12;
    if (hollow) {
      stroke(ctx, P.magenta, 5, null, 0.85);
      circle(ctx, right[i][0], right[i][1], 8, "stroke");
    } else {
      fill(ctx, P.cyan);
      circle(ctx, right[i][0], right[i][1], 8, "fill");
    }
  }
}

export function agent_decision_entropy(ctx, t) {
  fill(ctx, P.amber);
  circle(ctx, 128, 128, 12, "fill");
  stroke(ctx, P.amber, 5);
  circle(ctx, 128, 128, 12, "stroke");
  stroke(ctx, P.graphite, 6);
  line(ctx, 28, 128, 112, 128);
  fill(ctx, P.graphite);
  circle(ctx, 36, 128, 7, "fill");
  const angs = [-0.9, -0.45, 0, 0.45, 0.9];
  for (let i = 0; i < 5; i++) {
    const a = angs[i];
    const x2 = 128 + Math.cos(a) * 96;
    const y2 = 128 + Math.sin(a) * 86;
    stroke(ctx, P.violet, 5, null, 0.75 + 0.15 * Math.sin(t * 6 + i));
    line(ctx, 140, 128, x2, y2);
    fill(ctx, P.violet, 0.85);
    circle(ctx, x2, y2, 8, "fill");
  }
}

export function agent_attention_drift(ctx, t) {
  stroke(ctx, P.graphite, 5);
  circle(ctx, 118, 128, 36, "stroke");
  line(ctx, 118, 86, 118, 76);
  line(ctx, 118, 170, 118, 180);
  line(ctx, 76, 128, 66, 128);
  line(ctx, 160, 128, 170, 128);
  const k = clamp01((t - 0.1) / 0.7);
  const ax = lerp(118, 186, k);
  const ay = lerp(128, 86, k);
  stroke(ctx, P.violet, 4, null, 0.35);
  polyline(ctx, [
    [118, 128],
    [lerp(118, ax, 0.5), lerp(128, ay, 0.35)],
    [ax, ay],
  ]);
  fill(ctx, P.violet, 0.9);
  circle(ctx, ax, ay, 16, "fill");
  stroke(ctx, P.violet, 4);
  circle(ctx, ax, ay, 16, "stroke");
}

export function agent_branch_rewind(ctx, t) {
  const cp = [96, 128];
  stroke(ctx, P.graphite, 6);
  line(ctx, 28, 128, cp[0], cp[1]);
  fill(ctx, P.graphite);
  diamond(ctx, cp[0], cp[1], 12, "both");
  const phase = t % 1;
  if (phase < 0.38) {
    const p = phase / 0.38;
    const x = lerp(112, 196, p);
    stroke(ctx, P.cyan, 6);
    line(ctx, 110, 128, x, 128);
    if (p > 0.85) {
      stroke(ctx, P.red, 6);
      xMark(ctx, 204, 128, 12);
    }
  } else if (phase < 0.58) {
    const p = (phase - 0.38) / 0.2;
    const x = lerp(196, 112, p);
    stroke(ctx, P.cyan, 6, null, 0.7);
    line(ctx, 110, 128, x, 128);
    stroke(ctx, P.red, 5, null, 1 - p);
    xMark(ctx, 204, 128, 12);
  } else {
    const p = (phase - 0.58) / 0.42;
    stroke(ctx, P.cyan, 6);
    const x = lerp(110, 190, p);
    const y = lerp(128, 72, p);
    line(ctx, 110, 128, x, y);
    fill(ctx, P.cyan);
    circle(ctx, x, y, 7, "fill");
  }
}

export function agent_call_cycle(ctx, t) {
  const n0 = [64, 80];
  const n1 = [160, 72];
  const n2 = [196, 148];
  const n3 = [96, 176];
  const nodes = [n0, n1, n2, n3];
  const progress = t;
  stroke(ctx, P.graphite, 5);
  polyline(ctx, [n0, n1, n2, n3], false);
  const closed = progress > 0.55;
  stroke(ctx, closed ? P.amber : P.graphite, closed ? 7 : 5, null, closed ? 0.7 + 0.3 * pingpong(t * 2) : 1);
  line(ctx, n3[0], n3[1], n1[0], n1[1]);
  for (let i = 0; i < nodes.length; i++) {
    const active = progress > i * 0.18;
    fill(ctx, active ? P.cyan : P.gray);
    circle(ctx, nodes[i][0], nodes[i][1], 9, "fill");
  }
  if (closed) {
    stroke(ctx, P.amber, 4, null, 0.8);
    circle(ctx, 148, 118, 44, "stroke");
  }
}

export function agent_goal_anchored(ctx, t) {
  const wobble = Math.sin(t * Math.PI * 2) * 1.5;
  stroke(ctx, P.graphite, 6);
  circle(ctx, 168, 128, 34, "stroke");
  line(ctx, 168, 88, 168, 78);
  line(ctx, 168, 168, 168, 178);
  line(ctx, 128, 128, 118, 128);
  line(ctx, 208, 128, 218, 128);
  stroke(ctx, P.green, 8);
  line(ctx, 86, 128, 134, 128 + wobble);
  fill(ctx, P.green);
  circle(ctx, 168, 128, 8, "fill");
  stroke(ctx, P.graphite, 6);
  fill(ctx, P.pale, 0.35);
  ctx.fillRect(32, 96, 54, 64);
  ctx.strokeRect(32, 96, 54, 64);
  stroke(ctx, P.graphite, 4);
  line(ctx, 42, 112, 74, 112);
  line(ctx, 42, 128, 68, 128);
  line(ctx, 42, 144, 72, 144);
}

export function agent_plan_divergence(ctx, t) {
  fill(ctx, P.graphite);
  circle(ctx, 56, 160, 9, "fill");
  stroke(ctx, P.green, 6);
  polyline(ctx, [
    [56, 160],
    [120, 120],
    [200, 88],
  ]);
  fill(ctx, P.green);
  circle(ctx, 200, 88, 8, "fill");
  stroke(ctx, P.amber, 6, [8, 7]);
  polyline(ctx, [
    [56, 160],
    [110, 176],
    [198, 200],
  ]);
  stroke(ctx, P.amber, 5, null, 0.9);
  circle(ctx, 198, 200, 8, "stroke");
  const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
  stroke(ctx, P.amber, 4, null, pulse);
  line(ctx, 124, 132, 132, 168);
}

export function agent_confidence_low(ctx, t) {
  const xs = [48, 96, 144, 192];
  for (let i = 0; i < 4; i++) {
    const a = 1 - i * 0.28;
    if (i < 2) {
      fill(ctx, P.violet, a);
      circle(ctx, xs[i], 128, 16 - i, "fill");
    } else if (i === 2) {
      fill(ctx, P.violet, 0.35 + 0.1 * Math.sin(t * 6));
      circle(ctx, xs[i], 128, 14, "fill");
      stroke(ctx, P.violet, 4, null, 0.6);
      circle(ctx, xs[i], 128, 14, "stroke");
    } else {
      stroke(ctx, P.violet, 5, null, 0.7);
      circle(ctx, xs[i], 128, 14, "stroke");
    }
    if (i < 3) {
      stroke(ctx, P.gray, 4, null, 0.5);
      line(ctx, xs[i] + 18, 128, xs[i + 1] - 16, 128);
    }
  }
}
