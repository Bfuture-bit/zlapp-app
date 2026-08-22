'use strict';

const H = require('../lib/helpers');
const {
  C, E, CX, CY, SIZE,
  layer, at, line, polyline, circle, arc, rect, ellipse, hexagon, diamond, triangle,
  arrow, chevron, xMark, check, hatch, wrench, hourglass, lock, flag, documentIcon, human,
  isoCube, text, glowCircle, lerp, clamp, mix, withAlpha, deg, hash, pingpong, u,
} = H;

const SRC = 'Sonnet';

function G(id, state, duration, draw, extra = {}) {
  return {
    id,
    state,
    source: SRC,
    status: extra.status || 'passed',
    duration,
    loop: extra.loop !== false,
    concept: extra.concept || null,
    draw: (ctx, tMs) => draw(ctx, u(tMs, duration)),
  };
}

function hexPts(x, y, r, rot0 = deg(-90)) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = rot0 + (i * Math.PI * 2) / 6;
    pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
  }
  return pts;
}

function clipHex(ctx, x, y, r) {
  const pts = hexPts(x, y, r);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < 6; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.clip();
  return pts;
}

function strokeHexBroken(ctx, x, y, r, gapEdge, gap, color, width) {
  const pts = hexPts(x, y, r);
  for (let i = 0; i < 6; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % 6];
    if (i === gapEdge && gap > 0.4) {
      const mx = (a[0] + b[0]) / 2;
      const my = (a[1] + b[1]) / 2;
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const lenA = Math.hypot(dx, dy) || 1;
      const gx = (dx / lenA) * gap * 0.5;
      const gy = (dy / lenA) * gap * 0.5;
      line(ctx, a[0], a[1], mx - gx, my - gy, { stroke: color, width });
      line(ctx, mx + gx, my + gy, b[0], b[1], { stroke: color, width });
    } else {
      line(ctx, a[0], a[1], b[0], b[1], { stroke: color, width });
    }
  }
  return pts;
}

function brackets(ctx, x, y, w, h, o = {}) {
  const t = o.stroke || C.grey;
  const lw = o.width || 1.8;
  const arm = o.arm || 8;
  polyline(ctx, [
    [x + arm, y],
    [x, y],
    [x, y + h],
    [x + arm, y + h],
  ], { stroke: t, width: lw });
  polyline(ctx, [
    [x + w - arm, y],
    [x + w, y],
    [x + w, y + h],
    [x + w - arm, y + h],
  ], { stroke: t, width: lw });
}

function goalDrift(ctx, T, scope) {
  const p = T.p;
  const k = E.quadIn(p);
  const ang = deg(6) + k * deg(34);
  const x0 = scope === 'plan' ? 36 : scope === 'task' ? 40 : 26;
  const y0 = CY + 6;
  const lenA = scope === 'plan' ? 48 : scope === 'task' ? 50 : 62;
  if (scope === 'task') {
    brackets(ctx, 34, 40, 70, 50, { stroke: C.greyMid, width: 1.7, arm: 6 });
  } else if (scope === 'plan') {
    brackets(ctx, 16, 18, 98, 92, { stroke: C.greyMid, width: 2.1, arm: 14 });
  }
  arrow(ctx, x0, y0, x0 + lenA, y0, { stroke: C.grey, width: 1.8, dash: [3, 3], head: 6 });
  const x2 = x0 + Math.cos(ang) * lenA;
  const y2 = y0 + Math.sin(ang) * lenA;
  arrow(ctx, x0, y0, x2, y2, { stroke: C.orangeDeep, width: 2.3, head: 7 });
}

function knowledgeCutoff(ctx, split) {
  const r = 30;
  circle(ctx, CX, CY, r, { stroke: C.greyLight, width: 2.2 });
  const dx = CX - r + 2 * r * split;
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, r - 0.6, 0, Math.PI * 2);
  ctx.clip();
  ctx.beginPath();
  ctx.rect(CX - r, CY - r, dx - (CX - r), r * 2);
  ctx.clip();
  hatch(ctx, CX - r, CY - r, r * 2, r * 2, { stroke: C.greyLight, gap: 4.2, width: 1.15 });
  ctx.restore();
  line(ctx, dx, CY - r, dx, CY + r, { stroke: C.white, width: 2.5 });
}

