---
name: jj-clean-history
description: Reorganize jj commits into a clean, narrative-quality history using jj-hunk for hunk-level splitting
---

## Overview

Use this skill for arbitrary committed jj history that needs cleanup into a clear narrative. If you are organizing post-implementation `toorg:` commits from a planned work graph, use `jj-reorg-changes` instead.

Use the `jj-clean-history` skill to reorganize commits up to `$ARGUMENTS` (default: `trunk()`) into a clean, narrative-quality history.

## Safety: always do this first

Before touching anything, record the starting operation ID:

```bash
BEGINNING=$(jj op log --no-graph -T id -n 1 --no-pager)
echo "Starting op: $BEGINNING"
```

If anything goes wrong, undo the last operation with:

```bash
jj undo
```

Only use `jj op restore $BEGINNING` as a last resort if multiple operations need unwinding — it erases **all** changes since that op.

**CRITICAL — working copy protection:**

Check whether `@` has uncommitted changes:

```bash
jj diff --no-pager -r @
```

- If `@` is **non-empty** (has uncommitted changes): **refuse to proceed**. Tell the user to first commit or shelve their working copy changes before cleaning history. Never target `@` for any split or rebase operation.
- If `@` is **empty**: safe to continue.

All split operations must target **committed changes only** (revisions other than `@`). The working tree must be identical before and after this command completes.

## Phase 1: Review for mixed changes

Analyze all commits in the range to identify which ones contain mixed concerns (e.g. unrelated changes bundled together, fixups mixed with features, formatting mixed with logic).

For large ranges or complex histories, offer to dispatch subagents in parallel to analyze commits — ask the user: *"There are N commits to review. Should I analyze them in parallel using subagents for speed?"*

Present a clear list of commits that need splitting and why, then wait for user confirmation before proceeding.

## Phase 2: Split confirmed commits

For each commit the user agrees should be split, choose topology:

- **Sequential or dependent extraction (`jj-hunk` skill)** — changes have dependencies, need hunk-level selection, or should become a linear series of commits with a natural ordering.
- **Parallel (`jj-split-parallel` skill)** — changes are fully independent.

If it's unclear, ask the user before splitting.

## Verification after all splits

After all splits complete, confirm the working tree state is unchanged by comparing the starting op snapshot to the current one:

```bash
jj op diff --from $BEGINNING --to $(jj op log --no-graph -T id -n 1 --no-pager) --stat -G --no-pager
```

This shows only history-level changes (new commits, rewrites). If it shows any unexpected changes to `@`'s file contents, immediately run `jj undo` (repeat as needed, one per bad operation) and report the error to the user.

**NEVER run `jj op restore` without explicit user confirmation first.** If `jj undo` is insufficient, explain the situation to the user, show them `$BEGINNING`, and ask them whether to proceed with `jj op restore $BEGINNING` before running it.

After cleanup, create or update bookmarks manually using `jujutsu` guidance if the cleaned history needs to be published or shared.
