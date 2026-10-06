---
name: jj-organizing-history
description: Use when splitting, cleaning, reorganizing, or preparing jj history for review or integration
---

# jj Organizing History

Organize jj changes without losing work or moving `@` unexpectedly.

## When to Use

Use this skill for:

- Unconsolidated `wip(...)` commits from inline or ad hoc work that should become a reviewable DAG. (Graph execution consolidates as it goes — see `jj-superpowers:subagent-driven-development` — so its history arrives here already clean.)
- Arbitrary committed jj history that needs cleanup before review.
- Splitting one change into logical pieces.
- Deciding whether history should be linear, parallel, or left as-is.

Use `jj-superpowers:jj-hunk` for low-level hunk selection. Use `jj-superpowers:jujutsu` for general jj command syntax and safety.

## Change Description Discipline

Change descriptions are governed by the **Change Description Rules** in `jj-superpowers:jujutsu` — they apply to every description in every repo, not just to reorganized history. Load that skill and follow it. In short: no LLM/model/agent attribution, one short title line with no prose body, and no transient workflow artifacts (node ids, phase numbers, plan paths, scaffold prefixes).

## Safety Rules

- Record the starting operation ID before rewrites: `jj op log --no-graph -T id -n 1 --no-pager`.
- Never use `jj edit`, `jj next`, `jj prev`, or plain `jj new`.
- Always use `--no-edit`, `-m`, and `--no-pager` where applicable.
- Do not target `@` for arbitrary cleanup if it has uncommitted content. File or finish the working copy first.
- After rewrites, verify graph shape and confirm the working-copy content is unchanged when it should be.

## Choose the Mode

| Situation | Mode |
|---|---|
| Unconsolidated `wip(...)` commits from inline or ad hoc work | Reorganize `wip(...)` commits |
| Existing committed history has mixed concerns | Clean committed history |
| One change should become independent siblings | Parallel split |
| One change should become a dependency chain | Sequential/hunk split via `jj-hunk` |

## Reorganize `wip(...)` Commits

1. List candidates:
   ```bash
   jj log -r 'trunk()..@' --no-pager \
     --template 'change_id.short(8) ++ "  " ++ description.first_line() ++ "\n"'
   ```
2. Inspect each `wip(...)` change with `jj show -r <id> --stat --no-pager` — this `--stat` summary is the bounded-summary exception to the inline-diff ban in `jj-superpowers:jujutsu` ("Never run full diffs inline"), so it is safe to run inline; do not run a full inline diff.
3. Group commits by logical concern and dependency.
4. Present the proposed DAG and assignments to the user using the decision-checkpoint pattern.
5. Build the DAG using the `jj-superpowers:subagent-driven-development` skill's `jj-dag-builder-prompt.md` and the skill-relative `resources/dot-to-jj-dag/dot-to-jj-dag.py` script.
6. Move content into target `todo:` nodes with `jj squash --from <wip-id> --into <target-id> <files> -u`.
7. Describe each completed node with its real, final description (see Change Description Discipline above) and abandon empty `wip(...)` commits. There is no intermediate label — describe it once, correctly.
8. Verify **no scaffold survives** — `jj log -r 'trunk()..@ & (description(glob:"wip(*") | description(glob:"todo:*"))'` must return empty. Then confirm `@` is empty and no divergent/conflicted changes exist.

## Clean Committed History

Use for arbitrary committed jj history, not raw `wip(...)` implementation output.

1. Confirm `@` is empty with `jj diff --no-pager -r @`; refuse cleanup if it is not.
2. Analyze commits in the selected range for mixed concerns.
3. Present commits needing splits and wait for user confirmation.
4. Use `jj-hunk` for dependent or hunk-level extraction.
5. Use parallel split only when the resulting changes are true siblings.
6. Verify the working tree state after all splits.

## Parallel Split

Only use parallel split when the result should be sibling changes with the same parent. If the current working copy must depend on the extracted change, insert a predecessor before `@` and squash into it instead.

For scripted file/hunk parallel splits, use the skill-relative `resources/gen-split/gen_split.py`. Remember that `jj split --parallel` keeps the selected split on the original change ID and gives the remaining change a new ID.

Run it with a JSON config:

```bash
uv run resources/gen-split/gen_split.py <config.json>
```

The config sets `rev` (the full change ID to split), `mode` (`file` or `hunk`), `session_dir` (where temp spec files are written), and an ordered list of `groups`:

- **`file` mode** assigns paths from a `jj diff --summary` dump (`files_txt`) to groups by regex `patterns` matched against the destination path; the first matching group wins, and renames pass both src and dst paths.
- **`hunk` mode** splits each group by a `jj-hunk` `spec` (e.g. `{"files": {"src/a.rs": {"hunks": [0, 2]}}, "default": "keep"}`).

The final group with no `patterns`/`spec` receives `jj describe` (not a split) for the remaining change. On any `jj` failure the script runs `jj undo` automatically before exiting.

## Integration

Called from:

- `jj-superpowers:finishing-a-development-branch` before final integration.
- Direct user requests to split, clean, reorganize, or prepare jj history.
