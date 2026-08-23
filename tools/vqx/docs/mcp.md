# VQX with MCP (specification 2026-07-28)

This document is **non-normative**. VQX is not an official MCP extension and is not endorsed by the MCP project.

Experimental identifier: `app.zlapp.vqx`

## Stateless MCP

MCP 2026-07-28 treats JSON-RPC requests as the unit of work. Servers may be stateless across requests. Optional `initialize` / capability discovery exists, but implementations must not assume a long-lived negotiated session unless they explicitly keep one.

Implications for VQX:

- Prefer **bootstrap frames** (beacon + version + flags + payload) when a message might reach a peer that has no remembered VQX table.
- Local macros (`DEFINE_LOCAL` / `REF_LOCAL`) must not silently persist across unrelated peers or across stateless request boundaries unless both sides include a `LOCAL_TABLE_HASH` (or equivalent) in transport metadata / `_meta` and verify it.
- `CLEAR_LOCAL` at the end of a task is recommended.

## Advertising capability

A VQX-aware MCP client or server MAY include experimental metadata without breaking ordinary MCP peers:

```json
{
  "_meta": {
    "app.zlapp.vqx": {
      "protocol": "VQX",
      "version": "0.2",
      "manifest": "https://vqx.zlapp.app/.well-known/vqx.json",
      "dictionary_sha256": "<from manifest>",
      "modes": ["bootstrap", "compact"],
      "dynamic_macros": true
    }
  }
}
```

Unknown `_meta` keys must be ignored by unaware implementations. Do not require VQX to speak MCP.

## Content

If both sides agree, a tool result or message payload may carry VQX bytes (binary) or PUA text. Receivers must fail closed on version or dictionary mismatch.

This host does not operate a live MCP server.
