'use strict';

const H = require('../lib/helpers');
const {
  C, E, CX, CY, SIZE,
  layer, at, line, polyline, circle, arc, rect, ellipse, hexagon, diamond, triangle,
  arrow, chevron, xMark, check, hatch, wrench, gear, hourglass, lock, flag, documentIcon, human,
  isoCube, text, glowCircle, lerp, clamp, mix, withAlpha, deg, hash, pingpong, u,
} = H;

const SRC = 'GLM 5.2';

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

function partialPolyline(ctx, pts, t, o = {}) {
  if (!pts.length) return;
  const n = pts.length - 1;
  const f = clamp(t) * n;
  const cut = Math.floor(f);
  const fracA = f - cut;
  const out = pts.slice(0, cut + 1).map((p) => p.slice());
  if (cut < n) {
    out.push([
      lerp(pts[cut][0], pts[cut + 1][0], fracA),
      lerp(pts[cut][1], pts[cut + 1][1], fracA),
    ]);
  }
  polyline(ctx, out, o);
  return out[out.length - 1];
}

function sampleAlong(pts, t) {
  const n = pts.length - 1;
  const f = clamp(t) * n;
  const i = Math.min(n - 1, Math.floor(f));
  const k = f - i;
  return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)];
}

function dashedCircle(ctx, x, y, r, o = {}) {
  circle(ctx, x, y, r, { stroke: o.stroke || C.slate, width: o.width || 1.8, dash: o.dash || [3, 3], dashOffset: o.dashOffset, alpha: o.alpha });
}

function policyBlocked(ctx, T) {
  const vib = Math.sin(T.t / 18) * 1.6;
  const barrierX = 72;
  line(ctx, barrierX, 22, barrierX, 106, { stroke: C.redPure, width: 5 });
  line(ctx, barrierX - 6, 22, barrierX + 6, 22, { stroke: C.redPure, width: 3 });
  line(ctx, barrierX - 6, 106, barrierX + 6, 106, { stroke: C.redPure, width: 3 });
  arrow(ctx, 18 + vib, 64, barrierX - 4 + vib * 0.2, 64, { stroke: '#333333', width: 3.2, head: 9 });
}

