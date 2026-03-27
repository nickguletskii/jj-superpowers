---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of a jj work scope by presenting structured options for integration, PR, or cleanup
---

# Finishing a Development Work Scope

## Overview

Guide completion of development work by presenting clear options and handling the chosen workflow.

**Core principle:** Verify tests → Present options → Execute choice → Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## The Process

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

### Step 2: Identify the Work Scope

Find the scope change and its sub-routes:

```bash
jj log -r 'trunk()..@' --no-pager \
  --template 'change_id.short(8) ++ "  " ++ description.first_line() ++ "\n"'
```

Identify:
- `scope0` — the scope merge change
- `plan0` — the plan change
- Any `toreview:` sub-routes — completed implementation changes
- `temp0` — the temp/handoff change

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

```bash
# Abandon the temp change first (scratch/handoff files don't belong in the PR)
jj abandon <temp-id>

# Create a bookmark at the scope change
jj bookmark create <feature-name> --revision <scope-id>

# Push to remote
jj git push --bookmark <feature-name>

# Create PR
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<2-3 bullets of what changed>

## Test Plan
- [ ] <verification steps>
EOF
)"
```

#### Option 2: Integrate to Trunk

```bash
# Update trunk bookmark to include scope (only if scope descends cleanly from trunk)
jj bookmark set main --revision <scope-id>

# Push
jj git push --bookmark main
```

Then: Abandon scope structure (Step 5)

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

Optionally abandon the plan change if it's no longer needed:
```bash
jj abandon <plan-id>
```

Verify `@` is still correct:
```bash
jj log -r 'trunk()..@' --no-pager
```

#### After Option 2 (Integrate to Trunk)

Abandon the scope structure:
```bash
jj abandon <scope-id> <plan-id> <sub-route-ids> <temp-id>
```

#### After Option 3 (Keep As-Is)

No cleanup. Work scope stays in DAG.

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

**Skipping test verification**
- **Problem:** Merge broken code, create failing PR
- **Fix:** Always verify tests before offering options

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
- Proceed with failing tests
- Push without verifying tests on result
- Delete work without confirmation
- Force-push without explicit request
- Use `jj edit`, `jj next`, or `jj prev` (moves `@` away from tip)

**Always:**
- Verify tests before offering options
- Present exactly 4 options
- Get typed confirmation for Option 4
- Abandon temp change before pushing for Option 1

## Integration

**Called by:**
- **subagent-driven-development** (final step) — after all tasks complete
- **executing-plans** (final step) — after all batches complete

**Pairs with:**
- **using-jj-worksets** — cleans up the work scope created by that skill
