---
name: jj-workspaces
description: |
  Creates an isolated jj workspace (jj-native equivalent of git worktrees) sharing the same
  repo, with its own independent working-copy change.

  **NOT for agentic multi-step development work.** For implementing plans or features in jj
  repos, use the `jj-agentic-dev` skill instead — it uses a single working tree with scope
  merge commits and avoids workspace isolation issues (e.g. shared Bazel cache invalidation).

  Use jj-workspaces only when true filesystem isolation is explicitly needed: e.g. running a
  long-lived dev server on a specific revision while editing in another, or when the user
  explicitly asks for a workspace.
---

# Using jj Workspaces

> **Before proceeding:** If you are implementing a plan, feature, or any multi-step task,
> stop and use the `jj-agentic-dev` skill instead. That workflow handles multiple parallel
> work scopes in a single working tree without needing isolated workspaces.
>
> Only continue with this skill if true filesystem isolation is explicitly required (e.g.
> running a dev server on a pinned revision, or the user explicitly asked for a workspace).

**Announce at start:** "I'm using the jj-workspaces skill to set up an isolated workspace."

## Overview

jj workspaces create isolated working directories that share the same repository and operation log. Each workspace has its own `@` (working-copy change), independent of all other workspaces. Changes made in one workspace do not affect the working copy of another.

**Key difference from git worktrees:** No branch required. Each workspace has its own working-copy change, which can be on any revision.

## Directory Selection

Workspaces **must not** be placed inside the project root — jj would snapshot those files into the working copy. Always use a sibling directory.

### Priority order

1. **CLAUDE.md preference** — check for a `workspaces` or `workspace directory` setting
2. **Existing sibling convention** — look for `../<project>-*` workspace directories already present
3. **Default** — use `../<project>-<workspace-name>`

```bash
# Detect project name
project=$(basename "$(jj root --no-pager 2>/dev/null)")

# Default path for a workspace named "feature"
path="../${project}-feature"
```

## Creation

```bash
# Create workspace at sibling path (name defaults to last path component)
jj workspace add <path>

# Or with explicit name
jj workspace add --name <name> <path>

# Verify it was created
jj workspace list --no-pager
```

The new workspace starts with a fresh empty working-copy change, parented to the current `@` of the workspace that created it.

## Working in the Workspace

Navigate to the workspace directory and work normally. The `@` there is independent:

```bash
cd <path>
jj log --no-pager        # Shows this workspace's @
jj status --no-pager     # Working copy state for this workspace
```

Changes committed in this workspace appear in the shared repo and are visible from any workspace via `jj log`.

## Cleanup (Required)

When the work is complete or the workspace is no longer needed, **always clean up**:

```bash
# From the primary workspace (not from inside the workspace being removed)
jj workspace forget <workspace-name> --no-pager

# Remove the directory
rm -rf <path>
```

If forgetting from within the workspace itself, jj will refuse — switch to another workspace first:

```bash
cd <primary-workspace-root>
jj workspace forget <name> --no-pager
rm -rf <path>
```

**Always remind the user** when handing back control: "The workspace at `<path>` should be removed when you're done with this work. Run: `jj workspace forget <name> && rm -rf <path>`"

## Quick Reference

| Command | Purpose |
|---------|---------|
| `jj workspace add <path>` | Create new workspace |
| `jj workspace add --name <n> <path>` | Create with explicit name |
| `jj workspace list` | List all workspaces |
| `jj workspace forget <name>` | Unregister workspace (then `rm -rf <path>`) |

## Example Workflow

```
You: I'm using the jj-workspaces skill to set up an isolated workspace.

[Detect project: "cityvms"]
[Create: jj workspace add ../cityvms-auth]
[Workspace "cityvms-auth" created at ../cityvms-auth]
[jj workspace list shows: default, cityvms-auth]

Workspace ready at ../cityvms-auth
Working-copy change @ is independent from the main workspace.
When done: jj workspace forget cityvms-auth && rm -rf ../cityvms-auth
```

## Rules

- **Never** place a workspace inside the project root
- **Always** clean up with `jj workspace forget` + `rm -rf` when done
- **Always** remind the user of the cleanup command before handing back control
- Use `change_id` (not `commit_id`) when referencing revisions — stable through rebases
- Never add co-author or AI attribution lines to changes
