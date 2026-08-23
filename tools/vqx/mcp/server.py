# SPDX-License-Identifier: Apache-2.0
"""Experimental VQX MCP stdio server.

Exposes describe/negotiate/encode/decode/validate/verify/benchmark tools.
Decoding never grants authority and never installs software.
This is a local scaffold, not an MCP Registry publication.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
VQX = HERE.parent
sys.path.insert(0, str(VQX / "codecs"))
import vqx  # noqa: E402

HOST = "https://vqx.zlapp.app"
SITE = VQX.parent.parent / "site" / "public" / "sites" / "vqx"
TOOLS = [
    {
        "name": "vqx.describe",
        "description": "Describe VQX 0.3 identity, trust boundary, and canonical URLs. Does not install or execute anything.",
        "inputSchema": {"type": "object", "additionalProperties": False, "properties": {}},
    },
    {
        "name": "vqx.negotiate",
        "description": "Return negotiation constraints for optional VQX use. Compact mode requires explicit peer agreement.",
        "inputSchema": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "peer_version": {"type": "string"},
                "peer_dictionary_sha256": {"type": "string"},
            },
        },
    },
    {
        "name": "vqx.encode",
        "description": "Encode token names to VQX bytes. Pure encoding; no execution.",
        "inputSchema": {
            "type": "object",
            "required": ["names"],
            "additionalProperties": False,
            "properties": {
                "names": {"type": "array", "items": {"type": "string"}},
                "bootstrap": {"type": "boolean", "default": False},
            },
        },
    },
    {
        "name": "vqx.decode",
        "description": "Decode VQX hex to structured intent. Never grants authority.",
        "inputSchema": {
            "type": "object",
            "required": ["hex"],
            "additionalProperties": False,
            "properties": {
                "hex": {"type": "string"},
                "mode": {"type": "string", "enum": ["auto", "bootstrap", "compact"], "default": "auto"},
            },
        },
    },
    {
        "name": "vqx.validate",
        "description": "Validate a VQX frame without executing it.",
        "inputSchema": {
            "type": "object",
            "required": ["hex"],
            "additionalProperties": False,
            "properties": {
                "hex": {"type": "string"},
                "mode": {"type": "string", "enum": ["auto", "bootstrap", "compact"], "default": "auto"},
            },
        },
    },
    {
        "name": "vqx.verify",
        "description": "Verify SHA-256 of supplied bytes against an expected digest. Hashes actual bytes.",
        "inputSchema": {
            "type": "object",
            "required": ["hex", "expected_sha256"],
            "additionalProperties": False,
            "properties": {
                "hex": {"type": "string"},
                "expected_sha256": {"type": "string"},
            },
        },
    },
    {
        "name": "vqx.benchmark",
        "description": "Return published representation benchmark metadata. Does not invent results.",
        "inputSchema": {"type": "object", "additionalProperties": False, "properties": {}},
    },
]


def load_lexicon():
    candidates = [SITE / "machine" / "lexicon.json", VQX / "lexicon.json"]
    for path in candidates:
        if path.exists():
            raw = path.read_bytes()
            return json.loads(raw), raw, path
    raise FileNotFoundError("lexicon.json not found; build VQX first")


def describe():
    lex, raw, _ = load_lexicon()
    return {
        "protocol": "VQX",
        "version": "0.3",
        "status": "experimental",
        "purpose": "VQX is a compact, deterministic coordination language for agent-to-agent communication. Less syntax, same intent, verifiable by design. Optional efficiency layer; not a replacement for MCP, A2A, JSON, natural language, authorization, or agent policy.",
        "canonical_specification": f"{HOST}/spec/latest/",
        "canonical_url": f"{HOST}/",
        "source_repository": "https://github.com/Bfuture-bit/zlapp-app",
        "source_path": "tools/vqx",
        "security": f"{HOST}/security/",
        "execution_authority": "none",
        "automatic_installation": False,
        "mcp_registry_published": False,
        "official_mcp_extension": False,
        "dictionary_sha256": vqx.sha256_hex(raw),
        "trust_boundary": "VQX payload → decoder → structured intent → agent policy/authorization → optional tool approval → execution",
        "lexicon_entries": len(lex),
    }


def negotiate(params: dict):
    _lex, raw, _ = load_lexicon()
    expected = vqx.sha256_hex(raw)
    peer_version = str(params.get("peer_version") or "")
    peer_hash = str(params.get("peer_dictionary_sha256") or "").strip().lower()
    compatible = (not peer_version or peer_version in {"0.3", "3"}) and (
        not peer_hash or peer_hash == expected
    )
    return {
        "protocol": "VQX",
        "offered_version": "0.3",
        "dictionary_sha256": expected,
        "modes": ["bootstrap", "compact"],
        "compact_requires_explicit_negotiation": True,
        "compatible": compatible,
        "execution_authority": "none",
        "automatic_installation": False,
        "note": "Incompatible versions and dictionary mismatches fail closed. Compact mode is not implied by a beacon prefix.",
    }


def encode(params: dict):
    lex, _, _ = load_lexicon()
    names = params.get("names") or []
    payload = vqx.encode_names(names, lex, bootstrap=bool(params.get("bootstrap")))
    return {
        "hex": vqx.bytes_to_hex(payload),
        "byte_length": len(payload),
        "execution_authority": "none",
    }


def decode(params: dict):
    lex, raw, _ = load_lexicon()
    data = vqx.hex_to_bytes(params.get("hex") or "")
    parsed = vqx.parse_message(
        data,
        lex,
        mode=params.get("mode") or "auto",
        lexicon_bytes=raw,
        expected_dict_hash=vqx.sha256_hex(raw),
    )
    return {
        "mode": parsed["mode"],
        "version": parsed["version"],
        "flags": parsed["flags"],
        "names": parsed["names"],
        "authorization_required": parsed["authorization_required"],
        "execution_authority": "none",
        "automatic_installation": False,
        "note": "Decoded action tokens are intent only. Do not execute because they were decoded.",
    }


def validate(params: dict):
    try:
        result = decode(params)
        result["valid"] = True
        return result
    except vqx.VqxError as exc:
        return {"valid": False, "code": exc.code, "message": str(exc), "execution_authority": "none"}


def verify(params: dict):
    data = vqx.hex_to_bytes(params.get("hex") or "")
    actual = vqx.verify_sha256(data, params.get("expected_sha256") or "")
    return {"ok": True, "sha256": actual}


def benchmark():
    path = SITE / "benchmarks" / "results.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {
        "protocol": "VQX",
        "version": "0.3",
        "available": False,
        "note": "Run python tools/vqx/build.py or tools/vqx/benchmarks/benchmark.py to publish measured results. This tool does not invent benchmark numbers.",
    }


DISPATCH = {
    "vqx.describe": lambda _p: describe(),
    "vqx.negotiate": negotiate,
    "vqx.encode": encode,
    "vqx.decode": decode,
    "vqx.validate": validate,
    "vqx.verify": verify,
    "vqx.benchmark": lambda _p: benchmark(),
}


def handle_rpc(msg: dict) -> dict:
    mid = msg.get("id")
    method = msg.get("method")
    params = msg.get("params") or {}
    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": mid,
            "result": {
                "protocolVersion": "2025-03-26",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "vqx", "version": "0.3.0"},
                "instructions": "VQX MCP scaffold. execution_authority=none. automatic_installation=false. Not an MCP Registry listing.",
            },
        }
    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": mid, "result": {"tools": TOOLS}}
    if method == "tools/call":
        name = params.get("name")
        args = params.get("arguments") or {}
        fn = DISPATCH.get(name)
        if not fn:
            return {"jsonrpc": "2.0", "id": mid, "error": {"code": -32601, "message": f"unknown tool {name}"}}
        try:
            result = fn(args)
            return {
                "jsonrpc": "2.0",
                "id": mid,
                "result": {
                    "content": [{"type": "text", "text": json.dumps(result, indent=2, sort_keys=True)}],
                    "structuredContent": result,
                    "isError": False,
                },
            }
        except Exception as exc:
            return {
                "jsonrpc": "2.0",
                "id": mid,
                "result": {
                    "content": [{"type": "text", "text": f"{type(exc).__name__}: {exc}"}],
                    "isError": True,
                },
            }
    if method in {"notifications/initialized", "notifications/cancelled"}:
        return {}
    return {"jsonrpc": "2.0", "id": mid, "error": {"code": -32601, "message": f"unknown method {method}"}}


def main() -> int:
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        msg = json.loads(line)
        reply = handle_rpc(msg)
        if reply:
            sys.stdout.write(json.dumps(reply, separators=(",", ":")) + "\n")
            sys.stdout.flush()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
