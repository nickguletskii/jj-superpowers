# Tool Output Discipline Design

## Goal

Create general guidance that makes agents request concise, structured, and filtered command output by default, while preserving full-output escalation for debugging. Apply that guidance to graph planning and subagent-driven development so verbose build, test, lint, and diagnostic commands run at verification nodes with token-efficient output.

## Context

Agents currently tend to invoke familiar CLI tools with default human-readable output. That is convenient for people at a terminal, but inefficient in agent contexts where command output consumes limited context and can obscure the actual signal.

The motivating example is Rust verification. A default `cargo check` or `cargo test` can produce large human-readable logs, while compiler diagnostics can often be reduced to structured errors:

```bash
cargo check --message-format json-diagnostic-short -q | jq -crM 'select(.message.level == "error")'
```

The existing graph workflow already says contended commands such as `cargo`, build commands, type checks, test suites, and linters belong in `verify` nodes rather than implementer tasks. The new guidance should make that boundary more reliable and make verification output shorter.

## Architecture

Add a general skill:

- `skills/tool-output-discipline/SKILL.md`

The skill is a technique/reference hybrid:

- Technique: choose the smallest useful output before running verbose tools.
- Reference: provide a compact cookbook of command patterns for common tool families.

Then update workflow skills and prompts to consume it:

- `skills/writing-plans/SKILL.md`
- `skills/subagent-driven-development/SKILL.md`
- `skills/brainstorming/SKILL.md`
- `skills/executing-plans/SKILL.md`
- `skills/subagent-driven-development/implementer-prompt.md`
- `skills/subagent-driven-development/verification-prompt.md`
- `skills/writing-plans/project-network-validation-scenarios.md`

The new skill should remain generally useful outside subagent-driven development. SDD and planning should reference it instead of duplicating a long cookbook.

## New Skill Semantics

`tool-output-discipline` applies when an agent is about to run a CLI command that may produce noisy or long output, especially build tools, test runners, package managers, log commands, cluster tooling, and broad source searches.

Core rule:

1. Identify the question the command needs to answer.
2. Choose the shortest output mode that can answer that question.
3. Prefer structured output, quiet flags, selectors, and filters before reading full logs.
4. Escalate to fuller output only when the concise output is insufficient for diagnosis.
5. When full output is needed, capture it to a file or summarize only the relevant section.

The skill should explicitly distinguish:

- **Pass/fail checks:** bounded output and exit status are often enough.
- **Diagnostic checks:** use structured output and filters to extract errors or failing cases.
- **Deep debugging:** full logs are acceptable after a concise attempt fails to explain the issue.

## Cookbook Scope

The cookbook must stay compact and pattern-oriented, not exhaustive. Include high-value examples for common command families:

| Tool family | Pattern to teach |
|-------------|------------------|
| Cargo/Rust | `--message-format json-diagnostic-short`, `-q`, `jq` filtering for errors |
| Test runners | selectors and quiet modes such as `pytest -q path::test` |
| Search/read commands | `rg` with targeted patterns before broad file reads |
| JSON-capable CLIs | `--json` / `-o json` piped to `jq` for relevant fields |
| Logs | `tail`, targeted grep/rg, or captured log files instead of dumping everything |
| Build systems | quiet/failure-summary modes where available; expand only on failure diagnosis |

Avoid maintaining a large command catalog. The skill should teach how to discover and use a tool's concise modes, not memorize every flag.

## Planning Integration

`writing-plans` should require verification files to encode token-efficient commands where practical.

Verification files may separate commands by purpose:

- **Primary pass/fail command:** exits successfully or fails with bounded output.
- **Failure diagnostic command:** extracts concise failure detail when the primary command fails.

For tools with known structured modes, plan authors should specify those modes directly. For example, a Rust verification file may include a concise diagnostic command for compiler errors instead of default `cargo check` output.

Task files should continue to allow only explicitly named task-local checks, but "task-local" must mean genuinely narrow and non-contended. Commands such as `cargo check`, `cargo test`, and `cargo build` usually contend on the shared target directory even when scoped to a package or test name, so they should normally live in `verify-*` files. Put them in a task file only when the plan has a concrete reason they are safe and necessary for that single task.

Group compile, test, lint, type-check, build, and smoke-test commands stay in `verify-*` files.

## SDD Integration

