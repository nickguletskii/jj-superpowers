# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer subagent for a verified graph group. Quality review is an **implied** gate: it runs after every `verify` node — or after that verify's simplification, when it is marked `simplify=true`. There is no `quality_review` node in the graph.

**Purpose:** Verify the verified task group is well-built (clean, tested, maintainable)

**Scope is derived, not authored:** the verified task group is every `task` node that reaches this verify. Compute it from the graph. Its mandate is maintainability/production-risk only — duplication detection belongs to simplification.

**Only dispatch after every upstream task has passed spec review and the `verify` node succeeds.**

**Verification command policy:** The `verify` node owns compile, type-check, build, lint, test-suite, and smoke-test execution for this group. The code-quality reviewer inspects the verified diff and verification report. Do not rerun the same commands unless code inspection gives a concrete reason to believe the report is stale, incomplete, or contradicted by the diff.

**No nested harnesses:** Do not invoke another agent harness through any channel
— not the shell (`claude`, `codex`, `opencode`) and not
MCP tools (e.g. `mcp__codex__codex`). Having the tool available is not permission
to use it. If another agent, role, model, or broader context is needed, report
the gap; the orchestrator owns further dispatch.

```
Task tool (sdd-quality-reviewer preferred; fallback jj-superpowers:code-reviewer):
  Use the named `sdd-quality-reviewer` agent when available.
  If falling back, fill the template at `../requesting-code-review/code-reviewer.md`.

  WHAT_WAS_IMPLEMENTED: [summary of all tasks in this verified group]
  PLAN_OR_REQUIREMENTS: [plan path plus task files in this group]
  CHANGE_ID: [the consolidated change ID or range for this verified group]
  DESCRIPTION: [verify node id plus its derived task group]
  VERIFICATION_REPORT: [commands and results from verify node]
```

**In addition to standard code quality concerns, the reviewer should check:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Does the group remain cohesive across task boundaries?
- Is the implementation following the file structure from the plan?
- Did this group create new files that are already large, or significantly grow existing files? (Don't flag pre-existing file sizes — focus on what this group contributed.)

**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment

**Reporting Gaps:** The code reviewer template (`requesting-code-review/code-reviewer.md`) already instructs the reviewer to invoke `jj-superpowers:documentation` when applicable. No additional relay is needed.
