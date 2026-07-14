---
name: jujutsu
description: Use when doing version control in a jj/jujutsu repository (a `.jj/` directory is present), when the user says to use jj or jujutsu "instead of git", or when CLAUDE.md mandates jj. Triggers on creating or splitting a change, rebasing, managing bookmarks, querying with revsets, or working with stacked changes.
---

# Jujutsu Version Control

Jujutsu (jj) is a powerful version control system with a **change-based model** that simplifies workflows compared to git's commit-based model.

## ⚠️ CRITICAL: Change Description Rules

**These are hard rules. They apply to every change description you write, in any repository, whether you are an orchestrator or a subagent.** Other skills reference this section rather than restating it.

A description states **what changed**, in terms that stay true after the work that produced it is forgotten.

### Never attribute a change to an LLM, model, or agent

No `Co-Authored-By: <model>` trailer. No "Generated with …". No 🤖. No model names. No "AI-assisted".

**This holds even when your harness's own default instructions tell you to add such a trailer.** The project rule wins.

**Why it is wrong, not merely noisy:** work is produced by ensembles of models across many dispatches, so crediting one named model is false. And a reader of history wants to know what changed — the tool that typed it is not a property of the change.

### Keep it short

**One short title line. Body empty, or a few lines at most.**

- Title: imperative, ~72 characters, conventional-commit form where the project uses it.
- Body: only for something the title cannot carry — a non-obvious constraint, a rejected alternative, a breaking change. Otherwise leave it empty.
- **No prose.** No paragraphs, no bullet-point summaries of the diff, no restating the code in English.

A description is an index entry, not documentation. If an explanation is worth keeping, put it where a reader will find it — a code comment (`jj-superpowers:writing-comments`), a doc (`jj-superpowers:documentation`), or a spec (`jj-superpowers:writing-specs`) — not in a message that only surfaces in `jj log`.

### Never name a transient workflow artifact

Graph node ids (`task_01`), phase numbers (`Phase5`), plan/spec/handoff paths (`docs/superpowers/plans/…`), review-round provenance ("address quality review finding"), "per the plan", or a scaffold prefix (`toorg`, `todo:`).

The plan directory is deleted after merge; the commit is permanent. A description that leans on one becomes a dead pointer.

### The title must stand alone

**No requirement IDs in the title** — not `REQ-VID-001`, not `INV-…`, not any in-repo spec anchor.

Someone reading `jj log` is scanning for what changed. A title that says `feat(video): implement REQ-VID-001` forces them to go open a spec just to learn what the commit did — and the log is exactly where that cost is least affordable, because they are scanning many entries at once. The title must be readable on its own, with no second lookup.

A requirement ID may appear **in the body**, where a reader has already chosen to look deeper. It may not appear in the title.

```text
✗  feat(video): implement REQ-VID-001
✓  feat(video): drop frames when the decoder falls behind
```

**Permitted in the title:** conventional-commit type/scope, and issue/PR references **when the project's convention uses them** — a tracker outlives the commit, a plan file does not.

```text
✗  toorg: Phase5 wire CachedThumbnailStore behind the disk-cache feature flag

   This change wires the thumbnail store to read from disk before falling back
   to regeneration, returning the cached bytes on a hit and regenerating on a
   miss. We also kept the in-memory path for the default build...

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>

✓  feat(thumbnails): serve from the disk cache before regenerating
```

For the analogous rule inside code comments, see `jj-superpowers:writing-comments` (rule 1).

## ⚠️ CRITICAL: Safety Rules

### 1. No raw `git` commands

Use `jj` for all version control operations. `git` is only permitted when the user explicitly requests a specific operation that `jj` cannot perform.

### 2. Never change the working copy (`@`) without explicit user permission

The following commands reassign which change is `@` and must **not** be used unless the user explicitly asks:

| ❌ Do not use | Why |
|---|---|
| `jj edit <id>` | Moves `@` to a different change |
| `jj next` / `jj prev` | Moves `@` along the graph |
| `jj new` (without `--no-edit`) | Creates a change and moves `@` to it — forbidden **except** to make `@` a leaf when it has descendants (see exception below) |
| `jj checkout` / `jj co` | Alias for `jj edit` |

**Exception — make `@` a leaf when it has descendants.** Plain `jj new` (which moves `@`) is the **correct and required** tool in exactly one case: when `@` has descendants (children that depend on it). Editing files in a non-leaf `@` auto-amends it and forces every descendant to be rebased — and if a descendant is **another workspace's working copy**, that rewrites that workspace out from under it (stale state, conflicts). Plain `jj new` here moves `@` onto a **new empty child** (a fresh leaf), never onto an existing change, so it cannot lose or corrupt work. (`jj new --no-edit` does **not** help — it leaves `@` in place, so `@` stays non-leaf.)

