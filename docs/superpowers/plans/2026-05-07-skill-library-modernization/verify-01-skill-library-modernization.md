# Verify 1: Skill Library Modernization

**Upstream tasks:** `task_01`, `task_02`, `task_03`, `task_04`, `task_05`, `task_06`, `task_07`, `task_08`

**Commands:**
- `rg -n "jj-agentic-dev|(^|[^[:alnum:]_-])jj-split([^[:alnum:]_-]|$)|/jj-bookmarks|workflow type|Workflow:|project_network_diagram" README.md skills docs/README.codex.md docs/README.opencode.md pseudocode`
- `rg -n "project-network.dot|verify|quality_review" skills/executing-plans/SKILL.md pseudocode/executing-plans.tsx pseudocode/subagent-driven-development.tsx`
- `jj file list --no-pager 'glob:**/__pycache__/**'`
- `jj status --no-pager`
- `jj diff --stat --no-pager`

**Expected result:**
- First command exits 1 with no output, or outputs only historical plan/spec references that the implementer explicitly identifies as intentionally untouched. Active README, active skills, and active pseudocode must not contain stale references.
- Second command exits 0 and shows graph-model terms in `executing-plans` and `pseudocode/subagent-driven-development.tsx`.
- Third command exits 0 with no tracked `__pycache__` files listed.
- `jj status` shows only intended modifications for this modernization plus earlier approved changes already present in `@`.
- `jj diff --stat` does not show unrelated source-code changes.
