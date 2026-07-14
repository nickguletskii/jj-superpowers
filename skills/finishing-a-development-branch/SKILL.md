---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of a jj development branch by presenting structured options for integration, PR, or cleanup
---

# Finishing a Development Branch

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
Any output = uncommitted changes remain in `@`. Commit them with a real description (`jj commit [files] -m '<semantic description>'`) or abandon them before continuing. Do not introduce a `toorg` scaffold here — scaffolds exist only inside graph execution, where a consolidation step is guaranteed to remove them.

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

### Step 0.5: History Check

Show the current history (**the history command** — Steps 2 and 2.5 re-run this):
```bash
jj log -r 'trunk()..@' --no-pager \
  --template 'change_id.short(8) ++ "  " ++ description.first_line() ++ "\n"'
```

**Any surviving `toorg(...)` scaffold is a bug, not a choice.** Graph execution consolidates each task into one properly-described change as its spec review passes (see the Change Consolidation section of `jj-superpowers:subagent-driven-development`), so history should already be clean by the time you get here. A `toorg(...)` prefix means a consolidation step was skipped — squash it into its owning change and describe it now. Do not carry a scaffold into a PR.

Also scan every description against the Change Description Rules in `jj-superpowers:jujutsu` (canonical) and fix violations here — after merge the plan directory is gone, and any reference to it becomes a dead pointer.

If history is clean but you want a different *shape* (splitting a large change, reordering into a narrative DAG, parallel branches), ask:

> "History above is clean. Would you like to reorganize it into a different DAG shape before proceeding?
>
> - **Yes** — invoke `jj-organizing-history`, then return here
> - **No** — proceed as-is"

This is now an optional refinement of already-good history, not a rescue operation on a pile of deferred commits.

Wait for user choice. If yes: **REQUIRED SUB-SKILL:** Use jj-superpowers:jj-organizing-history. Return here after it completes.

Use the decision-checkpoint pattern from `jj-superpowers:using-superpowers`: present the choices through the harness-native ask/question tool when available.

If history is already consolidated and you do not want a different DAG shape, skip this step.

### Step 1: Confirm Verification Is Green

**Before presenting options, confirm you have valid passing verification evidence** — per the Iron Law in `jj-superpowers:verification-before-completion`, valid means the run postdates the last change that could affect it.

**Do not re-run the suite by reflex.** If this branch came through a plan graph, its `verify` nodes already ran the project's contended commands, and those results stand unless the tree moved afterward. Re-running a suite that cannot return a different answer costs wall-clock and blocks anything else contending on the build.

```
Has the tree changed since the last green verification, in a way that could change the result?
(source, config, dependencies, or the tests themselves — NOT comments, docs, or
 commit reorganization that leaves the tree contents identical)

  NO  -> cite that run and continue to Step 1.5.
  YES -> run the project's suite now:
         pnpm run test / cargo test / pytest / go test ./...
  NO EVIDENCE AT ALL (e.g. Trivial/Small tier, or ad hoc work)
      -> run the named verification command for this work.
```

Note that Step 0.5 history organization (`jj-organizing-history`) rewrites *commits*, not file contents — a reorganized branch with an unchanged tree does not need re-verification.

**If verification fails:**
```
Tests failing (<N> failures). Must fix before completing:

[Show failures]

Cannot proceed with merge/PR until tests pass.
```

Stop. Don't proceed to Step 2.

**If verification is green:** Continue to Step 1.5.

### Step 1.5: Spec drift check (when applicable)

If the project has `.agents/layout.yaml`, run `jj-superpowers:spec-drift-detector` in default (diff-scoped) mode against the current branch diff. The detector will:

- Verify frontmatter ↔ `layout.yaml` index consistency **for specs already loaded via `code_map`** (diff-scoped mode does NOT walk all spec frontmatter — `--full-audit` is the authoritative reconciler for `code_map` ↔ frontmatter drift; schedule it weekly or before significant integration milestones, not as part of this step).
- Spot-check requirements whose `owns:` intersects the diff against the changed code.
- Verify code-as-spec module hygiene for any touched `spec_code.modules` paths.
- Report orphan references for spec/plane/glossary/invariant/mdbook items deleted or renamed by this work (targeted grep; not a corpus-wide orphan scan).

