---
name: jj-agentic-dev
description: |
  Agentic single-worktree development workflow for jujutsu (jj) repositories. Replaces git
  worktrees: multiple parallel work scopes coexist under a single @ using explicit scope merge
  commits. Pre-plans the full change DAG before writing any code, tracks execution via change
  message prefixes (todo:/wip:/toreview:), and uses jj squash to file work from the working
  tree into pre-planned changes — producing a clean, reviewable history without post-hoc rewriting.

  Use when starting any implementation task in a jj repository where a plan exists or can be
  derived. Triggers on: "implement the plan", "start the feature", "begin development",
  "create the changes", "set up the jj history", or any task where an agent will write code
  across multiple logical steps in a jj repo.
---

# jj Agentic Development Workflow

## Overview

This workflow replaces git worktrees. Instead of multiple isolated working copies pointing at different branches, a **single `@`** (working tree) sits at the tip of the entire DAG, depending on one or more **scope merge commits** that each consolidate a parallel work scope.

All work is done in `@` and squashed into the appropriate pre-planned changes below. No post-hoc history rewriting needed.

```
@  (single working tree — tip of everything)
├── scope: feature-A (merge of A's sub-routes + A's temp)
│   ├── toreview: A-step-1
│   ├── toreview: A-step-2
│   └── temp: A-agent-handoff
│       plan: feature-A
│       trunk()
└── scope: feature-B (merge of B's sub-routes + B's temp)
    ├── toreview: B-step-1
    └── temp: B-agent-handoff
        plan: feature-B
        trunk()
```

## ⚠️ Safety Rules

### Never open an editor — always pass `-m`

| ❌ Opens editor | ✅ Non-interactive |
|---|---|
| `jj describe` | `jj describe -r <id> -m "message"` |
| `jj new` | `jj new --no-edit -m "message" --insert-after X --insert-before Y` |
| `jj commit` | `jj commit -m "message"` |
| `jj squash -i` | `jj squash --from @ --into <id> [files]` |

Always add `--no-pager` to log/diff commands.

### Never change the working copy (`@`) without explicit user permission

`@` is the single tip in this workflow. The agent works inside `@` and squashes outward. Never move `@` to a different change:

- **Never** use `jj edit` — it reassigns `@` to another change
- **Never** use `jj new` without `--no-edit` — without that flag, `jj new` moves `@` to the new change
- **Never** use `jj next`, `jj prev`, or `jj checkout`

### Never use positional revsets or `-r` / `-o` with `jj new`

Always use `--insert-after` and/or `--insert-before` to place changes explicitly.

### Verify working copy after any DAG manipulation

After any operation that rewrites history (adapting the DAG mid-flight, rebasing, abandoning changes), verify the working copy content is unchanged:

```bash
# Before: capture the working copy commit ID
PRE_ID=$(jj log -r @- -T 'commit_id' --no-graph --no-pager)

# ... DAG manipulation ...

# After: confirm no unintended content change
jj diff --from "$PRE_ID" --to "$(jj log -r @ -T 'commit_id' --no-graph --no-pager)" --no-pager
# Empty = ✓. Any output = use jj undo to recover.
```

## Change Message Prefixes

| Prefix | Meaning |
|---|---|
| `plan: <feature name>` | Plan document — bottommost change above trunk(), created first |
| `todo: <description>` | Sub-route: planned, not started |
| `wip: <description>` | Sub-route: in progress |
| `toreview: <description>` | Sub-route: complete, ready for user review |
| `temp: <description>` | Temporary files for this scope — safe to abandon after review |
| `scope: <feature name>` | Scope merge commit — consolidates all sub-routes + temp for one feature |

## DAG Structure

For each work scope (feature / task):

```
plan:  <feature>              ← bottommost: plan document, rooted in trunk()
  ├── todo/wip/toreview: step-1   ← sub-routes: implementation changes
  ├── todo/wip/toreview: step-2
  └── temp: agent-handoff         ← temp: always a sibling, rooted in plan:
        ↓ (all merged by)
scope: <feature>              ← scope merge: has all sub-routes + temp as parents
        ↓
@                             ← tip: depends on ALL active scope merges
```

