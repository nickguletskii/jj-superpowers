# Task 8: Repo Hygiene and Maintenance Checklist

**Files:**
- Modify: `.gitignore`
- Delete: `skills/dot-to-jj-dag/tests/__pycache__/test_dot_to_jj_dag.cpython-314-pytest-9.0.2.pyc`
- Create: `docs/superpowers/skill-maintenance-checklist.md`

**Purpose:** Remove tracked generated Python bytecode and add a lightweight checklist to catch skill-library drift.

**Interfaces and invariants:**
- `__pycache__/` and `*.pyc` must be ignored.
- The tracked pycache file must be removed from the working copy.
- The maintenance checklist must be documentation only, not an executable script.
- Checklist must cover missing skill references, platform-specific wording, graph workflow parity, tracked generated files, and frontmatter description quality.

**Subtasks:**
- [ ] Add `__pycache__/` and `*.pyc` to `.gitignore` if they are missing.
- [ ] Remove `skills/dot-to-jj-dag/tests/__pycache__/test_dot_to_jj_dag.cpython-314-pytest-9.0.2.pyc`.
- [ ] Create `docs/superpowers/skill-maintenance-checklist.md` with sections:
  - **Missing skill references:** commands using `rg` or checklist prompts to compare README/docs references against `skills/*/SKILL.md` and `pseudocode/catalog.tsx`.
  - **Platform wording:** check generic skills for unqualified `Task`, `TodoWrite`, `/sandbox`, and Claude Code-only wording.
  - **Graph workflow parity:** check `writing-plans`, `subagent-driven-development`, `executing-plans`, and their pseudocode for `project-network.dot`, `verify`, and `quality_review`.
  - **Generated files:** check tracked `__pycache__`, `*.pyc`, and similar generated artifacts.
  - **Frontmatter trigger quality:** check that descriptions describe trigger conditions rather than summarizing workflow.
- [ ] Keep the checklist concise and command-oriented.

**Task-local checks:**
- Run `rg -n "__pycache__|\\*.pyc" .gitignore docs/superpowers/skill-maintenance-checklist.md`.
- Run `jj file list --no-pager 'glob:**/__pycache__/**'`.
- Expected: ignore patterns and checklist references exist; no tracked pycache files remain.
