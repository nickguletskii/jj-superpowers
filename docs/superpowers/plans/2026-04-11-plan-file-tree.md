# Plan File Tree Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-file plan format with a directory of focused files so the orchestrator holds paths rather than content, eliminating auto-compaction loops.

**Architecture:** Six skill files (all Markdown) get targeted edits. No code is written — only skill instructions change. Tasks are ordered so the format is defined before the consumers are updated.

**Tech Stack:** Markdown skill files only. No build system, no tests to run — verification is re-reading the edited file to confirm correctness.

---

```yaml
workflow: chain
```
**Workflow:** chain — writing-plans defines the new directory format, subagent-driven-development consumes it, prompt templates follow; each step depends on the prior's definition being stable.

---

### Task 1: Update `writing-plans/SKILL.md`

**Files:**
- Modify: `skills/writing-plans/SKILL.md`

This task rewrites the plan output format section of the skill. The engineer must read the current file first, then apply all changes below.

- [ ] **Step 1: Read the current file**

```
Read: skills/writing-plans/SKILL.md
```

Confirm the file matches what is currently in the repo before editing.

- [ ] **Step 2: Change the save location line**

Find:
```
**Save plans to:** `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`
```

Replace with:
```
**Save plans to:** `docs/superpowers/plans/YYYY-MM-DD-<feature-name>/` (directory)
```

- [ ] **Step 3: Replace the Plan Document Header section**

Find and replace the entire "## Plan Document Header" section (from the `## Plan Document Header` heading through the closing ```````` fence) with:

````markdown
## Plan Document Header

**`plan.md` is the lightweight index — it must contain only what the orchestrator needs to coordinate.**

````markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

---

```yaml
workflow: simple | chain | multi-route
```
**Workflow:** [one-line rationale — e.g. "simple — single bugfix, one logical concern"]

---

## Context Documents

- `context/tech-stack.md` — [one-line description]
- `context/architecture.md` — [one-line description]

## Tasks

1. `task-01-component-name.md` — [one-line summary]
2. `task-02-component-name.md` — [one-line summary]
````

No architecture prose. No tech stack. No step details. Those live in the files referenced above.
````

- [ ] **Step 4: Add Context Documents section (insert before Task Structure section)**

Insert the following new section immediately before the `## Task Structure` heading:

````markdown
## Context Documents

Create context docs inside `context/` within the plan directory. Create only the docs that multiple tasks would otherwise need to repeat. Common ones:

- **`context/tech-stack.md`** — languages, frameworks, key libraries and versions
- **`context/architecture.md`** — approach, key decisions, module boundaries
- **`context/file-structure.md`** — which files exist, what each is responsible for, existing patterns to follow (optional — only if non-obvious)

Each context doc is a short focused document. No step-by-step content — that belongs in task files.
````

- [ ] **Step 5: Replace the Task Structure section**

Find and replace the entire "## Task Structure" section (from the heading through the closing ```````` fence) with:

````markdown
## Task Structure

Each task gets its own file at the root of the plan directory: `task-NN-component-name.md`.

````markdown
# Task N: [Component Name]

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

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS
````

No tech stack. No architecture context. No references to sibling tasks by name. If a task depends on a type or function produced by a previous task, include it explicitly in the task file — do not assume the subagent will read another task file.
````

- [ ] **Step 6: Update the Execution Handoff section**

Find:
```
**"Plan complete and saved to `docs/superpowers/plans/<filename>.md`. Two execution options:**
```

Replace with:
```
**"Plan complete and saved to `docs/superpowers/plans/<directory-name>/`. Two execution options:**
```

- [ ] **Step 7: Verify**

Re-read `skills/writing-plans/SKILL.md` in full. Confirm:
- Save location says "directory"
- Plan Document Header shows `plan.md` with Context Documents and Tasks sections (no Architecture or Tech Stack)
- Context Documents section exists and lists the three common doc types
- Task Structure shows individual task file format with no shared context repeated
- Execution Handoff references directory path

---

