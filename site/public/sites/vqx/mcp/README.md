# VQX MCP scaffold

Status: **experimental local scaffold**. VQX is **not** published in the MCP
Registry and is **not** an official MCP extension.

Identifier (experimental only): `app.zlapp.vqx`

Run locally from this candidate tree only (not a live MCP endpoint; `live_endpoint` is null):

```bash
python tools/vqx/mcp/server.py
```

The server speaks JSON-RPC 2.0 on stdio (`initialize`, `tools/list`,
`tools/call`). Tools:

| Tool | Role |
|---|---|
| `vqx.describe` | protocol identity and trust boundary |
| `vqx.negotiate` | version/dictionary compatibility |
| `vqx.encode` | names → bytes |
| `vqx.decode` | bytes → structured intent |
| `vqx.validate` | fail-closed validation |
| `vqx.verify` | SHA-256 of actual supplied bytes |
| `vqx.benchmark` | published measured results only |

The decoder path has `execution_authority: none` and
`automatic_installation: false`. `EXECUTE` / `INSTALL` remain authorization
required. This process does not call tools, install packages, or follow
beacons.