`subagent-driven-development` should preserve verification ownership:

- Implementer subagents may only run narrow task-local checks named in the task file.
- Implementer subagents must not run group `cargo check`, `cargo build`, `cargo test`, lint, type-check, build, or smoke-test commands.
- Even package-scoped or test-filtered Cargo commands are normally verification-node commands because they block shared target-directory state. A task file may name one only when the plan documents why it is safe and necessary for that task.
- Spec reviewers inspect code against the task file and do not run group verification commands.
- Verification nodes run the authoritative group commands from `verify-*` files.
- Quality reviewers inspect the verified diff and verification report; they do not rerun verification commands unless inspection proves the report is stale or contradicted.

When implementers or verifiers run any permitted command, they should apply `tool-output-discipline`.

The verification prompt should still respect exact commands in `verify-*` files. If concise output is desired, the planner should put concise commands in the verification file. The verifier may summarize output aggressively in its report, but it should not silently substitute different commands unless the verification file explicitly allows equivalent concise forms.

## Error Handling

If a concise command fails but does not reveal enough information:

1. Run the next broader diagnostic command if one is listed.
2. If none is listed, use a reasonable fuller-output command or log capture only for the failing scope.
3. Report both the concise attempt and the expanded diagnostic step.

If `jq` or another filter dependency is unavailable:

1. Use the tool's next-best built-in filtering or quiet output.
2. If no equivalent exists, report `BLOCKED` only when the verification cannot be meaningfully run.
3. Otherwise run the command with bounded output and note that the preferred filter was unavailable.

If exact command fidelity conflicts with output discipline, exact verification commands win. The fix belongs in the plan's verification file.

## Skill Testing and Validation

Because this creates and edits skills, follow the `writing-skills` RED-GREEN-REFACTOR model.

Add validation scenarios that demonstrate the failure before relying on the guidance:

1. **Verbose Cargo Baseline:** given a Rust compile-diagnostic task without the new skill, an agent chooses default `cargo check` or `cargo test` output.
2. **Concise Cargo With Skill:** with `tool-output-discipline`, an agent chooses structured/quiet Cargo output and filters to errors.
3. **Planning Concise Verification:** `writing-plans` emits `verify-*` commands that use concise or structured output when a tool supports it.
4. **SDD Verification Ownership:** with a task file mentioning tests and a verify file containing group `cargo test`, the implementer does not run group tests; the verifier does.
5. **Escalation Path:** when concise output is insufficient, the agent expands output only for the failing scope and reports why.

Update `skills/writing-plans/project-network-validation-scenarios.md` with the planning and SDD scenarios. If practical, include pressure prompts for the new skill in its own test notes or validation section.

## Implementation Topology

The work splits into these units:

1. Create `skills/tool-output-discipline/SKILL.md`.
2. Update `writing-plans` to require token-efficient verification commands and diagnostic/pass-fail separation where useful.
3. Update `subagent-driven-development` to reference the new skill and sharpen verification ownership.
4. Update `implementer-prompt.md` to forbid Cargo check/build/test and other group verification commands more explicitly, and require concise output for permitted task-local checks.
5. Update `verification-prompt.md` to produce concise reports and preserve exact command fidelity.
6. Update `brainstorming` so designs capture command ownership and output requirements before planning.
7. Update `executing-plans` to preserve the same task/verify command boundary for inline execution.
8. Update validation scenarios for concise output and verification ownership.

The units are related but mostly file-local. The plan should sequence the new skill before references to it, then update workflow skills and prompts, then validation scenarios.

## Verification

Verify the documentation changes with:

- `rg -n "tool-output-discipline|message-format json-diagnostic-short|jq -crM|group verification|verify node" skills docs`
- Review `skills/tool-output-discipline/SKILL.md` for frontmatter validity and concise description.
- Review `skills/writing-plans/project-network-validation-scenarios.md` to ensure it includes concise-output and verification-ownership scenarios.
- Run the repository's existing lightweight skill tests if available for the touched files.
- `jj status --no-pager` to confirm only intended files changed.

## Non-Goals

- Do not build an exhaustive CLI flag encyclopedia.
- Do not make implementers responsible for group verification.
- Do not remove the ability to inspect full logs when debugging requires it.
- Do not require `jq` as a universal dependency; prefer it when available and useful.
- Do not rewrite unrelated skill workflows.
