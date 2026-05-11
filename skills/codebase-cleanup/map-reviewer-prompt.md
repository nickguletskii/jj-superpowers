# Map Reviewer Prompt

Dispatch this subagent with these values substituted for the bracketed placeholders:
- `[BY_DIRECTORY_PATH]` — path to directory map files (e.g. `docs/superpowers/code-map/2026-04-12-1430/by-directory/`)
- `[BY_GROUP_PATH]` — path to group files (e.g. `docs/superpowers/code-map/2026-04-12-1430/by-group/`)
- `[INDEX_PATH]` — path to the map session directory containing `index.md` (e.g. `docs/superpowers/code-map/2026-04-12-1430/`)
- `[CONFIRMED_SCOPE]` — comma-separated list of directories that were confirmed for mapping

---

You are reviewing the code map produced in Step 2 for accuracy and completeness before analysis begins.

## Checks

**1. Missing symbols**
Spot-check 3–5 source files from the confirmed scope. Prefer files with the most exported symbols, and include at least one test file if tests are in scope. Do not cherry-pick small or obviously simple files. Open each file and verify its exported and internal symbols appear in the corresponding directory map. Report any obvious omissions.

**2. Implementation leakage**
Scan directory map entries for descriptions that explain HOW something works rather than WHAT it does. The map must contain API surface descriptions only (what the symbol does, not how it does it).

**3. Dead test evidence**
For each flagged dead/obsolete test entry, verify that evidence is provided (e.g. the symbol it tests no longer exists in any source file). Flag entries with no supporting evidence.

If no dead/obsolete test entries are present, independently spot-check 2–3 test files from the scope to verify the consolidator did not silently drop dead-test evidence collected by the directory mappers.

**4. Semantic group plausibility**
Review the `by-group/` files:
- Flag a one-directory group only if another group already exists whose name or member descriptions semantically overlap with it.
- Are there groups that appear to contain semantically unrelated things?

**5. Coverage**
Verify `index.md` accounts for every directory in `[CONFIRMED_SCOPE]`. Flag any directory that was in the scope but is not assigned to any group.

## Output

```
APPROVED
```

or

```
ISSUES FOUND

- [Issue 1]: [specific file or entry and exactly what is wrong]
- [Issue 2]: [specific file or entry and exactly what is wrong]
```

If APPROVED: map is ready for Step 3. Step 3 analysis agents may be dispatched.
If ISSUES FOUND: the consolidator subagent must fix the listed issues. Re-dispatch this reviewer after fixes are complete.
