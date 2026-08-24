'use strict';

const SIZE = 128;
const CX = 64;
const CY = 64;
const BG = '#12141A';
const PAD = 16;

const C = {
  bg: BG,
  teal: '#20C7C7',
  amber: '#FFA500',
  magenta: '#D6457C',
  cyan: '#00B8D4',
  cyanBright: '#00FFFF',
  magentaBright: '#FF00FF',
  blue: '#1E88E5',
  indigo: '#3949AB',
  electric: '#2979FF',
  pink: '#EC407A',
  red: '#E53935',
  redBright: '#FF1744',
  redPure: '#FF0000',
  green: '#43A047',
  greenGo: '#2E7D32',
  lime: '#76FF03',
  orange: '#FF6D00',
  orangeDeep: '#FB8C00',
  yellow: '#FFD54F',
  gold: '#FFAB00',
  grey: '#9E9E9E',
  greyLight: '#B0BEC5',
  greyMid: '#90A4AE',
  greyDark: '#546E7A',
  slate: '#6B7B8F',
  steel: '#78909C',
  white: '#E8EEF4',
  black: '#0A0C10',
  sepia: '#8D6E63',
  dust: '#BCAAA4',
  violet: '#9C7AD6',
  human: '#795548',
  bronze: '#6D4C41',
  commit: '#283593',
  neonBlue: '#4FC3F7',
  yellowGreen: '#D4E157',
  policyRed: '#FF2A2A',
  ink: '#283593',
  sand: '#FFB300',
  muted: '#607D8B',
  cool: '#81D4FA',
  halo: '#B39DDB',
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}
function clamp(v, a = 0, b = 1) {
  return Math.max(a, Math.min(b, v));
}
function map(v, a, b, c, d) {
  return lerp(c, d, (v - a) / (b - a || 1));
}
function frac(t) {
  return t - Math.floor(t);
}
function pingpong(t) {
  const f = frac(t);
  return f < 0.5 ? f * 2 : 2 - f * 2;
}
function deg(a) {
  return (a * Math.PI) / 180;
}
function ang(x, y) {
  return Math.atan2(y, x);
}
function len(x, y) {
  return Math.hypot(x, y);
}
function norm(x, y) {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}
function rot(x, y, a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c - y * s, x * s + y * c];
}
function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}
function hash2(i, j) {
  return hash(i * 12.9898 + j * 78.233);
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = h.length === 3
    ? h.split('').map((c) => c + c).join('')
    : h;
  return [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16),
  ];
}
function rgbToHex(r, g, b) {
  const h = (v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}
function mix(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t));
}
function withAlpha(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${clamp(a)})`;
}
function gray(l) {
  const v = Math.round(clamp(l) * 255);
  return rgbToHex(v, v, v);
}

const E = {
  linear: (t) => t,
  sineIn: (t) => 1 - Math.cos((t * Math.PI) / 2),
  sineOut: (t) => Math.sin((t * Math.PI) / 2),
  sineInOut: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  quadIn: (t) => t * t,
  quadOut: (t) => 1 - (1 - t) * (1 - t),
  quadInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  cubicIn: (t) => t * t * t,
  cubicOut: (t) => 1 - Math.pow(1 - t, 3),
  cubicInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  expoIn: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  expoOut: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  expoInOut: (t) =>
    t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  backIn: (t) => {
    const c = 1.70158;
    return (c + 1) * t * t * t - c * t * t;
  },
  backOut: (t) => {
    const c = 1.70158;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  },
  backInOut: (t) => {
    const c = 1.70158 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c + 1) * 2 * t - c)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c + 1) * (t * 2 - 2) + c) + 2) / 2;
  },
  elasticOut: (t) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  },
  bounceOut: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};

function apply(ctx, o = {}) {
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  if (o.width != null) ctx.lineWidth = o.width;
  if (o.cap) ctx.lineCap = o.cap;
  if (o.join) ctx.lineJoin = o.join;
  if (o.dash) ctx.setLineDash(o.dash);
  else if (o.dash === null || o.solid) ctx.setLineDash([]);
  if (o.dashOffset != null) ctx.lineDashOffset = o.dashOffset;
  if (o.stroke) ctx.strokeStyle = o.stroke;
  if (o.fill) ctx.fillStyle = o.fill;
}

function paint(ctx, o = {}) {
  apply(ctx, o);
  if (o.fill) ctx.fill();
  if (o.stroke !== false && (o.stroke || o.width)) ctx.stroke();
}

function layer(ctx, fn) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2;
  fn();
  ctx.restore();
}

function at(ctx, x, y, rotA, fn) {
  ctx.save();
  ctx.translate(x, y);
  if (rotA) ctx.rotate(rotA);
  fn();
  ctx.restore();
}

function line(ctx, x1, y1, x2, y2, o = {}) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  apply(ctx, { stroke: C.white, width: 2, ...o });
  ctx.stroke();
}

function polyline(ctx, pts, o = {}) {
  if (!pts.length) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (o.close) ctx.closePath();
  paint(ctx, { stroke: C.white, width: 2, ...o });
}

function circle(ctx, x, y, r, o = {}) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  paint(ctx, { stroke: C.white, width: 2, ...o });
}

function arc(ctx, x, y, r, a0, a1, o = {}) {
  ctx.beginPath();
  ctx.arc(x, y, r, a0, a1, o.ccw);
  paint(ctx, { stroke: C.white, width: 2, fill: null, ...o });
}

function rect(ctx, x, y, w, h, o = {}) {
  ctx.beginPath();
  if (o.radius) {
    const r = Math.min(o.radius, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
  paint(ctx, { stroke: C.white, width: 2, ...o });
}

function ellipse(ctx, x, y, rx, ry, o = {}) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, o.rot || 0, 0, Math.PI * 2);
  paint(ctx, { stroke: C.white, width: 2, ...o });
}

function poly(ctx, cx, cy, r, n, rot0, o = {}) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = rot0 + (i * Math.PI * 2) / n;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  polyline(ctx, pts, { close: true, ...o });
  return pts;
}

function hexagon(ctx, x, y, r, o = {}) {
  return poly(ctx, x, y, r, 6, o.rot != null ? o.rot : deg(-90), o);
}

function diamond(ctx, x, y, r, o = {}) {
  polyline(ctx, [
    [x, y - r],
    [x + r, y],
    [x, y + r],
    [x - r, y],
  ], { close: true, ...o });
}

function triangle(ctx, x, y, r, o = {}) {
  return poly(ctx, x, y, r, 3, o.rot != null ? o.rot : -Math.PI / 2, o);
}

function arrow(ctx, x1, y1, x2, y2, o = {}) {
  const head = o.head != null ? o.head : 7;
  const [dx, dy] = [x2 - x1, y2 - y1];
  const a = Math.atan2(dy, dx);
  line(ctx, x1, y1, x2, y2, o);
  polyline(ctx, [
    [x2 - Math.cos(a - 0.45) * head, y2 - Math.sin(a - 0.45) * head],
    [x2, y2],
    [x2 - Math.cos(a + 0.45) * head, y2 - Math.sin(a + 0.45) * head],
  ], { ...o, fill: null });
}

function chevron(ctx, x, y, s, o = {}) {
  polyline(ctx, [
    [x - s * 0.45, y - s * 0.55],
    [x + s * 0.45, y],
    [x - s * 0.45, y + s * 0.55],
  ], o);
}

function xMark(ctx, x, y, s, o = {}) {
  line(ctx, x - s, y - s, x + s, y + s, o);
  line(ctx, x + s, y - s, x - s, y + s, o);
}

function check(ctx, x, y, s, o = {}) {
  polyline(ctx, [
    [x - s * 0.7, y],
    [x - s * 0.15, y + s * 0.55],
    [x + s * 0.75, y - s * 0.55],
  ], o);
}

function hatch(ctx, x, y, w, h, o = {}) {
  const gap = o.gap || 4;
  const angA = o.angle != null ? o.angle : Math.PI / 4;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  apply(ctx, { stroke: o.stroke || C.grey, width: o.width || 1, alpha: o.alpha });
  const lenA = Math.hypot(w, h) * 2;
  const n = Math.ceil(lenA / gap);
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(angA);
  for (let i = -n; i <= n; i++) {
    ctx.beginPath();
    ctx.moveTo(-lenA, i * gap);
    ctx.lineTo(lenA, i * gap);
    ctx.stroke();
  }
  ctx.restore();
}

function wrench(ctx, x, y, o = {}) {
  const s = o.scale || 1;
  const rotA = o.rot != null ? o.rot : deg(-45);
  at(ctx, x, y, rotA, () => {
    apply(ctx, { stroke: o.stroke || C.steel, width: o.width || 2.2, fill: o.fill || null });
    ctx.beginPath();
    ctx.moveTo(-10 * s, -3 * s);
    ctx.lineTo(6 * s, -3 * s);
    ctx.arc(9 * s, 0, 5.2 * s, -Math.PI * 0.7, Math.PI * 0.7);
    ctx.lineTo(-10 * s, 3 * s);
    ctx.closePath();
    if (o.fill) ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-11 * s, 0, 5.5 * s, deg(-55), deg(55));
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-11 * s, 0, 2.2 * s, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function gear(ctx, x, y, o = {}) {
  const teeth = o.teeth || 8;
  const r0 = o.r || 16;
  const r1 = r0 * 0.62;
  const r2 = r0 * 0.28;
  const missing = o.missing;
  const rotA = o.rot || 0;
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    if (i === missing) continue;
    const a0 = rotA + (i * Math.PI * 2) / teeth - Math.PI / teeth / 2;
    const a1 = rotA + (i * Math.PI * 2) / teeth + Math.PI / teeth / 2;
    const aMid = rotA + (i * Math.PI * 2) / teeth;
    const inner0 = a0 - 0.08;
    ctx.lineTo(x + Math.cos(inner0) * r1, y + Math.sin(inner0) * r1);
    ctx.lineTo(x + Math.cos(a0) * r0, y + Math.sin(a0) * r0);
    ctx.lineTo(x + Math.cos(a1) * r0, y + Math.sin(a1) * r0);
    ctx.lineTo(x + Math.cos(a1 + 0.08) * r1, y + Math.sin(a1 + 0.08) * r1);
  }
  ctx.closePath();
  paint(ctx, { stroke: o.stroke || C.grey, width: 2, fill: o.fill });
  circle(ctx, x, y, r2, { stroke: o.stroke || C.grey, width: 2, fill: o.hole || C.bg });
}

function hourglass(ctx, x, y, o = {}) {
  const s = o.scale || 1;
  const sand = o.sand != null ? o.sand : 0.45;
  polyline(ctx, [
    [x - 10 * s, y - 16 * s],
    [x + 10 * s, y - 16 * s],
    [x + 1.5 * s, y],
    [x + 10 * s, y + 16 * s],
    [x - 10 * s, y + 16 * s],
    [x - 1.5 * s, y],
  ], { close: true, stroke: o.stroke || C.greyLight, width: 2 });
  const topH = 10 * s * (1 - sand);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - 8 * s, y - 14 * s);
  ctx.lineTo(x + 8 * s, y - 14 * s);
  ctx.lineTo(x + 1.2 * s, y - 1 * s);
  ctx.lineTo(x - 1.2 * s, y - 1 * s);
  ctx.clip();
  ctx.fillStyle = o.sandColor || C.sand;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(x - 10 * s, y - 14 * s + (12 * s - topH), 20 * s, topH + 4);
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - 1.2 * s, y + 1 * s);
  ctx.lineTo(x + 1.2 * s, y + 1 * s);
  ctx.lineTo(x + 8 * s, y + 14 * s);
  ctx.lineTo(x - 8 * s, y + 14 * s);
  ctx.clip();
  ctx.fillStyle = o.sandColor || C.sand;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(x - 10 * s, y + 14 * s - 12 * s * sand, 20 * s, 14 * s);
  ctx.restore();
}

function lock(ctx, x, y, o = {}) {
  const s = o.scale || 1;
  rect(ctx, x - 7 * s, y - 2 * s, 14 * s, 12 * s, {
    radius: 2,
    stroke: o.stroke || C.red,
    fill: o.fill,
    width: o.width || 2,
  });
  ctx.beginPath();
  ctx.arc(x, y - 2 * s, 5 * s, Math.PI, 0);
  apply(ctx, { stroke: o.stroke || C.red, width: o.width || 2 });
  ctx.stroke();
  circle(ctx, x, y + 3 * s, 1.6 * s, { fill: o.stroke || C.red, stroke: null });
}

function flag(ctx, x, y, o = {}) {
  const s = o.scale || 1;
  line(ctx, x, y - 16 * s, x, y + 12 * s, { stroke: o.pole || C.grey, width: 2 });
  polyline(ctx, [
    [x, y - 16 * s],
    [x + 16 * s, y - 10 * s],
    [x, y - 4 * s],
  ], { close: true, fill: o.fill || C.green, stroke: o.stroke || C.green, width: 1.5 });
}

function documentIcon(ctx, x, y, o = {}) {
  const s = o.scale || 1;
  const w = 12 * s;
  const h = 16 * s;
  polyline(ctx, [
    [x - w / 2, y - h / 2],
    [x + w / 2 - 4 * s, y - h / 2],
    [x + w / 2, y - h / 2 + 4 * s],
    [x + w / 2, y + h / 2],
    [x - w / 2, y + h / 2],
  ], { close: true, stroke: o.stroke || C.white, fill: o.fill, width: 1.8 });
  line(ctx, x + w / 2 - 4 * s, y - h / 2, x + w / 2 - 4 * s, y - h / 2 + 4 * s, { stroke: o.stroke || C.white, width: 1.5 });
  line(ctx, x + w / 2, y - h / 2 + 4 * s, x + w / 2 - 4 * s, y - h / 2 + 4 * s, { stroke: o.stroke || C.white, width: 1.5 });
  for (let i = 0; i < 3; i++) {
    line(ctx, x - 3.5 * s, y - 2 * s + i * 3.2 * s, x + 3.5 * s, y - 2 * s + i * 3.2 * s, {
      stroke: o.stroke || C.white,
      width: 1.2,
      alpha: 0.8,
    });
  }
}

function human(ctx, x, y, o = {}) {
  const s = o.scale || 1;
  circle(ctx, x, y - 10 * s, 5 * s, { stroke: o.stroke || C.human, width: 2, fill: o.fill });
  polyline(ctx, [
    [x, y - 4 * s],
    [x, y + 6 * s],
  ], { stroke: o.stroke || C.human, width: 2 });
  line(ctx, x - 7 * s, y, x + 7 * s, y, { stroke: o.stroke || C.human, width: 2 });
  line(ctx, x, y + 6 * s, x - 5 * s, y + 14 * s, { stroke: o.stroke || C.human, width: 2 });
  line(ctx, x, y + 6 * s, x + 5 * s, y + 14 * s, { stroke: o.stroke || C.human, width: 2 });
}

function isoCube(ctx, x, y, s, o = {}) {
  const dx = s * 0.86;
  const dy = s * 0.5;
  const top = [[x, y - dy], [x + dx, y], [x, y + dy], [x - dx, y]];
  const left = [[x - dx, y], [x, y + dy], [x, y + dy + s], [x - dx, y + s]];
  const right = [[x + dx, y], [x, y + dy], [x, y + dy + s], [x + dx, y + s]];
  polyline(ctx, top, { close: true, stroke: o.stroke || C.amber, fill: o.top, width: o.width || 1.8, dash: o.dash });
  polyline(ctx, left, { close: true, stroke: o.stroke || C.amber, fill: o.left, width: o.width || 1.8, dash: o.dash });
  polyline(ctx, right, { close: true, stroke: o.stroke || C.amber, fill: o.right, width: o.width || 1.8, dash: o.dash });
}

function text(ctx, str, x, y, o = {}) {
  ctx.save();
  ctx.font = `${o.weight || 700} ${o.size || 12}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = o.base || 'middle';
  apply(ctx, { fill: o.fill || C.white, alpha: o.alpha });
  ctx.fillStyle = o.fill || C.white;
  ctx.fillText(str, x, y);
  ctx.restore();
}

