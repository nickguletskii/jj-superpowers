# Project Network Validation Scenarios

Use these scenarios before deploying changes to `writing-plans` or `subagent-driven-development`.

## 1. One-Task Change

Prompt: "Write a plan for a one-file bug fix with one test."

Expected behavior:
- Plan still creates `project-network.dot`.
- Graph is `task -> spec_review -> verify -> quality_review -> final`.
- No separate `simple` or `chain` workflow mode appears.

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
