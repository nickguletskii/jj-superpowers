# Task 3: Create map-consolidator-prompt.md

**Files:**
- Create: `skills/codebase-cleanup/map-consolidator-prompt.md`

**Context:** `context/skill-conventions.md`

This prompt is dispatched once during Step 2 REDUCE phase, after all directory-mapper subagents have completed. It reads all `by-directory/` files and produces the `by-group/` files and `index.md`.

---

- [ ] **Step 1: Create the prompt template**

Create `skills/codebase-cleanup/map-consolidator-prompt.md` with this exact content:

```markdown
# Map Consolidator Prompt

Dispatch this subagent with these values substituted for the bracketed placeholders:
- `[BY_DIRECTORY_PATH]` — path to directory map files (e.g. `docs/superpowers/code-map/2026-04-12-1430/by-directory/`)
- `[BY_GROUP_PATH]` — output path for group files (e.g. `docs/superpowers/code-map/2026-04-12-1430/by-group/`)
- `[INDEX_PATH]` — path for `index.md` parent directory (e.g. `docs/superpowers/code-map/2026-04-12-1430/`)
- `[SESSION_TIMESTAMP]` — the session timestamp (e.g. `2026-04-12-1430`)
- `[SCOPE_DIRECTORIES]` — comma-separated list of all directories that were mapped

---

You are the reduce phase of a codebase mapping operation. Read all directory map files and organize them into semantic groups.

## Your task

1. Read all `.md` files in `[BY_DIRECTORY_PATH]`
2. Identify semantic groups based on the "Semantic group suggestion" fields and conceptual similarity between directories
3. For each group, write one file to `[BY_GROUP_PATH]/<group-name-in-kebab-case>.md`
4. Write `[INDEX_PATH]/index.md`

## Semantic group file format

```markdown
# [Group Name]

## Directories
- path/to/dir/
- path/to/other/dir/

## Full API surface
- `symbol(args): ReturnType` — description [from src/auth/]
- `otherSymbol()` — description [from src/utils/]

## Cross-directory dependencies
- `src/api/` imports `authenticateUser` from `src/auth/`
- (none) if no cross-directory imports found

## Analysis
[Leave this section blank — a separate analysis agent will fill it in]
```

## index.md format

```markdown
# Code Map Index

**Session:** [SESSION_TIMESTAMP]
**Scope:** [SCOPE_DIRECTORIES]

## Semantic Groups

| Group | Description |
|---|---|
| [Group Name](by-group/group-name-in-kebab-case.md) | one-line description of what this group does |

## Directory to Group Mapping

| Directory | Group |
|---|---|
| src/auth/ | Authentication & Session Management |
```

## Grouping guidelines

- Aim for 3–8 groups total; merge small related directories rather than creating one group per directory
- Group by WHAT the code does, not WHERE it lives in the filesystem
- Group file names must be kebab-case (e.g. `authentication-session-management.md`)
- Include ALL symbols from all member directories in "Full API surface"; annotate each with its source directory in brackets
- Check import statements to discover cross-directory dependencies
- If a directory spans multiple semantic concerns, assign it to the dominant one and note the secondary in a comment
```

- [ ] **Step 2: Verify the file was created**

Run: `ls skills/codebase-cleanup/`

Expected: `map-consolidator-prompt.md` appears in the listing
