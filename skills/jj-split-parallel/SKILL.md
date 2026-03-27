---
name: jj-split-parallel
description: >
  Split a single jj change into multiple PARALLEL changes (siblings sharing the same parent)
  by file or by hunk. Preserves all file contents — only reorganises jj history.
  Use when the user asks to split a jj change/commit into parallel siblings, decompose a large
  change into logical groups, or reorganise jj history without losing any diffs.
  Accepts an optional revision argument (defaults to @).
---

# jj-split-parallel

Split one jj change into N parallel sibling changes, each representing one logical concern.

## ⚠️ Critical: how `jj split --parallel` assigns change IDs

**The SELECTED (split-off) change receives the ORIGINAL change ID. The REMAINING change gets a NEW ID.**

The script handles this automatically by capturing "Remaining changes: XXXX" from each split's output and tracking it across iterations. Never assume the original `rev` still points to the remaining change after a split.

On any `jj` failure the script automatically runs `jj undo` to roll back the last operation and exits.

## Step 1: Session directory

```bash
WORKSPACE=$(jj workspace root --no-pager)
SESSION_DIR="$WORKSPACE/.jj-splits/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$SESSION_DIR"
grep -qxF '.jj-splits/' "$WORKSPACE/.gitignore" || echo '.jj-splits/' >> "$WORKSPACE/.gitignore"
```

## Step 2: Resolve REV

```bash
REV=$(jj log --no-pager -r "${ARGUMENTS:-@}" --no-graph -T 'change_id ++ "\n"')
```

## Step 3: Ask granularity

Ask: **"Per-hunk, per-file, or nested?"**

- **Per-file** — group entire files by path pattern. Simpler; use when each file clearly belongs to one concern.
- **Per-hunk** — group individual hunks. Use when files have mixed concerns.
- **Nested** — per-file first, then per-hunk refinement within each resulting sibling.

## Step 4: Gather diff info

**Per-file / nested (first pass):**
```bash
jj diff --summary --no-pager -r "$REV" > "$SESSION_DIR/files.txt"
```

**Per-hunk:**
```bash
jj-hunk list -r "$REV" --binary skip > "$SESSION_DIR/hunks.json"
```

## Step 5: Propose groupings and get approval

Present groups clearly. Wait for user approval before writing config.

## Step 6: Write config.json and run

**File mode** — write `$SESSION_DIR/config.json`:

```json
{
  "rev": "<full-change-id>",
  "mode": "file",
  "files_txt": "<session_dir>/files.txt",
  "session_dir": "<session_dir>",
  "groups": [
    {"message": "feat: group one", "patterns": ["^src/one/", "^lib/one\\.rs$"]},
    {"message": "feat: group two", "patterns": ["^src/two/"]},
    {"message": "chore: remaining"}
  ]
}
```

**Hunk mode** — write `$SESSION_DIR/config.json`:

```json
{
  "rev": "<full-change-id>",
  "mode": "hunk",
  "session_dir": "<session_dir>",
  "groups": [
    {
      "message": "feat: group one",
      "spec": {"files": {"src/a.rs": {"hunks": [0, 2]}}, "default": "keep"}
    },
    {"message": "chore: remaining"}
  ]
}
```

Config rules:
- Last group (no `"patterns"` or `"spec"`) → `jj describe`, not `jj split`
- Patterns (file mode) match the **destination path**; first match wins
- **Patterns use `re.match` — anchored to the start of the path.** A suffix-only pattern like `BulkActionsBar\.tsx$` will silently match nothing. Always prefix with `.*` when matching by filename suffix: `".*BulkActionsBar\\.tsx$"`
- **`files_txt` must match the rev being split.** When re-splitting a subset change, generate a fresh file list: `jj diff --summary --no-pager -r "$REV" > "$SESSION_DIR/files2.txt"` — never reuse the original `files.txt` from a prior split
- Renamed files: both src and dst paths are passed to `jj split`
- Paths with `$` are automatically quoted for jj's fileset syntax
- Always `"default": "keep"` in hunk specs

Run:
```bash
python3 <skill-dir>/scripts/gen_split.py "$SESSION_DIR/config.json"
```

The script invokes `jj` directly and auto-runs `jj undo` on any failure.

## Step 7 (nested only): Per-hunk refinement within each sibling

After the file-level split, for each sibling needing refinement:
1. `jj-hunk list --no-pager -r "<sibling>" --binary skip` to inspect hunks
2. Propose hunk groupings to the user
3. Write a new `config.json` in hunk mode with `"rev"` set to the sibling and run the script again

## Step 8: Verify

```bash
jj log --no-pager -r "all:<original-parent>+" --no-graph
jj diff --no-pager -r <each-sibling> --stat
```

## Rules

- Conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`
- No co-author or AI attribution in commit messages
- Manual recovery: `jj undo` (repeatable) if multiple operations need rolling back; `jj redo` reverses an accidental undo
- All session files under `$SESSION_DIR`
