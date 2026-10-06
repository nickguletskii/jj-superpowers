# Core Jujutsu Workflows

> **Non-interactive only.** Never run a command that opens an editor or interactive UI: `jj describe`/`jj commit` without `-m`, `jj split`, `jj squash -i`, `jj diffedit`, or bare `jj resolve`. `jj edit`, `jj next`, `jj prev`, and plain `jj new` reassign `@` and are forbidden (safety rule 2) except the sanctioned leaf-making `jj new`. Always add `--no-pager` to `jj log` / `jj diff` / `jj show` / `jj op log`.
> See [SKILL.md](../SKILL.md) for the full safety rules and non-interactive forms.

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

Plain `jj new` and `jj commit` move `@`. Default to *describing in place* (`jj describe -m`) and filing work into pre-planned changes via `jj squash`; reach for `jj new`/`jj commit` only when intentionally starting a fresh leaf (the one sanctioned plain-`jj new` case is making `@` a leaf — see §1b and safety rule 2 in [SKILL.md](../SKILL.md)).

### 1b. Creating and Inserting Changes with `jj new`

`jj new` creates a new empty change. **By default it moves `@` onto the new change** — that is forbidden (safety rule 2) *except* the one sanctioned case below. Use `--no-edit` to create or insert a change **without** moving `@`.

