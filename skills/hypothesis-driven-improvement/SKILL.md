---
name: hypothesis-driven-improvement
description: Use when driving an open-ended objective with many candidate causes rather than one observed bug — "eliminate all the ways X fails", hardening flaky/intermittent behavior, pushing a metric to a target, or running an adversarial review loop until it converges.
---

# Hypothesis-Driven Improvement

## Overview

Open-ended objectives ("eliminate all the ways X fails", "get p99 under the SLO", "harden this flaky pipeline") have no known path. The typical failure is shipping a bundle of plausible fixes from a hunch and declaring victory — with no measurable definition of done, no idea which change helped, and no account of what's left.

Instead: turn the objective into a falsifiable done-predicate, measure a baseline, then loop — generate hypotheses, rank them, prove or disprove one change at a time, record — until the predicate holds or hypotheses run out.

## Two Modes

Default to simple in-line mode; switch to full mode when you need to measure a metric, attribute which change helped, or carry state across many rounds.

| | Simple in-line | Full |
|--|--|--|
| Use when | findings come from reviewers and are real on sight (adversarial spec/design/code review, doc hardening) | you must discover causes and prove each affects a metric or failure rate (flaky-behavior hardening, performance) |
| Converges when | a review round surfaces zero Critical/Important findings | the done-predicate holds, or hypotheses run dry |
| Overhead | none — in the conversation, no files | done-predicate, baseline, ledger, triage |

Don't apply full-mode machinery to a simple review loop.

## Simple In-Line Mode

Tag each finding Critical, Important, or Minor (scale defined in `jj-superpowers:requesting-code-review`). Critical/Important findings block: they must be resolved and re-reviewed. Accepted Minors are folded in the same round (purely cosmetic ones may be dropped) and don't by themselves trigger another round.

Who folds a Minor:
- **Document review** (spec/plan/design, no implementer) — the orchestrator edits the document directly.
- **Code review with reviewer/implementer separation** — the orchestrator can't edit code, so batch Minors into one implementer dispatch plus re-verify.

The loop:

1. **Review** — dispatch about three adversarial reviewer subagents over the current artifact, each with a distinct lens. They are read-only over shared text, so fanning out is safe (see `jj-superpowers:dispatching-parallel-agents`). Pick the most relevant lenses and rotate them across rounds; a useful menu: correctness, completeness, ambiguity, API/design soundness, concurrency, performance, duplication, extensibility, testability, over/under-engineering, security.
2. **Tag and accept/refute** — assign severity, then accept (real, in scope) or refute (wrong or out of scope), with a justification either way. If a finding is plausible but you think it's wrong, have a second subagent check before discarding it; equally, don't accept a confident-sounding finding unexamined. A Minor can be refuted too.
3. **Correct** — resolve accepted Critical/Important findings; fold accepted Minors.
4. **Repeat** until a round surfaces zero Critical/Important findings. Fold outstanding Minors on that round; no extra confirming round is needed for them.

**Ensembling (optional, on by default when available):** after the subagent loop converges, run the same lens-based review through an available external harness. Its Critical/Important findings reopen the subagent loop; its Minors fold or drop. Skip silently if no harness is available. The combined loop ends when an ensemble pass yields zero Critical/Important. `jj-superpowers:brainstorming` is authoritative for the loop and `jj-superpowers:choosing-model-and-effort` for the harness (detection, choice, model/effort, reviewer-only gate).

## When to Use

- One specific observed bug → `jj-superpowers:systematic-debugging`.
- A written plan or `project-network.dot` → `jj-superpowers:subagent-driven-development` / `executing-plans`.
- Open-ended objective with many candidate causes or levers → this skill.
- Otherwise, just do the work.

Typical triggers: "make X never fail to…", "harden", "reduce flakiness", "drive M to T", intermittent failures with no clear pattern, noisy metrics, optimization without a known cause.

## Full Mode: Frame First

Before generating any fix, write two things in the ledger:

1. **Done-predicate** — a falsifiable statement of done.
   - Hardening: an enumerated list of failure modes, each with a measure of "closed", plus a regression guard that stays green. "Eliminate all the ways X fails" isn't a predicate until the ways are listed.
   - Optimization: metric M, how it's measured, target T, and the measurement window.
2. **Baseline** — the current value of M, or the current failure-mode inventory. If you can't measure it yet, instrumenting is hypothesis #1; you can't show improvement against an unknown.

## The Loop

1. **Generate** — candidate causes/levers, each a testable statement: "if we do A, failure mode F closes / M improves." With subagents authorized, fan out generation across lenses (input edge cases, resource limits, concurrency, dependency failures, config).
2. **Triage** — score by likelihood × magnitude ÷ cost-to-test, sort, record. Re-rank each round as evidence shifts likelihoods.
3. **Prove or disprove** the top unprocessed hypothesis, one change at a time (below).
4. **Record** verdict, evidence, and change id in the ledger.
5. **Converge** — when the list is exhausted, re-check the predicate. If unmet, regenerate using what you learned. When a round yields no new viable hypotheses and the predicate is still unmet, stop and report the residual gap explicitly — the loop shouldn't end looking like success when it isn't.

## Prove or Disprove

Test one change at a time. Proven changes stack onto the solution line and become the new baseline for the next hypothesis. Bundling (timeout + retry + fallback together) makes the result unattributable, so split and prove each.

- **Define the proving test before implementing.**
  - Deterministic → a test or assertion, written first (`jj-superpowers:test-driven-development`).
  - Noisy → a metric measured against the baseline with repeated runs over a stable window. One favorable reading on a noisy metric proves nothing.
- **Implement** the candidate as an isolated change, then measure.
- **Verdict:**
  - *proven* — advances the predicate without regression; keep it and update the baseline.
  - *disproven* — no effect or a regression; keep the change annotated, off the solution line.
  - *inconclusive* — refine the hypothesis or the test; don't mark it processed.
- **Disproof by evidence alone** (e.g. a profile showing the query is 5% of the tail) saves implementation work. Have a subagent confirm the evidence is sufficient before marking it disproven.

### Keep all attempts (jj)

Each candidate is its own jj change. Don't `jj abandon` candidates — they hold evidence, abandoning is only for empty scaffolds you created (jujutsu safety rule 6), and the user decides what to prune. Proven changes integrate into the solution line; disproven and inconclusive ones stay as annotated side changes, recorded in the ledger by change id.

## Parallelism

Default to sequential, because proven changes shift the baseline. Parallelize a batch only when hypotheses are orthogonal (disjoint code and behavior) and each has a fast, deterministic proving test. Use `jj workspace add` for concurrent code changes. See `jj-superpowers:dispatching-parallel-agents`.

## The Ledger

A markdown file (e.g. `docs/superpowers/improvement-loops/YYYY-MM-DD-<topic>.md`) is the source of truth; it survives context compaction, and subagents reconstruct state from it. Start it before generating hypotheses.

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

## Common Mistakes

- **Predicate drift** — quietly redefining "done" to match what was achieved. Pin it up front; if it must change, say so.
- **Stopping after one quiet review round** — convergence is a round with zero Critical/Important findings, and any new one reopens the loop.
- **Cherry-picked measurement** — reporting the favorable run. Fix the measurement method before measuring.
- **Treating disproof as failure** — a well-supported disproof shrinks the search space; record it.

## Related Skills

- `jj-superpowers:verification-before-completion` — evidence before any "done" claim.
- `jj-superpowers:tool-output-discipline` — keep measurement output concise.
