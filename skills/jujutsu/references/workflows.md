# Conflicts, Workspaces, Rebase

Load when resolving conflicts, using multiple workspaces, or choosing `jj rebase` flags. Safety rules, the non-interactive command forms, and verify-after-rewrite live in [SKILL.md](../SKILL.md); they all apply here.

## Rebase flags

`jj rebase` picks **which** revisions move and **where** they go.

| Which | Moves |
|---|---|
| `-s <rev>` | `<rev>` and its descendants |
| `-b <rev>` | the whole branch containing `<rev>`, relative to the destination |
| `-r <rev>` | exactly `<rev>`; its descendants are reparented onto its parent |

| Where | Result |
|---|---|
| `-o <target>` | onto `<target>` |
| `-A <target>` | after `<target>`; `<target>`'s children are rebased onto the moved revisions |
| `-B <target>` | before `<target>`; `<target>` and its descendants are rebased onto the moved revisions |

```bash
jj rebase -o 'trunk()'                              # current branch onto trunk (after jj git fetch)
jj rebase -s 'all:roots(trunk()..@)' -o 'trunk()'   # every unmerged stack onto trunk
jj rebase -r <change> -A <target>                   # move one change, no descendants
jj rebase -s <change> -o <base> --skip-emptied      # drop changes the rebase emptied
```

A rebase never stops on conflicts; it records them in the rebased changes (below). Any rebase also rewrites descendants, so see the workspace caveat before rebasing shared ancestors.

## Conflicts

Conflicts are stored in changes, not in a paused state. You can keep rebasing, describing, and even pushing conflicted changes, and resolve them later.

```bash
jj log --ignore-working-copy --no-pager -r 'conflicts()'   # which changes are conflicted
jj resolve --list -r <rev>                                 # which paths
```

**Resolve in `@` by editing the markers.** jj writes either snapshot markers (`<<<<<<<` … `+++++++` … `>>>>>>>`) or diff markers (`%%%%%%%` shows a diff to apply to the other side). Remove all markers and the file is resolved on the next snapshot. If the conflicted change is an ancestor of `@`, the markers are visible in `@` too: edit them there, then file the resolution down without moving `@`:

```bash
jj squash --from @ --into <conflicted-rev> <paths> -u   # descendants inherit the resolution
```

If it is not an ancestor of `@`, resolving it would need `jj edit` (safety rule 2): stop and ask the user.

**Take one side wholesale** (only for conflicts a 3-way merge can resolve, and per file, so it's a blunt tool):

```bash
jj resolve --tool :ours   [paths] [-r <rev>]   # side #1
jj resolve --tool :theirs [paths] [-r <rev>]   # side #2
```

Which side is #1 or #2 depends on the operation (rebase vs merge). Inspect `jj resolve --list` and a `--stat` diff before bulk-applying. Bare `jj resolve` opens a merge tool and is not usable.

After resolving, check `jj log -r 'conflicts()'` is empty for your range, plus the verify-after-rewrite check in SKILL.md.

## Workspaces

A workspace is another working copy attached to the same repo, with its own `@`. Creating one does not move your `@`.

```bash
jj workspace add --name fix-bug -r <base> ../fix-bug   # through the guard if other agents are active (rule 7)
jj workspace list                                       # each workspace and its @
jj workspace forget fix-bug && rm -rf ../fix-bug        # forget before deleting the directory
```

Deleting the directory without `forget` leaves a stale entry. If a workspace reports itself stale after another workspace rewrote its `@`, run `jj workspace update-stale` inside it.

**Don't rewrite what another workspace depends on.** Auto-amend (editing files), `jj squash --into`, `jj rebase`, `jj describe -r` and `jj abandon` all rebase the target's descendants. If one of those descendants is another workspace's `@`, that workspace is rewritten underneath it: it goes stale and may pick up conflicts. So:

- Before editing, make your `@` a leaf if `children(@)` is non-empty (the rule 2 exception in SKILL.md).
- Don't squash into, rebase, or redescribe a change another workspace has checked out, or any of its ancestors, without coordinating.
- With concurrent agents, workspace-per-implementer mode and the consolidation steps are defined in safety rule 7.