`@` depends on one scope merge per active feature. Adding a second feature adds a second scope merge as another parent of `@`.

## Canonical `jj new` Pattern

All new changes use `--insert-after X --insert-before Y`. Each call that uses `--insert-before @` adds the new change as an additional parent of `@` (the diamond pattern from the jj help).

- **Sub-routes**: `--insert-after plan0 --insert-before scope-merge`
- **Temp change**: `--insert-after plan0 --insert-before scope-merge`
- **Scope merge**: `--insert-after <all-sub-routes> --insert-after temp --insert-before @`

The scope merge change is always a **dedicated, explicitly created change** — not `@` itself.

## Phase 1: Set Up a New Work Scope

### Step 1: Create the plan change

```bash
# Plan change sits between trunk() and @
jj new --no-edit -m "plan: <feature name>" --insert-after trunk() --insert-before @
# note ID: plan0

# Write the plan document in @, then squash into plan0
# (e.g., docs/plans/YYYY-MM-DD-slug.md — lists all steps, rationale, design decisions)
jj squash --from @ --into plan0 docs/plans/2026-03-25-my-feature.md
```

### Step 2: Create a placeholder scope merge

Create the scope merge commit immediately after the plan change. Sub-routes will be inserted between plan0 and scope0 as they are added.

```bash
jj new --no-edit -m "scope: <feature name>" --insert-after plan0 --insert-before @
# note ID: scope0
```

### Step 3: Create implementation sub-routes (prefer parallel)

Insert each sub-route between plan0 and scope0. **Prefer parallel** for independent steps.

```bash
jj new --no-edit -m "todo: <step A>" --insert-after plan0 --insert-before scope0
# note ID: aaaa

jj new --no-edit -m "todo: <step B>" --insert-after plan0 --insert-before scope0
# note ID: bbbb
```

Each call inserts the new change between plan0 and scope0, making it a parent of scope0.

