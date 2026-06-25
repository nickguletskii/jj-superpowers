---
name: subagent-driven-development
description: Use when executing implementation plans that include project-network.dot in the current session
---

# Subagent-Driven Development

Execute `project-network.dot` from a written plan. Dispatch fresh implementer subagents for ready task nodes, run per-task spec review, batch contended verification commands at verify nodes, then run group-level code-quality review.

**Core principle:** task fan-out + per-task spec gates + verification fan-in + group quality review.

## When to Use

```dot
digraph when_to_use {
    "Have plan with project-network.dot?" [shape=diamond];
    "Stay in this session?" [shape=diamond];
    "subagent-driven-development" [shape=box];
    "executing-plans" [shape=box];
    "Manual execution or brainstorm first" [shape=box];

    "Have plan with project-network.dot?" -> "Stay in this session?" [label="yes"];
    "Have plan with project-network.dot?" -> "Manual execution or brainstorm first" [label="no"];
    "Stay in this session?" -> "subagent-driven-development" [label="yes"];
    "Stay in this session?" -> "executing-plans" [label="no"];
}
```

This skill is graph-first. A one-task plan is still executed through the same graph model.

## Graph Contract

Read `plan.md` and `project-network.dot`. Treat the graph as authoritative unless it is invalid or contradicts the task files.

Node kinds:

| Kind | Executor | Gate |
|------|----------|------|
| `task` | implementer subagent | files changed and filed |
| `spec_review` | spec reviewer subagent | task matches its task file |
| `design_review` | design reviewer subagent (`sdd-design-reviewer`) | stubbed API is coherent |
| `verify` | verification subagent or orchestrator command runner | commands exit successfully |
| `simplification` | simplification reviewer subagent (`sdd-simplifier`) | no accepted duplication remains, or accepted findings routed back, fixed, and re-verified |
| `quality_review` | code quality reviewer subagent | verified group is maintainable |
| `final` | orchestrator | all upstream gates passed |

Edges mean "source node must pass before target node may run."

## The Process

