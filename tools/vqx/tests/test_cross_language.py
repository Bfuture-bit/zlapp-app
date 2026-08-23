#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Encode with Python, decode with JavaScript, and the reverse."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
VQX = HERE.parent
SITE = Path(os.environ.get("VQX_SITE", VQX.parents[1] / "site" / "public" / "sites" / "vqx"))
sys.path.insert(0, str(VQX / "codecs"))
import vqx  # noqa: E402

NAMES = ["REQUEST", "PEER", "RESPOND", "GLYPH_ONLY"]


def load_lex():
    path = SITE / "machine" / "lexicon.json"
    raw = path.read_bytes()
    return json.loads(raw), raw


def main() -> int:
    lex, raw = load_lex()
    payload = vqx.encode_names(NAMES, lex)
    frame = vqx.wrap_bootstrap(payload)
    js = r"""
import { readFileSync } from "node:fs";
import { encodeNames, parseMessage, wrapBootstrap, bytesToHex, hexToBytes } from "../codecs/vqx.mjs";
const lex = JSON.parse(readFileSync(process.argv[2], "utf8"));
const mode = process.argv[3];
if (mode === "decode") {
  const bytes = hexToBytes(process.argv[4]);
  const parsed = await parseMessage(bytes, lex, { mode: "bootstrap" });
  process.stdout.write(JSON.stringify(parsed.names));
} else {
  const payload = encodeNames(["REQUEST", "PEER", "RESPOND", "GLYPH_ONLY"], lex);
  const frame = wrapBootstrap(payload);
  process.stdout.write(bytesToHex(frame));
}
"""
    js_path = HERE / "_cross_tmp.mjs"
    js_path.write_text(js, encoding="utf-8")
    try:
        enc = subprocess.check_output(
            ["node", str(js_path), str(SITE / "machine" / "lexicon.json"), "encode"],
            cwd=str(HERE),
        ).decode()
        js_frame = vqx.hex_to_bytes(enc)
        py_names = vqx.parse_message(js_frame, lex, mode="bootstrap")["names"]
        if py_names != NAMES:
            raise SystemExit(f"JS encode -> PY decode mismatch: {py_names}")
        dec = subprocess.check_output(
            ["node", str(js_path), str(SITE / "machine" / "lexicon.json"), "decode", vqx.bytes_to_hex(frame)],
            cwd=str(HERE),
        ).decode()
        js_names = json.loads(dec)
        if js_names != NAMES:
            raise SystemExit(f"PY encode -> JS decode mismatch: {js_names}")
    finally:
        if js_path.exists():
            js_path.unlink()
    print("cross-language python/javascript ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
