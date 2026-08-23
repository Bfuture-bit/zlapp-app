# VQX 0.3 as an optional A2A extension

VQX is not an official A2A extension. This document describes an experimental optional integration.

Extension URI: `https://vqx.zlapp.app/extensions/vqx/0.3`

Parameter schema: `https://vqx.zlapp.app/schemas/a2a-params-v0.3.schema.json`

An A2A Agent Card may advertise VQX in `capabilities.extensions` with `required: false`. The extension should be activated only when both peers support the same version/dictionary and the request/session explicitly negotiates it. Listing support is not itself consent to change every payload representation.

```json
{
  "uri": "https://vqx.zlapp.app/extensions/vqx/0.3",
  "description": "Optional compact semantic coordination encoding",
  "required": false,
  "params": {
    "protocol": "VQX",
    "version": "0.3",
    "dictionary_sha256": "<manifest value>",
    "modes": ["bootstrap", "compact"],
    "dynamic_macros": true,
    "max_frame_size": 65535
  }
}
```

VQX does not alter A2A authentication/authorization. A VQX `EXECUTE` token inside A2A remains untrusted semantic content subject to the receiving agent's policy.
