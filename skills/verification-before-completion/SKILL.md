---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, and before committing, opening a PR, marking a task done, or handing off to another agent.
---

# Verification Before Completion

Make a success claim only when you have output that shows it, and that output is still valid. Paraphrases and hedges ("should pass", "seems fixed") are claims too; without evidence, state the actual status instead.

**Valid** means the run postdates the last change that could affect its result: source, config, dependencies, or the tests themselves. Edits to comments, docs, or generated text nothing asserts on don't invalidate it. If you have valid output, cite it and don't re-run. Builds and test suites are slow and contend on shared state (build locks, target directories, CI runners), so a re-run that can't change the answer costs time and, in a multi-agent session, blocks other agents. This is why `jj-superpowers:writing-plans` puts contended commands at `verify` nodes.

If you lack valid output, run the full command, read all of it including the exit code and failure count, and report what it actually shows.

## What counts as evidence

| Claim | Requires | Not sufficient |
|-------|----------|----------------|
| Tests pass | Test command output with 0 failures | Partial run, extrapolation |
| Linter clean | Linter output with 0 errors | Partial check |
| Build succeeds | Build command exits 0 | Linter passing, "logs look good" |
| Bug fixed | Test of the original symptom passes | Code changed |
| Regression test works | Passes; fails with the fix reverted; passes once restored | Passing once |
| Requirements met | Plan re-read line by line, gaps reported | Tests passing |
| Agent completed | VCS diff shows the changes | The agent's own report |
