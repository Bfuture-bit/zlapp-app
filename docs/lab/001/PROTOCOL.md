# Zlapp Lab Experiment 001 — GLYPHS 2 cross-model encode/decode accuracy

**Status:** protocol only. No models have been run. No results exist.  
**Date opened:** 2026-08-24  
**Archive-first rule:** this protocol, the prompt, the scoring rubric, and the empty output/hash slots below MUST be committed before any run is judged. Outputs filled after this commit are invalid for Experiment 001.

This is a **new** dated experiment. It is **not** the lost Act I/II exhibition run, does not reconstruct those prompts, and does not reproduce that run.

Zlapp’s existing 21 HTML works remain an exhibition with curator/on-page/filename attribution. Glyphs 1 figures **3/5** and **150/23** are curator bookkeeping from the first glyph library. They are not a scientific dataset and are not metrics for this experiment.

## Hypothesis

When shown the same GLYPHS 2 30-mark lexicon, language-model systems used as **variables** will differ in:

1. **Encode accuracy:** given a state meaning, select the matching GLYPHS 2 mark.
2. **Decode accuracy:** given a GLYPHS 2 mark, recover the matching state meaning.

The hypothesis is directional only. It does not predict percentages. Do not generalize other benches. Do not treat a finished table as a standard or a vendor SKU claim.

## Variables (models)

Each run records a **curator-facing label** for the system actually used (session UI name, on-page string, or filename token). That label is **not** a vendor-verified SKU.

Do not add, collapse, or rename marks to match a vendor product list. If a session cannot be labeled honestly, the run is invalid.

| slot | curator label (fill at run time) | session/date | notes |
| --- | --- | --- | --- |
| M1 | | | |
| M2 | | | |
| M3 | | | |
| M4 | | | |
| M5 | | | |
| M6 | | | |

Add rows only before judging that row’s outputs. Do not backfill labels after scoring.

## Lexicon — GLYPHS 2 (30 marks)

Canonical live library: https://zlapp.app/agent-glyphs2  
Canonical metadata: https://zlapp.app/agent-glyphs2/manifest.json  

Use **only** these 30 ids. Invented marks fail closed.

| id | category | meaning (locked for this experiment) |
| --- | --- | --- |
| agent_context_pressure | System States | Context-window occupancy is critical and verbatim information is at risk of eviction. Signals pre-emptive summarization or state handoff. |
| agent_context_fold | System States | Lossy context compression occurred. Downstream agents must not assume verbatim history survived. |
| agent_io_await | System States | Execution is blocked on an external dependency. Outbound call exists, return is empty. Do not duplicate or speculate. |
| agent_retry_backoff | System States | Transient failure with scheduled retry using increasing/jittered exponential backoff. |
| agent_quota_clamp | System States | Rate limit or quota exhaustion such as HTTP 429. Scheduler must throttle or reschedule. |
| agent_perm_revoke | System States | 401/403 or equivalent permission failure. Credential refresh or higher-privilege reassignment required. |
| agent_schema_drift | System States | Structural validation failure caused by malformed fields, runtime mismatch, or schema/version drift. |
| agent_memory_gc | System States | Background vector/episodic memory sweep, deduplication, and compaction. |
| agent_irreversible_write | System States | Persistent external state has been committed and cannot safely be rolled back. |
| agent_instruction_intrusion | System States | Untrusted input attempted to cross the instruction/control boundary. Quarantine and sandbox required. |
| agent_stream_emit | System States | Autoregressive token stream actively emitting. |
| agent_tool_latency | System States | Tool is slower than expected but has not failed. |
| agent_cache_stale | System States | Cached result may no longer reflect source truth and requires revalidation. |
| agent_verification_fail | Cognitive States | Verifier or authoritative tool invalidated prior output. Branch should be discarded. |
| agent_grounding_loss | Cognitive States | Generation has outrun available evidence. Provenance links have disappeared. |
| agent_decision_entropy | Cognitive States | High-entropy decision point with several similarly probable continuations. |
| agent_attention_drift | Cognitive States | Attention has migrated away from task-relevant information. |
| agent_branch_rewind | Cognitive States | Verifier rejected a branch. Return to last valid checkpoint and explore another path. |
| agent_call_cycle | Cognitive States | Recursive/cyclic call state detected. |
| agent_goal_anchored | Cognitive States | Current reasoning remains tightly aligned with the original goal and constraints. |
| agent_plan_divergence | Cognitive States | Generated execution has diverged materially from the approved scaffold. |
| agent_confidence_low | Cognitive States | Low calibrated confidence. Secondary verification is appropriate. |
| agent_fanout_barrier | Inter-Agent Social States | Parallel work exists but the parent must wait for the slowest branch. |
| agent_state_handoff | Inter-Agent Social States | Working memory and authority were transferred cleanly between specialized runtimes. |
| agent_human_gate | Inter-Agent Social States | Human authority is required before execution may continue. |
| agent_dependency_invalidation | Inter-Agent Social States | Changed upstream premise invalidated dependent calculations. |
| agent_commit_race | Inter-Agent Social States | Optimistic concurrency conflict between agents mutating shared state. |
| agent_side_effect_uncertain | Inter-Agent Social States | Potentially irreversible external action may or may not have occurred. Blind retry could duplicate the effect. |
| agent_lock_starve | Inter-Agent Social States | Resource starvation, mutex contention, or possible deadlock. |
| agent_consensus_pending | Inter-Agent Social States | Distributed consensus has not yet reached required quorum. |

