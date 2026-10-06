---
name: hypothesis-driven-improvement
description: Use when driving an open-ended objective whose path is unknown — "eliminate all the ways X fails to do Y", harden a flaky/intermittent behavior, push a metric to a target, or run an adversarial review loop — with many candidate causes rather than one observed bug. Use when tempted to ship a hunch-fix and declare victory, when a metric is noisy, or when improvement work needs to converge instead of wander.
---

# Hypothesis-Driven Improvement

## Overview

Open-ended objectives ("eliminate all the ways X fails to do Y", "get p99 under the SLO", "harden this flaky pipeline") have no known path. The failure is not chasing the objective — it is **shipping a bundle of plausible fixes from a hunch and declaring victory**, with no measurable definition of done, no idea which change actually helped, and no honest account of what's left.

**Core principle:** Turn the fuzzy objective into a falsifiable *done-predicate*, measure a *baseline*, then drive a hypothesis loop — generate → triage → prove-or-disprove ONE change at a time → record — until the predicate holds or hypotheses run dry. **Evidence over intuition; one change at a time; no silent success.**

## Two Modes

This skill has a heavyweight mode and a lightweight one. **Default to simple in-line; escalate to full only when you need measurement, attribution, or durable state.**

| | **Simple in-line** | **Full** |
|--|--|--|
| Use when | findings come from a reviewer/critic and are real-on-sight (adversarial spec/design/code review, doc hardening) | you must discover causes/levers and *prove* each affects a metric or failure rate (flaky-behavior hardening, perf/optimization) |
| Convergence | a review round surfaces zero Critical/Important findings | the done-predicate holds, or hypotheses run dry |
| Overhead | none — runs in the conversation, no files | done-predicate + baseline + ledger + triage |

Everything below the Simple In-Line Mode section (Iron Law, ledger, triage, prove/disprove gate) is **full mode**. Don't apply it to a simple review loop — that's the bureaucracy this mode exists to avoid.

## Simple In-Line Mode

When the loop's "findings" come from a reviewer/critic and are self-evidently real once surfaced, you do **not** need a done-predicate, baseline, ledger, or triage scoring. Run it inline, in the conversation. **No files.**

**Severity (governs the loop):** tag every finding **Critical**, **Important**, or **Minor** — the scale defined once in `jj-superpowers:requesting-code-review` (Severity Scale). Loop behavior in this mode:

| Severity | Loop behavior |
|----------|---------------|
| **Critical / Important** (blocking) | Must be resolved **and** re-reviewed. Loop continues while any blocking finding appears. |
| **Minor** | Folded in **immediately, same round** (purely cosmetic ones may be dropped); does **not** by itself trigger another round. |

**Convergence = a review round that surfaces zero Critical/Important findings.** On that round, fold any outstanding Minors — there is **no extra confirming round** just for Minors. Fold Minors surfaced in earlier rounds proactively so they don't accumulate.

**Who folds a Minor in (context-dependent):**
- **Document review** (spec/plan/design text, no implementer) → the **orchestrator** edits the document directly.
- **Code-review nodes** with reviewer/implementer separation in force → a Minor still needs an **implementer round-trip + re-verify**; the orchestrator cannot edit code. "Fold-and-go" there means **batch the Minors into one implementer dispatch**, not orchestrator edits.

The lite loop:

1. **Review** — dispatch ~**3 adversarial reviewer subagents** over the current artifact (hostile charter: find real problems, construct the concrete failure), **each with a distinct lens**. Read-only over shared immutable text → safe to fan out (see jj-superpowers:dispatching-parallel-agents).
   - Encouraged lens menu (default, not mandatory): correctness/soundness, completeness/missing-requirements, ambiguity/interpretability, API & design soundness, concurrency, parallelism, performance, DRYness/duplication, ease of abstraction & extensibility, testability/verification, over- and under-engineering.
   - The orchestrator picks the ~3 most relevant lenses for the artifact and **rotates lens assignments across rounds** for diversity. Add (e.g. Security) or drop lenses per artifact.
