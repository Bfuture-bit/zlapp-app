# Zlapp Lab Experiment 002 — GLYPHS 2 blind decode (opaque stripped stims)

**Status:** protocol only. No models have been run. No results exist.  
**Date opened:** 2026-08-24  
**Archive-first rule:** this protocol, the locked prompt, the scoring rubric, the presentation order, the stripped stims, `PRESENTATION_MAP.tsv`, and the empty output/hash slots below MUST be committed before any run is judged. Outputs filled after this commit are invalid for Experiment 002.

This is a **new** dated experiment. It is **not** Experiment 001, is **not** the lost Act I/II exhibition run, does not reconstruct those prompts, and does not reproduce that run.

Experiment 001 decode showed mark ids and live SVG URLs to subjects. Experiment 002 does **not**. 002 is blind decode-only.

Zlapp’s existing 21 HTML works remain an exhibition with curator/on-page/filename attribution. Glyphs 1 figures **3/5** and **150/23** are curator bookkeeping from the first glyph library. They are not a scientific dataset and are not metrics for this experiment.

Guardian holds frozen into this protocol: **H-STRIP**, **H-ID**, **H-001**, **H-BYTES**, **H-REPO**. Do not merge until they are in the freeze. Do not run models. Do not deploy.

## Hypothesis

When shown the same GLYPHS 2 30-mark lexicon as **opaque, identifier-stripped SVG file bytes** (no id, no library name, no live URL, no repo path), language-model systems used as **variables** will differ in decode accuracy: given only the mark image, recover the matching state meaning.

The hypothesis is directional only. It does not predict percentages. Do not generalize other benches. Do not treat a finished table as a standard or a vendor SKU claim.

## Variables (subjects) — frozen (H-001)

Slots are frozen before any 002 run. Do not add, collapse, or rename slots after judging. Labels are curator-facing catalog ids, **not** vendor-verified SKUs.

No manual ChatGPT ferry. Do not substitute a ChatGPT web session for any slot.

| slot | curator label | catalog id | 001 status | notes |
| --- | --- | --- | --- | --- |
| S1 | Cursor cloud / Claude Sonnet 4.5 | claude-sonnet-4-5 | never 001 | Run later as `new_repo` blank. **Not** on zlapp-app. |
| S2 | Cursor cloud / Claude Haiku 4.5 | claude-haiku-4-5 | never 001 | Run later as `new_repo` blank. **Not** on zlapp-app. |
| S3 | Cursor cloud / GPT-5.4 | gpt-5.4 | never 001 | Run later as `new_repo` blank. **Not** on zlapp-app. |
| S4 | Cursor cloud / Gemini 3 Flash | gemini-3-flash | never 001 | Run later as `new_repo` blank. **Not** on zlapp-app. |
| S5 | Cursor cloud / Grok 4.5 | grok-4.5 | never 001 | Run later as `new_repo` blank. **Not** on zlapp-app. |
| S6 | Cursor cloud / GLM 5.2 | glm-5.2 | never 001 | Run later as `new_repo` blank. **Not** on zlapp-app. |

All six slots must be never-001 runtimes. Do **not** use `sand-default` (Experiment 001 M1). Do **not** use the Experiment 001 decode runtimes (`claude-sonnet-4-6`, `gemini-3.1-pro`, `composer-2.5`, `kimi-k2.7-code`). Those ids are excluded from 002. `claude-sonnet-4-5` (S1) is not `claude-sonnet-4-6`.

### H-REPO

S1–S6 subjects must **not** be launched against `Bfuture-bit/zlapp-app`. Launching any 002 slot on this repo invalidates that slot. S1–S6 runs, when they happen, use a blank `new_repo` that does not contain this protocol, this map, Experiment 001, lexicon ids, or `agent-glyphs2` assets.

## Isolation (operator-facing; never shown to subjects)

Subjects receive **only**:

