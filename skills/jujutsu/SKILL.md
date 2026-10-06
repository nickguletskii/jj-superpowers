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

Every `jj` command that can open an editor must be made non-interactive. Never run an interactive or editor-opening command — there is no "manual fallback" to fall back to.

| ❌ Opens editor | ✅ Non-interactive form |
|---|---|
| `jj describe` | `jj describe -m "message"` or `jj describe -r <id> -m "message"` |
| `jj new` | `jj new --no-edit -m "message" --insert-after X --insert-before Y` |
| `jj commit` | `jj commit -m "message"` |
| `jj squash -i` | `jj squash --from <id> --into <id> [files] -u` |
| `jj split` (no filesets) | File-level: `jj split -r <id> -m "message" <paths>` (non-interactive when filesets are given; never with `-i`/`--tool`) · hunk-level: `jj-hunk split` via the `jj-hunk` skill |
| `jj resolve` | `jj resolve --list` to inspect · `jj resolve --tool :ours\|:theirs [filesets] [-r <rev>]` to take side #1/#2 non-interactively · or edit conflict markers manually |
| `jj diffedit` | Not usable by agents — edit files directly |

Always add `--no-pager` to `jj log`, `jj diff`, `jj show`, and `jj op log`.

### 4. Distinguish "insert before `@`" from "create a sibling"

When separating part of `@` into a new change, decide the graph intent first:

- If `@` should still depend on the extracted change, insert the new change before `@`, then file content into it:
  - `jj new --no-edit -m "message" --insert-after @- --insert-before @`
  - `jj squash --from @ --into <new-change-id> path/to/file -u`
- If the user explicitly wants parallel siblings, use `jj-organizing-history` or another sibling-specific workflow.
- **Never** use `jj split -o @-` as a generic extraction shortcut. For `-r @`, that rewrites the selected content onto `@-` and leaves the remaining working-copy change as a sibling that no longer depends on the extracted change.

### 5. Verify graph shape after any history rewrite

Before any history-rewriting operation (split, squash, rebase, clean-history), snapshot the working-copy commit ID. Afterwards, diff the snapshot against the new `@` to confirm the visible file content is unchanged, and confirm the parent/ancestor relationship matches your intent.

```bash
# Step 1: capture working copy commit ID BEFORE rewriting
PRE_ID=$(jj log -r @ -T 'commit_id' --no-graph --no-pager)

# ... perform history-rewriting operations (jj-hunk split, jj rebase, etc.) ...

# Step 2: verify working copy content is unchanged AFTER rewriting
jj diff --from "$PRE_ID" --to "$(jj log -r @ -T 'commit_id' --no-graph --no-pager)" --no-pager
# Empty output = working copy content is identical ✓
# Any output = something unintentionally changed — use jj undo to recover

# Step 3: confirm the new graph shape is what you intended
jj log -r 'parents(@) | @' --no-graph --no-pager
```

Use this pattern before and after every `jj-hunk split` or other split-style rewrite, before and after `jj-organizing-history` or `jj rebase` runs, and any time the correctness of the working copy is uncertain after DAG manipulation.

### 6. Never run context-polluting or destructive commands blindly

- **No full diffs inline.** Do not run `jj show`, `jj diff`, or any command that emits full hunk content into the agent context — hand the command off to the user instead. **Exception:** bounded `--stat` summaries (e.g. `jj show -r <id> --stat --no-pager`, `jj diff --stat --no-pager`) are allowed — they list only changed files and line counts, not diff bodies.
- **No `jj abandon` / `jj op abandon` unless the user explicitly asked.** `jj abandon` can discard work, and `jj op abandon` compacts old history and is **not reversible**.
- **Never blind-`jj undo` / `jj op restore` to escape a state you don't understand.** They are safe recovery tools (see the recovery workflow below), but rolling back *without first reading `jj op log`* can discard good work. Inspect the op log first; surface to the user if the correct target is unclear.

See [workflows.md](references/workflows.md) for detailed non-interactive patterns.

### Red Flags - STOP

These are self-check thoughts that mean you are about to break a safety rule above. If you catch yourself thinking one, **stop before running the command** — surface to the user or use the safe alternative.

- "Let me `jj edit <old-change>` / `jj next` / `jj prev` real quick" → moves `@` (rule 2).
- "I'll `jj new` to start fresh here" → plain `jj new` moves `@`; use `jj new --no-edit --insert-after ... --insert-before ...` (rules 2, 4). **Only exception:** `children(@)` is non-empty, where plain `jj new` is the *required* way to make `@` a leaf before editing.
- "I'll `jj split -o @-` to extract this quickly" → leaves the remainder as a sibling (rule 4).
- "I'll just run `jj describe` / `jj squash -i` / `jj split` without filesets / *bare* `jj resolve` / `jj diffedit`" → opens an editor or interactive UI (rule 3). (`jj resolve --list` and `jj resolve --tool :ours|:theirs` are non-interactive and allowed.)
- "I'll drop to raw `git` for this one" → rule 1.
- "I'll run a full `jj show` / `jj diff` inline to check" → use the bounded `--stat` form or hand the command to the user (rule 6).
- "I'll just `jj abandon` / `jj op abandon` to clean this up", or "I'll blind-`jj undo` / `jj op restore` to escape this state" → rule 6.

## When This Skill Applies

Use jj when the repository uses jujutsu (a `.jj/` directory is present, or CLAUDE.md specifies jj), or when the user asks for it. **Once activated, use jj for ALL version control operations** — do not fall back to git.

