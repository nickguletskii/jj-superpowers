# Core Jujutsu Workflows

> **Note for AI agents**: Some commands below (marked "interactive") require user interaction.
> See [SKILL.md](../SKILL.md#-critical-non-interactive-commands-only) for non-interactive alternatives.

## Mental Model: Changes, Not Commits

Jujutsu uses a **change-based model** instead of git's commit-based model:

- **Changes** have stable change IDs that persist across rewrites
- The **working copy itself is a commit** that's automatically amended
- **No staging area** - files are tracked automatically (respects `.gitignore`)
- **Operation log** tracks all repository changes and enables undo

## Daily Workflow Pattern

### 1. Creating Atomic Changes (Squash Workflow)

The most common workflow: edit in the working copy, describe, move on.

```bash
# Edit files as needed
vim src/feature.rs

# The working copy automatically includes changes (no staging!)
jj st                    # See what changed

# Describe the change
jj describe -m "Add feature X implementation"

# Create a new change for the next task
jj new                   # Working copy is now a fresh change

# Or use the shorthand:
jj commit -m "Add feature X implementation"  # describe + new
```

**Key insight**: Unlike git, you describe AFTER editing, not before.

### 1b. The Edit Workflow (Insert Changes in History)

When you want to build up a stack of named changes as you go:

```bash
# Create a new change with a description first
jj new -m "Feature: Add validation logic"

# Edit files for this change
vim src/validation.rs

# Insert a new change BEFORE the current one (between parent and @)
jj new -B @ -m "Refactor: Extract helper function"

# Edit files for the inserted change
vim src/helpers.rs

# Move forward to the next change in the stack
jj next --edit
```

### 2. Splitting Unrelated Changes

When you have multiple unrelated changes in the working copy:

```bash
# Interactively split the current change (interactive - for manual use)
jj split

# In the diff editor:
# - Expand files to see hunks
# - Select hunks to keep in the FIRST change
# - Unselected hunks go to the SECOND change
# - Confirm with 'c'

# Describe each change separately
jj describe -m "Fix bug in parser"
jj new
jj describe -m "Add logging to processor"
```

**Non-interactive alternative** (for AI agents): Use `jj new` + `jj restore` — create a sibling change, copy the target files into it, then revert them from the original.

### 3. Navigating Your Changes

Understanding where you are:

```bash
# See recent changes
jj log                   # Default log view

# See your working copy and recent changes
jj log -r 'ancestors(@, 5)'

# See all changes not yet pushed
jj log -r 'trunk()..@'

# See uncommitted changes in working copy
jj diff

# See specific change
jj show <change-id>

# Navigate the change stack
jj next                  # Move to child change (creates new @ on top)
jj prev                  # Move to parent change
jj next --edit           # Move to child and set as working copy
jj prev --edit           # Move to parent and set as working copy
```

### 4. Amending Changes

The working copy is always amendable:

```bash
# Edit working copy (current change)
vim src/fix.rs
# Automatically amended! Just describe again if needed
jj describe -m "Updated description"

# Amend a different change (not working copy)
jj edit <change-id>      # Set as working copy
vim src/fix.rs
jj describe -m "Fix typo"
jj new                   # Create new working copy
```

### 5. Moving Changes Around

Reorganize change hunks:

```bash
# Interactively move hunks from working copy to parent (interactive)
jj squash -i

# Move entire working copy into parent (non-interactive)
jj squash

# Squash into a specific ancestor (non-interactive)
jj squash --into <change-id>

# Absorb: automatically redistribute working copy edits to the
# appropriate ancestor commits (based on which lines they modify)
jj absorb

# Edit any commit's contents directly (interactive)
jj diffedit -r <change-id>
```

### 6. Rebasing and Updating

When remote changes appear:

```bash
# Fetch latest
jj git fetch

# Rebase current changes onto updated main branch
jj rebase -o trunk()

# Or rebase onto specific change
jj rebase -o <change-id>

# Rebase all branches in your stack simultaneously
jj rebase -s 'all:roots(trunk()..@)' -o trunk()
```

### 7. Conflict Resolution

Jujutsu represents conflicts as first-class objects. Conflicts can be committed and resolved later.

```bash
# If conflicts appear after rebase/merge
jj st                    # Shows conflicted files

# Resolve interactively (interactive - for manual use)
jj resolve

# Or edit files with conflict markers manually
# jj uses two conflict marker styles:
#   <<<<<<< (snapshot markers, like git)
#   %%%%%%% (diff markers, showing what changed)
#   +++++++ (snapshot of one side)
#   >>>>>>> (end)
vim <conflicted-file>

# Once markers are removed, file is auto-resolved
jj diff                 # Verify resolution
jj describe -m "Resolve conflicts with upstream"
```

**Key difference from git**: Conflicts don't block operations. You can rebase, commit, and even push conflicted changes, resolving them when ready.

## Advanced Patterns

### Inserting a Change in History

Create a change between existing changes:

```bash
# Insert a new change BEFORE the current working copy
jj new -B @
vim src/file.rs
jj describe -m "Insert this change before current"
# Descendants are automatically rebased!

# Or: Create new change as child of specific change, then rebase descendants
jj new <parent-change-id>
vim src/file.rs
jj describe -m "Insert this change in history"
jj rebase -s <child-change-id> -o @
```

### Duplicating Changes

Work with the same change in multiple places:

```bash
# Duplicate a change
jj duplicate <change-id>

# Creates a new change with same content but different change ID
```

### Abandoning Changes

Remove changes you don't want:

```bash
# Abandon (like git reset, but safer)
jj abandon <change-id>

# Descendants are rebased onto the abandoned change's parent
```

### Undoing Operations

Made a mistake? The operation log has you covered:

```bash
# See operation history
jj op log

# Undo last operation
jj undo

# Restore to specific operation
jj op restore <operation-id>
```

### Reverting Changes

Create a change that cancels out a previous change:

```bash
# Revert a change (creates inverse change before @)
jj revert -r <change-id> -B @
```

### Working on Multiple Branches Simultaneously

You can create a merge change to work on all branches at once:

```bash
# Create a merge working copy with multiple parents
jj new branch1 branch2 branch3

# Edit files - changes apply to the merge commit
vim src/shared.rs

# Squash changes back into the appropriate branch
jj squash --into <branch-change-id>
```

### Using Workspaces

Workspaces allow you to have multiple working copies attached to the same repository. This is perfect for AI agents or when you need to switch contexts without disturbing your current work.

```bash
# Create a new workspace (e.g., for an AI agent)
# By default creates a sibling of the current working copy
jj workspace add ../temp-workspace

# Create a workspace at a specific revision
jj workspace add ../fix-bug -r main

# Work in the new workspace
cd ../temp-workspace
# (Edit files, create changes, run tests)

# Changes made here are visible in the main repo!
jj log

# When done, remove the workspace
jj workspace forget
rm -rf ../temp-workspace
```

**Note:** Deleting the workspace directory without `jj workspace forget` leaves a stale workspace entry. Use `jj workspace list` to see them.

## Workflow Tips

1. **Commit early, commit often**: Since changes are amendable and the working copy is a commit, there's no penalty for frequent commits
2. **Use `jj commit`**: Shorthand for `jj describe` + `jj new` -- familiar to git users
3. **Use descriptive change IDs**: They're stable across rewrites
4. **Split liberally**: It's easier to split changes than combine them
5. **Try `jj absorb`**: Automatically sends working copy edits to the right ancestor commits
6. **Check status frequently**: `jj st` and `jj log` help you understand state
7. **Trust the operation log**: Every action is tracked and reversible
8. **Use `trunk()`**: Built-in alias that auto-detects your main branch
