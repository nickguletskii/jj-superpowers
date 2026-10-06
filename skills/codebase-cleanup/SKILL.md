---
name: codebase-cleanup
description: Use when the user asks for broad codebase cleanup, dead-code removal, deduplication sweeps, large refactoring discovery, or cleanup across multiple directories requiring evidence and approval gates
---

# Codebase Cleanup

## Overview

Large cleanup is a gated, evidence-producing workflow. The orchestrator builds a code map, reviews it, analyzes it, presents findings, and only performs destructive edits after explicit user approval.

**Core principle:** Findings are evidence. Deletions are user-approved records. Refactors are follow-up work, not automatic cleanup side effects.

## When to Use

Use for broad cleanup across directories:
- dead-code or obsolete-test removal
- deduplication sweeps
- large refactoring discovery
- API surface mapping before cleanup
- cleanup work that benefits from parallel subagents

Do not use for:
- local quality cleanup of a few files → use `jj-superpowers:deslopify`
- debugging failures → use `jj-superpowers:systematic-debugging`
- implementing refactors discovered by this workflow → synthesize a refactoring request, then use the normal design/planning workflow

## Orchestrator Contract

You are the orchestrator. You own:
- user discussion and approval gates
- run configuration
- artifact paths
- subagent dispatch
- review/repair loops
- validation after destructive edits
- final summary and follow-up recommendation

Subagents own only bounded tasks: mapping, consolidation, review, analysis, confirmed deletion, or request synthesis. Subagents do not ask the user questions and must not spawn other agents.

## Run Configuration Gate

Before mapping, establish a run configuration in the conversation. If the workflow will write artifacts, also write it to `[MAP_ROOT]/run-config.md` after `[MAP_ROOT]` exists.

Required fields:

```yaml
confirmed_scope:
  - path: src/auth/
    recursive: true
map_root: docs/superpowers/code-map/YYYY-MM-DD-HHMM/
dispatch_mode: native-subagent | shared-prompt-subagent | inline-phase-execution | stop
symbol_index:
  status: available | unavailable | failed | skipped
  languages: [rust, typescript, python]
  index_path: docs/superpowers/code-map/YYYY-MM-DD-HHMM/index.scip
  query_tool: ~/.jj-superpowers/tools/scip-query
validation_commands:
  - <project-specific command, or "none identified before deletion">
deletion_policy:
  exported_symbols_need_extra_confirmation: true
  framework_entrypoints_need_extra_confirmation: true
```

Rules:
- If the user names exact paths, treat those paths as the proposed scope, but still confirm whether each directory is recursive.
- `recursive: true` means enumerate descendant directories and map each directory with source files separately. The directory mapper maps immediate files only.
- Dependency reads outside scope are allowed only to understand usage/import evidence. Do not map or edit outside confirmed scope unless the user expands scope.
- Choose `[MAP_ROOT]` as `docs/superpowers/code-map/YYYY-MM-DD-HHMM/`. If that path exists, append a short suffix such as `-2`.
- If the project uses Rust, TypeScript, or Python and a SCIP producer is available, generate `[MAP_ROOT]/index.scip` before mapping and record `symbol_index.status: available`.
- For Rust, try `rust-analyzer scip .` or the project’s documented rust-analyzer SCIP command. For TypeScript and Python, use the project’s documented SCIP/indexer command if present; otherwise mark the index unavailable and continue with source reading + grep.
- Use `~/.jj-superpowers/tools/scip-query` as the installed jj-superpowers SCIP query helper. The jj-superpowers installer creates this stable symlink for supported harnesses.
- If the target project has its own `./tools/scip-query`, the orchestrator may prefer it and record that path instead.
- Pass the recorded query command and index path as `[SCIP_QUERY_TOOL]` and `[SCIP_INDEX_PATH]` to the directory mapper, analysis, and analysis reviewer subagents. Do not dump raw `.scip` files into agent context.
- Identify validation commands before deletion when possible. If none are obvious, record that and ask the user before destructive edits whether to proceed without validation.

## Dispatch Modes

Prefer native named subagents when available:

