"""Deterministic VQX 0.3 glyph geometry and WOFF2 generation.

Each byte 0x00–0xFF maps to a unique original path. Glyphs are not letters,
digits, emoji, or existing icon sets. PUA U+E000+byte is only a rendering
container; the canonical ID is the byte.
"""

from __future__ import annotations

import hashlib
import math
from pathlib import Path

SEED = 0x5630322E  # "V02."
UPM = 1000
PAD = 90
CX = 500
CY = 460  # optical center above baseline
SCALE = 340


def _u32(n: int) -> int:
    return n & 0xFFFFFFFF


def mix(b: int, k: int) -> int:
    x = _u32(SEED ^ (b * 0x9E3779B1) ^ (k * 0x85EBCA6B))
    x ^= x >> 16
    x = _u32(x * 0x7FEB352D)
    x ^= x >> 15
    x = _u32(x * 0x846CA68B)
    x ^= x >> 16
    return x


def polar(cx, cy, r, a):
    return (cx + r * math.cos(a), cy + r * math.sin(a))


def _offset_open(pts: list[tuple[float, float]], w: float) -> list[tuple[float, float]]:
    """Stroke an open polyline into a closed outline."""
    if len(pts) < 2:
        return pts[:]
    hw = w / 2
    left, right = [], []

    def norm_at(i0, i1):
        x0, y0 = pts[i0]
        x1, y1 = pts[i1]
        dx, dy = x1 - x0, y1 - y0
        L = math.hypot(dx, dy) or 1.0
        return (-dy / L * hw, dx / L * hw)

    for i in range(len(pts)):
        if i == 0:
            nx, ny = norm_at(0, 1)
        elif i == len(pts) - 1:
            nx, ny = norm_at(i - 1, i)
        else:
            n1 = norm_at(i - 1, i)
            n2 = norm_at(i, i + 1)
            nx, ny = (n1[0] + n2[0]) / 2, (n1[1] + n2[1]) / 2
            L = math.hypot(nx, ny) or 1.0
            nx, ny = nx / L * hw, ny / L * hw
        x, y = pts[i]
        left.append((x + nx, y + ny))
        right.append((x - nx, y - ny))
    return left + list(reversed(right))


def _offset_closed(pts: list[tuple[float, float]], w: float) -> list[tuple[float, float]]:
    hw = w / 2
    n = len(pts)
    out = []
    for i in range(n):
        p0 = pts[i - 1]
        p1 = pts[i]
        p2 = pts[(i + 1) % n]
        d1 = (p1[0] - p0[0], p1[1] - p0[1])
        d2 = (p2[0] - p1[0], p2[1] - p1[1])
        n1 = (-d1[1], d1[0])
        n2 = (-d2[1], d2[0])
        L1 = math.hypot(*n1) or 1
        L2 = math.hypot(*n2) or 1
        nx = n1[0] / L1 + n2[0] / L2
        ny = n1[1] / L1 + n2[1] / L2
        L = math.hypot(nx, ny) or 1
        out.append((p1[0] + nx / L * hw, p1[1] + ny / L * hw))
    return out


def _ring(cx, cy, r, n=32, a0=0.0, span=math.tau):
    return [polar(cx, cy, r, a0 + span * i / n) for i in range(n)]


