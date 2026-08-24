'use strict';

const H = require('../lib/helpers');
const {
  C, E, CX, CY, SIZE,
  layer, at, line, polyline, circle, arc, rect, ellipse, hexagon, diamond, triangle,
  arrow, chevron, xMark, check, hatch, wrench, hourglass, lock, flag, documentIcon, human,
  isoCube, text, glowCircle, lerp, clamp, mix, withAlpha, deg, hash, pingpong, u, poly,
} = H;

const SRC = 'Gemini';

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

function octagon(ctx, x, y, r, o = {}) {
  return poly(ctx, x, y, r, 8, Math.PI / 8, o);
}

function wedge(ctx, x, y, r, a0, a1, o = {}) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, r, a0, a1);
  ctx.closePath();
  if (o.fill) {
    ctx.fillStyle = o.fill;
    ctx.globalAlpha = o.alpha != null ? o.alpha : 1;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = o.stroke || C.white;
  ctx.lineWidth = o.width || 1.6;
  ctx.setLineDash(o.dash || []);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

const glyphs = [
  G('B4.01', 'AGT.SEC.POLICY_BLOCKED', 1800, (ctx, T) => {
    const { p, E: e } = T;
    let s = 1;
    if (p < 0.26) s = lerp(1.22, 0.7, e.expoIn(p / 0.26));
    else if (p < 0.4) s = 0.7;
    else if (p < 0.58) s = lerp(0.7, 0.92, e.elasticOut((p - 0.4) / 0.18));
    else s = 0.92;
    const inner = 13;
    const rs = [40, 29, 20].map((r) => Math.max(inner, r * s));
    rs.forEach((r, i) => {
      octagon(ctx, CX, CY, r, {
        stroke: C.white,
        width: i === 0 ? 2.6 : 1.8,
        fill: i === 2 ? withAlpha(C.white, 0.07) : null,
      });
    });
    octagon(ctx, CX, CY, inner, { stroke: C.white, width: 3 });
    for (let i = 0; i < 4; i++) {
      const a = deg(i * 90);
      const r0 = inner + 1.5;
      const r1 = 44 * s;
      line(ctx, CX + Math.cos(a) * r0, CY + Math.sin(a) * r0, CX + Math.cos(a) * r1, CY + Math.sin(a) * r1, {
        stroke: C.white,
        width: 3.4,
      });
    }
    if (p > 0.4 && p < 0.58) {
      const k = (p - 0.4) / 0.18;
      octagon(ctx, CX, CY, inner + k * 18, { stroke: withAlpha(C.white, 1 - k), width: 2 });
    }
  }),

  G('B4.02', 'AGT.MEM.CONFLICT', 1800, (ctx, T) => {
    const skew = Math.sin(T.p * Math.PI * 2) * deg(14);
    const gap = 9;
    const drawGrid = (rotA, col, off) => {
      at(ctx, CX, CY, rotA, () => {
        for (let i = -4; i <= 4; i++) {
          line(ctx, -36, i * gap + off, 36, i * gap + off, { stroke: col, width: 1.3 });
          line(ctx, i * gap + off, -36, i * gap + off, 36, { stroke: col, width: 1.3 });
        }
      });
    };
    ctx.save();
    ctx.beginPath();
    ctx.rect(24, 24, 80, 80);
    ctx.clip();
    drawGrid(deg(-8), withAlpha(C.white, 0.55), 0);
    drawGrid(skew, withAlpha(C.greyLight, 0.7), Math.sin(T.p * Math.PI * 4) * 2);
    const verts = [];
    for (let i = -3; i <= 3; i++) {
      for (let j = -3; j <= 3; j++) {
        const a = deg(-8);
        const b = skew;
        const x1 = CX + Math.cos(a) * i * gap - Math.sin(a) * j * gap;
        const y1 = CY + Math.sin(a) * i * gap + Math.cos(a) * j * gap;
        const x2 = CX + Math.cos(b) * i * gap - Math.sin(b) * j * gap;
        const y2 = CY + Math.sin(b) * i * gap + Math.cos(b) * j * gap;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const xorOn = ((i + j + Math.floor(T.p * 8)) & 1) === 0;
        verts.push({ mx, my, xorOn });
      }
    }
    verts.forEach(({ mx, my, xorOn }) => {
      rect(ctx, mx - 2, my - 2, 4, 4, {
        fill: xorOn ? C.white : C.bg,
        stroke: xorOn ? C.bg : C.white,
        width: 0.8,
      });
    });
    ctx.restore();
    rect(ctx, 24, 24, 80, 80, { stroke: C.grey, width: 1.4 });
  }),

  G('B4.03', 'AGT.EXEC.IRREVERSIBLE', 1800, (ctx, T) => {
    const bx = 86;
    polyline(ctx, [[22, 88], [40, 70], [56, 62], [72, 58], [bx, 56]], { stroke: C.white, width: 2.2 });
    line(ctx, bx, 22, bx, 108, { stroke: C.white, width: 3.4 });
    circle(ctx, bx, 56, 4.5, { fill: C.white, stroke: C.white });
    hatch(ctx, bx + 2, 22, 28, 86, { stroke: C.bg, gap: 3, width: 2, alpha: 1 });
    rect(ctx, bx + 1, 22, 28, 86, { fill: withAlpha(C.black, 0.72), stroke: null });
    const n = 7;
    for (let i = 0; i < n; i++) {
      const seed = (T.p + i / n) % 1;
      const k = E.quadIn(seed);
      const x = lerp(24, 118, k);
      const y = lerp(86, 56, clamp(k / 0.72)) + Math.sin(i * 1.7) * 3;
      if (x < bx) {
        const dash = i % 2 ? [2, 2] : null;
        circle(ctx, x, y, 2.2, { fill: C.white, stroke: null, alpha: 0.55 + 0.45 * k });
        if (dash) line(ctx, x - 4, y, x, y, { stroke: withAlpha(C.white, 0.4), width: 1, dash });
      }
    }
    arrow(ctx, 70, 56, bx - 6, 56, { stroke: C.white, width: 1.8, head: 6 });
  }),

  G('B4.04', 'AGT.RES.BUDGET_EXHAUSTED', 1800, (ctx, T) => {
    const n = 8;
    const extinct = T.p < 0.72 ? Math.floor((T.p / 0.72) * n) : n;
    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 - (i * Math.PI * 2) / n;
      const a1 = a0 - (Math.PI * 2) / n + 0.04;
      const gone = i < extinct;
      const fillAmt = gone ? 0 : 1 - i / n * 0.35;
      wedge(ctx, CX, CY, 34 - i * 0.4, a1, a0, {
        fill: gone ? null : withAlpha(C.white, 0.18 + fillAmt * 0.7),
        stroke: gone ? withAlpha(C.grey, 0.45) : C.white,
        width: 1.6,
      });
    }
    circle(ctx, CX, CY, 7, { stroke: C.white, fill: C.bg, width: 2 });
    const osc = T.p > 0.72 ? Math.sin((T.p - 0.72) * 40) * 0.8 : 0;
    circle(ctx, CX, CY, 38 + osc, { stroke: withAlpha(C.white, T.p > 0.72 ? 0.55 : 0.2), width: 1.4 });
    if (T.p > 0.72) {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + T.p * 2;
        circle(ctx, CX + Math.cos(a) * 42, CY + Math.sin(a) * 42, 0.9, {
          fill: withAlpha(C.white, 0.25 + 0.15 * hash(i)),
          stroke: null,
        });
      }
    }
  }),

  G('B4.05', 'AGT.HUMAN.REQUIRED', 1800, (ctx, T) => {
    const gapA = deg(-18);
    arc(ctx, CX - 6, CY, 30, deg(28), Math.PI * 2 + gapA, { stroke: C.cyan, width: 2.6 });
    const px = CX - 6 + Math.cos(gapA) * 30;
    const py = CY + Math.sin(gapA) * 30;
    const nx = CX - 6 + Math.cos(deg(28)) * 30;
    const ny = CY + Math.sin(deg(28)) * 30;
    circle(ctx, nx, ny, 3.2, { fill: C.cyan, stroke: C.cyan });
    at(ctx, px, py, gapA, () => {
      rect(ctx, 2, -7, 10, 14, { radius: 1, stroke: C.human, width: 2.2, fill: withAlpha(C.human, 0.18) });
      line(ctx, 12, -4, 18, -4, { stroke: C.human, width: 1.8 });
      line(ctx, 12, 4, 18, 4, { stroke: C.human, width: 1.8 });
    });
    const beat = (T.t % 1000) / 1000;
    const pulse = E.sineOut(beat);
    at(ctx, px, py, gapA, () => {
      const reach = 8 + pulse * 28;
      polyline(ctx, [[18, 0], [18 + reach, -reach * 0.55], [18 + reach, reach * 0.55]], {
        close: true,
        stroke: withAlpha(C.amber, 1 - pulse * 0.75),
        fill: withAlpha(C.amber, 0.12 * (1 - pulse)),
        width: 1.4,
      });
    });
    human(ctx, 36, 78, { scale: 0.55, stroke: C.human });
  }),

  G('B4.06', 'AGT.CONF.LOW', 1800, (ctx, T) => {
    const n = 5;
    const env = 42;
    ellipse(ctx, CX, CY, env + 2, env * 0.78, {
      stroke: C.amber,
      width: 2,
      fill: withAlpha(C.amber, 0.06),
    });
    const pulse = 0.5 + 0.5 * Math.sin(T.p * Math.PI * 2);
    hexagon(ctx, CX, CY, 6 + pulse * 1.2, { fill: C.grey, stroke: C.greyLight, width: 1.6 });
    for (let i = 0; i < n; i++) {
      const a = deg(-90 + i * 72);
      const lenA = 34;
      const x2 = CX + Math.cos(a) * lenA;
      const y2 = CY + Math.sin(a) * lenA;
      const mass = pulse;
      line(ctx, CX + Math.cos(a) * 8, CY + Math.sin(a) * 8, x2, y2, {
        stroke: C.greyLight,
        width: 1.6 + mass * 0.6,
      });
      const breathe = 4.2 + Math.sin(T.p * Math.PI * 2) * 0.7;
      circle(ctx, x2, y2, breathe, {
        stroke: C.greyLight,
        fill: withAlpha(C.grey, 0.25 + mass * 0.25),
        width: 1.8,
      });
      const pk = (T.p + i * 0) % 1;
      const dx = lerp(CX, x2, pk);
      const dy = lerp(CY, y2, pk);
      circle(ctx, dx, dy, 2, { fill: C.white, stroke: null, alpha: 0.7 });
    }
  }, { status: 'revised', concept: 'High entropy / uncertainty' }),

  G('B4.07', 'AGT.RESOURCE.BUDGET_EXCEEDED', 1800, (ctx, T) => {
    const pulse = 0.5 + 0.5 * Math.sin(T.p * Math.PI * 2 * 6);
    const expand = 2 + pulse * 4;
    const segs = [
      [34, 38, 60, 38],
      [68, 38, 94, 38],
      [94, 38, 94, 64],
      [94, 68, 94, 90],
      [94, 90, 64, 90],
      [60, 90, 34, 90],
      [34, 90, 34, 62],
      [34, 58, 34, 38],
    ];
    segs.forEach((s, i) => {
      const out = (i % 2 === 0 ? 1 : -1) * expand * 0.35;
      const nx = (i < 2 || (i > 3 && i < 6)) ? 0 : out;
      const ny = (i < 2 || (i > 3 && i < 6)) ? out : 0;
      const breached = i === 1 || i === 3 || i === 4;
      line(ctx, s[0] + nx, s[1] + ny, s[2] + nx, s[3] + ny, {
        stroke: breached ? C.bg : C.white,
        width: 2.4,
      });
      if (breached) {
        line(ctx, s[0] + nx, s[1] + ny, s[2] + nx, s[3] + ny, {
          stroke: C.white,
          width: 2.4,
          dash: [3, 2],
        });
      }
    });
    const vecs = [
      [94, 48, 118, 40],
      [88, 90, 108, 110],
      [50, 38, 44, 16],
    ];
    vecs.forEach(([x1, y1, x2, y2]) => {
      const k = 0.55 + 0.45 * pulse;
      arrow(ctx, x1, y1, lerp(x1, x2, k), lerp(y1, y2, k), { stroke: C.white, width: 2, head: 6 });
    });
    hatch(ctx, 40, 46, 48, 36, { stroke: withAlpha(C.white, 0.25), gap: 5, width: 1 });
  }),

  G('B4.08', 'AGT.GOAL.DRIFT', 1800, (ctx, T) => {
    const k = E.sineInOut(T.p);
    arrow(ctx, 24, 96, 104, 28, { stroke: withAlpha(C.white, 0.45), width: 2, head: 7 });
    const n = 18;
    const pts = [];
    for (let i = 0; i <= Math.floor(n * k); i++) {
      const t = i / n;
      const x = lerp(24, 108, t);
      const y = lerp(96, 28, t) + t * t * 36;
      pts.push([x, y]);
    }
    if (pts.length > 1) {
      for (let i = 1; i < pts.length; i++) {
        const t = i / n;
        line(ctx, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], {
          stroke: mix('#2A2E38', C.white, t),
          width: 2.2,
        });
      }
      const last = pts[pts.length - 1];
      triangle(ctx, last[0], last[1], 5, {
        fill: mix(C.grey, C.white, k),
        stroke: C.white,
        rot: Math.atan2(36, 40),
      });
    }
    circle(ctx, 24, 96, 3.5, { fill: C.white, stroke: C.white });
  }),

  G('B4.09', 'AGT.CONF.GROUNDING_UNVERIFIED', 1800, (ctx, T) => {
    const fy = Math.sin(T.p * Math.PI * 2) * 8;
    line(ctx, 18, 102, 110, 102, { stroke: withAlpha(C.grey, 0.35), width: 1.6, dash: [4, 4] });
    const mesh = [
      [CX, 36],
      [86, 50],
      [78, 74],
      [50, 74],
      [42, 50],
    ];
    const shifted = mesh.map(([x, y]) => [x, y + fy]);
    const flash = Math.floor(T.t / 140) % 7 === 0;
    polyline(ctx, shifted, {
      close: true,
      stroke: flash ? C.greyLight : C.grey,
      width: flash ? 2.4 : 1.8,
      fill: withAlpha(C.grey, 0.12),
    });
    line(ctx, shifted[0][0], shifted[0][1], shifted[2][0], shifted[2][1], { stroke: C.grey, width: 1.2 });
    line(ctx, shifted[0][0], shifted[0][1], shifted[3][0], shifted[3][1], { stroke: C.grey, width: 1.2 });
    line(ctx, shifted[1][0], shifted[1][1], shifted[4][0], shifted[4][1], { stroke: C.grey, width: 1.2 });
    shifted.forEach(([x, y], i) => circle(ctx, x, y, 2.4, { fill: C.grey, stroke: C.grey }));
    if (flash) {
      const a = shifted[1];
      const b = shifted[2];
      line(ctx, a[0], a[1], b[0], b[1], { stroke: C.white, width: 2.6 });
    }
  }),

  G('B4.10', 'AGT.CONSTRAINT.CONFLICT', 1800, (ctx, T) => {
    const shear = Math.sin(T.p * Math.PI * 2) * 6;
    arrow(ctx, 18, CY, 46, CY, { stroke: C.white, width: 2.4, head: 7 });
    arrow(ctx, 110, CY, 82, CY, { stroke: C.white, width: 2.4, head: 7 });
    arrow(ctx, CX, 18, CX, 40, { stroke: C.greyLight, width: 2, head: 6 });
    arrow(ctx, CX, 110, CX, 88, { stroke: C.greyLight, width: 2, head: 6 });
    at(ctx, CX + shear * 0.15, CY, 0, () => {
      ctx.transform(1, shear * 0.012, 0, 1, 0, 0);
      rect(ctx, -16, -16, 32, 32, { stroke: C.white, width: 2.4, fill: withAlpha(C.white, 0.06) });
      ctx.save();
      ctx.beginPath();
      ctx.rect(-16, -16, 32, 32);
      ctx.clip();
      const cells = 6;
      for (let r = 0; r < cells; r++) {
        for (let c = 0; c < cells; c++) {
          const on = (r + c) % 2 === 0;
          rect(ctx, -16 + c * (32 / cells), -16 + r * (32 / cells), 32 / cells, 32 / cells, {
            fill: on ? C.white : C.bg,
            stroke: null,
          });
        }
      }
      ctx.restore();
      rect(ctx, -16, -16, 32, 32, { stroke: C.white, width: 2 });
    });
  }),

  G('B4.11', 'AGT.HUMAN.WAIT', 1800, (ctx, T) => {
    const r = 30;
    circle(ctx, CX, CY, r, { stroke: C.slate, width: 2.4 });
    circle(ctx, CX, CY, r - 6, { stroke: withAlpha(C.slate, 0.35), width: 1.2 });
    const a = -Math.PI / 2 + T.p * Math.PI * 2;
    const tx = CX + Math.cos(a) * r;
    const ty = CY + Math.sin(a) * r;
    circle(ctx, tx, ty, 5, { fill: C.slate, stroke: C.greyLight, width: 1.4 });
    circle(ctx, CX, CY, 2.2, { fill: C.slate, stroke: null });
  }),

  G('B4.12', 'AGT.TOOL.SCHEMA_MISMATCH', 1800, (ctx, T) => {
    let d = 0;
    if (T.p < 0.38) d = E.quadIn(T.p / 0.38) * 14;
    else if (T.p < 0.55) d = 14 - E.elasticOut((T.p - 0.38) / 0.17) * 16;
    else d = lerp(-2, 0, (T.p - 0.55) / 0.45);
    const pins = [-12, 0, 12, 24];
    const sockets = [-16, -2, 14];
    at(ctx, CX, 40 - d, 0, () => {
      rect(ctx, -28, -14, 56, 18, { radius: 2, stroke: C.greyLight, width: 2 });
      pins.forEach((x, i) => {
        const unmatched = i === 3;
        line(ctx, x, 4, x, 16, { stroke: unmatched ? C.white : C.grey, width: unmatched ? 3 : 2.2 });
        circle(ctx, x, 16, 2.2, { fill: unmatched ? C.white : C.grey, stroke: unmatched ? C.white : C.grey });
      });
    });
    at(ctx, CX, 88 + d * 0.15, 0, () => {
      rect(ctx, -30, -6, 60, 22, { radius: 2, stroke: C.grey, width: 2 });
      sockets.forEach((x) => {
        rect(ctx, x - 4, -14, 8, 12, { radius: 1, stroke: C.grey, fill: C.bg, width: 1.6 });
      });
    });
    if (T.p > 0.38 && T.p < 0.7) {
      rect(ctx, CX + 20, 48, 10, 8, { stroke: C.white, width: 1.8, fill: withAlpha(C.white, 0.25) });
    }
  }),

  G('B4.13', 'AGT.CONSTRAINT.CONFLICT', 1800, (ctx, T) => {
    const bounce = Math.sin(T.p * Math.PI * 2);
    const strobe = Math.floor(T.t / 80) % 2;
    const planes = [
      { a: deg(8), o: bounce * 6, col: C.white },
      { a: deg(128), o: -bounce * 6, col: C.greyLight },
      { a: deg(248), o: bounce * 4, col: C.grey },
    ];
    planes.forEach((pl, i) => {
      const on = strobe === (i % 2);
      at(ctx, CX, CY, pl.a, () => {
        line(ctx, -52, pl.o, 52, pl.o, {
          stroke: on ? pl.col : withAlpha(pl.col, 0.25),
          width: on ? 3 : 1.6,
        });
      });
    });
    circle(ctx, CX, CY, 4, { stroke: withAlpha(C.white, 0.35), width: 1.2, dash: [2, 2] });
  }),

  G('B4.14', 'AGT.HANDOFF.OUT', 1800, (ctx, T) => {
    const k = T.p < 0.72 ? E.expoIn(T.p / 0.72) : 1;
    rect(ctx, 18, 28, 72, 72, { radius: 4, stroke: withAlpha(C.grey, 0.55), width: 1.6, dash: [4, 3] });
    const x = lerp(48, 132, k);
    const y = lerp(CY, 58, k);
    const trail = 18 + k * 22;
    for (let i = 4; i >= 1; i--) {
      const tx = x - i * (trail / 4) * (1 - k * 0.2);
      diamond(ctx, tx, y, 5 - i * 0.6, {
        stroke: withAlpha(C.white, 0.12 * i),
        fill: withAlpha(C.white, 0.05 * i),
        width: 1,
      });
    }
    if (x < 124) {
      at(ctx, x, y, deg(k * 12), () => {
        hexagon(ctx, 0, 0, 11, { stroke: mix(C.grey, C.white, k), fill: withAlpha(C.white, 0.12), width: 2 });
        line(ctx, -5, -3, 5, -3, { stroke: C.white, width: 1.2 });
        line(ctx, -5, 0, 4, 0, { stroke: C.white, width: 1.2 });
        line(ctx, -4, 3, 3, 3, { stroke: C.white, width: 1.2 });
      });
    }
    arrow(ctx, 86, 96, 114, 96, { stroke: mix(C.greyDark, C.white, k), width: 2, head: 6 });
  }),

  G('B4.15', 'AGT.PLAN.REVISE', 1800, (ctx, T) => {
    const p = T.p;
    const root = [CX, 28];
    circle(ctx, root[0], root[1], 4.5, { fill: C.white, stroke: C.white });
    const oldA = p < 0.28 ? 1 : p < 0.5 ? lerp(1, 0, (p - 0.28) / 0.22) : 0;
    const oldBranches = [[40, 58], [CX, 62], [90, 56]];
    ctx.save();
    ctx.globalAlpha = oldA;
    oldBranches.forEach(([x, y], i) => {
      line(ctx, root[0], root[1] + 5, x, y, { stroke: C.grey, width: 1.8 });
      circle(ctx, x, y, 4, { stroke: C.grey, fill: C.bg, width: 1.5 });
      if (i !== 1) {
        line(ctx, x, y, x + (i === 0 ? -10 : 10), y + 18, { stroke: C.grey, width: 1.4, dash: [2, 2] });
        circle(ctx, x + (i === 0 ? -10 : 10), y + 18, 3, { stroke: C.grey, width: 1.2 });
      }
    });
    if (p > 0.2 && p < 0.55) {
      hatch(ctx, 28, 48, 28, 32, { stroke: C.grey, gap: 3.5, width: 1, alpha: 0.7 });
      hatch(ctx, 78, 46, 26, 32, { stroke: C.grey, gap: 3.5, width: 1, alpha: 0.7 });
    }
    ctx.restore();
    const grow = p < 0.42 ? 0 : E.quadOut(clamp((p - 0.42) / 0.35));
    const buds = [[36, 70], [CX, 78], [94, 68]];
    buds.forEach(([x, y], i) => {
      const g = clamp(grow * 1.2 - i * 0.12);
      if (g <= 0) return;
      const mx = lerp(root[0], x, g);
      const my = lerp(root[1] + 6, y, g);
      line(ctx, root[0], root[1] + 5, mx, my, { stroke: C.white, width: 2.2 });
      if (g > 0.85) {
        circle(ctx, x, y, 4.5, { fill: C.white, stroke: C.white });
        const scan = ((p * 4 + i * 0.3) % 1);
        line(ctx, x - 8, y - 8 + scan * 16, x + 8, y - 8 + scan * 16, { stroke: withAlpha(C.white, 0.7), width: 1.2 });
      }
    });
  }),

  G('B4.16', 'AGT.RESULT.PARTIAL', 1800, (ctx, T) => {
    const known = 5;
    const total = 8;
    const resolving = T.p > 0.55 ? E.quadOut(clamp((T.p - 0.55) / 0.3)) : 0;
    circle(ctx, CX, CY, 34, { stroke: C.greyLight, width: 2 });
    for (let i = 0; i < total; i++) {
      const a0 = -Math.PI / 2 + (i * Math.PI * 2) / total;
      const a1 = a0 + (Math.PI * 2) / total;
      const isKnown = i < known || (i === known && resolving > 0.98);
      const mid = (a0 + a1) / 2;
      const bx = CX + Math.cos(mid) * 34;
      const by = CY + Math.sin(mid) * 34;
      if (i === known - 1 || i === known) {
        line(ctx, CX, CY, bx, by, { stroke: C.amber, width: 2 });
      } else {
        line(ctx, CX, CY, bx, by, { stroke: C.greyDark, width: 1 });
      }
      if (isKnown) {
        const lit = Math.floor(T.p * known) % known === i || (i === known && resolving > 0.98);
        const fillK = i === known ? resolving : 1;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.arc(CX, CY, 32, a0 + 0.02, lerp(a0, a1 - 0.02, fillK));
        ctx.closePath();
        ctx.fillStyle = withAlpha(C.teal, lit ? 0.7 : 0.35);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.arc(CX, CY, 32, a0 + 0.04, a1 - 0.04);
        ctx.closePath();
        ctx.clip();
        hatch(ctx, CX - 34, CY - 34, 68, 68, { stroke: C.grey, gap: 4, width: 1.1, alpha: 0.7 });
        ctx.restore();
        arc(ctx, CX, CY, 32, a0 + 0.04, a1 - 0.04, { stroke: C.grey, width: 1.4 });
      }
    }
    circle(ctx, CX, CY, 6, { fill: C.bg, stroke: C.greyLight, width: 1.6 });
  }, { status: 'revised', concept: 'Partial knowledge' }),

  G('B4.17', 'AGT.COORD.HANDOFF', 1800, (ctx, T) => {
    const ax = 50;
    const bx = 78;
    circle(ctx, ax, CY, 24, { stroke: C.cyan, width: 2.2 });
    circle(ctx, bx, CY, 24, { stroke: C.magenta, width: 2.2 });
    circle(ctx, CX, CY, 5, { fill: C.white, stroke: C.white });
    const n = 4;
    for (let i = 0; i < n; i++) {
      const ph = (T.p + i / n) % 1;
      let x;
      let y;
      let col;
      if (ph < 0.45) {
        const a = -Math.PI / 2 + (ph / 0.45) * Math.PI * 1.6;
        x = ax + Math.cos(a) * 24;
        y = CY + Math.sin(a) * 24;
        col = C.cyan;
      } else if (ph < 0.55) {
        const k = (ph - 0.45) / 0.1;
        x = lerp(CX - 4, CX + 4, k);
        y = CY;
        col = C.white;
      } else {
        const a = Math.PI / 2 + ((ph - 0.55) / 0.45) * Math.PI * 1.6;
        x = bx + Math.cos(a) * 24;
        y = CY + Math.sin(a) * 24;
        col = C.magenta;
      }
      circle(ctx, x, y, 3.2, { fill: col, stroke: col });
    }
  }),

  G('B4.18', 'AGT.MEMORY.CONFLICT', 1800, (ctx, T) => {
    const hit = 0.42;
    const win = 80 / 1800;
    let ax = 24;
    let bx = 104;
    let freeze = false;
    if (T.p < hit) {
      ax = lerp(24, 50, E.quadIn(T.p / hit));
      bx = lerp(104, 78, E.quadIn(clamp((T.p - win * 0.4) / hit)));
    } else {
      freeze = true;
      ax = 50;
      bx = 78;
    }
    const shake = freeze && T.p < hit + 0.12 ? Math.sin((T.p - hit) * 90) * 3 : 0;
    rect(ctx, CX - 12 + shake, CY - 12, 24, 24, { stroke: C.amber, width: 2.4, fill: withAlpha(C.amber, 0.1) });
    line(ctx, CX - 12 + shake, CY - 12, CX + 12 + shake, CY + 12, { stroke: C.amber, width: 2 });
    at(ctx, ax, CY, 0, () => {
      arrow(ctx, -16, 0, 10, 0, { stroke: C.greyLight, width: 2.2, head: 6 });
      rect(ctx, -10, -8, 8, 6, { fill: C.greyLight, stroke: null });
      circle(ctx, -6, -5, 1.4, { fill: C.bg, stroke: null });
    });
    at(ctx, bx, CY, 0, () => {
      arrow(ctx, 16, 0, -10, 0, { stroke: C.greyDark, width: 2.2, head: 6 });
      diamond(ctx, 6, -6, 4, { fill: C.greyDark, stroke: C.greyDark });
    });
  }, { status: 'revised', concept: 'Race / write conflict' }),

  G('B4.19', 'AGT.SPEC.AMBIGUOUS', 1800, (ctx, T) => {
    const cycle = T.p * 4;
    const forms = [
      (s, a) => circle(ctx, CX, CY, 22 * s, { stroke: withAlpha(C.white, a), width: 4, fill: withAlpha(C.white, a * 0.06) }),
      (s, a) => rect(ctx, CX - 20 * s, CY - 20 * s, 40 * s, 40 * s, { stroke: withAlpha(C.white, a), width: 4, fill: withAlpha(C.white, a * 0.06) }),
      (s, a) => triangle(ctx, CX, CY, 26 * s, { stroke: withAlpha(C.white, a), width: 4, fill: withAlpha(C.white, a * 0.06) }),
      (s, a) => diamond(ctx, CX, CY, 26 * s, { stroke: withAlpha(C.white, a), width: 4, fill: withAlpha(C.white, a * 0.06) }),
    ];
    forms.forEach((fn, i) => {
      const d = Math.abs(((cycle - i + 4) % 4) - 0.15);
      const a = clamp(1 - d * 0.55) * 0.55;
      const s = 0.92 + 0.08 * Math.sin((T.p + i * 0.2) * Math.PI * 2);
      fn(s, Math.max(0.12, a));
    });
  }),

  G('B4.20', 'AGT.CONF.HALLUCINATION_RISK', 1800, (ctx, T) => {
    const nodes = [
      [CX, 96, true],
      [44, 72, true],
      [84, 72, true],
      [32, 48, true],
      [56, 46, true],
      [96, 44, false],
      [24, 26, false],
      [70, 24, false],
      [108, 28, false],
    ];
    const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [3, 6], [4, 7], [2, 8]];
    edges.forEach(([a, b]) => {
      const na = nodes[a];
      const nb = nodes[b];
      const anchored = na[2] && nb[2];
      const vib = !nb[2] ? Math.sin(T.t / 18 + b) * 2.4 : 0;
      line(ctx, na[0], na[1], nb[0] + vib, nb[1] + vib * 0.4, {
        stroke: anchored ? C.greyLight : C.grey,
        width: anchored ? 2 : 1.5,
      });
      if (!nb[2]) {
        for (let i = 0; i < 4; i++) {
          const t = hash(i + b + Math.floor(T.t / 40));
          circle(ctx, lerp(na[0], nb[0], t) + vib, lerp(na[1], nb[1], t), 1.1, {
            fill: withAlpha(C.white, 0.45),
            stroke: null,
          });
        }
      }
    });
    nodes.forEach(([x, y, anchored], i) => {
      const vib = !anchored ? Math.sin(T.t / 16 + i) * 2.2 : 0;
      circle(ctx, x + vib, y + vib * 0.3, anchored ? 4 : 3.4, {
        fill: anchored ? C.grey : null,
        stroke: C.white,
        width: anchored ? 1.6 : 2,
      });
    });
  }),

  G('B4.21', 'AGT.SELF.CORRECT', 1800, (ctx, T) => {
    polyline(ctx, [[48, 28], [78, 48], [78, 80], [48, 100]], { stroke: C.amber, width: 2.2 });
    line(ctx, 78, 48, 78, 80, { stroke: C.amber, width: 2.2 });
    polyline(ctx, [[48, 28], [48, 100]], { stroke: C.amber, width: 1.2, dash: [3, 3] });
    const variants = [
      { y: 40, draw: (x, s) => circle(ctx, x, 40, 6 * s, { stroke: C.greyLight, width: 1.8 }) },
      { y: 56, draw: (x, s) => diamond(ctx, x, 56, 7 * s, { stroke: C.grey, width: 1.8 }) },
      { y: 72, draw: (x, s) => triangle(ctx, x, 72, 7 * s, { stroke: C.greyMid, width: 1.8 }) },
      { y: 88, draw: (x, s) => hexagon(ctx, x, 88, 6.5 * s, { stroke: C.greyDark, width: 1.8 }) },
    ];
    const k = E.sineInOut(T.p);
    variants.forEach((v, i) => {
      let x = 28;
      let s = 1;
      let y = v.y;
      if (k < 0.35) x = lerp(22, 48, k / 0.35);
      else if (k < 0.7) {
        const t = (k - 0.35) / 0.35;
        x = lerp(48, 78, t);
        y = lerp(v.y, 64, t);
        s = lerp(1, 0.55, t);
      } else {
        const t = (k - 0.7) / 0.3;
        x = lerp(78, 100, t);
        y = 64;
        s = lerp(0.55, 1, t);
      }
      if (k < 0.7) v.draw(x, s);
      else {
        rect(ctx, x - 7, y - 9, 14, 18, { radius: 1, stroke: C.teal, width: 2, fill: withAlpha(C.teal, 0.15) });
        circle(ctx, x, y, 2.2, { fill: C.teal, stroke: C.teal });
      }
    });
    if (k > 0.85) {
      rect(ctx, 93, 52, 16, 24, { radius: 2, stroke: C.teal, width: 2.4, fill: withAlpha(C.teal, 0.2) });
      circle(ctx, 101, 64, 3, { fill: C.teal, stroke: C.teal });
    }
  }, { status: 'revised', concept: 'Canonicalization / convergence' }),

  G('B4.22', 'AGT.CONTROL.LOOP', 1800, (ctx, T) => {
    const n = 6;
    const r = 32;
    const nodes = [];
    for (let i = 0; i < n; i++) {
      const a = deg(-90 + i * 60);
      nodes.push([CX + Math.cos(a) * r, CY + Math.sin(a) * r]);
    }
    for (let i = 0; i < n; i++) {
      const a = nodes[i];
      const b = nodes[(i + 1) % n];
      line(ctx, a[0], a[1], b[0], b[1], { stroke: C.greyLight, width: 2.2 });
    }
    const tok = T.p * n;
    const i0 = Math.floor(tok) % n;
    const i1 = (i0 + 1) % n;
    const f = tok - Math.floor(tok);
    const px = lerp(nodes[i0][0], nodes[i1][0], f);
    const py = lerp(nodes[i0][1], nodes[i1][1], f);
    circle(ctx, px, py, 4, { fill: C.white, stroke: C.white });
    nodes.forEach(([x, y], i) => {
      const flash = (Math.floor(tok + 0.08) % n) === i;
      circle(ctx, x, y, 5.5, {
        fill: flash ? C.white : withAlpha(C.grey, 0.35),
        stroke: C.white,
        width: 1.8,
      });
    });
  }),

  G('B4.23', 'AGT.TOOL.RATE_LIMITED', 1800, (ctx, T) => {
    polyline(ctx, [[40, 22], [88, 22], [70, 58], [88, 96], [40, 96], [58, 58]], {
      close: true,
      stroke: C.greyLight,
      width: 2.2,
    });
    const q = 6;
    for (let i = 0; i < q; i++) {
      const y = 28 + i * 5.2;
      rect(ctx, 48, y, 32 - i, 4, { fill: withAlpha(C.white, 0.35 + i * 0.08), stroke: C.white, width: 0.8 });
    }
    const tick = Math.floor(T.p * 6);
    const phase = (T.p * 6) % 1;
    if (phase < 0.35) {
      circle(ctx, CX, lerp(58, 92, phase / 0.35), 3.2, { fill: C.white, stroke: C.white });
    }
    for (let i = 0; i < 3; i++) {
      const on = tick % 3 === i;
      circle(ctx, 52 + i * 12, 104, 2.4, { fill: on ? C.white : null, stroke: C.white, width: 1.2 });
    }
  }),

  G('B4.24', 'AGT.MULTI.AGREEMENT_STATUS', 1800, (ctx, T) => {
    const n = 5;
    const r = 38;
    const quorum = 4;
    const arrived = Math.min(n, Math.floor(T.p * (n + 0.4)));
    const peers = [];
    for (let i = 0; i < n; i++) {
      const a = deg(-90 + i * 72);
      peers.push([CX + Math.cos(a) * r, CY + Math.sin(a) * r, i]);
    }
    const closed = arrived >= quorum;
    peers.forEach(([x, y], i) => {
      const ok = i < quorum && i < arrived;
      const dissent = i === n - 1;
      const col = ok ? C.teal : dissent && arrived >= quorum - 1 ? C.amber : C.grey;
      line(ctx, x, y, CX + (x - CX) * 0.22, CY + (y - CY) * 0.22, { stroke: col, width: ok || dissent ? 2.4 : 1.6 });
      circle(ctx, x, y, 6, { stroke: col, fill: ok ? withAlpha(C.teal, 0.35) : null, width: 2 });
    });
    const segs = closed ? 5 : Math.min(arrived, quorum);
    for (let i = 0; i < 5; i++) {
      const a0 = deg(-90 + i * 72);
      const a1 = a0 + deg(72) - 0.08;
      const on = i < segs || (closed && T.p > 0.72);
      if (on) arc(ctx, CX, CY, 14, a0, a1, { stroke: C.teal, width: 2.8 });
      else arc(ctx, CX, CY, 14, a0, a1, { stroke: withAlpha(C.grey, 0.4), width: 1.4 });
    }
    if (closed && T.p > 0.72) {
      circle(ctx, CX, CY, 14, { stroke: C.teal, width: 2.6 });
    }
    hexagon(ctx, CX, CY, 6, { fill: closed ? C.teal : C.grey, stroke: closed ? C.teal : C.grey });
  }, { status: 'revised', concept: 'Consensus' }),

  G('B4.25', 'AGT.CTX.OVERFLOW', 1800, (ctx, T) => {
    const capX = 96;
    line(ctx, 16, 44, capX, 44, { stroke: C.grey, width: 2 });
    line(ctx, 16, 84, capX, 84, { stroke: C.grey, width: 2 });
    line(ctx, 16, 44, 16, 84, { stroke: C.grey, width: 2 });
    line(ctx, capX, 40, capX, 88, { stroke: C.white, width: 3 });
    polyline(ctx, [[capX, 44], [capX + 8, 36], [capX, 40]], { stroke: C.white, width: 1.6 });
    const shift = T.p * 56;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, capX, SIZE);
    ctx.clip();
    for (let i = 0; i < 9; i++) {
      const x = 20 + i * 12 + shift * 0.35;
      rect(ctx, x, 52, 10, 24, { radius: 1, fill: withAlpha(C.white, 0.75), stroke: C.white, width: 1 });
    }
    ctx.restore();
    for (let i = 0; i < 4; i++) {
      const drop = E.quadIn((T.p + i * 0.12) % 1);
      const x = capX + 6 + i * 6;
      const y = lerp(56, 120, drop);
      if (y < 118) rect(ctx, x, y, 8, 10, { fill: withAlpha(C.white, 1 - drop), stroke: null });
    }
  }),

  G('B4.26', 'AGT.KNOWLEDGE.REFRESH', 1800, (ctx, T) => {
    const sources = [[24, 28], [104, 32], [28, 100]];
    const target = [78, 78];
    const resolve = E.sineInOut(clamp((T.p - 0.2) / 0.55));
    sources.forEach(([x, y], i) => {
      const spread = lerp(deg(16), 0, resolve);
      const a = Math.atan2(target[1] - y, target[0] - x);
      circle(ctx, x, y, 5, { stroke: C.grey, fill: withAlpha(C.grey, 0.3), width: 1.6 });
      if (resolve < 0.92) {
        polyline(ctx, [
          [x, y],
          [x + Math.cos(a - spread) * 36, y + Math.sin(a - spread) * 36],
          [x + Math.cos(a + spread) * 36, y + Math.sin(a + spread) * 36],
        ], { close: true, fill: withAlpha(C.amber, 0.12 * (1 - resolve)), stroke: withAlpha(C.amber, 0.6 * (1 - resolve)), width: 1 });
      }
      line(ctx, x, y, lerp(x, target[0], 0.92), lerp(y, target[1], 0.92), {
        stroke: resolve > 0.85 ? C.teal : C.grey,
        width: 1.8,
      });
    });
    const filled = resolve > 0.75;
    circle(ctx, target[0], target[1], 10, {
      stroke: filled ? C.teal : C.greyLight,
      fill: filled ? withAlpha(C.teal, 0.35) : null,
      width: 2.2,
    });
    if (filled) {
      circle(ctx, target[0], target[1], 3, { fill: C.teal, stroke: C.teal });
      const bar = E.quadOut(clamp((resolve - 0.75) / 0.25));
      line(ctx, target[0] - 8 * bar, target[1] + 16, target[0] + 8 * bar, target[1] + 16, {
        stroke: C.teal,
        width: 3,
      });
    }
  }, { status: 'revised', concept: 'Grounding / resolution' }),

  G('B4.27', 'AGT.TOOL.FAILURE', 1800, (ctx, T) => {
    line(ctx, 16, CY, 52, CY, { stroke: C.greyLight, width: 4 });
    line(ctx, 16, CY - 8, 52, CY - 8, { stroke: C.grey, width: 2 });
    line(ctx, 16, CY + 8, 52, CY + 8, { stroke: C.grey, width: 2 });
    line(ctx, 78, CY, 112, CY, { stroke: C.greyLight, width: 4 });
    line(ctx, 78, CY - 8, 112, CY - 8, { stroke: C.grey, width: 2 });
    line(ctx, 78, CY + 8, 112, CY + 8, { stroke: C.grey, width: 2 });
    polyline(ctx, [[52, CY - 10], [48, CY - 2], [54, CY + 4], [50, CY + 10]], { stroke: C.white, width: 2.2 });
    polyline(ctx, [[78, CY - 10], [84, CY - 3], [76, CY + 5], [80, CY + 10]], { stroke: C.white, width: 2.2 });
    const strobe = Math.floor(T.t / 90) % 2;
    line(ctx, 50, CY - 10, 50, CY + 10, { stroke: strobe ? C.white : withAlpha(C.white, 0.25), width: 2.4 });
    line(ctx, 80, CY - 10, 80, CY + 10, { stroke: !strobe ? C.white : withAlpha(C.white, 0.25), width: 2.4 });
    if (hash(Math.floor(T.t / 70)) > 0.45) {
      const n = 3 + Math.floor(hash(Math.floor(T.t / 50)) * 3);
      for (let i = 0; i < n; i++) {
        const y1 = CY - 8 + hash(i + 3) * 16;
        const y2 = CY - 8 + hash(i + 9) * 16;
        const midX = 64 + (hash(i + T.t) - 0.5) * 8;
        polyline(ctx, [[54, y1], [midX, (y1 + y2) / 2 + (hash(i) - 0.5) * 10], [76, y2]], {
          stroke: C.white,
          width: 1.4,
        });
      }
    }
  }),

  G('B4.28', 'AGT.CTX.OVERFLOW_RISK', 1800, (ctx, T) => {
    rect(ctx, 18, 52, 92, 24, { radius: 3, stroke: C.greyLight, width: 2 });
    const thresh = 86;
    const margin = lerp(18, 8, 0.5 + 0.5 * Math.sin(T.p * Math.PI * 2));
    const fillW = thresh - 22 + (18 - margin) * 0.4;
    rect(ctx, 22, 56, fillW, 16, { radius: 1, fill: withAlpha(C.white, 0.35), stroke: null });
    line(ctx, thresh, 48, thresh, 80, { stroke: C.white, width: 2.4 });
    const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(T.p * Math.PI * 2 * 6));
    rect(ctx, thresh, 56, Math.max(2, 106 - thresh - (18 - margin)), 16, {
      fill: withAlpha(C.white, pulse),
      stroke: null,
    });
    for (let i = 0; i < 8; i++) {
      line(ctx, 28 + i * 8, 56, 28 + i * 8, 72, { stroke: withAlpha(C.bg, 0.35), width: 1 });
    }
  }),

  G('B4.29', 'AGT.TOOL.FAIL', 1800, (ctx, T) => {
    const drop = T.p < 0.18 ? E.expoIn(T.p / 0.18) : 1;
    const y = lerp(48, 70, drop);
    at(ctx, CX, y, 0, () => {
      ctx.globalAlpha = 1;
      wrench(ctx, 0, 0, { rot: deg(-40), scale: 1.15, stroke: C.bg, width: 4.4 });
      wrench(ctx, 0, 0, { rot: deg(-40), scale: 1.15, stroke: C.white, width: 2.4, fill: C.white });
      line(ctx, -22, -18, 22, 18, { stroke: C.bg, width: 6 });
      line(ctx, -22, -18, 22, 18, { stroke: C.white, width: 3.2 });
    });
  }),
];

module.exports = glyphs;
