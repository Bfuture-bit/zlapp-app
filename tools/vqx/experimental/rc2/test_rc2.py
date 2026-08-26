#!/usr/bin/env python3
"""RC2 candidate codec/vector checks. Does not mutate VQX 0.3."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "frozen" / "python"))
import vqx_rc2 as rc2  # noqa: E402

EXPECTED = {
    "python/vqx_rc2.py": "4b8055aebbf5589bf28247d2ddf708e6bae9bc77e039c54df2c37f202c93f019",
    "js/vqx_rc2.mjs": "b6b4ef322463c7b30146b1fc7d50114ab98e044c98f07d8738271912caaa5ea0",
    "schema/vqx_rc2.schema.json": "a2eb42c66c00f54598702f49e020117afc45170f31fcae08899ba71598dc262a",
    "SPEC.md": "19f59622b6e764cc84f6368435301580b5e7e74153205b1d1042a51f01958c3a",
}


def main() -> int:
    failed = 0
    for rel, digest in EXPECTED.items():
        path = HERE / "frozen" / rel
        got = hashlib.sha256(path.read_bytes()).hexdigest()
        if got != digest:
            print("FAIL hash", rel)
            failed += 1
        else:
            print("PASS hash", rel)
    vectors = json.loads((HERE / "vectors" / "conformance.json").read_text(encoding="utf-8"))
    for case in vectors["cases"]:
        if case["id"] == "noncanonical-numeric-frame":
            frame = bytes.fromhex(json.loads((HERE / "frozen" / "evidence" / "NONCANONICAL_NUMERIC_FRAME.json").read_text())["frame_hex"])
            try:
                rc2.decode_untrusted(frame)
                print("FAIL noncanonical accepted")
                failed += 1
            except Exception as exc:
                print("PASS noncanonical reject", exc)
            continue
        packet = json.loads((HERE / "examples" / f"{case['id']}.json").read_text(encoding="utf-8"))
        vr = rc2.validate_packet(packet)
        if vr.ok != case["validate_ok"]:
            print("FAIL validate", case["id"], vr.errors)
            failed += 1
            continue
        if vr.ok:
            frame = rc2.encode_packet(packet)
            if frame.hex() != case["frame_hex"]:
                print("FAIL hex", case["id"])
                failed += 1
                continue
            rc2.trusted_decode(frame)
        print("PASS", case["id"])
    if failed:
        print("FAILED", failed)
        return 1
    print("RC2 candidate checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
