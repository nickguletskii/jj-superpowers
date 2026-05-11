# Analysis Reviewer Prompt

Dispatch this subagent with these values substituted for the bracketed placeholders:
- `[BY_GROUP_PATH]` — path to the group files (e.g. `docs/superpowers/code-map/2026-04-12-1430/by-group/`)

---

You are reviewing the dead code and duplication analysis from Step 3 before findings are presented to the user.

## Checks

**1. Structural completeness**
For each group file in `[BY_GROUP_PATH]`, verify its `## Analysis` section contains all three subsections: `### Dead code`, `### Duplicated logic`, and `### Abstraction opportunities`. Flag any group file missing any subsection. Each subsection must be present even if empty (body should be `(none)`).

**2. Evidence for dead code claims**
Every dead code entry must include all three of: (a) the grep pattern used, (b) a result count of 0 outside the defining file (excluding test and generated files), and (c) confirmation that both import statements and direct call sites were checked. Flag any entry missing any of these three components.

**3. Independent verification of 2–3 dead code claims**
Pick 2–3 dead code entries and run the same grep the analysis agent used, excluding `*.test.*`, `*.spec.*`, and generated files. Check both import statements and call sites. If independent verification contradicts a dead-code claim, include it as an ISSUES FOUND item with your grep result count.

**4. Specificity and spot-check of duplication claims**
Duplication entries must name specific files and functions. A claim that just says "similar logic" or "similar implementation" without naming the files is too vague. Flag vague claims.

Pick 1–2 duplication entries and read both named implementations to confirm the claimed similarity is real. Report whether the claimed duplication holds.

**5. Realism of abstraction suggestions**
Flag abstraction suggestions that are too vague (e.g. "could be refactored") or do not name the proposed extraction. Good suggestions name the proposed function/type and the specific shared logic that would be extracted.

**6. Out-of-scope findings**
For each group file, read its `## Directories` section to determine in-scope directories. Flag any finding that references symbols outside those directories.

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
