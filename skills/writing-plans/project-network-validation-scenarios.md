# Project Network Validation Scenarios

Use these scenarios before deploying changes to `writing-plans` or `subagent-driven-development`.

## 1. One-Task Change

Prompt: "Write a plan for a one-file bug fix with one test."

Expected behavior:
- Triage runs first. A genuinely trivial one-file change (single obvious file, no new abstraction, verification nameable in one command, no design risk) is triaged to the Trivial or Small tier and goes **off-graph**: no `plan.md`, no `project-network.dot`, no task files. The change is handled inline (Trivial) or via 1–2 direct `sdd-implementer` dispatches (Small), with the orchestrator running the named verify command.
- The full graph appears **only when the change is Full-tier** (new architecture, new public API surface, cross-file design risk, or anything benefiting from a written, reviewable spec/plan).
- A Full-tier one-task change still produces a single-task graph: `task -> spec_review -> verify -> quality_review -> final` (with `simplification` inserted before `quality_review` only if the task adds new helpers).
- Tiers are chosen by triage with reasoning and a user veto; there is no separate `simple` or `chain` workflow mode — a Full-tier one-task change is still just a single-task graph.

## 2. Two Independent Tasks

Prompt: "Write a plan for two independent pages that touch disjoint files."

Expected behavior:
- Two task nodes can fan out.
- Each task has its own spec review.
- Both spec reviews feed one verification reducer when commands would contend.
- One quality review covers the verified group.

## 3. Shared-File Conflict

Prompt: "Write a plan for two changes that both modify `src/state.rs`."

Expected behavior:
- The graph serializes the task nodes or splits the shared file first.
- It does not mark the tasks as parallel-ready with overlapping `files` attributes.

## 4. Verification Ownership

Prompt: "Execute a graph where a task file mentions tests and a verify file contains `cargo test`."

Expected behavior:
- Implementer does not run `cargo check`, `cargo build`, `cargo test`, or other contended group verification commands.
- Implementer runs only named task-local checks that are genuinely narrow and non-contended.
- Verify node runs `cargo test`.
- Spec reviewer does not run group verification commands.
- Code-quality reviewer reads the verification report instead of rerunning commands.

## 5. Concise Verification Commands

Prompt: "Write a plan for a Rust change where verification needs compiler diagnostics."

Expected behavior:
- `verify-*` files prefer concise/structured diagnostic commands where practical.
- Cargo diagnostics use quiet/structured output, for example `cargo check --message-format json-diagnostic-short -q | jq -crM 'select(.message.level == "error")'`.
- Default verbose human-readable output is not used when a shorter structured form answers the verification question.
- If full logs may be needed, the verification file lists them as an escalation step, not the first command.

## 6. Tool Output Escalation

Prompt: "Run a verification command where the concise diagnostic output fails but does not explain the issue."

Expected behavior:
- Verifier reports the concise command and its result first.
- Verifier expands only the failing scope using the next diagnostic command or captured logs.
- Verifier does not dump unrelated full build/test output into the report.

## 7. Review Placement

Prompt: "Execute a graph with two tasks feeding one verification node."

Expected behavior:
- Each task receives spec review before the verification node runs.
- Code-quality review runs only after verification passes.
- Failed verification routes work back to responsible task nodes and repeats spec review before verification reruns.

## 8. API-First / Early Stubbing

Prompt: "Write a plan for a new module with multiple parallel consumers."

Expected behavior:
- The graph defines a Task 1 dedicated to establishing and committing the public API interfaces, traits, or types as stubs.
- Downstream tasks depend on Task 1's spec review, allowing them to compile immediately.
- Downstream tasks are scheduled to run in parallel once the API stub task is completed.

## 9. Core Target Files + Allowed Directory Scopes

Prompt: "Write a plan where Task 1 modifies `src/parser.rs` and needs to update local re-exports and add a test."

Expected behavior:
- Task 1 lists `src/parser.rs` in `Target Files`.
- Task 1 lists `src/` or `src/parser/` in `Allowed Directory Scopes`.
- Graph collision check runs only on `Target Files`, allowing other parallel tasks to touch disjoint target files even if they share the same directory scope for supporting updates (e.g. imports, re-exports).
- The implementer is permitted to edit/create supporting files within `Allowed Directory Scopes` without scope blockage.

## 10. No Code Bodies in Tasks

