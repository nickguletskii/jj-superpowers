# Code Review Request

Review the change below for production readiness. Your checklist, mandate scope, and output format are in your agent definition (`jj-superpowers:code-reviewer`).

## What Was Implemented

{WHAT_WAS_IMPLEMENTED}

{DESCRIPTION}

## Requirements / Plan

{PLAN_REFERENCE}

## Review Scope

{REVIEW_SCOPE}

Inspect with (stat first, then the bounded diff):

```bash
{INSPECT_COMMANDS}
```

For a revision: `jj show -r <rev> --stat --no-pager` then `jj show -r <rev> --git --no-pager`. For a range: `jj diff --from <base> --to <head> --stat --no-pager` then the same with `--git`. For a file list or the current `@` diff, the diff text is included below.

{DIFF_OR_FILE_CONTEXT}

## Verification Already Run

{VERIFICATION_SUMMARY}
