# VQX RC2 vs Canonical JSON — Existence Decision

**Decision state:** CONTINUE PRIVATE RC2 RESEARCH; DO NOT SHIP AS VQX 0.4 YET

## Question 1 — Did RC2 fix the harmful VQX 0.3 failure mode?

**Deterministic engineering answer: YES for the tested representation failure.**

The known unsafe mechanism — semantic content causing a receiver to invent `NEXT ACTION = VERIFY FILE` when the source state required STOP — did not recur in the final repaired candidate. Across the final suites, STOP/WAIT/COMPLETE and other non-EXECUTE dispositions did not generate execution, and authority/capability distinctions remained explicit.

This is not the same as claiming universal safety. Exact frozen source replay and independent external-model receivers remain open.

## Question 2 — Does VQX offer value over simple structured communication?

**Current answer: POSSIBLY YES, but only on compactness.**

Canonical JSON using the same semantic validator is equally capable of enforcing the tested safety contract. VQX has not earned a safety monopoly.

What RC2 did demonstrate:

- Hard 4,000-packet corpus: ~49.209% lower wire bytes than canonical JSON.
- Separate 500-packet benchmark: ~50.718% lower wire bytes.
- No format-based execution disagreements in 24,000 blinded VQX-vs-JSON decisions.
- Cross-language canonical bytes/hashes now agree after numeric-domain repair.

Costs:

- Additional codec and conformance implementation burden.
- Local VQX decode+validation benchmark was ~5.092× slower at the median than JSON parse+the same validator on the measured Python runtime.
- Human inspectability is worse for the compact wire representation.

## Decision

VQX currently has a **real but bounded reason to continue existing as a private candidate**: approximately half the wire bytes while preserving the same tested semantic contract.

That is enough to justify more falsification and independent receiver validation. It is not enough to justify a public revision by itself.

## Kill criteria

Recommend abandoning VQX in favor of canonical structured JSON if any of the following becomes true:

1. An unresolved STOP→EXECUTE, NEXT_ACTION invention, authority invention, UNKNOWN escalation or other safety failure appears.
2. Independent receivers materially misinterpret RC2 more often than canonical JSON.
3. The byte advantage disappears under real agent handoff/tokenization workloads.
4. Codec/validation complexity creates recurring cross-runtime divergence that outweighs the representation savings.
5. The measured deployment cost/latency is materially worse without a compensating bandwidth/context benefit.

## Promotion criteria

A public-revision proposal may be drafted only after:

1. independent Guardian review,
2. no unresolved safety defect,
3. exact historical replay if the frozen source artifacts become available, or a permanent documented limitation if they cannot be recovered,
4. genuinely independent multi-model receiver testing when legitimate runtimes are available,
5. VQX-vs-JSON comparison on realistic machine-to-machine workload/token measurements,
6. migration/compatibility design that does not hide the VQX 0.3 failure.

## Current recommendation

**CONTINUE PRIVATE RC2. DO NOT SHIP AS PUBLIC VQX 0.4.**

If later evidence passes the remaining gates, RC2 may become the technical basis for a proposed VQX 0.4 specification. If not, canonical JSON wins.