Prompt: "Write task details for implementing a complex function."

Expected behavior:
- Task file defines only the public function signature and behavioral invariants/contract.
- Task file does NOT pre-write the function body or implementation logic blocks.
- The implementer subagent is solely responsible for writing the implementation code.

## 11. `design_review` — Local Fix

Prompt: "Execute a Full-tier graph where an API-stub task (`task_00`) is consumed by two tasks, and the stub has a fixable local API flaw — a private detail no consumer references."

Expected behavior:
- A `design_review` node depends on the stub task's `spec_review` and gates the *start* of both consumer tasks; consumers are not dispatched before it passes.
- The reviewer judges coherence only (does not re-run type-checking; the stub's narrow task-local type-check already confirmed it compiles).
- The flaw touches no type, signature, or symbol that a consumer task file references (e.g. an internal type, documentation, a private helper, or a trait method no consumer cites). It is classified **local**.
- The orchestrator **re-dispatches the stub implementer** with the findings to fix and re-stub. No consumer task files are edited; **no user round-trip**. Reviewer/implementer separation holds — the reviewer never edits files.
- Consumers (`task_01`, `task_02`) start only after `design_review` passes on the corrected stub.

## 12. `design_review` — Structural Bounce-Back

Prompt: "Execute the same stub-plus-two-consumers Full-tier graph, but the stub flaw changes a consumer-referenced signature or uses the wrong abstraction."

Expected behavior:
- The fix would change a symbol/signature that a consumer task file references (or the abstraction choice / a missing requirement / a spec contradiction). It is classified **structural** — on genuine ambiguity the reviewer defaults to structural/escalate.
- The `design_review` node returns `STATUS: BLOCKED_STRUCTURAL`.
- The orchestrator **pauses the graph**; consumer tasks are **NOT** dispatched.
- The orchestrator surfaces 2–3 concrete options to the user (decision-checkpoint pattern) and, on a design change, returns to **brainstorming**.
- `writing-plans` then **regenerates the affected consumer task files and the affected portion of `project-network.dot`**. The DAG stays acyclic — "return to brainstorming" is an executor-level escalation, not a graph edge.

## 13. `simplification` Placement + Amended Terminal Chain

Prompt: "Write a Full-tier plan for a group that introduces new helpers, and a second Full-tier group that introduces no new helpers."

Expected behavior:
- The group that introduces new helpers gets a `simplification` node **after `verify` and before `quality_review`**: chain `verify -> simplification -> quality_review -> final`. The `quality_review` depends on the `simplification` node, not directly on `verify`.
- The group that adds **no** new helpers/utilities/abstractions has **no** `simplification` node: chain `verify -> quality_review -> final`.
- Duplication detection is owned by `simplification` (single owner). `quality_review` covers maintainability only and does NOT also flag duplication.
- `simplification` is a reviewer node; its findings route back to an implementer, which then re-verifies.

## 14. Tier Routing

Prompt: "Given prompts of varying size, show how the orchestrator routes each to a tier."

Expected behavior:
- For each prompt the orchestrator **proposes a tier with reasoning** and lets the user veto via the harness ask tool; the proposal is the default (no mandatory round-trip).
- **Trivial** (single obvious file, no new abstraction, one-command verification, no design risk) → handled **inline** in this session, then the orchestrator runs the named verify command. No plan files.
- **Small** (local scope, ≤2 dispatches, obvious file boundaries, no new architecture, no cross-file design risk) → **direct subagent dispatch**, **no plan files**, reusing the `sdd-implementer` contract (fallback `implementer-prompt.md`) with the approved design + file scope + verify command in place of a task file. The orchestrator runs verification conversationally.
- **Full** (new architecture, new public API surface, multiple interacting components, or cross-file design risk) → write spec → `writing-plans` → graph.
- Choosing the lightest adequate tier is the correct default, not a risk. Design risk forces Full (the `design_review` gate lives only there).
- **Off-graph tiers still invoke `spec-code-sync` before any source edit** when `.agents/layout.yaml` exists (candidate-spec lookup on touched paths, route amendments per its rules) — skipping plan files must not silently skip the spec-sync gate.
- Any tier hitting unexpected uncertainty mid-flight **re-triages upward**; escalating Trivial/Small to Full means writing the spec/graph then, and the orchestrator names that cost.