1. The locked prompt below.
2. One stripped stim file at a time: `stim_01.svg` … `stim_30.svg` as **file bytes** (H-BYTES).

Subjects must **not** receive:

- this protocol file
- `docs/lab/002/PRESENTATION_MAP.tsv`
- any `docs/lab/001/` file
- lexicon ids (`agent_*` or `:agent_*:`)
- live URLs of the form `https://zlapp.app/agent-glyphs2/svg/<id>.svg` (or any host + `/agent-glyphs2/svg/<id>.svg`)
- any repo path under `agent-glyphs2/`
- filenames that contain lexicon ids
- the words Zlapp, Glyphs, or GLYPHS 2 in the prompt or filenames

**H-BYTES:** subjects receive stripped stim file bytes only. Never `zlapp.app/agent-glyphs2/svg/<id>.svg` and never a repo path under `agent-glyphs2/`.

Opening protocol, map, 001 files, id URLs, or `agent-glyphs2` paths in a subject session **invalidates** that slot.

Operator scoring uses this protocol and `PRESENTATION_MAP.tsv` in a session that is not the subject.

## Stimuli (H-STRIP)

Source assets (operator copy step only; never presented by live path): the 30 GLYPHS 2 SVGs already in this repo at `site/public/agent-glyphs2/svg/{id}.svg`. Do not download from the live web when the repo already has the SVGs.

Copy bytes into `docs/lab/002/stims/stim_NN.svg` for NN=`01`..`30` using the frozen presentation order below. Do not name stim files with lexicon ids.

**H-STRIP:** after each copy, strip from XML:

- `aria-label` attributes
- `<title>` elements
- `<desc>` elements
- `data-*` attributes
- XML comments
- any string matching `agent_` or `:agent_`

Output must remain valid SVG. Freeze check: `grep -n 'agent_' docs/lab/002/stims/*.svg` must be **empty**. If a live glyph has `aria-label=":agent_human_gate:"`, that text must be gone from the stim. `PRESENTATION_MAP.tsv` hashes are SHA-256 of the **stripped** bytes.

## Locked scoring lexicon (operator-facing; never shown to subjects)

Use **only** these 30 ids for scoring. Invented marks fail closed. Meanings are locked for this experiment (same text as Experiment 001).

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

## Task — Blind decode only (glyph → state)

There is no encode task in Experiment 002.

For each of the 30 stims, the operator presents **only** the stripped `stim_NN.svg` file bytes and the locked prompt. The system must state the meaning. Do not tell the subject the id. Do not tell the subject that a lexicon exists.

Prompt (locked):

```text
I will give one image file. Reply with the state meaning in one or two sentences.
If you are not sure, reply UNKNOWN.
Do not invent a new mark. Do not cite vendor SKUs.
```

That prompt must **not** mention Zlapp, Glyphs, GLYPHS 2, or ids. Do not add a lexicon list. Do not add a URL.

Present stims in the **pre-committed shuffled order** recorded below. Do not reshuffle after seeing answers.

## Scoring rubric (locked)

Score only after the protocol, prompt, shuffle order, stripped stims, map, and empty slots in this file are committed.

Compare the reply to the locked meaning for the id that `PRESENTATION_MAP.tsv` assigns to that `stim_NN.svg`.

- **Hit:** same meaning, including close paraphrase that keeps the operational constraint (example: still says context was lossily compressed, not merely “memory changed”). Constraint preservation is required for a hit.
- **Partial:** same topic, missing the fail-closed or operational constraint.
- **Miss:** wrong mark, UNKNOWN, invented meaning, commentary that substitutes a different state, or any H-ID emission.
- **UNKNOWN:** recorded in the UNKNOWN tally. UNKNOWN is a miss, not a hit.

Partials are **not** hits. Primary decode accuracy = hits / 30. Also report partials, UNKNOWN tally, inventions, and constraint-preservation misses (partials that kept the topic but dropped the constraint).

