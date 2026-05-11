# Task 2: `executing-plans` Graph Execution

**Files:**
- Modify: `skills/executing-plans/SKILL.md`
- Modify: `pseudocode/executing-plans.tsx`

**Purpose:** Convert `executing-plans` from old linear task execution to inline or separate-session execution of `project-network.dot`.

**Interfaces and invariants:**
- `executing-plans` is the graph executor when subagents are unavailable, unauthorized, or when execution is happening in a separate session.
- It must read both `plan.md` and `project-network.dot`.
- It must validate the same essential graph properties as `subagent-driven-development`:
  - `plan.md` references `project-network.dot`.
  - Every `task` node has `kind="task"`, `file`, and `files`.
  - Every task reaches exactly one downstream `spec_review`.
  - Every `spec_review` reaches `verify` before `quality_review`.
  - Every `quality_review` depends on `verify`.
  - Every terminal path reaches `final`.
  - No cycles.
  - No parallel-ready tasks have overlapping file scopes.
- It must execute only ready nodes according to graph dependencies.
- Group verification commands must live in and run from `verify-*` files, not task files.
- Quality review checkpoints must happen after verification nodes. If subagents are unavailable, the orchestrator performs local review and clearly notes it is local review.

**Subtasks:**
- [ ] Replace the overview in `skills/executing-plans/SKILL.md` with graph-execution wording. Keep the announcement sentence, but remove the old "execute all tasks" linear framing.
- [ ] Replace the note that says to always use `subagent-driven-development` when subagents are available with a narrower distinction: use `subagent-driven-development` for same-session subagent execution; use `executing-plans` for inline execution, separate-session execution, or no-subagent execution.
- [ ] Rewrite the process section with these phases:
  - Load `plan.md` and `project-network.dot`.
  - Validate graph.
  - Create a task list from graph nodes.
  - Execute ready `task` nodes locally, reading their task files and context docs.
  - Perform task-local spec checks before marking the corresponding `spec_review` passed.
  - Run `verify-*` commands at verify nodes after all upstream spec checks pass.
  - Run local or delegated quality review at `quality_review` nodes after verification passes.
  - Invoke `finishing-a-development-branch` after final node is reached.
- [ ] Add stop conditions for invalid graph, overlapping parallel file scopes, failed verification, unclear task instructions, and quality review issues.
- [ ] Update integration text to say `writing-plans` creates this graph and `finishing-a-development-branch` completes work after final.
- [ ] Update `pseudocode/executing-plans.tsx` to load the graph, validate it, iterate ready nodes, execute local tasks, run verify nodes, run quality review nodes, and finish at the final node. Remove `for (const task of plan.tasks)` and `runTaskVerifications(task)` as the central model.
- [ ] Add pseudocode guardrails for graph validity, verification ownership, no overlapping parallel file scopes, and final-only completion.

**Task-local checks:**
- Run `rg -n "for each task|plan.tasks|Run verifications as specified|linear|project-network.dot|quality_review|verify" skills/executing-plans/SKILL.md pseudocode/executing-plans.tsx`.
- Expected: no old linear "for each task" process as the primary model; both files mention `project-network.dot`, `verify`, and `quality_review`.
