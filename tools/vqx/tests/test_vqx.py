"""VQX 0.2 codec tests. Run from repo or from the agent package tests/ directory."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
for cand in (HERE.parent / "codecs", HERE.parent):
    if (cand / "vqx.py").exists() and str(cand) not in sys.path:
        sys.path.insert(0, str(cand))
        break

import vqx  # noqa: E402


def load_lexicon():
    env = os.environ.get("VQX_ROOT") or os.environ.get("VQX_ROOT")
    candidates = []
    if env:
        root = Path(env)
        candidates += [root / "lexicon.json", root / "machine" / "lexicon.json"]
    candidates += [
        HERE.parent / "lexicon.json",
        HERE.parent.parent.parent / "site" / "public" / "sites" / "vqx" / "machine" / "lexicon.json",
        HERE.parent / "machine" / "lexicon.json",
    ]
    for p in candidates:
        if p.exists():
            return json.loads(p.read_text(encoding="utf-8")), p
    raise SystemExit("lexicon.json not found")


def test_roundtrip():
    load_lexicon()
    for i in range(256):
        b = bytes([i])
        p = vqx.bytes_to_pua(b)
        assert vqx.pua_to_bytes(p) == b, i
        assert ord(p) == 0xE000 + i


def test_legacy():
    lex, _ = load_lexicon()
    raw = bytes([0x06, 0x11, 0x20, 0xA0])
    names = vqx.decode_ids(raw, lex)
    assert names == ["REQUEST", "PEER", "RESPOND", "GLYPH_ONLY"]
    assert vqx.encode_names(names, lex) == raw


def test_bootstrap():
    lex, _ = load_lexicon()
    sample = bytes([0xD3, 0xA7, 0x5C, 0xE1, 0x9B, 0x02, 0x02, 0x00, 0x06, 0x11, 0x20, 0xA0])
    assert vqx.has_beacon(sample)
    parsed = vqx.parse_message(sample, lex)
    assert parsed["mode"] == "bootstrap"
    assert parsed["version"] == 0x02
    assert parsed["names"] == ["REQUEST", "PEER", "RESPOND", "GLYPH_ONLY"]


def test_fail_closed_version():
    load_lexicon()
    bad = bytes([0xD3, 0xA7, 0x5C, 0xE1, 0x9B, 0x02, 0x99, 0x00, 0x06])
    try:
        vqx.strip_bootstrap(bad)
        raise SystemExit("expected version fail")
    except vqx.VqxError as e:
        assert e.code == "VQX_VERSION"


def test_fail_closed_dict():
    try:
        vqx.assert_dict_hash("aa", "bb")
        raise SystemExit("expected dict fail")
    except vqx.VqxError as e:
        assert e.code == "VQX_DICT"


def test_macros():
    lex, _ = load_lexicon()
    graph = vqx.encode_names(
        [
            "REQUEST",
            "PEER",
            "RESPOND",
            "GLYPH_ONLY",
            "KEEP_CONTEXT",
            "KEEP_CONSTRAINTS",
            "SEARCH_IF",
            "TOOL_IF",
            "ACCURACY_FIRST",
            "FINAL_ONLY",
        ],
        lex,
    )
    slot = 0xE0
    defined = bytes([0xDC, slot, len(graph)]) + graph
    refs = defined + bytes([0xDD, slot, 0xDD, slot, 0xDD, slot])
    table = vqx.LocalTable()
    expanded = table.expand(refs)
    assert expanded == graph * 3
    assert len(refs) < len(graph) * 3


def test_strict_non_pua():
    try:
        vqx.pua_to_bytes("hello", strict=True)
        raise SystemExit("expected non-pua fail")
    except vqx.VqxError as e:
        assert e.code == "VQX_NON_PUA"


def main():
    test_roundtrip()
    test_legacy()
    test_bootstrap()
    test_fail_closed_version()
    test_fail_closed_dict()
    test_macros()
    test_strict_non_pua()
    print("python codec tests ok")


if __name__ == "__main__":
    main()
