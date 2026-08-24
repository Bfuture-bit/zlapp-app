# VQX 0.3 benchmark harness

`benchmark.py` measures **representation size**, not model intelligence. It compares natural-language UTF-8, compact JSON, VQX binary payload/bootstrap size, and—when the libraries are already available—MessagePack and canonical CBOR.

Run:

```bash
python benchmark.py
python benchmark.py --json
```

A valid benchmark claim must state the workload, units, fallback representation, VQX version/dictionary hash, and whether the semantic sequence round-tripped. Do not generalize a small byte-size benchmark into claims about model-token cost, latency, quality, or task success without measuring those separately.
