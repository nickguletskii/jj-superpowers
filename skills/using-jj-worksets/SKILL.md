---
name: using-jj-worksets
description: Use when starting feature work that needs isolation from current work or before executing implementation plans - sets up a jj work scope (scope merge DAG) as the isolated unit of work for this session
---

# Using jj Work Scopes

## Overview

This skill replaces git worktrees. In jj repositories, work isolation is achieved through **scope merge commits** in a single working copy — not through multiple working directories.

**Core principle:** One `@` (working tree) at the tip of everything. Each feature/task gets its own scope in the DAG. One superpowers session = one work scope.

**Announce at start:** "I'm using the jj-agentic-dev workflow to set up a work scope."

## What This Replaces

| Git worktrees | jj work scopes |
|---|---|
| Multiple working directories | Single `@` at the tip of the DAG |
| `git worktree add .worktrees/feature -b feature/auth` | `jj new --no-edit -m "scope: auth" --insert-after plan0 --insert-before @` |
| Isolation via filesystem | Isolation via DAG structure |
| `git worktree remove <path>` | `jj abandon <scope-change>` |

## The Pattern

```
@  (single working tree — tip of everything)
│
○  scope: this-session's-work
├──○  toreview: step-1
├──○  toreview: step-2
└──○  temp: agent handoff
       ○  plan: this-session's-work
          trunk()
```

A second active feature just adds a second parent to `@`:

```
@
├──○  scope: feature-A
└──○  scope: feature-B
```

## Setup Steps

**For the detailed workflow, use the `jj-agentic-dev` skill.** This skill summarizes the setup.

### 0. Ask where to anchor the work scope

Before creating any changes, ask the user:

```
Where should this work scope be anchored?

1. On top of the last change (@-) — sequential, depends on current work
2. In parallel to the last work set — plan shares the same parent as the existing plan
3. From trunk — independent of all current work

Which option?
```

Read the current DAG to understand the context before asking:

```bash
jj log -r 'trunk()..@' --no-pager \
  --template 'change_id.short(8) ++ "  " ++ description.first_line() ++ "\n"'
```

Use the answer to set `<base>` for the plan change:

| Option | `<base>` for `--insert-after` |
|--------|-------------------------------|
| 1. On top of @- | the change ID of `@-` |
| 2. Parallel to last work set | the same parent as the existing `plan:` change |
| 3. From trunk | `trunk()` |

### 1. Create the plan change

```bash
jj new --no-edit -m "plan: <feature name>" --insert-after <base> --insert-before @
# note the change ID: plan0
```

Write the plan document in `@`, then squash it in:

```bash
jj squash --from @ --into plan0 docs/superpowers/plans/YYYY-MM-DD-<slug>.md
```

### 2. Create a scope merge placeholder

```bash
jj new --no-edit -m "scope: <feature name>" --insert-after plan0 --insert-before @
# note the change ID: scope0
```

### 3. Create implementation sub-routes

For each independent task (prefer parallel):

```bash
jj new --no-edit -m "todo: <step description>" --insert-after plan0 --insert-before scope0
```

For sequential steps (B requires A's output):

```bash
jj new --no-edit -m "todo: <step B>" --insert-after <step-A-id> --insert-before scope0
```

### 4. Create the temp change

```bash
jj new --no-edit -m "temp: agent handoff and scratch files" --insert-after plan0 --insert-before scope0
```

### 5. Verify setup

```bash
jj log -r 'trunk()..@' --no-pager
```

Expected output:
```
@ (depends on scope0)
○ scope0   scope: <feature name>
├─┬─╮
│ │ ○ temp0   temp: agent handoff
│ ○ │ <id>    todo: step-B
○ │ │ <id>    todo: step-A
╰─┴─┘
    ○ plan0  plan: <feature name>
    ○ trunk()
```

## Safety Rules

Always add `--no-edit` to `jj new`. Never use `jj edit` or `jj next`/`jj prev` — these would move `@` away from the tip.

Never open an editor — always pass `-m`:

| ❌ Opens editor | ✅ Non-interactive |
|---|---|
| `jj describe` | `jj describe -r <id> -m "message"` |
| `jj new` | `jj new --no-edit -m "message" ...` |

Always use `--no-pager` on `jj log` and `jj diff` commands.

## Integration

**Called by:**
- **brainstorming** — set up scope before implementation begins
- **subagent-driven-development** — REQUIRED before executing any tasks
- **executing-plans** — REQUIRED before executing any tasks

**Pairs with:**
- **finishing-a-development-branch** — cleanup/integration after work is complete
- **jj-agentic-dev** — the full detailed workflow this skill summarizes
