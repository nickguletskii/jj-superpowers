---
name: subagent-driven-development
description: Use when executing a written plan that includes project-network.dot in the current session with subagents authorized — fanning out implementer agents, selecting reviews by risk, and batching verification.
---

# Subagent-Driven Development

Execute `project-network.dot` by dispatching fresh implementer subagents for ready task nodes, independently reviewing the tasks whose risk calls for it, batching contended verification at verify nodes, and reviewing each verified group for requirements and quality. A one-task plan runs through the same model. Track node state against the graph, not the harness task list.

## Graph Contract

Read `plan.md` and `project-network.dot`; the graph is authoritative unless invalid or contradicted by the task files. Plans author two node kinds:

| Authored kind | Attributes | Executor | Passes when |
|------|------------|----------|------|
| `task` | `file`, `files`; optional `scopes`, `stub` | implementer subagent | files changed, self-reviewed, and filed |
| `verify` | `file`; optional `simplify` | verifier subagent or orchestrator | commands exit successfully |

Implied gates never appear in the graph; the executor derives them:

| Implied gate | Trigger | Scope | Passes when |
|--------------|---------|-------|------|
| `spec_review` | a task completes **and** its risk requires independent review (below) | that task | changed behavior meets the task file and the named risk is addressed |
| `design_review` | a `stub=true` task is filed (below) | the stubbed surface | API is coherent |
| `simplification` | a `simplify=true` verify passes | the verify's task group | no accepted duplication remains, or findings were fixed and re-verified |
| `quality_review` | a verify passes (after `simplification` when present) | the verify's task group | group meets its requirements and is maintainable |
| `final` | every verify passed | whole graph | all gates passed and the Finish checks return nothing |

A verify node's **task group** is every task that reaches it. Edges mean "source must pass before target runs".

**Filed and accepted.** A task is **filed** once it is implemented, self-reviewed by its implementer for scope and completeness, filed through the guard, and through its `spec_review` when risk selected one; it is consolidated at that point. Its **acceptance point** — ready for consumers — is filed, plus `design_review` when `stub=true`. A group is complete when its verify succeeds and every selected review has passed. The `design_review` rubric is always `designing-with-types-and-abstractions`.

**Selecting task review.** Review follows concrete risk, not task count (the Governing principle in `using-superpowers`). Run `spec_review` on a task when its file carries a `**Risk:**` line, when you find a risk the plan missed (the triggers in `requesting-code-review` → When), or when the user or project requires it. Record the reason in the dispatch context. For a `stub=true` task, `design_review` is the review that covers its shared-interface risk; add `spec_review` only for a different risk. Routine localized tasks go straight from self-review to the group's verify and `quality_review`. A required review is never skipped silently.

Order per task: implement and self-review → file as `wip` → `spec_review` if selected (fail → back to implementer) → consolidate → `design_review` if `stub=true`. Per verify: run commands (fail → back to responsible tasks) → `simplification` if `simplify=true` → `quality_review`. A routed-back fix re-enters at the review that sent it back (a verify-routed fix: self-review, then the verify again); re-review covers what changed or was affected, not the whole group.

Order ready nodes by `Sorting work` in `using-superpowers` (critical path and blockers first, within graph readiness). Reports that arrive mid-run follow `Interruptions` there.

## Graph Validation

The single list of checks; `executing-plans` runs the same ones. Before dispatching:

- `plan.md` references `project-network.dot`.
- Every node is `kind="task"` or `kind="verify"`.
- Every task has `file` and `files`; every verify has `file`.
- Every task reaches at least one verify.
- No cycles.
- No parallel-ready tasks have overlapping `files`.

Gate placement needs no check: gates are derived, so they can't be missing or misordered. Fix the plan yourself only when the correction is mechanical and obvious; otherwise ask. A graph with authored gate nodes uses the superseded contract; collapsing it is mechanical — delete the gate nodes, reconnect edges through them, mark consumed API-stub tasks `stub=true`, and mark a verify whose chain had a simplification node `simplify=true`.

## Dispatch Rules

Pass dynamic context as paths, never pasted task text: node id, task or verify file, context paths, `files`, `scopes`, derived gate scope, upstream reports, verification report, notes. Durable role behavior lives in the named agent. Assemble prompts most-stable-first in the same order every time (see "Plan artifacts are a prompt prefix" in `writing-plans`).

**Concurrent edits are normal.** Parallel implementers, the user, and other sessions write to the same tree. The `files` collision gate is a correctness mechanism, so never dispatch parallel tasks with overlapping `files`. Subagents carry their half of the concurrency contract in `agents/_preamble.md`; yours is:

- give each agent accurate `files`/`scopes` that don't overlap any concurrently running agent;
- re-read current file state before re-dispatching after a review failure;
- resolve reported conflicts yourself rather than telling an agent to force its version;
- catch out-of-scope edits against the `files`/`scopes` you issued — through `spec_review` when selected, otherwise by checking the filed paths against them before acceptance and in `quality_review`.

**Parallelism.** Emit all ready, non-conflicting Agent calls in a single response; announcing dispatch and then calling one per turn runs them sequentially. Default to 3–5 concurrent subagents unless the user says otherwise, and refill a slot as soon as one frees rather than waiting for a tidy batch. If the Workflow tool is available and the user opted into multi-agent orchestration, you may use it to fan out further.

**Freshness.** Use a fresh subagent per node, and a fresh one with the review report when routing failures back. Exception: when a task file flags a node as complex or the implementer returned `DONE_WITH_CONCERNS`, route fixes back to the original session (`SendMessage` in Claude Code) — it holds reasoning a fresh agent would rebuild — unless that session has grown long, the fix needs a different approach, or it's unreachable.

**Models.** Use the least capable model that handles each role, implementers included. `choosing-model-and-effort` owns per-node selection and escalation.

| Role | Named agent | What you pass |
|------|-------------|---------------|
| `task` | `sdd-implementer` | task file, context docs, `files`, `scopes`, upstream annotations. You are the only source of `files`/`scopes`. |
| `spec_review` | `sdd-spec-reviewer` | when selected, after `DONE`/`DONE_WITH_CONCERNS`; the task file, the risk that selected it, and the same `files`/`scopes` you gave the implementer, for containment. Runs before verification fan-in. |
| `design_review` | `sdd-design-reviewer` | stub task file and stubbed surface. Judges coherence only and never edits. |
| `verify` | `sdd-verifier` | the `verify-*.md` file, once every upstream task reached its acceptance point; on a rerun after a routed-back fix, the subset of its commands the fix affects. The batched reduction point for build tools. |
| `simplification` | `sdd-simplifier` | the task group. Sole owner of duplication detection when present; findings route back to an implementer, then the group re-verifies. |
| `quality_review` | `sdd-quality-reviewer` | the task group, task files, verification report, and which tasks already passed `spec_review` and for what risk. Requirements coverage, maintainability, and production risk; also duplication when no `simplification` ran. |
| `final` | — | Finish checks, then ask what to integrate. |
| jj filing | `sdd-jj-coordinator` | see Change Consolidation. |

Without named agents, dispatch a general-purpose agent with `agents/_preamble.md` + the body of `agents/<name>.md` + dynamic context. Named agents ship as `agents/*.md` (Claude Code `subagent_type`), `.codex/agents/*.toml` (Codex: `using-superpowers/references/codex-tools.md`), and `.opencode/agents/*.md` (OpenCode v2 native `subagent` tool). Verification commands and reports follow `tool-output-discipline`.

## Change Consolidation

Consolidate as you go. Deferring cleanup to the end leaves one change per implementer commit and per review round — hundreds in a real plan — to untangle when intent is hardest to reconstruct. A filed task is done; that is the consolidation point.

### Run id and scaffold

At graph start, pick a run id: plan slug plus four random characters (`parser-k3f9`). It namespaces scaffolds so concurrent runs never match each other's changes. Implementers file through the guard (`jujutsu` safety rule 7), naming paths explicitly:

```sh
node <jujutsu-skill>/scripts/jj-guard.ts commit -m 'wip(<run>/<node_id>): [what changed]' <paths>...
```

They report every change id the guard prints. The `wip(<run>/<node_id>)` description is a scaffold, destroyed at consolidation; the orchestrator writes the real description once the work is known-correct.

### Consolidate when filed

The coordinator squashes the task's reported ids into the newest and describes it (Change Description Rules in `jujutsu`):

```sh
G="node <jujutsu-skill>/scripts/jj-guard.ts"
$G run squash --from '<id1> | <id2>' --into <id3> --use-destination-message
$G run describe -r <id3> -m 'feat(parser): parse input with empty-input handling'
```

A task's changes usually interleave with other tasks'; jj rebases around them and disjoint scopes keep that conflict-free. In workspace mode, the coordinator then moves the change into the main line (`$G run rebase -r <id3> -B @`) and forgets the workspace. Fixes sent back by `verify`, `simplification`, or `quality_review` produce new ids; squash them into the task's consolidated change once the gate that sent them back passes.