2. **Tag and accept/refute** — for each finding, assign a **Critical/Important/Minor** severity, then decide: *accept* (real, in scope) or *refute* (reviewer is wrong / out of scope). Both directions need justification, not reflex. When a finding is plausible but you think it's wrong, have a second subagent adversarially check before discarding it; equally, don't blindly accept a confident-sounding finding that may be wrong. **Fold-and-go applies only to ACCEPTED Minors** — a Minor may still be refuted with justification.
3. **Correct** — resolve accepted Critical/Important findings; fold accepted Minors (per the context rule above).
4. **Repeat** — re-review until a round surfaces **zero Critical/Important findings**. On that round, fold outstanding Minors — that round is your convergence signal. A Critical/Important finding reopens the loop; Minors alone do not.

**Lite-mode invariants (the only discipline that survives):**
- Adversarially verify findings — tag severity, then accept/refute *with justification*, both directions.
- **Convergence is a zero-Critical/Important round**, not a quiet first pass — a fresh Critical/Important finding always forces another resolve-and-re-review cycle; Minors fold in-place without looping.
- No ledger, predicate, baseline, or triage. No files. Keep it in the conversation.

**Ensembling (optional, default-on when available):** after the subagent loop converges (a zero-Critical/Important round), an external-harness ensemble pass may run the **same lens-based review** through any available external harness. An ensemble pass's **Critical/Important** findings re-open the subagent loop; external **Minor** findings fold-and-go (or drop) and do **not** re-open it. **Skip silently if no harness is available.** The combined loop terminates when an ensemble pass yields zero Critical/Important. (Brief by design — `jj-superpowers:brainstorming` is authoritative for the **loop**; `jj-superpowers:choosing-model-and-effort` is authoritative for the **harness** — detection, harness choice, model and effort, and the reviewer-only gate.)

Switch to full mode the moment you need to measure a metric, attribute *which* change helped, or carry state across many rounds.

## When to Use

```dot
digraph when_to_use {
    "One specific observed bug?" [shape=diamond];
    "Have a written plan / project-network.dot?" [shape=diamond];
    "Open-ended objective, many candidate causes/levers?" [shape=diamond];
    "Use systematic-debugging" [shape=box];
    "Use subagent-driven-development / executing-plans" [shape=box];
    "Use this skill" [shape=doublecircle];
    "Just do it" [shape=box];

    "One specific observed bug?" -> "Use systematic-debugging" [label="yes"];
    "One specific observed bug?" -> "Have a written plan / project-network.dot?" [label="no"];
    "Have a written plan / project-network.dot?" -> "Use subagent-driven-development / executing-plans" [label="yes"];
    "Have a written plan / project-network.dot?" -> "Open-ended objective, many candidate causes/levers?" [label="no"];
    "Open-ended objective, many candidate causes/levers?" -> "Use this skill" [label="yes"];
    "Open-ended objective, many candidate causes/levers?" -> "Just do it" [label="no"];
}
```

Triggers: "eliminate all possibilities of…", "make X never fail to…", "harden", "reduce flakiness", "drive metric M to target T", intermittent failures with no clear pattern, noisy metrics, optimization without a known cause.

## The Iron Law (Full Mode)

This law governs **full mode**. In simple in-line mode the equivalent invariants are the lite-mode ones above (adversarial accept/refute + loop until a zero-Critical/Important round).

```
NO LOOP WITHOUT A WRITTEN DONE-PREDICATE AND A MEASURED BASELINE FIRST
```

Before generating a single fix, write down — in the ledger — two things:

1. **Done-predicate** — a falsifiable statement of "done". Translate the fuzzy objective into something measurable:
   - Hardening: an *enumerable* failure-mode set, each closed, **plus a regression guard** (a test/assertion that stays green). "Eliminate all the ways X fails" is not a predicate until you've written the list of ways and a measure for "closed".
   - Optimization: metric M, the *measurement method*, target T, and the measurement window.
2. **Baseline** — the current measured value of M, or the current failure-mode inventory. If you can't measure the baseline, **instrumenting to get one is hypothesis #1** — you cannot prove improvement against an unknown.

No predicate, no baseline → you are guessing, not improving.

## The Loop

