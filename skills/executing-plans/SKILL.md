---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

## Overview

Execute `project-network.dot` from a written plan inline, in a separate session, or when subagents are unavailable or unauthorized. Read the plan, validate the graph, execute ready local task nodes, pass task-local spec gates, run verification fan-in nodes, perform quality review checkpoints, and finish only after the `final` node is reached.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**When to choose this skill:** Use `jj-superpowers:subagent-driven-development` for same-session execution with authorized subagents. Use this skill for inline execution, separate-session execution, or no-subagent execution of the same graph contract.

## The Process

### Step 1: Load the Graph
1. Read `plan.md` from the plan directory for the plan index and context doc list.
2. Read `project-network.dot` from the same plan directory.
3. Treat `project-network.dot` as the execution contract unless it is invalid or contradicts task files.

### Step 2: Validate the Graph

Before executing work, confirm:

- `plan.md` references `project-network.dot`.
- Every task node has `kind="task"`, `file`, and `files`.
- Every task node reaches exactly one downstream `spec_review`.
- Every `spec_review` reaches a `verify` node before any `quality_review`.
- The canonical terminal chain is `verify -> [simplification?] -> quality_review -> final`, where `simplification` is optional. A `quality_review` depends on a successful `verify` node, **or on a `simplification` node when one is present** (a `simplification` node itself depends on a successful `verify`).
- When the graph has API-stub task(s) that other tasks consume, a `design_review` node depends on the stub task(s)' `spec_review`(s), and every consumer task depends on that `design_review` node (gating consumer start). A graph with no shared API surface needs no `design_review` node.
- Every terminal path reaches `final`.
- No cycles exist.
- No parallel-ready task nodes have overlapping file scopes.

If validation fails, fix the plan only when the correction is mechanical and obvious. Otherwise stop and ask for clarification.

When asking, use the decision-checkpoint pattern from `jj-superpowers:using-superpowers`: present 2-3 concrete alternatives with a recommendation, and use the harness-native ask/question tool when available.

### Step 3: Create the Execution List

Track each node's state — pending, in progress, passed, failed, or blocked — against `project-network.dot` itself, not the harness task list (it doesn't survive subagent dispatch and drifts out of sync; see `jj-superpowers:using-superpowers`). Derive readiness from the graph, not from the order of files in the directory: only nodes whose dependencies have passed are ready.

### Step 4: Execute Ready Nodes

**Task nodes:** Execute ready `task` nodes locally. Read the node's task file, relevant context docs, and allowed file list from the node's `files` attribute. Follow the task file exactly and run only narrow, non-contended task-local checks named by that task file. Do not run group compile, build, lint, type-check, test-suite, or smoke-test commands here. `cargo check`, `cargo build`, and `cargo test` normally belong at `verify` nodes because they contend on shared target-directory state; run one in a task node only if the task file documents a concrete exception.

**Spec sync (when the project has `.agents/layout.yaml`)**: before editing any source file in a task node, MUST invoke `jj-superpowers:spec-code-sync` to run the candidate-spec lookup (surface specs likely relevant to touched paths), classify the change, and detect code-as-spec edits. The lookup is a hint, not a gate; the skill's findings may still require routing through `jj-superpowers:writing-specs` first.

**Spec review nodes:** After a task node reports done, perform the corresponding task-local spec check before marking its downstream `spec_review` passed. Confirm the implementation matches the task file, stays inside its file scope, and reports task-local checks honestly.

**Design review nodes:** When the graph has a `design_review` node, run it after its upstream API-stub task(s)' `spec_review` pass and **before dispatching or starting any consumer task** (the node gates consumer *start*, so a bad API is caught before implementations are produced). Judge **coherence only**, using the node's `rubric` (default `jj-superpowers:designing-with-types-and-abstractions`): right variation axis, illegal states unrepresentable, explicit effects, no leaky boundaries. Do **not** re-run type-checking — the stub task carries its own narrow task-local type-check, so consumers already fan out against a compiling stub. Classify any finding:
- **Local flaw** — the fix is contained to the stub task's own files and **does not change any type, signature, or symbol that a consumer task file references** (e.g. correcting an internal type, fixing documentation, adding a trait method no consumer cites yet, renaming a private helper). Re-dispatch/redo the stub task with the findings, re-run its `spec_review`, then re-run this `design_review`. No consumer task files change; **no user round-trip**. Reviewers never edit files — re-running the stub task does the work.
- **Structural flaw** — the fix changes a **consumer-referenced symbol/signature** (even a "small" one, because consumer task files must then be regenerated), or the choice of abstraction, a missing requirement, or a contradiction with the spec. Return **`STATUS: BLOCKED_STRUCTURAL`**, **pause the graph**, do not start consumers, and surface 2-3 concrete options to the user (decision-checkpoint pattern). On a design change, return to **`jj-superpowers:brainstorming`** so `jj-superpowers:writing-plans` regenerates the affected consumer task files and the affected portion of `project-network.dot`. (Returning to brainstorming is an executor-level escalation event, not a graph edge — the DAG stays acyclic.)

