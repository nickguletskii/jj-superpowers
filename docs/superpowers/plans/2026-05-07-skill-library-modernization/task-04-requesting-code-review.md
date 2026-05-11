# Task 4: Requesting Code Review Scope

**Files:**
- Modify: `skills/requesting-code-review/SKILL.md`
- Modify: `pseudocode/requesting-code-review.tsx`

**Purpose:** Narrow `requesting-code-review` to ad hoc/manual review and avoid conflicting with graph quality review ownership.

**Interfaces and invariants:**
- `requesting-code-review` is not mandatory after every graph task.
- Planned graph implementation quality review belongs to `quality_review` nodes and `subagent-driven-development/code-quality-reviewer-prompt.md`.
- The skill must not assume a `toreview:` change ID always exists.
- Review input can be one of:
  - jj revision/change id
  - explicit diff range
  - file list
  - current `@` diff
- The file-size/decomposition lens remains required.

**Subtasks:**
- [ ] Change the "When to Request Review" section so mandatory cases are before merge/integration, after substantial ad hoc changes, or when the user asks for review. Remove "after each task in subagent-driven development" as mandatory.
- [ ] Add a section explaining planned graph implementation: use `subagent-driven-development/code-quality-reviewer-prompt.md` via `quality_review` nodes.
- [ ] Rewrite "How to Request" so it first determines review scope: change id, diff range, file list, or current `@` diff.
- [ ] Replace "The change ID is already known" with context-dependent instructions. If no change id exists, use `jj diff --git --color=never --no-pager` or the explicit file list/range supplied by the user.
- [ ] Update the example so it does not rely on a `toreview:` id from jj-coordinator. Use either "review current `@` diff for these files" or "review revision `<id>`".
- [ ] Update workflow integration text so `Subagent-Driven Development` points to `quality_review` nodes, while this skill covers ad hoc/manual review.
- [ ] Update pseudocode to choose a review scope instead of always using `currentToreviewChangeId(ctx)`.

**Task-local checks:**
- Run `rg -n "after EACH task|after each task|currentToreviewChangeId|toreview|quality_review|current @|diff range" skills/requesting-code-review/SKILL.md pseudocode/requesting-code-review.tsx`.
- Expected: no mandatory per-task graph review wording; no unconditional `currentToreviewChangeId`; planned graph review points to `quality_review`.
