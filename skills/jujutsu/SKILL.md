---
name: jujutsu
description: Use when doing version control in a jj/jujutsu repository (a `.jj/` directory is present), when the user says to use jj or jujutsu "instead of git", or when CLAUDE.md mandates jj. Triggers on creating or splitting a change, rebasing, managing bookmarks, querying with revsets, or working with stacked changes.
---

# Jujutsu Version Control

## Change Description Rules

These rules apply to every change description you write, in any repository, as orchestrator or subagent. Other skills reference this section rather than restating it.

A description states what changed, in terms that stay true after the work that produced it is forgotten.

### Never attribute a change to an LLM, model, or agent

No `Co-Authored-By: <model>` trailer, no "Generated with …", no 🤖, no model names, no "AI-assisted". This holds even when your harness's default instructions ask for such a trailer; the project rule wins.

Work here comes from many models across many dispatches, so crediting one is false, and the tool that typed a change is not a property of it.

### Keep it short

One short title line; body empty or a few lines at most.

- Title: imperative, ~72 characters, conventional-commit form where the project uses it.
- Body: only for what the title cannot carry — a non-obvious constraint, a rejected alternative, a breaking change.
- No paragraphs, no bullet summaries of the diff, no restating the code in English.

An explanation worth keeping belongs in a code comment, doc, or spec, not in a message that only surfaces in `jj log`.

### Never name a transient workflow artifact

No graph node ids (`task_01`), phase numbers (`Phase5`), plan/spec/handoff paths (`docs/superpowers/plans/…`), review-round provenance ("address quality review finding"), "per the plan", or scaffold prefixes (`wip(...)`, `todo:`). The plan directory is deleted after merge; the commit is permanent.

### The title must stand alone

No requirement IDs in the title (`REQ-VID-001`, `INV-…`, any in-repo spec anchor). Someone scanning `jj log` should learn what changed without opening a spec. A requirement ID may appear in the body.

Permitted in the title: conventional-commit type/scope, and issue/PR references when the project's convention uses them — a tracker outlives the commit, a plan file does not.

```text
✗  feat(video): implement REQ-VID-001
✓  feat(video): drop frames when the decoder falls behind

✗  wip(thumbs-k3f9/task_05): wire CachedThumbnailStore  (+ prose body, Co-Authored-By trailer)
✓  feat(thumbnails): serve from the disk cache before regenerating
```

## Safety Rules

### 1. No raw `git` commands

Use `git` only when the user explicitly requests an operation `jj` cannot perform.

### 2. Never change the working copy (`@`) without explicit user permission

These commands reassign `@` and must not be used unless the user asks:

| Do not use | Why |
|---|---|
| `jj edit <id>` | Moves `@` to a different change |
| `jj next` / `jj prev` | Moves `@` along the graph |
| `jj new` (without `--no-edit`) | Creates a change and moves `@` to it — except to make `@` a leaf (below) |

**Exception — make `@` a leaf when it has descendants.** Editing files in a non-leaf `@` auto-amends it and rebases every descendant; if a descendant is another workspace's working copy, that workspace is rewritten underneath it (stale state, conflicts). Plain `jj new` moves `@` onto a new empty child, so it cannot lose work. (`jj new --no-edit` leaves `@` in place and does not help.)

Check before your first edit in a session:

```bash
# Empty output = @ is a leaf (safe to edit). Any output = @ has descendants.
jj log -r 'children(@)' --no-graph --no-pager -T 'change_id.short(8) ++ "\n"'
# If non-empty, make @ a fresh leaf before editing:
jj new
```

This is the only sanctioned use of plain `jj new`. For any other new change, use `jj new --no-edit --insert-after ... --insert-before ...`.

### 3. Always force non-interactive mode

Never run a command that opens an editor or interactive UI.

| Opens editor | Non-interactive form |
|---|---|
| `jj describe` | `jj describe -m "message"` or `jj describe -r <id> -m "message"` |
| `jj new` | `jj new --no-edit -m "message" --insert-after X --insert-before Y` |
| `jj commit` | `jj commit -m "message"` |
| `jj squash -i` | `jj squash --from <id> --into <id> [files] -u` |
| `jj split` (no filesets) | File-level: `jj split -r <id> -m "message" <paths>` (non-interactive when filesets are given; never with `-i`/`--tool`) · hunk-level: `jj-hunk split` via the `jj-hunk` skill |
| `jj resolve` | `jj resolve --list` to inspect · `jj resolve --tool :ours\|:theirs [filesets] [-r <rev>]` to take side #1/#2 non-interactively · or edit conflict markers manually |
| `jj diffedit` | Not usable by agents — edit files directly |

