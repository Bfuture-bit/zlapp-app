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

SHA-256 cells in PROTOCOL.md stay empty in this freeze commit.

Hashes of PROTOCOL.md (and of the encode/decode shuffle orders) must be filled only after this commit lands on the archive. Do not invent hashes. Do not hash results that were never produced.
