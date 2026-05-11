---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of a jj work scope by presenting structured options for integration, PR, or cleanup
---

# Finishing a Development Work Scope

## Overview

Guide completion of development work by presenting clear options and handling the chosen workflow.

**Core principle:** Pre-flight DAG checks → Verify tests → User review + rename changes → Present options → Execute choice → Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## The Process

### Step 0: Pre-flight DAG checks

Run all three checks before anything else. A dirty DAG must be resolved before proceeding to test verification or integration.

**Check 1 — `@` must be empty (no unmerged work):**
```bash
jj diff --no-pager --stat
```
Any output = uncommitted changes remain in `@`. Commit them with `jj commit [files] -m 'toorg: ...'` or abandon them before continuing.

**Check 2 — No divergent changes:**
```bash
jj log -r 'divergent() & (trunk()..@)' --no-pager
```
Any output = a change ID has multiple successors. Use `jj op log` + `jj undo` to recover before continuing.

**Check 3 — No conflicted changes:**
```bash
jj log -r 'conflicts() & (trunk()..@)' --no-pager
```
Any output = unresolved merge conflicts remain. Edit the conflict markers in the listed files, then `jj describe -r <id> -m "..."` to confirm resolution.

**If all three pass:** continue to Step 0.5.

**If any fail:** stop. Report which check failed and what must be fixed. Do not proceed to test verification or integration.

### Step 0.5: Optional DAG Organization

Show the current history:
```bash
jj log -r 'trunk()..@' --no-pager \
  --template 'change_id.short(8) ++ "  " ++ description.first_line() ++ "\n"'
```

If `toorg:` commits are present, ask:

> "Your `toorg:` commits are visible above. Would you like to organize them into a logical jj DAG before proceeding?
>
> - **Yes** — invoke `jj-reorg-changes`, then return here
> - **No** — proceed as-is (commits will be renamed to semantic descriptions in Step 2.5)"

Wait for user choice. If yes: **REQUIRED SUB-SKILL:** Use jj-superpowers:jj-reorg-changes. Return here after it completes.

If no `toorg:` commits are present (work is already organized), skip this step.

### Step 1: Verify Tests

**Before presenting options, verify tests pass:**

```bash
# Run project's test suite
pnpm run test / cargo test / pytest / go test ./...
```

**If tests fail:**
```
Tests failing (<N> failures). Must fix before completing:

[Show failures]

Cannot proceed with merge/PR until tests pass.
```

Stop. Don't proceed to Step 2.

**If tests pass:** Continue to Step 2.

### Step 2: Identify the Work

Find the changes to be integrated:

```bash
jj log -r 'trunk()..@' --no-pager \
  --template 'change_id.short(8) ++ "  " ++ description.first_line() ++ "\n"'
```

This will show one of two shapes:

**Organized DAG** (ran `jj-reorg-changes`): identify `scope0` (scope merge), `plan0` (plan change), `toreview:` sub-routes (completed implementation), `temp0` (temp/handoff change).

**Unorganized** (skipped reorganization): identify `toorg:` commits. Note their IDs for Step 2.5. There is no scope/plan/temp structure.

### Step 2.5: User Review and Commit Rename

For each implementation commit identified in Step 2 (whether `toreview:` or `toorg:`), show its diff and ask the user to review it before proceeding.

**Give the user commands to review each commit:**

```
To review <description>, run:
  jj show -r <id>
```

Then ask:
```
Please review the changes above and let me know when you're happy with them.
```

**Wait for explicit user confirmation before continuing.**

If the user reports issues: stop, fix them, re-run Steps 0–2, and re-present the review commands.

**Once the user confirms all changes are OK**, replace each `toreview:` or `toorg:` prefix with a semantic change description:

```bash
jj describe -r <id> -m "<semantic description>"
```

Semantic change description rules:
- Strip the `toreview: ` or `toorg: ` prefix
- Use conventional commit format where the project uses it (e.g. `feat: add user model`, `fix: resolve auth race`, `refactor: extract helper`)
- Otherwise use an imperative short sentence (`add user model`, `resolve auth race`)
- Keep it under 72 characters; no trailing period

After renaming all commits, verify the log looks clean:
```bash
jj log -r 'trunk()..@' --no-pager \
  --template 'change_id.short(8) ++ "  " ++ description.first_line() ++ "\n"'
```

No `toreview:` or `toorg:` lines should remain.

### Step 3: Present Options

Present exactly these 4 options:

```
Implementation complete. What would you like to do?

1. Create PR — push scope as a branch and open a pull request
2. Integrate to trunk — fast-forward trunk bookmark to scope
3. Keep as-is — I'll handle it later
4. Discard this work

Which option?
```

**Don't add explanation** — keep options concise.

### Step 4: Execute Choice

#### Option 1: Create PR

