# Defer jj DAG Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove mandatory jj DAG setup from planning and execution workflows; allow implementers to use `jj commit toorg:` to file work; repurpose `jj-agentic-dev` as `jj-reorg-changes` for optional post-implementation DAG organization.

**Architecture:** Targeted edits to 6 skill files, 1 new skill file, 1 file deletion. All changes are Markdown documentation — no code. Tasks are independent (each touches a different file), with one soft ordering constraint: Task 7 (using-jj-worksets) references content introduced in Task 6 (jj-reorg-changes).

**Tech Stack:** Markdown, Bash for verification (grep)

---

```yaml
workflow: chain
```
**Workflow:** chain — sequential ordering keeps Task 7 after Task 6; otherwise tasks are independent.

---

## File Map

| Task | File(s) | Change type |
|------|---------|-------------|
| 1 | `skills/writing-plans/SKILL.md` | Remove 1 line |
| 2 | `skills/executing-plans/SKILL.md` | Remove 1 line |
| 3 | `skills/subagent-driven-development/SKILL.md` | Remove ~60 lines, update 3 items |
| 4 | `skills/subagent-driven-development/implementer-prompt.md` | Replace constraint block |
| 5 | `skills/finishing-a-development-branch/SKILL.md` | Remove 6 lines, add ~25 lines |
| 6 | `skills/jj-reorg-changes/SKILL.md` | Create new (~200 lines) |
| 7 | `skills/jj-agentic-dev/SKILL.md` | Delete |
| 8 | `skills/using-jj-worksets/SKILL.md` | Full rewrite (~80 lines) |

---

### Task 1: Remove jj setup prerequisite from writing-plans

**Files:**
- Modify: `skills/writing-plans/SKILL.md`

- [ ] **Step 1: Read the file**

  ```bash
  grep -n "work scope" skills/writing-plans/SKILL.md
  ```
  Expected: one line mentioning "This should be run after the jj work scope is set up"

- [ ] **Step 2: Remove the Context line**

  Remove this exact line (currently around line 15):

  ```
  **Context:** This should be run after the jj work scope is set up (via brainstorming or using-jj-worksets skill).
  ```

  Also remove the blank line immediately following it (there will be a double blank line otherwise).

- [ ] **Step 3: Verify**

  ```bash
  grep -n "work scope" skills/writing-plans/SKILL.md
  ```
  Expected: no output.

---

### Task 2: Remove jj setup prerequisite from executing-plans

**Files:**
- Modify: `skills/executing-plans/SKILL.md`

- [ ] **Step 1: Read the Integration section**

  ```bash
  grep -n "using-jj-worksets\|jj-agentic-dev" skills/executing-plans/SKILL.md
  ```
  Expected: one line referencing `using-jj-worksets` and `jj-agentic-dev` as REQUIRED.

- [ ] **Step 2: Remove the using-jj-worksets line**

  In the `## Integration` section, remove this line:

  ```
  - **superpowers:using-jj-worksets** (or **jj-agentic-dev**) - REQUIRED: Set up jj work scope before starting
  ```

- [ ] **Step 3: Verify**

  ```bash
  grep -n "using-jj-worksets\|jj-agentic-dev" skills/executing-plans/SKILL.md
  ```
  Expected: no output.

---

### Task 3: Simplify subagent-driven-development/SKILL.md

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md`

This task removes the workflow type selection, base revision confirmation, and jj DAG setup machinery. It also updates references to the jj constraint.

- [ ] **Step 1: Read the file and orient**

  ```bash
  grep -n "^##\|^###" skills/subagent-driven-development/SKILL.md
  ```
  Note the line numbers of sections to remove.

- [ ] **Step 2: Remove the "Workflow Complexity & Selection" section**

  Remove the entire section from `## Workflow Complexity & Selection` through the end of `### Confirm Base Revision BEFORE Creating Changes`. This spans from the `## Workflow Complexity & Selection` heading through the line:

  ```
  Wait for explicit confirmation. Do NOT silently use `trunk()`.
  ```

  The content to remove starts with:
  ```
  ## Workflow Complexity & Selection
  
  ### 🚨 CRITICAL: Always Prefer Simple Workflows
  ```
  and ends with (inclusive):
  ```
  Wait for explicit confirmation. Do NOT silently use `trunk()`.
  ```