| Phase | Native agent | Repo-root shared source fallback |
|---|---|---|
| Directory mapping | `codebase-cleanup-directory-mapper` | `agents/codebase-cleanup-directory-mapper.md` |
| Map consolidation | `codebase-cleanup-map-consolidator` | `agents/codebase-cleanup-map-consolidator.md` |
| Map review | `codebase-cleanup-map-reviewer` | `agents/codebase-cleanup-map-reviewer.md` |
| Group analysis | `codebase-cleanup-analysis` | `agents/codebase-cleanup-analysis.md` |
| Analysis review | `codebase-cleanup-analysis-reviewer` | `agents/codebase-cleanup-analysis-reviewer.md` |
| Confirmed deletion | `codebase-cleanup-deletion` | `agents/codebase-cleanup-deletion.md` |
| Deletion review | `codebase-cleanup-deletion-reviewer` | `agents/codebase-cleanup-deletion-reviewer.md` |
| Refactoring request synthesis | `codebase-cleanup-refactoring-request` | `agents/codebase-cleanup-refactoring-request.md` |

Dispatch selection:
1. If native named subagents are available, use them.
2. Else if generic subagents are available, read the repo-root shared source file and use it as the bounded prompt with placeholders substituted.
3. Else if the scope is small enough to preserve all artifacts and gates inline, set `dispatch_mode: inline-phase-execution` and execute each phase yourself.
4. Else set `dispatch_mode: stop` and report that the cleanup workflow needs subagent support or a smaller scope.

Every subagent dispatch must include only the relevant inputs, the required output paths, and the instruction not to invoke other agent harnesses.

## Artifact Layout

Use this layout under `[MAP_ROOT]`:

```text
[MAP_ROOT]/
  run-config.md
  index.scip
  symbol-index-report.md
  index.md
  map-review.md
  analysis-review.md
  approved-deletions.md
  deletion-report.md
  deletion-review.md
  validation-report.md
  refactoring-request.md
  by-directory/
    <directory-slug>.md
  by-group/
    <group-slug>.md
```

Do not rely only on chat history for phase state. Important decisions and approvals that affect later phases must be written into the relevant artifact.

## Phase Contract

| # | Phase | Parallel? | Inputs | Outputs | Gate |
|---|---|---:|---|---|---|
| 0 | Configure run | no | user request, repo context | `[MAP_ROOT]/run-config.md` | user confirms scope + recursion |
| 0.5 | Build/query symbol index | no | repo language/tooling | `[MAP_ROOT]/index.scip`, `[MAP_ROOT]/symbol-index-report.md` or unavailable note | mapping can cite index status |
| 1 | Map directories | yes | confirmed directory list + optional SCIP index | `[MAP_ROOT]/by-directory/*.md` | all scoped directories represented |
| 2 | Consolidate map | no | `by-directory/*.md` | `[MAP_ROOT]/index.md`, `by-group/*.md` | map review can start |
| 3 | Review map | no | `index.md`, `by-directory/`, `by-group/` | `[MAP_ROOT]/map-review.md` | reviewer says `APPROVED` |
| 4 | Analyze groups | yes | approved `by-group/*.md` | populated `## Analysis` in each group file | all groups analyzed |
| 5 | Review analysis | no | `by-group/*.md` | `[MAP_ROOT]/analysis-review.md` | reviewer says `APPROVED` |
| 6 | Present findings | no | approved analysis | `[MAP_ROOT]/approved-deletions.md` or explicit no-deletion note | user approves exact deletions or declines |
| 7 | Delete confirmed items | no | `approved-deletions.md` | `[MAP_ROOT]/deletion-report.md`, map annotations | deletion review can start |
| 8 | Review deletions | no | deletion report + map files | `[MAP_ROOT]/deletion-review.md` | reviewer says `APPROVED` |
| 9 | Validate | no | changed workspace | `[MAP_ROOT]/validation-report.md` | validation passes or user decides next step |
| 10 | Synthesize follow-up | no | final map + deletion status | `[MAP_ROOT]/refactoring-request.md` | user chooses whether to continue |

If the user declines all deletions, skip phases 7–9 and synthesize follow-up from the reviewed analysis.

## Stop Gates

Stop and ask the user at these points:

1. **Scope gate** — exact paths and recursive/non-recursive behavior are not confirmed.
2. **Deletion approval gate** — reviewed findings exist, but exact deletion records are not approved.
3. **No-validation gate** — destructive edits are requested but no validation command is known.
4. **Validation failure gate** — post-deletion validation fails and the cause is not an obvious cleanup-caused issue you can fix safely.
5. **Follow-up gate** — refactoring opportunities remain and implementation would require design/planning.