```dot
digraph process {
    rankdir=TB;

    "Read plan.md and project-network.dot" [shape=box];
    "Validate graph" [shape=box];
    "Ready task nodes?" [shape=diamond];
    "Fan-out: emit all ready Agent calls\nin one response" [shape=box];
    "Fan-in: wait for all results" [shape=box];
    "Any implementer asks questions\nor blocks?" [shape=diamond];
    "Answer, amend plan, or re-dispatch" [shape=box];
    "Task filed as toorg change" [shape=box];
    "Run task spec review" [shape=box];
    "Spec review passes?" [shape=diamond];
    "Return to implementer for task fix" [shape=box];
    "design_review node ready?\n(API stub spec review passed)" [shape=diamond];
    "Run design_review (coherence only)" [shape=box];
    "design_review outcome?" [shape=diamond];
    "Local flaw: re-dispatch stub implementer\nwith findings" [shape=box];
    "BLOCKED_STRUCTURAL: pause graph,\nsurface options, return to brainstorming" [shape=box];
    "Ready verify node?" [shape=diamond];
    "Run batched verification commands" [shape=box];
    "Verification passes?" [shape=diamond];
    "Return failures to responsible task nodes" [shape=box];
    "simplification node present?\n(group added new helpers)" [shape=diamond];
    "Run simplification review" [shape=box];
    "Simplification passes?" [shape=diamond];
    "Route findings back to implementer,\nthen re-verify" [shape=box];
    "Run group code-quality review" [shape=box];
    "Quality review passes?" [shape=diamond];
    "Return to responsible implementer" [shape=box];
    "Final node reached?" [shape=diamond];
    "Use jj-superpowers:finishing-a-development-branch" [shape=box];

    "Read plan.md and project-network.dot" -> "Validate graph";
    "Validate graph" -> "Ready task nodes?";
    "Ready task nodes?" -> "Fan-out: emit all ready Agent calls\nin one response" [label="yes"];
    "Fan-out: emit all ready Agent calls\nin one response" -> "Fan-in: wait for all results";
    "Fan-in: wait for all results" -> "Any implementer asks questions\nor blocks?";
    "Any implementer asks questions\nor blocks?" -> "Answer, amend plan, or re-dispatch" [label="yes"];
    "Answer, amend plan, or re-dispatch" -> "Ready task nodes?";
    "Any implementer asks questions\nor blocks?" -> "Task filed as toorg change" [label="no"];
    "Task filed as toorg change" -> "Run task spec review";
    "Run task spec review" -> "Spec review passes?";
    "Spec review passes?" -> "Return to implementer for task fix" [label="no"];
    "Return to implementer for task fix" -> "Run task spec review";
    "Spec review passes?" -> "design_review node ready?\n(API stub spec review passed)" [label="yes"];
    "design_review node ready?\n(API stub spec review passed)" -> "Run design_review (coherence only)" [label="yes"];
    "design_review node ready?\n(API stub spec review passed)" -> "Ready verify node?" [label="no"];
    "Run design_review (coherence only)" -> "design_review outcome?";
    "design_review outcome?" -> "Local flaw: re-dispatch stub implementer\nwith findings" [label="local"];
    "Local flaw: re-dispatch stub implementer\nwith findings" -> "Run task spec review";
    "design_review outcome?" -> "BLOCKED_STRUCTURAL: pause graph,\nsurface options, return to brainstorming" [label="structural"];
    "design_review outcome?" -> "Ready verify node?" [label="pass: fan out consumers"];
    "Ready verify node?" -> "Run batched verification commands" [label="yes"];
    "Ready verify node?" -> "Ready task nodes?" [label="no"];
    "Run batched verification commands" -> "Verification passes?";
    "Verification passes?" -> "Return failures to responsible task nodes" [label="no"];
    "Return failures to responsible task nodes" -> "Run task spec review";
    "Verification passes?" -> "simplification node present?\n(group added new helpers)" [label="yes"];
    "simplification node present?\n(group added new helpers)" -> "Run simplification review" [label="yes"];
    "simplification node present?\n(group added new helpers)" -> "Run group code-quality review" [label="no"];
    "Run simplification review" -> "Simplification passes?";
    "Simplification passes?" -> "Route findings back to implementer,\nthen re-verify" [label="no"];
    "Route findings back to implementer,\nthen re-verify" -> "Run task spec review";
    "Simplification passes?" -> "Run group code-quality review" [label="yes"];
    "Run group code-quality review" -> "Quality review passes?";
    "Quality review passes?" -> "Return to responsible implementer" [label="no"];
    "Return to responsible implementer" -> "Run task spec review";
    "Quality review passes?" -> "Final node reached?" [label="yes"];
    "Final node reached?" -> "Ready task nodes?" [label="no"];
    "Final node reached?" -> "Use jj-superpowers:finishing-a-development-branch" [label="yes"];
}
```

## Graph Validation

Before dispatching work, check:

- `plan.md` references `project-network.dot`.
- Every task node has `kind="task"`, `file`, `files`, and optionally `scopes`.
- Every task node reaches exactly one downstream `spec_review`.
- Every `spec_review` reaches a `verify` node before any `quality_review`.
- The terminal chain is `verify -> [simplification?] -> quality_review -> final`. A `quality_review` depends on a successful `verify` node directly when no `simplification` node is present, **or** on the `simplification` node when one is present.
- A `simplification` node (present only when the verified group introduced new helpers/abstractions) depends on a successful `verify` node, and its downstream `quality_review` depends on it.
- When a graph has consumed API-stub task(s), a `design_review` node depends on the stub task(s)' `spec_review`(s), and every consumer task depends on the `design_review` node (gating consumer start).
- Every terminal path reaches `final`.
- No cycles.
- No ready-to-run parallel task nodes have overlapping `files` attributes (Target Files conflict check).

If the graph is invalid, fix the plan if the correction is mechanical and obvious. Otherwise ask the user before execution.

## Dispatch Rules