- [ ] **Step 3: Remove the "Workflow Branching" section**

  Remove the entire `## Workflow Branching` section from its heading through:
  ```
  **In all paths: implementers never run jj commands.**
  ```

  Replace the removed final line with:
  ```
  **Implementers use `jj commit [FILES] -m 'toorg: [description]'` to file completed work. All other jj commands are forbidden.**
  ```

  Place this replacement line immediately before `## The Process`.

- [ ] **Step 4: Update the Prompt Templates section**

  Find the `## Prompt Templates` section. Remove these two lines:
  ```
  - `./jj-coordinator-prompt.md` - Dispatch jj-coordinator subagent (haiku model)
  - `./jj-dag-builder-prompt.md` - Dispatch jj-dag-builder subagent (haiku model) to create the jj work scope DAG from a DOT graph (uses `dot-to-jj-dag` skill)
  ```

- [ ] **Step 5: Update the Red Flags section**

  Find the `**Never:**` list. Remove these three items:
  ```
  - **Silently choose a workflow approach** — ALWAYS ask user (simple vs chain vs full DAG)
  - **Silently choose a base revision** — ALWAYS ask user (trunk() vs @- vs specific)
  - Start implementation without explicit user consent on both workflow AND base
  ```

  Change this item:
  ```
  - Have implementers run jj commands (use jj-coordinator subagent instead)
  ```
  to:
  ```
  - Have implementers run jj commands other than `jj commit toorg:` (only that command is permitted)
  ```

- [ ] **Step 6: Verify removals**

  ```bash
  grep -n "Workflow Complexity\|Confirm Base Revision\|Workflow Branching\|jj-coordinator-prompt\|jj-dag-builder-prompt\|Silently choose a workflow\|Silently choose a base" skills/subagent-driven-development/SKILL.md
  ```
  Expected: no output.

- [ ] **Step 7: Verify the replacement line is present**

  ```bash
  grep -n "toorg" skills/subagent-driven-development/SKILL.md
  ```
  Expected: the `toorg:` constraint line appears once near the start of the file.

---

### Task 4: Update implementer-prompt.md with toorg: permission

**Files:**
- Modify: `skills/subagent-driven-development/implementer-prompt.md`

- [ ] **Step 1: Read the constraint block**

  ```bash
  grep -n "CRITICAL CONSTRAINT\|jj new\|jj commit\|jj delete" skills/subagent-driven-development/implementer-prompt.md
  ```

- [ ] **Step 2: Replace the constraint block**

  Find and replace the entire critical constraint block. The old block:

  ```
  🚨 **CRITICAL CONSTRAINT:** You may ONLY edit working copy files. You MUST NOT run any jj commands. That includes:
  - ❌ `jj new`, `jj describe`, `jj squash`, `jj edit`, `jj next`, `jj prev`
  - ❌ `jj commit`, `jj delete`, `jj abandon`
  - ❌ Any other jj subcommand
  
  You may only modify source files in the working tree. When you are done, the orchestrator will use jj commands to organize your changes. Your job is implementation only.
  ```

  Replace with:

  ```
  🚨 **CRITICAL CONSTRAINT:** You may only run ONE jj command: `jj commit [FILES] -m 'toorg: [description]'` to file completed work into a commit. All other jj commands are forbidden. That includes:
  - ❌ `jj new`, `jj describe`, `jj squash`, `jj edit`, `jj next`, `jj prev`
  - ❌ `jj delete`, `jj abandon`
  - ❌ Any other jj subcommand
  
  When you complete a logical unit of work, run: `jj commit [list of files] -m 'toorg: [short description]'`
  This moves those files out of `@` into a new commit preceding it. File one logical unit at a time — do not dump all files into a single commit.
  ```

- [ ] **Step 3: Update step 4 of "Your Job"**

  Find:
  ```
  4. Save your work (changes will be organized into jj changes by the orchestrator)
  ```
  Replace with:
  ```
  4. File completed logical units: `jj commit [files] -m 'toorg: [description]'`
  ```

- [ ] **Step 4: Verify**

  ```bash
  grep -n "MUST NOT run\|orchestrator will use jj" skills/subagent-driven-development/implementer-prompt.md
  ```
  Expected: no output.

  ```bash
  grep -n "toorg" skills/subagent-driven-development/implementer-prompt.md
  ```
  Expected: the `toorg:` constraint line and step 4 both appear.

