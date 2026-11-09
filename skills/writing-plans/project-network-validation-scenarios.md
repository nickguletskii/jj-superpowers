# Project Network Validation Scenarios

Use these scenarios before deploying changes to `writing-plans` or `subagent-driven-development`.

The graph authors only `task` and `verify` nodes. `spec_review`, `design_review`, `simplification`, `quality_review`, and `final` are **implied**: the executor derives each one's trigger and scope. `design_review`, `quality_review`, and `final` follow from the graph alone; `spec_review` runs only for a task whose risk requires it (a `**Risk:**` line, a risk the executor finds, or an explicit requirement); `simplification` runs only on `simplify=true`. Most of these scenarios therefore check two things at once — that the plan **authors** the right two-node graph, and that the executor **derives** the right gates from it.

## 1. One-Task Change

Prompt: "Write a plan for a one-file bug fix with one test."

Expected behavior:
- Triage runs first. A genuinely trivial one-file change (single obvious file, no new abstraction, verification nameable in one command, no design risk) is triaged to the Trivial or Small tier and goes **off-graph**: no `plan.md`, no `project-network.dot`, no task files. The change is handled inline (Trivial) or via 1–2 direct `sdd-implementer` dispatches (Small), with the orchestrator running the named verify command.
- The full graph appears **only when the change is Full-tier** (new architecture, new public API surface, cross-file design risk, or anything benefiting from a written, reviewable spec/plan).
- A Full-tier one-task change produces a **two-node** graph: `task -> verify`. No gate nodes are authored.
- The executor runs the group quality review and `final`, deriving each from those two nodes. A routine task with no `**Risk:**` line gets self-review only before verify. No `stub=true` and no `simplify=true` means no design review and no simplification.
- There is no separate `simple` or `chain` workflow mode.

## 2. Two Independent Tasks

Prompt: "Write a plan for two independent pages that touch disjoint files."

Expected behavior:
- Two `task` nodes fan out in parallel; both have edges into one `verify` node.
- Neither task carries a risk, so neither gets an independent task review; each is accepted after self-review and filing.
- One verify run and one quality review (requirements and quality) cover the derived task group `{task_01, task_02}` — every task reaching that verify.
- No `stub=true` node (the pages share no API surface), so no design review.

## 3. Shared-File Conflict

Prompt: "Write a plan for two changes that both modify `src/state.rs`."

Expected behavior:
- The graph serializes the task nodes or splits the shared file first.
- It does not mark the tasks as parallel-ready with overlapping `files` attributes.
- The executor's collision check runs on `files` at dispatch time and refuses to fan out overlapping tasks even if the graph would allow it.

## 4. Verify Grouping (scope derivation)

Prompt: "Execute a graph where `task_00` feeds both `verify_01` and `verify_02`, while `task_01` feeds only `verify_01` and `task_02` only `verify_02`."

Expected behavior:
- `verify_01`'s task group is `{task_00, task_01}`; `verify_02`'s is `{task_00, task_02}` — every task that *reaches* the verify, not just its direct predecessors.
- Each verify's quality review is scoped to its own derived group. `task_00` is reviewed in both groups; that is correct, not a duplicate gate.
- The verify node is the only place the plan author chooses which tasks batch together. Regrouping means moving edges, not adding gate nodes.

## 5. Verification Ownership

Prompt: "Execute a graph where a task file mentions tests and a verify file contains `cargo test`."

Expected behavior:
- Implementer does not run `cargo check`, `cargo build`, `cargo test`, or other contended group verification commands.
- Implementer runs only named task-local checks that are genuinely narrow and non-contended.
- Verify node runs `cargo test`.
- Spec reviewer, when selected, does not run group verification commands.
- Quality reviewer reads the verification report instead of rerunning commands.
- Nobody checks out or builds an earlier revision to label a failure pre-existing.

## 6. Concise Verification Commands

Prompt: "Write a plan for a Rust change where verification needs compiler diagnostics."

Expected behavior:
- `verify-*` files prefer concise/structured diagnostic commands where practical.
- Cargo diagnostics use quiet/structured output, for example `cargo check --message-format json-diagnostic-short -q | jq -crM 'select(.message.level == "error")'`.
- Default verbose human-readable output is not used when a shorter structured form answers the verification question.
- If full logs may be needed, the verification file lists them as an escalation step, not the first command.

## 7. Tool Output Escalation

Prompt: "Run a verification command where the concise diagnostic output fails but does not explain the issue."

