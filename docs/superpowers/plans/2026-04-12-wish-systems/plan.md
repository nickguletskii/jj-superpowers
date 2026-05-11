# Wish Systems Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three feedback-collection skills (wish-i-knew, wish-i-had, doc-wishlist) and inject usage instructions into all agent-facing skill files and subagent prompt templates.

---

```yaml
workflow: multi-route
```
**Workflow:** multi-route — three tasks touch entirely different files with no shared content or dependencies.

---

## Context Documents

- `context/skill-conventions.md` — skill file format, frontmatter schema, and patterns used in this project

## Tasks

1. `task-01-new-skill-files.md` — Create the three new skill files (wish-i-knew, wish-i-had, doc-wishlist)
2. `task-02-inject-orchestrator-skills.md` — Add "Reporting Gaps" section to using-superpowers and executing-plans skills
3. `task-03-inject-subagent-prompts.md` — Add "Reporting Gaps" section inside the three subagent prompt templates