| Goal | Command | Moves `@`? |
|------|---------|-----------|
| **Make `@` a leaf** when it has descendants (the one sanctioned `@`-move) | `jj new` | yes → new empty leaf |
| Insert a predecessor before `@` (so `@` keeps depending on it) | `jj new --no-edit -m "msg" --insert-after @- --insert-before @` | no |
| Insert a change **after** a target (the target's children rebase onto the new change) | `jj new --no-edit -m "msg" --insert-after <target>` | no |
| Insert a change **before** a target (target + descendants rebase onto the new change) | `jj new --no-edit -m "msg" --insert-before <target>` | no |
| Create a child of a specific change | `jj new --no-edit -m "msg" <parent>` | no |
| Create a merge change (multiple parents) | `jj new --no-edit -m "msg" <parentA> <parentB>` | no |

Notes:
- `--insert-after`/`-A` and `--insert-before`/`-B` can be combined to splice a change between two specific points; jj rebases the affected descendants automatically.
- `--no-edit` is what keeps `@` in place — it is the opposite of the leaf-making case, where you *want* `@` to move onto the new empty change.
- After inserting, file content into the new change with `jj squash --from @ --into <new-id> <paths> -u` (see §5).
- Predecessor vs sibling: insert **before `@`** when `@` should keep depending on the extracted change; only create siblings when the user explicitly wants parallel changes (safety rule 4 in [SKILL.md](../SKILL.md)).

**Forbidden:** `jj new -m ...` then `jj next --edit` to walk a stack — these reassign `@` (safety rule 2). Use the `--no-edit` insert forms above instead.

### 2. Splitting Unrelated Changes

When you have multiple unrelated changes in the working copy, never run `jj split` (it opens an interactive diff editor) — use the `jj-hunk` skill for hunk-level splits, or one of these graph-aware patterns. Choose based on the graph you want.

1. **`@` should keep depending on the extracted change**

```bash
# Insert a new predecessor before @
jj new --no-edit -m "Refactor: extracted piece" --insert-after @- --insert-before @
# note the new change ID from command output, then file content from @ into it
jj squash --from @ --into <new-change-id> path/to/file1 path/to/file2 -u
```

2. **The user explicitly wants parallel siblings**

Use `jj-organizing-history` or another sibling-specific workflow. Do not use a sibling-creating rewrite when the working copy should continue to depend on the extracted change.

3. **After any rewrite, verify both content and graph**

```bash
BEFORE=$(jj log -r @ -T 'commit_id ++ "\n"' --no-graph --no-pager)
# ... split/rewrite ...
jj diff --from "$BEFORE" --to @ --no-pager
jj log -r 'parents(@) | @' --no-graph --no-pager
```

### 3. Navigating Your Changes

Understanding where you are:

```bash
# See recent changes
jj log --no-pager

# See your working copy and recent changes
jj log -r 'ancestors(@, 5)' --no-pager

# See all changes not yet pushed
jj log -r 'trunk()..@' --no-pager

# See a file-change summary for the working copy (bounded — full diffs pollute context)
jj diff --stat --no-pager

# See a summary of a specific change
jj show <change-id> --stat --no-pager
```

`jj next`, `jj prev`, and their `--edit` forms reassign `@` and are forbidden (safety rule 2). To understand where you are, read `jj log --no-pager`, not by moving `@`.

### 4. Amending Changes

The working copy is always amendable:

```bash
# Edit working copy (current change)
vim src/fix.rs
# Automatically amended! Just describe again if needed
jj describe -m "Updated description"
```

To amend a *different* change without moving `@`, edit in `@` and file the edits into the target with `-u` — don't `jj edit` onto it (that reassigns `@`, safety rule 2):

```bash
vim src/fix.rs
jj squash --from @ --into <change-id> src/fix.rs -u
```

### 5. Moving Changes Around

Reorganize change hunks:

```bash
# Move entire working copy into parent (keep the parent's description)
jj squash -u

# Squash into a specific ancestor (keep the destination's description)
jj squash --into <change-id> -u

# Absorb: automatically redistribute working copy edits to the
# appropriate ancestor commits (based on which lines they modify)
jj absorb
```

For hunk-level moves (instead of `jj squash -i`) use the `jj-hunk` skill. To change an existing commit's contents (instead of `jj diffedit`), edit files in `@` and `jj squash` them into the target with `-u`.

**Non-interactive file-filing from `@` into a named destination** (preferred in agentic workflows):

```bash
# Move all of @ into a destination, keeping the destination's description
jj squash --from @ --into <change-id> -u

# Move only specific paths, leave unrelated edits in @
jj squash --from @ --into <change-id> path/to/file1.rs path/to/file2.rs -u

# Update the destination description without opening an editor
jj describe -r <change-id> -m "feat(auth): add login endpoint"
```

`-u` (`--use-destination-message`) keeps the destination change's description and drops the source's, so filing a scratch `@` into a pre-described destination stays non-interactive instead of prompting for a combined message. It does not control `@`'s survival: squashing all content out of `@` never loses work, because `jj` auto-creates a fresh empty `@` as the new tip.

### 6. Rebasing and Updating

`jj rebase` moves revisions to new parents. Choose **which** revisions and **where** they go.

**Which revisions:**
- `-s <rev>` / `--source` — the revision **and its descendants**
- `-b <rev>` / `--branch` — the whole branch containing `<rev>` (relative to the destination)
- `-r <rev>` / `--revisions` — exactly the named revision(s), **without** descendants

**Where:**
- `-o <target>` / `--onto` — onto the target(s)
- `-A <target>` / `--insert-after` — onto the target, and rebase the target's descendants onto the moved revisions
- `-B <target>` / `--insert-before` — onto the target's parents, and rebase the target (and descendants) onto the moved revisions

```bash
# Fetch, then rebase the current change onto the latest trunk
jj git fetch
jj rebase -o 'trunk()'

# Rebase a change and its descendants onto a new base
jj rebase -s <change> -o <base>

# Rebase the whole stack of unmerged work onto trunk
jj rebase -s 'all:roots(trunk()..@)' -o 'trunk()'

# Move a single revision (no descendants) to sit after another change
jj rebase -r <change> --insert-after <target>

# Drop changes that became empty after the rebase
jj rebase -s <change> -o <base> --skip-emptied
```

**Conflicts are first-class:** a rebase never blocks on conflicts — it records them in the rebased changes for you to resolve later (see §7).

**Workspace safety:** rebasing rewrites the targeted revisions *and* rebases their descendants. If any rewritten or rebased change is another workspace's working copy (or an ancestor of it), that workspace is rewritten out from under it. Don't rebase changes other workspaces depend on without coordinating — and make your own `@` a leaf first if it has descendants (safety rule 2 exception in [SKILL.md](../SKILL.md)).

**Verify after rewriting:** snapshot `@`'s commit id before, and confirm content is unchanged after — see safety rule 5, "Verify graph shape after any history rewrite", in [SKILL.md](../SKILL.md).

### 7. Conflict Resolution

Jujutsu represents conflicts as first-class objects. Conflicts can be committed and resolved later.

```bash
# If conflicts appear after rebase/merge
jj st                    # Shows conflicted files

# Edit files with conflict markers manually
# jj uses two conflict marker styles:
#   <<<<<<< (snapshot markers, like git)
#   %%%%%%% (diff markers, showing what changed)
#   +++++++ (snapshot of one side)
#   >>>>>>> (end)
vim <conflicted-file>

# Once markers are removed, file is auto-resolved
jj diff --stat --no-pager   # Verify resolution
jj describe -m "Resolve conflicts with upstream"
```

**Non-interactive resolution:**

```bash
# List conflicted paths (inspection only)
jj resolve --list

# Take an entire side of every conflict (or scope to paths / a revision):
jj resolve --tool :ours              # side #1 ("left")
jj resolve --tool :theirs            # side #2 ("right")
jj resolve --tool :theirs path/to/file -r <rev>
```

`--tool :ours`/`:theirs` only work for conflicts resolvable by a 3-way merge, and they pick the **entire side per file** — a blunt instrument. **Which side is #1 vs #2 depends on the operation** (e.g. rebase vs merge), so inspect with `jj resolve --list` and the diff before bulk-applying. For anything nuanced, edit the conflict markers manually (above). Bare `jj resolve` (no `--tool`) opens an external merge tool and is **not** usable by agents.

**Key difference from git**: Conflicts don't block operations. You can rebase, commit, and even push conflicted changes, resolving them when ready.

## Advanced Patterns

### Inserting a Change in History

To create a change between existing changes **without moving `@`**, use the `--insert-after`/`--insert-before` forms from §1b:

```bash
# Insert a predecessor before @ (so @ keeps depending on it), without moving @
jj new --no-edit -m "Insert this change before current" --insert-after @- --insert-before @
# then file content into the new change:
jj squash --from @ --into <new-id> <paths> -u

# Splice a change between two specific points (descendants rebase automatically)
jj new --no-edit -m "Inserted change" --insert-after <parent> --insert-before <child>
```

Forbidden (move `@`): `jj new -B @` or `jj new <parent>` then `jj rebase`. Use the `--no-edit` forms above.

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
jj op log --no-pager

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

# Squash changes back into the appropriate branch (keep the destination's description)
jj squash --into <branch-change-id> -u
```

### Using Workspaces

Workspaces let you attach multiple working copies to the same repository, to switch contexts without disturbing current work.

```bash
# Create a new workspace
# By default creates a sibling of the current working copy
jj workspace add ../temp-workspace

# Create a workspace at a specific revision
jj workspace add ../fix-bug -r main

# Work in the new workspace
cd ../temp-workspace
# (Edit files, create changes, run tests)

# Changes made here are visible in the main repo!
jj log --no-pager

# When done, remove the workspace
jj workspace forget
rm -rf ../temp-workspace
```

**Note:** Deleting the workspace directory without `jj workspace forget` leaves a stale workspace entry. Use `jj workspace list` to see them.

**Safety — don't rewrite changes other workspaces depend on.** Workspaces share one repo, but each has its own `@`. Any operation that **rewrites a change** — auto-amend (just editing files), `jj squash --into`, `jj rebase`, `jj describe -r`, abandon — also rebases that change's descendants. If a rewritten change *is* another workspace's `@`, or an *ancestor* of it, that workspace gets rewritten out from under it (it goes stale and may gain conflicts). So:

- Before editing in a workspace, make your `@` a leaf if it has descendants: `jj log -r 'children(@)'` non-empty → `jj new` (safety rule 2 exception in [SKILL.md](../SKILL.md)).
- Don't `jj squash`/`jj rebase`/`jj describe -r` into a change another workspace has checked out (or its ancestors) without coordinating.
- `jj workspace list` shows each workspace and its working-copy change.

## Workflow Tips

1. **Commit early, commit often**: Since changes are amendable and the working copy is a commit, there's no penalty for frequent commits
2. **Use `jj commit -m`**: Shorthand for `jj describe -m` + `jj new` (advances `@`); never bare `jj commit`, which opens an editor
3. **Use descriptive change IDs**: They're stable across rewrites
4. **Split liberally**: It's easier to split changes than combine them
5. **Try `jj absorb`**: Automatically sends working copy edits to the right ancestor commits
6. **Check status frequently**: `jj st` and `jj log` help you understand state
7. **Trust the operation log**: Every action is tracked and reversible
8. **Use `trunk()`**: Built-in alias that auto-detects your main branch