function rateLimited(ctx, T) {
  const x0 = 22;
  const y = 62;
  const w = 84;
  const h = 18;
  const capX = x0 + w * 0.82;
  const cycle = pingpong(T.p * 2);
  const press = cycle < 0.62
    ? E.sineOut(cycle / 0.62)
    : 1 - E.sineIn((cycle - 0.62) / 0.38) * 0.32;
  const fillW = lerp(8, capX - x0, 0.72 + 0.28 * press);
  rect(ctx, x0, y, w, h, { radius: 2, stroke: C.grey, width: 2 });
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0 + 2, y + 2, w - 4, h - 4);
  ctx.clip();
  rect(ctx, x0, y, fillW, h, { fill: withAlpha(C.greyLight, 0.55), stroke: null });
  ctx.restore();
  line(ctx, capX - 10, y - 12, capX + 10, y - 12, { stroke: C.greyLight, width: 3, cap: 'butt' });
  line(ctx, capX, y - 12, capX, y + h, { stroke: C.greyLight, width: 2.4 });
  line(ctx, capX - 7, y - 4, capX + 7, y - 4, { stroke: C.greyMid, width: 1.6 });
}

function policyBars(ctx, T, n) {
  const snap = T.p < 0.08 ? 0 : 1;
  rect(ctx, 34, 34, 60, 60, { radius: 2, stroke: C.greyLight, width: 2.4 });
  if (snap) {
    const thick = 5.5;
    if (n === 1) {
      rect(ctx, 22, CY - thick / 2, 84, thick, { fill: C.greyLight, stroke: C.greyLight });
    } else {
      rect(ctx, 22, CY - 10, 84, thick, { fill: C.greyLight, stroke: C.greyLight });
      rect(ctx, 22, CY + 5, 84, thick, { fill: C.greyLight, stroke: C.greyLight });
    }
  }
}

function pip(ctx, x, y, r, o = {}) {
  circle(ctx, x, y, r, { fill: o.fill || C.greyLight, stroke: o.stroke || o.fill || C.greyLight, width: 1 });
}

