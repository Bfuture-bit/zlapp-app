# SPDX-License-Identifier: Apache-2.0
"""VQX 0.3 reference codec (Python).

The codec is intentionally pure: it performs no network access, tool execution,
process creation, package installation, or authorization decisions. Canonical
semantic tokens are bytes 0x00-0xFF.
"""

from __future__ import annotations

import hashlib

VERSION = 0x03
BEACON = bytes([0xD3, 0xA7, 0x5C, 0xE1, 0x9B, 0x02])
PUA_BASE = 0xE000
SUPPORTED_FLAGS_MASK = 0x00
DEFAULT_MAX_FRAME_SIZE = 65535
DEFAULT_MAX_EXPANDED_SIZE = 65535
LOCAL_DEFINE = 0xDC
LOCAL_REF = 0xDD
LOCAL_CLEAR = 0xDE
LOCAL_TABLE_HASH = 0xDF
LOCAL_MIN = 0xE0
LOCAL_MAX = 0xFF


class VqxError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


def _err(code: str, message: str):
    raise VqxError(code, message)


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(bytes(data)).hexdigest()


def verify_sha256(data: bytes, expected: str) -> str:
    actual = sha256_hex(data)
    if actual.lower() != str(expected).strip().lower():
        _err("VQX_DIGEST", "VQX_DIGEST: SHA-256 mismatch; fail closed")
    return actual


def bytes_to_pua(data: bytes) -> str:
    return "".join(chr(PUA_BASE + b) for b in bytes(data))


def pua_to_bytes(text: str, strict: bool = True) -> bytes:
    out = bytearray()
    for ch in text:
        cp = ord(ch)
        if PUA_BASE <= cp <= PUA_BASE + 255:
            out.append(cp - PUA_BASE)
        elif ch.isspace():
            continue
        elif strict:
            _err("VQX_NON_PUA", "VQX_STRICT: non-PUA codepoint in payload")
    return bytes(out)


def hex_to_bytes(hexstr: str) -> bytes:
    s = "".join(c for c in str(hexstr) if c in "0123456789abcdefABCDEF")
    if len(s) % 2:
        _err("VQX_HEX", "odd hex length")
    return bytes.fromhex(s)


def bytes_to_hex(data: bytes) -> str:
    return " ".join(f"{b:02x}" for b in bytes(data))


def has_beacon(data: bytes) -> bool:
    b = bytes(data)
    return len(b) >= len(BEACON) and b[: len(BEACON)] == BEACON


def wrap_bootstrap(payload: bytes, version: int = VERSION, flags: int = 0, *, max_frame_size: int = DEFAULT_MAX_FRAME_SIZE) -> bytes:
    p = bytes(payload)
    if len(p) > max_frame_size:
        _err("VQX_FRAME_SIZE", "VQX_FRAME_SIZE: payload exceeds configured maximum")
    if flags & ~SUPPORTED_FLAGS_MASK:
        _err("VQX_FLAGS", "VQX_FLAGS: unsupported flags; fail closed")
    if not 0 <= version <= 255:
        _err("VQX_VERSION", "VQX_VERSION: invalid version byte")
    return BEACON + bytes([version, flags]) + p


