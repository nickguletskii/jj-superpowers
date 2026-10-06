---
name: requesting-code-review
description: Use when finishing substantial ad hoc work, before merging or publishing a change, when the user asks for a code review, or when a fresh perspective would help after a hard bug or before a refactor.
---

# Requesting Code Review

Dispatch the `jj-superpowers:code-reviewer` subagent with a focused request built from the template — never your session history. The reviewer judges the work product rather than your reasoning, and your own context stays free for the work.

## When

- Before merge, integration, or publishing a change.
- After substantial ad hoc work that hasn't passed a planned review gate.
- When the user asks for review.
- Optionally: when stuck, before a refactor (baseline), or after a complex bug fix.

In planned graph execution, quality review belongs to `quality_review` nodes (the `sdd-quality-reviewer` agent) at the cadence the graph defines; this skill is not required after every graph task.

## How

**1. Pick the narrowest scope that covers the work:** a jj revision/change id, an explicit diff range, a file list, or the current `@` diff. Don't invent a change id. For the `@` diff, run `jj diff --stat --no-pager` first, then `jj diff --git --color=never --no-pager <paths>`.

**2. Dispatch** with `subagent_type: "jj-superpowers:code-reviewer"`, filling `code-reviewer.md`:

- `{WHAT_WAS_IMPLEMENTED}`, `{DESCRIPTION}` — what you built, briefly
- `{PLAN_REFERENCE}` — plan path or requirements
- `{REVIEW_SCOPE}` — revision, range, file list, or `@` diff
- `{INSPECT_COMMANDS}` — exact commands for a revision or range
- `{DIFF_OR_FILE_CONTEXT}` — for a file list or `@` diff, the files or diff text; otherwise empty
- `{VERIFICATION_SUMMARY}` — commands you ran and their results

The review checklist lives in the agent definition; don't restate it in the request.

**3. Act on feedback** using `jj-superpowers:receiving-code-review` (verify before implementing, push back with technical reasons).

## Severity scale

This is the single severity scale for every jj-superpowers review — code, spec, plan, and design. Other skills reference it.

- **Critical** — correctness, security, or data-loss error; broken build or tests; missing or contradicted requirement. Fix immediately.
- **Important** — structural/design flaw, genuine ambiguity (two readings → materially different builds), wrong abstraction boundary, missing test coverage for real behavior. Fix before proceeding.
- **Minor** — resolvable with no design decision (local improvement, under-specification with one obvious fix), or cosmetic/preference. Note for later.

Critical and Important are blocking. Iterative review loops (`jj-superpowers:hypothesis-driven-improvement`, `jj-superpowers:brainstorming`, `writing-plans/plan-document-reviewer-prompt.md`) use the same scale but fold accepted Minors in the same round and drop purely cosmetic ones instead of deferring them.

## Related

- `jj-superpowers:receiving-code-review` — handling the findings.
- `jj-superpowers:deslopify` — file-size rule and duplication/overengineering taxonomy the reviewer applies.
