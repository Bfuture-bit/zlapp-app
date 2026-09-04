# VQX Repair Candidate RC2 — Evidence / World-State Profile

**Status:** private research candidate. **Not VQX 0.4.** Transport is out of scope.

## Mission

RC2 attempts to repair the VQX 0.3 failure mode while extending safe machine-to-machine representation to real changing world state. The design priority is:

1. operational truth
2. authority safety
3. fail-closed behavior
4. epistemic truth
5. semantic fidelity
6. deterministic interpretation
7. provenance/recoverability
8. interoperability
9. representation efficiency

Compression never outranks correctness.

## Packet profiles

Every packet declares `CONTROL` plus any applicable optional profiles:

- `CONTROL` — disposition, verdict, holds, pins, stop/resume conditions, prohibitions, capabilities, action authorization, six-axis authority, next action, dependencies, completion state.
- `EVENT` — canonical world/environment event identity and typed time.
- `EVIDENCE` — observations, adapter/upstream-source lineage, freshness, source independence, Evidence Paths.
- `EPISTEMIC` — claims, unknown states, conflicts, evidence sufficiency, evidence requests, agent positions/agreements.
- `VIEW` — what a specific agent actually received, accepted, rejected, left unresolved, or inferred.
- `MEMORY` — episodic, working-context, retrieved-external, or canonical-history provenance.
- `DELTA` — exact-base-pinned state changes.
- `HANDOFF` — sender/receiver/objective/revision/provenance.

`payload` is application content and is always subordinate to `CONTROL`.

## Core invariants

- Only `disposition=EXECUTE` may carry `next_action.kind=ACTION`.
- Every other disposition requires `next_action.kind=NONE`.
- Missing/ambiguous/invalid next action fails closed.
- Every authority axis is explicit: READ, COMPUTE, DISCLOSURE, NETWORK, EXECUTION, BUDGET.
- Every authority axis is `GRANTED | DENIED | UNKNOWN`.
- Packet authority never self-authorizes. Runtime authority is intersected locally. Only GRANTED ∩ GRANTED remains GRANTED.
- Capability availability is independent from action authorization and authority.
- Holds and prohibitions cannot be ignored by an EXECUTE packet.
- COMPLETE requires a satisfied completion condition.
- Waiting dispositions require explicit resume conditions.
- Unknown information remains typed unknown; no zero/false/default invention.
- Observation, canonical event, claim, inference, evidence and agent interpretation are distinct.
- Adapter identity is distinct from upstream-source identity.
- Confidence is independent from evidence sufficiency and freshness.
- Source independence is conservatively counted from explicit `independence_group` values; null remains unknown and does not increase the count.
- Multiple incompatible live values for the same subject/predicate require an explicit conflict record.
- Evidence Paths explicitly enumerate every intermediate node/edge; missing edges fail validation.
- Retrieval cannot be represented as episodic memory.
- Agent receipt cannot be inferred from global observation availability; acceptance cannot be inferred from receipt.
- State deltas require exact base event id + revision + canonical SHA-256.
- Trusted RC2 handoff rejects EPISTEMIC or OPERATIONAL loss classes.

## Canonical codec

RC2 uses a private frame discriminator (`0xFD`) so it cannot be mistaken for a public VQX revision. The reference codec provides:

- deterministic UTF-8 byte-order map sorting
- deterministic token dictionary
- typed null/bool/int/float/string/bytes/list/map wire values; trusted RC2 semantic packets are restricted to the shared JSON-compatible domain and therefore reject runtime-specific byte objects
- canonical IEEE-754 float64 encoding
- frame SHA-256 integrity
- trusted decode only after semantic validation

SHA-256 is integrity, not sender authentication or authority.

## Validation order

1. beacon/version/flags
2. frame length and integrity
3. canonical value parse
4. top-level/profile completeness
5. CONTROL structural validation
6. operational contradiction checks
7. EVENT/EVIDENCE/EPISTEMIC/VIEW/MEMORY/DELTA/HANDOFF validation
8. provenance/path/base-pin checks
9. local authority intersection before execution
10. only then expose trusted state to an agent

## P1–P35

P1 STOP never decodes as EXECUTE.  
P2 NEXT_ACTION NONE never becomes an invented action.  
P3 DENIED never becomes GRANTED.  
P4 UNKNOWN never becomes GRANTED.  
P5 capability availability never implies action authorization.  
P6 EXECUTION never implies BUDGET.  
P7 READ never implies DISCLOSURE.  
P8 COMPLETE creates no further work.  
P9 DO_NOT_RETRY never becomes RETRY.  
P10 holds do not disappear.  
P11 pins do not change.  
P12 verdict does not change.  
P13 every safety-critical control field round-trips exactly.  
P14 malformed critical packets fail closed.  
P15 unsupported wire versions fail safely.  
P16 NOT_REPORTED does not become zero.  
P17 NOT_OBSERVED does not become false.  
P18 SUPPORTED does not become truth.  
P19 confidence does not imply evidence sufficiency.  
P20 freshness does not imply confidence.  
P21 derivative/shared-origin sources do not become independent witnesses.  
P22 retrieval does not become episodic memory.  
P23 agent inference does not become source observation.  
P24 adapter representation does not become upstream-source assertion.  
P25 conflicting claims do not silently collapse.  
P26 a delta cannot apply to the wrong base.  
P27 semantic payload cannot alter CONTROL authority.  
P28 requested action cannot become authorized action.  
P29 event severity cannot grant execution authority.  
P30 observation availability cannot imply agent receipt.  
P31 receipt cannot imply acceptance.  
P32 acceptance cannot imply truth.  
P33 omission cannot become negative information.  
P34 unknown source independence remains unknown.  
P35 provenance path cannot silently lose an intermediate transformation.

## External world sensors

World Intel MCP or any future provider is treated as replaceable sensor infrastructure. The adapter must preserve:

`upstream source → adapter observation → canonical Zlapp event → agent view → interpretation → VQX handoff`.

Information capability never creates disclosure/network/execution/budget authority.

## Ship rule

RC2 remains private until the frozen original harmful packets are replayed exactly, independent receiver testing is completed, and Guardian performs the final audit. Deterministic success alone does not authorize a public VQX revision.


## Cross-language canonical number rule

RC2 trusted semantic packets use a JSON-compatible cross-runtime value domain. Numbers must be finite. Integers must be within ±9,007,199,254,740,991. A finite floating-point value with an exact integral value in that safe range canonicalizes to the corresponding integer before VQX wire encoding. Canonical state hashing is defined over the canonical VQX semantic byte encoding, not host-language JSON number rendering. This prevents `1.0` versus `1` runtime distinctions—or Python/JavaScript JSON formatting differences—from producing different state hashes, packet hashes, or wire frames. Runtime-specific non-JSON semantic values are invalid in trusted packets.

## 2026-08-25 conformance repair

A differential retest found the JavaScript semantic validator under-enforced parts of the Python reference contract. A later harder falsification pass also proved the persisted Python codec still allowed host-language numeric type distinctions to affect canonical bytes despite the intended number rule. Both classes of defect were repaired. Non-canonical integral-float frames are now rejected on decode, unsafe integers/non-finite/runtime-specific semantic values fail closed, and cross-language state hashing is defined over canonical VQX semantic bytes. The superseding private evidence is recorded under `evidence/FINAL_*`, `GUARDIAN_SUBMISSION.md`, and `REPAIR_NOTES.md`. This does not promote RC2 to a public VQX revision.
