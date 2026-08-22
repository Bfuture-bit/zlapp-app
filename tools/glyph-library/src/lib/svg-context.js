'use strict';

function mul(a, b) {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}
function applyM(m, x, y) {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}
function col(v) {
  if (!v) return 'none';
  return String(v);
}

class SVGContext {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.elements = [];
    this.defs = [];
    this._id = 0;
    this._stack = [];
    this._m = [1, 0, 0, 1, 0, 0];
    this._path = '';
    this._start = null;
    this._cx = 0;
    this._cy = 0;
    this.globalAlpha = 1;
    this.strokeStyle = '#fff';
    this.fillStyle = '#fff';
    this.lineWidth = 2;
    this.lineCap = 'round';
    this.lineJoin = 'round';
    this.miterLimit = 10;
    this._dash = [];
    this.lineDashOffset = 0;
    this.font = '700 12px sans-serif';
    this.textAlign = 'center';
    this.textBaseline = 'middle';
    this._clip = null;
  }

  save() {
    this._stack.push({
      m: this._m.slice(),
      globalAlpha: this.globalAlpha,
      strokeStyle: this.strokeStyle,
      fillStyle: this.fillStyle,
      lineWidth: this.lineWidth,
      lineCap: this.lineCap,
      lineJoin: this.lineJoin,
      _dash: this._dash.slice(),
      lineDashOffset: this.lineDashOffset,
      font: this.font,
      textAlign: this.textAlign,
      textBaseline: this.textBaseline,
      _clip: this._clip,
    });
  }
  restore() {
    const s = this._stack.pop();
    if (!s) return;
    Object.assign(this, s);
    this._m = s.m;
    this._dash = s._dash;
  }
  translate(x, y) { this._m = mul(this._m, [1, 0, 0, 1, x, y]); }
  rotate(a) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    this._m = mul(this._m, [c, s, -s, c, 0, 0]);
  }
  scale(x, y) { this._m = mul(this._m, [x, 0, 0, y == null ? x : y, 0, 0]); }
  transform(a, b, c, d, e, f) { this._m = mul(this._m, [a, b, c, d, e, f]); }
  setTransform(a, b, c, d, e, f) { this._m = [a, b, c, d, e, f]; }
  setLineDash(d) { this._dash = d ? d.slice() : []; }
  getLineDash() { return this._dash.slice(); }

  beginPath() { this._path = ''; this._start = null; }
  closePath() {
    this._path += 'Z';
    if (this._start) {
      this._cx = this._start[0];
      this._cy = this._start[1];
    }
  }
  _pt(x, y) { return applyM(this._m, x, y); }
  _cmd(c, x, y) {
    const [px, py] = this._pt(x, y);
    this._path += `${c}${px.toFixed(2)} ${py.toFixed(2)}`;
    this._cx = x;
    this._cy = y;
    if (!this._start) this._start = [x, y];
    return [px, py];
  }
  moveTo(x, y) { this._start = [x, y]; this._cmd('M', x, y); }
  lineTo(x, y) { this._cmd('L', x, y); }
  quadraticCurveTo(cpx, cpy, x, y) {
    const [a, b] = this._pt(cpx, cpy);
    const [d, e] = this._pt(x, y);
    this._path += `Q${a.toFixed(2)} ${b.toFixed(2)} ${d.toFixed(2)} ${e.toFixed(2)}`;
    this._cx = x;
    this._cy = y;
  }
  bezierCurveTo(c1x, c1y, c2x, c2y, x, y) {
    const [a, b] = this._pt(c1x, c1y);
    const [c, d] = this._pt(c2x, c2y);
    const [e, f] = this._pt(x, y);
    this._path += `C${a.toFixed(2)} ${b.toFixed(2)} ${c.toFixed(2)} ${d.toFixed(2)} ${e.toFixed(2)} ${f.toFixed(2)}`;
    this._cx = x;
    this._cy = y;
  }
  rect(x, y, w, h) {
    this.moveTo(x, y);
    this.lineTo(x + w, y);
    this.lineTo(x + w, y + h);
    this.lineTo(x, y + h);
    this.closePath();
  }
  roundRect(x, y, w, h, r) {
    const rr = Array.isArray(r) ? r[0] : r;
    const rad = Math.min(rr || 0, Math.abs(w) / 2, Math.abs(h) / 2);
    if (!rad) {
      this.rect(x, y, w, h);
      return;
    }
    this.moveTo(x + rad, y);
    this.lineTo(x + w - rad, y);
    this.quadraticCurveTo(x + w, y, x + w, y + rad);
    this.lineTo(x + w, y + h - rad);
    this.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    this.lineTo(x + rad, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - rad);
    this.lineTo(x, y + rad);
    this.quadraticCurveTo(x, y, x + rad, y);
    this.closePath();
  }
  arcTo(x1, y1) {
    this.lineTo(x1, y1);
  }
  arc(x, y, r, a0, a1, ccw = false) {
    this.ellipse(x, y, r, r, 0, a0, a1, ccw);
  }
  ellipse(x, y, rx, ry, rot, a0, a1, ccw = false) {
    let start = a0;
    let end = a1;
    const tau = Math.PI * 2;
    if (!ccw) {
      while (end < start) end += tau;
    } else {
      while (start < end) start += tau;
    }
    const sweep = ccw ? 0 : 1;
    const delta = ccw ? start - end : end - start;
    const large = delta > Math.PI ? 1 : 0;
    const sx = x + Math.cos(a0) * rx;
    const sy = y + Math.sin(a0) * ry;
    if (!this._path) this.moveTo(sx, sy);
    else this.lineTo(sx, sy);
    const [rxw, ryw] = [rx * Math.hypot(this._m[0], this._m[1]), ry * Math.hypot(this._m[2], this._m[3])];
    const rotDeg = (rot * 180 / Math.PI).toFixed(2);
    const emitA = (ang) => {
      const ex = x + Math.cos(ang) * rx;
      const ey = y + Math.sin(ang) * ry;
      const [x1, y1] = this._pt(ex, ey);
      this._path += `A${rxw.toFixed(2)} ${ryw.toFixed(2)} ${rotDeg} ${large} ${sweep} ${x1.toFixed(2)} ${y1.toFixed(2)}`;
      this._cx = ex;
      this._cy = ey;
    };
    if (delta >= Math.PI * 2 - 1e-4) {
      emitA(a0 + Math.PI);
      emitA(a0);
    } else {
      emitA(a1);
    }
  }
  _style(kind) {
    const a = this.globalAlpha;
    const stroke = kind !== 'fill' ? col(this.strokeStyle) : 'none';
    const fill = kind !== 'stroke' ? col(this.fillStyle) : 'none';
    const dash = this._dash.length ? ` stroke-dasharray="${this._dash.join(' ')}" stroke-dashoffset="${this.lineDashOffset}"` : '';
    const clip = this._clip ? ` clip-path="url(#${this._clip})"` : '';
    const op = a < 0.999 ? ` opacity="${a.toFixed(3)}"` : '';
    return `fill="${esc(fill)}" stroke="${esc(stroke)}" stroke-width="${this.lineWidth}" stroke-linecap="${this.lineCap}" stroke-linejoin="${this.lineJoin}"${dash}${clip}${op}`;
  }
  _emitPath(kind) {
    if (!this._path) return;
    this.elements.push(`<path d="${this._path}" ${this._style(kind)} fill-rule="evenodd"/>`);
  }
  fill() { this._emitPath('fill'); }
  stroke() { this._emitPath('stroke'); }
  clip() {
    const id = `c${this._id++}`;
    this.defs.push(`<clipPath id="${id}"><path d="${this._path}"/></clipPath>`);
    this._clip = id;
  }
  fillRect(x, y, w, h) {
    this.beginPath();
    this.rect(x, y, w, h);
    this.fill();
  }
  strokeRect(x, y, w, h) {
    this.beginPath();
    this.rect(x, y, w, h);
    this.stroke();
  }
  clearRect() {}
  fillText(str, x, y) {
    const [px, py] = this._pt(x, y);
    const size = (this.font.match(/(\d+)px/) || [0, 12])[1];
    const anchor = this.textAlign === 'left' ? 'start' : this.textAlign === 'right' ? 'end' : 'middle';
    const base = this.textBaseline === 'top' ? 'hanging' : this.textBaseline === 'bottom' ? 'baseline' : 'middle';
    const op = this.globalAlpha < 0.999 ? ` opacity="${this.globalAlpha.toFixed(3)}"` : '';
    this.elements.push(
      `<text x="${px.toFixed(2)}" y="${py.toFixed(2)}" font-size="${size}" font-family="ui-sans-serif,system-ui,sans-serif" font-weight="700" text-anchor="${anchor}" dominant-baseline="${base}" fill="${esc(col(this.fillStyle))}"${op}>${esc(str)}</text>`
    );
  }
  strokeText(str, x, y) { this.fillText(str, x, y); }
  measureText(str) { return { width: String(str).length * 7 }; }
  createLinearGradient() {
    return { addColorStop() {}, toString() { return '#888'; } };
  }
  toSVG({ bg } = {}) {
    const defs = this.defs.length ? `<defs>${this.defs.join('')}</defs>` : '';
    const bgR = bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : '';
    return `${defs}${bgR}${this.elements.join('')}`;
  }
}

module.exports = { SVGContext };
