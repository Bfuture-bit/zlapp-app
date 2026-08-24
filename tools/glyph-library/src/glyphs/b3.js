'use strict';

const H = require('../lib/helpers');
const {
  C, E, CX, CY, SIZE,
  layer, at, line, polyline, circle, arc, rect, ellipse, hexagon, diamond, triangle,
  arrow, chevron, xMark, check, hatch, wrench, hourglass, lock, flag, documentIcon, human,
  isoCube, text, glowCircle, lerp, clamp, mix, withAlpha, deg, hash, pingpong, u,
} = H;

const SRC = 'Sol';

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

function along(pts, t, closed) {
  const p = closed ? pts.concat([pts[0]]) : pts.slice();
  let total = 0;
  const segs = [];
  for (let i = 0; i < p.length - 1; i++) {
    const l = Math.hypot(p[i + 1][0] - p[i][0], p[i + 1][1] - p[i][1]);
    segs.push(l);
    total += l;
  }
  let d = (((t % 1) + 1) % 1) * (total || 1);
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] + 1e-6) {
      const f = d / (segs[i] || 1);
      return [lerp(p[i][0], p[i + 1][0], f), lerp(p[i][1], p[i + 1][1], f)];
    }
    d -= segs[i];
  }
  const last = p[p.length - 1];
  return [last[0], last[1]];
}

function packet(ctx, x, y, col, r) {
  circle(ctx, x, y, r == null ? 3.4 : r, { fill: col, stroke: C.white, width: 1 });
}

