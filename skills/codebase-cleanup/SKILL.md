---
name: codebase-cleanup
description: Use when the user asks for broad codebase cleanup, dead-code removal, deduplication sweeps, large refactoring discovery, or cleanup across multiple directories requiring evidence and approval gates
---

# Codebase Cleanup

## Overview

Large cleanup is a map/reduce workflow, not a hunch-driven edit pass. Build an evidence-backed code map, review it, present findings to the user, and only then make confirmed changes.

**Core principle:** Findings are evidence; destructive edits require explicit user confirmation.

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
- implementing refactors found by this workflow → first produce a refactoring request, then use the normal design/planning workflow

## Required Workflow

1. **Confirm scope** — ask the user which directories/files are in scope. Do not map unconfirmed areas except to understand dependencies.
2. **Map directories** — dispatch `codebase-cleanup-directory-mapper` for immediate files in each confirmed directory.
3. **Consolidate map** — dispatch `codebase-cleanup-map-consolidator` to group directory maps semantically.
4. **Review map** — dispatch `codebase-cleanup-map-reviewer`. Fix issues before analysis.
5. **Analyze groups** — dispatch `codebase-cleanup-analysis` for each semantic group.
6. **Review analysis** — dispatch `codebase-cleanup-analysis-reviewer`. Fix issues before presenting findings.
7. **Present findings** — show evidence-backed dead code, obsolete tests, duplication, and abstraction opportunities. Ask the user which deletions, if any, are approved.
8. **Delete confirmed items only** — if the user approves exact deletions, dispatch `codebase-cleanup-deletion` with only those items.
9. **Review deletions** — dispatch `codebase-cleanup-deletion-reviewer`. Fix issues before synthesis.
10. **Synthesize follow-up** — dispatch `codebase-cleanup-refactoring-request` to create a refactoring request for remaining duplication or abstraction work.

## Approval Gates

- User confirms scope before mapping.
- User confirms exact deletions before any destructive edit.
- User confirms whether to continue from the refactoring request into design/planning.

## Evidence Rules

- Dead-code claims require search evidence outside the defining file, excluding tests and generated files.
- Duplication claims require reading both implementations, not just matching names.
- Abstraction opportunities must name files, functions/symbols, shared logic, and a proposed extraction.
- Reviewers gate map, analysis, and deletion phases before the workflow proceeds.

## Subagent Boundaries

The orchestrator owns user discussion, scope decisions, approvals, and final synthesis. Subagents perform bounded mapping, analysis, review, confirmed deletion, or request-writing tasks only.

Subagents must not invoke `claude`, `codex`, `gemini`, `opencode`, Copilot CLI, or any other agent harness from the shell. If another agent, role, model, or broader context is needed, they report the gap; the orchestrator owns further dispatch.

## Native Agents

Prefer native named subagents when the harness supports them. If native named subagents are not installed or not available in the current harness, use the shared source files in `agents/codebase-cleanup-*.md` as bounded subagent prompts.

| Phase | Native agent | Shared source |
|---|---|---|
| Directory mapping | `codebase-cleanup-directory-mapper` | `agents/codebase-cleanup-directory-mapper.md` |
| Map consolidation | `codebase-cleanup-map-consolidator` | `agents/codebase-cleanup-map-consolidator.md` |
| Map review | `codebase-cleanup-map-reviewer` | `agents/codebase-cleanup-map-reviewer.md` |
| Group analysis | `codebase-cleanup-analysis` | `agents/codebase-cleanup-analysis.md` |
| Analysis review | `codebase-cleanup-analysis-reviewer` | `agents/codebase-cleanup-analysis-reviewer.md` |
| Confirmed deletion | `codebase-cleanup-deletion` | `agents/codebase-cleanup-deletion.md` |
| Deletion review | `codebase-cleanup-deletion-reviewer` | `agents/codebase-cleanup-deletion-reviewer.md` |
| Refactoring request synthesis | `codebase-cleanup-refactoring-request` | `agents/codebase-cleanup-refactoring-request.md` |

## Common Mistakes

| Mistake | Fix |
|---|---|
| Mapping a vague scope | Ask for concrete directories/files first. |
| Treating possible dead code as confirmed dead code | Present evidence and ask before deleting. |
| Letting subagents talk to the user | Subagents report findings only; orchestrator asks. |
| Skipping reviewers to save time | Review gates are what make large cleanup safe. |
| Turning findings directly into broad refactors | Produce a refactoring request, then use design/planning. |