def strip_bootstrap(
    data: bytes,
    expect_version: int | None = VERSION,
    *,
    mode: str = "auto",
    allowed_flags_mask: int = SUPPORTED_FLAGS_MASK,
    max_frame_size: int = DEFAULT_MAX_FRAME_SIZE,
) -> dict:
    """Separate VQX framing from the payload.

    mode="bootstrap" requires the beacon. mode="compact" never interprets a
    leading beacon-looking byte sequence as framing. mode="auto" exists only
    for discovery/backward compatibility and MUST NOT be used as a negotiated
    compact-session framing oracle.
    """
    b = bytes(data)
    if mode not in {"auto", "bootstrap", "compact"}:
        _err("VQX_MODE", "VQX_MODE: expected auto, bootstrap, or compact")

    if mode == "compact":
        if len(b) > max_frame_size:
            _err("VQX_FRAME_SIZE", "VQX_FRAME_SIZE: compact payload exceeds configured maximum")
        return {"mode": "compact", "version": None, "flags": None, "payload": b}

    beacon = has_beacon(b)
    if mode == "bootstrap" and not beacon:
        _err("VQX_BEACON", "VQX_BEACON: required bootstrap beacon missing")
    if mode == "auto" and not beacon:
        if len(b) > max_frame_size:
            _err("VQX_FRAME_SIZE", "VQX_FRAME_SIZE: compact payload exceeds configured maximum")
        return {"mode": "compact", "version": None, "flags": None, "payload": b}

    if len(b) < 8:
        _err("VQX_TRUNCATED", "VQX_FRAME: truncated bootstrap")
    payload = b[8:]
    if len(payload) > max_frame_size:
        _err("VQX_FRAME_SIZE", "VQX_FRAME_SIZE: bootstrap payload exceeds configured maximum")
    version, flags = b[6], b[7]
    if expect_version is not None and version != expect_version:
        _err("VQX_VERSION", "VQX_VERSION: incompatible version; fail closed")
    if flags & ~allowed_flags_mask:
        _err("VQX_FLAGS", "VQX_FLAGS: unsupported flags; fail closed")
    return {"mode": "bootstrap", "version": version, "flags": flags, "payload": payload}


def validate_lexicon(lexicon) -> None:
    if not isinstance(lexicon, list) or len(lexicon) != 256:
        _err("VQX_LEXICON", "VQX_LEXICON: expected exactly 256 entries")
    ids = [e.get("id") for e in lexicon if isinstance(e, dict)]
    names = [e.get("human_name") for e in lexicon if isinstance(e, dict)]
    if len(ids) != 256 or sorted(ids) != list(range(256)):
        _err("VQX_LEXICON", "VQX_LEXICON: byte IDs must be unique 0..255")
    if len(set(names)) != 256 or any(not isinstance(n, str) or not n for n in names):
        _err("VQX_LEXICON", "VQX_LEXICON: human names must be unique non-empty strings")


def index_lexicon(lexicon):
    validate_lexicon(lexicon)
    by_name = {e["human_name"]: e for e in lexicon}
    by_id = {e["id"]: e for e in lexicon}
    return by_name, by_id


def encode_names(names, lexicon, bootstrap: bool = False) -> bytes:
    by_name, _ = index_lexicon(lexicon)
    ids = []
    for raw in names:
        name = str(raw).strip().upper()
        if not name:
            continue
        e = by_name.get(name)
        if not e:
            _err("VQX_UNKNOWN_NAME", f"VQX_UNKNOWN_NAME:{name}")
        ids.append(e["id"])
    payload = bytes(ids)
    return wrap_bootstrap(payload) if bootstrap else payload


def decode_ids(data: bytes, lexicon, *, allow_local_slots: bool = False) -> list[str]:
    _, by_id = index_lexicon(lexicon)
    names = []
    for i in bytes(data):
        if LOCAL_MIN <= i <= LOCAL_MAX and not allow_local_slots:
            _err("VQX_LOCAL_DIRECT", f"VQX_LOCAL_DIRECT:{i}: local slots must be expanded through REF_LOCAL")
        e = by_id.get(i)
        if not e:
            _err("VQX_UNKNOWN_ID", f"VQX_UNKNOWN_ID:{i}")
        names.append(e["human_name"])
    return names


def decode_entries(data: bytes, lexicon, *, allow_local_slots: bool = False) -> list[dict]:
    _, by_id = index_lexicon(lexicon)
    out = []
    for i in bytes(data):
        if LOCAL_MIN <= i <= LOCAL_MAX and not allow_local_slots:
            _err("VQX_LOCAL_DIRECT", f"VQX_LOCAL_DIRECT:{i}: local slots must be expanded through REF_LOCAL")
        e = by_id.get(i)
        if not e:
            _err("VQX_UNKNOWN_ID", f"VQX_UNKNOWN_ID:{i}")
        out.append(e)
    return out


