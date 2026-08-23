#!/usr/bin/env python3
"""Deterministic malformed-input smoke test. No external fuzzing dependency required."""
from __future__ import annotations
import json, os, random, sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/"codecs")); import vqx
root=Path(os.environ.get("VQX_ROOT", HERE.parent.parent.parent/"site"/"public"/"sites"/"vqx"/"machine"))
lex_path = root/"lexicon.json" if (root/"lexicon.json").exists() else root/"machine"/"lexicon.json"
lex=json.loads(lex_path.read_text())
rng=random.Random(0x56515803)
for n in range(5000):
    size=rng.randrange(0,128); data=bytes(rng.randrange(256) for _ in range(size)); mode=rng.choice(["auto","compact","bootstrap"])
    try: vqx.parse_message(data,lex,mode=mode,max_frame_size=256,max_expanded_size=512)
    except vqx.VqxError: pass
    except Exception as e: raise AssertionError(f"unexpected exception {type(e).__name__} on case {n}: {data.hex()}") from e
print("python fuzz smoke ok")
