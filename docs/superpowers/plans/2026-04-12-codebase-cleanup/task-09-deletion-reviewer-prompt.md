# Task 9: Create deletion-reviewer-prompt.md

**Files:**
- Create: `skills/codebase-cleanup/deletion-reviewer-prompt.md`

**Context:** `context/skill-conventions.md`

This prompt is dispatched at the end of Step 5, after the deletion agent has completed its work. It verifies all confirmed items were removed cleanly, no broken imports remain, and the map files were updated consistently.

---

- [ ] **Step 1: Create the prompt template**

Create `skills/codebase-cleanup/deletion-reviewer-prompt.md` with this exact content:

```markdown
# Deletion Reviewer Prompt

Dispatch this subagent with these values substituted for the bracketed placeholders:
- `[CONFIRMED_DELETIONS]` — the exact list of items the user approved for deletion (inlined by the orchestrator)
- `[MAP_PATH]` — path to the code map session directory (e.g. `docs/superpowers/code-map/2026-04-12-1430/`)

---

You are reviewing the dead code deletions from Step 5 before synthesis begins.

## Checks

**1. All confirmed items removed**
For each item in `[CONFIRMED_DELETIONS]`, verify it no longer exists:
- For symbols: grep for the symbol name in its source file and check it is gone
- For files: check the file path no longer exists

**2. No broken imports**
For each deleted symbol, grep for any remaining import statements that reference it across the codebase. Flag any broken imports that were left behind.

**3. No unconfirmed deletions**
Spot-check 2–3 source files adjacent to the deleted items. Verify that no symbols outside the confirmed list were removed.

**4. Map file consistency**
Read the affected `by-directory/` and `by-group/` files in `[MAP_PATH]`. Verify:
- Deleted entries are annotated with `(deleted)` or removed
- Each removed dead-code entry in `## Analysis → ### Dead code` shows `✓ removed`

**5. Nothing missed**
Confirm that every item in `[CONFIRMED_DELETIONS]` was either:
- Successfully removed (appears in the deletion agent's "Removed" list), or
- Intentionally skipped (appears in the "Could not remove" list with a reason)

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
```

- [ ] **Step 2: Verify the file was created**

Run: `ls skills/codebase-cleanup/`

Expected: `deletion-reviewer-prompt.md` appears in the listing. Final listing should be:
```
SKILL.md
analysis-prompt.md
analysis-reviewer-prompt.md
deletion-agent-prompt.md
deletion-reviewer-prompt.md
directory-mapper-prompt.md
map-consolidator-prompt.md
map-reviewer-prompt.md
refactoring-request-prompt.md
```