class LocalTable:
    def __init__(self):
        self.slots: dict[int, bytes] = {}

    def define(self, slot: int, sequence: bytes):
        if slot < LOCAL_MIN or slot > LOCAL_MAX:
            _err("VQX_LOCAL_SLOT", "VQX_LOCAL_SLOT: invalid local slot")
        seq = bytes(sequence)
        if not seq:
            _err("VQX_LOCAL_EMPTY", "VQX_LOCAL_EMPTY: local macro sequence must not be empty")
        if any(x >= LOCAL_DEFINE for x in seq):
            _err("VQX_LOCAL_CONTENT", "VQX_LOCAL_CONTENT: macro definitions cannot contain control/local bytes DC-FF")
        self.slots[slot] = seq

    def ref(self, slot: int) -> bytes:
        if slot not in self.slots:
            _err("VQX_LOCAL_UNDEF", "VQX_LOCAL_UNDEF: undefined local slot")
        return self.slots[slot]

    def clear(self):
        self.slots.clear()

    def table_hash(self) -> str:
        data = bytearray()
        for slot in sorted(self.slots):
            seq = self.slots[slot]
            data.extend([slot, len(seq)])
            data.extend(seq)
        return sha256_hex(bytes(data))

    def expand(self, payload: bytes, *, max_expanded_size: int = DEFAULT_MAX_EXPANDED_SIZE) -> bytes:
        out = bytearray()
        i = 0
        b = bytes(payload)
        while i < len(b):
            op = b[i]
            if op == LOCAL_DEFINE:
                if i + 3 > len(b):
                    _err("VQX_TRUNCATED_MACRO", "VQX_TRUNCATED_MACRO: DEFINE_LOCAL header truncated")
                slot = b[i + 1]
                ln = b[i + 2]
                if ln == 0:
                    _err("VQX_LOCAL_EMPTY", "VQX_LOCAL_EMPTY: zero-length macro definition")
                end = i + 3 + ln
                if end > len(b):
                    _err("VQX_TRUNCATED_MACRO", "VQX_TRUNCATED_MACRO: DEFINE_LOCAL body truncated")
                self.define(slot, b[i + 3 : end])
                i = end
                continue
            if op == LOCAL_REF:
                if i + 2 > len(b):
                    _err("VQX_TRUNCATED_MACRO", "VQX_TRUNCATED_MACRO: REF_LOCAL truncated")
                out.extend(self.ref(b[i + 1]))
                i += 2
            elif op == LOCAL_CLEAR:
                self.clear()
                i += 1
            elif LOCAL_MIN <= op <= LOCAL_MAX:
                _err("VQX_LOCAL_DIRECT", f"VQX_LOCAL_DIRECT:{op}: local slot used without REF_LOCAL")
            else:
                out.append(op)
                i += 1
            if len(out) > max_expanded_size:
                _err("VQX_EXPANSION_LIMIT", "VQX_EXPANSION_LIMIT: local macro expansion exceeds configured maximum")
        return bytes(out)


def parse_message(
    data: bytes,
    lexicon,
    *,
    expect_version: int | None = VERSION,
    mode: str = "auto",
    lexicon_bytes: bytes | None = None,
    expected_dict_hash: str | None = None,
    local_table: LocalTable | None = None,
    max_frame_size: int = DEFAULT_MAX_FRAME_SIZE,
    max_expanded_size: int = DEFAULT_MAX_EXPANDED_SIZE,
):
    if expected_dict_hash is not None:
        if lexicon_bytes is None:
            _err("VQX_DICT_REQUIRED", "VQX_DICT_REQUIRED: raw lexicon bytes required for digest verification")
        verify_sha256(lexicon_bytes, expected_dict_hash)
    framed = strip_bootstrap(data, expect_version=expect_version, mode=mode, max_frame_size=max_frame_size)
    table = local_table or LocalTable()
    expanded = table.expand(framed["payload"], max_expanded_size=max_expanded_size)
    entries = decode_entries(expanded, lexicon)
    names = [e["human_name"] for e in entries]
    def _auth_required(entry: dict) -> bool:
        sem = entry.get("machine_semantics") or {}
        return sem.get("auth_required") is True or sem.get("auth_required") is True

    auth_required = [e["human_name"] for e in entries if _auth_required(e)]
    return {
        **framed,
        "expanded": expanded,
        "names": names,
        "entries": entries,
        "authorization_required": auth_required,
        "local_table": table,
    }
