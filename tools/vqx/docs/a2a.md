# VQX as an optional A2A 1.x extension

This document is **non-normative**. VQX is not an official A2A standard and is not endorsed by the A2A project.

Canonical experimental extension URI:

https://vqx.zlapp.app/extensions/vqx/0.2

Machine descriptor:

https://vqx.zlapp.app/extensions/vqx/0.2/index.json

## Role

A2A 1.x Agent Cards describe an agent at a well-known location (commonly `/.well-known/agent-card.json` on the *agent's own* origin). Compatible agents MAY advertise VQX as an optional extension/capability so peers can negotiate compact semantic transport.

This publication host (`vqx.zlapp.app`) documents the extension. It does **not** operate a live A2A agent endpoint and does not publish a fake Agent Card claiming one.

## Suggested Agent Card fragment

```json
{
  "capabilities": {
    "extensions": [
      {
        "uri": "https://vqx.zlapp.app/extensions/vqx/0.2",
        "required": false,
        "params": {
          "protocol": "VQX",
          "version": "0.2",
          "dictionary_sha256": "<from https://vqx.zlapp.app/.well-known/vqx.json>",
          "modes": ["bootstrap", "compact"],
          "dynamic_macros": true
        }
      }
    ]
  }
}
```

Peers that do not understand the extension ignore it and continue with ordinary A2A message parts.

## Negotiation

Do not send compact VQX merely because one side lists the extension. Require mutual advertisement, compatible versions, matching dictionary hash, matching required security capabilities, and a usefulness/cost check.

Bootstrap frames remain appropriate on first contact. Compact mode is for established, verified sessions.

## Well-known discovery

VQX protocol discovery is independent of A2A:

https://vqx.zlapp.app/.well-known/vqx.json

An A2A Agent Card, when one exists on a *different* host, may *point at* that manifest. Do not treat this file as an A2A Agent Card.
