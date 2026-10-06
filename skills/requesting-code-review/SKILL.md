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

For planned graph execution, code quality review belongs to `quality_review` nodes — dispatch the `sdd-quality-reviewer` agent there, and follow the review cadence the plan graph defines.

This skill is for ad hoc/manual review outside that gate, or for explicit user-requested review. It is not mandatory after every graph task. Outside a graph quality gate, request manual review before integration and after substantial ad hoc batches.

## How to Request

**1. Determine the review scope:**

Choose the narrowest scope that covers the work:

- **jj revision/change id:** Use when there is a concrete revision to review.
- **Explicit diff range:** Use when the user or workflow supplied a range.
- **File list:** Use when the review should focus on specific touched files.
- **Current `@` diff:** Use when no change id or explicit range exists.

If there is no change id, do not invent one. Use the supplied file list or diff range, or the current `@` diff (`jj diff --stat --no-pager` first, then `jj diff --git --color=never --no-pager <paths>`).

**2. Dispatch code-reviewer subagent:**

Use the Agent tool with `subagent_type: "jj-superpowers:code-reviewer"`, filling the template at `code-reviewer.md`

**Placeholders:**
- `{WHAT_WAS_IMPLEMENTED}` — what you just built; `{DESCRIPTION}` — brief summary
- `{PLAN_REFERENCE}` — what it should do (plan path or requirements)
- `{REVIEW_SCOPE}` — revision/change id, diff range, file list, or current `@` diff
- `{INSPECT_COMMANDS}` — the exact commands for a revision or range
- `{DIFF_OR_FILE_CONTEXT}` — for a file list or `@` diff, the files or diff text the reviewer needs; otherwise empty
- `{VERIFICATION_SUMMARY}` — commands you ran and their results

The checklist (including file-size and decomposition) lives in the `jj-superpowers:code-reviewer` agent; don't restate it in the request.

**3. Act on feedback:**

Reception is its own discipline. When the review comes back, load `jj-superpowers:receiving-code-review` — it owns verifying feedback before implementing, when and how to push back, implementation order, and the no-performative-agreement rule.

### Severity Scale

This is the one severity scale for every jj-superpowers review — code, spec, plan, and design. Other skills reference it rather than redefine it.

- **Critical** — blocks everything: correctness, security, or data-loss error; broken build or tests; missing or contradicted requirement. Fix immediately.
- **Important** — changes the outcome: structural/design flaw, genuine ambiguity (two readings → materially different builds), wrong abstraction boundary, missing test coverage for real behavior. Fix before proceeding.
- **Minor** — deterministically resolvable with no design decision (local improvement, under-specification with one unambiguous fix), or cosmetic/preference. Note for later.

Critical and Important are the **blocking** severities. Iterative review loops (`jj-superpowers:hypothesis-driven-improvement`, `jj-superpowers:brainstorming`, `writing-plans/plan-document-reviewer-prompt.md`) keep the same scale but handle Minors differently: they fold accepted Minors immediately, in the same round, and drop purely cosmetic ones, instead of noting them for later.

## Example

```
[Finished a substantial ad hoc change touching the index verifier]

You: Let me request code review before proceeding.

[Dispatch jj-superpowers:code-reviewer subagent]
  WHAT_WAS_IMPLEMENTED: Verification and repair functions for conversation index
  PLAN_REFERENCE: docs/superpowers/plans/deployment-plan.md
  REVIEW_SCOPE: current @ diff for files indexer.ts, verifier.ts, verifier.test.ts
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

Request template: `requesting-code-review/code-reviewer.md`. Review checklist: `agents/code-reviewer.md`.