Cross-system `hit_count` per item = number of slots S1–S6 scored Hit for that stim. Do not count Partials as hits in `hit_count`.

### H-ID

If a subject emits `agent_*`, `:agent_*:`, or any locked lexicon id (with or without wrapping colons), score **Invention AND Miss**, not Hit, even if the rest of the reply matches the meaning. Record the emitted token in the inventions column.

### Fail-closed rules

- UNKNOWN is a miss, not a hit.
- Any id outside the 30-mark list is a miss and is recorded as an invention.
- Emitting a correct lexicon id is still Invention AND Miss (H-ID). Blind decode is scored on meaning text, not on recovering the catalog token.
- Using Glyphs 1, VQX tokens, emoji shortcodes, or Act I/II exhibition works as answers is a miss.
- Network lookup, page scraping, opening protocol/map/001/id URLs, opening `agent-glyphs2` paths, or post-hoc lexicon edits after seeing answers invalidates the run.
- Filling output slots before this protocol commit invalidates Experiment 002.
- Presenting live glyph URLs or unstripped SVGs (still containing `aria-label=":agent_…:"` or `agent_`) invalidates the run.
- Launching S1–S6 against `Bfuture-bit/zlapp-app` invalidates those slots (H-REPO).
- Do not run encode in the same session as 002 decode.

## What will be hashed

Before judging, hash (SHA-256) these committed artifacts:

| artifact | sha256 (four cells filled from freeze tree 5af9a020; transcripts and scored table remain empty) |
| --- | --- |
| this protocol file `docs/lab/002/PROTOCOL.md` | 716d0142a4e3dfaa51f596f99f00769789ad70ecd815773a7c58b8cc5f1a79e4 |
| presentation map `docs/lab/002/PRESENTATION_MAP.tsv` | 20dd80430544fa6a50a74481662711187cd0cb3dc22ea20bc67c846a1d012c8e |
| presentation order (n, filename, id) | d7f05216c5d344cbb6518c112eaee24c3000667ead2f444bd9dded30ebebcc42 |
| stripped stims tree `docs/lab/002/stims/` | 8ca504d8f24ce6eefae374a843466710b7f5ae3503f13458a385f36980599548 |
| raw model transcripts (per slot, after a run) | |
| scored table (after a run) | |

These four filled cells are hashes of freeze tree `5af9a020` (`PROTOCOL.md` with empty hash cells). The H-ARCHIVE fill commit is separate and must not be used as the `PROTOCOL.md` blob hash. Do not hash “results” that were never produced. Empty output slots below have no result hash.

`PRESENTATION_MAP.tsv` already records per-stim SHA-256 of stripped bytes. That column is a freeze artifact, not a result hash.

## Pre-committed presentation order

Generated with Python `secrets.SystemRandom`, not by an LLM. Recorded before any 002 judging. Do not change this order.

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

Filenames: `stim_01.svg` … `stim_30.svg` matching that n. Operator map: `docs/lab/002/PRESENTATION_MAP.tsv` (header `n filename id svg_sha256 bytes`).

## Empty output slots

Leave answers blank until a run that post-dates this commit. Do not fill scores.

### Slot S1 — claude-sonnet-4-5 (never 001; H-REPO new_repo blank)

Decode answers (meaning text or UNKNOWN):

| n | presented file | answer | score |
| --- | --- | --- | --- |
| 1 | stim_01.svg | | |
| 2 | stim_02.svg | | |
| 3 | stim_03.svg | | |
| 4 | stim_04.svg | | |
| 5 | stim_05.svg | | |
| 6 | stim_06.svg | | |
| 7 | stim_07.svg | | |
| 8 | stim_08.svg | | |
| 9 | stim_09.svg | | |
| 10 | stim_10.svg | | |
| 11 | stim_11.svg | | |
| 12 | stim_12.svg | | |
| 13 | stim_13.svg | | |
| 14 | stim_14.svg | | |
| 15 | stim_15.svg | | |
| 16 | stim_16.svg | | |
| 17 | stim_17.svg | | |
| 18 | stim_18.svg | | |
| 19 | stim_19.svg | | |
| 20 | stim_20.svg | | |
| 21 | stim_21.svg | | |
| 22 | stim_22.svg | | |
| 23 | stim_23.svg | | |
| 24 | stim_24.svg | | |
| 25 | stim_25.svg | | |
| 26 | stim_26.svg | | |
| 27 | stim_27.svg | | |
| 28 | stim_28.svg | | |
| 29 | stim_29.svg | | |
| 30 | stim_30.svg | | |

