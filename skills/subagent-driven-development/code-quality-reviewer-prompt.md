# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer subagent for a verified graph group.

**Purpose:** Verify the verified task group is well-built (clean, tested, maintainable)

**Only dispatch after every upstream spec review passes and the upstream `verify` node succeeds.**

**Verification command policy:** The `verify` node owns compile, type-check, build, lint, test-suite, and smoke-test execution for this group. The code-quality reviewer inspects the verified diff and verification report. Do not rerun the same commands unless code inspection gives a concrete reason to believe the report is stale, incomplete, or contradicted by the diff.

```
Task tool (sdd-quality-reviewer preferred; fallback jj-superpowers:code-reviewer):
  Use the named `sdd-quality-reviewer` agent when available.
  If falling back, fill the template at `../requesting-code-review/code-reviewer.md`.

  WHAT_WAS_IMPLEMENTED: [summary of all tasks in this verified group]
  PLAN_OR_REQUIREMENTS: [plan path plus task files in this group]
  CHANGE_ID: [the toreview: change ID or range for this verified group]
  DESCRIPTION: [quality_review node summary]
  VERIFICATION_REPORT: [commands and results from verify node]
```

**In addition to standard code quality concerns, the reviewer should check:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Does the group remain cohesive across task boundaries?
- Is the implementation following the file structure from the plan?
- Did this group create new files that are already large, or significantly grow existing files? (Don't flag pre-existing file sizes — focus on what this group contributed.)

**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment

**Reporting Gaps:** The code reviewer template (`requesting-code-review/code-reviewer.md`) already instructs the reviewer to invoke `jj-superpowers:wish-i-knew`, `jj-superpowers:wish-i-had`, and `jj-superpowers:documentation` when applicable. No additional relay is needed.
