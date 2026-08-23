export const SCHEMA = "ZLAPP_AGENT_GLYPHS_2.0";
export const SIZE = 256;
export const FPS = 12;

export const ANIMATED = new Set([
  "agent_io_await",
  "agent_branch_rewind",
  "agent_context_fold",
  "agent_retry_backoff",
  "agent_call_cycle",
  "agent_stream_emit",
  "agent_fanout_barrier",
  "agent_context_pressure",
  "agent_grounding_loss",
  "agent_state_handoff",
  "agent_dependency_invalidation",
  "agent_commit_race",
  "agent_side_effect_uncertain",
  "agent_memory_gc",
  "agent_lock_starve",
]);

export const GLYPHS = [
  {
    id: "agent_context_pressure",
    category: "System States",
    meaning:
      "Context-window occupancy is critical and verbatim information is at risk of eviction. Signals pre-emptive summarization or state handoff.",
    staticT: 0.82,
  },
  {
    id: "agent_context_fold",
    category: "System States",
    meaning:
      "Lossy context compression occurred. Downstream agents must not assume verbatim history survived.",
    staticT: 0.62,
  },
  {
    id: "agent_io_await",
    category: "System States",
    meaning:
      "Execution is blocked on an external dependency. Outbound call exists, return is empty. Do not duplicate or speculate.",
    staticT: 0.55,
  },
  {
    id: "agent_retry_backoff",
    category: "System States",
    meaning: "Transient failure with scheduled retry using increasing/jittered exponential backoff.",
    staticT: 0.7,
  },
  {
    id: "agent_quota_clamp",
    category: "System States",
    meaning: "Rate limit or quota exhaustion such as HTTP 429. Scheduler must throttle or reschedule.",
    staticT: 0.5,
  },
  {
    id: "agent_perm_revoke",
    category: "System States",
    meaning: "401/403 or equivalent permission failure. Credential refresh or higher-privilege reassignment required.",
    staticT: 0.72,
  },
  {
    id: "agent_schema_drift",
    category: "System States",
    meaning:
      "Structural validation failure caused by malformed fields, runtime mismatch, or schema/version drift.",
    staticT: 0.4,
  },
  {
    id: "agent_memory_gc",
    category: "System States",
    meaning: "Background vector/episodic memory sweep, deduplication, and compaction.",
    staticT: 0.7,
  },
  {
    id: "agent_irreversible_write",
    category: "System States",
    meaning: "Persistent external state has been committed and cannot safely be rolled back.",
    staticT: 0.5,
  },
  {
    id: "agent_instruction_intrusion",
    category: "System States",
    meaning:
      "Untrusted input attempted to cross the instruction/control boundary. Quarantine and sandbox required.",
    staticT: 0.55,
  },
  {
    id: "agent_stream_emit",
    category: "System States",
    meaning: "Autoregressive token stream actively emitting.",
    staticT: 0.4,
  },
  {
    id: "agent_tool_latency",
    category: "System States",
    meaning: "Tool is slower than expected but has not failed.",
    staticT: 0.65,
  },
  {
    id: "agent_cache_stale",
    category: "System States",
    meaning: "Cached result may no longer reflect source truth and requires revalidation.",
    staticT: 0.5,
  },
  {
    id: "agent_verification_fail",
    category: "Cognitive States",
    meaning: "Verifier or authoritative tool invalidated prior output. Branch should be discarded.",
    staticT: 0.5,
  },
  {
    id: "agent_grounding_loss",
    category: "Cognitive States",
    meaning: "Generation has outrun available evidence. Provenance links have disappeared.",
    staticT: 0.75,
  },
  {
    id: "agent_decision_entropy",
    category: "Cognitive States",
    meaning: "High-entropy decision point with several similarly probable continuations.",
    staticT: 0.5,
  },
  {
    id: "agent_attention_drift",
    category: "Cognitive States",
    meaning: "Attention has migrated away from task-relevant information.",
    staticT: 0.7,
  },
  {
    id: "agent_branch_rewind",
    category: "Cognitive States",
    meaning: "Verifier rejected a branch. Return to last valid checkpoint and explore another path.",
    staticT: 0.78,
  },
  {
    id: "agent_call_cycle",
    category: "Cognitive States",
    meaning: "Recursive/cyclic call state detected.",
    staticT: 0.72,
  },
  {
    id: "agent_goal_anchored",
    category: "Cognitive States",
    meaning: "Current reasoning remains tightly aligned with the original goal and constraints.",
    staticT: 0.5,
  },
  {
    id: "agent_plan_divergence",
    category: "Cognitive States",
    meaning: "Generated execution has diverged materially from the approved scaffold.",
    staticT: 0.5,
  },
  {
    id: "agent_confidence_low",
    category: "Cognitive States",
    meaning: "Low calibrated confidence. Secondary verification is appropriate.",
    staticT: 0.5,
  },
  {
    id: "agent_fanout_barrier",
    category: "Inter-Agent Social States",
    meaning: "Parallel work exists but the parent must wait for the slowest branch.",
    staticT: 0.72,
  },
  {
    id: "agent_state_handoff",
    category: "Inter-Agent Social States",
    meaning: "Working memory and authority were transferred cleanly between specialized runtimes.",
    staticT: 0.55,
  },
  {
    id: "agent_human_gate",
    category: "Inter-Agent Social States",
    meaning: "Human authority is required before execution may continue.",
    staticT: 0.5,
  },
  {
    id: "agent_dependency_invalidation",
    category: "Inter-Agent Social States",
    meaning: "Changed upstream premise invalidated dependent calculations.",
    staticT: 0.62,
  },
  {
    id: "agent_commit_race",
    category: "Inter-Agent Social States",
    meaning: "Optimistic concurrency conflict between agents mutating shared state.",
    staticT: 0.58,
  },
  {
    id: "agent_side_effect_uncertain",
    category: "Inter-Agent Social States",
    meaning:
      "Potentially irreversible external action may or may not have occurred. Blind retry could duplicate the effect.",
    staticT: 0.55,
    duration: 4,
  },
  {
    id: "agent_lock_starve",
    category: "Inter-Agent Social States",
    meaning: "Resource starvation, mutex contention, or possible deadlock.",
    staticT: 0.8,
  },
  {
    id: "agent_consensus_pending",
    category: "Inter-Agent Social States",
    meaning: "Distributed consensus has not yet reached required quorum.",
    staticT: 0.5,
  },
];
