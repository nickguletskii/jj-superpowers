---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

## Overview

Execute `project-network.dot` from a written plan inline, in a separate session, or when subagents are unavailable or unauthorized. Read the plan, validate the graph, execute ready local `task` nodes, pass each task's spec gate, run `verify` fan-in nodes, perform the quality review checkpoint for each verified group, and finish only after `final` — every `verify` node passed.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**When to choose this skill:** Use `jj-superpowers:subagent-driven-development` for same-session execution with authorized subagents. Use this skill for inline execution, separate-session execution, or no-subagent execution of the same graph contract.

## The Process

### Step 1: Load the Graph
1. Read `plan.md` from the plan directory for the plan index and context doc list.
2. Read `project-network.dot` from the same plan directory.
3. Treat `project-network.dot` as the execution contract unless it is invalid or contradicts task files.

### Step 2: Validate the Graph

The graph contract is the same one `jj-superpowers:subagent-driven-development` executes. Only `task` and `verify` nodes are authored; `spec_review`, `design_review`, `simplification`, `quality_review`, and `final` are **implied** — they always run, and you derive each one's trigger and scope from the graph. Run the checks in that skill's **Graph Validation** section (single source of truth) before executing work.

If validation fails, fix the plan only when the correction is mechanical and obvious. Otherwise stop and ask for clarification.

When asking, use the decision-checkpoint pattern from `jj-superpowers:using-superpowers`: present 2-3 concrete alternatives with a recommendation, and use the harness-native ask/question tool when available.

### Step 3: Create the Execution List

Track each node's state — pending, in progress, passed, failed, or blocked — against `project-network.dot` itself, not the harness task list (it doesn't survive subagent dispatch and drifts out of sync; see `jj-superpowers:using-superpowers`). Derive readiness from the graph, not from the order of files in the directory: only nodes whose dependencies have passed are ready.

An upstream node's implied gates are part of that dependency. A `task` is not passed until its spec review passes; a dependent of a `stub=true` task is not ready until that task's spec review **and** design review pass.

### Step 4: Execute Ready Nodes

**Task nodes:** Execute ready `task` nodes locally. Read the node's task file and the relevant context docs. Take the target file list from the node's `files` attribute and the allowed directory scopes from its `scopes` attribute — the task file does not restate them, and the graph is their only source. Follow the task file exactly, and run only the narrow, non-contended task-local checks that task file names. Contended commands (compile, build, lint, type-check, test suite, smoke test) belong at `verify` nodes — canonical rule, including the single `stub=true` scoped-type-check exception: **Verification Ownership** in `jj-superpowers:subagent-driven-development`.

**Never move the trunk bookmark or rewrite immutable/trunk commits without explicit user consent.**

**Spec sync (when the project has `.agents/layout.yaml`)**: before editing any source file in a task node, MUST invoke `jj-superpowers:spec-code-sync` to run the candidate-spec lookup (surface specs likely relevant to touched paths), classify the change, and detect code-as-spec edits. The lookup is a hint, not a gate; the skill's findings may still require routing through `jj-superpowers:writing-specs` first.

**Spec review (implied, after every task):** When a task node is done, perform its task-local spec check before treating the task as passed. Confirm the implementation matches the task file, stays inside the node's `files`/`scopes`, and reports task-local checks honestly.

**Design review (implied, after a `stub=true` task's spec review):** Run it **before starting any dependent of that task** — the gate protects consumer *start*, so a bad API is caught before implementations are produced against it. Judge **coherence only** against `jj-superpowers:designing-with-types-and-abstractions` (right variation axis, illegal states unrepresentable, explicit effects, no leaky boundaries). Do **not** re-run type-checking — the stub task carries its own narrow task-local type-check. Classify every finding **local** or **structural** by the decidability rule in `subagent-driven-development`'s **Design-Review Status** section, and apply the handling it prescribes: local → redo the stub task with the findings and re-run its spec review and this gate, no user round-trip; structural → `STATUS: BLOCKED_STRUCTURAL`, **pause the graph**, do not start dependents, surface 2-3 concrete options (decision-checkpoint pattern), and return to `jj-superpowers:brainstorming` so `jj-superpowers:writing-plans` regenerates the affected task files and the affected portion of `project-network.dot`. On ambiguity, default to structural.

**Verify nodes:** After every upstream task has passed spec review, run the commands from the referenced `verify-*` file. Group verification commands live in and run from `verify-*` files, not task files. Mark the `verify` node passed only when every command succeeds or when the user explicitly accepts the remaining failure.

**Simplification (implied, after a `simplify=true` verify passes):** Runs **after `verify` passes and before quality review**, scoped to that verify's task group (every `task` node reaching it). Apply the `jj-superpowers:deslopify` rubric (its duplication/under-engineering sections) and the `code-simplifier` lens to flag duplication of in-repo code, the standard library, or dependency functionality, and propose deletion/reuse of an existing API. Do not restate those checks — reuse them. It is the single owner of duplication detection. Apply accepted findings, then **re-verify** the group. It passes when no accepted duplication finding remains. A verify without `simplify=true` gets no simplification — there is no duplication risk to check.

**Quality review (implied, after every verify):** After the `verify` node passes — or after its simplification, when the verify is marked `simplify=true` — run the quality review checkpoint over that verify's task group. Its mandate is maintainability/production-risk only; duplication is owned by simplification. If subagents are unavailable, perform local review and clearly note that it is local review. Never run it before verification passes.

**Final (implied, when every `verify` node has passed):** Continue executing ready graph nodes until every `verify` has passed. Do not complete development from task completion alone.

### Step 5: Complete Development

After `final` is reached:
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
- Quality review finds issues that require code or plan changes
- The graph cannot reach `final`

**Ask for clarification rather than guessing.**

Use the decision-checkpoint pattern from `jj-superpowers:using-superpowers` for these stops.

## Autonomy Level

Manual (the default) is unchanged: every checkpoint above pauses and asks. In Rush, resolve each checkpoint per the **canonical Rush-resolution table** in `jj-superpowers:using-superpowers` — it is the single source of truth for the resolutions, the safety floor, and the retry constant `N`. Rush removes only the human sign-off wait; every implied gate STILL runs.

## When to Revisit Earlier Steps

**Return to graph loading and validation when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Integration

**Required workflow skills:**
- **jj-superpowers:writing-plans** - Creates the plan and `project-network.dot` this skill executes
- **jj-superpowers:finishing-a-development-branch** - Completes development after the `final` graph node

## Reporting Gaps

If you read multiple files or traced execution across modules to understand something that a short documentation file could have explained immediately, use **jj-superpowers:documentation** if the user wants the doc written now. Continue with the user's requested work when possible; do not block on reporting gaps.
