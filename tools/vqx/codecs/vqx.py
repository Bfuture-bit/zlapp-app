"""VQX 0.2 reference codec (Python). Canonical tokens are bytes 0x00–0xFF."""

from __future__ import annotations

VERSION = 0x02
BEACON = bytes([0xD3, 0xA7, 0x5C, 0xE1, 0x9B, 0x02])
PUA_BASE = 0xE000


class VqxError(Exception):
    def __init__(self, code, message):
        super().__init__(message)
        self.code = code


def bytes_to_pua(data: bytes) -> str:
    return "".join(chr(PUA_BASE + b) for b in data)


def pua_to_bytes(text: str, strict: bool = True) -> bytes:
    out = bytearray()
    for ch in text:
        cp = ord(ch)
        if PUA_BASE <= cp <= PUA_BASE + 255:
            out.append(cp - PUA_BASE)
        elif ch.isspace():
            continue
        elif strict:
            raise VqxError("VQX_NON_PUA", "VQX_STRICT: non-PUA codepoint in payload")
    return bytes(out)


def hex_to_bytes(hexstr: str) -> bytes:
    s = "".join(c for c in hexstr if c in "0123456789abcdefABCDEF")
    if len(s) % 2:
        raise VqxError("VQX_HEX", "odd hex length")
    return bytes.fromhex(s)


def bytes_to_hex(data: bytes) -> str:
    return " ".join(f"{b:02x}" for b in data)


def has_beacon(data: bytes) -> bool:
    return len(data) >= 6 and data[:6] == BEACON


def wrap_bootstrap(payload: bytes, version: int = VERSION, flags: int = 0) -> bytes:
    return BEACON + bytes([version, flags]) + payload


def strip_bootstrap(data: bytes, expect_version: int | None = VERSION) -> dict:
    if not has_beacon(data):
        return {"mode": "compact", "version": None, "flags": None, "payload": data}
    if len(data) < 8:
        raise VqxError("VQX_TRUNCATED", "VQX_FRAME: truncated bootstrap")
    version, flags = data[6], data[7]
    if expect_version is not None and version != expect_version:
        raise VqxError("VQX_VERSION", "VQX_VERSION: fail closed")
    return {"mode": "bootstrap", "version": version, "flags": flags, "payload": data[8:]}


def index_lexicon(lexicon):
    by_name = {e["human_name"]: e for e in lexicon}
    by_id = {e["id"]: e for e in lexicon}
    return by_name, by_id


def encode_names(names, lexicon, bootstrap=False) -> bytes:
    by_name, _ = index_lexicon(lexicon)
    ids = []
    for raw in names:
        name = str(raw).strip().upper()
        if not name:
            continue
        e = by_name.get(name)
        if not e:
            raise VqxError("VQX_UNKNOWN_NAME", f"VQX_UNKNOWN_NAME:{name}")
        ids.append(e["id"])
    payload = bytes(ids)
    return wrap_bootstrap(payload) if bootstrap else payload


def decode_ids(data: bytes, lexicon) -> list[str]:
    _, by_id = index_lexicon(lexicon)
    names = []
    for i in data:
        e = by_id.get(i)
        if not e:
            raise VqxError("VQX_UNKNOWN_ID", f"VQX_UNKNOWN_ID:{i}")
        names.append(e["human_name"])
    return names


def assert_dict_hash(actual, expected):
    if expected is None:
        return
    if str(actual).lower() != str(expected).lower():
        raise VqxError("VQX_DICT", "VQX_DICT: fail closed")


class LocalTable:
    def __init__(self):
        self.slots: dict[int, bytes] = {}

    def define(self, slot: int, sequence: bytes):
        if slot < 0xE0 or slot > 0xFF:
            raise VqxError("VQX_LOCAL_SLOT", "invalid local slot")
        self.slots[slot] = bytes(sequence)

    def ref(self, slot: int) -> bytes:
        if slot not in self.slots:
            raise VqxError("VQX_LOCAL_UNDEF", "undefined local slot")
        return self.slots[slot]

    def clear(self):
        self.slots.clear()

    def expand(self, payload: bytes) -> bytes:
        out = bytearray()
        i = 0
        b = payload
        while i < len(b):
            if b[i] == 0xDC:
                slot = b[i + 1]
                ln = b[i + 2]
                seq = b[i + 3 : i + 3 + ln]
                self.define(slot, seq)
                i += 3 + ln
                continue
            if b[i] == 0xDD:
                out.extend(self.ref(b[i + 1]))
                i += 2
                continue
            if b[i] == 0xDE:
                self.clear()
                i += 1
                continue
            out.append(b[i])
            i += 1
        return bytes(out)


def parse_message(data: bytes, lexicon, expect_version=VERSION, actual_dict_hash=None, expected_dict_hash=None, local_table=None):
    framed = strip_bootstrap(data, expect_version=expect_version)
    assert_dict_hash(actual_dict_hash, expected_dict_hash)
    table = local_table or LocalTable()
    expanded = table.expand(framed["payload"])
    names = decode_ids(expanded, lexicon)
    return {**framed, "expanded": expanded, "names": names, "local_table": table}
