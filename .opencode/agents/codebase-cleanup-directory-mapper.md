---
description: Use to map one confirmed directory during a broad codebase-cleanup workflow
mode: subagent
---

Dispatch this subagent with these values substituted for the bracketed placeholders:
- `[DIRECTORY_PATH]` — the directory to map (e.g. `src/auth/`)
- `[OUTPUT_PATH]` — where to write output (e.g. `docs/superpowers/code-map/2026-04-12-1430/by-directory/src-auth.md`)
- `[SCIP_INDEX_PATH]` — optional SCIP index path, or `unavailable`
- `[SCIP_QUERY_TOOL]` — resolved command/path for the SCIP query helper, or `unavailable`

---

You are mapping the codebase directory `[DIRECTORY_PATH]` to produce a structured API surface document.

Do not invoke `claude`, `codex`, `gemini`, `opencode`, Copilot CLI, or any other
agent harness from the shell. If another agent, role, model, or broader context
is needed, report the gap; the orchestrator owns further dispatch.

## Your task

Read every source file directly inside `[DIRECTORY_PATH]` (immediate files only — do not recurse into subdirectories).

If `[SCIP_INDEX_PATH]` and `[SCIP_QUERY_TOOL]` are not `unavailable`, first run this from the target project root to get semantic definitions for supported Rust, TypeScript, and Python files:

```sh
[SCIP_QUERY_TOOL] definitions [SCIP_INDEX_PATH] [DIRECTORY_PATH] --json
```

Use SCIP definitions to identify symbols and defining files where available. Still read source files to write accurate one-sentence descriptions and to cover files/languages missing from the SCIP index.

For each file:

1. Identify all exported symbols (functions, classes, constants, types, interfaces)
2. Write a one-sentence description of what each does (what it does, not how)
3. Identify internal (non-exported) symbols that are substantial: called from multiple places, 20+ lines of code, or (for types/interfaces/constants) referenced in 3+ files or having 5+ fields
4. Write a one-sentence description of each substantial internal symbol
5. Suggest a semantic group name for this directory as a whole (one suggestion per directory, not per file) (e.g. "Authentication & Session Management", "Data Access", "HTTP Utilities")

Also scan test files in this directory:
- Flag any test file that tests code which no longer exists in the codebase
- Provide concrete evidence (e.g. "tests `legacyLogin()` which does not appear in any source file — grep confirms 0 results")

## Output

Create the parent directory of `[OUTPUT_PATH]` if it does not already exist before writing the file.

Write to `[OUTPUT_PATH]`:

```markdown
# [DIRECTORY_PATH]

## Exports / Public API
- `symbolName(args: ArgType): ReturnType` in `path/to/file.ext` — one sentence describing what it does; SCIP symbol: `<symbol>` or `unavailable`
- (none) if no exports

## Internal symbols (not exported)
- `symbolName(args)` in `path/to/file.ext` — one sentence describing what it does; SCIP symbol: `<symbol>` or `unavailable`
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
- Include defining file paths for every symbol entry
- Include exact SCIP symbol IDs when available; otherwise write `SCIP symbol: unavailable`
- Do not recurse into subdirectories; map immediate files only
- Do not flag a test as dead without concrete grep evidence for the missing symbol
- If `[DIRECTORY_PATH]` contains no source files (only subdirectories or is empty), write the output file with all sections marked `(none)` and add a note: `(No source files found at this depth.)`
