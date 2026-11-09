---
name: codebase-cleanup
description: Use when the user asks for broad codebase cleanup, dead-code removal, deduplication sweeps, large refactoring discovery, or cleanup across multiple directories requiring evidence and approval gates
---

# Codebase Cleanup

Large cleanup is a gated workflow: map the code, review it, analyze it, present findings, and make destructive edits only after the user approves exact records. Findings are evidence, deletions are user-approved records, and refactors are follow-up work rather than side effects of cleanup.

For local quality cleanup of a few files use `jj-superpowers:deslopify`; for failures use `jj-superpowers:systematic-debugging`. Refactors this workflow discovers go into a refactoring request and then the normal design/planning workflow.

## Roles

You are the orchestrator: you own user discussion and approval gates, run configuration, artifact paths, subagent dispatch, review/repair loops, validation, and the final summary. Subagents do one bounded task (mapping, consolidation, review, analysis, confirmed deletion, or request synthesis); they do not ask the user questions or spawn other agents.

## Run configuration

Before mapping, agree on a run configuration in conversation and, once `[MAP_ROOT]` exists, write it to `[MAP_ROOT]/run-config.md`:

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

- Paths the user names are the proposed scope; still confirm whether each directory is recursive. `recursive: true` means enumerate descendant directories and map each one that has source files separately (the mapper covers immediate files only).
- Reading outside scope is fine for usage/import evidence. Don't map or edit outside scope unless the user expands it.
- `[MAP_ROOT]` is `docs/superpowers/code-map/YYYY-MM-DD-HHMM/`, with a suffix such as `-2` if it already exists.
- For Rust, TypeScript, or Python projects with a SCIP producer, generate `[MAP_ROOT]/index.scip` before mapping (Rust: `rust-analyzer scip .` or the project's documented command; TS/Python: the project's documented indexer). Otherwise mark the index unavailable and use source reading plus grep.
- The query helper is `~/.jj-superpowers/tools/scip-query` (installed as a stable symlink); prefer the project's own `./tools/scip-query` if it has one. Pass the command and index path as `[SCIP_QUERY_TOOL]` and `[SCIP_INDEX_PATH]` to the mapper, analysis, and analysis-reviewer subagents rather than dumping `.scip` files into context.
- Identify validation commands up front. If none are obvious, record that and ask the user before any destructive edit whether to proceed without validation.

## Dispatch

| Phase | Native agent | Shared-source fallback |
|---|---|---|
| Directory mapping | `codebase-cleanup-directory-mapper` | `agents/codebase-cleanup-directory-mapper.md` |
| Map consolidation | `codebase-cleanup-map-consolidator` | `agents/codebase-cleanup-map-consolidator.md` |
| Map review | `codebase-cleanup-map-reviewer` | `agents/codebase-cleanup-map-reviewer.md` |
| Group analysis | `codebase-cleanup-analysis` | `agents/codebase-cleanup-analysis.md` |
| Analysis review | `codebase-cleanup-analysis-reviewer` | `agents/codebase-cleanup-analysis-reviewer.md` |
| Confirmed deletion | `codebase-cleanup-deletion` | `agents/codebase-cleanup-deletion.md` |
| Deletion review | `codebase-cleanup-deletion-reviewer` | `agents/codebase-cleanup-deletion-reviewer.md` |
| Refactoring request | `codebase-cleanup-refactoring-request` | `agents/codebase-cleanup-refactoring-request.md` |

Use native named subagents when available. Otherwise use generic subagents with the repo-root source file as the prompt, placeholders substituted. Without subagents, run the phases inline (`inline-phase-execution`) if the scope is small enough to keep every artifact and gate; if not, set `dispatch_mode: stop` and report that the workflow needs subagent support or a smaller scope. Give each subagent only its relevant inputs, its output paths, and the instruction not to invoke other agent harnesses.

## Artifacts

```text
[MAP_ROOT]/
  run-config.md  index.scip  symbol-index-report.md  index.md
  map-review.md  analysis-review.md  approved-deletions.md
  deletion-report.md  deletion-review.md  validation-report.md
  refactoring-request.md
  by-directory/<directory-slug>.md
  by-group/<group-slug>.md
```

Record decisions and approvals that later phases depend on in the relevant artifact, not only in chat.

## Phases

