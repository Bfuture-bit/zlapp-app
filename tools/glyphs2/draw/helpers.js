export const PAL = {
  graphite: "#20242B",
  gray: "#9AA1AA",
  light: "#D8DCE2",
  pale: "#EEF1F4",
  cyan: "#23C7E8",
  violet: "#7657E8",
  amber: "#F2A900",
  green: "#2DD47A",
  red: "#E5484D",
  magenta: "#E04BB6",
  yellow: "#F4D35E",
  white: "#FFFFFF",
};

export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
export function lerp(a, b, t) {
  return a + (b - a) * t;
}
export function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}
export function pingpong(t) {
  const x = t % 1;
  return x < 0.5 ? x * 2 : 2 - x * 2;
}

export function reset(ctx) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.miterLimit = 10;
  ctx.lineWidth = 6;
}

export function stroke(ctx, color, w = 6, dash = null, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash(dash || []);
}

export function fill(ctx, color, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
}

export function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

export function polyline(ctx, pts, closed = false) {
  if (!pts.length) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (closed) ctx.closePath();
  ctx.stroke();
}

export function fillPoly(ctx, pts) {
  if (!pts.length) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
}

export function circle(ctx, x, y, r, mode = "stroke") {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (mode === "fill" || mode === "both") ctx.fill();
  if (mode === "stroke" || mode === "both") ctx.stroke();
}

export function diamond(ctx, x, y, r, mode = "stroke") {
  const pts = [
    [x, y - r],
    [x + r, y],
    [x, y + r],
    [x - r, y],
  ];
  if (mode === "fill" || mode === "both") fillPoly(ctx, pts);
  if (mode === "stroke" || mode === "both") polyline(ctx, pts, true);
}

export function roundRectPath(ctx, x, y, w, h, r = 8) {
  const rad = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, rad);
    return;
  }
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

export function packet(ctx, x, y, w = 22, h = 16, r = 5, mode = "fill") {
  roundRectPath(ctx, x - w / 2, y - h / 2, w, h, r);
  if (mode === "fill" || mode === "both") ctx.fill();
  if (mode === "stroke" || mode === "both") ctx.stroke();
}

export function xMark(ctx, x, y, s) {
  line(ctx, x - s, y - s, x + s, y + s);
  line(ctx, x + s, y - s, x - s, y + s);
}

export function ticks(ctx, x, y, n, gap = 10, h = 8) {
  for (let i = 0; i < n; i++) {
    const tx = x + i * gap;
    line(ctx, tx, y, tx, y + h);
  }
}

export function node(ctx, x, y, r, color, mode = "fill") {
  fill(ctx, color);
  stroke(ctx, color, 4);
  circle(ctx, x, y, r, mode);
}

export function cube(ctx, x, y, s, strokeCol, fillCol, alpha = 1) {
  const dx = s * 0.52;
  const dy = s * 0.3;
  const top = [
    [x, y - dy],
    [x + dx, y],
    [x, y + dy],
    [x - dx, y],
  ];
  const left = [
    [x - dx, y],
    [x, y + dy],
    [x, y + dy + s * 0.55],
    [x - dx, y + s * 0.55],
  ];
  const right = [
    [x + dx, y],
    [x, y + dy],
    [x, y + dy + s * 0.55],
    [x + dx, y + s * 0.55],
  ];
  if (fillCol) {
    fill(ctx, fillCol, alpha);
    fillPoly(ctx, top);
    fill(ctx, fillCol, alpha * 0.78);
    fillPoly(ctx, left);
    fill(ctx, fillCol, alpha * 0.9);
    fillPoly(ctx, right);
  }
  stroke(ctx, strokeCol, 4, null, alpha);
  polyline(ctx, top, true);
  polyline(ctx, left, true);
  polyline(ctx, right, true);
}