def motif_a(b: int) -> list[list[tuple[float, float]]]:
    """16 inner motifs from high nibble, 16 outer from low nibble."""
    hi, lo = (b >> 4) & 15, b & 15
    rot = (mix(b, 1) % 360) * math.pi / 180.0
    # slight unique scale jitter, still in-family
    k = 0.92 + (mix(b, 2) % 17) / 200.0
    strokes: list[list[tuple[float, float]]] = []

    def R(p):
        x, y = p[0] - CX, p[1] - CY
        c, s = math.cos(rot), math.sin(rot)
        return (CX + (c * x - s * y) * k, CY + (s * x + c * y) * k)

    def rr(seq):
        return [R(p) for p in seq]

    # inner 16
    if hi == 0:
        strokes.append(rr(_ring(CX, CY, 120, 5)))
        strokes.append(rr(_ring(CX, CY, 55, 5, math.pi / 5)))
    elif hi == 1:
        for i in range(3):
            a = i * math.tau / 3
            strokes.append(rr([polar(CX, CY, 40, a), polar(CX, CY, 150, a)]))
    elif hi == 2:
        strokes.append(rr([
            (CX - 130, CY - 40), (CX - 40, CY - 130), (CX + 80, CY - 90),
            (CX + 130, CY + 30), (CX + 20, CY + 130), (CX - 110, CY + 70),
        ]))
    elif hi == 3:
        for dy in (-90, 0, 90):
            strokes.append(rr([(CX - 140, CY + dy), (CX + 140, CY + dy * 0.3)]))
    elif hi == 4:
        strokes.append(rr(_ring(CX, CY, 140, 24, 0.4, math.tau * 0.72)))
        strokes.append(rr(_ring(CX - 20, CY + 10, 70, 20, 2.0, math.tau * 0.6)))
    elif hi == 5:
        pts = [polar(CX, CY, 130 if i % 2 == 0 else 60, i * math.tau / 10) for i in range(10)]
        strokes.append(rr(pts))
    elif hi == 6:
        for s in range(4):
            y = CY - 120 + s * 80
            strokes.append(rr([(CX - 120 + s * 12, y), (CX + 120 - s * 12, y)]))
    elif hi == 7:
        strokes.append(rr([
            (CX, CY - 150), (CX + 40, CY - 20), (CX + 150, CY - 10),
            (CX + 50, CY + 40), (CX + 90, CY + 150), (CX, CY + 70),
            (CX - 90, CY + 150), (CX - 50, CY + 40), (CX - 150, CY - 10),
            (CX - 40, CY - 20),
        ]))
    elif hi == 8:
        for i in range(6):
            a = i * math.tau / 6 + 0.3
            p0 = polar(CX, CY, 50, a)
            p1 = polar(CX, CY, 150, a + 0.35)
            strokes.append(rr([p0, p1]))
    elif hi == 9:
        strokes.append(rr([(CX - 140, CY - 140), (CX + 140, CY - 40), (CX - 80, CY + 140)]))
        strokes.append(rr([(CX + 140, CY + 120), (CX - 40, CY - 20)]))
    elif hi == 10:
        for r in (60, 110, 160):
            strokes.append(rr(_ring(CX, CY, r, 18, hi + lo, math.tau * 0.85)))
    elif hi == 11:
        strokes.append(rr([(CX - 150, CY), (CX, CY - 150), (CX + 150, CY), (CX, CY + 150)]))
        strokes.append(rr(_ring(CX, CY, 45, 8)))
    elif hi == 12:
        for i in range(5):
            a = -0.9 + i * 0.45
            strokes.append(rr([polar(CX - 100, CY + 100, 20, a), polar(CX + 130, CY - 130, 180, a)]))
    elif hi == 13:
        strokes.append(rr(_ring(CX - 70, CY - 40, 90, 16)))
        strokes.append(rr(_ring(CX + 80, CY + 50, 80, 16)))
    elif hi == 14:
        zig = []
        for i in range(9):
            zig.append((CX - 140 + i * 35, CY + (80 if i % 2 == 0 else -80)))
        strokes.append(rr(zig))
    else:
        strokes.append(rr([polar(CX, CY, 155, i * math.tau / 7) for i in range(7)]))
        strokes.append(rr([polar(CX, CY, 70, i * math.tau / 7 + 0.4) for i in range(7)]))

    # outer 16 — corner / satellite marks, not letter-like
    o = lo
    if o == 0:
        strokes.append(rr([(CX - 190, CY - 180), (CX - 110, CY - 180), (CX - 190, CY - 100)]))
        strokes.append(rr([(CX + 190, CY + 180), (CX + 110, CY + 180), (CX + 190, CY + 100)]))
    elif o == 1:
        for a in (0.3, 2.2, 4.1):
            strokes.append(rr([polar(CX, CY, 175, a), polar(CX, CY, 210, a)]))
    elif o == 2:
        strokes.append(rr([(CX - 200, CY + 160), (CX + 200, CY + 160)]))
        strokes.append(rr([(CX, CY + 160), (CX, CY + 200)]))
    elif o == 3:
        strokes.append(rr(_ring(CX, CY, 200, 20, 1.1, math.pi)))
    elif o == 4:
        strokes.append(rr([(CX - 180, CY - 20), (CX - 180, CY + 80), (CX - 100, CY + 80)]))
        strokes.append(rr([(CX + 180, CY + 20), (CX + 180, CY - 80), (CX + 100, CY - 80)]))
    elif o == 5:
        for i in range(4):
            a = i * math.pi / 2 + 0.4
            strokes.append(rr(_ring(*polar(CX, CY, 185, a), 22, 10)))
    elif o == 6:
        strokes.append(rr([(CX - 210, CY), (CX - 170, CY - 40), (CX - 170, CY + 40), (CX - 210, CY)]))
        strokes.append(rr([(CX + 210, CY), (CX + 170, CY - 40), (CX + 170, CY + 40), (CX + 210, CY)]))
    elif o == 7:
        strokes.append(rr([polar(CX, CY, 190, 0.3 + i * 0.15) for i in range(6)]))
    elif o == 8:
        strokes.append(rr([(CX - 160, CY - 190), (CX + 40, CY - 190)]))
        strokes.append(rr([(CX + 160, CY + 190), (CX - 40, CY + 190)]))
    elif o == 9:
        strokes.append(rr(_ring(CX, CY, 195, 12, 3.3, math.tau * 0.4)))
        strokes.append(rr([(CX + 40, CY - 200), (CX + 90, CY - 150)]))
    elif o == 10:
        for t in range(3):
            strokes.append(rr([polar(CX, CY, 170, t * 2.1), polar(CX, CY, 205, t * 2.1 + 0.4)]))
    elif o == 11:
        strokes.append(rr([(CX - 200, CY - 160), (CX - 200, CY + 160)]))
        strokes.append(rr([(CX + 200, CY - 80), (CX + 200, CY + 80)]))
    elif o == 12:
        strokes.append(rr([
            (CX - 40, CY - 200), (CX + 40, CY - 200), (CX + 40, CY - 160), (CX - 40, CY - 160)
        ]))
        strokes.append(rr([(CX - 20, CY + 170), (CX + 20, CY + 210)]))
    elif o == 13:
        strokes.append(rr(_ring(CX - 160, CY + 150, 40, 12)))
        strokes.append(rr(_ring(CX + 160, CY - 150, 40, 12)))
    elif o == 14:
        strokes.append(rr([(CX - 190, CY - 190), (CX - 130, CY - 130)]))
        strokes.append(rr([(CX + 190, CY - 190), (CX + 130, CY - 130)]))
        strokes.append(rr([(CX - 190, CY + 190), (CX - 130, CY + 130)]))
        strokes.append(rr([(CX + 190, CY + 190), (CX + 130, CY + 130)]))
    else:
        strokes.append(rr(_ring(CX, CY, 205, 28, mix(b, 9) / 100.0, math.tau * 0.33)))

    # unique bit comb: eight possible ticks, present iff bit set — guarantees uniqueness
    # even if two motifs collided (they shouldn't). Placed on a seventh-radius ring.
    for bit in range(8):
        if b & (1 << bit):
            a = -math.pi / 2 + bit * math.tau / 8 + 0.11
            p0 = polar(CX, CY, 230, a)
            p1 = polar(CX, CY, 255, a)
            strokes.append(rr([p0, p1]))

    return strokes


