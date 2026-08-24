'use strict';

const H = require('../lib/helpers');
const {
  C, E, CX, CY, SIZE,
  layer, at, line, polyline, circle, arc, rect, ellipse, hexagon, diamond, triangle,
  arrow, chevron, xMark, check, hatch, wrench, hourglass, lock, flag, documentIcon, human,
  isoCube, text, glowCircle, lerp, clamp, mix, withAlpha, deg, hash, pingpong, u, poly, gray,
} = H;

const SRC = 'Grok';

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

function diamondPts(x, y, r) {
  return [[x, y - r], [x + r, y], [x, y + r], [x - r, y]];
}

function clipPoly(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.clip();
}

function partialPoly(ctx, pts, t, o) {
  if (t <= 0 || pts.length < 2) return;
  const segs = pts.length - 1;
  const f = clamp(t) * segs;
  const out = [pts[0]];
  for (let i = 0; i < segs; i++) {
    if (f >= i + 1) out.push(pts[i + 1]);
    else if (f > i) {
      const k = f - i;
      out.push([lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]);
      break;
    } else break;
  }
  if (out.length > 1) polyline(ctx, out, o);
}

function contextFrames(ctx, T, n, restInner) {
  const tri = pingpong(T.p);
  const compress = tri * 0.42;
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1 || 1);
    const rest = lerp(1, restInner, k);
    const scale = rest * (1 - compress * k);
    const half = 34 * scale;
    const rad = lerp(7, 1.2, k) * (1 - 0.7 * k * compress);
    const lum = lerp(0.28, 0.82, k * (0.45 + 0.55 * tri));
    rect(ctx, CX - half, CY - half, half * 2, half * 2, {
      radius: Math.max(0.6, rad),
      stroke: gray(lum),
      width: 1.8 + k * 0.6,
      fill: null,
    });
  }
}

function memZipper(ctx, T, o = {}) {
  const slide = Math.sin(T.p * Math.PI * 2) * (o.amp || 5);
  const split = 1.6 + Math.abs(Math.sin(T.p * Math.PI * 2)) * (o.split || 3.2);
  const yA = o.yA || 46;
  const yB = o.yB || 78;
  const w = o.w || 64;
  const round = o.round || 0;
  const colA = mix(C.indigo, C.white, 0.18);
  const colB = mix(C.indigo, C.black, 0.22);
  if (o.ghost) {
    ctx.save();
    ctx.globalAlpha = 0.2;
    rect(ctx, CX - w / 2 + 4, (yA + yB) / 2 - 6, w, 12, {
      radius: round || 5,
      stroke: mix(C.indigo, C.grey, 0.7),
      fill: withAlpha(C.indigo, 0.12),
      width: 1.4,
    });
    ctx.restore();
  }
  rect(ctx, CX - w / 2 + slide - 6, yA - 7, w, 14, {
    radius: round,
    stroke: colA,
    fill: withAlpha(colA, 0.35),
    width: 2,
  });
  rect(ctx, CX - w / 2 - slide + 6, yB - 7, w, 14, {
    radius: round,
    stroke: colB,
    fill: withAlpha(colB, 0.35),
    width: 2,
  });
  const zs = [yA + 10, (yA + yB) / 2, yB - 10];
  zs.forEach((y, i) => {
    if (i === 1) {
      diamond(ctx, CX - split, y, 5, { stroke: C.greyLight, fill: withAlpha(C.grey, 0.2), width: 1.5 });
      diamond(ctx, CX + split, y, 5, { stroke: C.greyLight, fill: withAlpha(C.grey, 0.2), width: 1.5 });
    } else {
      diamond(ctx, CX, y, 5.5, { stroke: C.indigo, fill: withAlpha(C.indigo, 0.45), width: 1.6 });
    }
  });
}