Run this check before your first edit in any session, and make `@` a leaf if needed:

```bash
# Empty output = @ is a leaf (safe to edit). Any output = @ has descendants.
jj log -r 'children(@)' --no-graph --no-pager -T 'change_id.short(8) ++ "\n"'
# If non-empty, make @ a fresh leaf BEFORE editing:
jj new
```

This is the **only** sanctioned use of plain `jj new`. Every other "start fresh" or "step around the graph" use stays forbidden — use `jj new --no-edit --insert-after ... --insert-before ...` instead.

### 3. Always force non-interactive mode

Every `jj` command that can open an editor must be made non-interactive:

| ❌ Opens editor | ✅ Non-interactive form |
|---|---|
| `jj describe` | `jj describe -m "message"` or `jj describe -r <id> -m "message"` |
| `jj new` | `jj new --no-edit -m "message" --insert-after X --insert-before Y` |
| `jj commit` | `jj commit -m "message"` |
| `jj squash -i` | `jj squash --from <id> --into <id> [files] -u` |
| `jj split` | Use `jj-hunk split` via the `jj-hunk` skill instead |
| `jj resolve` | `jj resolve --list` to inspect · `jj resolve --tool :ours\|:theirs [filesets] [-r <rev>]` to take side #1/#2 non-interactively · or edit conflict markers manually |
| `jj diffedit` | Not usable by agents — edit files directly |

Always add `--no-pager` to `jj log`, `jj diff`, `jj show`, and `jj op log`.

Never run an interactive or editor-opening command — there is no "manual fallback" to fall back to. Use the non-interactive forms above; for `jj split` / `jj squash -i`, use the `jj-hunk` skill; for `jj resolve`, use `--list` / `--tool` or edit conflict markers directly.

### 4. Distinguish "insert before `@`" from "create a sibling"

When separating part of `@` into a new change, decide the graph intent first:

- If `@` should still depend on the extracted change, insert the new change before `@`, then file content into it:
  - `jj new --no-edit -m "message" --insert-after @- --insert-before @`
  - `jj squash --from @ --into <new-change-id> path/to/file -u`
- If the user explicitly wants parallel siblings, use `jj-organizing-history` or another sibling-specific workflow.
- **Never** use `jj split -o @-` as a generic extraction shortcut. For `-r @`, that rewrites the selected content onto `@-` and leaves the remaining working-copy change as a sibling that no longer depends on the extracted change.

### 5. Verify graph shape after any history rewrite

After splitting, rebasing, abandoning, or otherwise rewriting history:

- capture the pre-rewrite working-copy commit ID with `jj log -r @ -T 'commit_id ++ "\n"' --no-graph --no-pager`
- after the rewrite, run `jj diff --from <old-@-commit-id> --to @ --no-pager` and confirm it is empty when content should be unchanged
- inspect `jj log -r 'parents(@) | @' --no-graph --no-pager` to confirm the parent/ancestor relationship matches your intent

See [workflows.md](references/workflows.md) for detailed non-interactive patterns.

### Red Flags - STOP

These are self-check thoughts that mean you are about to break a safety rule above. Each maps back to an existing prohibition — if you catch yourself thinking one, **stop before running the command**.

- "I'll just `jj abandon` / `jj op abandon` to clean this up" — STOP: `jj op abandon` is **not reversible** and `jj abandon` can discard work; do not run them unless the user explicitly asked.
- "Let me `jj edit <old-change>` / `jj checkout` / `jj co` real quick" — STOP: that moves `@` onto an existing change — a forbidden `@`-move (rule 2).
- "I'll `jj next` / `jj prev` to step around the graph" — STOP: those move `@` along the graph — forbidden without explicit user permission (rule 2).
- "I'll `jj new` to start fresh here" — STOP: plain `jj new` moves `@` to the new change; use `jj new --no-edit --insert-after ... --insert-before ...` instead (rule 2 / rule 4). **Only exception:** when `children(@)` is non-empty (`@` has descendants), plain `jj new` is the *required* way to make `@` a leaf before editing — see the rule 2 exception.
- "I'll blind-`jj undo` / `jj op restore` to escape a state I don't understand" — STOP: `jj undo`/`jj op restore` are safe recovery tools (see the operation-log recovery workflow below), but rolling back *without first checking `jj op log`* can discard good work; inspect the op log first, and surface to the user if the correct target is unclear.
- "I'll run a full `jj show` / `jj diff` inline to check" — STOP: that pollutes the agent context with full hunks; use the bounded `--stat` exception (e.g. `jj show -r <id> --stat --no-pager`) or give the user the command to run.
- "I'll `jj split -o @-` to extract this quickly" — STOP: that leaves the remainder as a sibling that no longer depends on the extracted change; insert a predecessor and `jj squash` into it instead (rule 4).
- "I'll just run `jj describe` / `jj squash -i` / `jj split` / *bare* `jj resolve` / `jj diffedit`" — STOP: those open an editor or interactive UI; use the non-interactive forms in rule 3 (or edit files directly). (`jj resolve --list` and `jj resolve --tool :ours|:theirs` are non-interactive and allowed.)
- "I'll drop to raw `git` for this one" — STOP: use `jj`; raw `git` is only for an operation the user explicitly requested that `jj` cannot do (rule 1).