For sequential dependencies (step B requires step A's output):
```bash
jj new --no-edit -m "todo: <step B, depends on A>" --insert-after aaaa --insert-before scope0
```

### Step 4: Create the temp change

```bash
jj new --no-edit -m "temp: agent handoff and scratch files" --insert-after plan0 --insert-before scope0
# note ID: temp0
```

After setup, the log for this scope looks like:
```
@ (tip — depends on scope0)
│
○ scope0  scope: my feature
├─┬─╮
│ │ ○ temp0   temp: agent handoff and scratch files
│ ○ │ bbbb    todo: step B
○ │ │ aaaa    todo: step A
╰─╴─┘
    ○ plan0  plan: my feature
    ○ trunk()
```

## Phase 2: Execute — File Work into Sub-Routes

For each sub-route:

### Mark as in-progress
```bash
jj describe -r <id> -m "wip: <same description>"
```

### Write code in the working tree

Edit files normally. All edits land in `@`.

### Squash into the target sub-route
```bash
# Specific files
jj squash --from @ --into <id> path/to/file1.rs path/to/file2.rs

# All @ content (when @ only contains this sub-route's work)
jj squash --from @ --into <id>
```

`@` retains anything not squashed.

### Mark as complete
```bash
jj describe -r <id> -m "toreview: <same description>"
```

### Write temp files
```bash
# Write temp files in @, then squash into temp0
jj squash --from @ --into temp0 docs/handoffs/my-feature.md
```

### Check progress
```bash
jj log -r 'trunk()..@' --no-pager
```

## Phase 3: Adapt — Modify the DAG Mid-Flight

### Add a new parallel sub-route to a scope
```bash
# Inserts between plan0 and scope0 — becomes another parent of scope0
jj new --no-edit -m "todo: <new step>" --insert-after plan0 --insert-before scope0
# Update plan document if needed
jj squash --from @ --into plan0 docs/plans/...
```

### Add a new sequential sub-route (depends on an existing one)
```bash
jj new --no-edit -m "todo: <new step>" --insert-after <prior-id> --insert-before scope0
```

### Add a new scope (second active feature)
```bash
# Create plan2 between trunk() and @
jj new --no-edit -m "plan: <feature B>" --insert-after trunk() --insert-before @
# ID: plan1
jj squash --from @ --into plan1 docs/plans/...

# Create scope merge for feature B
jj new --no-edit -m "scope: <feature B>" --insert-after plan1 --insert-before @
# ID: scope1
# @ now depends on scope0 AND scope1

# Add sub-routes for feature B
jj new --no-edit -m "todo: <B-step>" --insert-after plan1 --insert-before scope1
jj new --no-edit -m "temp: B agent handoff" --insert-after plan1 --insert-before scope1
```

### Abandon a sub-route no longer needed
```bash
jj abandon <change-id>   # jj automatically rebases descendants
```

### Abandon temp after user review
```bash
jj abandon temp0
# scope0 is automatically rebased to drop the temp parent
```

## Complete Example

Scenario: add user authentication. Model and endpoints are independent; tests depend on both.

```bash
# --- SETUP SCOPE ---
jj new --no-edit -m "plan: add user authentication" --insert-after trunk() --insert-before @
# → plan0
jj squash --from @ --into plan0 docs/plans/2026-03-25-user-auth.md

# Create scope merge (placeholder)
jj new --no-edit -m "scope: add user authentication" --insert-after plan0 --insert-before @
# → scope0

# Parallel sub-routes
jj new --no-edit -m "todo: add user model" --insert-after plan0 --insert-before scope0    # → aaaa
jj new --no-edit -m "todo: add auth endpoints" --insert-after plan0 --insert-before scope0 # → bbbb

# Tests depend on both model + endpoints: anchor to bbbb (which depends on aaaa)
# Actually aaaa and bbbb are parallel, so create cccc from plan0 too but
# note that tests need aaaa and bbbb's output — use --insert-after aaaa if sequential
jj new --no-edit -m "todo: add tests" --insert-after aaaa --insert-before scope0           # → cccc
# Also add bbbb as parent of cccc:
jj new --no-edit -m "todo: add tests" --insert-after bbbb --insert-before scope0           # -- actually need to rebase cccc to also depend on bbbb

# Temp
jj new --no-edit -m "temp: agent handoff and scratch files" --insert-after plan0 --insert-before scope0  # → temp0

# --- EXECUTE ---
jj describe -r aaaa -m "wip: add user model"
# ... edit src/models/user.rs, src/schema.rs ...
jj squash --from @ --into aaaa src/models/user.rs src/schema.rs
jj describe -r aaaa -m "toreview: add user model"

jj describe -r bbbb -m "wip: add auth endpoints"
# ... edit src/routes/auth.rs ...
jj squash --from @ --into bbbb src/routes/auth.rs
jj describe -r bbbb -m "toreview: add auth endpoints"

jj describe -r cccc -m "wip: add tests"
# ... edit tests/auth_test.rs ...
jj squash --from @ --into cccc tests/auth_test.rs
jj describe -r cccc -m "toreview: add tests"

# Handoff
# ... write docs/handoffs/2026-03-25-user-auth.md in @ ...
jj squash --from @ --into temp0 docs/handoffs/2026-03-25-user-auth.md
```

## Getting Change IDs

```bash
jj log -r 'trunk()..@' --no-pager --no-graph \
  --template 'change_id.short(8) ++ "  " ++ description.first_line() ++ "\n"'
```

Use the **change ID** (not commit ID) — it remains stable across rebases.

## Rules

- **Never** run `jj describe`, `jj new`, or `jj commit` without `-m` / `--message`
- **Never** use `jj new` with positional args or `-r` / `-o` — always use `--insert-after` / `--insert-before`
- **Always** use `--no-edit` with `jj new` (nothing is ever created above `@`)
- **Always** use `--no-pager` on log/diff commands
- **Always** create an explicit `scope:` merge change for each work scope — never let `@` be the scope merge
- **Prefer parallel sub-routes** — use `--insert-after plan0` for independent steps; use `--insert-after <prior-id>` only when a step truly requires prior output
- **Always create a `temp:` change** per scope, inserted before the scope merge — never mix temp files into `plan:`/`toreview:` changes
- Squash by **file path** when `@` contains work for multiple sub-routes
- Use `change_id` (not `commit_id`) when referencing revisions — stable through rebases
- Never add co-author or AI attribution lines to change messages
