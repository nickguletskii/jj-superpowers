---
name: jujutsu
description: |
  Comprehensive guidance for using jujutsu (jj) version control system instead of git.
  Covers change-based workflows, atomic commits, stacked changes, and revset queries.

  **When to use this skill:**
  - When the repository's CLAUDE.md explicitly specifies using jujutsu/jj instead of git
  - When user explicitly mentions "jujutsu", "jj", or asks to use jj commands
  - When working with jj repositories (identifiable by `.jj/` directory)
  - When user asks about version control in a jj-enabled project

  **Triggers include**: "use jj", "create a change", "split this change",
  "jujutsu workflow", "jj describe", "manage bookmarks"

  This skill completely replaces git workflows when active - use jj commands instead of git commands
  for all version control operations including commits, branches, and rebasing.
---

# Jujutsu Version Control

Jujutsu (jj) is a powerful version control system with a **change-based model** that simplifies workflows compared to git's commit-based model.

## ⚠️ CRITICAL: Safety Rules for AI Agents

### 1. No raw `git` commands

Use `jj` for all version control operations. `git` is only permitted when the user explicitly requests a specific operation that `jj` cannot perform.

### 2. Never change the working copy (`@`) without explicit user permission

The following commands reassign which change is `@` and must **not** be used unless the user explicitly asks:

| ❌ Do not use | Why |
|---|---|
| `jj edit <id>` | Moves `@` to a different change |
| `jj next` / `jj prev` | Moves `@` along the graph |
| `jj new` (without `--no-edit`) | Creates a change and moves `@` to it |
| `jj checkout` / `jj co` | Alias for `jj edit` |

### 3. Always force non-interactive mode

Every `jj` command that can open an editor must be made non-interactive:

| ❌ Opens editor | ✅ Non-interactive form |
|---|---|
| `jj describe` | `jj describe -m "message"` or `jj describe -r <id> -m "message"` |
| `jj new` | `jj new --no-edit -m "message" --insert-after X --insert-before Y` |
| `jj commit` | `jj commit -m "message"` |
| `jj squash -i` | `jj squash --from <id> --into <id> [files] -u` |
| `jj split` | Use `jj-hunk split` via the `jj-hunk` skill instead |
| `jj resolve` | Edit conflict markers manually in the file |
| `jj diffedit` | Not usable by agents — edit files directly |

Always add `--no-pager` to `jj log`, `jj diff`, `jj show`, and `jj op log`.

**When providing commands for users to execute manually**, offer both versions:
- **For AI execution**: Non-interactive command
- **For manual execution**: Interactive command with "(interactive)" label

### 4. Distinguish "insert before `@`" from "create a sibling"

When separating part of `@` into a new change, decide the graph intent first:

- If `@` should still depend on the extracted change, insert the new change before `@`, then file content into it:
  - `jj new --no-edit -m "message" --insert-after @- --insert-before @`
  - `jj squash --from @ --into <new-change-id> path/to/file -u`
- If the user explicitly wants parallel siblings, use `jj-split-parallel` or another sibling-specific workflow.
- **Never** use `jj split -o @-` as a generic extraction shortcut. For `-r @`, that rewrites the selected content onto `@-` and leaves the remaining working-copy change as a sibling that no longer depends on the extracted change.

### 5. Verify graph shape after any history rewrite

After splitting, rebasing, abandoning, or otherwise rewriting history:

- capture the pre-rewrite working-copy commit ID with `jj log -r @ -T 'commit_id ++ "\n"' --no-graph --no-pager`
- after the rewrite, run `jj diff --from <old-@-commit-id> --to @ --no-pager` and confirm it is empty when content should be unchanged
- inspect `jj log -r 'parents(@) | @' --no-graph --no-pager` to confirm the parent/ancestor relationship matches your intent

See [workflows.md](references/workflows.md) for detailed non-interactive patterns.

## Triggering This Skill

This skill activates when:
1. **Repository uses jujutsu**: Check for `.jj/` directory or CLAUDE.md specifying jj usage
2. **User explicitly requests**: User mentions "jujutsu", "jj", or asks to use jj commands
3. **Version control operations**: When performing commits, branches, rebasing in jj repos

**Once activated, use jj for ALL version control operations** - do not fall back to git commands.

## Initial Repository Setup

