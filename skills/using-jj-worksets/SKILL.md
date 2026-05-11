---
name: using-jj-worksets
description: "Use when implementation is complete and you want to understand how to organize toorg: commits into a structured jj DAG — overview and entry point for post-implementation history organization"
---

# Using jj Work Scopes

## Overview

After implementation, work lives in `toorg:` commits in the jj history. This skill explains the optional post-implementation step of organizing those commits into a clean, reviewable DAG.

**For the detailed step-by-step:** Use **jj-superpowers:jj-reorg-changes**.

## What toorg: Commits Look Like

After implementation, your history looks like:

```
@ (working copy — empty)
○  toorg: add auth endpoints
○  toorg: add user model
○  toorg: update schema
○  trunk()
```

## What an Organized DAG Looks Like

After running `jj-reorg-changes`:

```
@ (working copy — empty)
│
○  scope: add user authentication
├──○  toreview: add user model and schema
└──○  toreview: add auth endpoints
       ○  plan: add user authentication
          trunk()
```

## When to Reorganize

**Reorganize if:**
- The PR will be reviewed by others and clean history matters
- The `toorg:` commits don't map cleanly to a single logical unit
- You want logical separation between concerns (model vs. endpoints vs. tests)

**Skip reorganization if:**
- The work is a single coherent change and `toorg:` commits already tell the story
- You're in a hurry — `finishing-a-development-branch` handles `toorg:` commits directly

## Entry Point

Reorganization is offered as an optional step in `finishing-a-development-branch` (Step 0.5). You can also invoke `jj-reorg-changes` directly at any point after implementation.

## Change Message Prefixes

| Prefix | Meaning |
|--------|---------|
| `toorg: <description>` | Raw implementation work — to be organized or renamed |
| `plan: <feature name>` | Plan document (bottommost, above trunk) |
| `todo: <description>` | Sub-route: planned, not started |
| `toreview: <description>` | Sub-route: complete, ready for user review |
| `temp: <description>` | Temporary/scratch files for this scope |
| `scope: <feature name>` | Scope merge change — consolidates sub-routes |

## Safety Rules

Always use `--no-edit` with `jj new`. Never use `jj edit`, `jj next`, or `jj prev`.

Never run `jj describe`, `jj new`, or `jj commit` without `-m`.

Always use `--no-pager` on log/diff commands.

## Integration

**Entry points:**
- **jj-superpowers:finishing-a-development-branch** — offers reorganization at Step 0.5

**Detailed workflow:**
- **jj-superpowers:jj-reorg-changes** — full step-by-step reorganization

**Pairs with:**
- **jj-superpowers:finishing-a-development-branch** — cleanup and integration after reorganization
