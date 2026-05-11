# Codebase Cleanup Skill — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `superpowers:codebase-cleanup` — a workflow skill with `SKILL.md` and 8 subagent prompt template files — in `skills/codebase-cleanup/`.

---

```yaml
workflow: multi-route
```
**Workflow:** multi-route — Task 01 (SKILL.md) establishes the conceptual structure; Tasks 02–09 (prompt templates) are fully independent of each other and can be executed in parallel after Task 01.

---

## Context Documents

- `context/skill-conventions.md` — frontmatter rules, CSO guidelines, word count targets, and file structure conventions from `superpowers:writing-skills`

## Tasks

1. `task-01-skill-md.md` — Create `skills/codebase-cleanup/SKILL.md` (orchestration guide)
2. `task-02-directory-mapper-prompt.md` — Create `directory-mapper-prompt.md` (MAP phase)
3. `task-03-map-consolidator-prompt.md` — Create `map-consolidator-prompt.md` (REDUCE phase)
4. `task-04-analysis-prompt.md` — Create `analysis-prompt.md` (per-group analysis)
5. `task-05-deletion-agent-prompt.md` — Create `deletion-agent-prompt.md` (dead code removal)
6. `task-06-refactoring-request-prompt.md` — Create `refactoring-request-prompt.md` (request synthesis)
7. `task-07-map-reviewer-prompt.md` — Create `map-reviewer-prompt.md` (Step 2 review)
8. `task-08-analysis-reviewer-prompt.md` — Create `analysis-reviewer-prompt.md` (Step 3 review)
9. `task-09-deletion-reviewer-prompt.md` — Create `deletion-reviewer-prompt.md` (Step 5 review)
