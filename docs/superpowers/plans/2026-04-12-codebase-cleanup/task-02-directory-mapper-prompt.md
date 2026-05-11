# Task 2: Create directory-mapper-prompt.md

**Files:**
- Create: `skills/codebase-cleanup/directory-mapper-prompt.md`

**Context:** `context/skill-conventions.md`

This prompt is dispatched by the orchestrator during Step 2 MAP phase — one instance per confirmed directory, all in parallel. The orchestrator substitutes the bracketed placeholders before dispatching.

---

- [ ] **Step 1: Create the prompt template**

Create `skills/codebase-cleanup/directory-mapper-prompt.md` with this exact content:

```markdown
# Directory Mapper Prompt

Dispatch this subagent with these values substituted for the bracketed placeholders:
- `[DIRECTORY_PATH]` — the directory to map (e.g. `src/auth/`)
- `[OUTPUT_PATH]` — where to write output (e.g. `docs/superpowers/code-map/2026-04-12-1430/by-directory/src-auth.md`)

---

You are mapping the codebase directory `[DIRECTORY_PATH]` to produce a structured API surface document.

## Your task

Read every source file directly inside `[DIRECTORY_PATH]` (immediate files only — do not recurse into subdirectories). For each file:

1. Identify all exported symbols (functions, classes, constants, types, interfaces)
2. Write a one-sentence description of what each does (what it does, not how)
3. Identify internal (non-exported) symbols that are substantial: called from multiple places or 20+ lines of code
4. Write a one-sentence description of each substantial internal symbol
5. Suggest a semantic group name for this directory (e.g. "Authentication & Session Management", "Data Access", "HTTP Utilities")

Also scan test files in this directory:
- Flag any test file that tests code which no longer exists in the codebase
- Provide concrete evidence (e.g. "tests `legacyLogin()` which does not appear in any source file — grep confirms 0 results")

## Output

Write to `[OUTPUT_PATH]`:

```markdown
# [DIRECTORY_PATH]

## Exports / Public API
- `symbolName(args: ArgType): ReturnType` — one sentence describing what it does
- (none) if no exports

## Internal symbols (not exported)
- `symbolName(args)` — one sentence describing what it does
- (none) if no substantial internal symbols

## Semantic group suggestion
[Your suggested group name]

## Dead / obsolete tests
- `filename.test.ts` — [evidence: what it tests that no longer exists]
- (none) if no dead tests found
```

## Rules

- API surface only — never describe implementation details or internal logic
- One sentence per symbol — no multi-line descriptions
- Do not recurse into subdirectories; map immediate files only
- Do not flag a test as dead without concrete grep evidence for the missing symbol
```

- [ ] **Step 2: Verify the file was created**

Run: `ls skills/codebase-cleanup/`

Expected: `directory-mapper-prompt.md` appears alongside `SKILL.md`
