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
- Every `quality_review` depends on a successful `verify` node.
- Every terminal path reaches `final`.
- No cycles exist.
- No parallel-ready task nodes have overlapping file scopes.

If validation fails, fix the plan only when the correction is mechanical and obvious. Otherwise stop and ask for clarification.

### Step 3: Create the Execution List

Create a task list from graph nodes, not from the order of files in the directory. Track each node as pending, in progress, passed, failed, or blocked. Only nodes whose dependencies have passed are ready.

### Step 4: Execute Ready Nodes

**Task nodes:** Execute ready `task` nodes locally. Read the node's task file, relevant context docs, and allowed file list from the node's `files` attribute. Follow the task file exactly and run only narrow, non-contended task-local checks named by that task file. Do not run group compile, build, lint, type-check, test-suite, or smoke-test commands here. `cargo check`, `cargo build`, and `cargo test` normally belong at `verify` nodes because they contend on shared target-directory state; run one in a task node only if the task file documents a concrete exception.

**Spec review nodes:** After a task node reports done, perform the corresponding task-local spec check before marking its downstream `spec_review` passed. Confirm the implementation matches the task file, stays inside its file scope, and reports task-local checks honestly.

**Verify nodes:** After all upstream `spec_review` nodes pass, run the commands from the referenced `verify-*` file. Group verification commands live in and run from `verify-*` files, not task files. Mark the `verify` node passed only when every command succeeds or when the user explicitly accepts the remaining failure.

**Quality review nodes:** After the upstream `verify` node passes, run the quality review checkpoint for the verified group. If subagents are unavailable, perform local review and clearly note that it is local review. Do not run `quality_review` before verification passes.

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

**If you encounter a command invocation issue** that could have been prevented by information in a skill, invoke **jj-superpowers:wish-i-knew** to log it — but only if:
- the relevant information is genuinely absent from existing skills, OR
- a skill has the information but its phrasing or trigger condition wasn't clear enough that you recognised you should use it at the right moment.

Do NOT invoke for issues caused by simply forgetting something a skill already documents clearly.

**If you find yourself doing something tedious, error-prone, or repetitive** that a reusable tool or script could automate but doesn't exist yet, invoke **jj-superpowers:wish-i-had** to log it.

**If you read multiple files or traced execution across modules** to understand something that a short documentation file could have explained immediately, invoke **jj-superpowers:documentation** to create that document.

Log and continue — do not block your task on logging.
