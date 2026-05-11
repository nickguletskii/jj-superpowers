# Task 6: Create refactoring-request-prompt.md

**Files:**
- Create: `skills/codebase-cleanup/refactoring-request-prompt.md`

**Context:** `context/skill-conventions.md`

This prompt is dispatched once during Step 6. The agent reads the full code map (post-deletion) and produces the `refactoring-request.md` that gets handed to `superpowers:brainstorming` in Step 7.

---

- [ ] **Step 1: Create the prompt template**

Create `skills/codebase-cleanup/refactoring-request-prompt.md` with this exact content:

```markdown
# Refactoring Request Prompt

Dispatch this subagent with these values substituted for the bracketed placeholders:
- `[MAP_PATH]` — path to the code map session directory (e.g. `docs/superpowers/code-map/2026-04-12-1430/`)
- `[OUTPUT_PATH]` — where to write the request (e.g. `docs/superpowers/code-map/2026-04-12-1430/refactoring-request.md`)

---

You are synthesizing the results of a codebase cleanup into a refactoring request document.

## Your task

Read:
- `[MAP_PATH]/index.md` — scope and group listing
- All files in `[MAP_PATH]/by-group/` — semantic group files including their `## Analysis` sections

Then write `[OUTPUT_PATH]`.

## Output format

```markdown
# Codebase Cleanup Refactoring Request

## Scope
[List of directories and semantic groups covered, from index.md]

## What was removed
[Bulleted list of dead code and obsolete tests that were deleted in Step 5, with rationale.
 Source: `✓ removed` annotations in the ## Analysis sections.]
- `symbolName` from `path/to/file.ts` — [why it was dead]
- (none) if nothing was removed

## Remaining issues to address

### Duplicated logic
[For each duplicate from the ## Analysis sections: file locations, function names, description of what's duplicated]
- `path/a.ts:functionA()` and `path/b.ts:functionB()` — [description]
- (none) if none

### Abstraction opportunities
[For each opportunity: proposed name, which symbols it would replace, rationale]
- Proposed: `extractedName()` — replaces `functionA` and `functionB` which share [specific logic]
- (none) if none

### Reorganization suggestions
[Structural improvements: file splits, module merges, directory reorganization]
- (none) if none warranted

## Current state reference
Code map: [MAP_PATH]
```

## Rules

- Report only what the analysis found — do not invent issues
- Be specific: name files, functions, and line ranges where available
- Write as if the reader (a brainstorming agent) has not seen the code map and has no context about the codebase
- The "Reorganization suggestions" section may be empty if no structural changes are warranted
```

- [ ] **Step 2: Verify the file was created**

Run: `ls skills/codebase-cleanup/`

Expected: `refactoring-request-prompt.md` appears in the listing
