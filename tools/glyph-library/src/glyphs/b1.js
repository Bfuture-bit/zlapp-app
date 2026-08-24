'use strict';

const H = require('../lib/helpers');
const {
  C, E, CX, CY, SIZE,
  layer, at, line, polyline, circle, arc, rect, ellipse, hexagon, diamond, triangle,
  arrow, chevron, xMark, check, hatch, wrench, hourglass, lock, flag, documentIcon, human,
  isoCube, text, glowCircle, lerp, clamp, mix, withAlpha, deg, hash, pingpong, u,
} = H;

const SRC = 'Muse Spark';

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

function dashedCircle(ctx, x, y, r, o = {}) {
  circle(ctx, x, y, r, { stroke: o.stroke || C.slate, width: o.width || 1.8, dash: o.dash || [2.5, 2.5], dashOffset: o.dashOffset, alpha: o.alpha });
}

const glyphs = [
  G('B1.01', 'AGT.TOOL.SCHEMA_MISMATCH', 1800, (ctx, T) => {
    const { p, E: e } = T;
    let pegX = 78;
    if (p < 0.35) pegX = lerp(82, 66, e.elasticOut(p / 0.35));
    else if (p < 0.53) {
      const j = (p - 0.35) / 0.18;
      pegX = 66 + Math.sin(j * Math.PI * 6) * 2.2;
    } else {
      pegX = lerp(66, 82, e.elasticOut((p - 0.53) / 0.47));
    }
    rect(ctx, 28, 48, 22, 32, { radius: 2, stroke: C.greyDark, width: 2 });
    circle(ctx, 39, 64, 10, { stroke: C.grey, width: 2 });
    at(ctx, pegX, 64, 0, () => {
      hexagon(ctx, 0, 0, 11, { stroke: C.amber, width: 2.2, fill: withAlpha(C.amber, 0.12) });
    });
    xMark(ctx, (39 + pegX) / 2 + 2, 64, 5, { stroke: withAlpha(C.amber, 0.85), width: 2.2 });
  }),

  G('B1.02', 'AGT.TOOL.WAIT', 1200, (ctx, T) => {
    const op = lerp(0.35, 1, 0.5 + 0.5 * Math.sin(T.p * Math.PI * 2));
    dashedCircle(ctx, CX, CY, 24, { stroke: C.slate, dash: [3, 3] });
    wrench(ctx, CX, CY + 1, { rot: deg(-45), scale: 1.05, stroke: C.slate, width: 2.2 });
    ctx.save();
    ctx.globalAlpha = op;
    rect(ctx, CX - 8, CY - 10, 5, 20, { radius: 1, fill: C.slate, stroke: null });
    rect(ctx, CX + 3, CY - 10, 5, 20, { radius: 1, fill: C.slate, stroke: null });
    ctx.restore();
  }),

  G('B1.03', 'AGT.MEM.CONFLICT', 1500, (ctx, T) => {
    const alt = T.p < 0.5 ? T.p / 0.5 : (T.p - 0.5) / 0.5;
    const a = T.p < 0.5 ? 1 : -1;
    const rec = Math.sin(alt * Math.PI) * 2;
    const flash = (T.t % 1500 < 200) || (Math.abs(alt - 0.5) < 0.08);
    at(ctx, CX - 4 - rec * a, CY - 2, deg(-15), () => {
      for (let i = 0; i < 3; i++) rect(ctx, -18, -12 + i * 8, 28, 5, { radius: 1, stroke: C.teal, width: 1.8, fill: withAlpha(C.teal, 0.15) });
    });
    at(ctx, CX + 4 + rec * a, CY + 2, deg(15), () => {
      for (let i = 0; i < 3; i++) rect(ctx, -10, -12 + i * 8, 28, 5, { radius: 1, stroke: C.magenta, width: 1.8, fill: withAlpha(C.magenta, 0.15) });
    });
    ctx.save();
    ctx.beginPath();
    ctx.rect(CX - 10, CY - 10, 20, 20);
    ctx.clip();
    hatch(ctx, CX - 10, CY - 10, 20, 20, { stroke: mix(C.teal, C.magenta, 0.5), gap: 3.5, width: 1 });
    ctx.restore();
    diamond(ctx, CX, CY, 8, { stroke: flash ? C.yellow : C.amber, fill: flash ? withAlpha(C.yellow, 0.55) : withAlpha(C.amber, 0.2), width: 2 });
    text(ctx, '!', CX, CY + 1, { size: 11, fill: flash ? C.bg : C.yellow });
  }),

  G('B1.04', 'AGT.TASK.UNDERSPECIFIED', 2000, (ctx, T) => {
    const dashOff = -T.p * 24;
    rect(ctx, 30, 34, 68, 52, { radius: 8, stroke: C.greyLight, width: 2, dash: [6, 4], dashOffset: dashOff });
    line(ctx, 38, 86, 90, 86, { stroke: withAlpha(C.amber, 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(T.p * Math.PI * 4))), width: 2, dash: [4, 4] });
    const corners = [[34, 38], [94, 38], [34, 82]];
    for (const [x, y] of corners) circle(ctx, x, y, 3, { fill: C.greyLight, stroke: null });
    circle(ctx, 94, 82, 3.2, { stroke: C.amber, width: 1.6, dash: [1.5, 1.5] });
    for (let i = 0; i < 18; i++) {
      const on = hash(i + Math.floor(T.t / 90)) > 0.35;
      const a = (i / 18) * Math.PI * 1.6 + 0.3;
      const r = i % 2 ? 7 : 3;
      const x = CX + Math.cos(a) * r * (i < 9 ? 0.2 : 1);
      const y = 58 + Math.sin(a) * r;
      if (i < 7) circle(ctx, CX + (i - 3) * 2.2, 52, 1.3, { fill: on ? C.amber : withAlpha(C.amber, 0.2), stroke: null });
      else circle(ctx, CX + Math.cos((i / 10) * Math.PI) * 6, 62 + (i - 10) * 1.4, 1.3, { fill: on ? C.amber : withAlpha(C.amber, 0.2), stroke: null });
    }
  }),

  G('B1.05', 'AGT.EVIDENCE.CONFLICT', 2000, (ctx, T) => {
    const tilt = Math.sin(T.p * Math.PI * 2 * (2000 / 800) * 0.4) * deg(15);
    const t2 = Math.sin(E.sineInOut(pingpong(T.p * 2.5)) * Math.PI) * deg(15);
    const angA = t2;
    const glow = Math.abs(angA) > deg(12);
    at(ctx, CX, 48, 0, () => {
      line(ctx, 0, 0, 0, 28, { stroke: C.grey, width: 2.4 });
      at(ctx, 0, 28, angA, () => {
        line(ctx, -32, 0, 32, 0, { stroke: C.greyLight, width: 2.5 });
        line(ctx, -32, 0, -32, 10, { stroke: C.grey, width: 2 });
        line(ctx, 32, 0, 32, 10, { stroke: C.grey, width: 2 });
        const vib = Math.sin(T.t / 40) * 1.2;
        at(ctx, -32, 18 + vib, 0, () => {
          documentIcon(ctx, 0, 0, { scale: 0.85, stroke: C.cyan });
          arrow(ctx, 0, 8, 0, -6, { stroke: C.cyan, width: 1.6, head: 5 });
        });
        at(ctx, 32, 18 - vib, 0, () => {
          documentIcon(ctx, 0, 0, { scale: 0.85, stroke: C.orange });
          arrow(ctx, 0, -6, 0, 8, { stroke: C.orange, width: 1.6, head: 5 });
        });
      });
      line(ctx, 0, 28, 0, 42, { stroke: glow ? C.red : withAlpha(C.red, 0.45), width: glow ? 2.4 : 1.6 });
    });
    polyline(ctx, [[CX - 16, 96], [CX, 88], [CX + 16, 96]], { stroke: C.grey, width: 2, close: false });
  }),

  G('B1.06', 'AGT.TOOL.WAITING', 1000, (ctx, T) => {
    const rotA = T.p * Math.PI * 2;
    wrench(ctx, CX, CY, { rot: deg(-40), scale: 0.95, stroke: C.cyan, width: 2.2 });
    at(ctx, CX, CY, rotA, () => {
      arc(ctx, 0, 0, 28, deg(-45), deg(225), { stroke: C.cyan, width: 3.2 });
    });
    for (let i = 0; i < 4; i++) {
      const a = deg(-90 + i * 90);
      line(ctx, CX + Math.cos(a) * 24, CY + Math.sin(a) * 24, CX + Math.cos(a) * 30, CY + Math.sin(a) * 30, { stroke: C.cyan, width: 2 });
    }
    line(ctx, CX, 28, CX, 34, { stroke: C.white, width: 2.4 });
  }),

  G('B1.07', 'AGT.PLAN.REVISE', 2500, (ctx, T) => {
    const pts = [[28, 80], [56, 48], [96, 40]];
    const p = T.p;
    polyline(ctx, pts, { stroke: C.grey, width: 2.2 });
    circle(ctx, 28, 80, 4.5, { fill: C.grey, stroke: C.grey });
    rect(ctx, 51, 43, 10, 10, { stroke: C.grey, fill: C.greyDark, width: 1.6 });
    circle(ctx, 96, 40, 4.5, { fill: C.grey, stroke: C.grey });
    let oldA = 1;
    let newLen = 0;
    if (p < 0.12) oldA = 1;
    else if (p < 0.24) oldA = 1;
    else if (p < 0.48) {
      oldA = lerp(1, 0.35, (p - 0.24) / 0.24);
      newLen = E.quadOut((p - 0.24) / 0.24);
    } else {
      oldA = 0.35;
      newLen = 1;
    }
    ctx.save();
    ctx.globalAlpha = oldA;
    line(ctx, 56, 48, 96, 40, { stroke: C.grey, width: 2, dash: p > 0.2 ? [3, 3] : null });
    ctx.restore();
    const nx = lerp(56, 100, newLen);
    const ny = lerp(48, 88, newLen);
    if (newLen > 0.02) {
      arrow(ctx, 56, 48, nx, ny, { stroke: C.electric, width: 2.2, head: 7 });
    }
    const scrub = p < 0.12 ? (p / 0.12) : 0;
    const ex = lerp(56, 88, scrub || 0.15);
    const ey = lerp(48, 42, scrub || 0.15);
    at(ctx, ex, ey - 6, deg(-20), () => {
      rect(ctx, -6, -4, 12, 8, { radius: 1, fill: C.pink, stroke: C.pink });
      polyline(ctx, [[-6, 4], [-3, 8], [0, 4], [3, 8], [6, 4]], { stroke: C.pink, width: 1.4 });
    });
    if (p > 0.85) circle(ctx, 56, 48, 5 + (p - 0.85) * 20, { stroke: withAlpha(C.electric, 0.4), width: 1.2 });
  }),

  G('B1.08', 'AGT.STATE.ROLLBACK', 2000, (ctx, T) => {
    const ticks = [28, 48, 68, 88];
    line(ctx, 22, 72, 104, 72, { stroke: C.grey, width: 2 });
    ticks.forEach((x, i) => line(ctx, x, 66, x, 78, { stroke: C.grey, width: 2 }));
    flag(ctx, ticks[1], 62, { scale: 0.7, fill: C.green, stroke: C.green });
    let mx = ticks[3];
    let arrowP = 0;
    if (T.p < 0.2) mx = ticks[3];
    else if (T.p < 0.4) {
      arrowP = E.cubicIn((T.p - 0.2) / 0.2);
    } else if (T.p < 0.7) {
      arrowP = 1;
      const k = E.cubicIn((T.p - 0.4) / 0.3);
      mx = lerp(ticks[3], ticks[1], k);
    } else {
      mx = ticks[1];
      if (T.p < 0.78) glowCircle(ctx, ticks[1], 72, 10, C.green, 0.45);
    }
    ctx.beginPath();
    ctx.moveTo(ticks[3], 60);
    ctx.quadraticCurveTo(58, 28, ticks[1], 54);
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([]);
    ctx.stroke();
    if (arrowP > 0.05) {
      const t = arrowP;
      const x = lerp(ticks[3], ticks[1], t);
      const y = lerp(60, 54, t) - Math.sin(t * Math.PI) * 32;
      arrow(ctx, x + 4, y + 2, x - 2, y + 6, { stroke: C.gold, width: 2, head: 6 });
    }
    circle(ctx, mx, 72, 4.5, { fill: C.gold, stroke: C.gold });
  }),

  G('B1.09', 'AGT.SPEC.GAP', 1800, (ctx, T) => {
    const cells = [];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) cells.push({ x: 38 + c * 22, y: 48 + r * 22, empty: r === 1 && c === 2 });
    for (let i = 0; i < cells.length; i++) {
      const a = cells[i];
      const b = cells[i + 1];
      if (b && Math.abs(a.y - b.y) < 1 && !b.empty && !a.empty) line(ctx, a.x + 8, a.y, b.x - 8, b.y, { stroke: C.grey, width: 1.6 });
      if (i < 3) line(ctx, cells[i].x, cells[i].y + 8, cells[i + 3].x, cells[i + 3].y - 8, { stroke: C.grey, width: 1.6, dash: cells[i + 3].empty ? [2, 2] : null });
    }
    const pulseAt = clamp((T.p - 0.1) / 0.55);
    cells.forEach((cell, i) => {
      const hit = pulseAt * 5;
      const glow = !cell.empty && i <= hit && i > hit - 1.2;
      if (cell.empty) {
        rect(ctx, cell.x - 8, cell.y - 8, 16, 16, { radius: 2, stroke: C.amber, width: 2.2, dash: [3, 2] });
        if (T.p > 0.62) {
          const k = (T.p - 0.62) / 0.2;
          circle(ctx, cell.x, cell.y, 8 + k * 10, { stroke: withAlpha(C.amber, 1 - k), width: 1.8 });
        }
      } else {
        rect(ctx, cell.x - 8, cell.y - 8, 16, 16, { radius: 2, stroke: C.grey, fill: glow ? withAlpha(C.teal, 0.35) : withAlpha(C.grey, 0.2), width: 1.8 });
      }
    });
    arrow(ctx, cells[2].x, cells[5].y - 18, cells[5].x - 10, cells[5].y - 8, { stroke: C.amber, width: 1.8, head: 5 });
  }, { status: 'revised', concept: 'Knowledge gap / missing information' }),

  G('B1.10', 'AGT.BUDGET.EXHAUST', 1800, (ctx, T) => {
    const drop = T.p < 0.44 ? E.expoIn(T.p / 0.44) : 1;
    const level = 1 - drop;
    const shake = T.p > 0.44 && T.p < 0.5 ? Math.sin((T.p - 0.44) * 80) * 2 : 0;
    at(ctx, CX + shake, CY, 0, () => {
      rect(ctx, -14, -28, 28, 56, { radius: 4, stroke: C.grey, width: 2 });
      for (let i = 0; i < 5; i++) {
        const y = 18 - i * 10;
        const filled = level * 5 > i;
        const col = i === 0 ? C.red : i < 2 ? C.amber : C.green;
        rect(ctx, -10, y - 3, 20, 7, { radius: 1, stroke: filled ? col : C.grey, fill: filled ? col : null, width: 1.5 });
      }
      text(ctx, '$0', 0, -36, { size: 10, fill: C.greyLight });
      if (T.p > 0.5) {
        const s = clamp((T.p - 0.5) / 0.15);
        line(ctx, -16, -24, lerp(-16, 16, s), lerp(-24, 24, s), { stroke: C.red, width: 2.4 });
      }
    });
  }),

  G('B1.11', 'AGT.EXEC.SANDBOXED', 2000, (ctx, T) => {
    const bob = Math.sin(T.p * Math.PI * 2) * 6;
    const pulse = 0.6 + 0.4 * Math.sin(T.p * Math.PI * 2 * (2000 / 1500));
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.4 * pulse;
    isoCube(ctx, CX, 42, 22, { stroke: C.orange, dash: [4, 3], width: 1.8 });
    ctx.restore();
    isoCube(ctx, CX, 42, 22, { stroke: withAlpha(C.orange, 0.9), dash: [4, 3], width: 1.8 });
    const locks = [[36, 28], [92, 28], [40, 78], [88, 78]];
    locks.forEach(([x, y]) => lock(ctx, x, y, { scale: 0.45, stroke: C.orange }));
    at(ctx, CX, 58 + bob, 0, () => {
      isoCube(ctx, 0, -8, 10, { stroke: C.cyan, width: 1.6, top: withAlpha(C.cyan, 0.15) });
      triangle(ctx, 0, 2, 6, { fill: C.cyan, stroke: C.cyan, rot: deg(90) });
    });
  }),

  G('B1.12', 'AGT.SELF.CORRECT', 2200, (ctx, T) => {
    const p = T.p;
    polyline(ctx, [[24, 70], [70, 40]], { stroke: withAlpha(C.grey, 0.35), width: 2 });
    arrow(ctx, 24, 70, 70, 40, { stroke: withAlpha(C.grey, 0.3), width: 1.8, head: 6 });
    let end = [40, 62];
    if (p < 0.09) end = [lerp(24, 52, p / 0.09), lerp(70, 52, p / 0.09)];
    else if (p < 0.27) {
      const k = E.backInOut((p - 0.09) / 0.18);
      const a = lerp(0, Math.PI * 0.9, k);
      end = [52 + Math.cos(Math.PI * 0.2 - a) * 22, 52 + Math.sin(Math.PI * 0.2 - a) * 16];
    } else {
      const k = clamp((p - 0.27) / 0.27);
      end = [lerp(48, 96, k), lerp(68, 44, k)];
    }
    arrow(ctx, 24, 70, end[0], end[1], { stroke: C.teal, width: 2.4, head: 7 });
    if (p > 0.4 && p < 0.55) {
      hatch(ctx, 40, 36, 36, 24, { stroke: C.grey, gap: 4, width: 1.2, alpha: 0.5 });
    }
    if (p > 0.58) check(ctx, 100, 40, 8, { stroke: C.green, width: 2.4 });
  }),

  G('B1.13', 'AGT.INJECT.SUSPECT', 1600, (ctx, T) => {
    polyline(ctx, [[70, 36], [96, 50], [88, 92], [52, 92], [44, 50]], { close: true, stroke: C.grey, width: 2, fill: withAlpha(C.grey, 0.08) });
    const pulse = T.p < 0.45 ? Math.floor(T.p / 0.15) : 2;
    const inset = (pulse % 2 === 0 && T.p < 0.45) ? 2 : 0;
    at(ctx, 34 + inset, 44 + inset, deg(35), () => {
      rect(ctx, -4, -18, 8, 22, { radius: 1, fill: C.lime, stroke: C.lime });
      line(ctx, 0, 4, 0, 22, { stroke: C.lime, width: 2.4 });
      rect(ctx, -6, -22, 12, 6, { fill: C.lime, stroke: C.lime });
    });
    for (let i = 0; i < 8; i++) {
      const a = hash(i) * 6;
      circle(ctx, 58 + hash(i + 2) * 10, 58 + hash(i + 4) * 8, 1.2, { fill: C.lime, stroke: null, alpha: 0.7 });
    }
    const flash = T.p > 0.45 && Math.floor(T.t / 200) % 2 === 0;
    triangle(ctx, 72, 58, 12, { stroke: flash ? C.redBright : C.red, fill: flash ? C.redBright : withAlpha(C.red, 0.2), width: 2 });
    text(ctx, '!', 72, 61, { size: 12, fill: C.white });
  }),

  G('B1.14', 'AGT.STATE.STALE', 3000, (ctx, T) => {
    circle(ctx, CX, 58, 26, { stroke: C.sepia, width: 2.2 });
    const jitter = (Math.floor(T.t / 1500) !== Math.floor((T.t - 50) / 1500)) ? (hash(T.t) - 0.5) * 8 : 0;
    line(ctx, CX, 58, CX + Math.cos(deg(-60) + jitter * 0.02) * 16, 58 + Math.sin(deg(-60)) * 16, { stroke: C.sepia, width: 2.4 });
    line(ctx, CX, 58, CX + Math.cos(deg(-60)) * 11, 58 + Math.sin(deg(-60)) * 11, { stroke: C.sepia, width: 2 });
    line(ctx, CX, 58, CX + 2, 70, { stroke: C.sepia, width: 1.5 });
    polyline(ctx, [[40, 40], [48, 36], [52, 44]], { stroke: withAlpha(C.dust, 0.7), width: 1.2 });
    polyline(ctx, [[84, 40], [90, 34], [94, 42]], { stroke: withAlpha(C.dust, 0.7), width: 1.2 });
    for (let i = 0; i < 10; i++) {
      const y = ((T.p + hash(i)) % 1) * 90 + 20;
      circle(ctx, 30 + hash(i + 3) * 70, y, 1.1, { fill: C.dust, stroke: null, alpha: 0.7 });
    }
    polyline(ctx, [[86, 86], [108, 86], [108, 110], [86, 110]], { stroke: C.sepia, fill: withAlpha(C.sepia, 0.15), width: 1.5 });
    polyline(ctx, [[108, 86], [100, 94], [108, 100]], { fill: withAlpha(C.dust, 0.4), stroke: C.sepia, width: 1 });
  }),

  G('B1.15', 'AGT.EXEC.PARTIAL', 2000, (ctx, T) => {
    line(ctx, 20, 64, 108, 64, { stroke: C.grey, width: 2, dash: [3, 3] });
    const capX = 70;
    line(ctx, 20, 64, capX, 64, { stroke: C.teal, width: 3 });
    circle(ctx, 20, 64, 4.5, { fill: C.teal, stroke: C.teal });
    circle(ctx, 108, 64, 5, { stroke: C.grey, width: 2 });
    line(ctx, capX, 56, capX, 72, { stroke: C.amber, width: 3 });
    line(ctx, capX - 4, 56, capX - 4, 72, { stroke: C.amber, width: 3 });
    let px = 20;
    if (T.p < 0.45) px = lerp(20, capX - 2, E.quadOut(T.p / 0.45));
    else if (T.p < 0.55) px = capX - 2 - Math.sin((T.p - 0.45) * 30) * 1.5;
    else px = capX - 2;
    circle(ctx, px, 64, 4, { fill: C.amber, stroke: C.white, width: 1 });
  }, { status: 'revised', concept: 'Partial progress / paused incomplete' }),

  G('B1.16', 'AGT.RATE.LIMIT', 1400, (ctx, T) => {
    arc(ctx, CX - 6, 78, 36, Math.PI, 0, { stroke: C.greyDark, width: 3 });
    arc(ctx, CX - 6, 78, 36, Math.PI, Math.PI + Math.PI * 0.8, { stroke: C.green, width: 3 });
    const lim = Math.PI + Math.PI * 0.8;
    const nA = Math.PI + Math.PI * 0.85 + Math.sin(T.t / 50) * 0.06;
    line(ctx, CX - 6 + Math.cos(lim) * 28, 78 + Math.sin(lim) * 28, CX - 6 + Math.cos(lim) * 40, 78 + Math.sin(lim) * 40, { stroke: C.red, width: 2.5 });
    line(ctx, CX - 6, 78, CX - 6 + Math.cos(nA) * 30, 78 + Math.sin(nA) * 30, { stroke: C.amber, width: 2.4 });
    circle(ctx, CX - 6, 78, 3, { fill: C.white, stroke: null });
    const cascade = (T.t % 600) / 600;
    for (let i = 0; i < 3; i++) {
      const on = cascade > i / 3 && cascade < (i + 1) / 3 + 0.2;
      rect(ctx, 100, 78 - i * 12, 14, 8, { radius: 1, fill: on ? C.amber : null, stroke: C.amber, width: 1.5 });
    }
  }),

  G('B1.17', 'AGT.EXEC.RETRY', 1500, (ctx, T) => {
    const spin = T.p < 0.47 ? E.cubicInOut(T.p / 0.47) : 1;
    at(ctx, CX, CY, spin * Math.PI * 2, () => {
      arc(ctx, 0, 0, 22, deg(-20), deg(250), { stroke: C.blue, width: 3 });
      const a = deg(250);
      arrow(ctx, Math.cos(a - 0.2) * 22, Math.sin(a - 0.2) * 22, Math.cos(a) * 22, Math.sin(a) * 22, { stroke: C.blue, width: 2.5, head: 7 });
    });
    circle(ctx, CX, CY, 4, { fill: C.blue, stroke: null });
    const pop = T.p > 0.55 && T.p < 0.65 ? 1 + E.backOut((T.p - 0.55) / 0.1) * 0.25 : 1;
    at(ctx, 92, 92, 0, () => {
      ctx.scale(pop, pop);
      rect(ctx, -12, -8, 24, 16, { radius: 3, fill: C.orangeDeep, stroke: C.orangeDeep });
      text(ctx, 'x3', 0, 1, { size: 10, fill: C.bg });
    });
  }),

  G('B1.18', 'AGT.DELEGATE.FANOUT', 1800, (ctx, T) => {
    const pulse = T.p < 0.12 ? 1 + Math.sin(T.p / 0.12 * Math.PI) * 0.2 : 1;
    hexagon(ctx, CX, CY, 10 * pulse, { fill: C.indigo, stroke: C.indigo });
    const n = 5;
    for (let i = 0; i < n; i++) {
      const a = deg(-90 + i * 72);
      const delay = 0.12 + i * 0.08 / 1.8;
      const drawP = clamp((T.p - delay) / 0.22);
      const x2 = CX + Math.cos(a) * 34 * drawP;
      const y2 = CY + Math.sin(a) * 34 * drawP;
      if (drawP > 0) line(ctx, CX + Math.cos(a) * 10, CY + Math.sin(a) * 10, x2, y2, { stroke: mix(C.indigo, C.teal, drawP), width: 1.4 + drawP });
      if (drawP > 0.85) circle(ctx, CX + Math.cos(a) * 38, CY + Math.sin(a) * 38, 4, { fill: C.teal, stroke: C.teal });
    }
  }),

  G('B1.19', 'AGT.HUMAN.PERMISSION_GATED', 2000, (ctx, T) => {
    human(ctx, 44, 64, { scale: 0.95, stroke: C.human });
    const closed = T.p < 0.15 ? E.quadOut(T.p / 0.15) : 1;
    const barH = 52 * closed;
    for (let i = 0; i < 4; i++) {
      rect(ctx, 62 + i * 8, 40 + (52 - barH) / 2, 4, barH, { fill: C.greyDark, stroke: C.greyDark });
    }
    const click = T.p > 0.15 && T.p < 0.2 ? 1.2 : 1;
    at(ctx, 86, 48, 0, () => {
      ctx.scale(click, click);
      lock(ctx, 0, 0, { scale: 0.7, stroke: C.red });
    });
    const bump = T.p > 0.35 && T.p < 0.55 ? Math.sin((T.p - 0.35) * Math.PI * 4) * 3 : 0;
    polyline(ctx, [[54 + bump, 70], [62 + bump, 66], [62 + bump, 74]], { stroke: C.human, width: 2, close: true, fill: withAlpha(C.human, 0.4) });
  }),

  G('B1.20', 'AGT.TOOL.FAILURE', 1600, (ctx, T) => {
    const turn = T.p < 0.2 ? lerp(0, deg(15), T.p / 0.2) : T.p < 0.28 ? lerp(deg(15), 0, (T.p - 0.2) / 0.08) : 0;
    at(ctx, CX - 6, CY, deg(-40) + turn, () => {
      wrench(ctx, -6, 0, { rot: 0, scale: 1, stroke: C.steel });
      wrench(ctx, 10, 4, { rot: deg(18), scale: 0.7, stroke: C.steel });
    });
    if (T.p > 0.2) {
      line(ctx, CX - 4, CY - 2, CX + 6, CY + 8, { stroke: C.orange, width: 2 });
      if (T.p > 0.22 && T.p < 0.4) {
        for (let i = 0; i < 5; i++) {
          const a = deg(-40 + i * 25);
          line(ctx, CX, CY, CX + Math.cos(a) * 12, CY + Math.sin(a) * 12, { stroke: C.orange, width: 1.4 });
        }
      }
    }
    const xs = T.p > 0.35 ? E.backOut(clamp((T.p - 0.35) / 0.2)) : 0;
    if (xs > 0) {
      at(ctx, 92, 40, 0, () => {
        ctx.scale(xs, xs);
        circle(ctx, 0, 0, 12, { stroke: C.redPure, width: 2.5 });
        xMark(ctx, 0, 0, 6, { stroke: C.redPure, width: 2.5 });
      });
    }
  }),

  G('B1.21', 'AGT.TOOL.AWAIT', 1500, (ctx, T) => {
    const bob = Math.sin(T.p * Math.PI * 2) * 4;
    wrench(ctx, CX, 36 + bob, { rot: deg(-45), scale: 0.85, stroke: withAlpha(C.steel, 0.7) });
    hourglass(ctx, CX, 78, { scale: 0.85, sand: T.p, sandColor: C.sand, stroke: C.greyLight });
    line(ctx, 36, 108, 92, 108, { stroke: C.grey, width: 1.5, dash: [3, 3] });
  }),

  G('B1.22', 'AGT.EPISTEMIC.UNGROUNDED', 2000, (ctx, T) => {
    const fy = Math.sin(T.p * Math.PI * 2) * 8;
    const fx = Math.sin(T.p * Math.PI * 2 * 0.5) * 3;
    ellipse(ctx, CX + fx, 48 + fy, 22, 16, { stroke: C.cool, fill: withAlpha(C.cool, 0.12), width: 2 });
    text(ctx, '?', CX + fx, 48 + fy, { size: 16, fill: C.amber });
    const sway = Math.sin(T.p * Math.PI * 2) * 6;
    line(ctx, CX + fx, 64 + fy, CX + sway, 92, { stroke: C.grey, width: 1.6, dash: [2, 3] });
    line(ctx, CX + sway, 92, CX + sway + 4, 100, { stroke: C.grey, width: 1.6 });
    line(ctx, 28, 108, 54, 108, { stroke: C.grey, width: 2, dash: [4, 4], dashOffset: Math.sin(T.p * 20) * 2 });
    line(ctx, 74, 108, 100, 108, { stroke: C.grey, width: 2, dash: [4, 4] });
  }),

  G('B1.23', 'AGT.STATE.ROLLBACK', 2000, (ctx, T) => {
    circle(ctx, CX, CY, 28, { stroke: C.grey, width: 1.8 });
    const drawA = T.p < 0.25 ? E.quadOut(T.p / 0.25) : 1;
    arc(ctx, CX, CY, 28, Math.PI, Math.PI + Math.PI * 1.5 * drawA, { stroke: C.orange, width: 2.8, ccw: true });
    if (drawA > 0.9) {
      const a = Math.PI + Math.PI * 1.5;
      arrow(ctx, CX + Math.cos(a + 0.2) * 28, CY + Math.sin(a + 0.2) * 28, CX + Math.cos(a) * 28, CY + Math.sin(a) * 28, { stroke: C.orange, width: 2, head: 7 });
    }
    const blink = Math.floor(T.t / 180) % 2;
    triangle(ctx, CX - 8, CY, 7, { fill: blink ? C.orange : withAlpha(C.orange, 0.4), stroke: C.orange, rot: Math.PI });
    triangle(ctx, CX + 4, CY, 7, { fill: !blink ? C.orange : withAlpha(C.orange, 0.4), stroke: C.orange, rot: Math.PI });
    circle(ctx, CX, CY - 28, 4, { fill: C.green, stroke: C.green });
    if (T.p > 0.4 && T.p < 0.7) circle(ctx, CX, CY - 28, 4 + (T.p - 0.4) * 40, { stroke: withAlpha(C.green, 0.5), width: 1.5 });
  }),

  G('B1.24', 'AGT.CONSTRAINT.CONFLICT', 1400, (ctx, T) => {
    const push = T.p < 0.22 ? E.quadIn(T.p / 0.22) : T.p < 0.45 ? 1 - ((T.p - 0.22) / 0.23) * 0.6 : 0.4 + 0.1 * Math.sin(T.p * 10);
    const d = 4 * push;
    text(ctx, '[', 30 + d, CY, { size: 36, fill: C.red });
    text(ctx, ']', 98 - d, CY, { size: 36, fill: C.blue });
    const sc = 1 - 0.1 * push;
    at(ctx, CX, CY, 0, () => {
      ctx.scale(sc, 1);
      rect(ctx, -12, -14, 24, 28, { radius: 2, stroke: C.grey, fill: withAlpha(C.grey, 0.2), width: 2 });
    });
    if (push > 0.5) {
      line(ctx, CX - 6, CY - 8, CX + 6, CY - 12, { stroke: C.yellow, width: 1.4 });
      line(ctx, CX - 6, CY + 8, CX + 6, CY + 4, { stroke: C.yellow, width: 1.4 });
      xMark(ctx, 42, CY, 4, { stroke: C.red, width: 2 });
      xMark(ctx, 86, CY, 4, { stroke: C.blue, width: 2 });
    }
  }),

  G('B1.25', 'AGT.ACTION.COMMITTED', 1600, (ctx, T) => {
    const slam = T.p < 0.1 ? E.expoIn(T.p / 0.1) : 1;
    const y = lerp(20, 64, slam);
    const shake = T.p > 0.1 && T.p < 0.15 ? Math.sin(T.p * 200) * 2 : 0;
    at(ctx, CX + shake, y, 0, () => {
      rect(ctx, -28, -20, 56, 40, { radius: 3, stroke: C.ink, width: 3 });
      arrow(ctx, -18, 0, 16, 0, { stroke: C.ink, width: 3, head: 8 });
    });
    if (T.p > 0.12) {
      const ink = E.quadOut(clamp((T.p - 0.12) / 0.25));
      circle(ctx, CX, 64, 8 + ink * 22, { stroke: withAlpha(C.ink, 0.35 * (1 - ink * 0.5)), width: 6, fill: null });
      at(ctx, 40, 78, 0, () => lock(ctx, 0, 0, { scale: 0.55, stroke: C.bronze }));
      check(ctx, 86, 52, 8, { stroke: C.greenGo, width: 2.6 });
    }
  }, { loop: true }),

  G('B1.26', 'AGT.TOOL.RATE_LIMITED', 1600, (ctx, T) => {
    wrench(ctx, 44, CY, { rot: deg(-40), scale: 1, stroke: C.greyMid, width: 2 });
    const fill = T.p < 0.4 ? T.p / 0.4 : 1;
    const bounce = T.p > 0.4 && T.p < 0.5 ? Math.sin((T.p - 0.4) * 40) * 3 : 0;
    for (let i = 0; i < 3; i++) {
      const on = fill * 3 > i;
      const col = i === 2 ? C.red : i === 1 ? C.amber : C.green;
      rect(ctx, 78, 78 - i * 16 + (i === 2 ? bounce : 0), 18, 12, { radius: 1, fill: on ? col : null, stroke: col, width: 1.6 });
    }
    const dim = 0.45 + 0.25 * Math.sin(T.p * Math.PI * 2 * 3.2);
    circle(ctx, 96, 36, 8, { stroke: withAlpha(C.amber, dim), width: 1.8 });
    line(ctx, 96, 36, 96, 32, { stroke: C.amber, width: 1.5 });
    line(ctx, 96, 36, 100, 38, { stroke: C.amber, width: 1.5 });
  }),

  G('B1.27', 'AGT.GOAL.DRIFT', 2000, (ctx, T) => {
    circle(ctx, 48, 64, 22, { stroke: C.teal, width: 1.5, alpha: 0.5 + 0.2 * Math.sin(T.p * 6) });
    circle(ctx, 48, 64, 14, { stroke: C.teal, width: 1.5 });
    circle(ctx, 48, 64, 5, { fill: C.teal, stroke: C.teal });
    const k = E.quadIn(T.p);
    const x = lerp(48, 96, k);
    const y = lerp(64, 40, k * 0.7);
    ctx.beginPath();
    ctx.moveTo(52, 64);
    ctx.quadraticCurveTo(70, 70, x, y);
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = C.orangeDeep;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    triangle(ctx, x, y, 6, { fill: k > 0.7 ? C.red : C.amber, stroke: k > 0.7 ? C.red : C.amber, rot: Math.atan2(y - 50, x - 70) });
  }),

  G('B1.28', 'AGT.STATE.CHECKPOINT_ROLLBACK', 2400, (ctx, T) => {
    line(ctx, 22, 78, 106, 78, { stroke: C.muted, width: 2 });
    flag(ctx, 58, 70, { scale: 0.75, fill: '#00C853', stroke: '#00C853' });
    const k = T.p < 0.25 ? 0 : T.p < 0.5 ? E.sineInOut((T.p - 0.25) / 0.25) : 1;
    const mx = lerp(100, 58, k);
    const my = 78 - Math.sin(k * Math.PI) * 22;
    ctx.beginPath();
    ctx.moveTo(100, 70);
    ctx.quadraticCurveTo(80, 42, 58, 62);
    ctx.strokeStyle = C.electric;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    diamond(ctx, 80, 50, 5, { fill: C.electric, stroke: C.electric });
    circle(ctx, mx, 78, 4, { fill: C.electric, stroke: C.white, width: 1 });
    if (T.p > 0.5 && T.p < 0.6) {
      polyline(ctx, [[58, 42], [64, 38], [58, 48], [52, 36]], { stroke: '#00C853', width: 1.5 });
    }
  }),

  G('B1.29', 'AGT.CTX.PRESSURE', 1800, (ctx, T) => {
    const comp = 4 * (0.5 + 0.5 * Math.sin(T.p * Math.PI * 2));
    const bulge = 1 + 0.02 * Math.sin(T.p * Math.PI * 2);
    at(ctx, CX, CY, 0, () => {
      ctx.scale(bulge, 1);
      rect(ctx, -22, -36, 44, 72, { radius: 3, stroke: '#CFD8DC', width: 2 });
      for (let i = 0; i < 7; i++) {
        const y = -24 + i * (7 - comp * 0.3) + (i < 3 ? -comp : 0);
        const j = i < 3 ? Math.sin(T.t / 60 + i) * 1.2 : 0;
        line(ctx, -16 + j, y, 16 + j, y, { stroke: C.grey, width: 1.6 });
      }
    });
    circle(ctx, 96, 36, 12, { stroke: C.grey, width: 1.5 });
    const angN = lerp(-Math.PI * 0.8, Math.PI * 0.6, 0.5 + 0.5 * Math.sin(T.p * Math.PI));
    line(ctx, 96, 36, 96 + Math.cos(angN) * 8, 36 + Math.sin(angN) * 8, { stroke: mix(C.green, C.red, 0.7), width: 2 });
    if (T.p > 0.7) rect(ctx, CX - 8, 18, 16, 4, { fill: C.red, stroke: C.red });
  }),
];

module.exports = glyphs;
