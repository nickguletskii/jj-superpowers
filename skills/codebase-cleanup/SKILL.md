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
2. **Map directories** — dispatch directory mapper subagents using `agents/directory-mapper-prompt.md` for immediate files in each confirmed directory.
3. **Consolidate map** — dispatch one consolidator using `agents/map-consolidator-prompt.md` to group directory maps semantically.
4. **Review map** — dispatch a reviewer using `agents/map-reviewer-prompt.md`. Fix issues before analysis.
5. **Analyze groups** — dispatch analysis subagents using `agents/analysis-prompt.md` for each semantic group.
6. **Review analysis** — dispatch a reviewer using `agents/analysis-reviewer-prompt.md`. Fix issues before presenting findings.
7. **Present findings** — show evidence-backed dead code, obsolete tests, duplication, and abstraction opportunities. Ask the user which deletions, if any, are approved.
8. **Delete confirmed items only** — if the user approves exact deletions, dispatch `agents/deletion-agent-prompt.md` with only those items.
9. **Review deletions** — dispatch `agents/deletion-reviewer-prompt.md`. Fix issues before synthesis.
10. **Synthesize follow-up** — dispatch `agents/refactoring-request-prompt.md` to create a refactoring request for remaining duplication or abstraction work.

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

## Agent Prompt Pack

Use these prompt templates with bracketed placeholders substituted:

| Phase | Prompt |
|---|---|
| Directory mapping | `agents/directory-mapper-prompt.md` |
| Map consolidation | `agents/map-consolidator-prompt.md` |
| Map review | `agents/map-reviewer-prompt.md` |
| Group analysis | `agents/analysis-prompt.md` |
| Analysis review | `agents/analysis-reviewer-prompt.md` |
| Confirmed deletion | `agents/deletion-agent-prompt.md` |
| Deletion review | `agents/deletion-reviewer-prompt.md` |
| Refactoring request synthesis | `agents/refactoring-request-prompt.md` |

## Common Mistakes

| Mistake | Fix |
|---|---|
| Mapping a vague scope | Ask for concrete directories/files first. |
| Treating possible dead code as confirmed dead code | Present evidence and ask before deleting. |
| Letting subagents talk to the user | Subagents report findings only; orchestrator asks. |
| Skipping reviewers to save time | Review gates are what make large cleanup safe. |
| Turning findings directly into broad refactors | Produce a refactoring request, then use design/planning. |
