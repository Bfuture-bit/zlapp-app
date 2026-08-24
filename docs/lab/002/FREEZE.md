# Zlapp Lab Experiment 002 — archive-first freeze

**Freeze date:** 2026-08-24

This freeze records the pre-run protocol state for Experiment 002. It does not contain results. No models were run. Experiment 002 was not executed.

## What is frozen

- `docs/lab/002/PROTOCOL.md` — blind decode-only protocol, locked prompt (no Zlapp / Glyphs / ids), locked rubric including H-ID, frozen never-001 subject set (H-001), H-BYTES / H-REPO isolation, empty output/hash slots, and the pre-committed presentation order.
- `docs/lab/002/stims/stim_01.svg` … `stim_30.svg` — opaque copies of in-repo GLYPHS 2 SVGs after H-STRIP (no `aria-label`, `<title>`, `<desc>`, `data-*`, comments, or `agent_` / `:agent_` strings).
- `docs/lab/002/PRESENTATION_MAP.tsv` — `n filename id svg_sha256 bytes` for the stripped stim bytes.

The presentation order, locked prompt, and scoring meanings were not changed after the shuffle was recorded. Guardian holds H-STRIP, H-ID, H-001, H-BYTES, and H-REPO are in the protocol.

## Shuffle source

The presentation order was produced with Python `secrets.SystemRandom`, not by an LLM. It is recorded in `PROTOCOL.md` and `PRESENTATION_MAP.tsv` before any judging:

```text
01 agent_branch_rewind
02 agent_confidence_low
03 agent_schema_drift
04 agent_perm_revoke
05 agent_consensus_pending
06 agent_attention_drift
07 agent_plan_divergence
08 agent_irreversible_write
09 agent_state_handoff
10 agent_tool_latency
11 agent_commit_race
12 agent_memory_gc
13 agent_goal_anchored
14 agent_retry_backoff
15 agent_stream_emit
16 agent_context_pressure
17 agent_human_gate
18 agent_io_await
19 agent_quota_clamp
20 agent_verification_fail
21 agent_lock_starve
22 agent_context_fold
23 agent_instruction_intrusion
24 agent_side_effect_uncertain
25 agent_cache_stale
26 agent_dependency_invalidation
27 agent_fanout_barrier
28 agent_decision_entropy
29 agent_grounding_loss
30 agent_call_cycle
```

## Models

No models have been run. Scores, answers, and result hashes remain empty. Do not execute 002 in this freeze.

All six slots are never-001 catalog ids: S1 `claude-sonnet-4-5`, S2 `claude-haiku-4-5`, S3 `gpt-5.4`, S4 `gemini-3-flash`, S5 `grok-4.5`, S6 `glm-5.2`. Do not use `sand-default` (Experiment 001 M1). S1–S6 must not be launched against `Bfuture-bit/zlapp-app`.

## Hashes

SHA-256 cells in PROTOCOL.md stay empty in this freeze commit.

Hashes of `docs/lab/002/PROTOCOL.md` and of `docs/lab/002/PRESENTATION_MAP.tsv` must be filled only after this commit lands on the archive. Do not invent hashes. Do not hash results that were never produced.

Per-stim `svg_sha256` values in `PRESENTATION_MAP.tsv` are SHA-256 of the stripped stim file bytes in this freeze tree, not protocol-file hashes and not result hashes.
