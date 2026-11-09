---
name: executing-plans
description: Use when executing a written plan's project-network.dot inline — in a separate session, or when subagents are unavailable or not authorized. With authorized subagents in the same session, use subagent-driven-development instead.
---

# Executing Plans

This executes the same graph contract as `subagent-driven-development`, with you doing each node's work and review yourself.

1. **Load.** Read `plan.md` and `project-network.dot` from the plan directory. The graph is the execution contract unless it's invalid or contradicts the task files.
2. **Validate** with the Graph Validation checks in `subagent-driven-development`. Fix the plan only when the correction is mechanical and obvious; otherwise ask, using the decision-checkpoint pattern from `using-superpowers`.
3. **Track** each node's state (pending, in progress, passed, failed, blocked) against the graph, not the harness task list. A node is ready only when its dependencies have reached their acceptance point (Graph Contract in `subagent-driven-development`): self-reviewed and filed, plus any risk-selected task review, plus design review for a `stub=true` task.
4. **Execute ready tasks.** Read the task file and relevant context docs. Target files come from the node's `files` attribute and allowed scopes from `scopes`; the task file doesn't restate them. Run only the task-local checks the task names (Verification Ownership in `subagent-driven-development`).
   - In a project with `.agents/layout.yaml`, invoke `spec-code-sync` before editing any source file. Its lookup is a hint; its findings may still route through `writing-specs` first.
   - Never move the trunk bookmark or rewrite immutable or trunk commits without explicit user consent.
5. **Run the implied gates** locally as defined by the Graph Contract and Design-Review Status in `subagent-driven-development`, using the `agents/sdd-*.md` bodies as rubrics; note that each review is local. Select task review by risk exactly as there. A verify node passes only when every command succeeds or the user explicitly accepts the remaining failure. Continue until `final` (every verify passed) — finishing the tasks alone isn't done.
6. **Finish.** Run the Finish checks in `subagent-driven-development` Change Consolidation, then ask what to integrate (a bookmark + push per `jujutsu`, or keep as-is).

## Stop and ask

Stop rather than guess when:
- `project-network.dot` is missing, invalid, cyclic, or not referenced by `plan.md`
- parallel-ready tasks have overlapping file scopes
- a task instruction or file-ownership rule is unclear
- a required review fails, or a verify failure can't be resolved locally
- quality review requires code or plan changes
- the graph cannot reach `final`

Return to step 1 when the plan is updated or the approach needs rethinking. Under Rush, resolve these checkpoints per `using-superpowers` `references/autonomy.md`; every derived or risk-selected gate still runs.
