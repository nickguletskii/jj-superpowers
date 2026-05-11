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

## Planned Graph Implementation

For planned graph execution, code quality review belongs to `quality_review` nodes. Use `subagent-driven-development/code-quality-reviewer-prompt.md` for those nodes.

This skill is for ad hoc/manual review requests outside that planned graph gate, or for explicit user-requested review. It is not mandatory after every graph task.

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
- Fix Critical issues immediately
- Fix Important issues before proceeding
- Note Minor issues for later
- Push back if reviewer is wrong (with reasoning)

## Required Review Lens: File Size and Decomposition

The reviewer must evaluate file boundaries, not just correctness.

- Flag touched files that grow beyond roughly 500 lines unless there is a strong, explicit reason not to split them.
- Treat files at 1000 lines or more as presumptively unacceptable. The default outcome should be "split this before merge."
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

## Integration with Workflows

**Subagent-Driven Development:**
- Planned graph implementation uses `quality_review` nodes for code quality review.
- Use `subagent-driven-development/code-quality-reviewer-prompt.md` at those nodes.
- Use this skill only for ad hoc/manual review outside the planned graph gate, or when the user explicitly asks.

**Executing Plans:**
- Use the review cadence defined by the plan graph.
- If working outside a graph quality gate, request manual review before integration or after substantial ad hoc batches.

**Ad-Hoc Development:**
- Review before merge
- Review when stuck
- Review after substantial changes

## Red Flags

**Never:**
- Skip review because "it's simple"
- Ignore Critical issues
- Proceed with unfixed Important issues
- Argue with valid technical feedback
- Treat a 1000+ line touched file as normal
- Keep unrelated responsibilities together because "the tests pass"

**If reviewer wrong:**
- Push back with technical reasoning
- Show code/tests that prove it works
- Request clarification

See template at: requesting-code-review/code-reviewer.md
