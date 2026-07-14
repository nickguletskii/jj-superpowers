---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always
---

# Verification Before Completion

## Overview

Claiming work is complete without verification is dishonesty, not efficiency.

**Core principle:** Evidence before claims, always.

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT VALID VERIFICATION EVIDENCE
```

You cannot claim a command passes unless you have its output and that output is still valid.

**Valid** means the run postdates the last change that could affect its result. It does **not** mean "run again in this message." Verification evidence does not expire on its own — it expires when something it depends on changes.

## The Gate Function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. CHECK: Do I already have valid output for it?
   - Has anything changed since that run that could change its result?
     (source, config, deps, the tests themselves — NOT comments, docs, or
      generated text nothing asserts on)
   - If nothing relevant changed: the evidence stands. Cite it. Do not re-run.
   - If something relevant changed, or I have no output: RUN it (full, complete).
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Claiming without evidence = lying.
Re-running when nothing changed = waste, not rigor.
```

**Re-running is not free.** Builds and test suites are slow and contend on shared state (build locks, target directories, CI runners) — a re-run that cannot change the answer costs real time and, in a multi-agent session, blocks other agents waiting on the same resource. This is the same reasoning that puts contended commands at `verify` reduction points instead of scattering them through task nodes (see `jj-superpowers:writing-plans`).

Rigor is having the evidence. It is not regenerating evidence you already have.

## What Counts as Evidence

| Claim | Requires | Not sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | "should pass", partial run, extrapolation |
| Linter clean | Linter output: 0 errors | Partial check |
| Build succeeds | Build command: exit 0 | Linter passing (linter ≠ compiler), "logs look good" |
| Bug fixed | Test of the original symptom: passes | Code changed, assumed fixed |
| Regression test works | Red-green cycle: write → run (pass) → revert fix → run (**MUST FAIL**) → restore → run (pass) | Test passes once |
| Requirements met | Re-read the plan, line-by-line checklist, report gaps | Tests passing |
| Agent completed | VCS diff shows the changes | Agent's own "success" report |

## When To Apply

**Before:** any success/completion claim, any expression of satisfaction ("Great!", "Perfect!", "Done!"), committing, PR creation, marking a task complete, moving to the next task, delegating to agents.

The rule covers exact phrases, paraphrases, synonyms, and anything that merely *implies* success — including hedges like "should", "probably", "seems to". Reaching for different wording does not exempt you; if you cannot cite valid evidence, state the actual status instead.