const glyphs = [
  G('B2.01', 'AGT.CONTROL.SELF_CORRECTION', 1800, (ctx, T) => {
    const { p } = T;
    const inbound = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      inbound.push([lerp(20, 58, t), lerp(100, 50, t)]);
    }
    const loop = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const a = deg(-40) + t * deg(250);
      loop.push([58 + Math.cos(a) * 18, 50 + Math.sin(a) * 15]);
    }
    const hit = inbound[8];
    const origTail = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      origTail.push([lerp(hit[0], 112, t), lerp(hit[1], 22, t)]);
    }
    const original = inbound.concat(loop.slice(1), origTail.slice(1));

    let drawT = 0;
    let retrace = 0;
    let redir = 0;
    if (p < 0.4) drawT = p / 0.4;
    else if (p < 0.5) drawT = 1;
    else if (p < 0.72) {
      drawT = 1;
      retrace = (p - 0.5) / 0.22;
    } else {
      drawT = 1;
      retrace = 1;
      redir = p < 0.76 ? 0 : clamp((p - 0.76) / 0.24);
    }

    const kept = retrace > 0 ? 1 - retrace * (origTail.length / original.length) : drawT;
    partialPolyline(ctx, original, kept, { stroke: C.cyanBright, width: 2.4 });
    if (retrace > 0) {
      const magPts = [hit, ...origTail.slice(1)];
      partialPolyline(ctx, magPts, 1 - retrace, { stroke: C.magentaBright, width: 2.6 });
      const head = sampleAlong(magPts, 1 - retrace);
      circle(ctx, head[0], head[1], 2.4, { fill: C.magentaBright, stroke: null });
    }
    if (redir > 0.02) {
      arrow(ctx, hit[0], hit[1], lerp(hit[0], 108, redir), lerp(hit[1], 102, redir), { stroke: C.magentaBright, width: 2.6, head: 7 });
    }
    circle(ctx, hit[0], hit[1], 3, { fill: mix(C.cyanBright, C.magentaBright, retrace), stroke: null });
  }),

  G('B2.02', 'AGT.GROUND.UNVERIFIED', 1800, (ctx, T) => {
    const grey = mix('#FFFFFF', '#333333', 0.5 + 0.5 * Math.sin(T.p * Math.PI * 2));
    dashedCircle(ctx, CX, CY, 28, { stroke: grey, dash: [4, 5], dashOffset: -T.p * 28, width: 2 });
    const osc = Math.sin(T.p * Math.PI * 2 * 2.2) * 10;
    const a = deg(-40);
    const px = CX + Math.cos(a) * osc;
    const py = CY + Math.sin(a) * osc;
    circle(ctx, px, py, 3.4, { fill: grey, stroke: null });
  }),

  G('B2.03', 'AGT.POLICY.BLOCKED', 1800, (ctx, T) => {
    policyBlocked(ctx, T);
  }),

  G('B2.04', 'AGT.SAFETY.INJECTION_SUSPECTED', 1800, (ctx, T) => {
    const shrink = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(T.p * Math.PI * 2));
    circle(ctx, CX - 6, CY, 32, { stroke: C.greyLight, width: 1.6 });
    circle(ctx, CX - 6, CY, 22, { stroke: C.grey, width: 1.6 });
    circle(ctx, CX - 6, CY, 12 * shrink, { stroke: C.white, width: 2.2, fill: withAlpha(C.white, 0.06) });
    const flickerOn = hash(Math.floor(T.t / 70) + Math.floor(hash(Math.floor(T.t / 31)) * 5)) > 0.42;
    const jagCol = flickerOn ? C.magentaBright : C.black;
    const jag = [
      [78, 30], [108, 26], [118, 46], [102, 58], [116, 74], [94, 86],
      [86, 70], [72, 64], [80, 50], [70, 40],
    ];
    polyline(ctx, jag, { close: true, stroke: jagCol, fill: flickerOn ? withAlpha(C.magentaBright, 0.55) : withAlpha(C.black, 0.85), width: 2 });
  }),

  G('B2.05', 'AGT.EPISTEMIC.LOW_CONFIDENCE', 1800, (ctx, T) => {
    const blue = mix('#5B8CBA', C.cool, 0.45);
    circle(ctx, CX, CY, 30, { stroke: withAlpha(blue, 0.55), width: 1.5 });
    circle(ctx, CX, CY, 20, { stroke: withAlpha(blue, 0.7), width: 1.6 });
    const breath = 1 + 0.22 * Math.sin(T.p * Math.PI * 2 * 0.85 + 0.4);
    const r = 12 * breath;
    for (let i = 5; i >= 1; i--) {
      glowCircle(ctx, CX, CY, r * (i / 5) * 1.35, blue, 0.08 * i);
    }
    glowCircle(ctx, CX, CY, r * 0.45, blue, 0.35);
    circle(ctx, CX, CY, r, { stroke: withAlpha(blue, 0.35), width: 1.2 });
  }),

  G('B2.06', 'AGT.CTX.WINDOW_PRESSURE', 1800, (ctx, T) => {
    const { p, E: e } = T;
    let comp = 0;
    if (p < 0.72) comp = e.sineIn(p / 0.72);
    else comp = 1 - e.expoOut((p - 0.72) / 0.28);
    const scale = lerp(1, 0.62, comp);
    const col = mix(C.green, C.red, comp);
    const w = 72 * scale;
    const h = 56 * scale;
    rect(ctx, CX - w / 2, CY - h / 2, w, h, { radius: 2, stroke: col, width: 2.2 });
    const cols = 7;
    const rows = 5;
    const speed = 1 + comp * 4;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const jx = Math.sin(T.t / (40 / speed) + c * 1.7 + r) * (1.2 + comp * 2);
        const jy = Math.cos(T.t / (35 / speed) + r * 2.1 + c) * (1.2 + comp * 2);
        const x = CX - w / 2 + 8 + c * ((w - 16) / (cols - 1)) + jx;
        const y = CY - h / 2 + 8 + r * ((h - 16) / (rows - 1)) + jy;
        circle(ctx, x, y, 1.6, { fill: mix(C.green, C.red, comp * 0.7), stroke: null });
      }
    }
  }),

  G('B2.07', 'AGT.SPEC.AMBIGUOUS', 1800, (ctx, T) => {
    const y = C.yellow;
    const fork = [CX, 58];
    line(ctx, CX, 104, fork[0], fork[1], { stroke: y, width: 2.4 });
    const ends = [
      [32, 28 + Math.sin(T.p * Math.PI * 2) * 3],
      [64, 22 + Math.sin(T.p * Math.PI * 2 + 1.1) * 3],
      [96, 28 + Math.sin(T.p * Math.PI * 2 + 2.3) * 3],
    ];
    ends.forEach((pt) => {
      line(ctx, fork[0], fork[1], pt[0], pt[1], { stroke: y, width: 2.2 });
      circle(ctx, pt[0], pt[1], 4, { fill: y, stroke: y });
    });
    const pulseP = T.p < 0.55 ? T.p / 0.55 : 1;
    const py = lerp(104, fork[1], pulseP);
    circle(ctx, CX, py, 4.5, { fill: y, stroke: C.white, width: 1 });
    if (pulseP >= 1) {
      const blink = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(T.t / 90));
      circle(ctx, fork[0], fork[1], 6, { stroke: withAlpha(y, blink), width: 1.6, fill: withAlpha(y, 0.2) });
    }
  }),

  G('B2.08', 'AGT.STATE.STALE', 2200, (ctx, T) => {
    const { p } = T;
    const x0 = 16;
    const x1 = 112;
    const y = 64;
    const frameH = 24;
    rect(ctx, x0 - 2, y - frameH / 2, x1 - x0 + 4, frameH, { radius: 2, stroke: C.greyDark, width: 1.6 });
    const oscEnd = x0 + (x1 - x0) / 3;
    const drawUntil = p < (1300 / 2200) ? lerp(x0, x1, p / (1300 / 2200)) : x1;
    const pts = [];
    const n = 48;
    for (let i = 0; i <= n; i++) {
      const x = lerp(x0, x1, i / n);
      if (x > drawUntil) break;
      let amp = 0;
      if (x < oscEnd) {
        const uA = (x - x0) / (oscEnd - x0);
        amp = 8 * Math.sin(uA * Math.PI * 4);
      }
      pts.push([x, y - amp]);
    }
    if (pts.length > 1) {
      const split = pts.findIndex((pt) => pt[0] >= oscEnd);
      if (split > 1) {
        polyline(ctx, pts.slice(0, split + 1), { stroke: C.teal, width: 2 });
        if (split < pts.length - 1) polyline(ctx, pts.slice(split), { stroke: mix(C.amber, C.black, 0.28), width: 2 });
      } else {
        polyline(ctx, pts, { stroke: C.teal, width: 2 });
      }
    }
    const dotX = p < (1300 / 2200) ? drawUntil : x1;
    circle(ctx, dotX, y, 3, { fill: p < (1300 / 2200) ? C.teal : withAlpha(C.amber, 0.85), stroke: null });
  }, { status: 'revised', concept: 'Signal flatline / stalled' }),

  G('B2.09', 'AGT.ENV.UNREADY', 1800, (ctx, T) => {
    const gap = 10;
    const sockX = 46;
    polyline(ctx, [
      [sockX + 10, 38],
      [sockX - 14, 38],
      [sockX - 14, 90],
      [sockX + 10, 90],
    ], { stroke: C.grey, width: 3.2 });
    arc(ctx, sockX + 10, 64, 14, deg(90), deg(-90), { stroke: C.grey, width: 3.2, ccw: true });
    const approach = T.p < 0.35 ? E.quadOut(T.p / 0.35) : 1;
    const rest = sockX + 10 + gap + 16;
    const px = lerp(110, rest, approach);
    const vib = approach >= 1 ? Math.sin(T.t / 22) * 1.8 : 0;
    at(ctx, px + vib, 64, 0, () => {
      circle(ctx, 0, 0, 11, { stroke: C.yellow, fill: withAlpha(C.yellow, 0.2), width: 2.4 });
      rect(ctx, 8, -5, 14, 10, { radius: 1, fill: C.yellow, stroke: C.yellow });
    });
  }),

  G('B2.10', 'AGT.MEM.CONFLICT', 1800, (ctx, T) => {
    const shake = Math.sin(T.t / 16) * 3.2 + Math.cos(T.t / 11) * 2;
    const ox = CX + shake;
    const oy = CY + Math.sin(T.t / 13) * 2.4;
    const lenA = 28 + Math.sin(T.p * Math.PI * 2) * 10;
    const lenB = 28 + Math.sin(T.p * Math.PI * 2 + 1.7) * 12;
    const aA = deg(-55);
    const aB = deg(40);
    arrow(ctx, ox, oy, ox + Math.cos(aA) * lenA, oy + Math.sin(aA) * lenA, { stroke: C.blue, width: 2.6, head: 8 });
    arrow(ctx, ox, oy, ox + Math.cos(aB) * lenB, oy + Math.sin(aB) * lenB, { stroke: C.orange, width: 2.6, head: 8 });
    circle(ctx, ox, oy, 4, { fill: C.white, stroke: C.grey, width: 1.2 });
  }),

  G('B2.11', 'AGT.EVIDENCE.DIVERGE', 1800, (ctx, T) => {
    const origin = [28, 64];
    circle(ctx, origin[0], origin[1], 4, { fill: C.green, stroke: C.green });
    const n = 5;
    const ext = 0.25 + 0.75 * T.p;
    const spread = lerp(8, 28, T.p);
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) * spread;
      const x2 = origin[0] + 86 * ext;
      const y2 = origin[1] + off * ext;
      const segs = 8;
      for (let s = 0; s < segs; s++) {
        const a0 = s / segs;
        const a1 = (s + 1) / segs;
        line(
          ctx,
          lerp(origin[0], x2, a0), lerp(origin[1], y2, a0),
          lerp(origin[0], x2, a1), lerp(origin[1], y2, a1),
          { stroke: withAlpha(C.green, 1 - a1 * 0.92), width: 2 }
        );
      }
    }
  }),

  G('B2.12', 'AGT.EXEC.RETRY_EXHAUSTED', 1700, (ctx, T) => {
    const r = 26;
    const segs = [
      [deg(-90), deg(0)],
      [deg(0), deg(90)],
      [deg(90), deg(180)],
    ];
    segs.forEach(([a0, a1], i) => {
      arc(ctx, CX, CY, r, a0, a1, { stroke: C.teal, width: 2.8 });
      const a = a1;
      const hx = CX + Math.cos(a) * r;
      const hy = CY + Math.sin(a) * r;
      const tx = CX + Math.cos(a - 0.18) * r;
      const ty = CY + Math.sin(a - 0.18) * r;
      if (i < 2) arrow(ctx, tx, ty, hx, hy, { stroke: C.teal, width: 2, head: 6 });
    });
    const endA = deg(180);
    const startA = deg(-90);
    const e1 = [CX + Math.cos(endA) * r, CY + Math.sin(endA) * r];
    const e0 = [CX + Math.cos(startA) * r, CY + Math.sin(startA) * r];
    circle(ctx, e1[0], e1[1], 3.4, { fill: C.amber, stroke: C.amber });
    circle(ctx, e0[0], e0[1], 3.4, { fill: C.amber, stroke: C.amber });
    const aim = endA + 0.28;
    arrow(ctx, e1[0], e1[1], CX + Math.cos(aim) * r, CY + Math.sin(aim) * r, { stroke: C.amber, width: 2.2, head: 6 });
    const travel = 0.72;
    let tokA;
    if (T.p < travel) tokA = lerp(startA, endA, T.p / travel);
    else if (T.p < travel + 0.12) tokA = endA + ((T.p - travel) / 0.12) * 0.35;
    else tokA = endA + 0.35 * (1 - clamp((T.p - travel - 0.12) / 0.08));
    circle(ctx, CX + Math.cos(tokA) * r, CY + Math.sin(tokA) * r, 4, { fill: C.white, stroke: C.teal, width: 1.4 });
  }, { status: 'revised', concept: 'Broken / incomplete loop' }),

  G('B2.13', 'AGT.REASON.LOW_CONF', 1800, (ctx, T) => {
    const y = 64;
    const fieldH = 24;
    line(ctx, 16, y, 112, y, { stroke: C.grey, width: 1.6 });
    line(ctx, 16, y - 4, 112, y - 4, { stroke: withAlpha(C.grey, 0.25), width: 1, dash: [2, 3] });
    line(ctx, 16, y + 4, 112, y + 4, { stroke: withAlpha(C.grey, 0.25), width: 1, dash: [2, 3] });
    const n = 18;
    for (let i = 0; i < n; i++) {
      const baseX = 22 + hash(i * 3.1) * 84;
      const baseY = y + (hash(i * 7.7) - 0.5) * fieldH * 1.8;
      const jx = (hash(i + Math.floor(T.t / 55) * 0.17) - 0.5) * 6;
      const jy = (hash(i + 9 + Math.floor(T.t / 40) * 0.31) - 0.5) * 7;
      const px = baseX + jx;
      const py = baseY + jy;
      const inTol = Math.abs(py - y) < 4;
      circle(ctx, px, py, inTol ? 2.2 : 1.8, { fill: inTol ? C.teal : C.amber, stroke: null });
    }
  }, { status: 'revised', concept: 'High entropy / noisy state' }),

  G('B2.14', 'AGT.EVIDENCE.CONFLICT', 1800, (ctx, T) => {
    const y = 64;
    const meet = E.sineInOut(clamp(T.p / 0.55));
    const aEnd = lerp(24, 64, meet);
    const bStart = lerp(104, 64, meet);
    const amp = 8 + (meet > 0.85 ? 10 : 0);
    const ptsA = [];
    const ptsB = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const x = lerp(24, aEnd, t);
      ptsA.push([x, y + Math.sin(t * Math.PI * 4 + T.p * Math.PI * 2) * amp * (0.6 + 0.4 * t)]);
    }
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const x = lerp(104, bStart, t);
      ptsB.push([x, y + Math.sin(t * Math.PI * 4 + Math.PI + T.p * Math.PI * 2) * amp * (0.6 + 0.4 * t)]);
    }
    polyline(ctx, ptsA, { stroke: C.cyanBright, width: 2 });
    polyline(ctx, ptsB, { stroke: C.magentaBright, width: 2 });
    if (meet > 0.9) {
      const flash = Math.floor(T.t / 120) % 2 === 0;
      const stand = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        const x = lerp(48, 80, t);
        stand.push([x, y + Math.sin(t * Math.PI * 6) * (flash ? 16 : 10)]);
      }
      polyline(ctx, stand, { stroke: C.white, width: flash ? 3 : 2 });
    }
  }),

  G('B2.15', 'AGT.TOOL.RETRY_EXHAUSTED', 1800, (ctx, T) => {
    const { p, E: e } = T;
    const jam = deg(38);
    let rotA = 0;
    if (p < 0.42) rotA = lerp(0, jam, e.quadOut(p / 0.42));
    else if (p < 0.55) rotA = jam + Math.sin((p - 0.42) * 90) * deg(5);
    else if (p < 0.72) rotA = lerp(jam, jam - deg(16), e.cubicOut((p - 0.55) / 0.17));
    else rotA = jam - deg(16);
    gear(ctx, CX, CY, { r: 22, teeth: 8, missing: 3, rot: rotA, stroke: C.grey, fill: withAlpha(C.grey, 0.12) });
    const pulse = p > 0.72 && p < 0.88 ? 1 : p > 0.72 ? 0.7 : 0;
    if (p > 0.68) {
      const s = pulse || 0.85;
      at(ctx, CX, CY, 0, () => {
        ctx.scale(s, s);
        xMark(ctx, 0, 0, 9, { stroke: C.red, width: 3 });
      });
    }
  }),

  G('B2.16', 'AGT.MEM.STATE_STALE', 1400, (ctx, T) => {
    const S = 16;
    const nx = lerp(CX + 18, CX, T.p);
    const oldA = 1 - T.p;
    const ox = CX - 2;
    ctx.save();
    ctx.globalAlpha = oldA;
    rect(ctx, ox - S / 2, CY - S / 2, S, S, { stroke: C.grey, width: 1.4 });
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox - S / 2 + S * T.p, CY - S / 2, Math.max(0.01, S * (1 - T.p)), S);
    ctx.clip();
    hatch(ctx, ox - S / 2, CY - S / 2, S, S, { stroke: C.grey, gap: 3, width: 1, alpha: 0.8 });
    line(ctx, ox - 5, CY - 3, ox + 5, CY - 3, { stroke: C.grey, width: 1.2 });
    line(ctx, ox - 5, CY + 2, ox + 3, CY + 2, { stroke: C.grey, width: 1.2 });
    ctx.restore();
    ctx.restore();
    rect(ctx, nx - S / 2, CY - S / 2, S, S, { stroke: C.teal, width: 2, fill: withAlpha(C.teal, 0.12) });
    line(ctx, nx - 5, CY - 3, nx + 5, CY - 3, { stroke: C.teal, width: 1.4 });
    line(ctx, nx - 5, CY + 2, nx + 5, CY + 2, { stroke: C.teal, width: 1.4 });
    if (T.p < 0.98) {
      const bx = lerp(ox - S / 2, nx + S / 2, T.p);
      line(ctx, bx, CY - 14, bx, CY + 14, { stroke: C.amber, width: 2 });
      arrow(ctx, bx - 8, CY - 18, bx + 6, CY - 18, { stroke: C.amber, width: 1.6, head: 5 });
    }
  }, { status: 'revised', concept: 'State overwrite / replacement' }),

  G('B2.17', 'AGT.TASK.CONSTRAINT_CONFLICT', 1800, (ctx, T) => {
    const push = 3 + 4 * (0.5 + 0.5 * Math.sin(T.p * Math.PI * 2));
    const c1 = [CX - 10 - push, CY];
    const c2 = [CX + 10 + push, CY];
    circle(ctx, c1[0], c1[1], 26, { stroke: C.red, width: 2.2, fill: withAlpha(C.red, 0.12) });
    circle(ctx, c2[0], c2[1], 26, { stroke: C.blue, width: 2.2, fill: withAlpha(C.blue, 0.12) });
    const flash = hash(Math.floor(T.t / 80)) > 0.45;
    const spikes = [];
    for (let i = 0; i < 8; i++) {
      const a = deg(-90 + i * 45) + Math.sin(T.t / 40 + i) * 0.15;
      const rr = i % 2 ? 12 : 6;
      spikes.push([CX + Math.cos(a) * rr, CY + Math.sin(a) * rr]);
    }
    polyline(ctx, spikes, { close: true, stroke: C.yellow, fill: flash ? withAlpha(C.yellow, 0.85) : withAlpha(C.yellow, 0.25), width: 1.8 });
  }),

  G('B2.18', 'AGT.POLICY.BLOCKED', 1800, (ctx, T) => {
    policyBlocked(ctx, T);
  }),

  G('B2.19', 'AGT.TASK.EXECUTION_COMMITTED', 1800, (ctx, T) => {
    const { p, E: e } = T;
    const locked = p > 0.42;
    const col = locked ? C.green : C.yellow;
    const slide = p < 0.38 ? e.cubicOut(p / 0.38) : 1;
    const ax = lerp(18, 40, slide);
    const close = locked ? 4 * Math.min(1, (p - 0.38) / 0.08) : 0;
    polyline(ctx, [[86 + close, 40], [104, 40], [104, 88], [86 + close, 88]], { stroke: col, width: 3.2 });
    polyline(ctx, [[74 - close, 40], [56, 40], [56, 88], [74 - close, 88]], { stroke: col, width: 3.2 });
    arrow(ctx, ax, 64, ax + 36, 64, { stroke: col, width: 3, head: 9 });
    if (p > 0.44) {
      const k = e.quadOut(clamp((p - 0.44) / 0.3));
      circle(ctx, 80, 64, 8 + k * 28, { stroke: withAlpha(col, 0.45 * (1 - k)), width: 3 });
    }
  }),

  G('B2.20', 'AGT.SPAWN.FANOUT', 1800, (ctx, T) => {
    const n = 6;
    const retract = T.p > 0.58;
    const rt = retract ? E.quadIn((T.p - 0.58) / 0.42) : 0;
    circle(ctx, CX, CY, 7, { fill: C.white, stroke: C.white });
    for (let i = 0; i < n; i++) {
      const a = deg(-90 + i * 60);
      const delay = i * 0.07;
      let grow = 0;
      if (!retract) grow = clamp((T.p - delay) / 0.12);
      else grow = 1 - rt;
      const x2 = CX + Math.cos(a) * 36 * grow;
      const y2 = CY + Math.sin(a) * 36 * grow;
      if (grow > 0.05) {
        arrow(ctx, CX + Math.cos(a) * 8, CY + Math.sin(a) * 8, x2, y2, { stroke: C.neonBlue, width: 2.2, head: 6 });
      }
    }
  }),

  G('B2.21', 'AGT.TOOL.RETRY', 1800, (ctx, T) => {
    const gap = deg(42);
    const a0 = deg(-90) + gap / 2;
    const a1 = deg(-90) - gap / 2 + Math.PI * 2;
    arc(ctx, CX, CY, 24, a0, a1, { stroke: C.yellow, width: 3 });
    const travel = 0.68;
    const pause = T.p >= travel;
    const angA = pause ? a1 : lerp(a0, a1, T.p / travel);
    const hx = CX + Math.cos(angA) * 24;
    const hy = CY + Math.sin(angA) * 24;
    const tx = CX + Math.cos(angA - 0.22) * 24;
    const ty = CY + Math.sin(angA - 0.22) * 24;
    arrow(ctx, tx, ty, hx, hy, { stroke: C.yellow, width: 2.6, head: 8 });
  }),

  G('B2.22', 'AGT.PLAN.ACTIVE', 1800, (ctx, T) => {
    const nodes = {
      root: [64, 20],
      a: [36, 48],
      b: [92, 48],
      merge: [64, 78],
      term: [64, 108],
    };
    const edges = [
      ['root', 'a'], ['root', 'b'], ['a', 'merge'], ['b', 'merge'], ['merge', 'term'],
    ];
    const phase = Math.floor(T.p * 4.99);
    const done = {
      root: phase >= 1,
      a: phase >= 2,
      b: phase >= 2,
      merge: phase >= 3,
      term: phase >= 4,
    };
    const frontier = {
      root: phase === 0,
      a: phase === 1,
      b: phase === 1,
      merge: phase === 2,
      term: phase === 3,
    };
    function nCol(k) {
      if (done[k]) return C.teal;
      if (frontier[k]) return C.amber;
      return C.grey;
    }
    edges.forEach(([a, b]) => {
      const A = nodes[a];
      const B = nodes[b];
      const complete = done[a] && (done[b] || frontier[b]);
      const col = complete ? C.teal : (done[a] || frontier[a] ? C.amber : C.grey);
      line(ctx, A[0], A[1], B[0], B[1], { stroke: col, width: 1.8 });
      const mx = (A[0] + B[0]) / 2;
      const my = (A[1] + B[1]) / 2;
      const angA = Math.atan2(B[1] - A[1], B[0] - A[0]);
      at(ctx, mx, my, angA, () => chevron(ctx, 0, 0, 5, { stroke: col, width: 1.6 }));
    });
    Object.keys(nodes).forEach((k) => {
      const [x, y] = nodes[k];
      const col = nCol(k);
      if (done[k]) circle(ctx, x, y, 6, { fill: col, stroke: col });
      else if (frontier[k]) {
        circle(ctx, x, y, 7, { stroke: col, width: 2 });
        circle(ctx, x, y, 4, { stroke: col, width: 1.6 });
      } else circle(ctx, x, y, 6, { stroke: col, width: 1.8 });
    });
    const local = (T.p * 4.99) % 1;
    Object.keys(nodes).forEach((k) => {
      if (!frontier[k]) return;
      const incoming = edges.find(([a, b]) => b === k && done[a]);
      if (incoming) {
        const A = nodes[incoming[0]];
        const B = nodes[k];
        const t = Math.min(local, 0.92);
        circle(ctx, lerp(A[0], B[0], t), lerp(A[1], B[1], t), 3, { fill: C.amber, stroke: C.white, width: 1 });
      } else {
        circle(ctx, nodes[k][0], nodes[k][1], 3.2, { fill: C.amber, stroke: C.white, width: 1 });
      }
    });
  }, { status: 'revised', concept: 'DAG / workflow progress' }),

  G('B2.23', 'AGT.EXEC.COMMIT', 1800, (ctx, T) => {
    const { p, E: e } = T;
    const src = [[32, 104], [64, 104], [96, 104]];
    const gateY = 54;
    const thresh = 0.62;
    const fill = clamp(p / thresh);
    src.forEach(([x, y], i) => {
      circle(ctx, x, y, 5, { fill: C.greyMid, stroke: C.greyMid });
      const verified = fill > (i + 1) / 3;
      line(ctx, x, y - 6, x, gateY + 6, { stroke: verified ? C.teal : C.greyMid, width: 1.8 });
      const pulseY = y - 8 - ((T.p * 3 + i * 0.2) % 1) * (y - gateY - 16);
      if (p < thresh) circle(ctx, x, pulseY, 2.2, { fill: C.teal, stroke: null, alpha: 0.8 });
    });
    const gateCol = p < thresh ? C.amber : C.teal;
    rect(ctx, 24, gateY - 4, 80, 8, { radius: 1, stroke: gateCol, width: 1.8 });
    rect(ctx, 24, gateY - 4, 80 * fill, 8, { fill: gateCol, stroke: null });
    const snap = p > thresh ? e.backOut(clamp((p - thresh) / 0.18)) : 0;
    if (p > thresh) {
      const k = clamp((p - thresh) / 0.2);
      line(ctx, CX, gateY - 4, CX, lerp(gateY - 4, 34, k), { stroke: C.teal, width: 2.4 });
    }
    at(ctx, CX, 28, 0, () => {
      ctx.scale(0.85 + snap * 0.2, 0.85 + snap * 0.2);
      diamond(ctx, 0, 0, 10, { stroke: C.teal, fill: snap > 0.6 ? C.teal : withAlpha(C.teal, 0.15), width: 2.2 });
    });
  }, { status: 'revised', concept: 'Grounding / threshold commit' }),

  G('B2.24', 'AGT.COORD.CONSENSUS', 1800, (ctx, T) => {
    const lanes = [34, 52, 70, 88];
    const starts = [deg(-55), deg(70), deg(-20), deg(140)];
    const k = E.sineInOut(T.p);
    line(ctx, 20, CY, 108, CY, { stroke: withAlpha(C.grey, 0.35), width: 1, dash: [3, 3] });
    lanes.forEach((y, i) => {
      const angA = lerp(starts[i], 0, k);
      const locked = Math.abs(angA) < deg(8);
      const col = locked ? C.teal : C.grey;
      const x0 = 28;
      at(ctx, x0, y, angA, () => {
        arrow(ctx, 0, 0, 72, 0, { stroke: col, width: 2.2, head: 7 });
      });
      if (!locked) {
        arc(ctx, x0, y, 14, Math.min(0, angA), Math.max(0, angA), { stroke: C.amber, width: 1.6 });
      }
    });
  }, { status: 'revised', concept: 'Consensus / alignment' }),

  G('B2.25', 'AGT.TOOL.RETRYING', 1800, (ctx, T) => {
    const y = 64;
    line(ctx, 16, y - 10, 112, y - 10, { stroke: C.grey, width: 2 });
    line(ctx, 16, y + 10, 112, y + 10, { stroke: C.grey, width: 2 });
    const ribs = [44, 66, 88];
    ribs.forEach((x) => {
      line(ctx, x, y - 10, x, y + 10, { stroke: C.amber, width: 2.4 });
      line(ctx, x + 3, y - 10, x + 3, y + 10, { stroke: C.amber, width: 1.6 });
    });
    const stops = [20, 44, 66, 88, 112];
    const segs = 4;
    const local = T.p * segs;
    const si = Math.min(segs - 1, Math.floor(local));
    const f = local - si;
    let eased = f;
    if (si < 3) {
      if (f < 0.7) eased = f / 0.7 * 0.92;
      else if (f < 0.82) eased = 0.92 - ((f - 0.7) / 0.12) * (1 / 18);
      else eased = lerp(0.92 - 1 / 18, 1, (f - 0.82) / 0.18);
    }
    const x = lerp(stops[si], stops[si + 1], clamp(eased));
    const compress = (si > 0 && si < 4 && f > 0.55 && f < 0.9) ? 0.85 : lerp(1, 0.85, T.p * 0.5);
    ellipse(ctx, x, y, 7 * compress, 6, { fill: C.teal, stroke: C.teal });
  }, { status: 'revised', concept: 'Degraded tool / friction' }),

  G('B2.26', 'AGT.HANDOFF.OUT', 1800, (ctx, T) => {
    const { p, E: e } = T;
    const fade = p > 0.55 ? 1 - e.sineOut(clamp((p - 0.55) / 0.45)) : 1;
    ctx.save();
    ctx.globalAlpha = fade;
    polyline(ctx, [[32, 32], [32, 96], [88, 96]], { stroke: C.grey, width: 2.4 });
    polyline(ctx, [[32, 32], [88, 32]], { stroke: C.grey, width: 2.4 });
    ctx.restore();
    arrow(ctx, 50, 64, 116, 64, { stroke: withAlpha(C.grey, 0.45 + 0.4 * fade), width: 1.8, head: 7 });
    const pk = e.cubicInOut(p);
    const px = lerp(48, 122, pk);
    rect(ctx, px - 6, 58, 12, 12, { radius: 2, fill: C.cyanBright, stroke: C.cyanBright });
  }),

  G('B2.27', 'AGT.QUEUE.FOLLOWUP', 1500, (ctx, T) => {
    const { p, E: e } = T;
    const slotH = 14;
    const slots = [86, 70, 54, 38];
    const boundY = 26;
    line(ctx, 40, boundY, 88, boundY, { stroke: C.greyDark, width: 1.4, dash: [3, 2] });
    let lift = 0;
    let shift = 0;
    let popA = 1;
    if (p < 0.4) {
      lift = e.cubicOut(p / 0.4) * 28;
      popA = 1 - clamp((p - 0.22) / 0.18);
    } else {
      lift = 28;
      popA = 0;
      shift = e.cubicInOut(clamp((p - 0.4) / 0.35));
    }
    const items = [0, 1, 2, 3];
    items.forEach((i) => {
      const isTop = i === 3;
      let y = slots[i];
      if (isTop) y -= 3 + lift;
      else y -= shift * slotH;
      if (isTop && popA <= 0) return;
      const active = (isTop && p < 0.4) || (!isTop && i === 2 && p > 0.75);
      ctx.save();
      if (isTop) ctx.globalAlpha = popA;
      rect(ctx, 46, y, 36, 12, { radius: 2, stroke: active ? C.teal : C.grey, fill: active ? withAlpha(C.teal, 0.2) : withAlpha(C.grey, 0.1), width: 1.8 });
      ctx.restore();
    });
    if (p < 0.45) {
      arrow(ctx, 64, slots[3] + 10, 64, slots[3] - 2 - lift * 0.3, { stroke: C.amber, width: 2, head: 5 });
    }
  }, { status: 'revised', concept: 'Queue / stack pop' }),

  G('B2.28', 'AGT.KNOWLEDGE.STALE', 1800, (ctx, T) => {
    const nodes = [
      [22, 58], [44, 40], [66, 62], [88, 38], [110, 56],
    ];
    const edges = [[0, 1], [1, 2], [1, 3], [2, 4], [3, 4]];
    const front = T.p * 1.15;
    edges.forEach(([a, b]) => {
      const age = (a + b) / 8;
      const decay = clamp((front - age) / 0.35);
      const A = nodes[a];
      const B = nodes[b];
      if (decay > 0.85) {
        line(ctx, A[0], A[1], lerp(A[0], B[0], 0.35), lerp(A[1], B[1], 0.35), { stroke: withAlpha(C.amber, 0.4), width: 1.4, dash: [2, 3] });
        line(ctx, lerp(A[0], B[0], 0.7), lerp(A[1], B[1], 0.7), B[0], B[1], { stroke: withAlpha(C.amber, 0.4), width: 1.4, dash: [2, 3] });
      } else if (decay > 0.35) {
        line(ctx, A[0], A[1], B[0], B[1], { stroke: C.amber, width: 1.6, dash: [3, 3] });
      } else {
        line(ctx, A[0], A[1], B[0], B[1], { stroke: mix(C.teal, C.grey, 0.35), width: 2 });
      }
    });
    nodes.forEach((pt, i) => {
      const age = i / 4;
      const decay = clamp((front - age) / 0.4);
      const s = lerp(1, 0.7, clamp(decay));
      const lost = decay > 0.9;
      circle(ctx, pt[0], pt[1], 5 * s, {
        stroke: lost ? withAlpha(C.grey, 0.35) : (decay > 0.4 ? C.amber : mix(C.teal, C.grey, 0.3)),
        fill: lost ? null : (decay > 0.4 ? withAlpha(C.amber, 0.15) : withAlpha(C.teal, 0.25)),
        width: 1.6,
        alpha: lost ? 0.5 : 1,
      });
    });
    arrow(ctx, 20, 100, 108, 100, { stroke: C.grey, width: 1.5, head: 6 });
    text(ctx, 'old', 24, 110, { size: 8, fill: C.grey });
    text(ctx, 'new', 104, 110, { size: 8, fill: C.grey });
  }, { status: 'revised', concept: 'Graph decay / memory loss' }),

  G('B2.29', 'AGT.TOOL.WAITING', 1800, (ctx, T) => {
    const topPulse = 1 + 0.07 * Math.sin(T.p * Math.PI * 2);
    const botPulse = 1 + 0.07 * Math.sin(T.p * Math.PI * 2 + Math.PI);
    at(ctx, CX, 46, 0, () => {
      ctx.scale(topPulse, topPulse);
      polyline(ctx, [[-16, -18], [16, -18], [2, 8], [-2, 8]], { close: true, stroke: C.yellow, width: 2.2 });
    });
    at(ctx, CX, 82, 0, () => {
      ctx.scale(botPulse, botPulse);
      polyline(ctx, [[-2, -8], [2, -8], [16, 18], [-16, 18]], { close: true, stroke: C.yellow, width: 2.2 });
    });
    for (let i = 0; i < 9; i++) {
      const bx = CX + (hash(i) - 0.5) * 10;
      const by = 64 + (hash(i + 4) - 0.5) * 8;
      const jx = Math.sin(T.t / 28 + i * 1.8) * 1.8;
      const jy = Math.cos(T.t / 22 + i * 2.1) * 1.6;
      circle(ctx, bx + jx, by + jy, 1.7, { fill: C.yellow, stroke: null });
    }
  }),
];

module.exports = glyphs;