def outlines_for(b: int) -> list[list[tuple[float, float]]]:
    w = 42
    out = []
    for stroke in motif_a(b):
        if len(stroke) < 2:
            continue
        closed = math.hypot(stroke[0][0] - stroke[-1][0], stroke[0][1] - stroke[-1][1]) < 8
        if closed and len(stroke) >= 3:
            if math.hypot(stroke[0][0] - stroke[-1][0], stroke[0][1] - stroke[-1][1]) < 8:
                stroke = stroke[:-1] if stroke[0] == stroke[-1] else stroke
            out.append(_offset_closed(stroke, w))
        else:
            out.append(_offset_open(stroke, w))
    return out


def svg_path(polys: list[list[tuple[float, float]]]) -> str:
    parts = []
    for poly in polys:
        if not poly:
            continue
        x0, y0 = poly[0]
        # SVG y-down; font y-up. Atlas uses y-down by flipping.
        parts.append(f"M{x0:.1f},{y0:.1f}")
        for x, y in poly[1:]:
            parts.append(f"L{x:.1f},{y:.1f}")
        parts.append("Z")
    return "".join(parts)


def svg_path_atlas(b: int) -> str:
    """Flip y for SVG (y-down) from font coordinates (y-up)."""
    polys = outlines_for(b)
    parts = []
    for poly in polys:
        if not poly:
            continue
        pts = [(x, 1000 - y) for x, y in poly]
        x0, y0 = pts[0]
        parts.append(f"M{x0:.1f},{y0:.1f}")
        for x, y in pts[1:]:
            parts.append(f"L{x:.1f},{y:.1f}")
        parts.append("Z")
    return "".join(parts)


