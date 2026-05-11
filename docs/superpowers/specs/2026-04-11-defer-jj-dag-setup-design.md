# Defer jj DAG Setup: Design

## Goal

Remove the requirement to set up a jj DAG before planning and implementation. Let implementers commit work as `toorg:` commits directly into the working copy history. Make DAG reorganization an optional post-implementation step.

## Motivation

Setting up a jj DAG before writing any code is heavyweight and requires knowing the full shape of the work in advance. For many tasks this is unnecessary friction. The new model: write code, commit logical units as `toorg:` changes, and optionally reorganize the history into a clean DAG afterwards.

---

## Lifecycle Change

**Old:**
```
brainstorming → writing-plans → using-jj-worksets (DAG setup) → subagent-driven-development → finishing-a-development-branch
```

**New:**
```
brainstorming → writing-plans → subagent-driven-development → finishing-a-development-branch → (optional) jj-reorg-changes
```

Work accumulates as `toorg:` commits during implementation. DAG organization is deferred and optional.

---

## New `toorg:` Convention

When a non-jj subagent completes a logical unit of work, it may commit those files using:

```bash
jj commit [LIST OF FILES] -m 'toorg: [short description]'
```

This creates a new commit preceding `@` containing exactly those files. The `toorg:` prefix signals "to be organized" — these commits are raw material for the optional post-implementation DAG reorganization.

**Rules:**
- Implementers may ONLY use `jj commit [FILES] -m 'toorg: ...'` — all other jj commands are forbidden
- A `toorg:` commit should contain one logical unit of work (not a dump of everything)
- Multiple `toorg:` commits per task are fine if the task has distinct logical parts

---

## Files Changed

### Small changes (context removal)

**`writing-plans/SKILL.md`**
- Remove: "This should be run after the jj work scope is set up (via brainstorming or using-jj-worksets skill)"
- Remove: any execution handoff reference to jj setup

**`executing-plans/SKILL.md`**
- Remove: "REQUIRED SUB-SKILL: Use superpowers:using-jj-worksets (or jj-agentic-dev) — REQUIRED: Set up jj work scope before starting"

### Medium changes

**`subagent-driven-development/SKILL.md`**
- Remove: workflow type selection (simple/chain/multi-route)
- Remove: base revision confirmation
- Remove: `todo:` change creation
- Remove: jj-coordinator dispatch during implementation
- Remove: `jj-dag-builder-prompt.md` reference from templates section
- Change: "implementers never run jj commands" → "implementers use `jj commit toorg:` to file completed work"
- Simplify the workflow diagram to reflect the new linear flow

**`subagent-driven-development/implementer-prompt.md`**
- Change constraint block: "MUST NOT run any jj commands" → "may ONLY use `jj commit [FILES] -m 'toorg: [description]'` to file completed work. All other jj commands are forbidden."
- Add guidance: when to commit (after completing a logical unit of work, before reporting DONE)

**`finishing-a-development-branch/SKILL.md`**
- Step 0 pre-flight checks:
  - Drop Check 2 (`toreview:` check — no longer applicable in base case)
  - Keep: `@`-empty check, divergent check, conflict check
- Add Step 0.5 (optional): "Would you like to organize your `toorg:` commits into a logical DAG before proceeding? If yes, invoke `jj-reorg-changes` now, then return here."
- Step 2 ("Identify the Work Scope"): handle both cases:
  - **Unorganized**: work is in `toorg:` commits, no scope:/plan: structure
  - **Organized**: work is in `toreview:` commits under a scope:/plan: DAG
- Step 2.5 ("User Review and Rename"):
  - Rename `toorg:` commits to semantic descriptions (same rename pattern as `toreview:`)
  - Keep existing `toreview:` rename logic for organized DAG case

### Full rewrites

**`jj-agentic-dev/SKILL.md` → renamed to `jj-reorg-changes/SKILL.md`**

New purpose: given a history of `toorg:` commits, reorganize them into a proper jj DAG.

Phases:
1. **Analyze**: list all `toorg:` commits; examine each with `jj show`; identify logical groupings and dependencies
2. **Plan**: compose a DOT graph representing the target DAG; present to user for confirmation
3. **Build**: dispatch `jj-dag-builder` to create empty DAG nodes; dispatch `jj-coordinator` to squash each `toorg:` commit's files into the correct DAG node; abandon the now-empty `toorg:` commits
4. **Verify**: all nodes are `toreview:`/`plan:`/`scope:`/`temp:`; `@` is clean; no divergent/conflicted changes
5. **Adapt** (unchanged): modify the DAG mid-flight if needed

Keep unchanged: safety rules, jj command conventions.

**`using-jj-worksets/SKILL.md`**

New purpose: overview and entry point for post-implementation DAG organization. Describes the pattern (why you'd want to organize `toorg:` commits, what the result looks like). For the detailed step-by-step, points to `jj-reorg-changes`.

### No changes needed

- `jj-coordinator-prompt.md` — still used during DAG reorganization
- `jj-dag-builder-prompt.md` — still used during DAG reorganization
- `brainstorming/SKILL.md` — no jj references to remove

---

## Invariants Preserved

- Non-jj subagents still never run arbitrary jj commands — only `jj commit toorg:` is permitted
- DAG construction machinery (jj-coordinator, jj-dag-builder) is preserved and reused in the reorganization step
- `finishing-a-development-branch` remains the exit point for all implementation workflows
- The full DAG workflow is available for projects that want it — it's just no longer mandatory upfront