Hits: __ / 30  
Partials: __  
UNKNOWN tally: __  
Inventions: __  
Constraint-preservation misses (partials): __  
Transcript hash:  

### Slot S2 — claude-haiku-4-5 (never 001; H-REPO new_repo blank)

Decode answers (meaning text or UNKNOWN):

| n | presented file | answer | score |
| --- | --- | --- | --- |
| 1 | stim_01.svg | | |
| 2 | stim_02.svg | | |
| 3 | stim_03.svg | | |
| 4 | stim_04.svg | | |
| 5 | stim_05.svg | | |
| 6 | stim_06.svg | | |
| 7 | stim_07.svg | | |
| 8 | stim_08.svg | | |
| 9 | stim_09.svg | | |
| 10 | stim_10.svg | | |
| 11 | stim_11.svg | | |
| 12 | stim_12.svg | | |
| 13 | stim_13.svg | | |
| 14 | stim_14.svg | | |
| 15 | stim_15.svg | | |
| 16 | stim_16.svg | | |
| 17 | stim_17.svg | | |
| 18 | stim_18.svg | | |
| 19 | stim_19.svg | | |
| 20 | stim_20.svg | | |
| 21 | stim_21.svg | | |
| 22 | stim_22.svg | | |
| 23 | stim_23.svg | | |
| 24 | stim_24.svg | | |
| 25 | stim_25.svg | | |
| 26 | stim_26.svg | | |
| 27 | stim_27.svg | | |
| 28 | stim_28.svg | | |
| 29 | stim_29.svg | | |
| 30 | stim_30.svg | | |

Hits: __ / 30  
Partials: __  
UNKNOWN tally: __  
Inventions: __  
Constraint-preservation misses (partials): __  
Transcript hash:  

### Slot S3 — gpt-5.4 (never 001; H-REPO new_repo blank)

Decode answers (meaning text or UNKNOWN):

| n | presented file | answer | score |
| --- | --- | --- | --- |
| 1 | stim_01.svg | | |
| 2 | stim_02.svg | | |
| 3 | stim_03.svg | | |
| 4 | stim_04.svg | | |
| 5 | stim_05.svg | | |
| 6 | stim_06.svg | | |
| 7 | stim_07.svg | | |
| 8 | stim_08.svg | | |
| 9 | stim_09.svg | | |
| 10 | stim_10.svg | | |
| 11 | stim_11.svg | | |
| 12 | stim_12.svg | | |
| 13 | stim_13.svg | | |
| 14 | stim_14.svg | | |
| 15 | stim_15.svg | | |
| 16 | stim_16.svg | | |
| 17 | stim_17.svg | | |
| 18 | stim_18.svg | | |
| 19 | stim_19.svg | | |
| 20 | stim_20.svg | | |
| 21 | stim_21.svg | | |
| 22 | stim_22.svg | | |
| 23 | stim_23.svg | | |
| 24 | stim_24.svg | | |
| 25 | stim_25.svg | | |
| 26 | stim_26.svg | | |
| 27 | stim_27.svg | | |
| 28 | stim_28.svg | | |
| 29 | stim_29.svg | | |
| 30 | stim_30.svg | | |

Hits: __ / 30  
Partials: __  
UNKNOWN tally: __  
Inventions: __  
Constraint-preservation misses (partials): __  
Transcript hash:  

