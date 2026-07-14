---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements
---

# Requesting Code Review

Dispatch jj-superpowers:code-reviewer subagent to catch issues before they cascade. The reviewer gets precisely crafted context for evaluation — never your session's history. This keeps the reviewer focused on the work product, not your thought process, and preserves your own context for continued work.

**Core principle:** Request focused review at the boundaries where independent scrutiny changes the outcome.

## When to Request Review

**Mandatory:**
- Before merge, integration, or publishing a change
- After substantial ad hoc work that did not already pass through a planned review gate
- When the user asks for code review

**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug

## Relationship to Planned Graphs

For planned graph execution, code quality review belongs to `quality_review` nodes — use `subagent-driven-development/code-quality-reviewer-prompt.md` there, and follow the review cadence the plan graph defines.

This skill is for ad hoc/manual review outside that gate, or for explicit user-requested review. It is not mandatory after every graph task. Outside a graph quality gate, request manual review before integration and after substantial ad hoc batches.

## How to Request

**1. Determine the review scope:**

Choose the narrowest scope that covers the work:

- **jj revision/change id:** Use when there is a concrete revision to review.
- **Explicit diff range:** Use when the user or workflow supplied a range.
- **File list:** Use when the review should focus on specific touched files.
- **Current `@` diff:** Use when no change id or explicit range exists.

If there is no change id, do not invent one. Use the supplied file list or diff range, or capture the current diff with:

```bash
jj diff --git --color=never --no-pager
```

**2. Dispatch code-reviewer subagent:**

Use Task tool with jj-superpowers:code-reviewer type, fill template at `code-reviewer.md`

**Placeholders:**
- `{WHAT_WAS_IMPLEMENTED}` - What you just built
- `{PLAN_OR_REQUIREMENTS}` - What it should do
- `{CHANGE_ID}` - The review scope: revision/change id, diff range, explicit file list, or current `@` diff
- `{DESCRIPTION}` - Brief summary

When the template labels this section `CHANGE_ID` but the scope is not a revision, treat that field as `REVIEW_SCOPE` and replace revision-only inspection commands with the supplied range, file list, or current `@` diff. When using a file list or current `@` diff, include the exact files or diff text/context needed for review in the request body. When using a revision or range, include the command the reviewer should use to inspect it.

**3. Act on feedback:**

Reception is its own discipline. When the review comes back, load `jj-superpowers:receiving-code-review` — it owns verifying feedback before implementing, when and how to push back, implementation order, and the no-performative-agreement rule.

Severity routing for reviews requested through this skill:
- Critical — fix immediately; blocks everything
- Important — fix before proceeding
- Minor — note for later

## Required Review Lens: File Size and Decomposition

The reviewer must evaluate file boundaries, not just correctness.

- Apply the file-size discipline owned by `jj-superpowers:deslopify` — load its canonical file-size rule for the thresholds. Flag touched files that cross them unless there is a strong, explicit reason not to split them.
- Ask whether parsing, validation, orchestration, rendering, state management, and I/O are being mixed in one file when they could be separate logical units.
- Prefer extracting self-contained units with narrow interfaces so each file is easier for humans and agents to read, review, and modify.

When requesting review, explicitly ask the reviewer to check for oversized files and missing decomposition.

## Example

```
[Finished a substantial ad hoc change touching the index verifier]

You: Let me request code review before proceeding.

[Dispatch jj-superpowers:code-reviewer subagent]
  WHAT_WAS_IMPLEMENTED: Verification and repair functions for conversation index
  PLAN_OR_REQUIREMENTS: docs/superpowers/plans/deployment-plan.md
  CHANGE_ID: current @ diff for files indexer.ts, verifier.ts, verifier.test.ts
  DESCRIPTION: Added verifyIndex() and repairIndex() with 4 issue types

[Subagent returns]:
  Strengths: Clean architecture, real tests
  Issues:
    Important: Missing progress indicators
    Minor: Magic number (100) for reporting interval
  Assessment: Ready to proceed

You: [Fix progress indicators]
[Continue to Task 3]
```

## Related Skills

- `jj-superpowers:receiving-code-review` — what to do with the findings once the reviewer returns them, including how to push back when the reviewer is wrong (technical reasoning, not deference; verify the claim against the code first)
- `jj-superpowers:deslopify` — canonical file-size rule and duplication/overengineering taxonomy the reviewer applies

Template: `requesting-code-review/code-reviewer.md`
