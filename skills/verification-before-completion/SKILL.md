---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, and before committing, opening a PR, marking a task done, or handing off to another agent.
---

# Verification Before Completion

Make a success claim only when you have output that shows it, and that output is still valid. Paraphrases and hedges ("should pass", "seems fixed") are claims too; without evidence, state the actual status instead.

**Valid** means the run postdates the last change that could affect its result: source, config, dependencies, or the tests themselves. Edits to comments, docs, or generated text nothing asserts on don't invalidate it. If you have valid output, cite it and don't re-run. Builds and test suites are slow and contend on shared state (build locks, target directories, CI runners), so a re-run that can't change the answer costs time and, in a multi-agent session, blocks other agents. This is why `jj-superpowers:writing-plans` puts contended commands at `verify` nodes.

If you lack valid output, choose the smallest check that supports the claim you need to make. Run that command to completion, inspect its exit code and relevant results, and report its actual scope. A targeted test supports a targeted claim; it does not establish that the whole suite passes. Do not run a broader command merely to make a broader success claim.

## When to verify

Finish a coherent implementation chunk before running builds or tests: complete the related source, caller, and test edits first. Do not check after every file edit or small fix. Run earlier only to answer a concrete question that blocks further work, reproduce a bug, or satisfy an explicit project requirement.

After a failed check, inspect the diagnostics and fix the related causes together before rerunning. Broaden verification only for affected boundaries, explicit requirements, or unresolved concerns. Prefer one command that supplies the needed evidence over separate check, build, and test commands that repeat the same compilation.

Reuse valid results across reviews, handoffs, commits, and final reporting. These events alone do not require new runs. Report unverified scope honestly rather than running every available check.

## What counts as evidence

| Claim | Requires | Not sufficient |
|-------|----------|----------------|
| Tests pass | Test command output with 0 failures | Partial run, extrapolation |
| Linter clean | Linter output with 0 errors | Partial check |
| Build succeeds | Build command exits 0 | Linter passing, "logs look good" |
| Bug fixed | Test of the original symptom passes | Code changed |
| Regression covered | Test checks the original failure condition against the intended result and passes | Assertions that only mirror the implementation |
| Requirements met | Plan re-read line by line, gaps reported | Tests passing |
| Agent completed | VCS diff shows the changes | The agent's own report |