**Organized DAG (scope merge exists):**
```bash
# Abandon the temp change first (scratch/handoff files don't belong in the PR)
jj abandon <temp-id>

# Create a bookmark at the scope change
jj bookmark create <feature-name> --revision <scope-id>

# Push to remote
jj git push --bookmark <feature-name>
```

**Unorganized (no scope/temp):**
```bash
# Create a bookmark at @- (the last implementation commit)
jj bookmark create <feature-name> --revision @-

# Push to remote
jj git push --bookmark <feature-name>
```

Then create the PR:
```bash
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<2-3 bullets of what changed>

## Test Plan
- [ ] <verification steps>
EOF
)"
```

#### Option 2: Integrate to Trunk

**Organized DAG:**
```bash
# Update trunk bookmark to include scope (only if scope descends cleanly from trunk)
jj bookmark set main --revision <scope-id>

# Push
jj git push --bookmark main
```

**Unorganized:**
```bash
# Update trunk bookmark to @- (last implementation commit)
jj bookmark set main --revision @-

# Push
jj git push --bookmark main
```

Then: Abandon scope structure if present (Step 5)

#### Option 3: Keep As-Is

Report: "Keeping work scope `<scope-id>`. No changes made."

**Don't clean up.**

#### Option 4: Discard

**Confirm first:**
```
This will permanently abandon:
- Scope change: <scope-id>
- Plan change: <plan-id>
- Sub-routes: <list>
- Temp change: <temp-id>

Type 'discard' to confirm.
```

Wait for exact confirmation.

If confirmed:
```bash
# Abandon all scope changes (jj automatically rebases @ to remove them as parents)
jj abandon <scope-id> <plan-id> <sub-route-ids> <temp-id>
```

### Step 5: Clean Up

#### After Option 1 (Create PR)

**Organized DAG:** Optionally abandon the plan change if it's no longer needed:
```bash
jj abandon <plan-id>
```

**Unorganized:** No plan/scope/temp to abandon. Work is done.

Verify `@` is still correct:
```bash
jj log -r 'trunk()..@' --no-pager
```

#### After Option 2 (Integrate to Trunk)

**Organized DAG:** Abandon the scope structure:
```bash
jj abandon <scope-id> <plan-id> <sub-route-ids> <temp-id>
```

**Unorganized:** No scope structure to abandon. Work is done.

#### After Option 3 (Keep As-Is)

No cleanup. Work stays in DAG.

#### After Option 4 (Discard)

Already abandoned in Step 4. Verify:
```bash
jj log -r 'trunk()..@' --no-pager
```

## Quick Reference

| Option | Push | Keep scope | Abandon temp | Abandon all |
|--------|------|------------|--------------|-------------|
| 1. Create PR | ✓ (before push) | ✓ | - | - |
| 2. Integrate | ✓ | - | ✓ | ✓ |
| 3. Keep as-is | - | ✓ | - | - |
| 4. Discard | - | - | - | ✓ |

## Common Mistakes

**Skipping pre-flight DAG checks**
- **Problem:** Divergent changes, conflicts, or unmerged `@` content end up in the PR or integrated to trunk
- **Fix:** Always run Step 0 before anything else

**Skipping test verification**
- **Problem:** Merge broken code, create failing PR
- **Fix:** Always verify tests before offering options

**Skipping user review**
- **Problem:** Unreviewed or incorrectly-described changes get integrated
- **Fix:** Always show all diffs and wait for explicit confirmation before renaming and proceeding

**Open-ended questions**
- **Problem:** "What should I do next?" → ambiguous
- **Fix:** Present exactly 4 structured options

**Forgetting to abandon temp change first**
- **Problem:** Scratch/handoff files end up in the PR
- **Fix:** Always abandon temp *before* creating the bookmark and pushing (Option 1)

**No confirmation for discard**
- **Problem:** Accidentally delete work
- **Fix:** Require typed "discard" confirmation

## Red Flags

**Never:**
- Skip Step 0 pre-flight checks
- Run `jj show`, `jj diff`, or any diff command inline — this pollutes the agent's context; give the user the command to run themselves instead
- Proceed with failing tests
- Push without verifying tests on result
- Delete work without confirmation
- Force-push without explicit request
- Use `jj edit`, `jj next`, or `jj prev` (moves `@` away from tip)

**Always:**
- Verify tests before offering options
- Show all `toreview:` diffs and wait for explicit user confirmation
- Rename all `toreview:` descriptions to semantic change descriptions before proceeding
- Present exactly 4 options
- Get typed confirmation for Option 4
- Abandon temp change before pushing for Option 1

## Integration

**Called by:**
- **subagent-driven-development** (final step) — after all tasks complete
- **executing-plans** (final step) — after all batches complete

**Pairs with:**
- **jj-reorg-changes** — optional pre-integration DAG organization step
- **using-jj-worksets** — overview of jj work scope organization