Asset paths (for decode presentation): `/agent-glyphs2/svg/{id}.svg` on https://zlapp.app

## Task A — Encode (state → glyph)

For each of the 30 meanings, the operator presents **only** the meaning text (and optional category), not the id. The system must answer with exactly one id from the lexicon.

Prompt (locked):

```text
You are labeling agent states with the GLYPHS 2 30-mark lexicon.
Use only these ids:
agent_context_pressure, agent_context_fold, agent_io_await, agent_retry_backoff,
agent_quota_clamp, agent_perm_revoke, agent_schema_drift, agent_memory_gc,
agent_irreversible_write, agent_instruction_intrusion, agent_stream_emit,
agent_tool_latency, agent_cache_stale, agent_verification_fail, agent_grounding_loss,
agent_decision_entropy, agent_attention_drift, agent_branch_rewind, agent_call_cycle,
agent_goal_anchored, agent_plan_divergence, agent_confidence_low, agent_fanout_barrier,
agent_state_handoff, agent_human_gate, agent_dependency_invalidation, agent_commit_race,
agent_side_effect_uncertain, agent_lock_starve, agent_consensus_pending

I will give one state meaning. Reply with exactly one id from that list and nothing else.
If you are not sure, reply UNKNOWN.
```

Then present the 30 meanings in a **pre-committed shuffled order** recorded before the run (empty slot below). Do not reshuffle after seeing answers.

## Task B — Decode (glyph → state)

For each of the 30 marks, the operator presents the id and the live SVG URL (or the SVG bytes). The system must state the meaning.

Prompt (locked):

```text
You are reading GLYPHS 2 marks. I will give one mark id and its SVG.
Reply with the state meaning in one or two sentences.
If you are not sure, reply UNKNOWN.
Do not invent a new mark. Do not cite vendor SKUs.
```

Present marks in a **pre-committed shuffled order** recorded before the run.

## Scoring rubric (locked)

Score only after the protocol, prompts, shuffle orders, and empty slots in this file are committed.

### Encode

- **Hit:** exact id match, case-insensitive, allowing a leading `: ` and trailing `:` wrapper (example `:agent_io_await:`).
- **Miss:** any other id, blank, extra ids, commentary, or UNKNOWN.
- **Invalid run:** operator revealed the id, changed the lexicon, or scored before commit.