**Invariant: one change per task node**, however many commits or review rounds. Off-graph Small-tier work has no node: the implementer commits through the guard with the orchestrator-supplied final description and no scaffold.

The orchestrator decides; `sdd-jj-coordinator` executes through the guard. Implementers only `commit` their own paths — never squash, describe, or reorganize.

### Finish checks

Scaffolds are `wip(<run>/<node>)` (implementers) and `todo:` (the DAG builder in `jj-organizing-history`). `final` isn't reached until all agents have stopped and both of these print nothing:

```sh
node <jujutsu-skill>/scripts/jj-guard.ts check --prefix 'wip(<run>/'
jj diff --ignore-working-copy --stat     # @ holds no unfiled edits
```

Any output is a bug: squash each leftover into its change and describe it; recover divergence per `jujutsu` safety rule 7. Collapsing a verify group into one change or reshaping history is optional (`jj-organizing-history`).

Then ask the user what to integrate (decision-checkpoint pattern): bookmark + push or PR per `jujutsu`, or keep as-is. Never push, merge, or discard without that answer.

## Verification Ownership

The canonical contended-command rule; `writing-plans` and `executing-plans` reference it.

- Implementers run narrow task-local checks only when the task file names them, and never own group compile, test, lint, type-check, build, or smoke tests.
- `cargo check/build/test` are verify-node commands even when package-scoped or filtered, because they contend on the shared target directory. A task file may name one only with a documented reason it is safe and necessary.
- **Sole exception:** a `stub=true` task may run a narrow, documented scoped type-check (e.g. `cargo check -p <crate> -q`) so consumers fan out against a compiling stub — design review checks coherence, not compilation.
- Spec reviewers inspect against the task file and run no group verification. Verify nodes own the authoritative results for their group. Quality reviewers read the verification report and rerun commands only with a concrete reason to think it stale or contradicted by the diff.
- Nobody checks out or builds an earlier revision to classify failures or produce a baseline except as `Choosing evidence` in `verification-before-completion` allows.

## Implementer status

- **DONE** → `spec_review` if selected; otherwise the task is filed (and accepted, unless `stub=true` still needs `design_review`).
- **DONE_WITH_CONCERNS** → address correctness or scope concerns first; a concern about correctness is itself a reason to select `spec_review`. Pass observations to reviewers. Treat the task as complex for freshness.
- **NEEDS_CONTEXT** → supply it and re-dispatch.
- **BLOCKED** → if context, supply it; if under-powered, escalate per `choosing-model-and-effort` (re-read the task file first; only on an empirical wall; one step; speculative escalation asks the user); if too large, split it and update the graph; if the plan is wrong, amend it when mechanical or ask. Don't retry the same model without changing instructions, context, or task shape.

Subagents never ask the user; they report `NEEDS_CONTEXT` or `BLOCKED` with 2–3 options, and you ask using the decision-checkpoint pattern from `using-superpowers`.

### `BLOCKED` scope

- **`SCOPE: related`** (dependency inside this plan): if another node produces the missing thing, add or fix the edge and run the producer first; if a new task is needed, add its file and update `plan.md` and the graph; ask before non-trivial scope expansion.
- **`SCOPE: unrelated`** (pre-existing gap): pause and offer — add a fix to this plan, note it as a separate later task, or take user guidance — then update the plan if the graph changes.

### Design-Review Status

Design reviewers check coherence only (right variation axis, illegal states unrepresentable, explicit effects, no leaky boundaries), don't recompile, and never edit. Outcomes:

- **Local flaw** — fixable within the stub task's own files without changing any type, signature, or symbol a consumer task file references (internal types, docs, an uncited trait method, a private rename). Re-dispatch the stub implementer with the findings, then re-run `design_review` on the corrected stub. No user round-trip.
- **`BLOCKED_STRUCTURAL`** — the fix changes a consumer-referenced symbol or signature, the choice of abstraction, a missing requirement, or contradicts the spec. Pause the graph, dispatch no consumers, offer the user 2–3 options, and return to `brainstorming`; `writing-plans` then regenerates the affected task files and graph portion. This is an executor escalation, not a graph edge.

When it's unclear which applies, treat it as structural.

Under Rush, resolve every checkpoint per `using-superpowers` `references/autonomy.md`; every derived or risk-selected gate still runs.

When editing this skill or `writing-plans`, validate with `../writing-plans/project-network-validation-scenarios.md`.
