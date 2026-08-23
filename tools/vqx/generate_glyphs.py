#!/usr/bin/env python3
"""CLI for deterministic VQX 0.3 glyph + WOFF2 generation."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import glyphs  # noqa: E402


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description="Generate VQX 0.3 glyphs, atlas, font, glyph-map.")
    p.add_argument("--out", type=Path, required=True, help="Output directory (usually .../assets)")
    p.add_argument("--map", type=Path, help="glyph-map.json path")
    args = p.parse_args(argv)

    glyphs.assert_unique()
    args.out.mkdir(parents=True, exist_ok=True)
    font = args.out / "vqx-0.3.woff2"
    atlas = args.out / "vqx-glyph-atlas.svg"
    glyphs.write_font(font)
    glyphs.write_atlas(atlas)
    mp = args.map or (args.out.parent / "machine" / "glyph-map.json")
    mp.parent.mkdir(parents=True, exist_ok=True)
    mp.write_text(json.dumps(glyphs.glyph_map(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {font} ({font.stat().st_size} bytes)")
    print(f"wrote {atlas}")
    print(f"wrote {mp}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