Prefer named role agents when the platform supports them. Pass only dynamic invocation context in the task message: graph node id, task or verification file path, relevant context paths, target file list, allowed directory scopes, upstream reports, verification report, and orchestrator notes. Keep durable role behavior in the named agent's system/developer prompt.

**Parallel Dispatch Mechanics:** When multiple task nodes (or spec reviews) are ready and non-conflicting, dispatch them all by making multiple Agent tool calls in a **single response** — not one call per turn. Do not announce dispatch in a text turn and then make Agent calls in subsequent turns; that pattern produces sequential execution regardless of stated intent.

Default to **3–5 concurrent subagents** unless the user specifies otherwise. Maximize parallelism: keep all available slots filled at all times. When a subagent completes and a slot opens, immediately dispatch the next ready task — do not wait for other in-flight agents to finish first. Graph dependencies still govern sequencing: a `verify` node cannot start until all its upstream tasks have passed spec review, but there is no need to hold back dispatch just to form a tidy batch.

If the harness supports Worfklows, you may use them to fan out even more.

**Subagent freshness:** By default, fresh subagents should handle every node — clean context reduces noise. When routing spec review or code-quality failures back to an implementer, dispatch a new subagent with the review report and relevant context rather than reusing the original session.

**Exception — complex tasks:** If a task file flags a node as complex, or if the implementer returns `DONE_WITH_CONCERNS`, retain the session identifier. Route spec review and code-quality failures back to the original session (`SendMessage` in Claude Code) rather than a fresh agent — the original implementer holds design decisions and implementation reasoning that a fresh agent would waste time reconstructing. Switch to a fresh agent anyway when: the original session has grown long or context-heavy; the fix requires a fundamentally different approach; or the session is no longer reachable.

**No nested harnesses:** Subagents must not launch or delegate to another agent harness through shell commands or CLI tools (`claude`, `codex`, `gemini`, `opencode`, Copilot CLI, etc.). If a subagent thinks another agent, role, model, or broader context is needed, it reports `NEEDS_CONTEXT` or `BLOCKED`; the orchestrator decides whether to dispatch more agents.

| Graph role | Named agent | Fallback prompt template |
|------------|-------------|--------------------------|
| `task` | `sdd-implementer` | `./implementer-prompt.md` |
| `spec_review` | `sdd-spec-reviewer` | `./spec-reviewer-prompt.md` |
| `design_review` | `sdd-design-reviewer` | `./design-reviewer-prompt.md` |
| `verify` | `sdd-verifier` | `./verification-prompt.md` |
| `simplification` | `sdd-simplifier` | `./simplification-prompt.md` |
| `quality_review` | `sdd-quality-reviewer` | `./code-quality-reviewer-prompt.md` |
| jj filing helper | `sdd-jj-coordinator` | `./jj-coordinator-prompt.md` |

Platform locations:

| Platform | Project/user agent files | Invocation |
|----------|--------------------------|------------|
| Claude Code | plugin `agents/*.md`, `.claude/agents/*.md`, or `~/.claude/agents/*.md` | `Task` with the named agent |
| Codex | `.codex/agents/*.toml` or `~/.codex/agents/*.toml` | `spawn_agent(agent_type="<name>", message=...)` when custom agents are available |
| OpenCode | plugin-registered agents, `.opencode/agents/*.md`, or `~/.config/opencode/agents/*.md` | `@<name>` or Task tool with the named subagent |

If named agents are unavailable, use the fallback prompt templates exactly as before by filling the dynamic placeholders into the subagent message.

**Task nodes:** Dispatch `sdd-implementer` or fallback `./implementer-prompt.md`. Pass the task file path, relevant context docs, target file list from the node's `files` attribute, allowed directory scopes from the node's `scopes` attribute (if any), and any dynamic annotations from upstream completed nodes.

**Spec review nodes:** Dispatch `sdd-spec-reviewer` or fallback `./spec-reviewer-prompt.md` after each task reports `DONE` or `DONE_WITH_CONCERNS`. Spec review is task-local and happens before verification fan-in.