const glyphs = [
  G('B6.01', 'AGT.TOOL.FAIL', 1600, (ctx, T) => {
    const p = T.p;
    const intact = p < 0.04;
    const shaking = p >= 0.04 && p < 0.16;
    const gap = intact ? 0 : 8.5;
    const shake = shaking ? Math.sin((p - 0.04) * 90) * 2.6 : 0;
    const col = intact ? C.greyLight : C.steel;
    at(ctx, shake, shaking ? Math.cos((p - 0.04) * 70) * 1.4 : 0, 0, () => {
      const pts = strokeHexBroken(ctx, CX, CY, 30, 1, gap, col, 2.4);
      if (!intact) {
        const a = pts[1];
        const b = pts[2];
        const mx = (a[0] + b[0]) / 2;
        const my = (a[1] + b[1]) / 2;
        xMark(ctx, mx - 1, my + 1, 4.2, { stroke: col, width: 2 });
      }
    });
  }),

  G('B6.02', 'AGT.TOOL.SCHEMA', 1800, (ctx, T) => {
    hexagon(ctx, CX, CY, 36, { stroke: C.greyLight, width: 2.4 });
    const slots = [
      [-10, -10], [10, -10], [-10, 10],
    ];
    ctx.save();
    clipHex(ctx, CX, CY, 35);
    for (let i = -2; i <= 2; i++) {
      line(ctx, CX - 40, CY + i * 11, CX + 40, CY + i * 11, { stroke: withAlpha(C.grey, 0.4), width: 1 });
      line(ctx, CX + i * 11, CY - 40, CX + i * 11, CY + 40, { stroke: withAlpha(C.grey, 0.4), width: 1 });
    }
    ctx.restore();
    slots.forEach(([sx, sy]) => {
      rect(ctx, CX + sx - 6, CY + sy - 6, 12, 12, {
        radius: 1,
        fill: withAlpha(C.greyLight, 0.4),
        stroke: C.greyLight,
        width: 1.5,
      });
    });
    rect(ctx, CX + 10 - 6, CY + 10 - 6, 12, 12, {
      radius: 1,
      stroke: withAlpha(C.grey, 0.45),
      width: 1.2,
      dash: [2, 2],
    });
    const k = E.elasticOut(pingpong(T.p));
    const ox = lerp(16, 7, k);
    const oy = lerp(12, 5, k);
    rect(ctx, CX + 10 - 6 + ox, CY + 10 - 6 + oy, 12, 12, {
      radius: 1,
      fill: null,
      stroke: C.greyLight,
      width: 2,
    });
  }),

  G('B6.03', 'AGT.TOOL.RETRY', 1400, (ctx, T) => {
    const r = 26;
    const pts = hexagon(ctx, CX, CY, r, { stroke: C.greyLight, width: 2.2 });
    const corner = pts[1];
    const tickA = pts[0];
    const tickB = pts[1];
    const tx = (tickA[0] * 0.35 + tickB[0] * 0.65);
    const ty = (tickA[1] * 0.35 + tickB[1] * 0.65);
    const a0 = Math.atan2(ty - corner[1], tx - corner[0]);
    line(
      ctx,
      tx + Math.cos(a0) * 2,
      ty + Math.sin(a0) * 2,
      tx - Math.cos(a0) * 5,
      ty - Math.sin(a0) * 5,
      { stroke: C.greyLight, width: 2.2 }
    );
    const sweep = E.sineOut(T.p) * deg(270);
    const ar = 13;
    if (sweep > 0.04) {
      arc(ctx, corner[0], corner[1], ar, a0, a0 + sweep, { stroke: C.greyLight, width: 2.2 });
      const a = a0 + sweep;
      const hx = corner[0] + Math.cos(a) * ar;
      const hy = corner[1] + Math.sin(a) * ar;
      const tang = a + Math.PI / 2;
      arrow(
        ctx,
        hx - Math.cos(tang) * 6,
        hy - Math.sin(tang) * 6,
        hx + Math.cos(tang) * 1,
        hy + Math.sin(tang) * 1,
        { stroke: C.greyLight, width: 2, head: 6 }
      );
    }
  }),

  G('B6.04', 'AGT.ENV.UNREADY', 1600, (ctx, T) => {
    rect(ctx, 32, 32, 64, 64, {
      radius: 3,
      stroke: C.greyLight,
      width: 2.2,
      dash: [4, 6],
      dashOffset: -T.p * 40,
    });
  }),

  G('B6.05', 'AGT.CONF.LOW', 1600, (ctx, T) => {
    const conf = 0.33;
    const r = 28;
    const tremor = Math.sin(T.p * Math.PI * 2) * 2.2;
    const fillY = CY + r - r * 2 * conf + tremor;
    circle(ctx, CX, CY, r, { stroke: C.greyLight, width: 2.2 });
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, r - 1.2, 0, Math.PI * 2);
    ctx.clip();
    rect(ctx, CX - r, fillY, r * 2, CY + r - fillY + 2, {
      fill: withAlpha(C.greyLight, 0.22 + conf * 0.55),
      stroke: null,
    });
    ctx.restore();
    line(ctx, CX - 22, fillY, CX + 22, fillY, {
      stroke: withAlpha(C.greyLight, 0.35 + conf * 0.5),
      width: 1.8,
    });
  }),

  G('B6.06', 'AGT.HUMAN.GATE', 1800, (ctx, T) => {
    const p = T.p;
    const blocked = p < 0.58;
    const openK = blocked ? 0 : E.cubicInOut(clamp((p - 0.58) / 0.28));
    const rotA = openK * deg(45);
    const pulse = blocked ? 0.92 + 0.08 * Math.sin(p * Math.PI * 2 * 0.7) : 1;
    line(ctx, 16, CY, 112, CY, { stroke: C.grey, width: 2.2 });
    at(ctx, CX, CY, rotA, () => {
      ctx.scale(pulse, pulse);
      diamond(ctx, 0, 0, 18, {
        fill: openK > 0.55 ? null : withAlpha(C.greyLight, 0.85),
        stroke: C.greyLight,
        width: 2.4,
      });
    });
  }),

  G('B6.07', 'AGT.GOAL.DRIFT', 1800, (ctx, T) => {
    goalDrift(ctx, T, null);
  }),

  G('B6.08', 'AGT.RESULT.PARTIAL', 2000, (ctx, T) => {
    const n = 10;
    const start0 = deg(135);
    const total = deg(270);
    const progress = T.p < 0.78 ? E.quadOut(T.p / 0.78) * 0.67 : 0.67;
    const filled = Math.floor(progress * n + 1e-6);
    const fracA = progress * n - filled;
    const inner = 18;
    const outer = 32;
    for (let i = 0; i < n; i++) {
      const a0 = start0 + (i / n) * total + deg(2.4);
      const a1 = start0 + ((i + 1) / n) * total - deg(2.4);
      let stroke = C.grey;
      let width = 2;
      if (i < filled) {
        stroke = C.teal;
        width = 7;
      } else if (i === filled && fracA > 0.02) {
        stroke = C.amber;
        width = 7;
      }
      arc(ctx, CX, CY, (inner + outer) / 2, a0, a1, { stroke, width });
    }
    const z0 = start0;
    const z1 = start0 + total;
    const tick = (a) => {
      line(
        ctx,
        CX + Math.cos(a) * 14,
        CY + Math.sin(a) * 14,
        CX + Math.cos(a) * 36,
        CY + Math.sin(a) * 36,
        { stroke: C.greyLight, width: 2 }
      );
    };
    tick(z0);
    tick(z1);
    pip(ctx, CX + Math.cos(z0) * 25, CY + Math.sin(z0) * 25, 2.4, { fill: C.greyLight });
    pip(ctx, CX + Math.cos(z1) * 25, CY + Math.sin(z1) * 25, 2.4, { fill: C.greyLight });
    const pa = start0 + progress * total;
    line(
      ctx,
      CX + Math.cos(pa) * 12,
      CY + Math.sin(pa) * 12,
      CX + Math.cos(pa) * 38,
      CY + Math.sin(pa) * 38,
      { stroke: C.amber, width: 2 }
    );
    pip(ctx, CX + Math.cos(pa) * 38, CY + Math.sin(pa) * 38, 2.6, { fill: C.amber });
  }, { status: 'revised', concept: 'Progress fraction' }),

  G('B6.09', 'AGT.STATE.ROLLBACK', 1600, (ctx, T) => {
    const r = 28;
    const startA = deg(130);
    const endA = deg(-80);
    const k = T.p < 0.72 ? E.sineOut(T.p / 0.72) : 1;
    const a = lerp(startA, endA, k);
    circle(ctx, CX, CY, r, { stroke: withAlpha(C.grey, 0.35), width: 1.4 });
    arc(ctx, CX, CY, r, a, startA, { stroke: C.greyLight, width: 2.6, ccw: true });
    const tx = CX + Math.cos(endA) * r;
    const ty = CY + Math.sin(endA) * r;
    line(
      ctx,
      CX + Math.cos(endA) * (r - 6),
      CY + Math.sin(endA) * (r - 6),
      CX + Math.cos(endA) * (r + 7),
      CY + Math.sin(endA) * (r + 7),
      { stroke: C.greyLight, width: 2.6 }
    );
    const hx = CX + Math.cos(a) * r;
    const hy = CY + Math.sin(a) * r;
    const tang = a - Math.PI / 2;
    arrow(
      ctx,
      hx - Math.cos(tang) * 7,
      hy - Math.sin(tang) * 7,
      hx,
      hy,
      { stroke: C.greyLight, width: 2.2, head: 7 }
    );
    pip(ctx, tx, ty, 3, { fill: C.greyLight });
  }),

  G('B6.10', 'AGT.TOOL.RETRYING', 1600, (ctx, T) => {
    const r = 26;
    const pts = hexagon(ctx, CX, CY, r, { stroke: C.greyLight, width: 2.2 });
    const corner = pts[1];
    const ring = 13;
    circle(ctx, corner[0], corner[1], ring, { stroke: C.greyLight, width: 2 });
    const attempts = 3;
    for (let i = 0; i < attempts; i++) {
      const ta = deg(-90) + (i * Math.PI * 2) / 6;
      line(
        ctx,
        corner[0] + Math.cos(ta) * (ring + 2),
        corner[1] + Math.sin(ta) * (ring + 2),
        corner[0] + Math.cos(ta) * (ring + 7),
        corner[1] + Math.sin(ta) * (ring + 7),
        { stroke: C.greyMid, width: 1.8 }
      );
    }
    const rotA = T.p * Math.PI * 2;
    pip(
      ctx,
      corner[0] + Math.cos(rotA) * ring,
      corner[1] + Math.sin(rotA) * ring,
      3.2,
      { fill: C.greyLight }
    );
  }),

  G('B6.11', 'AGT.MEM.KNOWLEDGE_CUTOFF', 1600, (ctx) => {
    knowledgeCutoff(ctx, 0.42);
  }),

  G('B6.12', 'AGT.CTX.RATE_LIMITED', 1600, (ctx, T) => {
    rateLimited(ctx, T);
  }),

  G('B6.13', 'AGT.TASK.GOAL_DRIFT', 1800, (ctx, T) => {
    goalDrift(ctx, T, 'task');
  }),

  G('B6.14', 'AGT.HUMAN.INPUT_REQUIRED', 1200, (ctx, T) => {
    line(ctx, 16, CY, 112, CY, { stroke: C.grey, width: 2.2 });
    at(ctx, CX, CY, deg(45), () => {
      diamond(ctx, 0, 0, 18, { stroke: C.greyLight, width: 2.4 });
    });
    const on = Math.floor(T.p * 4) % 2 === 0;
    if (on) line(ctx, CX, CY - 8, CX, CY + 8, { stroke: C.white, width: 2.2 });
  }),

  G('B6.15', 'AGT.SAFETY.POLICY_BLOCKED', 1400, (ctx, T) => {
    policyBars(ctx, T, 1);
  }),

  G('B6.16', 'AGT.POLICY.BLOCKED', 1400, (ctx, T) => {
    policyBars(ctx, T, 2);
  }),

  G('B6.17', 'AGT.COORD.HANDOFF', 1800, (ctx, T) => {
    const ax = 30;
    const bx = 98;
    const y = CY;
    pip(ctx, ax, y, 6, { fill: C.greyLight });
    pip(ctx, bx, y, 6, { fill: C.greyLight });
    line(ctx, ax + 6, y, bx - 6, y, { stroke: C.grey, width: 2 });
    const k = T.p < 0.72 ? E.sineInOut(T.p / 0.72) : 1;
    const x = lerp(ax, bx, k);
    const merge = T.p < 0.72 ? 1 : clamp(1 - (T.p - 0.72) / 0.14);
    if (merge > 0.04) {
      pip(ctx, x, y, 4.2 * merge, { fill: C.white, stroke: C.white });
    }
  }),

  G('B6.18', 'AGT.PLAN.REVISED', 1800, (ctx, T) => {
    const p = T.p;
    const shared = [52, 52];
    const start = [24, 92];
    const oldEnd = [102, 32];
    const newEnd = [100, 96];
    line(ctx, start[0], start[1], shared[0], shared[1], { stroke: C.greyLight, width: 2.2 });
    pip(ctx, start[0], start[1], 3.5, { fill: C.greyLight });
    pip(ctx, shared[0], shared[1], 4, { fill: C.greyLight });
    const fade = p < 0.18 ? 1 : lerp(1, 0.22, E.sineOut(clamp((p - 0.18) / 0.5)));
    ctx.save();
    ctx.globalAlpha = fade;
    line(ctx, shared[0], shared[1], oldEnd[0], oldEnd[1], {
      stroke: C.grey,
      width: 2,
      dash: [4, 3],
    });
    ctx.restore();
    const grow = p < 0.12 ? 0 : E.sineIn(clamp((p - 0.12) / 0.55));
    if (grow > 0.02) {
      const nx = lerp(shared[0], newEnd[0], grow);
      const ny = lerp(shared[1], newEnd[1], grow);
      arrow(ctx, shared[0], shared[1], nx, ny, { stroke: C.greyLight, width: 2.3, head: 7 });
    }
  }),

  G('B6.19', 'AGT.CONTROL.LOOP', 1600, (ctx, T) => {
    const r = 28;
    circle(ctx, CX, CY, r, { stroke: C.greyMid, width: 1.6 });
    const a = T.p * Math.PI * 2 - Math.PI / 2;
    pip(ctx, CX + Math.cos(a) * r, CY + Math.sin(a) * r, 4, { fill: C.greyLight });
  }),

  G('B6.20', 'AGT.COORD.FANOUT', 1600, (ctx, T) => {
    const n = 5;
    const drawP = T.p < 0.55 ? E.sineOut(T.p / 0.55) : 1;
    pip(ctx, CX, CY, 5.5, { fill: C.greyLight });
    for (let i = 0; i < n; i++) {
      const a = deg(-90) + (i * Math.PI * 2) / n;
      const x2 = CX + Math.cos(a) * 34 * drawP;
      const y2 = CY + Math.sin(a) * 34 * drawP;
      if (drawP > 0.02) {
        line(ctx, CX + Math.cos(a) * 6, CY + Math.sin(a) * 6, x2, y2, { stroke: C.grey, width: 1.6 });
      }
      if (drawP > 0.92) pip(ctx, CX + Math.cos(a) * 38, CY + Math.sin(a) * 38, 4, { fill: C.greyLight });
    }
  }),

  G('B6.21', 'AGT.EXEC.SANDBOXED', 2000, (ctx, T) => {
    const breathe = 0.4 + 0.28 * Math.sin(T.p * Math.PI * 2);
    ctx.save();
    ctx.globalAlpha = breathe;
    rect(ctx, 26, 26, 76, 76, {
      radius: 6,
      stroke: C.greyLight,
      width: 1.8,
      dash: [5, 4],
    });
    ctx.restore();
    rect(ctx, 48, 48, 32, 32, {
      radius: 4,
      fill: withAlpha(C.greyLight, 0.7),
      stroke: C.greyLight,
      width: 1.8,
    });
  }),

  G('B6.22', 'AGT.REASON.LOOP', 2200, (ctx, T) => {
    const warpR = (a) => 26 + 4.8 * Math.sin(a * 2) + 3.1 * Math.sin(a * 3 + 0.6) + 1.8 * Math.sin(a * 5 + 1.1);
    const dotted = (a) => {
      const uA = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      return (uA > 0.55 && uA < 1.15) || (uA > 3.3 && uA < 3.95);
    };
    const n = 72;
    const solid = [];
    const degA = [];
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = warpR(a);
      const pt = [CX + Math.cos(a) * r, CY + Math.sin(a) * r];
      if (dotted(a)) {
        if (solid.length > 1) polyline(ctx, solid, { stroke: mix(C.teal, C.grey, 0.55), width: 2.1 });
        solid.length = 0;
        degA.push(pt);
      } else {
        if (degA.length > 1) polyline(ctx, degA, { stroke: C.amber, width: 2.1, dash: [3, 3] });
        degA.length = 0;
        solid.push(pt);
      }
    }
    if (solid.length > 1) polyline(ctx, solid, { stroke: mix(C.teal, C.grey, 0.55), width: 2.1 });
    if (degA.length > 1) polyline(ctx, degA, { stroke: C.amber, width: 2.1, dash: [3, 3] });
    let uA = T.p;
    uA += 0.045 * Math.sin(T.p * Math.PI * 9) + 0.03 * Math.sin(T.p * Math.PI * 5.3);
    if (T.p > 0.5 && T.p < 0.78) {
      const s = (T.p - 0.5) / 0.28;
      uA += 0.09 * Math.sin(s * Math.PI) * (s < 0.55 ? 1 : -0.35);
    }
    uA = ((uA % 1) + 1) % 1;
    const angA = uA * Math.PI * 2;
    const rr = warpR(angA);
    const overshoot = T.p > 0.52 && T.p < 0.7 ? 1.08 : 1;
    const alpha = dotted(angA) ? 0.28 : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    pip(
      ctx,
      CX + Math.cos(angA) * rr * overshoot,
      CY + Math.sin(angA) * rr * overshoot,
      4,
      { fill: dotted(angA) ? C.amber : mix(C.teal, C.grey, 0.4) }
    );
    ctx.restore();
  }, { status: 'revised', concept: 'Degraded / unstable loop' }),

  G('B6.23', 'AGT.EPIST.UNGROUNDED', 1800, (ctx, T) => {
    const segs = 14;
    for (let i = 0; i < segs; i++) {
      const drop = hash(i * 7 + Math.floor(T.t / (70 + hash(i + 2) * 140))) > 0.62;
      const a0 = (i / segs) * Math.PI * 2;
      const a1 = ((i + 0.62) / segs) * Math.PI * 2;
      arc(ctx, CX, CY, 28, a0, a1, {
        stroke: C.cool,
        width: 2.1,
        alpha: drop ? 0.12 : 0.95,
      });
    }
  }),

  G('B6.24', 'AGT.EPIST.KNOWLEDGE_CUTOFF', 1600, (ctx) => {
    knowledgeCutoff(ctx, 0.42);
  }),

  G('B6.25', 'AGT.COORD.DELEGATE', 1600, (ctx, T) => {
    const ax = 32;
    const bx = 96;
    const y = CY;
    const k = T.p < 0.62 ? E.sineInOut(T.p / 0.62) : 1;
    pip(ctx, ax, y, 6, { fill: C.greyLight });
    const halo = T.p < 0.2 ? E.sineOut(T.p / 0.2) : 1;
    circle(ctx, ax, y, 12, { stroke: withAlpha(C.greyLight, 0.35 + 0.5 * halo), width: 2.2 * halo });
    if (k > 0.02) {
      arrow(ctx, ax + 10, y, lerp(ax + 10, bx - 8, k), y, { stroke: C.greyLight, width: 2.1, head: 7 });
    }
    if (k > 0.85) pip(ctx, bx, y, 6, { fill: C.greyLight });
    else pip(ctx, bx, y, 5, { fill: withAlpha(C.greyLight, 0.45), stroke: C.greyLight });
  }),

  G('B6.26', 'AGT.COORD.DIVERGENCE', 2000, (ctx, T) => {
    const ox = 28;
    const oy = CY;
    const cone = deg(20);
    const coneLen = 76;
    const travel = E.sineOut(clamp(T.p / 0.9));
    const spread = E.quadIn(clamp(T.p));
    line(
      ctx,
      ox,
      oy,
      ox + Math.cos(-cone) * coneLen,
      oy + Math.sin(-cone) * coneLen,
      { stroke: C.grey, width: 1.5, dash: [4, 3] }
    );
    line(
      ctx,
      ox,
      oy,
      ox + Math.cos(cone) * coneLen,
      oy + Math.sin(cone) * coneLen,
      { stroke: C.grey, width: 1.5, dash: [4, 3] }
    );
    const branches = [
      { a0: deg(-7), a1: deg(-9), teal: true, len: 62 },
      { a0: deg(8), a1: deg(11), teal: true, len: 64 },
      { a0: deg(-34), a1: deg(-54), teal: false, len: 70 },
      { a0: deg(38), a1: deg(60), teal: false, len: 74 },
    ];
    pip(ctx, ox, oy, 5, { fill: C.greyLight });
    branches.forEach((b) => {
      const a = lerp(b.a0, b.a1, spread);
      const lenA = (b.len + (b.teal ? 0 : 16 * spread)) * Math.max(travel, 0.12);
      const x2 = ox + Math.cos(a) * lenA;
      const y2 = oy + Math.sin(a) * lenA;
      const col = b.teal ? C.teal : C.amber;
      arrow(ctx, ox + Math.cos(a) * 6, oy + Math.sin(a) * 6, x2, y2, { stroke: col, width: 2, head: 6 });
      if (travel > 0.4) pip(ctx, x2, y2, 3.6, { fill: col });
    });
  }, { status: 'revised', concept: 'Divergence / fan-out divergence' }),

  G('B6.27', 'AGT.PLAN.GOAL_DRIFT', 1800, (ctx, T) => {
    goalDrift(ctx, T, 'plan');
  }),

  G('B6.28', 'AGT.RES.RATE_LIMITED', 1600, (ctx, T) => {
    rateLimited(ctx, T);
  }),
];

module.exports = glyphs;