On genuine ambiguity between local and structural, **default to structural/escalate**: a wrongly-autonomous fix that silently leaves consumer task files stale is the exact failure this gate prevents. A signature tweak is local **only** when no consumer task references that signature.

**Verify nodes:** After all upstream `spec_review` nodes pass, run the commands from the referenced `verify-*` file. Group verification commands live in and run from `verify-*` files, not task files. Mark the `verify` node passed only when every command succeeds or when the user explicitly accepts the remaining failure.

**Simplification nodes:** A `simplification` node appears only in Full-tier graphs and only when the verified group introduced new helpers, utilities, or abstractions; when present it runs **after `verify` passes and before `quality_review`**. It is a **reviewer** node: apply the `jj-superpowers:deslopify` rubric (its duplication/under-engineering sections) and the `code-simplifier` lens to flag duplication of in-repo code, the standard library, or dependency functionality, and propose deletion/reuse of an existing API. Do not restate those checks — reuse them. Route accepted findings **back to an implementer** (reviewers never edit code, same pattern as `quality_review`); after the implementer applies fixes, **re-verify** the group. The node passes when it surfaces no accepted duplication/reduction finding, or all accepted findings have been routed back, fixed, and re-verified. The downstream `quality_review` then depends on this node, not directly on the `verify`.

**Quality review nodes:** After the upstream `verify` node passes (or, when present, the `simplification` node passes), run the quality review checkpoint for the verified group. If subagents are unavailable, perform local review and clearly note that it is local review. Do not run `quality_review` before verification passes.

**Final node:** Continue executing ready graph nodes until `final` is reached. Do not complete development from task completion alone.

### Step 5: Complete Development

After the `final` node is reached:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use jj-superpowers:finishing-a-development-branch
- Follow that skill to verify tests, present options, execute choice

## When to Stop and Ask for Help

**STOP executing immediately when:**
- `project-network.dot` is missing, invalid, cyclic, or not referenced by `plan.md`
- Parallel-ready task nodes have overlapping file scopes
- A task instruction or file ownership rule is unclear
- A task-local spec check fails
- A `verify` node fails and the failure cannot be resolved locally
- A `quality_review` node finds issues that require code or plan changes
- The graph cannot reach `final`

**Ask for clarification rather than guessing.**

Use the decision-checkpoint pattern from `jj-superpowers:using-superpowers` for these stops.

## Autonomy Level

In Rush, resolve these checkpoints per the Autonomy Level table in `jj-superpowers:using-superpowers`.

Manual (the default) is unchanged: every checkpoint above still pauses and asks. Rush removes only the human-wait — the automated review nodes (`spec_review`, `design_review`, `verify`, `quality_review`, `simplification`) STILL run; only their sign-off pauses are auto-resolved. Mapping onto the existing rules above:

- A **structural `design_review` flaw** (`BLOCKED_STRUCTURAL`, the return-to-brainstorming escalation) hits the safety floor and halts regardless of level.
- `BLOCKED` / `SCOPE: related` is resolved mechanically (add the edge, run the producer, split the task) and never deferred; if the resolution needs non-trivial scope expansion, halt for the user.
- `BLOCKED` / `SCOPE: unrelated` is noted as a separate task for later and execution continues.
- A `verify` / spec / `quality_review` / `simplification` failure auto-routes back and retries up to the canonical limit, then halts if still failing — but a failure diagnosed as structural at any attempt halts immediately via the structural floor rather than consuming retries.

## When to Revisit Earlier Steps

**Return to graph loading and validation when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember
- Review plan critically first
- Execute ready graph nodes according to dependencies
- Follow task files exactly
- Keep group verification commands in `verify-*` files
- Don't skip `spec_review`, `verify`, or `quality_review` gates
- Reference skills when plan says to
- Stop when blocked, don't guess
- Never start implementation on trunk without explicit user consent

## Integration

**Required workflow skills:**
- **jj-superpowers:writing-plans** - Creates the plan and `project-network.dot` this skill executes
- **jj-superpowers:finishing-a-development-branch** - Completes development after the `final` graph node

## Reporting Gaps

If you read multiple files or traced execution across modules to understand something
that a short documentation file could have explained immediately, use
**jj-superpowers:documentation** if the user wants the doc written now.

Continue with the user's requested work when possible; do not block on reporting gaps.