Findings are written to `docs/agent-specs/drift-reports/<YYYY-MM-DD>/<HHMM>-<scope>.md` (gitignored). Triage:

- `mismatch` findings — resolve before proceeding (route to `writing-specs` for spec change, or fix code).
- `suspect`/`unverified` — review with user; either resolve or enqueue a new entry file under `.agents/tech-debt/docs/<YYYY-MM-DD>/<HHMMSS>-<slug>.md`.
- Orphan references — either restore the referenced item or update/remove the reference (per `documentation` skill).

Do not skip this step on the theory that the change "doesn't touch specs" — typed-API edits, mdbook citation changes, and deleted files all surface here.

### Step 1.6: Write handoff/blog entry

Per `layout.yaml` `handoffs.enabled` / `agent_blog.enabled`:

- **Handoff** (if work is incomplete OR blocked OR paused mid-decision): write `.agents/handoffs/<YYYY-MM-DD>/<HHMM>-<topic>.md` — short note: what's done, what's blocked, where to resume.
- **Blog** (only when enabled): write `.agents/blog/<YYYY-MM-DD>/<HHMM>-<topic>.md` — ~10-30 lines summarizing the session, key decisions, links to changes/specs touched, open threads.

Both directories use ISO-date subdirectories with HHMM-prefixed filenames. Drift-detector prunes them per `retention:`.

### Step 2: Identify the Work

Re-run **the history command** (Step 0.5) to find the changes to be integrated. It will show one of these shapes:

**Consolidated** (graph execution): one properly-described change per task node, no scaffolds. This is the expected shape — descriptions were written as each task passed spec review.

**Organized DAG** (ran `jj-organizing-history`): identify `scope0` (scope merge), `plan0` (plan change), the described implementation sub-routes, and `temp0` (temp/handoff change).

**Unconsolidated** (inline or ad hoc work that never went through a graph): raw `toorg` commits. Note their IDs — they still need consolidating and describing in Step 2.5.

### Step 2.5: User Review

For each implementation commit identified in Step 2, show its diff and ask the user to review it before proceeding.

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

**Describing any remaining scaffolds.** Consolidated history already carries real descriptions, so there is normally nothing to rename here. If Step 2 found `toorg` commits (unconsolidated ad hoc work), squash and describe them now, following the Change Description Rules in `jj-superpowers:jujutsu`:

```bash
jj describe -r <id> -m "<semantic description>"
```

Re-run **the history command** (Step 0.5) to confirm the log is clean, then confirm no scaffold remains:
```bash
jj log -r 'trunk()..@ & (description(glob:"toorg*") | description(glob:"todo:*"))' --no-pager
```
This must return empty. Any output is a change about to enter a PR with a meaningless description.

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

Use the harness-native ask/question tool when available so the user can select one option directly.

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

Report: "Keeping development branch `<scope-id>`. No changes made."

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

## Red Flags

**Never:**
- Skip Step 0 pre-flight checks
- Run `jj show`, `jj diff`, or any full-diff command inline — this pollutes the agent's context; give the user the command to run themselves instead. **Exception:** bounded `--stat` summaries (e.g. `jj show -r <id> --stat --no-pager`) are allowed, since they emit only changed-file names and line counts, not diff bodies
- Proceed with failing tests
- Push without verifying tests on result
- Delete work without confirmation
- Force-push without explicit request
- Use `jj edit`, `jj next`, or `jj prev` (moves `@` away from tip)

**Always:**
- Verify tests before offering options
- Show every implementation diff and wait for explicit user confirmation
- Ensure no `toorg` scaffold survives — every change carries its real description before proceeding
- Present exactly 4 options
- Get typed confirmation for Option 4
- Abandon temp change before pushing for Option 1

## Integration

**Called by:**
- **subagent-driven-development** (final step) — after all tasks complete
- **executing-plans** (final step) — after all batches complete

**Pairs with:**
- **jj-organizing-history** — optional pre-integration DAG organization and history cleanup