When first working with a jj repository that **does not yet have a `CLAUDE.md`** (or has one that doesn't mention jujutsu), the agent should collect key information and write it to the repository's root `CLAUDE.md`. This ensures all future sessions have the context they need.

### When to Run Setup

- You detect a `.jj/` directory but `CLAUDE.md` is missing or doesn't mention jj/jujutsu
- The user explicitly asks you to set up or initialize the repo for AI-assisted development

### Information to Collect

Run these commands to gather repository context:

```bash
# 1. Confirm jj repo and get basic info
jj version
jj root

# 2. Main branch / trunk detection
jj log -r 'trunk()' --no-graph --limit 1

# 4. Current bookmarks
jj bookmark list

# 5. Project language/framework (check for config files)
ls -1 Cargo.toml package.json pyproject.toml go.mod pom.xml build.gradle Makefile CMakeLists.txt 2>/dev/null

# 6. Existing build/test commands (inspect the relevant config file)
# e.g., for Rust: grep -A5 '\[scripts\]\|\[alias\]' Cargo.toml .cargo/config.toml 2>/dev/null
# e.g., for Node: jq '.scripts' package.json 2>/dev/null

# 7. Existing conventions (check for config/style files)
ls -1 .editorconfig .prettierrc* .eslintrc* rustfmt.toml .clang-format 2>/dev/null
```

### What to Write to `CLAUDE.md`

Create or update the repository's root `CLAUDE.md` with the collected information. Use this template as a guide, adapting it to the project:

```markdown
# Project Name

## Version Control

This project uses **jujutsu (jj)** for version control. Use `jj` commands instead of `git`.

- **Main branch**: `main` (detected via `trunk()`)

## Project

- **Language**: <detected language/framework>
- **Build**: `<build command>`
- **Test**: `<test command>`
- **Lint**: `<lint command>`

## Conventions

- <any detected or stated conventions, e.g., commit message style, branch naming>
```

### Guidelines

- **Don't overwrite existing content**: If `CLAUDE.md` already exists with other content, append or merge the jj-related section rather than replacing everything
- **Be accurate**: Only include information you actually confirmed from commands — don't guess at build commands or conventions
- **Keep it concise**: The file should be a quick reference, not exhaustive documentation
- **Ask when uncertain**: If you can't determine something (e.g., the test command), note it as `<not detected — ask user>` or ask the user directly

## Core Mental Model

### Changes vs Commits

| Git (Commits) | Jujutsu (Changes) |
|---------------|------------------|
| Commits have hashes that change on rewrite | Changes have stable IDs that persist |
| Staging area for selective commits | Working copy is automatically tracked |
| HEAD points to current commit | `@` is the working copy change |
| Branches required for collaboration | Bookmarks optional, used for remotes |

### Key Principles

1. **Working copy is a commit**: The working copy is always a change, automatically amended as you edit
2. **No staging area**: All file modifications are tracked automatically (respects `.gitignore`)
3. **Stable change IDs**: Change IDs persist through rebases and rewrites
4. **Operation log**: Every jj operation is logged and reversible via `jj undo`
5. **Bookmarks for sharing**: Bookmarks (like git branches) are used for remote sync

## Quick Command Reference

### Daily Workflow

```bash
# View status
jj st                                           # Current working copy status
jj log --no-pager                              # View change history
jj log -r 'ancestors(@, 10)' --no-graph --no-pager

# Describe the current working-copy change without moving @
jj describe -m "Description"

# Insert a predecessor change while keeping @ as the working copy
jj new --no-edit -m "Refactor: helper" --insert-after @- --insert-before @

# File selected paths from @ into an existing destination change
jj squash --from @ --into <change-id> path/to/file1 path/to/file2 -u

# Rebase specific changes when needed
jj git fetch
jj rebase -o 'trunk()'
jj rebase -s <change> -o <base>
```

For manual stack-navigation workflows such as `jj edit`, `jj next`, or plain `jj new`, see
`references/workflows.md`. Those commands move `@` and are not the default AI-agent workflow.

### Viewing Changes and Diffs

```bash
# Machine-parseable git-style diff (RECOMMENDED for AI agents)
jj diff --git --color=never --no-pager    # Current change vs parent

# Summary statistics
jj diff --stat --no-pager                  # File change summary

# Diff between specific changes
jj diff --from <change-1> --to <change-2> --git --color=never --no-pager

# Human-readable diff (for manual review)
jj diff                                     # Default interactive view with pager
```

**When to use each:**
- `--git --color=never --no-pager`: **Default for AI agents** - produces machine-parseable git-style diffs without color codes or pager interruption
- `--stat --no-pager`: Quick file change summary (which files, how many lines changed)
- Default `jj diff`: For human review in terminal only (uses pager, colors)

### Bookmark (Branch) Management

```bash
# Create bookmark at current change
jj bookmark create feature-name

# Create bookmark at specific change
jj bookmark create feature-name -r <change-id>

# List bookmarks
jj bookmark list

# Delete bookmark
jj bookmark delete feature-name

# Move bookmark forward
jj bookmark move feature-name --to <change-id>

# Move bookmark backward or sideways
jj bookmark move feature-name --to <change-id> --allow-backwards
```

### Syncing with Remote

```bash
# Fetch
jj git fetch

# Push specific bookmark (tracks automatically on first push)
jj git push --bookmark feature-name

# Push all bookmarks
jj git push --all

# Force push (rarely needed)
jj git push --bookmark feature-name --force
```

### Non-Interactive Change Management

```bash
# Squash entire working copy into parent
jj squash

# Squash specific change into parent
jj squash -r <change-id>

# Abandon change (like git reset, but safer)
jj abandon <change-id>

# Undo last operation
jj undo

# View operation history
jj op log
```

### Common Non-Interactive File-Filing Patterns

Use these when working in `@` and filing specific work into a pre-planned destination change without opening an editor.

The `-u` / `--keep-emptied` flag keeps `@` alive even when all its content is squashed out — essential in agentic workflows where `@` is the permanent tip.

```bash
# Move all of @ into a destination change (keep @ alive)
jj squash --from @ --into <rev> -u

# Move specific paths from @ into a destination change (leave other edits in @)
jj squash --from @ --into <rev> path/to/file1.rs path/to/file2.rs -u

# Update the destination's description (never opens editor)
jj describe -r <rev> -m "toreview: my step"

# Full pattern: write → file → mark done
# 1. Edit files in @
# 2. jj squash --from @ --into <rev> <paths> -u
# 3. jj describe -r <rev> -m "toreview: <description>"
```

**Why `-u` matters**: without it, squashing all content out of `@` abandons `@`, which may disrupt a multi-step workflow where `@` is expected to remain as the DAG tip.

### Operation Log and Recovery

The operation log records every jj operation and makes them fully reversible.

```bash
# View the operation log (most recent first)
jj op log --no-pager

# Limit to recent operations
jj op log --no-pager --limit 5

# Show what changed in a specific operation
jj op show <operation_id>

# Show diff of changes introduced by an operation
jj op diff --operation <operation_id>

# Undo the most recent operation (alias for jj op restore '@-')
jj undo

# Restore the repo to an earlier state (non-destructive: creates a new operation)
jj op restore <operation_id>

# Revert a specific past operation (applies its inverse)
jj op revert <operation_id>
```

**Recovery workflow after a bad operation:**
```bash
# 1. View recent operations to find a good state
jj op log --no-pager --limit 10

# 2. Inspect what the repo looked like at that operation
jj --at-op=<operation_id> log

# 3. Restore to that operation
jj op restore <operation_id>
```

**Important:**
- `jj op restore` and `jj undo` are safe — they create new operations rather than destroying history
- `jj op abandon` compacts old history and is NOT reversible — **never use it** unless explicitly requested by the user
- Use `jj op log` instead of guessing what happened — every mutation is recorded

### Verifying History Rewrites Didn't Change the Working Copy

Before any history-rewriting operation (split, squash, rebase, clean-history), snapshot the working copy commit ID. Afterwards, diff the snapshot against the new `@` to confirm the visible file content is unchanged.

```bash
# Step 1: capture working copy commit ID BEFORE rewriting
PRE_ID=$(jj log -r @ -T 'commit_id' --no-graph --no-pager)

# ... perform history-rewriting operations (jj-hunk split, jj rebase, etc.) ...

# Step 2: verify working copy is unchanged AFTER rewriting
jj diff --from "$PRE_ID" --to "$(jj log -r @ -T 'commit_id' --no-graph --no-pager)" --no-pager
# Empty output = working copy content is identical ✓
# Any output = something unintentionally changed — use jj undo to recover
```

Use this pattern:
- Before and after every `jj-hunk split` operation or other split-style history rewrite
- Before and after `jj-clean-history` or `jj rebase` runs
- Any time the correctness of the working copy is uncertain after DAG manipulation

## Common Workflows

### Creating Atomic Changes

```bash
# Edit files in the current working copy
vim src/feature.rs

# Describe the current change without moving @
jj describe -m "Add feature X"

# If the user explicitly wants a fresh successor change afterwards:
jj commit -m "Add feature X"
```

### Splitting Unrelated Changes (Non-Interactive)

When you have multiple unrelated changes in working copy, do not default to sibling extraction.
Choose the graph you want first:

```bash
# Insert a new predecessor before @ when @ should keep depending on it
jj new --no-edit -m "First change" --insert-after @- --insert-before @
# note the new change ID from command output, then file selected paths into it
jj squash --from @ --into <new-change-id> file1.rs file2.rs -u

# Describe the remaining working-copy change once only the second concern remains
jj describe -m "Second change"
```

If the user explicitly wants parallel siblings instead, use `jj-split-parallel` or a sibling-specific workflow.
For users executing manually, `jj split` remains the interactive option.

### Updating Change After Review

Prefer keeping `@` in place and filing current edits into the target change:

```bash
jj squash --from @ --into <change-id> path/to/file.rs -u
jj describe -r <change-id> -m "Updated: address review feedback"
```

If direct amendment of another change is required, ask first because `jj edit <change-id>` reassigns `@`.

### Finding Your Changes

```bash
# All unmerged changes (using trunk() alias)
jj log -r 'trunk()..@'

# Recent changes
jj log -r 'ancestors(@, 10)'

# Changes with bookmarks
jj log -r 'bookmarks() & ::@'

# Your authored changes
jj log -r 'mine()'
```

See [revsets.md](references/revsets.md) for powerful query syntax.


## Reference Documentation

Load these references as needed:

- **[workflows.md](references/workflows.md)** - Comprehensive daily workflows, splitting, rebasing, conflict resolution
- **[git-to-jj.md](references/git-to-jj.md)** - Git command mappings and migration guide
- **[revsets.md](references/revsets.md)** - Revset query language for finding and filtering changes

## Checking Repository Type

Before using jj commands, verify the repository uses jujutsu:

```bash
# Check for .jj directory
test -d .jj && echo "Jujutsu repo" || echo "Not jj repo"

# Or check CLAUDE.md for jj specification
grep -i "jujutsu\|jj" CLAUDE.md
```

If CLAUDE.md explicitly specifies using jj, proceed with jj commands. Otherwise, ask user before switching from git.

If this is a jj repo but `CLAUDE.md` is missing or doesn't mention jj, follow the [Initial Repository Setup](#initial-repository-setup) steps to collect repo info and create it.

## Key Advantages Over Git

1. **Simpler mental model**: No staging area, working copy is always a commit
2. **Stable change IDs**: History rewrites don't change change IDs
3. **Safe operations**: Operation log makes everything reversible
4. **Flexible history**: Changes and bookmarks are decoupled
5. **Automatic tracking**: No need for `git add`
6. **Elegant rebasing**: Descendants rebase automatically

## Tips for AI Agents

1. **Never run diffs inline**: Do not run `jj show`, `jj diff`, or any diff command to read output into the agent context — this pollutes context with large diffs. Give the user the command to run themselves instead.
2. **Always check for interactive commands**: If a workflow requires `jj split` or `jj squash -i`, provide non-interactive alternative
3. **Use revsets for precision**: `jj log -r 'trunk()..@'` shows exactly what needs pushing
4. **Trust operation log**: If uncertain, `jj op log` shows what happened; `jj undo` reverses it
5. **Describe changes clearly**: Good descriptions make history readable
6. **Fetch before rebasing**: `jj git fetch` then `jj rebase -o 'trunk()'`
7. **Create new changes explicitly**: When you need a new change, prefer `jj new --no-edit --insert-after ... --insert-before ...` with explicit anchors over plain `jj new`.

## When to Load References

- **workflows.md**: When user asks about daily operations, splitting changes, rebasing, or conflict resolution
- **git-to-jj.md**: When user asks "how do I do X in jj?" or needs git command translations
- **revsets.md**: When user needs to find specific changes or query history

Load references only when their content is needed for the current task.