Do not ask the user during mapper/analyzer/reviewer phases unless a gate is reached or required context is unavailable.

## Review and Repair Loops

Reviewer output controls routing:

- `APPROVED` → proceed to the next phase.
- `ISSUES FOUND` → repair the named issues, then rerun the same reviewer.
- `BLOCKED` / missing context → supply missing context if available; otherwise ask the user.

Repair routing:

| Issue type | Route to |
|---|---|
| Missing exported/internal symbols in a directory map | rerun `codebase-cleanup-directory-mapper` for that directory |
| Incorrect dead/obsolete test evidence in directory map | rerun `codebase-cleanup-directory-mapper` for that directory |
| Bad semantic grouping, missing directory in index, bad cross-directory dependency | rerun `codebase-cleanup-map-consolidator` |
| Analysis missing required subsections | rerun `codebase-cleanup-analysis` for that group |
| Dead-code claim lacks grep/search evidence | rerun `codebase-cleanup-analysis` for that group |
| Duplication claim lacks implementation comparison | rerun `codebase-cleanup-analysis` for that group |
| Deletion missed an approved item or left broken imports | rerun `codebase-cleanup-deletion` with the same approved records plus reviewer issues |
| Map annotations missing after deletion | rerun `codebase-cleanup-deletion` for annotation repair only |

Never let a reviewer perform the repair itself unless its native prompt explicitly says to edit. Reviewers report issues; the orchestrator dispatches repairs.

## SCIP Query Rules

When `symbol_index.status: available`, prefer SCIP semantic evidence for supported Rust, TypeScript, and Python files. Use the resolved `[SCIP_QUERY_TOOL]` command from the target project root:

```sh
[SCIP_QUERY_TOOL] summary [MAP_ROOT]/index.scip --json
[SCIP_QUERY_TOOL] definitions [MAP_ROOT]/index.scip src/auth/ --json
[SCIP_QUERY_TOOL] refs [MAP_ROOT]/index.scip '<SCIP_SYMBOL>' --outside-file src/auth/legacy.rs --exclude-tests --json
[SCIP_QUERY_TOOL] unused [MAP_ROOT]/index.scip src/auth/ --exclude-tests --json
```

Rules:
- Use exact SCIP symbols from `definitions` output for `refs` queries when possible.
- If querying by display name is ambiguous, use the exact `symbol` field.
- SCIP evidence can prove semantic references in indexed code. It cannot prove absence of dynamic imports, config strings, framework discovery, generated-code contracts, or external public API usage.
- Keep grep/string searches for dynamic/framework/public API risk checks even when SCIP is available.
- If the SCIP index is unavailable, failed, or does not cover a language/path, continue with source reading + grep and label the finding `grep-only evidence`.

## Deletion Approval Format

Before deleting, write `[MAP_ROOT]/approved-deletions.md` with exact records approved by the user:

```yaml
approved_deletions:
  - type: symbol
    symbol: legacyLogin
    file: src/auth/legacy.ts
    reason: no non-test usages found; user approved deletion
  - type: file
    file: src/auth/legacy.test.ts
    reason: obsolete test for removed behavior; user approved deletion
```

Rules:
- Delete only records in `approved_deletions`.
- A whole-file deletion is allowed only when the whole file is approved.
- If a file contains approved and unapproved symbols, remove only approved symbols.
- Cleanup of imports/re-exports is allowed only when it directly references approved deletions.
- Do not bundle refactors with deletion work.
- Exported symbols, framework-discovered entrypoints, config-referenced files, route handlers, plugin hooks, migrations, generated clients, and public package APIs need explicit user confirmation even when no internal usage is found. (Per-finding evidence requirements live in the analysis and analysis-reviewer agents.)

## Validation Gate

After deletion review passes, run the validation commands from `run-config.md` and write `[MAP_ROOT]/validation-report.md`.

The report must include:
- command(s) run
- pass/fail result
- relevant failure excerpts
- classification: `cleanup-caused`, `pre-existing`, or `unknown`
- next action taken or user decision needed

If validation fails because of the cleanup and the fix is limited to approved deletion fallout, fix it and rerun deletion review/validation as needed. If the fix requires broader refactoring or uncertainty, stop and ask the user.

## Final Output

End with:
- map root path
- deletions performed, or “none”
- validation result, or why validation did not run
- path to `refactoring-request.md` if created
- recommended next step
