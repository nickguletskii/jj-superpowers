# Skill Library Modernization Implementation Plan

> **Goal:** Align active skills, README, and pseudocode with the current graph-based workflow, jj history model, and multi-platform subagent boundaries.

**Project network:** `project-network.dot`

**Graph rationale:** Documentation and pseudocode updates are mostly independent by file scope, so task nodes can fan out. A single verification reducer batches text searches and repo-hygiene checks after all task-local spec reviews pass, then one quality review covers the coordinated documentation set.

## Context Documents

- `context/architecture.md` - Current workflow model, skill boundaries, and non-goals.
- `context/file-structure.md` - Files owned by each task and existing local patterns.

## Tasks

1. `task-01-readme-catalog.md` - Update README/catalog wording for current workflow and skill inventory.
2. `task-02-executing-plans-graph.md` - Rewrite `executing-plans` and pseudocode for inline graph execution.
3. `task-03-subagent-pseudocode-graph.md` - Align subagent-driven-development pseudocode with graph execution.
4. `task-04-requesting-code-review.md` - Narrow requesting-code-review to ad hoc/manual review.
5. `task-05-codebase-cleanup-boundary.md` - Add subagent authorization/fallback boundaries to codebase-cleanup.
6. `task-06-jj-clean-history.md` - Clarify jj-clean-history and remove missing-skill references.
7. `task-07-uv-guide-platforms.md` - Make uv-guide sandbox guidance platform-neutral.
8. `task-08-hygiene-maintenance.md` - Remove tracked generated artifact and add maintenance checklist.

## Verification

1. `verify-01-skill-library-modernization.md` - Run stale-reference searches, graph-wording checks, pycache tracking check, and status/diff review.
