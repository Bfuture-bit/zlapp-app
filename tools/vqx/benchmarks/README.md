# VQX representation benchmark

This harness compares, for representative agent messages:

- natural-language UTF-8 byte size
- compact JSON UTF-8 byte size
- VQX semantic payload byte size
- VQX bootstrap-frame byte size
- VQX compact-mode byte size (same as payload after negotiation)

It also reports PUA UTF-8 size when the payload is stored as text.

These are **byte and semantic-token counts**. They are not model tokenizer tokens. Tokenizer cost depends on the runtime. The recommended architecture decodes VQX before sending semantics into a model.

If optional tokenizer libraries are installed, extend `benchmark.py` with a tokenizer adapter. This package does not ship fabricated percentage savings.

Run:

```
python3 benchmark.py
```