---

### Task 5: Update finishing-a-development-branch/SKILL.md

**Files:**
- Modify: `skills/finishing-a-development-branch/SKILL.md`

- [ ] **Step 1: Read the pre-flight checks section**

  ```bash
  grep -n "Check\|toreview\|wip\|todo" skills/finishing-a-development-branch/SKILL.md | head -30
  ```

- [ ] **Step 2: Remove Check 2 (the toreview: check)**

  Remove this entire block from the pre-flight checks:

  ```
  **Check 2 — All sub-routes must be `toreview:` (no incomplete work):**
  ```bash
  jj log -r 'trunk()..@' --no-pager \
    --template 'change_id.short(8) ++ "  " ++ description.first_line() ++ "\n"'
  ```
  Any line starting with `wip:` or `todo:` = implementation is not complete. Do not proceed.
  ```

  Renumber the remaining checks: what was Check 3 becomes Check 2, Check 4 becomes Check 3.

  Also update the section header count in any summary text (currently says "Run all four checks" — change to "Run all three checks").

- [ ] **Step 3: Add Step 0.5 after the pre-flight checks pass block**

  After the line `**If all four pass:** continue to Step 1.` (which will now read `**If all three pass:**`), add a new section:

  ```markdown
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

  Wait for user choice. If yes: **REQUIRED SUB-SKILL:** Use superpowers:jj-reorg-changes. Return here after it completes.

  If no `toorg:` commits are present (work is already organized), skip this step.
  ```

- [ ] **Step 4: Update Step 2 to handle both cases**

  The current Step 2 looks for scope:/plan: structure. Replace its content with:

  ```markdown
  ### Step 2: Identify the Work

  Find the changes to be integrated:

  ```bash
  jj log -r 'trunk()..@' --no-pager \
    --template 'change_id.short(8) ++ "  " ++ description.first_line() ++ "\n"'
  ```

  This will show one of two shapes:

  **Organized DAG** (ran `jj-reorg-changes`): identify `scope0`, `plan0`, `toreview:` sub-routes, `temp0`.

  **Unorganized** (skipped reorganization): identify `toorg:` commits. Note their IDs for Step 2.5. There is no scope/plan/temp structure.
  ```

- [ ] **Step 5: Update Step 2.5 to handle toorg: rename**

  After the existing `toreview:` rename instructions, add:

  ```markdown
  **For `toorg:` commits (unorganized case):** follow the same review and rename process. Give the user the command to review each commit:

  ```
  To review <description>, run:
    jj show -r <id>
  ```

  Once the user confirms, rename each `toorg:` commit to a semantic description:

  ```bash
  jj describe -r <id> -m "<semantic description>"
  ```

  Same naming rules: strip the `toorg: ` prefix, use conventional commit format, keep under 72 characters.
  ```

- [ ] **Step 6: Update Step 4 Option 1 (Create PR) for the unorganized case**

  Find the `#### Option 1: Create PR` block. After the existing `jj abandon <temp-id>` instruction, add a note for the unorganized case:

  ```markdown
  **If unorganized (no scope/temp):** skip the abandon step. Create the bookmark at `@-` (the last implementation commit):

  ```bash
  jj bookmark create <feature-name> --revision @-
  jj git push --bookmark <feature-name>
  ```
  ```

- [ ] **Step 7: Update Step 4 Option 2 (Integrate to Trunk) for the unorganized case**

  After the existing `jj bookmark set main --revision <scope-id>` instruction, add:

  ```markdown
  **If unorganized (no scope):** set the bookmark at `@-` instead:

  ```bash
  jj bookmark set main --revision @-
  jj git push --bookmark main
  ```
  ```

- [ ] **Step 8: Update Step 5 (Clean Up) for the unorganized case**

  After `#### After Option 1 (Create PR)`, add:

  ```markdown
  **If unorganized:** no plan/scope/temp to abandon. Work is done.
  ```

  After `#### After Option 2 (Integrate to Trunk)`, add:

  ```markdown
  **If unorganized:** abandon only the empty `@` if desired, or leave it — it will be rebased on trunk automatically.
  ```

