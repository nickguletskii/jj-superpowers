---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, and before committing, opening a PR, marking a task done, or handing off to another agent.
---

# Verification Before Completion

Make a success claim only when you have output that shows it, and that output is still valid. Paraphrases and hedges ("should pass", "seems fixed") are claims too; without evidence, state the actual status instead.

**Valid** means the run postdates the last change that could affect its result: source, config, dependencies, or the tests themselves. Edits to comments, docs, or generated text nothing asserts on don't invalidate it. If you have valid output, cite it and don't re-run. Builds and test suites are slow and contend on shared state (build locks, target directories, CI runners), so a re-run that can't change the answer costs time and, in a multi-agent session, blocks other agents. This is why `jj-superpowers:writing-plans` puts contended commands at `verify` nodes.

If you lack valid output, choose the smallest check that supports the claim you need to make. Run that command to completion, inspect its exit code and relevant results, and report its actual scope. A targeted test supports a targeted claim; it does not establish that the whole suite passes. Do not run a broader command merely to make a broader success claim.

## When to verify

Finish a coherent unit of change before checking it: the related source, caller, and test edits together. Independent changes can share one verification point when their dependencies, file ownership, and checks allow it. Don't check after every file edit or small fix.

Batching postpones verification; it never skips it. Verify before integration, before a success claim, and before a dependent action that relies on a proven invariant. Check earlier only to cross a high-risk boundary, resolve a concrete uncertainty that blocks further work, reproduce a bug, or meet an explicit requirement.

After a failed check, read the diagnostics you already have, fix the related causes together, and rerun the smallest check that covers what changed. Broaden to a suite only for affected integration boundaries, explicit requirements, or unresolved material risk. Prefer one command that supplies the needed evidence over separate check, build, and test commands that repeat the same compilation. One owner runs a contended or expensive check; everyone else reuses its valid result across reviews, handoffs, commits, and final reporting.

## Choosing evidence

Before an expensive check, rebuild, or historical run, name the question it answers and look for cheaper evidence that already answers it: user-provided output, CI results, logs, source inspection.

Don't reconstruct prior states — check out or build an earlier revision, run a baseline, manufacture a failing test — to label failures pre-existing, satisfy review ceremony, or tidy a report. Such a run is justified only by a specific unresolved question that materially affects the fix and can't be answered more cheaply; first state the question, the expected cost, and the narrowest way to run it. Reuse isolated caches and workspaces where practical, and never disturb shared work in progress. Explicit user requests for a historical comparison are always honored.

| Claim | Requires | Not sufficient |
|-------|----------|----------------|
| Tests pass | Test command output with 0 failures | Partial run, extrapolation |
| Linter clean | Linter output with 0 errors | Partial check |
| Build succeeds | Build command exits 0 | Linter passing, "logs look good" |
| Bug fixed | Test of the original symptom passes | Code changed |
| Regression covered | Test checks the original failure condition against the intended result and passes | Assertions that only mirror the implementation |

Requirements are met when the behavior that actually changed satisfies the requirements that apply to it — review that, not a line-by-line ritual. Don't inspect version control only to distrust another agent's report; look when the report is inconsistent or the change carries real risk.

## Reporting

Claim only what was checked. Name the commands you ran and their scope, and state what remains unverified or uncertain.
