---
name: jj-hunk
description: Use when splitting commits in jj, making partial or hunk-level commits, or selectively squashing changes without an interactive UI.
---

# jj-hunk: Programmatic Hunk Selection

`jj-hunk` replaces `jj split -i` / `jj squash -i` with a JSON or YAML spec, so an agent can split, partially commit, or partially squash by hunk.

## Setup

```bash
cargo install jj-hunk
```

Add to the user config (`jj config path --user` prints its location):

```toml
[merge-tools.jj-hunk]
program = "jj-hunk"
edit-args = ["select", "$left", "$right"]
```

## 1. List hunks

```bash
jj-hunk list                    # working copy
jj-hunk list --rev <rev>        # <rev> vs its parent; must resolve to one revision
jj-hunk list --files            # files with hunk counts only
```

Other options: `--format json|yaml|text` (default json), `--include/--exclude <glob>`, `--group none|directory|extension|status`, `--binary skip|mark|include`, `--max-bytes/--max-lines <n>`, `--spec <spec>` / `--spec-file <path>` to preview a selection, `--spec-template`.

Output (abbreviated):

```json
{
  "files": [
    {
      "path": "src/lib/utils.ts",
      "status": "modified",
      "hunks": [
        {"id": "hunk-11bf...", "index": 0, "type": "replace", "removed": "function old()...\n", "added": "function new()...\n", "before": {"start": 5, "lines": 1}, "after": {"start": 5, "lines": 1}},
        {"id": "hunk-ee43...", "index": 1, "type": "insert", "removed": "", "added": "export function helper()...\n", "before": {"start": 6, "lines": 0}, "after": {"start": 6, "lines": 1}},
        {"id": "hunk-09ad...", "index": 2, "type": "delete", "removed": "// dead code\n", "added": "", "before": {"start": 20, "lines": 1}, "after": {"start": 20, "lines": 0}}
      ]
    }
  ]
}
```

Each hunk has a 0-based `index` and a stable `id` (`hunk-<sha256>`). Types are `insert`, `delete`, `replace`.

## 2. Build a spec

```json
{
  "files": {
    "src/lib/utils.ts": {"hunks": [0, "hunk-09ad..."]},
    "src/api/routes.ts": {"ids": ["hunk-cc19..."]},
    "src/db/schema.ts": {"action": "keep"},
    "src/wip.ts": {"action": "reset"}
  },
  "default": "reset"
}
```

| Spec | Effect |
|------|--------|
| `{"hunks": [0, 2]}` | Include hunks by index (or id string) |
| `{"ids": ["hunk-..."]}` | Include hunks by stable id (merged with `hunks` if both given) |
| `{"action": "keep"}` / `{"action": "reset"}` | Include / discard the whole file |
| `"default": "reset"` / `"keep"` | Unlisted files are discarded / kept |

Paths must match exactly (`"src/lib.rs"`, not `"src/"`). Prefer `ids` when hunks may shift between listing and applying. `"default": "reset"` (explicit inclusion) is the safer default; `"keep"` is convenient for excluding one file.

## 3. Execute

The spec is inline, `-` for stdin, or `--spec-file <path>` (then omit the inline spec).

```bash
jj-hunk split  [-r <rev>] '<spec>' "message"   # selected → first change, rest → child
jj-hunk commit '<spec>' "message"              # selected committed, rest stays in @
jj-hunk squash '<spec>'                        # selected squashed into parent
jj-hunk split --spec-file spec.yaml "message"
```

Direct form: `JJ_HUNK_SELECTION="$TMPDIR/spec.json" jj split -i --tool=jj-hunk -m "message"`.

## Example: split a messy revision in narrative order

Target the revision with `-r`/`--rev`; never `jj edit` onto it (moves `@`, jujutsu safety rule 2).

```bash
jj-hunk list --rev <rev>

# Infrastructure first: whole file
jj-hunk split -r <rev> '{"files": {"src/db/schema.ts": {"action": "keep"}}, "default": "reset"}' "feat: add database schema"

# Each split leaves the remainder in a new child; find it, re-list (indices change), split again
jj log --no-pager -r '<rev>::' --no-graph -T 'change_id.short(8) ++ " " ++ description.first_line() ++ "\n"'
jj-hunk list --rev <remainder>
jj-hunk split -r <remainder> '{"files": {"src/lib/utils.ts": {"hunks": [0, 2]}}, "default": "reset"}' "refactor: clean up utils"

# Describe the last remainder (never bare `jj describe` — it opens an editor)
jj describe -r <last-remainder> -m "feat: add posts endpoint"
```

Then verify per jujutsu safety rule 5, and check each resulting change with `jj diff -r <id> --stat --no-pager`.