const glyphs = [
  G('B5.01', 'AGT.KNOWLEDGE.STALE', 2000, (ctx, T) => {
    const age = 0.62;
    const wedge = deg(lerp(0, 330, age));
    const lum = 1 / (1 + age * 2.4);
    const col = gray(lerp(0.08, 0.52, lum));
    const rotA = T.p * Math.PI * 2;
    at(ctx, CX, CY, rotA, () => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 30, wedge * 0.5, Math.PI * 2 - wedge * 0.5);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
    });
  }),

  G('B5.02', 'AGT.POLICY.BLOCK', 1600, (ctx, T) => {
    let op = 1;
    if (T.p < 0.08) op = 1;
    else if (T.p < 0.16) op = 0.3;
    else op = 1;
    ctx.save();
    ctx.globalAlpha = op;
    poly(ctx, CX, CY, 34, 8, deg(22.5), {
      fill: C.redBright,
      stroke: C.redBright,
      width: 2,
    });
    rect(ctx, CX - 22, CY - 5.5, 44, 11, { radius: 1, fill: C.white, stroke: null });
    ctx.restore();
  }),

  G('B5.03', 'AGT.RESOURCE.BUDGET_EXCEEDED', 1800, (ctx, T) => {
    const capX = 96;
    const left = 18;
    const y = 52;
    const h = 24;
    let fillW;
    let notch = 0;
    if (T.p < 0.38) fillW = lerp(8, capX - left, T.p / 0.38);
    else {
      fillW = capX - left;
      const spike = T.p < 0.5 ? clamp((T.p - 0.38) / 0.12) : 1;
      notch = spike;
    }
    rect(ctx, left, y, capX - left, h, { radius: 12, stroke: C.greyMid, width: 2, fill: withAlpha(C.greyDark, 0.25) });
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(left + 2, y + 3, Math.max(2, fillW - 2), h - 6, 9);
    ctx.clip();
    ctx.fillStyle = C.amber;
    ctx.fillRect(left, y, fillW + 20, h);
    ctx.restore();
    if (notch > 0.02) {
      const ox = capX + notch * 14;
      const amp = 5 + notch * 4;
      polyline(ctx, [
        [capX - 1, y + 4],
        [ox, y + 4],
        [ox - 3, y + 4 + amp * 0.35],
        [ox + 4, y + h * 0.5],
        [ox - 3, y + h - 4 - amp * 0.35],
        [ox, y + h - 4],
        [capX - 1, y + h - 4],
      ], { stroke: C.yellow, fill: C.yellow, width: 1.4, close: true });
    }
  }),

  G('B5.04', 'AGT.RESULT.PARTIAL', 1800, (ctx, T) => {
    const r = 28;
    const verts = [];
    for (let i = 0; i < 6; i++) {
      const a = deg(-90) + i * deg(60);
      verts.push([CX + Math.cos(a) * r, CY + Math.sin(a) * r]);
    }
    const ghost = 0.15 + 0.3 * (0.5 + 0.5 * Math.sin(T.p * Math.PI * 2));
    const ghostCol = mix(C.cyan, C.grey, 0.5);
    for (let i = 0; i < 3; i++) {
      const a = verts[i];
      const b = verts[(i + 1) % 6];
      line(ctx, a[0], a[1], b[0], b[1], { stroke: C.cyan, width: 2.4 });
    }
    ctx.save();
    ctx.globalAlpha = ghost;
    for (let i = 3; i < 6; i++) {
      const a = verts[i];
      const b = verts[(i + 1) % 6];
      line(ctx, a[0], a[1], b[0], b[1], { stroke: ghostCol, width: 1.8, dash: [4, 3] });
    }
    ctx.restore();
  }),

  G('B5.05', 'AGT.PLAN.REVISED', 2000, (ctx, T) => {
    const orig = [[22, 96], [48, 60], [78, 48], [108, 30]];
    const neu = [[48, 60], [68, 88], [104, 82]];
    const oldCol = mix(C.blue, C.grey, 0.62);
    const newCol = C.electric;
    let origT = 0;
    let newT = 0;
    let oldA = 1;
    if (T.p < 0.32) origT = E.quadOut(T.p / 0.32);
    else {
      origT = 1;
      if (T.p < 0.42) newT = 0;
      else if (T.p < 0.78) newT = E.cubicIn((T.p - 0.42) / 0.36);
      else newT = 1;
      if (T.p > 0.82) oldA = 0.8;
    }
    ctx.save();
    ctx.globalAlpha = oldA;
    partialPoly(ctx, orig, origT, { stroke: oldCol, width: 2.2 });
    ctx.restore();
    orig.slice(0, origT > 0.02 ? Math.min(orig.length, 1 + Math.ceil(origT * 3)) : 1).forEach((pt, i) => {
      if (i === 0 || origT * 3 >= i) circle(ctx, pt[0], pt[1], i === 0 ? 4 : 3, { fill: oldCol, stroke: oldCol });
    });
    if (newT > 0.02) {
      partialPoly(ctx, neu, newT, { stroke: newCol, width: 2.6 });
      if (newT > 0.92) {
        const last = neu[neu.length - 1];
        circle(ctx, last[0], last[1], 4, { fill: newCol, stroke: newCol });
      }
    }
  }),

  G('B5.06', 'AGT.RESOURCE.CONTEXT_PRESSURE', 1800, (ctx, T) => {
    contextFrames(ctx, T, 4, 0.38);
  }),

  G('B5.07', 'AGT.TOOL.UNAVAILABLE', 2000, (ctx, T) => {
    const headCol = mix(C.green, C.grey, 0.55);
    const restY = 22;
    const dockY = 0;
    let bitY = restY;
    const tryOnce = (p0, p1) => {
      const span = p1 - p0;
      const q = clamp((T.p - p0) / span);
      if (T.p < p0 || T.p >= p1) return null;
      if (q < 0.55) return lerp(restY, dockY - 2, E.quadOut(q / 0.55));
      return lerp(dockY - 2, restY, E.quadIn((q - 0.55) / 0.45));
    };
    const a = tryOnce(0.0, 0.32);
    const b = tryOnce(0.36, 0.68);
    if (a != null) bitY = a;
    else if (b != null) bitY = b;
    else bitY = restY;
    triangle(ctx, CX, CY - 18, 16, { fill: withAlpha(headCol, 0.35), stroke: headCol, width: 2.2 });
    circle(ctx, CX, CY + 2, 4.5, { stroke: C.red, width: 2, fill: null });
    at(ctx, CX, CY + 10 + bitY, 0, () => {
      rect(ctx, -7, 0, 14, 14, { stroke: headCol, fill: withAlpha(headCol, 0.2), width: 2 });
    });
  }),

  G('B5.08', 'AGT.RESOURCE.CONTEXT_PRESSURE', 1800, (ctx, T) => {
    contextFrames(ctx, T, 5, 0.32);
  }),

  G('B5.09', 'AGT.TOOL.RETRY.EXHAUST', 2000, (ctx, T) => {
    const n = 4;
    const xs = [28, 48, 68, 88];
    const stepMs = 0.14;
    let tokI = 0;
    let fallen = 0;
    let greyed = false;
    if (T.p < stepMs * n) tokI = Math.min(n - 1, Math.floor(T.p / stepMs));
    else if (T.p < 0.72) {
      tokI = n;
      fallen = clamp((T.p - stepMs * n) / 0.14);
    } else {
      tokI = n;
      fallen = 1;
      greyed = true;
    }
    xs.forEach((x, i) => {
      const husk = i === n - 1;
      let col = husk ? C.grey : (i < tokI ? mix(C.green, C.greyDark, 0.45) : C.green);
      if (greyed) col = mix(col, C.grey, 0.7);
      if (husk) chevron(ctx, x, CY, 10, { stroke: col, width: 2.2 });
      else chevron(ctx, x, CY, 10, { stroke: col, width: 2.4, fill: withAlpha(col, 0.15) });
    });
    const tx = tokI < n ? xs[tokI] - 10 : lerp(xs[n - 1] + 8, 108, fallen);
    const ty = tokI < n ? CY : CY + fallen * 4;
    rect(ctx, tx - 5, ty - 5, 10, 10, {
      fill: greyed ? C.grey : C.green,
      stroke: greyed ? C.grey : C.green,
    });
  }),

  G('B5.10', 'AGT.SPEC.CONFLICT', 1800, (ctx, T) => {
    const amp = deg(8) * Math.sin(T.p * Math.PI * 2);
    const hueA = '#3D8AD9';
    const hueB = '#E89A3C';
    const r = 26;
    at(ctx, CX - 10, CY, amp, () => {
      diamond(ctx, 0, 0, r, { fill: withAlpha(hueA, 0.55), stroke: hueA, width: 2 });
    });
    at(ctx, CX + 10, CY, -amp, () => {
      diamond(ctx, 0, 0, r, { fill: withAlpha(hueB, 0.55), stroke: hueB, width: 2 });
    });
    ctx.save();
    ctx.translate(CX - 10, CY);
    ctx.rotate(amp);
    clipPoly(ctx, diamondPts(0, 0, r));
    ctx.rotate(-amp);
    ctx.translate(20, 0);
    ctx.rotate(-amp);
    clipPoly(ctx, diamondPts(0, 0, r));
    hatch(ctx, -30, -30, 60, 60, { stroke: C.black, gap: 3.2, width: 1.1, angle: Math.PI / 4 });
    ctx.restore();
  }),

  G('B5.11', 'AGT.STATE.ROLLBACK', 1800, (ctx, T) => {
    const n = 4;
    const h = 16;
    const gap = 4;
    const top = 30;
    const phase = Math.min(3, Math.floor(T.p * 4.15));
    const caret = 3 - phase;
    const parked = T.p > 0.78;
    for (let i = 0; i < n; i++) {
      const y = top + i * (h + gap);
      const below = i > caret;
      const on = i === caret;
      rect(ctx, CX - 18, y, 36, h, {
        radius: 2,
        stroke: C.slate,
        fill: below ? null : withAlpha(C.slate, on ? 0.55 : 0.7),
        width: 1.8,
      });
    }
    const cy = top + caret * (h + gap) + h / 2;
    const pulse = parked ? 1 + 0.18 * Math.sin(clamp((T.p - 0.78) / 0.12) * Math.PI) : 1;
    polyline(ctx, [
      [CX + 22, cy],
      [CX + 32 * pulse, cy - 6 * pulse],
      [CX + 32 * pulse, cy + 6 * pulse],
    ], { close: true, fill: C.cyanBright, stroke: C.cyanBright, width: 1.4 });
  }),

  G('B5.12', 'AGT.TASK.PARTIAL_SUCCESS', 1800, (ctx, T) => {
    const r = 28;
    const slice = deg(220);
    const a0 = deg(-90);
    const a1 = a0 + slice;
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, r, a0, a1);
    ctx.closePath();
    ctx.fillStyle = C.green;
    ctx.fill();
    circle(ctx, CX, CY, r, { stroke: C.grey, width: 1.6, fill: null });
    arc(ctx, CX, CY, r, a1, a0 + Math.PI * 2, {
      stroke: C.amber,
      width: 2.6,
      dash: [5, 4],
      dashOffset: -T.p * 28,
    });
    const tx = CX + Math.cos(a1) * r;
    const ty = CY + Math.sin(a1) * r;
    line(ctx, tx, ty, tx + Math.cos(a1) * 8, ty + Math.sin(a1) * 8, { stroke: C.white, width: 2.4 });
  }),

  G('B5.13', 'AGT.EPISTEMIC.UNGROUNDED', 1800, (ctx, T) => {
    const bob = Math.sin(T.p * Math.PI * 2) * 5;
    const vio = mix(C.violet, C.grey, 0.35);
    circle(ctx, CX, 46 + bob, 8, { fill: vio, stroke: vio });
    line(ctx, 28, 92, 46, 92, { stroke: C.greyMid, width: 2.4 });
    line(ctx, 82, 92, 100, 92, { stroke: C.greyMid, width: 2.4 });
  }),

  G('B5.14', 'AGT.CONF.LOW', 1800, (ctx, T) => {
    const base = 46;
    const h = 18;
    const step = Math.floor(T.t / 70);
    const jx = (hash(step * 3.1) - 0.5) * 7 + (hash(step + 9) - 0.5) * 2;
    const col = mix(C.cool, C.grey, 0.45);
    const apex = [CX + jx, CY - h];
    const left = [CX - base / 2, CY + 14];
    const right = [CX + base / 2, CY + 14];
    polyline(ctx, [apex, right, left], { close: true, stroke: col, width: 2, fill: null });
    ctx.save();
    clipPoly(ctx, [apex, right, left]);
    const fillH = 16;
    const grdY = CY + 14 - fillH;
    ctx.fillStyle = withAlpha(col, 0.55);
    ctx.fillRect(CX - 40, grdY, 80, fillH + 8);
    ctx.restore();
    polyline(ctx, [apex, right, left], { close: true, stroke: col, width: 2 });
  }),

  G('B5.15', 'AGT.SPEC.AMBIGUOUS', 2000, (ctx, T) => {
    const delta = 12;
    const dwell = pingpong(T.p);
    const k = E.sineInOut(dwell);
    const top = [CX, CY - 28];
    const bot = [CX, CY + 28];
    const pose = (side) => [
      top,
      [CX + 22 + side * delta, CY],
      bot,
      [CX - 22 - side * delta, CY],
    ];
    const ghost = pose(-1);
    const active = pose(lerp(-1, 1, k));
    const col = C.yellowGreen;
    ctx.save();
    ctx.globalAlpha = 0.4;
    polyline(ctx, pose(1), { close: true, stroke: col, width: 1.8 });
    polyline(ctx, ghost, { close: true, stroke: col, width: 1.8 });
    ctx.restore();
    polyline(ctx, active, { close: true, stroke: col, width: 2.4 });
  }),

  G('B5.16', 'AGT.GATE.HUMAN_INPUT', 2000, (ctx, T) => {
    const r = 30;
    const slotW = 10;
    const slotA = slotW / r;
    arc(ctx, CX, CY + 8, r, deg(-90) + slotA, deg(-90) + Math.PI * 2 - slotA, {
      stroke: C.magentaBright,
      width: 3.4,
    });
    rect(ctx, CX - slotW / 2, CY + 8 - r - 3, slotW, 6, { stroke: C.magentaBright, width: 1.6, fill: null });
    let ty = CY + 8 - r - 18;
    if (T.p < 0.28) ty = lerp(CY + 8 - r - 22, CY + 8 - r - 8, E.quadOut(T.p / 0.28));
    else if (T.p < 0.48) ty = CY + 8 - r - 8;
    else if (T.p < 0.62) ty = lerp(CY + 8 - r - 8, CY + 8 - r - 10, (T.p - 0.48) / 0.14);
    else ty = lerp(CY + 8 - r - 10, CY + 8 - r - 22, E.quadIn(clamp((T.p - 0.62) / 0.38)));
    rect(ctx, CX - 5, ty - 5, 10, 10, { fill: C.white, stroke: C.white });
  }),

  G('B5.17', 'AGT.HANDOFF.SUBAGENT_SPAWN', 2000, (ctx, T) => {
    const pr = 20;
    const cr = 12;
    let childS = 0;
    let childX = CX + pr + 2;
    let neckW = 7;
    let severed = false;
    let pulse = 1;
    if (T.p < 0.38) {
      childS = E.quadOut(T.p / 0.38);
      neckW = lerp(8, 4, childS);
    } else if (T.p < 0.62) {
      childS = 1;
      const k = E.sineInOut((T.p - 0.38) / 0.24);
      childX = lerp(CX + pr + 2, CX + pr + cr + 16, k);
      neckW = lerp(4, 1.2, k);
    } else {
      childS = 1;
      childX = CX + pr + cr + 16;
      neckW = 0;
      severed = true;
      if (T.p < 0.7) pulse = 1 + 0.12 * Math.sin(((T.p - 0.62) / 0.08) * Math.PI);
    }
    const parentLum = mix(C.teal, C.white, severed ? 0.15 : 0);
    circle(ctx, CX - 8, CY, pr * pulse, { stroke: parentLum, fill: withAlpha(parentLum, 0.12), width: 2.2 });
    line(ctx, CX - 8, CY - 5, CX - 8, CY + 5, { stroke: parentLum, width: 2 });
    if (childS > 0.04) {
      const lum = mix(C.teal, C.black, severed ? 0 : 0.35);
      if (!severed && neckW > 0.8) {
        rect(ctx, CX - 8 + pr - 2, CY - neckW / 2, childX - (CX - 8) - pr + 2, neckW, {
          fill: withAlpha(C.teal, 0.5),
          stroke: C.teal,
          width: 1,
        });
      }
      circle(ctx, childX, CY, cr * childS, { stroke: lum, fill: withAlpha(lum, 0.18), width: 2 });
    }
  }),

  G('B5.18', 'AGT.SECURITY.INJECTION', 1800, (ctx, T) => {
    const stab = T.p < 0.18 ? E.expoIn(T.p / 0.18) : 1;
    const barY = 58;
    const barH = 18;
    rect(ctx, 16, barY, 96, barH, { radius: 2, stroke: C.blue, fill: withAlpha(C.blue, 0.18), width: 2 });
    hatch(ctx, 18, barY + 2, 92, barH - 4, { stroke: withAlpha(C.blue, 0.45), gap: 4, width: 1 });
    const wx = lerp(20, 70, stab);
    const wy = lerp(18, barY + 4, stab);
    at(ctx, wx, wy, deg(45), () => {
      polyline(ctx, [[0, -4], [28, 0], [0, 4]], { close: true, fill: C.magentaBright, stroke: C.redBright, width: 1.5 });
    });
    const flickOn = T.p > 0.18 && T.p < 0.62 && Math.floor(T.t / 55) % 2 === 0;
    ctx.save();
    ctx.beginPath();
    ctx.rect(wx - 6, barY, 22, barH);
    ctx.clip();
    hatch(ctx, wx - 10, barY - 4, 32, barH + 8, {
      stroke: flickOn ? mix(C.blue, C.magenta, 0.6) : mix(C.blue, C.cyan, hash(Math.floor(T.t / 40))),
      gap: 2.4,
      width: 1.4,
      angle: deg(45 + (flickOn ? 18 : 0)),
    });
    ctx.restore();
  }),

  G('B5.19', 'AGT.STATE.CHECKPOINT', 2000, (ctx, T) => {
    const plantX = 58;
    const baseY = 96;
    const drop = T.p < 0.32 ? E.cubicIn(T.p / 0.32) : 1;
    const pinTop = lerp(8, 42, drop);
    const unfurl = T.p < 0.32 ? 0 : T.p < 0.62 ? (T.p - 0.32) / 0.3 : 1;
    const bounce = T.p > 0.62 && T.p < 0.78 ? Math.sin((T.p - 0.62) / 0.16 * Math.PI) * 3 : 0;
    const flagCol = mix(C.cyan, C.slate, 0.35);
    line(ctx, 18, baseY, 110, baseY, { stroke: C.greyMid, width: 2 });
    line(ctx, plantX, baseY - 5, plantX, baseY + 5, { stroke: C.greyLight, width: 2.2 });
    line(ctx, plantX, pinTop - bounce, plantX, baseY, { stroke: C.greyLight, width: 2.2 });
    if (unfurl > 0.02) {
      const fw = 22 * unfurl;
      polyline(ctx, [
        [plantX, pinTop - bounce],
        [plantX + fw, pinTop + 6 - bounce],
        [plantX + fw, pinTop + 16 - bounce],
        [plantX, pinTop + 22 - bounce],
      ], { close: true, fill: flagCol, stroke: flagCol, width: 1.4 });
      if (unfurl > 0.7) {
        line(ctx, plantX + 6, pinTop + 8 - bounce, plantX + 6, pinTop + 16 - bounce, { stroke: C.white, width: 1.6 });
        line(ctx, plantX + 6, pinTop + 12 - bounce, plantX + 14, pinTop + 12 - bounce, { stroke: C.white, width: 1.6 });
      }
    }
  }),

  G('B5.20', 'AGT.TASK.LOOP_DETECTED', 1800, (ctx, T) => {
    const r = 26;
    const rotA = T.p * Math.PI * 2;
    const flash = T.p > 0.88;
    at(ctx, CX, CY, rotA, () => {
      for (let i = 0; i < 4; i++) {
        const a0 = i * (Math.PI / 2) + 0.12;
        const a1 = (i + 1) * (Math.PI / 2) - 0.12;
        arc(ctx, 0, 0, r, a0, a1, { stroke: C.orange, width: 2.6 });
      }
      const a = Math.PI * 2 - 0.12;
      const rr = r + 2;
      arrow(
        ctx,
        Math.cos(a - 0.35) * r,
        Math.sin(a - 0.35) * r,
        Math.cos(a) * rr,
        Math.sin(a) * rr,
        { stroke: flash ? C.white : C.orange, width: 2.4, head: 7 },
      );
    });
    const ticks = 1 + Math.floor(T.p * 3.01);
    for (let i = 0; i < ticks; i++) {
      const a = deg(-90) + i * deg(18);
      line(
        ctx,
        CX + Math.cos(a) * (r + 4),
        CY + Math.sin(a) * (r + 4),
        CX + Math.cos(a) * (r + 8),
        CY + Math.sin(a) * (r + 8),
        { stroke: C.greyLight, width: 1.6 },
      );
    }
  }),

  G('B5.21', 'AGT.MEM.CONFLICT', 1800, (ctx, T) => {
    memZipper(ctx, T, { round: 0, yA: 44, yB: 80, w: 62, amp: 6 });
  }),

  G('B5.22', 'AGT.MEMORY.CONFLICT', 1800, (ctx, T) => {
    memZipper(ctx, T, { round: 7, yA: 42, yB: 84, w: 68, amp: 5, ghost: true, split: 3.6 });
  }),

  G('B5.23', 'AGT.CTX.BUDGET_EXCEEDED', 1800, (ctx, T) => {
    const n = 5;
    const cw = 14;
    const x0 = 18;
    const y = 54;
    const filled = T.p < 0.55 ? Math.min(n, Math.floor((T.p / 0.55) * n) + 1) : n;
    const cool = mix(C.cool, C.grey, 0.35);
    for (let i = 0; i < n; i++) {
      rect(ctx, x0 + i * (cw + 3), y, cw, 20, {
        stroke: cool,
        fill: i < filled ? cool : null,
        width: 1.6,
      });
    }
    const limitX = x0 + n * (cw + 3) - 3;
    line(ctx, limitX, y - 4, limitX, y + 24, { stroke: C.white, width: 1.6 });
    line(ctx, limitX + 3, y - 4, limitX + 3, y + 24, { stroke: C.black, width: 1.6 });
    if (T.p > 0.58) {
      const punch = T.p < 0.7 ? (T.p < 0.64 ? 1.18 : 1.0) : 1;
      at(ctx, limitX + 14, y + 10, 0, () => {
        ctx.scale(punch, punch);
        rect(ctx, -7, -10, 14, 20, { fill: C.cool, stroke: C.cool, width: 1.5 });
      });
    }
  }),

  G('B5.24', 'AGT.EPISTEMIC.LOW_CONFIDENCE', 1800, (ctx, T) => {
    const breath = 1 + 0.12 * Math.sin(T.p * Math.PI * 2);
    const haloR = 32 * breath;
    const haloCol = mix(C.violet, C.grey, 0.55);
    circle(ctx, CX, CY, haloR, {
      stroke: haloCol,
      width: 1.8,
      dash: [4, 5],
      dashOffset: -T.p * 36,
      fill: null,
    });
    circle(ctx, CX, CY, 7, { fill: C.violet, stroke: C.violet });
  }),

  G('B5.25', 'AGT.BUDGET.LIMIT', 1800, (ctx, T) => {
    const x0 = 22;
    const x1 = 98;
    const y = 64;
    line(ctx, x0, y, x1, y, { stroke: C.greyMid, width: 2 });
    rect(ctx, x1 - 3, y - 16, 7, 32, { fill: C.yellow, stroke: C.yellow });
    const kiss = T.p < 0.45 ? E.sineOut(T.p / 0.45) : 1;
    const osc = T.p > 0.45 ? Math.sin((T.p - 0.45) * Math.PI * 10) * 1.2 : 0;
    const cx = lerp(x0 + 8, x1 - 10, kiss) + osc;
    rect(ctx, cx - 6, y - 6, 12, 12, { fill: C.amber, stroke: C.amber });
  }),

  G('B5.26', 'AGT.CONSTRAINT.CONFLICT', 1800, (ctx, T) => {
    const travel = 10 * E.sineInOut(pingpong(T.p));
    const hCol = '#E6A03C';
    const vCol = '#C6D94A';
    line(ctx, 16 + travel, CY, 112 - travel, CY, { stroke: hCol, width: 3.2 });
    line(ctx, CX, 16 + travel, CX, 112 - travel, { stroke: vCol, width: 3.2 });
    const xs = 1 + 0.15 * (0.5 + 0.5 * Math.sin(T.p * Math.PI * 2));
    at(ctx, CX, CY, 0, () => {
      ctx.scale(xs, xs);
      xMark(ctx, 0, 0, 7, { stroke: C.greyLight, width: 2.4 });
    });
  }),

  G('B5.27', 'AGT.HANDOFF.OUT', 2000, (ctx, T) => {
    const dock = 28;
    const gap0 = 62;
    const gap1 = 74;
    const exitX = 124;
    const gone = T.p > 0.58;
    rect(ctx, dock - 8, CY - 8, 16, 16, {
      stroke: gone ? mix(C.teal, C.greyDark, 0.55) : C.teal,
      fill: gone ? null : withAlpha(C.teal, 0.15),
      width: 2,
    });
    line(ctx, dock + 8, CY, gap0, CY, { stroke: C.teal, width: 2.2 });
    line(ctx, gap1, CY, 108, CY, { stroke: C.teal, width: 2.2 });
    chevron(ctx, 112, CY, 9, { stroke: C.teal, width: 2.2 });
    if (!gone) {
      const tokX = T.p < 0.58 ? lerp(dock, exitX, E.quadIn(T.p / 0.58)) : exitX;
      if (tokX < 122) rect(ctx, tokX - 5, CY - 5, 10, 10, { fill: C.teal, stroke: C.teal });
    }
  }),

  G('B5.28', 'AGT.ACTION.COMMITTED', 1800, (ctx, T) => {
    const stamp = T.p < 0.22 ? lerp(1.15, 1, E.quadOut(T.p / 0.22)) : 1;
    const under = T.p < 0.08 ? 0 : T.p < 0.4 ? E.quadOut((T.p - 0.08) / 0.32) : 1;
    const s = 20;
    const notch = 7;
    at(ctx, CX, CY - 2, 0, () => {
      ctx.scale(stamp, stamp);
      ctx.beginPath();
      ctx.moveTo(-s, -s);
      ctx.lineTo(s - notch, -s);
      ctx.lineTo(s, -s + notch);
      ctx.lineTo(s, s);
      ctx.lineTo(-s, s);
      ctx.closePath();
      ctx.fillStyle = C.greenGo;
      ctx.fill();
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    const uw = (s * 2 * 1.4) * under;
    line(ctx, CX - uw / 2, CY + s + 6, CX + uw / 2, CY + s + 6, { stroke: mix(C.greenGo, C.black, 0.25), width: 3.2 });
  }),

  G('B5.29', 'AGT.CONTROL.SELF_CORRECTION', 2000, (ctx, T) => {
    const start = [22, 86];
    const hook = [64, 32];
    const target = [96, 62];
    const col = mix(C.cyan, C.slate, 0.25);
    const dim = mix(col, C.greyDark, 0.45);
    line(ctx, target[0] - 8, target[1], target[0] + 8, target[1], { stroke: C.greyMid, width: 1.5 });
    line(ctx, target[0], target[1] - 8, target[0], target[1] + 8, { stroke: C.greyMid, width: 1.5 });
    circle(ctx, hook[0], hook[1], 3, { fill: dim, stroke: dim });
    circle(ctx, target[0], target[1], 3.2, { fill: col, stroke: col });
    let errT = 0;
    let fixT = 0;
    let notch = false;
    if (T.p < 0.28) errT = clamp(T.p / 0.22);
    else if (T.p < 0.36) errT = 1;
    else if (T.p < 0.48) {
      errT = 1;
      fixT = 0;
    } else if (T.p < 0.78) {
      errT = 1;
      fixT = E.cubicIn((T.p - 0.48) / 0.3);
    } else {
      errT = 1;
      fixT = 1;
      notch = true;
    }
    partialPoly(ctx, [start, hook], errT, { stroke: dim, width: 2.2 });
    if (fixT > 0.02) partialPoly(ctx, [hook, target], fixT, { stroke: col, width: 2.6 });
    if (notch) {
      const mx = lerp(hook[0], target[0], 0.55);
      const my = lerp(hook[1], target[1], 0.55);
      const angA = Math.atan2(target[1] - hook[1], target[0] - hook[0]);
      line(
        ctx,
        mx + Math.cos(angA + Math.PI / 2) * 4,
        my + Math.sin(angA + Math.PI / 2) * 4,
        mx - Math.cos(angA + Math.PI / 2) * 2,
        my - Math.sin(angA + Math.PI / 2) * 2,
        { stroke: col, width: 2 },
      );
    }
  }),
];

module.exports = glyphs;
