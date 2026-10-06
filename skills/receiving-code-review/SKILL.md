---
name: receiving-code-review
description: Use when receiving code review feedback, before implementing suggestions — especially when feedback is unclear, broad, or technically questionable.
---

# Receiving Code Review

Review feedback is a set of claims to check, not instructions to execute. Verify each against the codebase, then fix it or push back with a technical reason.

## Process

1. Read all of it before acting.
2. If any item is unclear, ask about it before implementing anything — items are often related, and a partial understanding produces the wrong fix. ("I understand 1, 2, 3, 6; need clarification on 4 and 5.")
3. Verify each claim against the code: is it correct for this codebase, would it break existing behavior, is there a reason for the current implementation (platform, version, compatibility), does the reviewer have full context?
4. Implement in order: blocking issues (breakage, security), then simple fixes, then complex ones. Test each fix and check for regressions.

No performative agreement ("You're absolutely right!", "Great point!", thanks): state the fix or the technical objection.

## Sources

- **User feedback** is trusted: implement once you understand it, asking only if scope is unclear.
- **External reviewers** (including subagent reviewers) get the verification above. If you can't verify a claim, say what you'd need. If a suggestion conflicts with a decision the user already made, raise it with the user before changing anything.

## Check reality before building

"Implement it properly" can be a request for overengineering. Before building out a feature a reviewer flagged, grep for actual usage; if nothing calls it, propose removing it instead. Apply the overengineering taxonomy in `jj-superpowers:deslopify` rather than re-deriving one.

## Oversized files

Treat file-size feedback as architectural, not cosmetic. The thresholds live in `jj-superpowers:deslopify`. Check whether the file mixes concerns and, if so, split it by responsibility now rather than deferring.

## Pushing back

Push back when the suggestion breaks existing behavior, is wrong for this stack, ignores legacy/compatibility constraints, builds on something unused, or conflicts with the user's architectural decisions. Cite code or tests and involve the user for architectural disagreements. As a subagent, report `BLOCKED` with the concern and evidence; in a user session, ask the user.

Example:

```
Reviewer: "Remove the legacy code path."
Response: "Build target is 10.15+, and this API needs 13+, so the legacy path is still required.
           The current impl has the wrong bundle ID — fix that, or drop pre-13 support?"
```

If your pushback turns out wrong, say so factually ("Checked X; you're right because Y. Fixing.") and move on — no long apology or defense.

## GitHub threads

Reply to inline review comments in their thread (`gh api repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies`), not as a top-level PR comment.
