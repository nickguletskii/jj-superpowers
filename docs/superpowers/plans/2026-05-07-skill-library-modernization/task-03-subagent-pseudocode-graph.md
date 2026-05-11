# Task 3: Subagent-Driven Development Pseudocode Parity

**Files:**
- Modify: `pseudocode/subagent-driven-development.tsx`

**Purpose:** Align the pseudocode with the current `skills/subagent-driven-development/SKILL.md` graph-first workflow.

**Interfaces and invariants:**
- Source skill remains `skills/subagent-driven-development/SKILL.md`.
- Pseudocode must model graph execution, not `plan.tasks`.
- Pseudocode must include these stages:
  - load `plan.md` and `project-network.dot`
  - validate graph
  - dispatch ready non-conflicting task implementers
  - handle `DONE`, `DONE_WITH_CONCERNS`, `NEEDS_CONTEXT`, and `BLOCKED`
  - run per-task spec review
  - run `verify` nodes as fan-in gates
  - run group `quality_review` only after verification passes
  - route failures back to responsible task nodes
  - invoke `finishing-a-development-branch` only after final node
- Pseudocode must not dispatch a final whole-implementation reviewer unless the source skill also says to do so.

**Subtasks:**
- [ ] Replace `const plan = loadPlan(ctx); createTodoListFromPlan(plan); for (const task of plan.tasks) ...` with graph-loading and ready-node traversal pseudocode.
- [ ] Model task node execution by dispatching implementers for ready non-conflicting task nodes.
- [ ] Model spec review as a per-task gate before verification.
- [ ] Model verify nodes as reducers that run after all upstream spec reviews pass.
- [ ] Model quality review nodes as group-level review after the upstream verify node passes.
- [ ] Replace `reviewOrderIsSpecThenQuality` with a guardrail that checks `task -> spec_review -> verify -> quality_review -> final`.
- [ ] Add guardrails for no overlapping parallel task file scopes and no quality review before verification.
- [ ] Remove `dispatch("final-code-reviewer", summarizeWholeImplementation(ctx));`.

**Task-local checks:**
- Run `rg -n "plan.tasks|final-code-reviewer|project-network.dot|verify|quality_review|ready" pseudocode/subagent-driven-development.tsx`.
- Expected: no `plan.tasks` or `final-code-reviewer`; graph, verify, quality review, and ready-node concepts are present.