```bash
test -d .jj && echo "Jujutsu repo" || echo "Not jj repo"
grep -i "jujutsu\|jj" CLAUDE.md
```

If it is not clearly a jj repo, ask the user before switching from git. If it is a jj repo but `CLAUDE.md` is missing or doesn't mention jj, run [Initial Repository Setup](#initial-repository-setup).

## Initial Repository Setup

Run when you detect a `.jj/` directory but `CLAUDE.md` is missing or doesn't mention jj/jujutsu, or when the user asks you to set up the repo for AI-assisted development. Collect repo context and write it to the root `CLAUDE.md` so future sessions have it.

```bash
# Confirm jj repo and get basic info
jj version
jj root

# Main branch / trunk detection
jj log -r 'trunk()' --no-graph --limit 1 --no-pager

# Current bookmarks
jj bookmark list

# Project language/framework
ls -1 Cargo.toml package.json pyproject.toml go.mod pom.xml build.gradle Makefile CMakeLists.txt 2>/dev/null

# Build/test commands (inspect the relevant config file)
# e.g. Rust: grep -A5 '\[scripts\]\|\[alias\]' Cargo.toml .cargo/config.toml 2>/dev/null
# e.g. Node: jq '.scripts' package.json 2>/dev/null

# Existing conventions (config/style files)
ls -1 .editorconfig .prettierrc* .eslintrc* rustfmt.toml .clang-format 2>/dev/null
```

Then create or update the root `CLAUDE.md`, adapting this template:

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

- **Don't overwrite existing content**: append or merge the jj section rather than replacing the file.
- **Be accurate**: only include what you confirmed from commands — don't guess at build commands or conventions.
- **Keep it concise**: a quick reference, not exhaustive documentation.
- **Ask when uncertain**: note undetectable items as `<not detected — ask user>` or ask the user.

## Core Mental Model

| Git (Commits) | Jujutsu (Changes) |
|---------------|------------------|
| Commits have hashes that change on rewrite | Changes have stable IDs that persist through rebases and rewrites |
| Staging area for selective commits | Working copy is a change, automatically amended as you edit (respects `.gitignore`) |
| HEAD points to current commit | `@` is the working copy change |
| Branches required for collaboration | Bookmarks optional, used for remote sync |

Every jj operation is logged in the operation log and is reversible via `jj undo`. Descendants rebase automatically.

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

# Fetch before rebasing
jj git fetch
jj rebase -o 'trunk()'
jj rebase -s <change> -o <base>
```

### Finding Your Changes

```bash
# All unmerged changes (using trunk() alias)
jj log -r 'trunk()..@' --no-pager

# Changes with bookmarks
jj log -r 'bookmarks() & ::@' --no-pager

# Your authored changes
jj log -r 'mine()' --no-pager
```

See [revsets.md](references/revsets.md) for powerful query syntax.

### Viewing Changes and Diffs

```bash
# Machine-parseable git-style diff (correct flags when a diff is genuinely needed)
jj diff --git --color=never --no-pager    # Current change vs parent

# Summary statistics — file change summary (which files, how many lines)
jj diff --stat --no-pager

# Diff between specific changes
jj diff --from <change-1> --to <change-2> --git --color=never --no-pager
```

Full-hunk diffs must not be run inline (safety rule 6) — prefer `--stat`, or hand the command to the user.

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

# Abandon change — destructive, only on explicit user request (safety rule 6)
jj abandon <change-id>

# Undo last operation
jj undo

# View operation history
jj op log --no-pager
```

### Common Non-Interactive File-Filing Patterns

Use these when working in `@` and filing specific work into a pre-planned destination change without opening an editor.

```bash
# Move all of @ into a destination change (keep the destination's description)
jj squash --from @ --into <rev> -u

# Move specific paths from @ into a destination change (leave other edits in @)
jj squash --from @ --into <rev> path/to/file1.rs path/to/file2.rs -u

# Update the destination's description (never opens editor)
jj describe -r <rev> -m "feat(auth): add login endpoint"

# Full pattern: write → file → mark done
# 1. Edit files in @
# 2. jj squash --from @ --into <rev> <paths> -u
# 3. jj describe -r <rev> -m "<semantic description>"
```

**Why `-u` matters**: `-u` / `--use-destination-message` keeps the **destination** change's description and discards the source's. The destination is typically already described (e.g. `feat(auth): add login endpoint`) while `@` holds only a scratch message; without `-u`, squashing a described `@` into a described destination prompts for a combined message. `-u` does **not** affect whether `@` survives — squashing all content out of `@` never loses work, because `jj` always replaces an emptied `@` with a fresh empty change as the new tip.

### Operation Log and Recovery

```bash
# View the operation log (most recent first)
jj op log --no-pager
jj op log --no-pager --limit 5

# Show what changed in a specific operation
jj op show <operation_id>

# Show diff of changes introduced by an operation
jj op diff --operation <operation_id>

# Undo the most recent operation; repeating jj undo walks further back.
# jj redo reverses the most recent undo.
jj undo
jj redo

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

`jj op restore` and `jj undo` are safe — they create new operations rather than destroying history.

## Reference Documentation

Load these only when their content is needed for the current task:

- **[workflows.md](references/workflows.md)** — daily workflows, splitting, rebasing, conflict resolution
- **[git-to-jj.md](references/git-to-jj.md)** — git command mappings and migration guide ("how do I do X in jj?")
- **[revsets.md](references/revsets.md)** — revset query language for finding and filtering changes