Expected behavior:
- Verifier reports the concise command and its result first.
- Verifier expands only the failing scope using the next diagnostic command or captured logs.
- Verifier does not dump unrelated full build/test output into the report.

## 8. API-First / `stub=true`

Prompt: "Write a plan for a new module with multiple parallel consumers."

Expected behavior:
- The earliest task node establishes the public API surface as stubs and is marked **`stub=true`**.
- Consumer tasks depend on that node, so they compile against the stub immediately and fan out in parallel once it clears its gates.
- The `stub=true` attribute is the *only* thing the plan authors — the design review is implied from it. No `design_review` node is written.
- The stub task names a narrow scoped type-check (the one sanctioned contended-command exception) so consumers fan out against a compiling stub.

## 9. `files` and `scopes` Live Only on the Node

Prompt: "Write a plan where Task 1 modifies `src/parser.rs` and needs to update local re-exports and add a test."

Expected behavior:
- The `task` node carries `files="src/parser.rs"` and `scopes="src/parser/"`.
- The **task file does not restate them.** A "Target Files" or "Allowed Scopes" section in the task file is a plan defect — it is a second surface that drifts.
- The orchestrator injects `files` and `scopes` into the implementer's prompt from the graph node, and checks containment against them — through the spec reviewer when one is selected, otherwise against the filed paths.
- The collision check runs only on `files`, so parallel tasks may share a directory scope for supporting updates (imports, re-exports) while owning disjoint target files.
- The implementer may edit supporting files within `scopes` without a scope block.

## 10. No Code Bodies in Tasks

Prompt: "Write task details for implementing a complex function."

Expected behavior:
- Task file defines only the public function signature and behavioral invariants/contract.
- Task file does NOT pre-write the function body or implementation logic blocks.
- The implementer subagent is solely responsible for writing the implementation code.

## 11. Prompt Prefix Discipline

Prompt: "Write a plan where three consumer tasks all use the interface defined by the `stub=true` task, and then execute it."

Expected behavior:
- No consumer task file transcribes the stub's signatures. Each points at the source file (`read src/api/mod.rs`) — the graph guarantees it exists on disk before the consumer starts.
- Material shared by 2+ tasks lives in `context/`, not copied into each task file.
- The orchestrator assembles each dispatch most-stable-first: role prompt → `context/*.md` → shared API surface → this task's file → target files/scopes/upstream reports.
- Segment order is identical across all three dispatches. Reordering segments — even with identical content — is a defect, because it forfeits the prefix cache.

## 12. `design_review` — Local Fix

Prompt: "Execute a graph where a `stub=true` task (`task_00`) is depended on by two tasks, and the stub has a fixable local API flaw — a private detail no dependent references."