### Task 2: Update `subagent-driven-development/SKILL.md`

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md`

This task changes the orchestrator flow: it reads only `plan.md` upfront, and dispatches subagents with file paths + dynamic annotations rather than pasted task content. It also inverts a critical red flag.

- [ ] **Step 1: Read the current file**

```
Read: skills/subagent-driven-development/SKILL.md
```

- [ ] **Step 2: Update the workflow diagram startup node**

In the DOT digraph, find:
```
"Read plan, extract all tasks with full text, note context, create TodoWrite" [shape=box];
```

Replace with:
```
"Read plan.md only — get task list + context doc list. Create TodoWrite." [shape=box];
```

Also update the edge from that node:
```
"Read plan, extract all tasks with full text, note context, create TodoWrite" -> "Dispatch implementer subagent (./implementer-prompt.md)";
```

Replace with:
```
"Read plan.md only — get task list + context doc list. Create TodoWrite." -> "Dispatch implementer subagent (./implementer-prompt.md)";
```

- [ ] **Step 3: Update the Example Workflow section**

Find:
```
[Read plan file once: docs/superpowers/plans/feature-plan.md]
[Extract all 5 tasks with full text and context]
[Create TodoWrite with all tasks]
```

Replace with:
```
[Read plan.md once: docs/superpowers/plans/feature-plan/plan.md]
[Note: 5 tasks, context docs at context/tech-stack.md + context/architecture.md]
[Create TodoWrite with all tasks]
```

Find:
```
[Get Task 1 text and context (already extracted)]
[Dispatch implementation subagent with full task text + context]
```

Replace with (and apply same pattern to Task 2 block):
```
[Dispatch implementation subagent with task file path + context doc paths + dynamic annotations]
```

Find:
```
[Get Task 2 text and context (already extracted)]
[Dispatch implementation subagent with full task text + context]
```

Replace with:
```
[Dispatch implementation subagent with task file path + context doc paths + dynamic annotations]
```

- [ ] **Step 4: Invert the red flag about subagent file reading**

In the **Never:** list under **Red Flags**, find:
```
- Make subagent read plan file (provide full text instead)
```

Replace with:
```
- Paste full task text into subagent prompt — pass the task file path and let the subagent read it
- Read task files yourself before dispatching — the orchestrator holds paths, not content
```

- [ ] **Step 5: Update the Efficiency gains bullet**

Find:
```
- No file reading overhead (controller provides full text)
- Controller curates exactly what context is needed
- Subagent gets complete information upfront
- Questions surfaced before work begins (not after)
```

Replace with:
```
- Orchestrator context stays lean (holds paths, not task content)
- Controller curates exactly what context is needed via dynamic annotations
- Subagent reads its own files (fresh context, no orchestrator pollution)
- Questions surfaced before work begins (not after)
```

- [ ] **Step 6: Verify**

Re-read `skills/subagent-driven-development/SKILL.md`. Confirm:
- Startup step says "Read plan.md only"
- Example workflow shows file paths being passed, not full text
- Red flag says "Paste full task text" is forbidden (not "make subagent read file")
- Efficiency gains reflect the new model

---

### Task 3: Update `implementer-prompt.md`

**Files:**
- Modify: `skills/subagent-driven-development/implementer-prompt.md`

This task replaces the pasted task content block with file path instructions and adds an Orchestrator Notes section.

- [ ] **Step 1: Read the current file**

```
Read: skills/subagent-driven-development/implementer-prompt.md
```

- [ ] **Step 2: Replace the Task Description section**

Find (inside the prompt template code block):
```
    ## Task Description

    [FULL TEXT of task from plan - paste it here, don't make subagent read file]
```

Replace with:
```
    ## Your Task

    Read the following files before starting. All paths are relative to `[working directory]`.

    - **Task file:** `[path/to/task-NN-component-name.md]`
    - **Context:** `[context/tech-stack.md]`, `[context/architecture.md]`
      (include only the context docs that exist for this plan)

    ## Orchestrator Notes

    [Dynamic annotations from the orchestrator — outputs from prior tasks (e.g. new types,
    APIs, or files produced), clarifications agreed on during this session, anything not
    captured in the static files above. Omit this section if there are no annotations.]
```

- [ ] **Step 3: Verify**

Re-read `skills/subagent-driven-development/implementer-prompt.md`. Confirm:
- No `[FULL TEXT of task from plan...]` placeholder remains
- "Your Task" section instructs subagent to read the task file and context docs
- "Orchestrator Notes" section exists for dynamic annotations
- The jj constraint block and all other sections are unchanged

---

### Task 4: Update `spec-reviewer-prompt.md`

**Files:**
- Modify: `skills/subagent-driven-development/spec-reviewer-prompt.md`

This task replaces the pasted task requirements block with a file path instruction.

- [ ] **Step 1: Read the current file**

```
Read: skills/subagent-driven-development/spec-reviewer-prompt.md
```

- [ ] **Step 2: Replace the What Was Requested section**

Find (inside the prompt template code block):
```
    ## What Was Requested

    [FULL TEXT of task requirements]
```

Replace with:
```
    ## What Was Requested

    Read the task file to understand what was requested. All paths are relative to `[working directory]`.

    - **Task file:** `[path/to/task-NN-component-name.md]`
    - **Context:** `[context/tech-stack.md]`, `[context/architecture.md]`
      (include only the context docs that exist for this plan)
```

- [ ] **Step 3: Verify**

Re-read `skills/subagent-driven-development/spec-reviewer-prompt.md`. Confirm:
- No `[FULL TEXT of task requirements]` placeholder remains
- "What Was Requested" instructs reviewer to read the task file
- "What Implementer Claims They Built", "CRITICAL: Do Not Trust the Report", and all other sections are unchanged

---

### Task 5: Update `code-quality-reviewer-prompt.md`

**Files:**
- Modify: `skills/subagent-driven-development/code-quality-reviewer-prompt.md`

This task updates the PLAN_OR_REQUIREMENTS field to reference the task file path.

- [ ] **Step 1: Read the current file**

```
Read: skills/subagent-driven-development/code-quality-reviewer-prompt.md
```

- [ ] **Step 2: Update the PLAN_OR_REQUIREMENTS field**

Find:
```
  PLAN_OR_REQUIREMENTS: Task N from [plan-file]
```

Replace with:
```
  PLAN_OR_REQUIREMENTS: [path/to/task-NN-component-name.md]
```

- [ ] **Step 3: Verify**

Re-read `skills/subagent-driven-development/code-quality-reviewer-prompt.md`. Confirm:
- PLAN_OR_REQUIREMENTS now says task file path
- All other fields (WHAT_WAS_IMPLEMENTED, CHANGE_ID, DESCRIPTION) are unchanged

---

### Task 6: Update `executing-plans/SKILL.md`

**Files:**
- Modify: `skills/executing-plans/SKILL.md`

This task updates Step 1 to read plan.md first, then task files in sequence.

- [ ] **Step 1: Read the current file**

```
Read: skills/executing-plans/SKILL.md
```

- [ ] **Step 2: Replace Step 1 in The Process section**

Find:
```
### Step 1: Load and Review Plan
1. Read plan file
2. Review critically - identify any questions or concerns about the plan
3. If concerns: Raise them with your human partner before starting
4. If no concerns: Create TodoWrite and proceed
```

Replace with:
```
### Step 1: Load and Review Plan
1. Read `plan.md` from the plan directory to get the task list and context doc list
2. Review critically - identify any questions or concerns about the plan
3. If concerns: Raise them with your human partner before starting
4. If no concerns: Create TodoWrite and proceed
```

- [ ] **Step 3: Update Step 2 to read task files in sequence**

Find:
```
### Step 2: Execute Tasks

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed
```

Replace with:
```
### Step 2: Execute Tasks

For each task:
1. Mark as in_progress
2. Read the task file (path listed in plan.md) and relevant context docs from `context/`
3. Follow each step exactly (task file has bite-sized steps)
4. Run verifications as specified
5. Mark as completed
```

- [ ] **Step 4: Verify**

Re-read `skills/executing-plans/SKILL.md`. Confirm:
- Step 1 says "Read plan.md from the plan directory"
- Step 2 says "Read the task file and relevant context docs"
- All other content (when to stop, when to revisit, remember section) is unchanged