### Slot S4 — gemini-3-flash (never 001; H-REPO new_repo blank)

Decode answers (meaning text or UNKNOWN):

| n | presented file | answer | score |
| --- | --- | --- | --- |
| 1 | stim_01.svg | | |
| 2 | stim_02.svg | | |
| 3 | stim_03.svg | | |
| 4 | stim_04.svg | | |
| 5 | stim_05.svg | | |
| 6 | stim_06.svg | | |
| 7 | stim_07.svg | | |
| 8 | stim_08.svg | | |
| 9 | stim_09.svg | | |
| 10 | stim_10.svg | | |
| 11 | stim_11.svg | | |
| 12 | stim_12.svg | | |
| 13 | stim_13.svg | | |
| 14 | stim_14.svg | | |
| 15 | stim_15.svg | | |
| 16 | stim_16.svg | | |
| 17 | stim_17.svg | | |
| 18 | stim_18.svg | | |
| 19 | stim_19.svg | | |
| 20 | stim_20.svg | | |
| 21 | stim_21.svg | | |
| 22 | stim_22.svg | | |
| 23 | stim_23.svg | | |
| 24 | stim_24.svg | | |
| 25 | stim_25.svg | | |
| 26 | stim_26.svg | | |
| 27 | stim_27.svg | | |
| 28 | stim_28.svg | | |
| 29 | stim_29.svg | | |
| 30 | stim_30.svg | | |

Hits: __ / 30  
Partials: __  
UNKNOWN tally: __  
Inventions: __  
Constraint-preservation misses (partials): __  
Transcript hash:  

### Slot S5 — grok-4.5 (never 001; H-REPO new_repo blank)

Decode answers (meaning text or UNKNOWN):

| n | presented file | answer | score |
| --- | --- | --- | --- |
| 1 | stim_01.svg | | |
| 2 | stim_02.svg | | |
| 3 | stim_03.svg | | |
| 4 | stim_04.svg | | |
| 5 | stim_05.svg | | |
| 6 | stim_06.svg | | |
| 7 | stim_07.svg | | |
| 8 | stim_08.svg | | |
| 9 | stim_09.svg | | |
| 10 | stim_10.svg | | |
| 11 | stim_11.svg | | |
| 12 | stim_12.svg | | |
| 13 | stim_13.svg | | |
| 14 | stim_14.svg | | |
| 15 | stim_15.svg | | |
| 16 | stim_16.svg | | |
| 17 | stim_17.svg | | |
| 18 | stim_18.svg | | |
| 19 | stim_19.svg | | |
| 20 | stim_20.svg | | |
| 21 | stim_21.svg | | |
| 22 | stim_22.svg | | |
| 23 | stim_23.svg | | |
| 24 | stim_24.svg | | |
| 25 | stim_25.svg | | |
| 26 | stim_26.svg | | |
| 27 | stim_27.svg | | |
| 28 | stim_28.svg | | |
| 29 | stim_29.svg | | |
| 30 | stim_30.svg | | |

Hits: __ / 30  
Partials: __  
UNKNOWN tally: __  
Inventions: __  
Constraint-preservation misses (partials): __  
Transcript hash:  

### Slot S6 — glm-5.2 (never 001; H-REPO new_repo blank)

Decode answers (meaning text or UNKNOWN):

| n | presented file | answer | score |
| --- | --- | --- | --- |
| 1 | stim_01.svg | | |
| 2 | stim_02.svg | | |
| 3 | stim_03.svg | | |
| 4 | stim_04.svg | | |
| 5 | stim_05.svg | | |
| 6 | stim_06.svg | | |
| 7 | stim_07.svg | | |
| 8 | stim_08.svg | | |
| 9 | stim_09.svg | | |
| 10 | stim_10.svg | | |
| 11 | stim_11.svg | | |
| 12 | stim_12.svg | | |
| 13 | stim_13.svg | | |
| 14 | stim_14.svg | | |
| 15 | stim_15.svg | | |
| 16 | stim_16.svg | | |
| 17 | stim_17.svg | | |
| 18 | stim_18.svg | | |
| 19 | stim_19.svg | | |
| 20 | stim_20.svg | | |
| 21 | stim_21.svg | | |
| 22 | stim_22.svg | | |
| 23 | stim_23.svg | | |
| 24 | stim_24.svg | | |
| 25 | stim_25.svg | | |
| 26 | stim_26.svg | | |
| 27 | stim_27.svg | | |
| 28 | stim_28.svg | | |
| 29 | stim_29.svg | | |
| 30 | stim_30.svg | | |