const glyphs = [
  G('B3.01', 'AGT.SCHEMA.MISMATCH', 1800, (ctx, T) => {
    const { p } = T;
    let gap;
    if (p < 0.28) gap = lerp(14, 2.2, E.quadIn(p / 0.28));
    else if (p < 0.42) gap = 2.2 + Math.sin(((p - 0.28) / 0.14) * Math.PI * 7) * 1.6;
    else gap = lerp(2.2, 14, E.sineOut((p - 0.42) / 0.58));
    const lx = 24;
    const rx = 58 + gap;
    rect(ctx, lx, 34, 36, 60, { radius: 2, stroke: C.teal, width: 2, fill: withAlpha(C.teal, 0.08) });
    for (let i = 0; i < 3; i++) {
      const y = 46 + i * 16;
      rect(ctx, lx + 32, y, 8, 8, { stroke: C.teal, fill: C.bg, width: 1.6 });
    }
    rect(ctx, rx, 34, 36, 60, { radius: 2, stroke: C.magenta, width: 2, fill: withAlpha(C.magenta, 0.08) });
    for (let i = 0; i < 3; i++) {
      const y = 50 + i * 16;
      triangle(ctx, rx + 2, y, 6.2, { stroke: C.magenta, fill: C.bg, width: 1.6, rot: Math.PI / 2 });
    }
    const seam = (lx + 36 + rx) / 2;
    line(ctx, seam, 38, seam, 90, { stroke: withAlpha(C.amber, 0.7), width: 1.6, dash: [2.5, 2] });
    diamond(ctx, seam, 64, 5.5, { stroke: C.amber, fill: withAlpha(C.amber, 0.4), width: 1.8 });
  }),

  G('B3.02', 'AGT.LOOP.DETECT', 2800, (ctx, T) => {
    const n = 6;
    const r = 28;
    const nodes = [];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      nodes.push([CX + Math.cos(a) * r, CY + Math.sin(a) * r]);
    }
    const locked = T.p > 0.8;
    polyline(ctx, nodes, { close: true, stroke: locked ? C.amber : C.grey, width: locked ? 2.8 : 2 });
    nodes.forEach(([x, y]) => {
      circle(ctx, x, y, 4.2, { stroke: C.greyLight, fill: C.greyDark, width: 1.6 });
    });
    const [dx, dy] = nodes[0];
    const dup = [dx + 9, dy - 9];
    circle(ctx, dup[0], dup[1], 4.4, { stroke: C.white, fill: C.slate, width: 1.8 });
    line(ctx, dx, dy, dup[0], dup[1], { stroke: withAlpha(C.white, 0.45), width: 1.2, dash: [2, 2] });
    const q = clamp(T.p / 0.8);
    const passes = q + q * q * 1.4;
    if (!locked) {
      const [tx, ty] = along(nodes, passes, true);
      packet(ctx, tx, ty, C.cyan, 3.6);
    }
    const nearDup = !locked && (passes % 1 < 0.08 || passes % 1 > 0.96);
    const flash = locked || nearDup;
    glowCircle(ctx, dup[0], dup[1], flash ? 11 : 5, C.yellow, flash ? 0.55 : 0.12);
    if (locked) circle(ctx, dup[0], dup[1], 4.4, { fill: C.yellow, stroke: C.white, width: 1.4 });
  }),

  G('B3.03', 'AGT.STATE.ROLLBACK', 2200, (ctx, T) => {
    const p = T.p;
    const hold = p > 0.78;
    const k = hold ? 1 : (p < 0.62 ? E.cubicInOut(p / 0.62) : 1);
    const frames = [
      { x: 34, y: 38, col: C.indigo, a: 0.35 },
      { x: 44, y: 48, col: C.teal, a: 0.7 },
      { x: 56, y: 60, col: C.cyan, a: 1 },
    ];
    const front = frames[2];
    front.x = lerp(56, 44, k);
    front.y = lerp(60, 48, k);
    front.a = lerp(1, 0.15, k);
    const midScale = lerp(1, 1.18, k);
    frames.forEach((f, i) => {
      const s = i === 1 ? midScale : 1;
      const w = 42 * (i === 2 ? lerp(1, 0.72, k) : s);
      const h = 30 * (i === 2 ? lerp(1, 0.72, k) : s);
      ctx.save();
      ctx.globalAlpha = f.a;
      rect(ctx, f.x, f.y, w, h, {
        radius: 3,
        stroke: f.col,
        fill: withAlpha(f.col, i === 1 && k > 0.5 ? 0.22 : 0.08),
        width: i === 1 ? 2.6 : 1.8,
      });
      for (let j = 0; j < 3; j++) {
        line(ctx, f.x + 6, f.y + 8 + j * 7, f.x + w - 6, f.y + 8 + j * 7, { stroke: f.col, width: 1.2 });
      }
      ctx.restore();
    });
    if (hold) glowCircle(ctx, 65, 63, 16, C.teal, 0.28);
  }),

  G('B3.04', 'AGT.HUMAN.REQUIRED', 2400, (ctx, T) => {
    const pts = [[22, 64], [40, 50], [40, 78], [58, 64]];
    line(ctx, 22, 64, 40, 50, { stroke: C.cyan, width: 1.8 });
    line(ctx, 22, 64, 40, 78, { stroke: C.cyan, width: 1.8 });
    line(ctx, 40, 50, 58, 64, { stroke: C.cyan, width: 1.8 });
    line(ctx, 40, 78, 58, 64, { stroke: C.cyan, width: 1.8 });
    pts.forEach(([x, y]) => circle(ctx, x, y, 4, { fill: C.cyan, stroke: C.cyan }));
    rect(ctx, 70, 28, 6, 72, { fill: C.slate, stroke: C.slate });
    diamond(ctx, 98, 64, 14, { stroke: C.human, fill: withAlpha(C.human, 0.15), width: 2.2 });
    human(ctx, 98, 66, { scale: 0.55, stroke: C.human });
    const pulseT = (T.p * 1.6) % 1;
    const px = lerp(22, 70, E.quadOut(pulseT));
    const py = 64 + Math.sin(pulseT * Math.PI) * (pulseT < 0.5 ? -8 : 8) * 0.25;
    if (pulseT < 0.92) packet(ctx, Math.min(px, 68), py, C.cyanBright, 3);
    const req = 0.5 + 0.5 * Math.sin(T.p * Math.PI * 2);
    glowCircle(ctx, 98, 64, 10 + req * 8, C.amber, 0.12 + req * 0.22);
    circle(ctx, 98, 64, 16 + req * 4, { stroke: withAlpha(C.amber, 0.45 + req * 0.4), width: 1.4, dash: [3, 3] });
  }),

  G('B3.05', 'AGT.EVIDENCE.CONFLICT', 2000, (ctx, T) => {
    const a = Math.sin(T.p * Math.PI * 2);
    const b = Math.sin(T.p * Math.PI * 2 + Math.PI);
    const pushA = 10 + a * 8;
    const pushB = 8 + b * 6;
    const ox = (a * 3.2 - b * 2.4);
    const oy = Math.sin(T.p * Math.PI * 4) * 2.2;
    diamond(ctx, CX + ox, CY + oy, 9, { stroke: C.white, fill: withAlpha(C.amber, 0.18), width: 2 });
    arrow(ctx, 22, 96, CX - 8 + ox, CY + 6 + oy - (10 - pushA) * 0.15, { stroke: C.cyan, width: 2.2, head: 7 });
    arrow(ctx, 106, 96, CX + 8 + ox, CY + 6 + oy - (8 - pushB) * 0.15, { stroke: C.orange, width: 2, head: 7 });
    arrow(ctx, CX, 18, CX + ox * 0.3, CY - 12 + oy, { stroke: C.violet, width: 1.6, head: 6 });
    circle(ctx, 22, 96, 4, { fill: C.cyan, stroke: C.cyan });
    circle(ctx, 106, 96, 4, { fill: C.orange, stroke: C.orange });
    circle(ctx, CX, 18, 3.5, { fill: C.violet, stroke: C.violet });
    line(ctx, 22, 96, CX + ox, CY + oy, { stroke: withAlpha(C.cyan, 0.25), width: 6, cap: 'round' });
    line(ctx, 106, 96, CX + ox, CY + oy, { stroke: withAlpha(C.orange, 0.22), width: 5, cap: 'round' });
  }),

  G('B3.06', 'AGT.LOOP.DETECT', 2800, (ctx, T) => {
    const nodes = [[64, 30], [96, 50], [88, 88], [40, 88], [32, 50]];
    const locked = T.p > 0.82;
    polyline(ctx, nodes, { close: true, stroke: locked ? C.gold : C.steel, width: locked ? 2.8 : 2 });
    nodes.forEach(([x, y], i) => {
      const sig = i === 2;
      rect(ctx, x - 5, y - 5, 10, 10, {
        radius: sig ? 1 : 4,
        stroke: C.greyLight,
        fill: sig ? C.grey : C.greyDark,
        width: 1.6,
      });
    });
    rect(ctx, 88 - 5 + 11, 88 - 5 - 10, 10, 10, { radius: 1, stroke: C.white, fill: C.slate, width: 1.8 });
    line(ctx, 88, 88, 94, 73, { stroke: withAlpha(C.white, 0.4), width: 1.2, dash: [2, 2] });
    const q = clamp(T.p / 0.82);
    const passes = q * 1.2 + q * q * 1.6;
    if (!locked) {
      const [tx, ty] = along(nodes, passes, true);
      packet(ctx, tx, ty, C.cyanBright, 3.4);
    }
    const flash = locked || (!locked && (passes % 1 > 0.38 && passes % 1 < 0.48));
    glowCircle(ctx, 94, 73, flash ? 10 : 4, C.yellow, flash ? 0.5 : 0.1);
  }),

  G('B3.07', 'AGT.PLAN.REVISED', 2500, (ctx, T) => {
    const p = T.p;
    circle(ctx, 24, 88, 5, { fill: C.grey, stroke: C.grey });
    rect(ctx, 50, 50, 12, 12, { stroke: C.grey, fill: C.greyDark, width: 1.6 });
    line(ctx, 24, 88, 56, 56, { stroke: C.greyLight, width: 2.2 });
    let oldA = 1;
    let oldLen = 1;
    let newLen = 0;
    if (p < 0.28) {
      oldA = 1;
    } else if (p < 0.42) {
      oldA = 1;
    } else if (p < 0.72) {
      const k = (p - 0.42) / 0.3;
      oldA = lerp(1, 0.28, k);
      oldLen = lerp(1, 0.12, E.quadIn(k));
      newLen = E.quadOut(k);
    } else {
      oldA = 0.28;
      oldLen = 0.12;
      newLen = 1;
    }
    const ox = lerp(56, 104, oldLen);
    const oy = lerp(56, 34, oldLen);
    ctx.save();
    ctx.globalAlpha = oldA;
    line(ctx, 56, 56, ox, oy, { stroke: C.grey, width: 1.6, dash: p > 0.3 ? [3, 3] : null });
    if (oldLen > 0.4) circle(ctx, 104, 34, 4.5, { stroke: C.grey, fill: null, width: 1.5 });
    ctx.restore();
    if (newLen > 0.04) {
      const nx = lerp(56, 100, newLen);
      const ny = lerp(56, 96, newLen);
      arrow(ctx, 56, 56, nx, ny, { stroke: C.electric, width: 2.2, head: 7 });
      if (newLen > 0.92) circle(ctx, 100, 96, 5, { fill: C.electric, stroke: C.electric });
    }
    let tracer = [24, 88];
    if (p < 0.28) tracer = [lerp(24, 56, p / 0.28), lerp(88, 56, p / 0.28)];
    else if (p < 0.42) tracer = [56, 56];
    else if (newLen > 0.08) tracer = [lerp(56, 100, newLen), lerp(56, 96, newLen)];
    else tracer = [56, 56];
    packet(ctx, tracer[0], tracer[1], C.amber, 3.5);
  }),

  G('B3.08', 'AGT.COORD.FANOUT', 2200, (ctx, T) => {
    const origin = [28, 64];
    const peers = [[96, 28], [108, 52], [108, 76], [96, 100]];
    hexagon(ctx, origin[0], origin[1], 9, { fill: withAlpha(C.indigo, 0.35), stroke: C.indigo, width: 2 });
    peers.forEach(([x, y], i) => {
      line(ctx, origin[0] + 8, origin[1], x - 6, y, { stroke: C.indigo, width: 2 - i * 0.1 });
      circle(ctx, x, y, 6, { stroke: mix(C.indigo, C.cyan, i / 3), fill: withAlpha(C.cyan, 0.12), width: 1.8 });
    });
    const p = T.p;
    if (p < 0.18) {
      packet(ctx, lerp(8, origin[0], p / 0.18), 64, C.cyan, 3.4);
    } else {
      const k = clamp((p - 0.18) / 0.4);
      peers.forEach(([x, y], i) => {
        const skew = i * 0.04;
        const t = clamp((k - skew) / 0.85);
        const px = lerp(origin[0], x, t);
        const py = lerp(origin[1], y, t);
        if (t < 1) packet(ctx, px, py, C.cyan, 3);
        else circle(ctx, x, y, 6.5, { stroke: C.cyan, fill: withAlpha(C.cyan, 0.35), width: 2 });
      });
      if (p > 0.62) {
        const ack = E.sineInOut(clamp((p - 0.62) / 0.3));
        peers.forEach(([x, y], i) => {
          const t = clamp(ack - i * 0.05);
          if (t > 0 && t < 1) {
            const ax = lerp(x, origin[0], t);
            const ay = lerp(y, origin[1], t);
            circle(ctx, ax, ay, 2, { fill: C.teal, stroke: null });
          }
        });
      }
    }
  }),

  G('B3.09', 'AGT.TOOL.FAIL', 1600, (ctx, T) => {
    const p = T.p;
    const deform = p > 0.22 && p < 0.4 ? Math.sin((p - 0.22) / 0.18 * Math.PI) * 3 : 0;
    const broken = p > 0.38;
    hexagon(ctx, 40, 64, 14 + deform * 0.3, { stroke: C.steel, fill: withAlpha(C.steel, 0.12), width: 2.2 });
    wrench(ctx, 40, 64, { rot: deg(-40), scale: 0.7, stroke: C.steel, width: 1.8 });
    const end = broken ? 78 : 104;
    line(ctx, 54, 64, end, 64, { stroke: broken ? withAlpha(C.red, 0.7) : C.grey, width: 2.2 });
    if (broken) {
      const flick = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(T.t / 40));
      line(ctx, 86, 60, 108, 52, { stroke: withAlpha(C.red, flick * 0.7), width: 1.8, dash: [2, 2] });
      polyline(ctx, [[78, 60], [84, 64], [78, 68]], { stroke: C.red, width: 2 });
      polyline(ctx, [[96, 48], [108, 44], [106, 56]], { stroke: withAlpha(C.red, 0.6), width: 1.4 });
      xMark(ctx, 92, 64, 5, { stroke: C.redBright, width: 2 });
    } else {
      circle(ctx, 108, 64, 5, { stroke: C.grey, width: 1.6 });
    }
    if (p < 0.38) {
      const t = p / 0.38;
      packet(ctx, lerp(18, 54, t), 64, C.cyan, 3.2);
    }
  }),

  G('B3.10', 'AGT.TOOL.RETRYING', 2400, (ctx, T) => {
    hexagon(ctx, CX, CY, 12, { stroke: C.steel, fill: withAlpha(C.steel, 0.1), width: 2 });
    wrench(ctx, CX, CY, { rot: deg(-40), scale: 0.65, stroke: C.steel, width: 1.8 });
    arc(ctx, CX, CY, 30, deg(-20), deg(220), { stroke: C.greyMid, width: 2 });
    for (let i = 0; i < 3; i++) {
      const a = deg(40 + i * 55);
      circle(ctx, CX + Math.cos(a) * 30, CY + Math.sin(a) * 30, 2.4, {
        fill: T.p * 3 > i ? C.amber : C.greyDark,
        stroke: T.p * 3 > i ? C.amber : C.grey,
        width: 1,
      });
    }
    const phase = T.p;
    let t;
    if (phase < 0.18) t = phase / 0.18 * 0.08;
    else if (phase < 0.28) t = 0.08;
    else if (phase < 0.55) t = 0.08 + ((phase - 0.28) / 0.27) * 0.7;
    else if (phase < 0.68) t = 0.78;
    else t = 0.78 + ((phase - 0.68) / 0.32) * 0.22;
    const a = deg(-20) + t * (deg(220) - deg(-20) + Math.PI * 0.55);
    const r = t < 0.12 ? lerp(0, 30, t / 0.12) : 30;
    const x = t < 0.12 ? lerp(CX, CX + 18, t / 0.12) : CX + Math.cos(a) * r;
    const y = t < 0.12 ? CY : CY + Math.sin(a) * r;
    const bright = 0.45 + 0.55 * (phase % 0.33) / 0.33;
    packet(ctx, x, y, mix(C.amber, C.cyan, bright), 3.3);
  }),

  G('B3.11', 'AGT.TOOL.AWAITING_RESULT', 2400, (ctx, T) => {
    hexagon(ctx, 32, 64, 13, { stroke: C.steel, fill: withAlpha(C.steel, 0.1), width: 2 });
    wrench(ctx, 32, 64, { rot: deg(-40), scale: 0.62, stroke: C.steel, width: 1.8 });
    line(ctx, 46, 64, 92, 64, { stroke: C.slate, width: 2, dash: [4, 3] });
    const breath = 0.5 + 0.5 * Math.sin(T.p * Math.PI * 2);
    ellipse(ctx, 104, 64, 10 + breath * 3.5, 8 + breath * 2.5, {
      stroke: C.cyan,
      fill: withAlpha(C.cyan, 0.08 + breath * 0.1),
      width: 1.8,
    });
    circle(ctx, 104, 64, 3.2, { stroke: C.cyan, fill: null, width: 1.5, dash: [1.5, 1.5] });
    let px = 46;
    if (T.p < 0.22) px = lerp(32, 78, T.p / 0.22);
    else px = 78;
    const py = 64 + Math.sin(T.p * Math.PI * 2) * (T.p > 0.22 ? 2.2 : 0);
    packet(ctx, px, py, C.cool, 3.2);
  }),

  G('B3.12', 'AGT.SCHEMA.MISMATCH', 1800, (ctx, T) => {
    const { p } = T;
    let gap;
    if (p < 0.28) gap = lerp(12, 2, E.quadIn(p / 0.28));
    else if (p < 0.42) gap = 2 + Math.sin(((p - 0.28) / 0.14) * Math.PI * 7) * 1.5;
    else gap = lerp(2, 12, E.sineOut((p - 0.42) / 0.58));
    const ty = 22;
    const by = 58 + gap;
    rect(ctx, 34, ty, 60, 34, { radius: 2, stroke: C.blue, width: 2, fill: withAlpha(C.blue, 0.08) });
    for (let i = 0; i < 3; i++) {
      const x = 48 + i * 16;
      rect(ctx, x, ty + 30, 8, 8, { stroke: C.blue, fill: C.bg, width: 1.5 });
    }
    rect(ctx, 34, by, 60, 34, { radius: 2, stroke: C.pink, width: 2, fill: withAlpha(C.pink, 0.08) });
    for (let i = 0; i < 3; i++) {
      const x = 52 + i * 16;
      triangle(ctx, x, by + 2, 6, { stroke: C.pink, fill: C.bg, width: 1.5, rot: 0 });
    }
    const seam = (ty + 34 + by) / 2;
    line(ctx, 38, seam, 90, seam, { stroke: withAlpha(C.amber, 0.75), width: 1.6, dash: [2.5, 2] });
    diamond(ctx, CX, seam, 5, { stroke: C.amber, fill: withAlpha(C.amber, 0.4), width: 1.8 });
  }),

  G('B3.13', 'AGT.SEC.INJECTION_SUSPECTED', 2000, (ctx, T) => {
    rect(ctx, 22, 44, 84, 40, { radius: 8, stroke: C.teal, width: 2.2 + (T.p > 0.35 && T.p < 0.55 ? 1.4 : 0), fill: withAlpha(C.teal, 0.06) });
    for (let i = 0; i < 4; i++) {
      line(ctx, 32 + i * 16, 54, 40 + i * 16, 74, { stroke: C.teal, width: 2 });
    }
    circle(ctx, 92, 64, 6, { fill: C.teal, stroke: C.teal });
    const probe = T.p % 0.22;
    const burst = Math.floor(T.p / 0.22);
    const depth = (hash(burst + 3) * 10 + 6) * (probe < 0.6 ? E.quadOut(probe / 0.6) : 1 - (probe - 0.6) / 0.4);
    const angA = deg(-55) + hash(burst) * 0.4;
    const wx = 58 + Math.cos(angA) * (18 + depth);
    const wy = 96 - Math.sin(angA) * (8 + depth * 0.4);
    polyline(ctx, [[70, 108], [wx, wy], [82, 108]], { close: true, stroke: C.red, fill: withAlpha(C.red, 0.25), width: 1.8 });
    if (T.p > 0.45) {
      const iso = E.quadOut(clamp((T.p - 0.45) / 0.2));
      rect(ctx, wx - 8 * iso, wy - 8 * iso, 16 * iso, 16 * iso, {
        stroke: C.amber,
        width: 1.6,
        dash: [2, 2],
      });
    }
  }),

  G('B3.14', 'AGT.SPEC.UNDERSPECIFIED', 2400, (ctx, T) => {
    polyline(ctx, [[32, 40], [96, 40], [96, 70]], { stroke: C.greyLight, width: 2.2 });
    line(ctx, 32, 40, 32, 88, { stroke: C.greyLight, width: 2.2 });
    line(ctx, 32, 88, 70, 88, { stroke: C.grey, width: 1.6, dash: [4, 3] });
    line(ctx, 96, 70, 96, 88, { stroke: C.grey, width: 1.6, dash: [4, 3] });
    const sockets = [[70, 88], [96, 88], [96, 70]];
    sockets.forEach(([x, y], i) => {
      const pulse = 0.45 + 0.55 * Math.sin(T.p * Math.PI * 2 + i * 1.3);
      circle(ctx, x, y, 4.5 + pulse * 1.2, { stroke: C.amber, fill: withAlpha(C.amber, 0.08 + pulse * 0.12), width: 1.8 });
    });
    const ghosts = [
      [[70, 88], [108, 108]],
      [[96, 88], [116, 70]],
      [[96, 70], [116, 40]],
    ];
    ghosts.forEach((g, i) => {
      const vis = 0.15 + 0.55 * Math.max(0, Math.sin(T.p * Math.PI * 2 + i * 2.1));
      ctx.save();
      ctx.globalAlpha = vis;
      line(ctx, g[0][0], g[0][1], g[1][0], g[1][1], { stroke: C.greyMid, width: 1.4, dash: [3, 3] });
      circle(ctx, g[1][0], g[1][1], 3, { stroke: C.greyMid, width: 1.2 });
      ctx.restore();
    });
  }),

  G('B3.15', 'AGT.SECURITY.INJECTION', 1800, (ctx, T) => {
    line(ctx, 16, 64, 112, 64, { stroke: C.teal, width: 3.2 });
    line(ctx, 70, 28, 70, 100, { stroke: C.greyLight, width: 2 });
    rect(ctx, 66, 28, 8, 72, { fill: withAlpha(C.greyLight, 0.12), stroke: null });
    circle(ctx, 96, 64, 8, { fill: withAlpha(C.teal, 0.25), stroke: C.teal, width: 2 });
    const p = T.p;
    const pen = p < 0.32 ? E.expoOut(p / 0.32) : 1;
    const clampK = p < 0.32 ? 0 : E.backOut(clamp((p - 0.32) / 0.28));
    const divert = p < 0.52 ? 0 : E.sineInOut(clamp((p - 0.52) / 0.35));
    const fx = lerp(18, 78, pen);
    const fy = lerp(108, 64, pen * 0.85) + divert * 28;
    const thick = 2.4 + pen * 1.2;
    ctx.beginPath();
    ctx.moveTo(22, 112);
    ctx.quadraticCurveTo(40, lerp(100, 70, pen), fx, fy);
    ctx.strokeStyle = C.magentaBright;
    ctx.lineWidth = thick;
    ctx.stroke();
    packet(ctx, fx, fy, C.magentaBright, 3.2);
    const c = 8 * clampK;
    polyline(ctx, [[70 - c, 52], [70 - 2, 64], [70 - c, 76]], { stroke: C.teal, width: 2.4 });
    polyline(ctx, [[70 + c, 52], [70 + 2, 64], [70 + c, 76]], { stroke: C.teal, width: 2.4 });
    if (divert > 0.2) {
      arrow(ctx, fx - 4, fy - 6, fx + 2, fy + 10, { stroke: C.magenta, width: 1.5, head: 5 });
    }
  }),

  G('B3.16', 'AGT.MODE.RESTRICTED', 2200, (ctx, T) => {
    const contract = 1 - 0.12 * (0.5 + 0.5 * Math.sin(T.p * Math.PI * 2));
    at(ctx, CX, CY, 0, () => {
      ctx.scale(contract, contract);
      rect(ctx, -38, -38, 76, 76, { radius: 8, stroke: withAlpha(C.slate, 0.7), width: 2, fill: withAlpha(C.slate, 0.06) });
    });
    const cells = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push([44 + c * 20, 44 + r * 20]);
    cells.forEach(([x, y], i) => {
      const allowed = !(i === 2 || i === 5 || i === 8);
      circle(ctx, x, y, 4, {
        stroke: allowed ? C.cyan : C.greyDark,
        fill: allowed ? withAlpha(C.cyan, 0.2) : null,
        width: 1.6,
      });
    });
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 2; c++) {
        const a = cells[r * 3 + c];
        const b = cells[r * 3 + c + 1];
        const cap = c === 1;
        line(ctx, a[0] + 5, a[1], b[0] - 5, b[1], { stroke: cap ? C.greyDark : C.cyan, width: cap ? 1.4 : 1.8 });
        if (cap) {
          line(ctx, b[0] - 6, b[1] - 6, b[0] - 6, b[1] + 6, { stroke: C.red, width: 2.2 });
        }
      }
    }
    const path = [cells[0], cells[1], cells[4], cells[3], cells[6], cells[7]];
    const [px, py] = along(path, T.p * 1.4, true);
    packet(ctx, px, py, C.cyan, 3);
  }),

  G('B3.17', 'AGT.TASK.PLAN_REVISED', 2600, (ctx, T) => {
    const p = T.p;
    const fold = p < 0.2 ? 0 : p < 0.55 ? E.sineInOut((p - 0.2) / 0.35) : 1;
    const grow = p < 0.28 ? 0 : E.quadOut(clamp((p - 0.28) / 0.5));
    diamond(ctx, 28, 64, 8, { fill: C.indigo, stroke: C.indigo });
    line(ctx, 36, 64, 58, 64, { stroke: C.indigo, width: 2.4 });
    circle(ctx, 58, 64, 5, { fill: C.indigo, stroke: C.indigo });
    const old = [[76, 40], [98, 32], [98, 52], [76, 88], [100, 96]];
    ctx.save();
    ctx.globalAlpha = lerp(0.85, 0.12, fold);
    old.forEach(([x, y], i) => {
      const ix = lerp(x, 58, fold * 0.7);
      const iy = lerp(y, 64, fold * 0.7);
      line(ctx, 58, 64, ix, iy, { stroke: C.grey, width: 1.4, dash: [3, 2] });
      circle(ctx, ix, iy, 3.5, { stroke: C.grey, width: 1.3 });
    });
    ctx.restore();
    const neu = [[78, 44], [102, 36], [102, 56], [80, 86], [104, 94]];
    neu.forEach(([x, y], i) => {
      const t = clamp(grow * 1.4 - i * 0.12);
      if (t <= 0) return;
      const nx = lerp(58, x, t);
      const ny = lerp(64, y, t);
      line(ctx, 58, 64, nx, ny, { stroke: C.electric, width: 2 });
      if (t > 0.85) circle(ctx, x, y, 4, { fill: C.electric, stroke: C.electric });
    });
  }),

  G('B3.18', 'AGT.EXEC.COMMIT', 2000, (ctx, T) => {
    const p = T.p;
    const crossed = p > 0.62;
    const dwell = p < 0.48 ? E.sineInOut(p / 0.48) * 0.72 : p < 0.62 ? lerp(0.72, 1, E.expoIn((p - 0.48) / 0.14)) : 1;
    line(ctx, 18, 64, 78, 64, { stroke: crossed ? C.commit : C.grey, width: crossed ? 3.2 : 2 });
    line(ctx, 78, 36, 78, 92, { stroke: C.white, width: 2.4 });
    if (!crossed) {
      const osc = Math.sin(T.t / 90) * 2;
      line(ctx, 18, 64 + osc * 0.15, 78, 64, { stroke: withAlpha(C.grey, 0.35), width: 1.4, dash: [3, 3] });
    } else {
      line(ctx, 78, 64, 110, 64, { stroke: C.commit, width: 3.2 });
      rect(ctx, 76, 34, 4, 60, { fill: C.commit, stroke: C.commit });
    }
    const px = lerp(22, 108, dwell);
    packet(ctx, Math.min(px, crossed ? 108 : 76), 64, crossed ? C.commit : C.amber, 3.6);
    if (p > 0.62 && p < 0.72) glowCircle(ctx, 78, 64, 18, C.commit, 0.4);
    if (crossed) check(ctx, 96, 48, 7, { stroke: C.greenGo, width: 2.2 });
  }),

  G('B3.19', 'AGT.TOOL.FAILED', 1800, (ctx, T) => {
    const p = T.p;
    circle(ctx, 24, 64, 5, { fill: C.grey, stroke: C.grey });
    line(ctx, 29, 64, 48, 64, { stroke: C.grey, width: 2 });
    hexagon(ctx, 58, 64, 12, { stroke: C.steel, fill: withAlpha(C.steel, 0.1), width: 2 });
    const coll = p < 0.22 ? 1 : p < 0.4 ? lerp(1, 0.05, E.quadIn((p - 0.22) / 0.18)) : 0.05;
    rect(ctx, 70, 64 - 5 * coll, 8 * Math.max(coll, 0.08), 10 * coll, {
      stroke: C.red,
      fill: withAlpha(C.red, 0.3),
      width: 1.6,
    });
    const shock = p > 0.4 && p < 0.72 ? E.sineOut((p - 0.4) / 0.32) : 0;
    if (p < 0.38) line(ctx, 78, 64, 108, 64, { stroke: withAlpha(C.grey, 1 - p / 0.38), width: 2, dash: [4, 3] });
    else {
      line(ctx, 86, 64, 110, 64, { stroke: withAlpha(C.grey, 0.25), width: 1.4, dash: [2, 3] });
      xMark(ctx, 82, 64, 4, { stroke: C.red, width: 1.8 });
    }
    if (p < 0.22) packet(ctx, lerp(24, 58, p / 0.22), 64, C.cyan, 3);
    if (shock > 0) {
      const sx = lerp(58, 24, shock);
      glowCircle(ctx, sx, 64, 8, C.red, 0.35);
      circle(ctx, 24, 64, 5 + shock * 6, { stroke: withAlpha(C.red, 1 - shock), width: 1.6 });
    }
  }),

  G('B3.20', 'AGT.SECURITY.INJECTION', 1800, (ctx, T) => {
    circle(ctx, CX, CY, 22, { stroke: C.teal, width: 2.4, fill: withAlpha(C.teal, 0.08) });
    circle(ctx, CX, CY, 7, { fill: C.teal, stroke: C.teal });
    circle(ctx, CX, CY, 36, { stroke: C.greyLight, width: 1.8 });
    const p = T.p;
    const pen = p < 0.3 ? E.expoOut(p / 0.3) : 1;
    const clampK = p < 0.3 ? 0 : E.backOut(clamp((p - 0.3) / 0.28));
    const divert = p < 0.5 ? 0 : E.sineInOut(clamp((p - 0.5) / 0.35));
    const a = deg(130);
    const r0 = 58;
    const r1 = lerp(58, 18, pen) + divert * 16;
    const ang2 = a + divert * 0.9;
    const x = CX + Math.cos(ang2) * r1;
    const y = CY + Math.sin(ang2) * r1;
    line(ctx, CX + Math.cos(a) * r0, CY + Math.sin(a) * r0, x, y, { stroke: C.magentaBright, width: 2.6 + pen });
    packet(ctx, x, y, C.magentaBright, 3.2);
    at(ctx, CX, CY, a, () => {
      const c = 6 + clampK * 10;
      polyline(ctx, [[22, -c], [26, 0], [22, c]], { stroke: C.teal, width: 2.4 });
      polyline(ctx, [[32, -c], [28, 0], [32, c]], { stroke: C.teal, width: 2.4 });
    });
  }),

  G('B3.21', 'AGT.PLAN.ACTIVE', 2800, (ctx, T) => {
    const steps = [18, 38, 58, 78, 98];
    const y = 58;
    const w = 16;
    const h = 22;
    const p = T.p;
    let current = 2;
    let filled = 2;
    let cursorX = steps[1] + w / 2;
    let pulse = 0;
    if (p < 0.18) {
      cursorX = lerp(steps[1] + w / 2, steps[2] + w / 2, E.sineInOut(p / 0.18));
      current = 2;
      filled = 2;
    } else if (p < 0.52) {
      current = 2;
      filled = 2;
      cursorX = steps[2] + w / 2;
      const local = (p - 0.18) / 0.34;
      pulse = local < 0.45 ? Math.sin(local / 0.45 * Math.PI) : local < 0.9 ? Math.sin((local - 0.45) / 0.45 * Math.PI) : 0;
    } else if (p < 0.64) {
      current = 2;
      filled = 2 + E.quadOut((p - 0.52) / 0.12);
      cursorX = steps[2] + w / 2;
    } else if (p < 0.8) {
      filled = 3;
      current = 3;
      cursorX = lerp(steps[2] + w / 2, steps[3] + w / 2, E.sineInOut((p - 0.64) / 0.16));
    } else {
      filled = 3;
      current = 3;
      cursorX = steps[3] + w / 2;
      const local = (p - 0.8) / 0.2;
      pulse = Math.sin(local * Math.PI);
    }
    for (let i = 0; i < 5; i++) {
      const x = steps[i];
      const done = i < Math.floor(filled);
      const isCur = i === current;
      const col = done ? C.teal : isCur ? C.amber : C.grey;
      rect(ctx, x, y, w, h, {
        radius: 2,
        stroke: col,
        fill: done ? withAlpha(C.teal, 0.35) : isCur ? withAlpha(C.amber, 0.12 + pulse * 0.2) : null,
        width: isCur ? 2.6 : 1.8,
      });
      if (isCur) rect(ctx, x - 2, y - 2, w + 4, h + 4, { radius: 3, stroke: C.amber, width: 1.3 });
      if (done) check(ctx, x + w / 2, y + h / 2 + 1, 5, { stroke: C.teal, width: 1.8 });
      if (i < 4) arrow(ctx, x + w + 1, y + h / 2, steps[i + 1] - 1, y + h / 2, { stroke: C.greyDark, width: 1.3, head: 4 });
    }
    arrow(ctx, cursorX, y - 14, cursorX, y - 3, { stroke: C.amber, width: 2, head: 5 });
    circle(ctx, cursorX, y + h / 2, 3 + pulse * 2, { fill: C.amber, stroke: C.white, width: 1 });
  }, { status: 'revised', concept: 'Plan / workflow progress' }),

  G('B3.22', 'AGT.TOOL.THROTTLED', 2200, (ctx, T) => {
    line(ctx, 16, 64, 52, 64, { stroke: C.grey, width: 6, cap: 'butt' });
    line(ctx, 76, 64, 114, 64, { stroke: C.grey, width: 6, cap: 'butt' });
    rect(ctx, 52, 48, 24, 32, { stroke: C.slate, fill: withAlpha(C.slate, 0.12), width: 2 });
    line(ctx, 64, 50, 64, 78, { stroke: C.amber, width: 2.4 });
    const n = 5;
    const released = Math.floor(T.p * 4);
    for (let i = 0; i < n; i++) {
      const queued = i >= released;
      const slot = queued ? i - released : i;
      const compress = 1 - Math.min(released, 3) * 0.08;
      if (queued) {
        const x = 46 - slot * (9 * compress);
        ellipse(ctx, x, 64, 5, 4, { fill: C.cyan, stroke: C.cyan });
      }
    }
    const gateOpen = (T.p * 4) % 1;
    if (gateOpen < 0.35) {
      const t = gateOpen / 0.35;
      packet(ctx, lerp(64, 108, t), 64, C.cyan, 3.4);
    }
    rect(ctx, 58, 52, 12, lerp(0, 8, 0.5 + 0.5 * Math.sin(T.p * Math.PI * 8)), {
      fill: withAlpha(C.amber, 0.35),
      stroke: null,
    });
  }),

  G('B3.23', 'AGT.GOAL.DRIFT', 2400, (ctx, T) => {
    const origin = [24, 96];
    circle(ctx, origin[0], origin[1], 4.5, { fill: C.greyLight, stroke: C.greyLight });
    arrow(ctx, origin[0], origin[1], 108, 36, { stroke: withAlpha(C.teal, 0.55), width: 1.8, head: 7 });
    line(ctx, origin[0], origin[1], 108, 36, { stroke: withAlpha(C.teal, 0.35), width: 1.4, dash: [3, 3] });
    const drift = E.sineInOut(T.p);
    const corr = Math.max(0, Math.sin(T.p * Math.PI * 6)) * 0.18;
    const angA = deg(-38) + drift * deg(28) - corr * deg(10);
    const lenA = 86;
    const ex = origin[0] + Math.cos(angA) * lenA;
    const ey = origin[1] + Math.sin(angA) * lenA;
    ctx.beginPath();
    ctx.moveTo(origin[0], origin[1]);
    ctx.quadraticCurveTo(50 + drift * 18, 70 - drift * 8, ex, ey);
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([]);
    ctx.stroke();
    triangle(ctx, ex, ey, 6, { fill: C.orange, stroke: C.orange, rot: angA });
    if (corr > 0.08) {
      arrow(ctx, ex, ey, ex - Math.cos(angA - 0.9) * 12, ey - Math.sin(angA - 0.9) * 12, {
        stroke: withAlpha(C.teal, corr * 3),
        width: 1.5,
        head: 4,
      });
    }
  }),

  G('B3.24', 'AGT.KNOW.CUTOFF', 2400, (ctx, T) => {
    line(ctx, 16, 72, 78, 72, { stroke: C.greyLight, width: 2.2 });
    line(ctx, 78, 28, 78, 104, { stroke: C.white, width: 2.4 });
    for (let i = 0; i < 5; i++) {
      const x = 22 + i * 12;
      line(ctx, x, 68, x, 76, { stroke: C.grey, width: 1.6 });
      circle(ctx, x, 56 - (i % 2) * 8, 3 + (i % 3), { fill: withAlpha(C.cool, 0.35), stroke: C.cool, width: 1.3 });
    }
    const pulse = (T.p * 2.2) % 1;
    const px = lerp(20, 78, E.quadOut(pulse));
    if (pulse < 0.98) packet(ctx, px, 72, C.cool, 3);
    hatch(ctx, 80, 40, 32, 48, { stroke: withAlpha(C.grey, 0.35), gap: 5, width: 1 });
    for (let i = 0; i < 4; i++) {
      const g = 0.12 + 0.35 * Math.max(0, Math.sin(T.p * Math.PI * 2 + i * 0.9));
      ctx.save();
      ctx.globalAlpha = g;
      rect(ctx, 84 + (i % 2) * 14, 46 + Math.floor(i / 2) * 22, 12, 16, {
        radius: 2,
        stroke: C.greyMid,
        width: 1.3,
        dash: [2, 2],
      });
      ctx.restore();
    }
    text(ctx, '?', 108, 32, { size: 11, fill: withAlpha(C.grey, 0.5 + 0.3 * Math.sin(T.p * 8)) });
  }),

  G('B3.25', 'AGT.COORD.HANDOFF', 2200, (ctx, T) => {
    const p = T.p;
    hexagon(ctx, 32, 64, 14, { stroke: C.cyan, fill: withAlpha(C.cyan, p < 0.7 ? 0.2 : 0.06), width: 2 });
    hexagon(ctx, 96, 64, 14, { stroke: C.magenta, fill: withAlpha(C.magenta, p > 0.55 ? 0.22 : 0.06), width: 2 });
    line(ctx, 46, 64, 82, 64, { stroke: C.greyLight, width: 2.4 });
    arrow(ctx, 70, 64, 82, 64, { stroke: C.greyLight, width: 2, head: 6 });
    let bx = 32;
    let bs = 10;
    let col = C.cyan;
    if (p < 0.22) {
      bs = lerp(10, 5, p / 0.22);
      glowCircle(ctx, 32, 64, 16, C.cyan, 0.3);
    } else if (p < 0.55) {
      const t = (p - 0.22) / 0.33;
      bx = lerp(46, 82, E.sineInOut(t));
      bs = 5;
      col = mix(C.cyan, C.magenta, t);
    } else if (p < 0.78) {
      bx = 96;
      bs = lerp(5, 11, (p - 0.55) / 0.23);
      col = C.magenta;
    } else {
      bx = 96;
      bs = 11;
      col = C.magenta;
    }
    if (p < 0.22) {
      rect(ctx, 32 - bs, 64 - bs * 0.6, bs * 2, bs * 1.2, { radius: 2, stroke: col, fill: withAlpha(col, 0.35), width: 1.5 });
    } else if (p < 0.55) {
      rect(ctx, bx - 5, 64 - 4, 10, 8, { radius: 1, stroke: col, fill: withAlpha(col, 0.5), width: 1.4 });
    } else {
      rect(ctx, 96 - bs, 64 - bs * 0.55, bs * 2, bs * 1.1, { radius: 2, stroke: col, fill: withAlpha(col, 0.35), width: 1.5 });
    }
    if (p < 0.7) circle(ctx, 32, 48, 3, { fill: C.cyan, stroke: C.cyan });
    if (p > 0.55) circle(ctx, 96, 48, 3, { fill: C.magenta, stroke: C.magenta });
  }),

  G('B3.26', 'AGT.REASON.SELF_CORRECT', 2600, (ctx, T) => {
    const A = [20, 88];
    const B = [52, 56];
    const C = [92, 40];
    const D = [96, 88];
    const p = T.p;
    line(ctx, A[0], A[1], B[0], B[1], { stroke: C.greyLight, width: 2.2 });
    const fade = p < 0.45 ? 1 : lerp(1, 0.2, clamp((p - 0.45) / 0.25));
    ctx.save();
    ctx.globalAlpha = fade;
    line(ctx, B[0], B[1], C[0], C[1], { stroke: C.grey, width: 1.8, dash: p > 0.5 ? [3, 3] : null });
    circle(ctx, C[0], C[1], 4.5, { stroke: C.grey, width: 1.6 });
    ctx.restore();
    const grow = p < 0.58 ? 0 : E.quadOut(clamp((p - 0.58) / 0.28));
    if (grow > 0.02) {
      const dx = lerp(B[0], D[0], grow);
      const dy = lerp(B[1], D[1], grow);
      arrow(ctx, B[0], B[1], dx, dy, { stroke: C.electric, width: 2.2, head: 6 });
      if (grow > 0.9) circle(ctx, D[0], D[1], 5, { fill: C.electric, stroke: C.electric });
    }
    circle(ctx, A[0], A[1], 4.5, { fill: C.greyLight, stroke: C.greyLight });
    circle(ctx, B[0], B[1], 5, { fill: C.grey, stroke: C.grey });
    let tr = A;
    if (p < 0.22) tr = [lerp(A[0], B[0], p / 0.22), lerp(A[1], B[1], p / 0.22)];
    else if (p < 0.38) tr = [lerp(B[0], C[0], (p - 0.22) / 0.16), lerp(B[1], C[1], (p - 0.22) / 0.16)];
    else if (p < 0.48) tr = C;
    else if (p < 0.58) tr = [lerp(C[0], B[0], (p - 0.48) / 0.1), lerp(C[1], B[1], (p - 0.48) / 0.1)];
    else tr = [lerp(B[0], D[0], grow), lerp(B[1], D[1], grow)];
    packet(ctx, tr[0], tr[1], p > 0.58 ? C.electric : C.amber, 3.4);
    if (p > 0.38 && p < 0.48) {
      xMark(ctx, C[0], C[1] - 10, 4, { stroke: C.amber, width: 1.8 });
    }
  }),

  G('B3.27', 'AGT.MODE.SANDBOX', 2200, (ctx, T) => {
    rect(ctx, 22, 22, 84, 84, { radius: 10, stroke: C.amber, width: 2.4, fill: withAlpha(C.amber, 0.05) });
    const inner = [[44, 44], [84, 44], [84, 84], [44, 84], [64, 64]];
    line(ctx, 44, 44, 84, 44, { stroke: C.cyan, width: 1.8 });
    line(ctx, 84, 44, 84, 84, { stroke: C.cyan, width: 1.8 });
    line(ctx, 84, 84, 44, 84, { stroke: C.cyan, width: 1.8 });
    line(ctx, 44, 84, 44, 44, { stroke: C.cyan, width: 1.8 });
    inner.slice(0, 4).forEach(([x, y]) => circle(ctx, x, y, 4, { fill: C.cyan, stroke: C.cyan }));
    circle(ctx, 64, 64, 5, { fill: C.indigo, stroke: C.indigo });
    ctx.beginPath();
    ctx.moveTo(84, 44);
    ctx.quadraticCurveTo(112, 36, 84, 64);
    ctx.strokeStyle = C.amber;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([3, 2]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(44, 84);
    ctx.quadraticCurveTo(24, 110, 64, 84);
    ctx.strokeStyle = C.amber;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([3, 2]);
    ctx.stroke();
    ctx.setLineDash([]);
    const path = [[44, 44], [84, 44], [84, 84], [44, 84]];
    const [px, py] = along(path, T.p * 1.3, true);
    packet(ctx, px, py, C.cyanBright, 3.2);
    const bounce = T.p % 0.25;
    if (bounce < 0.12) {
      glowCircle(ctx, px, py, 8, C.amber, 0.2);
    }
  }),

  G('B3.28', 'AGT.TOOL.AWAIT', 2000, (ctx, T) => {
    hexagon(ctx, 34, 64, 13, { stroke: C.steel, fill: withAlpha(C.steel, 0.1), width: 2 });
    wrench(ctx, 34, 64, { rot: deg(-40), scale: 0.62, stroke: C.steel, width: 1.8 });
    line(ctx, 48, 64, 72, 64, { stroke: C.grey, width: 2 });
    line(ctx, 80, 64, 112, 64, { stroke: withAlpha(C.grey, 0.35), width: 2, dash: [3, 3] });
    circle(ctx, 112, 64, 5, { stroke: withAlpha(C.grey, 0.4), width: 1.5 });
    let mx = 76;
    if (T.p < 0.22) {
      packet(ctx, lerp(34, 72, T.p / 0.22), 64, C.cool, 3.2);
      mx = 72;
    } else {
      mx = 76 + Math.sin((T.p - 0.22) * Math.PI * 2 * 1.4) * 3.2;
    }
    diamond(ctx, mx, 64, 6, { stroke: C.slate, fill: withAlpha(C.slate, 0.25), width: 1.8 });
    const fade = 0.35 + 0.25 * Math.sin(T.p * Math.PI * 2);
    circle(ctx, mx, 50, 3, { fill: withAlpha(C.cool, fade), stroke: null });
  }),

  G('B3.29', 'AGT.GROUND.VERIFY', 2800, (ctx, T) => {
    const claim = [64, 40];
    const sources = [[32, 100], [96, 100]];
    const gates = [[40, 70], [88, 70]];
    const p = T.p;
    const leftProg = clamp(p / 0.22);
    const leftSnap = p > 0.22;
    const rightProg = clamp((p - 0.28) / 0.22);
    const rightSnap = p > 0.5;
    const ring = p < 0.55 ? 0 : E.sineOut(clamp((p - 0.55) / 0.35));
    const locked = p > 0.9;
    sources.forEach(([x, y], i) => {
      const passed = i === 0 ? leftSnap : rightSnap;
      circle(ctx, x, y, 6, { stroke: passed ? C.teal : C.grey, fill: passed ? withAlpha(C.teal, 0.25) : null, width: 1.8 });
    });
    gates.forEach(([x, y], i) => {
      const prog = i === 0 ? leftProg : rightProg;
      const passed = i === 0 ? leftSnap : rightSnap;
      const inProg = !passed && prog > 0 && prog < 1;
      const col = passed ? C.teal : inProg ? C.amber : C.grey;
      rect(ctx, x - 8, y - 8, 16, 16, { stroke: col, fill: passed ? withAlpha(C.teal, 0.2) : null, width: 2 });
      if (passed) check(ctx, x, y + 1, 5.5, { stroke: C.teal, width: 2 });
      else circle(ctx, x, y, 3.2, { stroke: col, width: 1.4, dash: [1.5, 1.5] });
    });
    line(ctx, sources[0][0], sources[0][1] - 6, gates[0][0], gates[0][1] + 8, { stroke: leftSnap ? C.teal : C.grey, width: 1.8 });
    line(ctx, sources[1][0], sources[1][1] - 6, gates[1][0], gates[1][1] + 8, { stroke: rightSnap ? C.teal : C.grey, width: 1.8 });
    line(ctx, gates[0][0], gates[0][1] - 8, claim[0] - 8, claim[1] + 8, { stroke: leftSnap ? C.teal : C.grey, width: 1.8 });
    line(ctx, gates[1][0], gates[1][1] - 8, claim[0] + 8, claim[1] + 8, { stroke: rightSnap ? C.teal : C.grey, width: 1.8 });
    circle(ctx, claim[0], claim[1], 10, { stroke: locked ? C.teal : C.grey, fill: locked ? withAlpha(C.teal, 0.2) : withAlpha(C.grey, 0.08), width: 2 });
    arc(ctx, claim[0], claim[1], 18, deg(-90), deg(-90) + Math.PI * 2 * (locked ? 1 : ring), {
      stroke: ring > 0.02 ? C.teal : C.grey,
      width: locked ? 3 : 2,
    });
    if (!leftSnap && leftProg > 0) {
      const t = leftProg;
      packet(ctx, lerp(sources[0][0], gates[0][0], t), lerp(sources[0][1], gates[0][1], t), C.amber, 3);
    }
    if (!rightSnap && rightProg > 0 && p > 0.28) {
      const t = rightProg;
      packet(ctx, lerp(sources[1][0], gates[1][0], t), lerp(sources[1][1], gates[1][1], t), C.amber, 3);
    }
    if (leftSnap && p < 0.3) glowCircle(ctx, gates[0][0], gates[0][1], 12, C.teal, 0.4);
    if (rightSnap && p < 0.58) glowCircle(ctx, gates[1][0], gates[1][1], 12, C.teal, 0.4);
  }, { status: 'revised', concept: 'Grounding check / verification' }),
];

module.exports = glyphs;
