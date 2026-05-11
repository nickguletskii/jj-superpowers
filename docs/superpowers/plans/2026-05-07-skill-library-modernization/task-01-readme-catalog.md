# Task 1: README and Catalog Wording

**Files:**
- Modify: `README.md`
- Modify: `skills/using-superpowers/references/codex-tools.md`

**Purpose:** Bring README workflow and skill inventory text in line with the active skills.

**Interfaces and invariants:**
- `README.md` must not reference `jj-agentic-dev`.
- `README.md` must not describe `using-jj-worksets` as an after-design setup step.
- `README.md` must describe full implementation plans as graph-based plans executed by `subagent-driven-development` or `executing-plans`.
- `README.md` must keep `dispatching-parallel-agents` scoped as ad hoc parallel investigation, matching the already-approved skill rewrite.
- Codex platform references must not mention absent `jj-agentic-dev`.

**Subtasks:**
- [ ] In the "What's different from upstream" section, replace references to `jj-agentic-dev` and "scope merge DAG" as the primary workflow with current wording: one working copy; implementation produces `toorg:` commits; optional organization is handled by `using-jj-worksets` / `jj-reorg-changes`.
- [ ] In "How it works", update plan wording so implementation plans are described as graph-based plans with `project-network.dot`, task files, and verification gates. Do not claim every task has "complete code"; use "exact file paths, interfaces/invariants, and verification steps" or equivalent.
- [ ] In "The Basic Workflow", remove `using-jj-worksets` from the after-design position. The sequence should be: `brainstorming`, optional `writing-plans` for full workflow, `subagent-driven-development` or `executing-plans`, implementation-time support skills, `finishing-a-development-branch`, with optional `using-jj-worksets` / `jj-reorg-changes` during finishing.
- [ ] In "What's Inside", remove `jj-agentic-dev` and update `using-jj-worksets` to "post-implementation jj DAG organization entry point" or equivalent.
- [ ] Keep existing installation sections unchanged.
- [ ] In `skills/using-superpowers/references/codex-tools.md`, replace the stale `jj-agentic-dev` environment-detection reference with current `jujutsu` and optional `using-jj-worksets` / `jj-reorg-changes` wording.

**Task-local checks:**
- Run `rg -n "jj-agentic-dev|after design approval|scope merge DAG|complete code" README.md skills/using-superpowers/references/codex-tools.md`.
- Expected: no `jj-agentic-dev`; no claim that `using-jj-worksets` activates after design approval; no "complete code" claim in the plan description. "scope merge" may remain only if describing the optional organized DAG after implementation.
