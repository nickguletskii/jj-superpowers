# Plan File Tree: Design

## Goal

Replace the single-file plan format with a directory of focused files. The orchestrator reads only the lightweight index (`plan.md`); subagents read their own task files. This eliminates the large plan dump that causes auto-compaction loops in the orchestrator's context, and stops the orchestrator from pasting full task text into every subagent prompt.

---

## Motivation

The current model requires the orchestrator to:
1. Read the entire plan file upfront ("extract all tasks with full text")
2. Paste the full task text into every implementer and reviewer subagent prompt

On any non-trivial plan, this floods the orchestrator's context and triggers auto-compaction loops. The fix: the orchestrator holds paths, not content. Subagents own their own reads.

---

## Directory Structure

```
docs/superpowers/plans/YYYY-MM-DD-feature/
  plan.md
  context/
    tech-stack.md
    architecture.md
    file-structure.md     (optional — create as needed)
  task-01-component-name.md
  task-02-component-name.md
  ...
```

---

## File Contents

### `plan.md`

Contains only what the orchestrator needs to coordinate:

- Feature name and one-sentence goal
- Workflow type + rationale line
- **Context documents** — list of context doc paths with one-line descriptions
- **Task list** — ordered list of tasks, each with: relative file path + one-line summary

No architecture prose. No tech stack. No step details. Those live in the files they reference.

Example:

```markdown
# Feature Name Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** One sentence describing what this builds.

**Workflow:** multi-route — Settings and Profile pages are independent; no shared files.

---

## Context Documents

- `context/tech-stack.md` — languages, frameworks, key libraries
- `context/architecture.md` — architectural approach and key decisions
- `context/file-structure.md` — which files do what, existing patterns

## Tasks

1. `task-01-hook-installation.md` — Install hook script and wire up CLI command
2. `task-02-recovery-modes.md` — Add verify and repair modes to the hook runner
3. `task-03-tests.md` — Integration tests for all modes
```

### Context documents

Created as needed per plan. Common ones:

- **`context/tech-stack.md`** — languages, frameworks, key libraries and versions
- **`context/architecture.md`** — approach, key decisions, module boundaries
- **`context/file-structure.md`** — which files exist, what each is responsible for, existing patterns to follow

Not all plans need all three. Only create context docs that multiple task files would otherwise need to repeat.

### Task files

Each task file is standalone for implementation purposes:

```markdown
# Task N: Component Name

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

...
```

No tech stack. No architecture context. No references to sibling tasks. If a task depends on a type or function from a previous task, the plan author includes it explicitly in the task file.

---

## Orchestrator Flow (`subagent-driven-development`)

**Startup:**
1. Read `plan.md` only — get context doc list and ordered task list
2. Create TodoWrite from task list

**Per task:**
1. Dispatch subagent with:
   - Path to task file
   - Paths to all context docs for this plan
   - Dynamic annotations inline (e.g. "Task 1 introduced `FooType` — your task consumes it")
2. Do NOT read the task file; do NOT paste task content
3. Handle status (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED) as before

**Dynamic annotations** are the orchestrator's only contribution to the subagent's context beyond file paths. Use them for:
- Outputs from prior tasks (new types, APIs, file paths produced)
- Clarifications agreed on during this session
- Anything not captured in the static files

---

## Prompt Template Changes

### Implementer prompt

Old:
```
## Task Description
[FULL TEXT of task from plan - paste it here, don't make subagent read file]
```

New:
```
## Your Task

Read these files before starting:
- **Task:** `[relative path to task file]`
- **Context:** `[context/tech-stack.md]`, `[context/architecture.md]`

## Orchestrator Notes

[Dynamic annotations — previous task outputs, dependencies, anything not in the files]
```

### Spec reviewer prompt

Same change: replace `[FULL TEXT of task requirements]` with a task file path and context doc paths.

### Code quality reviewer prompt

Update `PLAN_OR_REQUIREMENTS` to reference the task file path instead of a position within a monolithic plan file.

---

## `executing-plans` Changes

This skill runs inline (not via subagents), so it reads freely. Change:
- Read `plan.md` first to get the task list
- Read each task file in sequence as execution proceeds

No context pressure problem here — the same agent works through tasks one at a time.

---

## `writing-plans` Changes

- **Save location:** `docs/superpowers/plans/YYYY-MM-DD-<feature-name>/` (directory, not file)
- **Outputs:** `plan.md` + `context/` docs + one task file per task
- **Plan Document Header section:** updated to describe `plan.md` structure
- **Task Structure section:** updated to describe individual task file format
- **New section:** Context Documents — when to create them, what each contains
- **Execution Handoff:** references directory path instead of `.md` file path

---

## Red Flag Inversion

The existing `subagent-driven-development` red flag list includes:

> ❌ Make subagent read plan file (provide full text instead)

This inverts under the new design:

> ❌ Paste full task text into subagent prompt — pass the task file path and let the subagent read it
> ❌ Read task files yourself before dispatching — the orchestrator holds paths, not content

---

## Files Changed

| File | Change type |
|---|---|
| `writing-plans/SKILL.md` | Medium — new output format, new section for context docs, updated task structure |
| `subagent-driven-development/SKILL.md` | Medium — orchestrator flow, red flags inverted, example workflow updated |
| `subagent-driven-development/implementer-prompt.md` | Small — task content → task file path + context paths |
| `subagent-driven-development/spec-reviewer-prompt.md` | Small — task requirements → task file path |
| `subagent-driven-development/code-quality-reviewer-prompt.md` | Small — plan file reference → task file path |
| `executing-plans/SKILL.md` | Small — read plan.md + task files in sequence |

---

## Invariants Preserved

- Task granularity (2-5 minutes) unchanged
- TDD requirement unchanged
- Two-stage review (spec compliance → code quality) unchanged
- BLOCKED / NEEDS_CONTEXT escalation paths unchanged
- `jj commit toorg:` constraint on implementers unchanged
