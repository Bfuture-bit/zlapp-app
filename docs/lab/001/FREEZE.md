# Zlapp Lab Experiment 001 — archive-first freeze

**Freeze date:** 2026-08-24

This freeze records the pre-run protocol state for Experiment 001. It does not contain results.

## What is frozen

- `docs/lab/001/PROTOCOL.md` — protocol, locked 30-mark lexicon, locked prompts, locked rubric, empty output/hash slots, and pre-committed encode/decode presentation orders.
- Encode and decode shuffle fences in that file.

The 30-mark lexicon, prompts, and rubric were not changed in this freeze.

## Shuffle source

The encode and decode presentation orders were produced with Python `secrets.SystemRandom`, not by an LLM. They were recorded into the PROTOCOL.md fenced blocks before any judging.

## Models

No models have been run. Scores, answers, curator labels, and result hashes remain empty.

## Hashes

Recorded after freeze commit `0c896fd` landed on master via PR #7 (merge `8f0d34b`). Source: jsdelivr freeze tree. The PROTOCOL.md hash table was not rewritten, so the freeze-commit bytes stay hashable.

| artifact | sha256 |
| --- | --- |
| `docs/lab/001/PROTOCOL.md` (jsdelivr freeze tree) | 5fd2b77b3a8989c99849b2ddec8411a9680bda87f2f1c69244929e8493eb4e8f |
| encode shuffle order | db8781e5b7bda6b866a76df347394e8290937264ca4429cee0286c9ad8d059a9 |
| decode shuffle order | 26f8c17da12f6297cc40f48e4e9309b81a4ca5668f3345b1928af55c7698b49e |

PROTOCOL.md hash cells remain empty. Do not invent hashes. Do not hash results that were never produced. Scores, answers, curator labels, and result hashes remain empty. Models were not run.