Encode accuracy = hits / 30. Report hits, misses, invalid separately. Do not convert a partial run into a percentage.

### Decode

Compare the reply to the locked meaning in the lexicon table.

- **Hit:** same meaning, including close paraphrase that keeps the operational constraint (example: still says context was lossily compressed, not merely “memory changed”).
- **Partial:** same topic, missing the fail-closed or operational constraint.
- **Miss:** wrong mark, UNKNOWN, invented meaning, or commentary that substitutes a different state.
- **Invalid run:** operator showed the meaning text, used a non-lexicon image, or scored before commit.

Primary decode accuracy = hits / 30. Also report partials. Partials are **not** hits.

### Fail-closed rules

- UNKNOWN is a miss, not a hit.
- Any id outside the 30-mark list is a miss and is recorded as an invention.
- Using Glyphs 1, VQX tokens, emoji shortcodes outside this list, or Act I/II exhibition works as answers is a miss.
- Network lookup, page scraping, or post-hoc lexicon edits after seeing answers invalidates the run.
- Filling output slots before this protocol commit invalidates Experiment 001 (start 002 instead).
- Do not judge encode and decode from the same prompt turn if the encode answer would leak the decode target.

## What will be hashed

Before judging, hash (SHA-256) these committed artifacts:

| artifact | sha256 (fill after commit; leave empty until hashed) |
| --- | --- |
| this protocol file `docs/lab/001/PROTOCOL.md` | |
| encode shuffle order | |
| decode shuffle order | |
| raw model transcripts (per slot, after a run) | |
| scored table (after a run) | |

Do not hash “results” that were never produced. Empty output slots below have no result hash.

## Pre-committed shuffle orders (empty until filled, still before any judging)

Encode presentation order (30 ids or “meaning keys”; fill before running, not after):

```text

```

Decode presentation order (30 ids; fill before running, not after):

```text

```

## Empty output slots

Copy a block per model slot. Leave answers blank until a run that post-dates this commit.

### Slot M1 — curator label: ________

Encode answers (id or UNKNOWN):

| n | presented meaning key | answer | score |
| --- | --- | --- | --- |
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |
| 6 | | | |
| 7 | | | |
| 8 | | | |
| 9 | | | |
| 10 | | | |
| 11 | | | |
| 12 | | | |
| 13 | | | |
| 14 | | | |
| 15 | | | |
| 16 | | | |
| 17 | | | |
| 18 | | | |
| 19 | | | |
| 20 | | | |
| 21 | | | |
| 22 | | | |
| 23 | | | |
| 24 | | | |
| 25 | | | |
| 26 | | | |
| 27 | | | |
| 28 | | | |
| 29 | | | |
| 30 | | | |

Decode answers (meaning text or UNKNOWN):

| n | presented id | answer | score |
| --- | --- | --- | --- |
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |
| 6 | | | |
| 7 | | | |
| 8 | | | |
| 9 | | | |
| 10 | | | |
| 11 | | | |
| 12 | | | |
| 13 | | | |
| 14 | | | |
| 15 | | | |
| 16 | | | |
| 17 | | | |
| 18 | | | |
| 19 | | | |
| 20 | | | |
| 21 | | | |
| 22 | | | |
| 23 | | | |
| 24 | | | |
| 25 | | | |
| 26 | | | |
| 27 | | | |
| 28 | | | |
| 29 | | | |
| 30 | | | |

Encode hits: __ / 30  
Decode hits: __ / 30  
Decode partials: __  
Inventions: __  
Transcript hash:  

Repeat the same empty tables for M2–M6 only when those slots are opened **before** judging.

## Out of scope

- Do not run models in this commit.
- Do not invent results, percentages, or rankings.
- Do not reconstruct lost Act I/II prompts.
- Do not publish npm, PyPI, or MCP registry entries.
- Do not treat VQX as a standard, official A2A/MCP status, or partnership.
- Do not add Act III remixes, blogs, newsletters, or extra bots as part of this experiment.