function glowCircle(ctx, x, y, r, color, a = 0.35) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function parseDuration(motion) {
  if (!motion) return 1800;
  const m = motion.match(/(\d+(?:\.\d+)?)\s*s/i);
  if (m) return Math.round(parseFloat(m[1]) * 1000);
  return 1800;
}

function u(tMs, duration) {
  const d = duration || 1800;
  const t = ((tMs % d) + d) % d;
  const p = t / d;
  return {
    t,
    p,
    d,
    SIZE,
    CX,
    CY,
    PAD,
    C,
    E,
    lerp,
    clamp,
    map,
    frac,
    pingpong,
    deg,
    hash,
    hash2,
    mix,
    withAlpha,
    gray,
    sin: (spd, amp = 1, off = 0) => Math.sin((p + off) * Math.PI * 2 * spd) * amp,
    cos: (spd, amp = 1, off = 0) => Math.cos((p + off) * Math.PI * 2 * spd) * amp,
    phase: (a, b) => clamp((p - a) / (b - a || 1)),
    between: (a, b) => p >= a && p < b,
    ease: (name, a, b) => E[name](clamp((p - a) / (b - a || 1))),
  };
}

module.exports = {
  SIZE,
  CX,
  CY,
  BG,
  PAD,
  C,
  E,
  lerp,
  clamp,
  map,
  frac,
  pingpong,
  deg,
  ang,
  len,
  norm,
  rot,
  hash,
  hash2,
  mix,
  withAlpha,
  gray,
  hexToRgb,
  apply,
  paint,
  layer,
  at,
  line,
  polyline,
  circle,
  arc,
  rect,
  ellipse,
  poly,
  hexagon,
  diamond,
  triangle,
  arrow,
  chevron,
  xMark,
  check,
  hatch,
  wrench,
  gear,
  hourglass,
  lock,
  flag,
  documentIcon,
  human,
  isoCube,
  text,
  glowCircle,
  parseDuration,
  u,
};
