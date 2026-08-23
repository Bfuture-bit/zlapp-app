# SPDX-License-Identifier: Apache-2.0
"""Encode the compatibility vector. Does not execute decoded intent."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "codecs"))
import vqx

lex_path = ROOT.parents[1] / "site" / "public" / "sites" / "vqx" / "machine" / "lexicon.json"
lex = json.loads(lex_path.read_text(encoding="utf-8"))
names = ["REQUEST", "PEER", "RESPOND", "GLYPH_ONLY"]
payload = vqx.encode_names(names, lex)
frame = vqx.wrap_bootstrap(payload)
parsed = vqx.parse_message(frame, lex, mode="bootstrap")
print("compact", vqx.bytes_to_hex(payload))
print("bootstrap", vqx.bytes_to_hex(frame))
print("decoded", " ".join(parsed["names"]))
print("execution_authority none")
print("automatic_installation false")
