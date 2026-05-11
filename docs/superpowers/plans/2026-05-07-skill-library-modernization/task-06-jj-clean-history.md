# Task 6: `jj-clean-history` Scope and Stale References

**Files:**
- Modify: `skills/jj-clean-history/SKILL.md`
- Modify: `skills/jujutsu/SKILL.md`

**Purpose:** Clarify how `jj-clean-history` differs from `jj-reorg-changes` and remove references to absent skills.

**Interfaces and invariants:**
- `jj-clean-history` is for arbitrary messy jj history cleanup.
- `jj-reorg-changes` is for post-implementation `toorg:` commits.
- No reference to a nonexistent `jj-split` skill should remain.
- `jujutsu` reference guidance must not mention a nonexistent `jj-split` operation when it means `jj-hunk split` or split-style history rewrites.
- No reference to `/jj-bookmarks` should remain unless a current skill/file exists for it.
- Existing safety rules around recording the starting op, refusing dirty `@`, and avoiding `jj op restore` without confirmation must remain.

**Subtasks:**
- [ ] Add a short overview after the heading that says: use this for arbitrary committed jj history; use `jj-reorg-changes` for `toorg:` implementation commits.
- [ ] In Phase 2, replace "**Sequential (`jj-split` skill)**" with guidance to use `jj-hunk` for hunk-level or sequential extraction when changes have dependencies.
- [ ] Keep `jj-split-parallel` for fully independent sibling extraction.
- [ ] Replace the "Typical workflow" reference to `/jj-bookmarks` with a generic next step such as "create/update bookmarks manually using `jujutsu` guidance if needed" or remove the section.
- [ ] Ensure all jj commands shown remain non-interactive and include `--no-pager` where appropriate.
- [ ] In `skills/jujutsu/SKILL.md`, replace stale wording that says "`jj-hunk split` / `jj-split` operation" with wording that refers to `jj-hunk split` or split-style history rewrites.

**Task-local checks:**
- Run `rg -n "(^|[^[:alnum:]_-])jj-split([^[:alnum:]_-]|$)|/jj-bookmarks|jj-reorg-changes|jj-hunk|jj-split-parallel" skills/jj-clean-history/SKILL.md skills/jujutsu/SKILL.md`.
- Expected: no `jj-split` or `/jj-bookmarks`; `jj-reorg-changes`, `jj-hunk`, and `jj-split-parallel` boundaries are clear.
