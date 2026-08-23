#!/usr/bin/env python3
"""Compare representation sizes. Does not publish percentage claims."""

from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "codecs"))
try:
    import vqx
except ImportError:
    sys.path.insert(0, str(HERE.parent))
    import vqx  # noqa: E402


MESSAGES = [
    {
        "id": "legacy_glyph_only",
        "nl": "Please respond to me, the peer agent, using only VQX semantic tokens and protocol framing. Do not include ordinary natural-language prose in the response payload.",
        "json": {
            "act": "request",
            "addressee": "peer",
            "do": "respond",
            "constraint": "glyph_only",
        },
        "names": ["REQUEST", "PEER", "RESPOND", "GLYPH_ONLY"],
    },
    {
        "id": "handoff_preserve",
        "nl": "Hand off this task to a delegate. Preserve context and constraints. Search if needed. Use a tool if needed. Prioritize accuracy. Return the final answer only.",
        "json": {
            "act": "handoff",
            "role": "delegate",
            "preserve": ["context", "constraints"],
            "search_if_needed": True,
            "tool_if_needed": True,
            "priority": "accuracy",
            "output": "final_only",
        },
        "names": [
            "HANDOFF",
            "DELEGATE",
            "KEEP_CONTEXT",
            "KEEP_CONSTRAINTS",
            "SEARCH_IF",
            "TOOL_IF",
            "ACCURACY_FIRST",
            "FINAL_ONLY",
        ],
    },
    {
        "id": "verify_fail_closed",
        "nl": "Verify the dictionary identity. If the hash does not match, fail closed and do not guess semantics.",
        "json": {"act": "verify", "on_mismatch": "fail_closed", "target": "dictionary"},
        "names": ["VERIFY", "DICT_HASH", "DICT_MISMATCH", "FAIL"],
    },
]


def load_lexicon():
    for p in (
        HERE.parent / "lexicon.json",
        HERE.parent.parent.parent / "site" / "public" / "sites" / "vqx" / "machine" / "lexicon.json",
        HERE.parent / "machine" / "lexicon.json",
    ):
        if p.exists():
            return json.loads(p.read_text(encoding="utf-8"))
    raise SystemExit("lexicon.json not found")


def main():
    lex = load_lexicon()
    rows = []
    for m in MESSAGES:
        payload = vqx.encode_names(m["names"], lex)
        bootstrap = vqx.wrap_bootstrap(payload)
        pua = vqx.bytes_to_pua(payload)
        row = {
            "id": m["id"],
            "natural_language_utf8_bytes": len(m["nl"].encode("utf-8")),
            "compact_json_utf8_bytes": len(json.dumps(m["json"], separators=(",", ":")).encode("utf-8")),
            "vqx_semantic_payload_bytes": len(payload),
            "vqx_bootstrap_frame_bytes": len(bootstrap),
            "vqx_compact_mode_bytes": len(payload),
            "vqx_pua_utf8_bytes": len(pua.encode("utf-8")),
            "vqx_semantic_token_count": len(m["names"]),
        }
        rows.append(row)
        print(json.dumps(row, indent=2))
    print(
        "\nUnits: bytes on the wire (binary payload), UTF-8 bytes of PUA text, "
        "JSON/NL UTF-8 bytes, and VQX semantic token counts. Model tokenizer tokens "
        "are runtime-specific and are not estimated here."
    )
    return rows


if __name__ == "__main__":
    main()
