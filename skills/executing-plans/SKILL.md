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

The graph contract is the same one `jj-superpowers:subagent-driven-development` executes. Run the checks in that skill's **Graph Validation** section (single source of truth) before executing work.

If validation fails, fix the plan only when the correction is mechanical and obvious. Otherwise stop and ask for clarification.

When asking, use the decision-checkpoint pattern from `jj-superpowers:using-superpowers`: present 2-3 concrete alternatives with a recommendation, and use the harness-native ask/question tool when available.

### Step 3: Create the Execution List

Track each node's state — pending, in progress, passed, failed, or blocked — against `project-network.dot` itself, not the harness task list (it doesn't survive subagent dispatch and drifts out of sync; see `jj-superpowers:using-superpowers`). Derive readiness from the graph, not from the order of files in the directory: only nodes whose dependencies have passed are ready.

An upstream node's implied gates are part of that dependency. A `task` is not passed until its spec review passes; a dependent of a `stub=true` task is not ready until that task's spec review **and** design review pass.

### Step 4: Execute Ready Nodes

**Task nodes:** Execute ready `task` nodes locally. Read the node's task file and the relevant context docs. Take the target file list from the node's `files` attribute and the allowed directory scopes from its `scopes` attribute — the task file does not restate them, and the graph is their only source. Follow the task file exactly, and run only the task-local checks it names (contended-command rule: **Verification Ownership** in `jj-superpowers:subagent-driven-development`).

**Never move the trunk bookmark or rewrite immutable/trunk commits without explicit user consent.**

**Spec sync (when the project has `.agents/layout.yaml`)**: before editing any source file in a task node, MUST invoke `jj-superpowers:spec-code-sync` to run the candidate-spec lookup (surface specs likely relevant to touched paths), classify the change, and detect code-as-spec edits. The lookup is a hint, not a gate; the skill's findings may still require routing through `jj-superpowers:writing-specs` first.

**Gates:** Run the same implied gates locally per `jj-superpowers:subagent-driven-development` — its Graph Contract owns each gate's trigger, scope, and order; its Design-Review Status owns local-vs-structural handling; the role bodies in `agents/sdd-*.md` are the rubrics. Inline, you perform each review yourself and note that it is a local review. Mark a `verify` node passed only when every command succeeds or the user explicitly accepts the remaining failure. Keep executing ready nodes until `final` — every `verify` passed; task completion alone is not done.

### Step 5: Complete Development

After `final` is reached, run the Finish checks in the Change Consolidation section of `jj-superpowers:subagent-driven-development`, then ask the user what to integrate (decision-checkpoint pattern; a bookmark + push per `jj-superpowers:jujutsu`, or keep as-is).

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

Under Rush, resolve every checkpoint above per `jj-superpowers:using-superpowers` `references/autonomy.md`; every implied gate still runs.

## When to Revisit Earlier Steps

**Return to graph loading and validation when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Integration

**Required workflow skills:**
- **jj-superpowers:writing-plans** - Creates the plan and `project-network.dot` this skill executes

## Reporting Gaps

If you read multiple files or traced execution across modules to understand something that a short documentation file could have explained immediately, use **jj-superpowers:documentation** if the user wants the doc written now. Continue with the user's requested work when possible; do not block on reporting gaps.
