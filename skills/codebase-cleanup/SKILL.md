---
name: codebase-cleanup
description: Use when the user wants to clean up, reorganize, deduplicate, or remove dead code from a codebase or part of one
---

# Codebase Cleanup

Orchestrates a 7-step pipeline: scope → map → analyze → discuss → remove → synthesize → hand off to `jj-superpowers:brainstorming`. The orchestrator (you) coordinates the work and is the only entity that speaks to the user.

## Execution Mode

Before Step 1, determine whether the platform supports subagents and whether the user has authorized their use.

- **Subagent mode:** If subagents are supported and authorized, use the existing Step 1-7 map/reduce subagent pipeline. This is the preferred workflow.
- **Reduced local mode:** If subagents are unavailable or unauthorized, ask whether the user wants to authorize subagents. If not, continue locally with reduced coverage: perform scope confirmation, forgotten-code searches, mapping, analysis, user confirmation, deletion, deletion review, synthesis, and handoff yourself.

Reduced local mode preserves the safety gates: all dead-code findings need search evidence, the user confirms the deletion list before removal, deletion review still happens locally, and Step 4 discussion remains orchestrator-owned.

## Step 1: Scope

Always ask the user what to clean up first. Two paths:

- **Directory path:** Treat as primary scope and proceed to the forgotten-code check.
- **Semantic description:** In subagent mode, dispatch parallel exploration subagents (grep, symbol search, cross-reference tracing) to find all relevant files. In reduced local mode, perform local `rg` searches using keywords, symbol names, and synonyms from the description. Present matched files and evidence to the user for confirmation.

**Forgotten-code check (always, both paths):** In subagent mode, dispatch parallel search subagents using keywords, symbol names, and synonyms derived from the scope to look for related code in OTHER directories. In reduced local mode, run local `rg` searches with the same keyword and synonym set. Present evidence with: *"Found potentially related code outside your scope — include?"* User confirms the final confirmed file set.

## Step 2: Map

Set session timestamp as `YYYY-MM-DD-HHmm`. All output: `docs/superpowers/code-map/<timestamp>/`.

- **MAP:** In subagent mode, dispatch one `./directory-mapper-prompt.md` subagent per confirmed directory (parallel). Each writes `by-directory/<dir>.md`. In reduced local mode, create the same `by-directory/<dir>.md` files yourself from local code inspection and `rg` evidence.
- **REDUCE:** In subagent mode, dispatch `./map-consolidator-prompt.md` with `[BY_DIRECTORY_PATH]`, `[BY_GROUP_PATH]`, `[INDEX_PATH]`, `[SESSION_TIMESTAMP]`, and `[CONFIRMED_SCOPE]` (comma-separated confirmed directories). Reads all `by-directory/` files. Writes `by-group/<group>.md` files and `index.md`. In reduced local mode, consolidate the directory files yourself into the same outputs.
- **REVIEW:** In subagent mode, dispatch `./map-reviewer-prompt.md` with `[BY_DIRECTORY_PATH]`, `[BY_GROUP_PATH]`, `[INDEX_PATH]`, and `[CONFIRMED_SCOPE]`. In reduced local mode, review the map yourself before analysis and note any uncertainty in the map files.

## Step 3: Analyze

In subagent mode, dispatch one `./analysis-prompt.md` subagent per group file (parallel). Each appends `## Analysis` to its file. Then dispatch `./analysis-reviewer-prompt.md`.

In reduced local mode, analyze each group file yourself and append the same `## Analysis` sections. Then perform a local analysis review pass, checking that every dead-code claim has search evidence and that duplicated logic or abstraction opportunities are grounded in the mapped code.

## Step 4: Discuss

You (orchestrator) present consolidated findings from all `## Analysis` sections to the user. Confirm which dead code and obsolete tests to delete. Do not delegate this step to a subagent.

## Step 5: Remove

In subagent mode, dispatch `./deletion-agent-prompt.md` with the confirmed deletion list. Then dispatch `./deletion-reviewer-prompt.md`.

In reduced local mode, apply only the user-confirmed deletions yourself. Then review the diff locally to verify no unconfirmed files or unrelated behavior were changed.

## Step 6: Synthesize

In subagent mode, dispatch `./refactoring-request-prompt.md`. In reduced local mode, synthesize the request yourself. Produces `docs/superpowers/code-map/<timestamp>/refactoring-request.md`.

## Step 7: Hand Off

Invoke `jj-superpowers:brainstorming` with the refactoring request document as context.

## Code Map File Formats

**`by-directory/<dir>.md`:**
```
# <directory>
## Exports / Public API
- `symbol(args): ReturnType` — one sentence
## Internal symbols (not exported)
- `symbol(args)` — one sentence
## Semantic group suggestion
<group name>
## Dead / obsolete tests
- `test.ts` — evidence (or "(none)")
```

**`by-group/<group>.md`:**
```
# <Group Name>
## Directories
## Full API surface
## Cross-directory dependencies
## Dead / obsolete tests
## Analysis        ← appended by Step 3 agents
### Dead code
### Duplicated logic
### Abstraction opportunities
```

**`index.md`:** Group list with one-line descriptions + directory-to-group mapping table.

## Prompt Templates

Prompt templates are used only in subagent mode. In reduced local mode, follow the same file formats and review gates directly.

- `./directory-mapper-prompt.md` — maps one directory (MAP phase)
- `./map-consolidator-prompt.md` — consolidates directory maps into groups (REDUCE phase)
- `./analysis-prompt.md` — analyzes one semantic group
- `./deletion-agent-prompt.md` — removes confirmed dead code
- `./refactoring-request-prompt.md` — synthesizes final request document
- `./map-reviewer-prompt.md` — Step 2 review
- `./analysis-reviewer-prompt.md` — Step 3 review
- `./deletion-reviewer-prompt.md` — Step 5 review

## Key Constraints

- Subagent mode: consolidator is the only agent that reads across directory files
- Subagent mode: analysis agents read only their assigned group file
- Step 4 discussion: handle via AskUserQuestion directly — do not delegate to a subagent
- Dead code claims must include grep evidence; analysis-reviewer rejects unsubstantiated claims
- Forgotten-code check runs regardless of how scope was specified
- Reduced local mode: do not delete anything without explicit user confirmation
- Reduced local mode: every dead-code claim still needs search evidence
- Reduced local mode: deletion review is local if no subagent reviewer is available