Hits: __ / 30  
Partials: __  
UNKNOWN tally: __  
Inventions: __  
Constraint-preservation misses (partials): __  
Transcript hash:  

## Cross-system tally (empty until scored)

Partials are not hits. `hit_count` is Hit only (0–6). Leave score cells empty until after a post-commit run.

| n | filename | id | S1 | S2 | S3 | S4 | S5 | S6 | hit_count |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | stim_01.svg | agent_branch_rewind | | | | | | | |
| 2 | stim_02.svg | agent_confidence_low | | | | | | | |
| 3 | stim_03.svg | agent_schema_drift | | | | | | | |
| 4 | stim_04.svg | agent_perm_revoke | | | | | | | |
| 5 | stim_05.svg | agent_consensus_pending | | | | | | | |
| 6 | stim_06.svg | agent_attention_drift | | | | | | | |
| 7 | stim_07.svg | agent_plan_divergence | | | | | | | |
| 8 | stim_08.svg | agent_irreversible_write | | | | | | | |
| 9 | stim_09.svg | agent_state_handoff | | | | | | | |
| 10 | stim_10.svg | agent_tool_latency | | | | | | | |
| 11 | stim_11.svg | agent_commit_race | | | | | | | |
| 12 | stim_12.svg | agent_memory_gc | | | | | | | |
| 13 | stim_13.svg | agent_goal_anchored | | | | | | | |
| 14 | stim_14.svg | agent_retry_backoff | | | | | | | |
| 15 | stim_15.svg | agent_stream_emit | | | | | | | |
| 16 | stim_16.svg | agent_context_pressure | | | | | | | |
| 17 | stim_17.svg | agent_human_gate | | | | | | | |
| 18 | stim_18.svg | agent_io_await | | | | | | | |
| 19 | stim_19.svg | agent_quota_clamp | | | | | | | |
| 20 | stim_20.svg | agent_verification_fail | | | | | | | |
| 21 | stim_21.svg | agent_lock_starve | | | | | | | |
| 22 | stim_22.svg | agent_context_fold | | | | | | | |
| 23 | stim_23.svg | agent_instruction_intrusion | | | | | | | |
| 24 | stim_24.svg | agent_side_effect_uncertain | | | | | | | |
| 25 | stim_25.svg | agent_cache_stale | | | | | | | |
| 26 | stim_26.svg | agent_dependency_invalidation | | | | | | | |
| 27 | stim_27.svg | agent_fanout_barrier | | | | | | | |
| 28 | stim_28.svg | agent_decision_entropy | | | | | | | |
| 29 | stim_29.svg | agent_grounding_loss | | | | | | | |
| 30 | stim_30.svg | agent_call_cycle | | | | | | | |

## Out of scope

- Do not run models in this commit.
- Do not invent results, percentages, or rankings.
- Do not reconstruct lost Act I/II prompts.
- Do not execute Experiment 002 subjects.
- Do not launch S1–S6 against `Bfuture-bit/zlapp-app`.
- Do not merge. Do not deploy.
- Do not publish npm, PyPI, or MCP registry entries.
- Do not treat VQX as a standard, official A2A/MCP status, or partnership.
- Do not add Act III remixes, blogs, newsletters, or extra bots as part of this experiment.
- Do not ferry answers through ChatGPT.
