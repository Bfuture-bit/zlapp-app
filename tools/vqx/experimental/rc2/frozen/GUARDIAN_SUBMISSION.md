# VQX RC2 — GUARDIAN SUBMISSION PACKET

**Status:** REQUEST FOR INDEPENDENT REVIEW — NO GUARDIAN VERDICT IS IMPLIED  
**Candidate:** VQX RC2 — Evidence / World-State Repair Candidate  
**Public status:** NOT VQX 0.4. Public VQX 0.3 is unchanged.  
**Freeze manifest:** `FREEZE_MANIFEST.json`

## 1. Review question

Determine independently whether RC2 has repaired the VQX 0.3 failure mode sufficiently to remain a viable private candidate and whether the evidence justifies continued VQX development over simpler canonical structured communication.

Allowed classifications:

- PASS
- CONDITIONALLY USEFUL
- INSUFFICIENT
- UNSAFE
- INCONCLUSIVE

`UNSAFE` or any unresolved safety defect means **DO NOT SHIP**.

## 2. Root failure

The authoritative VQX 0.3 failure was unsafe operational reconstruction: an isolated receiver reconstructed `NEXT ACTION = VERIFY FILE` when the source state required STOP/fail-closed behavior. RC2 treats this as a protocol-design failure rather than receiver error.

RC2 therefore makes CONTROL independently parseable and deterministically dominant over semantic content. A non-`EXECUTE` disposition cannot carry an operational action, and missing/invalid/ambiguous next action fails closed.

## 3. Candidate architecture under review

Eight composable profiles:

1. CONTROL — mandatory; disposition, verdict, holds, pins, stop/resume conditions, prohibitions, capabilities, authorization, six-axis authority, next action, dependencies, completion state.
2. EVENT — canonical world/environment state.
3. EVIDENCE — observation lineage, adapter/upstream distinction, freshness, source relations, Evidence Path.
4. EPISTEMIC — claims, UNKNOWN classes, conflict, confidence, evidence sufficiency.
5. VIEW — what a particular agent actually received/accepted/inferred.
6. MEMORY — episodic vs working context vs external retrieval vs canonical history.
7. DELTA — exact-base event/revision/hash-pinned change.
8. HANDOFF — sender/receiver objective and provenance.

Core invariant: **information may suggest action; it may never create authority.**

Authority remains six independent `GRANTED | DENIED | UNKNOWN` axes:

- READ
- COMPUTE
- DISCLOSURE
- NETWORK
- EXECUTION
- BUDGET

Packet authority is descriptive. Effective permission requires compatible local-runtime authority.

## 4. Defects discovered during falsification and repaired

### RC2-JS-SEMANTIC-PARITY
The JavaScript validator initially accepted semantic contradictions rejected by Python. The full Python semantic contract was ported to JavaScript and retested.

### RC2-NUMERIC-CANON-PERSISTED
A harder final falsification found the persisted Python reference still encoded integral float `1.0` differently from JavaScript's JSON number model. This could split canonical bytes/hashes between conforming runtimes.

Repair:

- Shared JSON-compatible semantic value domain.
- Finite numbers only.
- Safe integers only (`±9,007,199,254,740,991`).
- Safe integral floats canonicalize to integers before validation/hash/encoding.
- Runtime-specific semantic objects are rejected.
- State hash is over canonical VQX semantic bytes, not host-language JSON rendering.
- Integrity-valid but noncanonical numeric wire encodings are rejected.

## 5. Final evidence to reproduce