```dot
digraph loop {
    "Frame: write done-predicate + baseline" [shape=box];
    "Generate hypotheses" [shape=box];
    "Triage and rank" [shape=box];
    "Prove or disprove TOP unprocessed (one change)" [shape=box];
    "Record verdict + evidence in ledger" [shape=box];
    "Unprocessed hypotheses left?" [shape=diamond];
    "Done-predicate satisfied?" [shape=diamond];
    "New viable hypotheses this round?" [shape=diamond];
    "Done — report result vs predicate" [shape=doublecircle];
    "Report residual gap honestly" [shape=octagon, style=filled, fillcolor=red, fontcolor=white];

    "Frame: write done-predicate + baseline" -> "Generate hypotheses";
    "Generate hypotheses" -> "Triage and rank";
    "Triage and rank" -> "Prove or disprove TOP unprocessed (one change)";
    "Prove or disprove TOP unprocessed (one change)" -> "Record verdict + evidence in ledger";
    "Record verdict + evidence in ledger" -> "Done-predicate satisfied?";
    "Done-predicate satisfied?" -> "Done — report result vs predicate" [label="yes"];
    "Done-predicate satisfied?" -> "Unprocessed hypotheses left?" [label="no"];
    "Unprocessed hypotheses left?" -> "Prove or disprove TOP unprocessed (one change)" [label="yes"];
    "Unprocessed hypotheses left?" -> "New viable hypotheses this round?" [label="no"];
    "New viable hypotheses this round?" -> "Generate hypotheses" [label="yes (regenerate)"];
    "New viable hypotheses this round?" -> "Report residual gap honestly" [label="no (dry)"];
}
```

1. **Generate** — enumerate candidate causes/levers. Each hypothesis is a concrete, testable statement: *"If we do A, failure mode F closes / metric M improves."* When subagents are authorized, fan out generation with diverse lenses (input edge cases, resource limits, concurrency, dependency failures, config). Solo brainstorm otherwise.
2. **Triage & rank** — score each by **likelihood-of-impact × magnitude × (1 / cost-to-test)**; sort descending; record in the ledger. Don't act on an unranked list.
3. **Prove or disprove — ONE change at a time** (see below).
4. **Record** — write the verdict, evidence, and change id to the ledger. Move to the next.
5. **Converge** — list exhausted → re-check the done-predicate. Satisfied → done. Not satisfied → regenerate (informed by what you learned; drop disproven ones). **Loop-until-dry:** stop when a generation round produces no new viable hypotheses AND the predicate is unmet → **report the residual gap.** Never let the loop end silently as if the objective were met.

## Prove or Disprove (the core gate)

**One change at a time. Additive.** Each proven change stacks onto the solution line and becomes part of the new baseline; the next hypothesis is tested against that updated baseline.

- **Never bundle.** Shipping timeout + retry + fallback together means you cannot attribute the result to any one of them. Bundled "fixes" are unproven hypotheses wearing a disguise. Split them; prove each.
- **Define the proving test FIRST**, before implementing:
  - Deterministic → a test/assertion. **REQUIRED SUB-SKILL:** use jj-superpowers:test-driven-development to write the failing test first.
  - Non-deterministic / noisy → a metric measured against the baseline **over a stable window with repeated runs**. A single favorable reading on a noisy metric proves nothing.
- **Implement** the candidate as an isolated change, then **measure**.
- **Verdict** ∈ {proven, disproven, inconclusive}:
  - *proven* — advances the predicate with no regression → keep, update baseline.
  - *disproven* — no effect or regresses → keep the change annotated as disproven (see below); do not let it pollute the solution line.
  - *inconclusive* — refine the hypothesis or the test; do not mark processed as if resolved.
- **Disproof by evidence (no implementation needed).** A hypothesis can be disproved by evidence alone (a profile showing the query is 5% of the tail, a log breakdown showing timeouts are 10% of failures). When you do this, **have a subagent confirm the evidence is sufficient** — an adversarial check that the disproof actually holds — before marking it disproven. Cheap disproofs are how you avoid wasted implementation, but only if the evidence is real.

### Keep all attempts (jj)