def fingerprint(b: int) -> str:
    return hashlib.sha256(svg_path(outlines_for(b)).encode()).hexdigest()


def assert_unique():
    seen = {}
    for b in range(256):
        fp = fingerprint(b)
        if fp in seen:
            raise SystemExit(f"glyph collision {seen[fp]:02X} vs {b:02X}")
        seen[fp] = b


def write_atlas(path: Path):
    cells = 16
    cell = 72
    pad = 8
    w = cells * cell
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {w}" width="{w}" height="{w}">',
        '<rect width="100%" height="100%" fill="#07090c"/>',
    ]
    for b in range(256):
        c, r = b % 16, b // 16
        x, y = c * cell, r * cell
        d = svg_path_atlas(b)
        # scale 1000 -> cell-2*pad
        s = (cell - 2 * pad) / 1000
        parts.append(
            f'<g transform="translate({x + pad},{y + pad}) scale({s:.5f})">'
            f'<path d="{d}" fill="#dce6ee"/></g>'
        )
    parts.append("</svg>\n")
    path.write_text("".join(parts), encoding="utf-8")


def write_font(path: Path):
    from fontTools.fontBuilder import FontBuilder
    from fontTools.pens.ttGlyphPen import TTGlyphPen

    order = [".notdef"] + [f"v{b:02x}" for b in range(256)]
    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(order)
    cmap = {0xE000 + b: f"v{b:02x}" for b in range(256)}
    fb.setupCharacterMap(cmap)

    def empty():
        pen = TTGlyphPen(None)
        return pen.glyph()

    glyphs = {".notdef": empty()}
    metrics = {".notdef": (600, 50)}
    for b in range(256):
        pen = TTGlyphPen(None)
        for poly in outlines_for(b):
            if len(poly) < 3:
                continue
            pen.moveTo(poly[0])
            for p in poly[1:]:
                pen.lineTo((round(p[0]), round(p[1])))
            pen.closePath()
        name = f"v{b:02x}"
        glyphs[name] = pen.glyph()
        metrics[name] = (1000, 0)

    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=880, descent=-220)
    fb.setupNameTable(
        {
            "familyName": "VQX",
            "styleName": "Protocol",
            "uniqueFontIdentifier": "VQX 0.3",
            "fullName": "VQX Protocol 0.3",
            "psName": "VQX-Protocol",
            "version": "Version 0.3",
        }
    )
    fb.setupOS2(sTypoAscender=880, sTypoDescender=-220, usWinAscent=880, usWinDescent=220)
    fb.setupPost()
    font = fb.font
    font.flavor = "woff2"
    path.parent.mkdir(parents=True, exist_ok=True)
    font.save(str(path))


def glyph_map():
    return {
        f"{b:02X}": {
            "id": b,
            "codepoint": f"U+{0xE000+b:04X}",
            "char": chr(0xE000 + b),
            "path_sha256": fingerprint(b),
        }
        for b in range(256)
    }
