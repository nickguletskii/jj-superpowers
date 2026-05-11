# Architecture Context

## Current Workflow Model

`writing-plans` is the source of truth for implementation plan shape. Every full plan has:

- `plan.md` as the lightweight index.
- `project-network.dot` as the execution contract.
- `task-*` files for implementer-owned work.
- `verify-*` files for contended or group verification.
- Graph gates in this order: `task -> spec_review -> verify -> quality_review -> final`.

`subagent-driven-development` executes the graph with subagents. `executing-plans` should become the inline or separate-session executor for the same graph model.

## Skill Boundaries

- `requesting-code-review` should be ad hoc/manual review. Planned graph execution uses `quality_review` nodes and `subagent-driven-development/code-quality-reviewer-prompt.md`.
- `using-jj-worksets` is post-implementation guidance for organizing `toorg:` commits; it is not an after-design work-scope setup skill.
- `jj-reorg-changes` organizes `toorg:` implementation commits into a reviewable DAG.
- `jj-clean-history` is for arbitrary messy jj history outside the `toorg:` implementation workflow.
- `dispatching-parallel-agents` is now scoped to ad hoc parallel investigations when subagents are authorized.

## Platform Boundary

This repo supports multiple agent environments. Generic skills must not present Claude Code-only commands such as `/sandbox` or `Task(...)` as universal. Platform-specific guidance can appear in clearly labeled subsections or platform reference files.

## Non-Goals

- Do not rename skill directories.
- Do not redesign `writing-plans` or `subagent-driven-development`.
- Do not edit historical specs/plans unless an active README or skill points at them as current guidance.
- Do not add executable validation tooling unless a task explicitly chooses it; a checklist is enough for this pass.
