"""VQX 0.3 Python codec tests."""
from __future__ import annotations

import hashlib
import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
for cand in (HERE.parent / "codecs", HERE.parent):
    if (cand / "vqx.py").exists() and str(cand) not in sys.path:
        sys.path.insert(0, str(cand)); break
import vqx  # noqa: E402


def load_lexicon():
    env = os.environ.get("VQX_ROOT")
    candidates = []
    if env:
        root = Path(env); candidates += [root / "lexicon.json", root / "machine" / "lexicon.json"]
    candidates += [HERE.parent / "lexicon.json", HERE.parent.parent.parent / "site" / "public" / "sites" / "vqx" / "machine" / "lexicon.json", HERE.parent / "machine" / "lexicon.json"]
    for p in candidates:
        if p.exists():
            raw = p.read_bytes(); return json.loads(raw), raw, p
    raise SystemExit("lexicon.json not found")


def expect(code, fn):
    try: fn()
    except vqx.VqxError as e:
        assert e.code == code, (e.code, code); return
    raise AssertionError(f"expected {code}")


def test_roundtrip_pua():
    for i in range(256):
        b=bytes([i]); p=vqx.bytes_to_pua(b)
        assert vqx.pua_to_bytes(p)==b and ord(p)==0xE000+i


def test_legacy():
    lex,_,_=load_lexicon(); raw=bytes([0x06,0x11,0x20,0xA0])
    assert vqx.decode_ids(raw,lex)==["REQUEST","PEER","RESPOND","GLYPH_ONLY"]
    assert vqx.encode_names(["REQUEST","PEER","RESPOND","GLYPH_ONLY"],lex)==raw


def test_bootstrap_and_flags():
    lex,_,_=load_lexicon(); sample=bytes([0xD3,0xA7,0x5C,0xE1,0x9B,0x02,0x03,0x00,0x06,0x11,0x20,0xA0])
    p=vqx.parse_message(sample,lex,mode="bootstrap")
    assert p["version"]==3 and p["names"]==["REQUEST","PEER","RESPOND","GLYPH_ONLY"]
    expect("VQX_VERSION", lambda: vqx.strip_bootstrap(sample[:6]+bytes([0x99,0])+sample[8:], mode="bootstrap"))
    expect("VQX_FLAGS", lambda: vqx.strip_bootstrap(sample[:7]+bytes([1])+sample[8:], mode="bootstrap"))
    expect("VQX_BEACON", lambda: vqx.strip_bootstrap(bytes([0x06]), mode="bootstrap"))


def test_explicit_compact_avoids_beacon_collision():
    # The family beacon bytes are valid byte values; negotiated compact mode must not heuristically reframe them.
    lex,_,_=load_lexicon(); collision=vqx.BEACON + bytes([0x06])
    p=vqx.strip_bootstrap(collision, mode="compact")
    assert p["mode"]=="compact" and p["payload"]==collision


def test_digest_verification():
    lex,raw,_=load_lexicon(); h=hashlib.sha256(raw).hexdigest()
    parsed=vqx.parse_message(bytes([0x05]),lex,mode="compact",lexicon_bytes=raw,expected_dict_hash=h)
    assert parsed["names"]==["ACK"]
    expect("VQX_DIGEST", lambda: vqx.parse_message(bytes([0x05]),lex,mode="compact",lexicon_bytes=raw,expected_dict_hash="00"*32))
    expect("VQX_DICT_REQUIRED", lambda: vqx.parse_message(bytes([0x05]),lex,mode="compact",expected_dict_hash=h))


def test_macros_and_limits():
    lex,_,_=load_lexicon(); graph=vqx.encode_names(["REQUEST","PEER","RESPOND","GLYPH_ONLY","KEEP_CONTEXT","KEEP_CONSTRAINTS","SEARCH_IF","TOOL_IF","ACCURACY_FIRST","FINAL_ONLY"],lex)
    slot=0xE0; framed=bytes([0xDC,slot,len(graph)])+graph+bytes([0xDD,slot,0xDD,slot,0xDD,slot])
    table=vqx.LocalTable(); expanded=table.expand(framed)
    assert expanded==graph*3 and len(framed)<len(graph)*3 and len(table.table_hash())==64
    expect("VQX_TRUNCATED_MACRO", lambda: vqx.LocalTable().expand(bytes([0xDC])))
    expect("VQX_TRUNCATED_MACRO", lambda: vqx.LocalTable().expand(bytes([0xDC,0xE0,4,1,2])))
    expect("VQX_TRUNCATED_MACRO", lambda: vqx.LocalTable().expand(bytes([0xDD])))
    expect("VQX_LOCAL_UNDEF", lambda: vqx.LocalTable().expand(bytes([0xDD,0xE0])))
    expect("VQX_LOCAL_DIRECT", lambda: vqx.LocalTable().expand(bytes([0xE0])))
    expect("VQX_LOCAL_CONTENT", lambda: vqx.LocalTable().define(0xE0,bytes([0xDD])))
    expect("VQX_EXPANSION_LIMIT", lambda: vqx.LocalTable().expand(framed,max_expanded_size=4))


def test_authority_metadata():
    lex,_,_=load_lexicon(); raw=vqx.encode_names(["REQUEST","PEER","EXECUTE","TOOL"],lex)
    p=vqx.parse_message(raw,lex,mode="compact")
    assert p["authorization_required"]==["EXECUTE"]


def test_size_and_strict_input():
    expect("VQX_FRAME_SIZE", lambda: vqx.wrap_bootstrap(b"12345",max_frame_size=4))
    expect("VQX_NON_PUA", lambda: vqx.pua_to_bytes("hello",strict=True))


def main():
    for fn in [test_roundtrip_pua,test_legacy,test_bootstrap_and_flags,test_explicit_compact_avoids_beacon_collision,test_digest_verification,test_macros_and_limits,test_authority_metadata,test_size_and_strict_input]: fn()
    print("python codec tests ok")

if __name__=="__main__": main()