**Design review nodes:** Dispatch `sdd-design-reviewer` or fallback `./design-reviewer-prompt.md` after the API-stub task(s)' spec review(s) pass and before any consumer task starts. Pass the stub task file path, the stubbed surface, and the node's `rubric` (defaulting to `designing-with-types-and-abstractions`). The reviewer judges API *coherence* only and never edits files; it reports a local flaw (re-dispatch the stub implementer to fix and re-stub), `STATUS: BLOCKED_STRUCTURAL` (pause and escalate — see Design-Review Status under BLOCKED Handling), or pass (fan out consumers).

**Verify nodes:** Run the commands from the referenced `verify-*.md` file after all upstream spec reviews pass. Use `sdd-verifier` or fallback `./verification-prompt.md` when logs may be long or when summarization is useful. Most build tools only support one build/test suite at a time, so verification nodes are batched reduction points.

Verification commands and reports should follow `jj-superpowers:tool-output-discipline`: prefer quiet, structured, scoped, or filtered output, and expand only when concise output is insufficient for diagnosis.

**Simplification nodes:** Dispatch `sdd-simplifier` or fallback `./simplification-prompt.md` after the upstream verify node passes, when the verified group introduced new helpers, utilities, or abstractions. It is the single owner of duplication detection. Its method reuses the `deslopify` skill (its under-engineering/duplication guidance) and the `code-simplifier` agent — it does not restate their checks. Findings route back to an implementer, which applies fixes; the group then re-verifies. Pass the node's `scope` (the verified task-group ids).

**Quality review nodes:** Dispatch `sdd-quality-reviewer` or fallback `./code-quality-reviewer-prompt.md` after the upstream verify node passes — or after the `simplification` node when one is present. The review scope is the verified task group, not necessarily a single task. Its mandate is maintainability/production-risk only; duplication detection is owned by `simplification`, not `quality_review`.

**Final nodes:** After every upstream quality review passes, use `jj-superpowers:finishing-a-development-branch`.

## Verification Ownership

Implementers may run narrow task-local checks only when the task file names them. Implementers do not own group compile, test, lint, type-check, build, or smoke-test verification.

`cargo check`, `cargo build`, and `cargo test` are normally verification-node commands even when package-scoped or test-filtered, because they contend on shared target-directory state. A task file may name one only when it documents why that command is safe and necessary for the task.

**Sanctioned exception — API-stub type-check.** An API-stub task whose surface is gated by a `design_review` node MAY run a narrow, task-file-documented scoped type-check (e.g. `cargo check -p <crate> -q`) so consumers fan out against a compiling stub. Because `design_review` reviews coherence, not compilation, this scoped check is the one place a compile command belongs in a task. This is the single sanctioned exception; it does not otherwise weaken the contended-command rule.

When implementers run an allowed task-local command, they should use `jj-superpowers:tool-output-discipline` and report concise results.

Spec reviewers inspect implementation against the task file. They do not run group verification commands.

Verification nodes own the authoritative command results for their upstream group.

Code-quality reviewers inspect the verified group and the verification report. They do not rerun the same commands unless code inspection gives a concrete reason to believe the report is stale, incomplete, or contradicted by the diff.

## Model Selection

Use the least powerful model that can handle each role:

- Mechanical tasks with clear files and APIs: fast, cheap model.
- Implementations: strongest model.
- Integration tasks, ambiguous failures, or cross-file coordination: standard model.
- Graph repair, design judgment, and code-quality review: strongest available model.
- Verification summarization with long logs: cheap model if no debugging is needed; stronger model if failure diagnosis is required.

## Handling Implementer Status

Implementer subagents report one of four statuses.

**DONE:** Run the task's `spec_review` node.

**DONE_WITH_CONCERNS:** Read concerns. If they affect correctness or scope, address them before spec review. If they are observations, include them for reviewers and proceed. Retain this session's identifier — the task is now considered complex and review failures should be routed back to it (see Subagent Freshness in Dispatch Rules).

**NEEDS_CONTEXT:** Provide missing context and re-dispatch.

**BLOCKED:** Assess the blocker:

1. If it is a context problem, provide more context and re-dispatch.
2. If the task requires more reasoning, re-dispatch with a more capable model.
3. If the task is too large, split it and update `project-network.dot`.
4. If the plan is wrong, amend the plan if mechanical or ask the user.

Never force the same model to retry without changing instructions, context, or task shape.

When asking the user to choose between valid paths, the orchestrator uses the decision-checkpoint pattern from `jj-superpowers:using-superpowers`: present 2-3 concrete alternatives with a recommendation, and use the harness-native ask/question tool when available.

Subagents cannot use ask/question tools. If a subagent needs a user decision, it must report `NEEDS_CONTEXT` or `BLOCKED` with 2-3 concrete options; the orchestrator asks the user and then re-dispatches or amends the plan.

## BLOCKED Handling

When an implementer reports `STATUS: BLOCKED`, read `SCOPE`.

### `SCOPE: related`

The blocker is a dependency inside this plan.

1. If another graph node produces the missing thing, add or correct the dependency edge and run the producer first.
2. If a new task is needed, add a task file, update `plan.md`, and update `project-network.dot`.
3. If the new work is non-trivial, ask the user before expanding scope.

### `SCOPE: unrelated`

The blocker is a pre-existing gap outside this work scope. Pause and surface options:

> "Implementer for [task] is blocked by a pre-existing issue: [DETAIL].
> Options:
> 1. Add a fix to this plan
> 2. Note it as a separate task for later
> 3. Provide guidance and unblock manually"

Act on the user's choice and update the plan if execution graph changes.

### Design-Review Status (`STATUS: BLOCKED_STRUCTURAL`)

`design_review` is a distinct, design-review-only status, separate from implementer `BLOCKED`. The reviewer charter is **coherence only** (rubric `designing-with-types-and-abstractions`: right variation axis, illegal states unrepresentable, explicit effects, no leaky boundaries) — it does NOT recompile. Reviewers never edit files. The node reports one of:

- **Local flaw** — the fix is contained to the stub task's own files and changes no type, signature, or symbol a consumer task file references (e.g. fixing the stub's internal type or docs, adding a trait method no consumer cites yet, renaming a private helper). The orchestrator **re-dispatches the stub implementer** with the findings to fix and re-stub, then re-runs the stub's spec review. No consumer task files change; **no user round-trip**.
- **Structural flaw → `STATUS: BLOCKED_STRUCTURAL`** — the fix changes a consumer-referenced symbol/signature, or the choice of abstraction, a missing requirement, or a contradiction with the spec. The orchestrator **pauses the graph**, does **not** dispatch consumers, surfaces 2–3 concrete options to the user (decision-checkpoint pattern), and returns to **brainstorming**; `writing-plans` then regenerates the affected consumer task files and the affected portion of `project-network.dot`. "Return to brainstorming" is an executor-level escalation event, not a graph edge — the DAG stays acyclic.

**Decidability rule:** classify as **structural** (escalate) iff the fix changes a consumer-referenced symbol/signature or touches the abstraction/requirements; otherwise **local**. A signature tweak is local **only** when no consumer task references that signature. On genuine ambiguity, **default to structural**.

## Autonomy Level

In Rush, resolve these checkpoints per the Autonomy Level table in `jj-superpowers:using-superpowers`.

Manual (the default) is unchanged: every checkpoint above still pauses and asks. Rush removes only the human-wait — the automated review nodes (`spec_review`, `design_review`, `verify`, `quality_review`, `simplification`) STILL run; only their sign-off pauses are auto-resolved. Mapping onto the existing handling above:

- A **structural `design_review` flaw** (`STATUS: BLOCKED_STRUCTURAL`, the return-to-brainstorming escalation) hits the safety floor and halts regardless of level.
- `BLOCKED` / `SCOPE: related` is resolved mechanically (add the edge, run the producer, split the task) and never deferred; if the resolution needs non-trivial scope expansion, halt for the user.
- `BLOCKED` / `SCOPE: unrelated` is noted as a separate task for later and execution continues.
- A `verify` / `spec_review` / `quality_review` / `simplification` failure auto-routes back and retries up to the canonical limit, then halts if still failing — but a failure diagnosed as structural at any attempt halts immediately via the structural floor rather than consuming retries.