- [ ] **Step 9: Update Integration section**

  Change:
  ```
  - **using-jj-worksets** — cleans up the work scope created by that skill
  ```
  to:
  ```
  - **jj-reorg-changes** — optional pre-integration DAG organization step
  - **using-jj-worksets** — overview of jj work scope organization
  ```

- [ ] **Step 10: Verify**

  ```bash
  grep -n "four checks\|Check 2\|All sub-routes must be" skills/finishing-a-development-branch/SKILL.md
  ```
  Expected: "four" → "three", Check 2 is the divergent check; no toreview: check line.

  ```bash
  grep -n "toorg\|jj-reorg-changes\|Step 0.5" skills/finishing-a-development-branch/SKILL.md
  ```
  Expected: all three present.

---

### Task 6: Create jj-reorg-changes/SKILL.md

**Files:**
- Create: `skills/jj-reorg-changes/SKILL.md`

- [ ] **Step 1: Create the directory and file**

  Create `skills/jj-reorg-changes/SKILL.md` with the following content:

  ````markdown
  ---
  name: jj-reorg-changes
  description: Use when implementation is complete with toorg: commits and you want to reorganize them into a logical jj DAG before integration
  ---

  # jj Reorganize Changes

  ## Overview

  Takes `toorg:` commits left by implementers and reorganizes them into a structured jj DAG (plan:/scope:/toreview: changes). Optional post-implementation step — use it when you want a clean, reviewable history before integration.

  **Announce at start:** "I'm using the jj-reorg-changes skill to organize implementation commits."

  ## ⚠️ Safety Rules

  Always use `--no-edit` with `jj new`. Never use `jj edit`, `jj next`, or `jj prev`.

  Always pass `-m` — never open an editor.

  Always use `--no-pager` on log/diff commands.

  Always pass `-u` to `jj squash --from '@' --into '<id>'` — keeps `@` alive.

  Use `change_id` (not `commit_id`) — stable through rebases.

  ## Phase 1: Analyze toorg: Commits

  ### Step 1: List toorg: commits

  ```bash
  jj log -r 'trunk()..@' --no-pager \
    --template 'change_id.short(8) ++ "  " ++ description.first_line() ++ "\n"'
  ```

  Identify all `toorg:` commits. These are the raw units of implementation work to reorganize.

  ### Step 2: Examine each commit

  For each `toorg:` commit:
  ```bash
  jj show -r <id> --stat --no-pager
  ```

  Note which files each commit touches and what logical concern it represents.

  ### Step 3: Identify groupings and dependencies

  Based on file sets and descriptions, identify:
  - Which commits belong together as a single logical concern
  - Which commits depend on others (ordering constraints)
  - Which commits are truly independent (candidates for parallel sub-routes)

  ## Phase 2: Plan the DAG

  ### Step 1: Compose DOT graph

  Express the proposed DAG as a DOT digraph:

  | `type=`  | jj change prefix |
  |----------|------------------|
  | `plan`   | `plan: <label>`  |
  | `todo`   | `todo: <label>`  |
  | `scope`  | `scope: <label>` |
  | `temp`   | `temp: <label>`  |
  | `anchor` | (none — existing revset) |
  | `at`     | (none — always `@`) |

  Example for two independent concerns:
  ```dot
  digraph {
    base   [type=anchor label="trunk()"]
    plan0  [type=plan   label="<feature name>"]
    step_a [type=todo   label="<concern A>"]
    step_b [type=todo   label="<concern B>"]
    temp0  [type=temp   label="scratch files"]
    scope0 [type=scope  label="<feature name>"]
    at     [type=at     label="@"]

    base   -> plan0
    plan0  -> step_a
    plan0  -> step_b
    plan0  -> temp0
    step_a -> scope0
    step_b -> scope0
    temp0  -> scope0
    scope0 -> at
  }
  ```

  For sequential work: `plan0 -> step_a -> step_b -> scope0` (chain).

  For a single concern: use `simple` — just one `todo:` node, no scope merge needed.

  ### Step 2: Confirm DAG and base with user

  Ask the user to confirm the base revision:

  > "Where should the reorganized work be anchored?
  > - `trunk()` (recommended)
  > - `@-` (on top of current parent)
  > - `<specific revision>`"

  Then present the DOT graph:

  > "Proposed DAG for your `toorg:` commits:
  >
  > ```dot
  > <DOT GRAPH>
  > ```
  >
  > Assignments:
  > - `step_a` ← `toorg:<id1>`, `toorg:<id2>`
  > - `step_b` ← `toorg:<id3>`
  >
  > Proceed, or adjust?"

  Wait for explicit confirmation before proceeding.

  ## Phase 3: Build the DAG

  ### Step 1: Dispatch jj-dag-builder subagent

  See `skills/subagent-driven-development/jj-dag-builder-prompt.md` for the full template.

  Provide:
  - The confirmed DOT graph
  - The anchor map (e.g., `trunk = trunk()`)

  Record the `jj_id` values from the annotated DOT the subagent returns.

  ### Step 2: Move toorg: content into DAG nodes

  For each `todo:` node in the DAG, dispatch a jj-coordinator subagent to squash the assigned `toorg:` files into it.

  See `skills/subagent-driven-development/jj-coordinator-prompt.md` for the template.

  For each node:
  - **Target change ID**: the `jj_id` of the `todo:` node
  - **Files to squash**: the union of all files from the `toorg:` commits assigned to this node
  - **New description**: `toreview: <label>`

  After each coordinator completes, verify the source `toorg:` commit is now empty:
  ```bash
  jj diff -r <toorg_id> --no-pager
  ```
  Expected: no output (all files moved out).

  ### Step 3: Abandon empty toorg: commits

  ```bash
  jj abandon <toorg_id> [<toorg_id2> ...]
  ```

  ## Phase 4: Verify

  ```bash
  jj log -r 'trunk()..@' --no-pager
  ```
  Expected: no `toorg:` lines. All implementation nodes are `toreview:`.

  **`@` must be empty:**
  ```bash
  jj diff --no-pager --stat
  ```

  **No divergent changes:**
  ```bash
  jj log -r 'divergent() & (trunk()..@)' --no-pager
  ```

  **No conflicted changes:**
  ```bash
  jj log -r 'conflicts() & (trunk()..@)' --no-pager
  ```

  If all pass: return to `finishing-a-development-branch` to continue.

  ## Phase 5: Adapt — Modify the DAG Mid-Flight

  ### Add a new parallel sub-route
  ```bash
  jj new --no-edit -m "todo: <new step>" --insert-after '<plan-id>' --insert-before '<scope-id>'
  ```

  ### Add a sequential sub-route
  ```bash
  jj new --no-edit -m "todo: <step>" --insert-after '<prior-id>' --insert-before '<scope-id>'
  ```

  ### Abandon a sub-route no longer needed
  ```bash
  jj abandon '<change-id>'
  ```

  ## Integration

  **Called optionally from:**
  - **superpowers:finishing-a-development-branch** — optional pre-integration step

  **Uses:**
  - `skills/subagent-driven-development/jj-dag-builder-prompt.md` — builds the DAG structure
  - `skills/subagent-driven-development/jj-coordinator-prompt.md` — squashes toorg: content into nodes

  **Overview:**
  - **superpowers:using-jj-worksets** — conceptual overview of this workflow
  ````

