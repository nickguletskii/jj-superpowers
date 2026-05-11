# Deletion Agent Prompt

Dispatch this subagent with these values substituted for the bracketed placeholders:
- `[CONFIRMED_DELETIONS]` — the exact list of items the user approved for deletion (inlined by the orchestrator). Each entry in `[CONFIRMED_DELETIONS]` must include: (a) the symbol name or file path, (b) the source file path (for symbol removals), and (c) the item type: `file` (delete the whole file) or `symbol` (remove one symbol from a file). Example entry: `symbol: legacyLogin from src/auth/legacy.ts`
- `[MAP_PATH]` — path to the code map session directory (e.g. `docs/superpowers/code-map/2026-04-12-1430/`)

---

You are removing confirmed dead code from the codebase. The user has approved the following deletions:

[CONFIRMED_DELETIONS]

## Your task

For each item in the confirmed deletions list:

1. For each confirmed item:
   - **(a) File deletion:** Delete the entire file. Then grep to confirm no other file imports from it.
   - **(b) Symbol removal:** Remove only the symbol from its source file. Preserve all surrounding code. Then clean up import statements referencing the removed symbol in other files.
2. Search for any remaining import statements that reference the deleted symbol or file and remove them
3. Verify with a grep that nothing still references the deleted code. If grep returns any remaining references outside test files or the now-deleted file itself, do NOT consider the deletion complete — add the symbol to 'Could not remove' with the grep results as the reason.

After completing all deletions, update the code map files:

Read each map file before modifying it. Do not overwrite content outside the specific entries you are annotating.

- In `[MAP_PATH]/by-directory/<dir>.md`: annotate deleted entries with `(deleted)` — do NOT remove entries from the map file. The refactoring-request agent needs these annotations to reconstruct history.
- In `[MAP_PATH]/by-group/<group>.md`: do the same in the "Full API surface" section. For deleted test files, also annotate their entry in the `## Dead / obsolete tests` section with `(deleted)`.
- In each affected `## Analysis → ### Dead code` section: annotate each removed item with `✓ removed`

## Report

Write your report to `[MAP_PATH]/deletion-report.md` and include it inline in your response:

```markdown
## Deletion Report

### Removed
- `symbolName` from `path/to/file.ts` — [what was deleted and any cleanup performed]

### Import cleanup
- Removed import of `symbolName` from `path/to/consumer.ts`
- (none) if no import cleanup was needed

### Could not remove
- `symbolName` — [reason why deletion was not completed]
- (none) if all deletions succeeded
```

## Rules

- Delete ONLY items in the confirmed list — nothing else
- If a deletion would break something unexpected (e.g. the symbol turns out to be used somewhere not caught by the analysis), do NOT delete it; report it under "Could not remove"
- Report every deletion attempt, successful or not
- Do not skip the map file updates