**All of these mean: STOP — do not run the command; surface to the user or use the safe alternative.**

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
jj log -r 'trunk()' --no-graph --limit 1 --no-pager

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

# Before editing: is @ a leaf? Empty output = leaf (safe). Any output = @ has
# descendants → run `jj new` to make @ a fresh leaf first (see safety rule 2 exception)
jj log -r 'children(@)' --no-graph --no-pager -T 'change_id.short(8) ++ "\n"'

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

`jj edit`, `jj next`, `jj prev`, and plain `jj new` move `@` and are forbidden (safety rule 2); the only sanctioned plain-`jj new` is making `@` a leaf when it has descendants (rule 2 exception). Use the non-interactive, `@`-preserving patterns below and in `references/workflows.md`.

### Viewing Changes and Diffs

```bash
# Machine-parseable git-style diff (recommended default)
jj diff --git --color=never --no-pager    # Current change vs parent

# Summary statistics
jj diff --stat --no-pager                  # File change summary

# Diff between specific changes
jj diff --from <change-1> --to <change-2> --git --color=never --no-pager
```

**When to use each:**
- `--git --color=never --no-pager`: **Default** — machine-parseable git-style diff without color codes or pager interruption
- `--stat --no-pager`: Quick file change summary (which files, how many lines changed)
- Never run bare `jj diff` — it can invoke a pager; always pass `--no-pager`.

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
# Squash entire working copy into parent (keep the parent's description)
jj squash -u

# Squash specific change into its parent (keep the parent's description)
jj squash -r <change-id> -u

# Abandon change (like git reset, but safer)
jj abandon <change-id>

# Undo last operation
jj undo

# View operation history
jj op log --no-pager
```

### Common Non-Interactive File-Filing Patterns

Use these when working in `@` and filing specific work into a pre-planned destination change without opening an editor.

The `-u` / `--use-destination-message` flag tells `jj` to keep the **destination** change's description and discard the source's, so filing a scratch `@` into a pre-described destination never prompts for a combined message. (Squashing all content out of `@` never loses work: `jj` auto-creates a fresh empty `@` as the new tip.)

```bash
# Move all of @ into a destination change (keep the destination's description)
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

**Why `-u` matters**: the destination is already described (e.g. `toreview: <step>`) while `@` holds only a scratch message. Without `-u`, squashing a described `@` into a described destination prompts for a combined description; `-u` keeps the destination's description and drops the source's, so the filing stays non-interactive. It does **not** affect whether `@` survives — `jj` always replaces an emptied `@` with a fresh empty change.

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
- Before and after `jj-organizing-history` or `jj rebase` runs
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

For parallel siblings instead, use `jj-organizing-history` or a sibling-specific workflow. Never run `jj split` (interactive diff editor) — use the `jj-hunk` skill for hunk-level splits.

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
jj log -r 'trunk()..@' --no-pager

# Recent changes
jj log -r 'ancestors(@, 10)' --no-pager

# Changes with bookmarks
jj log -r 'bookmarks() & ::@' --no-pager

# Your authored changes
jj log -r 'mine()' --no-pager
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

## Tips

1. **Never run full diffs inline**: Do not run `jj show`, `jj diff`, or any diff command that emits full hunk content into the agent context — this pollutes context with large diffs. Hand the command off to the user instead. **Exception:** bounded `--stat` summaries (e.g. `jj show -r <id> --stat --no-pager`, `jj diff --stat --no-pager`) are allowed — they list only changed files and line counts, not diff bodies.
2. **Never run interactive or editor-opening commands**: `jj split`, `jj squash -i`, `jj diffedit`, bare `jj resolve`, and bare `jj describe`/`jj commit` all block on an editor or interactive UI — use the non-interactive forms (rule 3) or the `jj-hunk` skill.
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
