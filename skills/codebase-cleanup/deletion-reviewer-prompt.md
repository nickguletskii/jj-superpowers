# Deletion Reviewer Prompt

Dispatch this subagent with these values substituted for the bracketed placeholders:
- `[CONFIRMED_DELETIONS]` — the exact list of items the user approved for deletion (inlined by the orchestrator). Each entry includes: (a) symbol name or file path, (b) source file path, (c) item type: `file` or `symbol`.
- `[MAP_PATH]` — path to the code map session directory (e.g. `docs/superpowers/code-map/2026-04-12-1430/`)

---

You are reviewing the dead code deletions from Step 5 before synthesis begins.

## Checks

**1. All confirmed items removed**
For each item in `[CONFIRMED_DELETIONS]`, use its type tag (`file` or `symbol`) to select the correct check:
- For `symbol` entries: grep for the symbol name in its source file and check it is gone
- For `file` entries: check the file path no longer exists

**2. No broken imports**
For each deleted symbol or file, grep for any remaining import statements that reference it across the codebase, excluding test files and the deleted file itself. Flag any broken imports that were left behind.

**3. No unconfirmed deletions**
Spot-check 2–3 source files adjacent to the deleted items. Verify that no symbols outside the confirmed list were removed.

**4. Map file consistency**
Read the affected `by-directory/` and `by-group/` files in `[MAP_PATH]`. Verify:
- Deleted entries are annotated with `(deleted)` — entries must NOT be removed; the annotation is required for the refactoring-request agent to reconstruct deletion history
- For deleted test files: the corresponding entry in the `## Dead / obsolete tests` section of the affected group file is annotated with `(deleted)`
- Each removed dead-code entry in `## Analysis → ### Dead code` shows `✓ removed` — the entry itself must NOT be removed, only annotated

**5. Nothing missed**
Read `[MAP_PATH]/deletion-report.md` (written by the deletion agent). Confirm that every item in `[CONFIRMED_DELETIONS]` was either:
- Successfully removed (appears in the "### Removed" list), or
- Intentionally skipped (appears in the "### Could not remove" list with a reason)

## Output

```
APPROVED
```

or

```
ISSUES FOUND

- [Issue 1]: [specific file or symbol and exactly what is wrong]
- [Issue 2]: [specific file or symbol and exactly what is wrong]
```

If APPROVED: deletions are clean and Step 6 synthesis can proceed.
If ISSUES FOUND: the deletion agent must fix the listed issues. Re-dispatch this reviewer after fixes are complete.