## Prompt Templates

- `./implementer-prompt.md` - task node implementer
- `./spec-reviewer-prompt.md` - per-task spec review node
- `./design-reviewer-prompt.md` - design review node (API-stub coherence)
- `./verification-prompt.md` - verify node command runner
- `./simplification-prompt.md` - simplification review node (duplication detection)
- `./code-quality-reviewer-prompt.md` - group quality review node
- `./jj-coordinator-prompt.md` - low-level jj filing helper when needed

## Example Workflow

```text
You: I'm using Subagent-Driven Development to execute project-network.dot.

[Read plan.md and project-network.dot]
[Validate graph: task_01 and task_02 are ready and have disjoint files]
[Track node states against the graph, not the harness task list]

[Fan-out: dispatch task_01 + task_02 implementers — both Agent calls in one response]

task_01 implementer: DONE, filed toorg change
task_02 implementer: DONE_WITH_CONCERNS, filed toorg change

[Read task_02 concern; include in spec_02 message]
[Fan-out: dispatch spec_01 + spec_02 reviews — both Agent calls in one response]

spec_01: pass
spec_02: pass

[verify_01 is now ready: run verify-01-api-ui.md commands once]
verify_01: pass

[Run quality_01 review for task_01 + task_02 group]
quality_01: important issue in task_02

[Return to task_02 implementer for fix]
[Run spec_02 again]
[Run verify_01 again]
[Run quality_01 again]
quality_01: approved

[final reached]
[Use jj-superpowers:finishing-a-development-branch]
```

## Red Flags

Never:

- Execute a graph with cycles, orphan nodes, or missing gates.
- Dispatch parallel task nodes with overlapping file scopes.
- Announce dispatch in one response turn and make Agent calls in separate subsequent turns — all Agent calls for a parallel batch must be in the same response.
- Skip per-task spec review before verification fan-in.
- Fan out consumer task nodes before `design_review` passes when a shared API stub exists.
- Run code-quality review before verification passes.
- Run both `simplification` and `quality_review` with overlapping duplication mandates — duplication detection is owned solely by `simplification`; `quality_review` is maintainability/production-risk only.
- Treat implementer task-local checks as group verification.
- Let implementers run `cargo check`, `cargo build`, `cargo test`, or other contended group commands unless the task file documents a concrete exception. The one sanctioned exception is an API-stub task gated by a `design_review` node, which may run a narrow, task-file-documented scoped type-check so consumers fan out against a compiling stub.
- Let any subagent invoke `claude`, `codex`, `gemini`, `opencode`, Copilot CLI, or another agent harness from the shell.
- Dump verbose command output when quiet, structured, scoped, or filtered output would answer the question.
- Have implementers run jj commands other than `jj commit [FILES] -m 'toorg: [description]'`.
- Let an implementer silently modify out-of-scope files.
- Paste full task text into subagent prompts; pass paths and context.
- Ignore subagent questions or `BLOCKED` reports.
- Mark a graph node complete while its gate has unresolved issues.

## Reporting Gaps

If you read multiple files or traced execution across modules to understand something
that a short documentation file could have explained immediately, invoke
**jj-superpowers:documentation** to create that document.

Continue with execution; do not block on reporting gaps.

## Integration

Required workflow skills:

- `jj-superpowers:writing-plans` - creates the plan and `project-network.dot`.
- `jj-superpowers:requesting-code-review` - code review template for quality reviewers.
- `jj-superpowers:finishing-a-development-branch` - completes development after final graph node.

Subagents should use:

- `jj-superpowers:test-driven-development` when their task requires TDD.
- `jj-superpowers:tool-output-discipline` when running CLI tools with potentially noisy output.

Alternative workflow:

- `jj-superpowers:executing-plans` - use when execution should happen inline or in a separate session.

## Skill Validation

When editing this skill or `writing-plans`, validate behavior with `../writing-plans/project-network-validation-scenarios.md` before deployment.
