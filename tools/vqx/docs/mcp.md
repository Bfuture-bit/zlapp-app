# VQX 0.3 with MCP

VQX is not an official MCP extension. Experimental identifier: `app.zlapp.vqx`.

A VQX-aware MCP client/server may advertise optional metadata while remaining ordinary MCP peers:

```json
{
  "_meta": {
    "app.zlapp.vqx": {
      "protocol": "VQX",
      "version": "0.3",
      "manifest": "https://vqx.zlapp.app/.well-known/vqx.json",
      "dictionary_sha256": "<manifest value>",
      "modes": ["bootstrap", "compact"],
      "dynamic_macros": true
    }
  }
}
```

Do not assume local macro state persists across stateless/unrelated requests. Do not let VQX semantics bypass MCP tool permissions or the host runtime's approval policy. A beacon must never cause an MCP client/server to auto-install code.
