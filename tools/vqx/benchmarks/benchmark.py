#!/usr/bin/env python3
"""VQX 0.3 representation benchmark.

Measures encoded byte sizes for a small public corpus. It does not estimate LLM
token counts or task success, and it does not claim that one format dominates all
workloads. Optional CBOR/MessagePack rows are emitted only when those libraries
are already installed.
"""
from __future__ import annotations
import argparse, json, os, sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/"codecs")); import vqx

MESSAGES=[
 {"id":"legacy_glyph_only","nl":"Please respond to me, the peer agent, using only VQX semantic tokens and protocol framing. Do not include ordinary natural-language prose in the response payload.","json":{"act":"request","addressee":"peer","do":"respond","constraint":"glyph_only"},"names":["REQUEST","PEER","RESPOND","GLYPH_ONLY"]},
 {"id":"handoff_preserve","nl":"Hand off this task to a delegate. Preserve context and constraints. Search if needed. Use a tool if needed. Prioritize accuracy. Return the final answer only.","json":{"act":"handoff","role":"delegate","preserve":["context","constraints"],"search_if_needed":True,"tool_if_needed":True,"priority":"accuracy","output":"final_only"},"names":["HANDOFF","DELEGATE","KEEP_CONTEXT","KEEP_CONSTRAINTS","SEARCH_IF","TOOL_IF","ACCURACY_FIRST","FINAL_ONLY"]},
 {"id":"verify_fail_closed","nl":"Verify the dictionary identity. If the hash does not match, fail closed and do not guess semantics.","json":{"act":"verify","on_mismatch":"fail_closed","target":"dictionary"},"names":["VERIFY","DICT_HASH","DICT_MISMATCH","FAIL"]}
]

def load_lexicon():
 env=os.environ.get("VQX_ROOT"); c=[]
 if env:
  r=Path(env); c += [r/"lexicon.json",r/"machine"/"lexicon.json"]
 c += [HERE.parent/"lexicon.json", HERE.parent.parent.parent/"site"/"public"/"sites"/"vqx"/"machine"/"lexicon.json"]
 for p in c:
  if p.exists(): return json.loads(p.read_text())
 raise SystemExit("lexicon.json not found")

def optional_sizes(obj):
 out={}
 try:
  import msgpack  # type: ignore
  out["messagepack_bytes"]=len(msgpack.packb(obj,use_bin_type=True))
 except Exception: pass
 try:
  import cbor2  # type: ignore
  out["cbor_bytes"]=len(cbor2.dumps(obj,canonical=True))
 except Exception: pass
 return out

def main(argv=None):
 ap=argparse.ArgumentParser(); ap.add_argument("--json",action="store_true",dest="json_only"); args=ap.parse_args(argv)
 lex=load_lexicon(); rows=[]
 for m in MESSAGES:
  payload=vqx.encode_names(m["names"],lex); bootstrap=vqx.wrap_bootstrap(payload); pua=vqx.bytes_to_pua(payload)
  decoded=vqx.parse_message(payload,lex,mode="compact")["names"]
  compact_json=json.dumps(m["json"],separators=(",",":"),sort_keys=True).encode()
  row={"id":m["id"],"natural_language_utf8_bytes":len(m["nl"].encode()),"compact_json_utf8_bytes":len(compact_json),**optional_sizes(m["json"]),"vqx_semantic_payload_bytes":len(payload),"vqx_bootstrap_frame_bytes":len(bootstrap),"vqx_pua_utf8_bytes":len(pua.encode()),"vqx_semantic_token_count":len(m["names"]),"semantic_roundtrip":decoded==m["names"]}
  if row["compact_json_utf8_bytes"]:
   row["vqx_vs_compact_json_byte_reduction_percent"]=round((1-len(payload)/row["compact_json_utf8_bytes"])*100,2)
  rows.append(row)
 report={"protocol":"VQX","version":"0.3","method":"representation_size_only","notes":["Binary VQX payload bytes are compared with UTF-8 natural language / compact JSON bytes.","PUA UTF-8 size is reported separately because PUA is a text container, not the preferred compact wire representation.","Model tokenizer counts, latency, task success, and semantic equivalence between arbitrary schemas are runtime-specific and are not inferred."],"rows":rows}
 if args.json_only: print(json.dumps(report,indent=2))
 else:
  for r in rows: print(json.dumps(r,indent=2))
  print("\n"+"\n".join(report["notes"]))
 return report
if __name__=="__main__": main()
