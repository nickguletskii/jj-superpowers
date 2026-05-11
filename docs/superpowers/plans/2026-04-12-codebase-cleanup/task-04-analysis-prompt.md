# Task 4: Create analysis-prompt.md

**Files:**
- Create: `skills/codebase-cleanup/analysis-prompt.md`

**Context:** `context/skill-conventions.md`

This prompt is dispatched once per semantic group during Step 3, all in parallel. Each agent appends an `## Analysis` section to its assigned group file. Evidence-backed findings are a hard requirement — the analysis-reviewer will reject unsubstantiated claims.

---

- [ ] **Step 1: Create the prompt template**

Create `skills/codebase-cleanup/analysis-prompt.md` with this exact content:

```markdown
# Analysis Prompt

Dispatch this subagent with these values substituted for the bracketed placeholders:
- `[GROUP_FILE_PATH]` — path to the semantic group file (e.g. `docs/superpowers/code-map/2026-04-12-1430/by-group/authentication-session-management.md`)
- `[GROUP_NAME]` — human-readable group name for context (e.g. `Authentication & Session Management`)

---

You are analyzing the `[GROUP_NAME]` semantic group for dead code, duplicated logic, and abstraction opportunities.

## Your task

Read `[GROUP_FILE_PATH]`. For each symbol in the "Full API surface" section, perform the checks below.

### 1. Dead code check

Search the codebase for usages of this symbol outside the file that defines it.

- Use grep to search for the symbol name across the codebase
- Check both import statements and direct usages
- If 0 usages found outside the defining file, flag as potentially dead
- Do NOT flag as dead without grep evidence — dynamic imports or reflection may be the consumer

### 2. Duplication check

Compare symbols across the directories listed in the group file. If two symbols appear to do the same thing (similar name, similar signature, similar description):

- Read the actual source files to confirm the implementations are duplicated or near-identical
- Similar names alone are not evidence of duplication
- Only claim duplication after reading both implementations

### 3. Abstraction opportunities

Look for 2+ functions that share significant implementation logic that could be extracted:

- Be specific: name the files, the functions, and the specific lines or logical blocks that are shared
- A vague "could be refactored" is not an abstraction opportunity — name the proposed extraction

## Output

Append the following to `[GROUP_FILE_PATH]` (do not overwrite existing content):

```markdown
## Analysis

### Dead code
- `symbolName` in `path/to/file.ts` — no usages found (grep: `import.*symbolName` → 0 results outside defining file)
- (none) if no dead code found

### Duplicated logic
- `path/a.ts:functionA()` and `path/b.ts:functionB()` — [exact description: both implement X by doing Y; confirmed by reading both implementations]
- (none) if no duplicates found

### Abstraction opportunities
- `functionA()` and `functionB()` share [specific lines/logic description] — could be extracted as `proposedName()`
- (none) if no opportunities found
```

## Rules

- Every dead code claim MUST include the grep pattern used and the result count
- Read actual implementations before claiming duplication — do not assume from names alone
- Abstraction suggestions must name specific files, functions, and the proposed extraction
- Do not include findings outside the directories listed in this group's "Directories" section
```

- [ ] **Step 2: Verify the file was created**

Run: `ls skills/codebase-cleanup/`

Expected: `analysis-prompt.md` appears in the listing
