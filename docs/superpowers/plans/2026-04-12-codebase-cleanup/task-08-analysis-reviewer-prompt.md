# Task 8: Create analysis-reviewer-prompt.md

**Files:**
- Create: `skills/codebase-cleanup/analysis-reviewer-prompt.md`

**Context:** `context/skill-conventions.md`

This prompt is dispatched at the end of Step 3, after all per-group analysis agents have appended their `## Analysis` sections. It checks for evidence quality and specificity before the findings are presented to the user in Step 4.

---

- [ ] **Step 1: Create the prompt template**

Create `skills/codebase-cleanup/analysis-reviewer-prompt.md` with this exact content:

```markdown
# Analysis Reviewer Prompt

Dispatch this subagent with these values substituted for the bracketed placeholders:
- `[BY_GROUP_PATH]` — path to the group files (e.g. `docs/superpowers/code-map/2026-04-12-1430/by-group/`)

---

You are reviewing the dead code and duplication analysis from Step 3 before findings are presented to the user.

## Checks

**1. Evidence for dead code claims**
Every dead code entry must include a grep pattern and result count (e.g. `grep: import.*symbolName → 0 results outside defining file`). Flag any entry that lacks this evidence.

**2. Independent verification of 2–3 dead code claims**
Pick 2–3 dead code entries and run the grep yourself to verify. Report whether the claims hold.

**3. Specificity of duplication claims**
Duplication entries must name specific files and functions. A claim that just says "similar logic" or "similar implementation" without naming the files is too vague. Flag vague claims.

**4. Realism of abstraction suggestions**
Flag abstraction suggestions that are too vague (e.g. "could be refactored") or do not name the proposed extraction. Good suggestions name the proposed function/type and the specific shared logic that would be extracted.

**5. Out-of-scope findings**
Flag any finding that references code outside the directories listed in `index.md`.

## Output

```
APPROVED
```

or

```
ISSUES FOUND

- [Issue 1]: [specific group file, symbol, and exactly what is wrong]
- [Issue 2]: [specific group file, symbol, and exactly what is wrong]
```

If APPROVED: analysis is ready for Step 4 discussion with the user.
If ISSUES FOUND: the relevant analysis subagent(s) must fix the listed issues. Re-dispatch this reviewer after fixes are complete.
```

- [ ] **Step 2: Verify the file was created**

Run: `ls skills/codebase-cleanup/`

Expected: `analysis-reviewer-prompt.md` appears in the listing
