# Task 5: Create deletion-agent-prompt.md

**Files:**
- Create: `skills/codebase-cleanup/deletion-agent-prompt.md`

**Context:** `context/skill-conventions.md`

This prompt is dispatched once during Step 5, after the user has confirmed which dead code and obsolete tests to delete. The orchestrator inlines the confirmed deletion list before dispatching.

---

- [ ] **Step 1: Create the prompt template**

Create `skills/codebase-cleanup/deletion-agent-prompt.md` with this exact content:

```markdown
# Deletion Agent Prompt

Dispatch this subagent with these values substituted for the bracketed placeholders:
- `[CONFIRMED_DELETIONS]` — the exact list of items the user approved for deletion (inlined by the orchestrator)
- `[MAP_PATH]` — path to the code map session directory (e.g. `docs/superpowers/code-map/2026-04-12-1430/`)

---

You are removing confirmed dead code from the codebase. The user has approved the following deletions:

[CONFIRMED_DELETIONS]

## Your task

For each item in the confirmed deletions list:

1. Delete the file or remove the symbol from its source file
2. Search for any remaining import statements that reference the deleted symbol or file and remove them
3. Verify with a grep that nothing still references the deleted code

After completing all deletions, update the code map files:

- In `[MAP_PATH]/by-directory/<dir>.md`: remove or annotate deleted entries with `(deleted)`
- In `[MAP_PATH]/by-group/<group>.md`: do the same in the "Full API surface" section
- In each affected `## Analysis → ### Dead code` section: annotate each removed item with `✓ removed`

## Report

End your response with:

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
```

- [ ] **Step 2: Verify the file was created**

Run: `ls skills/codebase-cleanup/`

Expected: `deletion-agent-prompt.md` appears in the listing