Expected behavior:
- The design review is derived from `stub=true`, runs once `task_00` is filed, and gates the *start* of both dependents; they are not dispatched before it passes.
- The reviewer judges coherence only (does not re-run type-checking; the stub's narrow task-local type-check already confirmed it compiles). Its rubric is always `designing-with-types-and-abstractions` — there is no node attribute to override.
- The flaw touches no type, signature, or symbol that a dependent's task file references (e.g. an internal type, documentation, a private helper, or a trait method no consumer cites). It is classified **local**.
- The orchestrator **re-dispatches the stub implementer** with the findings to fix and re-stub. No consumer task files are edited; **no user round-trip**. Reviewer/implementer separation holds — the reviewer never edits files.
- `task_01` and `task_02` start only after the design review passes on the corrected stub.

## 13. `design_review` — Structural Bounce-Back

Prompt: "Execute the same stub-plus-two-dependents graph, but the stub flaw changes a consumer-referenced signature or uses the wrong abstraction."

Expected behavior:
- The fix would change a symbol/signature that a consumer task file references (or the abstraction choice / a missing requirement / a spec contradiction). It is classified **structural** — on genuine ambiguity the reviewer defaults to structural/escalate.
- The review returns `STATUS: BLOCKED_STRUCTURAL`.
- The orchestrator **pauses the graph**; the dependent tasks are **NOT** dispatched.
- The orchestrator surfaces 2–3 concrete options to the user (decision-checkpoint pattern) and, on a design change, returns to **brainstorming**.
- `writing-plans` then **regenerates the affected consumer task files and the affected portion of `project-network.dot`**. The DAG stays acyclic — "return to brainstorming" is an executor-level escalation, not a graph edge.

## 14. `simplify=true`

Prompt: "Write a plan for a group whose new helpers likely duplicate existing utilities, and a second group that adds a small private helper."

Expected behavior:
- Only the verify node of the group with the concrete duplication concern is marked **`simplify=true`**. A new helper alone is not a reason. Neither graph contains a `simplification` node.
- On the `simplify=true` verify, the executor runs simplification **after verification passes and before quality review**, scoped to that verify's derived task group, and quality review does not repeat duplication detection.
- The other group goes straight from verify to quality review, which includes the duplication check.
- An existing plan with an explicitly authored `simplify=true` is honored as written.
- Simplification is a reviewer gate; its findings route back to an implementer, and the group then re-verifies.

## 15. Malformed Graphs

Prompt: "Execute a graph that (a) contains a cycle, (b) contains a `task` node with no path to any `verify`, and (c) contains authored `spec_review` / `quality_review` / `final` nodes."

Expected behavior:
- **(a) Cycle** → refuse to execute; ask the user.
- **(b) Orphan task** → refuse to execute; a task that reaches no `verify` belongs to no group and would never be verified or quality-reviewed.
- **(c) Authored gate nodes** → the graph was written against the superseded contract. The collapse is mechanical, so the executor fixes it: delete the gate nodes, reconnect `task`/`verify` edges through them, mark consumed API-stub tasks `stub=true`, and mark a verify whose old chain carried a `simplification` node `simplify=true`.
- Nothing else is checkable, because nothing else is authorable. There is no "missing spec review", "wrong terminal chain", or "unreachable `final`" failure mode left to detect.

## 16. Tier Routing

Prompt: "Given prompts of varying size, show how the orchestrator routes each to a tier."

Expected behavior:
- For each prompt the orchestrator **proposes a tier with reasoning** and lets the user veto via the harness ask tool; the proposal is the default (no mandatory round-trip).
- **Trivial** (single obvious file, no new abstraction, one-command verification, no design risk) → handled **inline** in this session, then the orchestrator runs the named verify command. No plan files.
- **Small** (local scope, ≤2 dispatches, obvious file boundaries, no new architecture, no cross-file design risk) → **direct subagent dispatch**, **no plan files**, reusing the `sdd-implementer` contract with the approved design + file scope + verify command in place of a task file. The orchestrator runs verification conversationally.
- **Full** (new architecture, new public API surface, multiple interacting components, or cross-file design risk) → write spec → `writing-plans` → graph.
- Choosing the lightest adequate tier is the correct default, not a risk. Design risk forces Full (the design-review gate lives only there, riding on `stub=true`).
- **Off-graph tiers still invoke `spec-code-sync` before any source edit** when `.agents/layout.yaml` exists (candidate-spec lookup on touched paths, route amendments per its rules) — skipping plan files must not silently skip the spec-sync gate.
- Any tier hitting unexpected uncertainty mid-flight **re-triages upward**; escalating Trivial/Small to Full means writing the spec/graph then, and the orchestrator names that cost.

## 17. Risk-Selected Task Review

Prompt: "Execute a graph with two routine tasks and one task whose file has `**Risk:** changes the delete path for persisted records`, all feeding one verify; a consumer task depends on the risky one."

Expected behavior:
- The routine tasks are accepted after self-review and filing; no spec reviewer is dispatched for them.
- The risky task gets `spec_review` focused on the named risk, and its consumer does not start until that review passes.
- Each task is consolidated when filed (after self-review, plus the risky task's `spec_review`), not at an unconditional spec review.
- One verify run and one quality review cover the whole group; the risky task's review is not repeated there.

## 18. Executor-Found Risk

Prompt: "Execute a graph where a task without a `**Risk:**` line returns `DONE_WITH_CONCERNS` about a race in a shared cache."

Expected behavior:
- The executor selects `spec_review` for that task, records the reason in the dispatch context, and holds its consumers until it passes.
- The plan is not edited to add a risk form or score.

## 19. Mid-Run Report

Prompt: "While a graph is running, the user mentions a cosmetic wording problem in an unrelated page, then later reports that the login endpoint is returning 500s in production."

Expected behavior:
- The wording problem is acknowledged, queued in the polish bucket, and does not interrupt running nodes or dispatch new work ahead of ready graph nodes.
- The outage is triaged (bounded, read-only), lands in the Critical bucket, and preempts: completed work is filed, running agents on unrelated nodes are left alone, and a resume point is recorded.
- If the user explicitly redirects instead, the switch happens without waiting for triage.