- [ ] **Step 2: Verify file creation**

  ```bash
  grep -n "name: jj-reorg-changes" skills/jj-reorg-changes/SKILL.md
  grep -n "Phase 1\|Phase 2\|Phase 3\|Phase 4" skills/jj-reorg-changes/SKILL.md
  ```
  Expected: both return matches.

---

### Task 7: Delete jj-agentic-dev/SKILL.md

**Files:**
- Delete: `skills/jj-agentic-dev/SKILL.md` (and directory)

- [ ] **Step 1: Confirm the file exists and is the right one**

  ```bash
  head -5 skills/jj-agentic-dev/SKILL.md
  ```
  Expected: frontmatter with `name: jj-agentic-dev`.

- [ ] **Step 2: Delete the directory**

  ```bash
  rm -rf skills/jj-agentic-dev
  ```

- [ ] **Step 3: Verify deletion**

  ```bash
  ls skills/jj-agentic-dev 2>&1
  ```
  Expected: `ls: cannot access 'skills/jj-agentic-dev': No such file or directory`

---

### Task 8: Rewrite using-jj-worksets/SKILL.md

**Files:**
- Modify: `skills/using-jj-worksets/SKILL.md` (full rewrite)

- [ ] **Step 1: Read the current file to understand what to replace**

  ```bash
  wc -l skills/using-jj-worksets/SKILL.md
  ```

