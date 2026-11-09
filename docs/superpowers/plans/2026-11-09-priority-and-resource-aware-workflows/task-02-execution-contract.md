# Task 2: Execution and planning contract

**Purpose:** Make task-level independent review risk-selected instead of automatic, move consolidation and readiness to the acceptance point, and combine requirements and quality into one group review. Graph syntax and file ownership stay the same.

**Risk:** shared contract across `subagent-driven-development`, `executing-plans`, and `writing-plans`. The group review after `verify_01` checks the three for consistency.

**Reuse:** `## Sorting work`, `## Interruptions`, `## When to verify`, and `## Choosing evidence` from task 01 (read the landed files). The spec's "Risk-based review and completion" section, and the vocabulary in `context/conventions.md`.

**Interfaces and Invariants:**
- The authored node kinds and attributes are unchanged: `task` (`file`, `files`, optional `scopes`, `stub`) and `verify` (`file`, optional `simplify`).
- The implied gates become:
  - `spec_review`: runs only when a task carries a `**Risk:**` line, the executor records a risk, or the user or project requires it. Its scope is that task. The agent and name `sdd-spec-reviewer` stay.
  - `design_review`: unchanged. A `stub=true` task needs it before consumers start.
  - `simplification`: runs when `simplify=true` is explicitly authored. `writing-plans` tells new plans to set it only for a concrete abstraction concern; otherwise duplication checks belong to the group review.
  - `quality_review`: now the group review of requirements and quality. It runs after a verify node passes (after `simplification` when present).
  - `final`: unchanged.
- Order per task: implement and self-review → file → risk-required review if any (a failure goes back to the implementer) → consolidate at the acceptance point → design review if `stub=true`. A routed-back fix re-enters at the review that sent it back, or at self-review if no review did.
- A task is ready for consumers at its acceptance point. A group is complete when its verify succeeds and every selected review has passed.
- A required review (risk, user, or project) is never skipped silently.
- Verification Ownership is unchanged in substance. Add that implementers run only the checks their task file names, and that verifiers reuse valid output and never check out or build earlier revisions unless the verify file names a justified question (point at `## Choosing evidence`).

**Subtasks:**
- [ ] `subagent-driven-development`: update the description line, the opening paragraph, the implied-gates table, the per-task order, the dispatch table rows for `spec_review`/`quality_review`/`verify`, "Consolidate on spec-review pass" (rename it to the acceptance point), and the Implementer status `DONE` line. Add a short paragraph on how the executor selects risk-required reviews: the `**Risk:**` line, the executor's own finding, or an explicit request; record the reason in the dispatch context.
- [ ] `subagent-driven-development`: add one sentence pointing new reports that arrive mid-run to `## Interruptions`, and the ordering of ready nodes to `## Sorting work` (the critical path and blockers first, within graph readiness).
- [ ] `executing-plans`: update step 3 (readiness) and step 5 (gates) to the new acceptance point. Inline execution uses the same risk selection. The "spec check fails" stop condition becomes "a required review fails".
- [ ] `writing-plans`: document the optional `**Risk:**` line in the task-file template and when to write it. Narrow the `simplify=true` guidance. In the execution handoff, change "per-task spec review" to "risk-selected task review". Add a short note on which checks are task-local and which belong to a verify node (point at Verification Ownership; don't restate it).
- [ ] `project-network-validation-scenarios.md`: update the intro and every "Expected behavior" that assumes automatic spec review. Add scenarios for (a) a routine task with no review before verify, (b) a `**Risk:**` task whose review gates its consumers, (c) an API producer whose design review precedes its consumers, (d) non-overlapping tasks sharing one verify node with one group review, and (e) a new report arriving mid-run that is triaged and queued, not switched to.
- [ ] `plan-document-reviewer-prompt.md`: align any check that expects per-task spec review or severity ordering with the new contract.