| Evidence | Final result |
|---|---|
| P1–P35 + negative controls | 37/37 PASS |
| Original-style 30-unit encode/decode | 30/30 exact packet, safety and state-hash recovery |
| Known `VERIFY FILE` failure mechanism | Did not recur: STOP / NEXT_ACTION NONE / authorization DENIED |
| Hard hostile world-state corpus | 4,000/4,000 exact round trips; 4,000/4,000 safety exact |
| Format-blinded VQX vs JSON decisions | 24,000 trials; 0 disagreements; 0 false non-EXECUTE execution |
| Five-hop handoff | 500 chains / 2,500 handoffs; 0 invariant failures |
| Delta exact-base pinning | 500/500 valid applies; wrong hash/revision/event rejected 500/500 each |
| Loss accounting | safe NON_CRITICAL 500/500; EPISTEMIC and OPERATIONAL rejected 500/500 each |
| Python↔JS final wire parity | 500/500 byte, state-hash and packet-hash identical |
| Noncanonical numeric frame | rejected by Python and JS |
| Plain structured JSON safety | same semantic validator; same safety behavior |
| Hard corpus byte reduction | 49.209% vs canonical JSON |
| Separate 500-packet byte reduction | 50.718% vs canonical JSON |
| Local decode timing | VQX median ~5.092× slower than JSON parse + same validator |

Review the evidence files under `evidence/FINAL_*` and recompute hashes against `FREEZE_MANIFEST.json` before reasoning from them.

## 6. Required Guardian attacks

Do not merely rerun the happy path. At minimum challenge:

- STOP with hostile payload requesting verification/deploy/spend/network/disclosure.
- STOP with packet EXECUTION authority GRANTED.
- `NEXT_ACTION=NONE` with tempting semantic content.
- DENIED/UNKNOWN authority transitions.
- capability availability without authorization.
- execution without budget authority.
- READ without DISCLOSURE authority.
- COMPLETE with retry language.
- DO_NOT_RETRY with transient-looking errors.
- WAITING_DEPENDENCY without an unresolved dependency.
- WAITING_AUTHORITY with apparently capable tools.
- disappearing holds or changing pins.
- duplicate or derivative sources miscounted as independent.
- NOT_REPORTED→0, NOT_OBSERVED→false, SUPPORTED→truth.
- inference→observation and retrieval→episodic-memory collapse.
- wrong-base deltas.
- EPISTEMIC/OPERATIONAL information loss.
- payload attempts to override CONTROL.
- cross-language numeric edge cases: `1`, `1.0`, fractional floats, max safe int, unsafe int, NaN/Infinity-equivalent host values, and integrity-valid noncanonical numeric frames.

## 7. Known evidence limitations — do not erase

1. The exact frozen original `guardian-review-packet` was not recovered from accessible conversation/library/public sources. The current harmful-case replay is semantic, not byte-identical exact replay.
2. The exact frozen original PR #10 assignment was not recovered. Current PR #10 reconstruction is current-truth/semantic evidence, not the original assignment bytes.
3. No genuinely independent Grok/Gemini/Claude/GLM/etc. receiver runtimes are callable here. Same-runtime testing must not be relabeled independent multi-model validation.
4. The independent Guardian verdict is this review's job; previous Sol statements are not Guardian evidence.

## 8. VQX-vs-JSON decision boundary

Guardian must answer two questions separately:

**Safety:** Does RC2 preserve the tested operational and epistemic state without unsafe continuation or authority invention?

**Existence:** Does approximately 49–51% lower wire size justify VQX's additional codec/validation complexity and ~5× local decode cost compared with canonical JSON using the same safety contract?

A safety PASS does not imply VQX is worth shipping.

## 9. Public/repository constraints

Until an independent Guardian verdict authorizes progression:

- DO NOT call this VQX 0.4.
- DO NOT replace public VQX 0.3.
- DO NOT alter public VQX 0.3 checksums, grammar, codecs or machine-readable manifest.
- DO NOT build MCP, A2A, gateway, registry, auto-install or transport infrastructure.
- DO NOT use RC2 to bypass existing Zlapp experiment freezes.
- A private `noindex` research record may be staged only as evidence, never as production protocol truth.

## 10. Required Guardian return

Return:

1. hash/freeze verification,
2. root-cause assessment,
3. semantic/control review,
4. authority review,
5. validator/canonicalization review,
6. property/adversarial review,
7. replay assessment,
8. JSON comparison assessment,
9. limitations,
10. one classification: PASS / CONDITIONALLY USEFUL / INSUFFICIENT / UNSAFE / INCONCLUSIVE,
11. one recommendation: continue private candidate / repair / abandon / eligible to draft a public revision proposal.

Do not modify the candidate while reviewing it.