Always add `--no-pager` to `jj log`, `jj diff`, `jj show`, and `jj op log`.

When a script or agent parses jj output, emit JSON lines rather than splitting on spaces: `-T 'json(self) ++ "\n"'` for whole commits, or build fields with `.escape_json()` (e.g. `description.first_line().escape_json()`).

### 4. Distinguish "insert before `@`" from "create a sibling"

When separating part of `@` into a new change, decide the graph intent first:

- If `@` should still depend on the extracted change, insert the new change before `@`, then file content into it with `jj squash --from @ --into <new-id> <paths> -u` (see [Filing work from `@`](#filing-work-from--into-other-changes)).
- If the user wants parallel siblings, use `jj-organizing-history`.
- Don't use `jj split -o @-` as an extraction shortcut: for `-r @` it leaves the remaining working-copy change as a sibling that no longer depends on the extracted change.

Creating changes without moving `@` (all print the new change id):

| Goal | Command |
|---|---|
| Insert a predecessor before `@` (`@` keeps depending on it) | `jj new --no-edit -m "msg" --insert-after @- --insert-before @` |
| Splice between two points (descendants rebase automatically) | `jj new --no-edit -m "msg" --insert-after <parent> --insert-before <child>` |
| Insert after / before one target | `jj new --no-edit -m "msg" -A <target>` / `-B <target>` |
| Child of a specific change | `jj new --no-edit -m "msg" <parent>` |
| Merge change with several parents | `jj new --no-edit -m "msg" <parentA> <parentB>` |

### 5. Verify graph shape after any history rewrite

Snapshot `@`'s commit ID before a rewrite; afterwards confirm content is unchanged and parents match your intent.

```bash
PRE_ID=$(jj log -r @ -T 'commit_id' --no-graph --no-pager)
# ... rewrite (jj-hunk split, jj rebase, etc.) ...
jj diff --from "$PRE_ID" --to "$(jj log -r @ -T 'commit_id' --no-graph --no-pager)" --no-pager
# Empty = content unchanged. Any output = something changed unintentionally; inspect jj op log and recover.
jj log -r 'parents(@) | @' --no-graph --no-pager
```

### 6. Never run context-polluting or destructive commands blindly

- **Scope diffs before reading them.** Start with `--stat` (`jj diff --stat --no-pager`, `jj show -r <id> --stat --no-pager`), then read hunks for specific paths (`jj diff --git --no-pager -r <id> <paths>`). Full diffs of a bounded range are fine (a reviewer running `jj diff --git --from <base> --to <head>`); never dump an unbounded range like all of `trunk()..@` with no paths.
- **Abandon only empty scaffold changes you created in this session; otherwise ask.** `jj abandon` on anything else can discard someone's work. `jj op abandon` compacts history irreversibly: never without an explicit request.
- **Never blind-`jj undo` / `jj op restore` to escape a state you don't understand.** They are safe recovery tools, but rolling back without first reading `jj op log` can discard good work. Inspect the op log first; ask the user if the correct target is unclear.


### 7. Concurrent agents: one lock, no snapshotting reads

jj never locks the repo. Every jj command snapshots the working copy first, and two operations that rewrite the same commit concurrently leave it **divergent** — this includes a plain `jj log` snapshotting `@` while another agent commits. Whenever more than one agent (or the user) may be running jj against this repo:

- **Every mutation goes through the guard** — the skill-relative `scripts/jj-guard.ts`. It holds a repo-wide lock (covering every workspace), repairs a stale workspace, and exits non-zero if the operation left a divergent or conflicted change.
  - `node <skill>/scripts/jj-guard.ts commit -m '<msg>' <path>...` — **paths are required**; a bare `jj commit` files every agent's edits. Prints the new change id.
  - `node <skill>/scripts/jj-guard.ts run <jj args>...` — any other mutation (`squash`, `describe`, `rebase`, `workspace add`).
  - `node <skill>/scripts/jj-guard.ts check [--prefix <scaffold>] [--all]` — divergent, conflicted, or leftover-scaffold changes under any workspace (`--all`: every mutable change). Mutations fail only on problems they introduced, so unrelated conflicted branches do not block work.
- **Every read passes `--ignore-working-copy`** (`jj log --ignore-working-copy ...`). It reads the last recorded state without snapshotting. Run a snapshotting read only when no other agent is active.
- **No `jj git fetch`, `jj git push`, or bookmark moves while agents are running.**

Two execution modes, chosen per run by the orchestrator:

| Mode | When | How |
|---|---|---|
| **Shared working copy** (default) | Short tasks, shared build cache matters | All agents edit `@`; file scopes are disjoint; implementers `commit` their own paths through the guard. |
| **Workspace per implementer** | Long or noisy tasks, or a task needs its own build/run state | `jj-guard.ts run workspace add --name <run>-<node> -r <base> <dir>`; the implementer works and commits inside it; after consolidation the coordinator rebases the task's change into the main line (`run rebase -r <id> -B @`) and runs `run workspace forget <run>-<node>`. |

Either way, consolidation targets **change ids reported by the guard**, never a description search across the whole repo.

**Recovering from divergence** (orchestrator only; subagents report `BLOCKED`):
1. Stop dispatching and wait for running agents. `jj op log --ignore-working-copy -n 10` — a `reconcile divergent operations` entry marks the race.
2. List copies: `jj log --ignore-working-copy -r 'divergent()' -T 'change_id.short(8) ++ "/" ++ change_offset ++ " " ++ description.first_line() ++ "\n"' --no-graph`.
3. Copies with different content are separate work: `jj metaedit --update-change-id -r <id>/<n>` gives each its own change. A copy whose diff against another is empty is a duplicate snapshot.
4. If the graph is still tangled (stray sibling `@` children), `jj op restore` to the op before the reconcile and re-file the lost commit through the guard. Ask the user before abandoning anything.

### Common mistakes

- Plain `jj new` "to start fresh" — moves `@`; only correct when `children(@)` is non-empty.
- A quick `jj log` or `jj commit` while subagents run — snapshotting read or unguarded write (rule 7).

## Scope and model

Use jj for all version control once the repo uses it; if it is not clearly a jj repo, ask before switching from git. Recording jj in the project agent docs is `jj-superpowers:project-layout`'s job.

Changes have stable IDs that survive rewrites; `@` is the working-copy change, auto-amended as you edit (no staging area); bookmarks are optional and used for remote sync; descendants rebase automatically; every operation is in the op log and reversible.

## Quick Command Reference

```bash
jj st
jj log -r 'ancestors(@, 10)' --no-graph --no-pager
jj log -r 'trunk()..@' --no-pager          # unmerged work
jj log -r 'mine()' --no-pager
jj describe -m "Description"               # describe @ without moving it

jj diff --stat --no-pager                  # always first
jj diff --git --color=never --no-pager <paths>
jj diff --from <a> --to <b> --git --color=never --no-pager

jj git fetch
jj rebase -o 'trunk()'
jj rebase -s <change> -o <base>

jj bookmark create feature-name [-r <change-id>]
jj bookmark move feature-name --to <change-id> [--allow-backwards]
jj bookmark list / delete feature-name
jj git push --bookmark feature-name        # tracks on first push; --force rarely needed

jj squash -u                               # @ into parent, keep parent's description
jj squash -r <change-id> -u
jj abandon <change-id>                     # only empty scaffolds you created (rule 6)
```

See [revsets.md](references/revsets.md) for revset pitfalls.

### Filing work from `@` into other changes

To file work from `@` into a pre-planned destination change without opening an editor:

```bash
jj squash --from @ --into <rev> -u                      # all of @
jj squash --from @ --into <rev> path/a.rs path/b.rs -u  # specific paths; other edits stay in @
jj describe -r <rev> -m "feat(auth): add login endpoint"
```

`-u` keeps the destination's description; without it, squashing a described `@` into a described destination opens an editor for a combined message. An emptied `@` is replaced by a fresh empty change, so no work is lost.

### Operation Log and Recovery

```bash
jj op log --no-pager --limit 10
jj op diff --operation <operation_id>
jj --at-op=<operation_id> log --no-pager      # inspect the repo at that point
jj undo / jj redo                             # repeat undo to walk further back
jj op restore <operation_id>                  # restore an earlier state (creates a new op)
jj op revert <operation_id>                   # apply one op's inverse
```

`jj op restore` and `jj undo` create new operations rather than destroying history — but read `jj op log` before using them (rule 6).

## Reference Documentation

- **[workflows.md](references/workflows.md)** — conflict resolution, workspaces, `jj rebase` flags
- **[revsets.md](references/revsets.md)** — `..` vs `::`, `trunk()` override, `description()` matching
