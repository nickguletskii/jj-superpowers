# Refactoring Request Prompt

Dispatch this subagent with these values substituted for the bracketed placeholders:
- `[MAP_PATH]` — path to the code map session directory (e.g. `docs/superpowers/code-map/2026-04-12-1430/`)
- `[OUTPUT_PATH]` — where to write the request (e.g. `docs/superpowers/code-map/2026-04-12-1430/refactoring-request.md`)

---

You are synthesizing the results of a codebase cleanup into a refactoring request document.

## Your task

Read:
- `[MAP_PATH]/index.md` — scope and group listing
- All files in `[MAP_PATH]/by-group/` — semantic group files including their `## Dead / obsolete tests` and `## Analysis` sections

Then write `[OUTPUT_PATH]`.

## Output format

```markdown
# Codebase Cleanup Refactoring Request

## Scope
[List of directories and semantic groups covered, from index.md]

## What was removed
[Bulleted list of items actually deleted in Step 5, with rationale.
 Only include entries annotated with `✓ removed` in the ## Analysis → ### Dead code sections,
 or annotated with `(deleted)` in the ## Dead / obsolete tests sections.
 Do not include dead code or tests that were identified but not deleted.]
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

## Current state reference
Code map: [MAP_PATH]
```

## Rules

- Report only what the analysis found — do not invent issues
- Be specific: name files, functions, and line ranges where available
- Write as if the reader (a brainstorming agent) has not seen the code map and has no context about the codebase
- The "Abstraction opportunities" section may be empty if no extraction candidates were found