| # | Phase | Parallel | Outputs | Gate to proceed |
|---|---|---:|---|---|
| 0 | Configure run | no | `run-config.md` | user confirms scope and recursion |
| 0.5 | Build symbol index | no | `index.scip`, `symbol-index-report.md`, or an unavailable note | index status recorded |
| 1 | Map directories | yes | `by-directory/*.md` | every scoped directory represented |
| 2 | Consolidate map | no | `index.md`, `by-group/*.md` | — |
| 3 | Review map | no | `map-review.md` | `APPROVED` |
| 4 | Analyze groups | yes | `## Analysis` in each group file | all groups analyzed |
| 5 | Review analysis | no | `analysis-review.md` | `APPROVED` |
| 6 | Present findings | no | `approved-deletions.md` or a no-deletion note | user approves exact deletions or declines |
| 7 | Delete confirmed items | no | `deletion-report.md`, map annotations | — |
| 8 | Review deletions | no | `deletion-review.md` | `APPROVED` |
| 9 | Validate | no | `validation-report.md` | passes, or user decides |
| 10 | Synthesize follow-up | no | `refactoring-request.md` | user chooses whether to continue |

If the user declines all deletions, skip 7–9 and synthesize follow-up from the reviewed analysis.

Stop and ask the user when: scope or recursion is unconfirmed; reviewed findings exist but exact deletion records aren't approved; destructive edits are requested with no known validation command; validation fails and the cause isn't an obvious cleanup-caused issue you can safely fix; or refactoring remains that would need design/planning. Between gates, interrupt the user only if required context is missing.

## Review and repair

`APPROVED` → next phase. `ISSUES FOUND` → repair, then rerun the same reviewer. `BLOCKED` or missing context → supply it if you can, otherwise ask the user. Reviewers report; you dispatch repairs (unless a reviewer's prompt explicitly says it edits).

| Issue | Rerun |
|---|---|
| Missing symbols or wrong dead/obsolete-test evidence in a directory map | `directory-mapper` for that directory |
| Bad grouping, directory missing from index, wrong cross-directory dependency | `map-consolidator` |
| Analysis missing subsections, dead-code claim without search evidence, duplication claim without implementation comparison | `analysis` for that group |
| Approved item missed or imports left broken | `deletion` with the same approved records plus reviewer issues |
| Map annotations missing after deletion | `deletion`, annotation repair only |

## SCIP queries

With `symbol_index.status: available`, prefer SCIP evidence for indexed Rust, TypeScript, and Python, run from the project root:

```sh
[SCIP_QUERY_TOOL] summary [MAP_ROOT]/index.scip --json
[SCIP_QUERY_TOOL] definitions [MAP_ROOT]/index.scip src/auth/ --json
[SCIP_QUERY_TOOL] refs [MAP_ROOT]/index.scip '<SCIP_SYMBOL>' --outside-file src/auth/legacy.rs --exclude-tests --json
[SCIP_QUERY_TOOL] unused [MAP_ROOT]/index.scip src/auth/ --exclude-tests --json
```

Use the exact `symbol` field from `definitions` for `refs` when a display name is ambiguous. SCIP proves references in indexed code but not the absence of dynamic imports, config strings, framework discovery, generated-code contracts, or external API use, so keep grep checks for those. Where the index is unavailable or doesn't cover a path, label findings `grep-only evidence`.

## Deletion approval

Before deleting, write the user-approved records to `[MAP_ROOT]/approved-deletions.md`:

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

Delete only these records. Remove a whole file only if the whole file is approved; otherwise remove just the approved symbols. Import/re-export cleanup is limited to references to approved deletions, and refactors stay out of deletion work. Exported symbols, framework-discovered entrypoints, config-referenced files, route handlers, plugin hooks, migrations, generated clients, and public package APIs need explicit user confirmation even with no internal usage. (Per-finding evidence requirements live in the analysis and analysis-reviewer agents.)

## Validation

After deletion review passes, run the configured validation commands and write `validation-report.md` with the commands, pass/fail, relevant failure excerpts, a classification (`cleanup-caused`, `pre-existing`, `unknown`) made from available evidence rather than by rebuilding an earlier revision, and the next action or decision needed. Fix failures that are limited to approved-deletion fallout and rerun review/validation; if the fix needs broader refactoring or you're unsure, ask the user.

## Final output

Map root; deletions performed (or "none"); validation result or why it didn't run; path to `refactoring-request.md` if created; recommended next step.