- [ ] **Step 2: Write the new content**

  Replace the entire file with:

  ````markdown
  ---
  name: using-jj-worksets
  description: Use when implementation is complete and you want to understand how to organize toorg: commits into a structured jj DAG — overview and entry point for post-implementation history organization
  ---

  # Using jj Work Scopes

  ## Overview

  After implementation, work lives in `toorg:` commits in the jj history. This skill explains the optional post-implementation step of organizing those commits into a clean, reviewable DAG.

  **For the detailed step-by-step:** Use **superpowers:jj-reorg-changes**.

  ## What toorg: Commits Look Like

  After implementation, your history looks like:

  ```
  @ (working copy — empty)
  ○  toorg: add auth endpoints
  ○  toorg: add user model
  ○  toorg: update schema
  ○  trunk()
  ```

  ## What an Organized DAG Looks Like

  After running `jj-reorg-changes`:

  ```
  @ (working copy — empty)
  │
  ○  scope: add user authentication
  ├──○  toreview: add user model and schema
  └──○  toreview: add auth endpoints
         ○  plan: add user authentication
            trunk()
  ```

  ## When to Reorganize

  **Reorganize if:**
  - The PR will be reviewed by others and clean history matters
  - The `toorg:` commits don't map cleanly to a single logical unit
  - You want logical separation between concerns (model vs. endpoints vs. tests)

  **Skip reorganization if:**
  - The work is a single coherent change and `toorg:` commits already tell the story
  - You're in a hurry — `finishing-a-development-branch` handles `toorg:` commits directly

  ## Entry Point

  Reorganization is offered as an optional step in `finishing-a-development-branch` (Step 0.5). You can also invoke `jj-reorg-changes` directly at any point after implementation.

  ## Change Message Prefixes

  | Prefix | Meaning |
  |--------|---------|
  | `toorg: <description>` | Raw implementation work — to be organized or renamed |
  | `plan: <feature name>` | Plan document (bottommost, above trunk) |
  | `todo: <description>` | Sub-route: planned, not started |
  | `toreview: <description>` | Sub-route: complete, ready for user review |
  | `temp: <description>` | Temporary/scratch files for this scope |
  | `scope: <feature name>` | Scope merge change — consolidates sub-routes |

  ## Safety Rules

  Always use `--no-edit` with `jj new`. Never use `jj edit`, `jj next`, or `jj prev`.

  Never run `jj describe`, `jj new`, or `jj commit` without `-m`.

  Always use `--no-pager` on log/diff commands.

  ## Integration

  **Entry points:**
  - **superpowers:finishing-a-development-branch** — offers reorganization at Step 0.5

  **Detailed workflow:**
  - **superpowers:jj-reorg-changes** — full step-by-step reorganization

  **Pairs with:**
  - **superpowers:finishing-a-development-branch** — cleanup and integration after reorganization
  ````

- [ ] **Step 3: Verify**

  ```bash
  grep -n "name: using-jj-worksets" skills/using-jj-worksets/SKILL.md
  grep -n "jj-reorg-changes\|toorg" skills/using-jj-worksets/SKILL.md
  ```
  Expected: both return multiple matches.

  ```bash
  grep -n "Set up jj work scope\|REQUIRED before executing\|brainstorming.*set up scope" skills/using-jj-worksets/SKILL.md
  ```
  Expected: no output.

---

## Self-Review

**Spec coverage:**
- ✅ Remove jj DAG setup from writing-plans → Task 1
- ✅ Remove jj DAG setup from executing-plans → Task 2
- ✅ Remove workflow type selection from subagent-driven-development → Task 3
- ✅ Allow `jj commit toorg:` in implementer-prompt → Task 4
- ✅ Update finishing-a-development-branch with optional DAG step → Task 5
- ✅ Create jj-reorg-changes skill → Task 6
- ✅ Delete jj-agentic-dev → Task 7
- ✅ Rewrite using-jj-worksets → Task 8

**No placeholders:** All steps contain exact file paths, exact content to add/remove, and exact verification commands.
