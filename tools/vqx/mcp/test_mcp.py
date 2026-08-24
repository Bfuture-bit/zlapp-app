#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""MCP scaffold tests. Requires a built lexicon."""

from __future__ import annotations

import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import server as mcp  # noqa: E402


def eq(a, b, msg=""):
    if a != b:
        raise AssertionError(f"{msg}: {a!r} != {b!r}")


def test_describe():
    d = mcp.describe()
    eq(d["execution_authority"], "none")
    eq(d["automatic_installation"], False)
    eq(d["mcp_registry_published"], False)
    eq(d["official_mcp_extension"], False)


def test_encode_decode_execute_is_not_authority():
    enc = mcp.encode({"names": ["REQUEST", "PEER", "EXECUTE", "TOOL"], "bootstrap": True})
    dec = mcp.decode({"hex": enc["hex"], "mode": "bootstrap"})
    eq(dec["names"], ["REQUEST", "PEER", "EXECUTE", "TOOL"])
    eq(dec["authorization_required"], ["EXECUTE"])
    eq(dec["execution_authority"], "none")
    eq(dec["automatic_installation"], False)


def test_validate_fail_closed():
    bad = mcp.validate({"hex": "00", "mode": "bootstrap"})
    eq(bad["valid"], False)
    assert bad.get("code")


def test_negotiate_mismatch():
    n = mcp.negotiate({"peer_version": "0.2", "peer_dictionary_sha256": "00" * 32})
    eq(n["compatible"], False)
    eq(n["automatic_installation"], False)


def test_tools_list_rpc():
    reply = mcp.handle_rpc({"jsonrpc": "2.0", "id": 1, "method": "tools/list"})
    names = [t["name"] for t in reply["result"]["tools"]]
    for n in ["vqx.describe", "vqx.negotiate", "vqx.encode", "vqx.decode", "vqx.validate", "vqx.verify", "vqx.benchmark"]:
        assert n in names


def main():
    test_describe()
    test_encode_decode_execute_is_not_authority()
    test_validate_fail_closed()
    test_negotiate_mismatch()
    test_tools_list_rpc()
    print("mcp scaffold tests ok")


if __name__ == "__main__":
    main()