This repo uses jj. Every candidate is its own change. Don't `jj abandon` a candidate: it holds evidence, and abandoning is only for empty scaffolds you created (jujutsu safety rule 6); the user decides what to prune. Annotate each with its verdict so the user can prune later. Proven changes integrate into the solution line; disproven/inconclusive ones stay as retained side changes, recorded in the ledger by change id. Nothing is silently discarded.

## Parallelism

Default is **sequential**, because proven changes are additive and shift the baseline. Parallelize a batch ONLY when hypotheses are **orthogonal** (touch disjoint code/behavior, cannot interact) **and** each is provable with an easy, fast, deterministic test. Use jj workspace isolation (`jj workspace add`) for concurrent code changes. When in doubt, sequential. **REQUIRED BACKGROUND:** jj-superpowers:dispatching-parallel-agents.

## The Ledger

A persistent markdown file (e.g. `docs/superpowers/improvement-loops/YYYY-MM-DD-<topic>.md`) is the single source of truth. It survives context compaction — the orchestrator and subagents reconstruct loop state by reading it. Start it before generating hypotheses.

```markdown
# Objective: <fuzzy objective>
Done-predicate: <falsifiable, measurable>
Baseline: <measured value / failure-mode inventory>  (measured <when/how>)

| id | hypothesis | likelihood | impact | status | verdict | evidence / measurement | jj change | notes |
|----|-----------|-----------|--------|--------|---------|------------------------|-----------|-------|
| H1 | bump ffmpeg timeout closes timeouts | high | med | done | proven | failures 2.0%→1.2% over 10k uploads | xqop... | new baseline 1.2% |
| H2 | bad-seek on some containers | med | med | done | disproven | subagent-verified: 0 seek errors in failure logs | (none) | evidence-only |
| H3 | S3 transient errors need retry | med | high | in-progress | — | — | — | — |
```

## Red Flags — STOP

- Building a done-predicate, baseline, ledger, or files for a simple review loop where findings are real on sight → simple in-line mode.
- "The review found nothing major, we're done" → loop until a round surfaces **zero Critical/Important findings**; fold outstanding Minors on that round. One fresh Critical/Important reopens the loop.
- Writing a fix before the done-predicate and baseline (full mode). "No time to instrument a baseline" means you cannot prove improvement at all; the baseline is hypothesis #1.
- "'Eliminate all' is impossible, so I'll do my best" → write the predicate you *can* hit (enumerated modes + measured rate + regression guard) and report against it.
- "I'm confident it's X, just ship it" → a hunch is a hypothesis, not a diagnosis. Triage, prove, measure.
- A fix-*list* with no likelihood/impact ranking.
- Shipping more than one change before measuring. Bundled changes are unattributable.
- "It looked faster" → one reading on a noisy metric is noise. Repeated runs over a stable window, against the baseline.
- Marking an inconclusive result as processed.
- "I'll abandon the failed attempts" → keep them annotated (see Keep all attempts); disproofs are evidence for the next round.
- Hypotheses ran out and you're wrapping up → re-check the done-predicate; if unmet, report the residual gap explicitly instead of implying success.

## Common Mistakes

- **Predicate drift** — quietly redefining "done" to match what you achieved. Pin it in the ledger up front; if it must change, say so explicitly.
- **Triage theater** — ranking once and never re-ranking after evidence changes likelihoods. Re-triage each round.
- **Confirmation bias in measurement** — cherry-picking the favorable run. Pre-commit the measurement method.
- **Treating disproof as failure** — a confidently disproven hypothesis is progress; it shrinks the search space.

## Cross-References

- jj-superpowers:systematic-debugging — for a single observed bug (root cause first).
- jj-superpowers:subagent-driven-development / executing-plans — for executing a known plan.
- jj-superpowers:test-driven-development — write the proving test first for deterministic hypotheses.
- jj-superpowers:dispatching-parallel-agents — fan-out generation/triage/orthogonal proving.
- jj-superpowers:verification-before-completion — evidence before any "done" claim.
- jj-superpowers:tool-output-discipline — keep metric/measurement output concise and structured.
