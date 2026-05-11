# Codebase Cleanup Skill — Design

**Date:** 2026-04-12
**Skill:** `superpowers:codebase-cleanup`
**Location:** `skills/codebase-cleanup/SKILL.md`

---

## Overview

A workflow skill that orchestrates codebase cleanup and reorganization through a 7-step sequential pipeline. The orchestrator (main Claude session) coordinates all subagents, holds session state and file paths, and is the only entity that communicates with the user. Parallelism occurs within steps 1 (exploration), 2 (mapping), and 3 (analysis).

The terminal output is a brainstorming-ready refactoring request handed off to `superpowers:brainstorming`.

---

## Architecture

### Pipeline

```
Step 1  Scope            Orchestrator asks user what to clean up

        Primary scope discovery:
        ├─ Directory     User named a path → treat as starting scope
        └─ Semantic      User described by concept → dispatch parallel
                         exploration subagents (grep, symbol search,
                         cross-reference tracing) to find relevant files

        Forgotten-code check (ALWAYS, both branches):
          Dispatch parallel search subagents using keywords, symbol names,
          and concept synonyms extracted from the primary scope to find
          similar/related code in OTHER directories
          Present additional discoveries to user:
            "Found potentially related code outside your scope — include?"
          User confirms, removes false positives, adds misses

        Confirmed file set → scope for Step 2

Step 2  Map (parallel)   MAP: N directory-mapper subagents (one per confirmed
                              directory, run in parallel)
                         REDUCE: 1 consolidator subagent reads all directory
                                 files, produces semantic group files
                         REVIEW: map-reviewer subagent (accuracy + completeness)

Step 3  Analyze          M analysis subagents in parallel (one per semantic group)
        (parallel)       REVIEW: analysis-reviewer subagent (correctness of findings)

Step 4  Discuss          Orchestrator presents consolidated findings to user
                         User confirms which dead code and obsolete tests to delete

Step 5  Remove           Deletion subagents remove confirmed items, update map files
                         REVIEW: deletion-reviewer (cleanliness + map consistency)

Step 6  Synthesize       1 refactoring-request subagent reads full map + analysis
                         Produces brainstorming-ready request document

Step 7  Hand off         Orchestrator invokes superpowers:brainstorming
```

### Subagent prompt templates

| File | Role |
|---|---|
| `directory-mapper-prompt.md` | Maps one directory: API + one-liners + dead test flags |
| `map-consolidator-prompt.md` | Reduce phase: reads directory files, produces semantic group files |
| `analysis-prompt.md` | Per-group: identifies dead code, duplicates, abstraction opportunities |
| `deletion-agent-prompt.md` | Removes confirmed dead code, updates map files |
| `refactoring-request-prompt.md` | Synthesizes map + analysis into brainstorming-ready document |
| `map-reviewer-prompt.md` | Step 2 review: accuracy and completeness of map |
| `analysis-reviewer-prompt.md` | Step 3 review: correctness of dead/duplicate findings |
| `deletion-reviewer-prompt.md` | Step 5 review: deletion cleanliness and map consistency |

---

## Code Map Format

### Location

```
docs/superpowers/code-map/<timestamp>/
  by-directory/          # MAP phase output (one file per source directory)
    src-auth.md
    src-api.md
    ...
  by-group/              # REDUCE phase output (one file per semantic group)
    authentication.md
    data-access.md
    ...
  index.md               # Master index: group list, directory-to-group mapping
  refactoring-request.md # Step 6 output
```

The timestamp is set at the start of the session and used for all files in that run. Format: `YYYY-MM-DD-HHmm` (e.g. `2026-04-12-1430`) for human readability.

### Directory map file format (`by-directory/<dir>.md`)

```markdown
# src/auth

## Exports / Public API
- `authenticateUser(token: string): User | null` — validates JWT, returns user or null
- `AuthMiddleware` — Express middleware that enforces authentication on a route
- `SESSION_TTL` — constant defining session expiry in seconds

## Internal symbols (not exported)
- `validateSignature(token, secret)` — low-level HMAC check used by authenticateUser

## Semantic group suggestion
Authentication & Session Management

## Dead / obsolete tests
- `auth.legacy.test.ts` — tests `legacyLogin()` which was removed in 8a3f2c1
```

### Semantic group file format (`by-group/<group>.md`)

```markdown
# Authentication & Session Management

## Directories
- src/auth/
- src/middleware/session/
- src/utils/token.ts

## Full API surface
[merged export list from all member directories]

## Cross-directory dependencies
- src/api/ imports `authenticateUser` from src/auth/

## Analysis

### Dead code
- `SESSION_TTL` — exported but no importer found in codebase (grep confirmed)
- `validateSignature()` — only called by `legacyLogin()` which was removed

### Duplicated logic
- `src/auth/token.ts:parseJwt()` and `src/utils/jwt-helpers.ts:decodeToken()` —
  identical JWT decoding logic, differ only in error handling style

### Abstraction opportunities
- `authenticateUser()` and `authorizeUser()` share identical token-validation
  preamble — extractable as `validateToken(token): ParsedToken | AuthError`
```

---

## Step-Specific Review Criteria

### Step 2: map-reviewer
- Every exported symbol in the confirmed scope has an entry
- Dead/obsolete test flags are backed by evidence (removed symbol, removed file)
- Semantic group suggestions are plausible (not one group per file)
- No implementation details leaked into the map (API surface only)

### Step 3: analysis-reviewer
- Dead code claims are backed by concrete evidence (grep, import tracing — not assumptions)
- Duplicates are genuinely identical or near-identical, not superficially similar
- Abstraction suggestions are realistic, not speculative
- No findings outside the confirmed scope

### Step 5: deletion-reviewer
- Each deleted item was confirmed by the user in step 4
- No unconfirmed deletions
- Map files updated to reflect removals (deleted entries removed or annotated)
- No broken imports or references left behind

---

## Refactoring Request Format (`refactoring-request.md`)

```markdown
# Codebase Cleanup Refactoring Request

## Scope
[directories and semantic groups covered]

## What was removed
[list of deleted dead code and obsolete tests, with rationale]

## Remaining issues to address

### Duplicated logic
[list with file locations and specific lines]

### Abstraction opportunities
[proposed interfaces/abstractions with rationale]

### Reorganization suggestions
[grouping changes, file/module splits or merges]

## Current state reference
Code map: docs/superpowers/code-map/<timestamp>/
```

This document is handed to `superpowers:brainstorming` as context. Brainstorming designs the refactoring, produces a spec, then a plan, then hands to `subagent-driven-development` for implementation.

---

## Key Constraints

- The orchestrator holds only file paths and session state — subagents read their own prompt templates and map files directly
- The consolidator is the only agent that reads across directory files — analysis agents read only their assigned group file
- The user discussion in step 4 is handled directly by the orchestrator (not a subagent) via AskUserQuestion
- The forgotten-code check in step 1 runs regardless of how the user specified scope
- Exploration subagents in the semantic branch must trace call sites, imports, re-exports, and indirect references — not just direct grep matches
- Analysis findings must be evidence-backed; the analysis-reviewer rejects claims without concrete proof

---

## Integration

- **Feeds into:** `superpowers:brainstorming` (step 7 handoff)
- **Created following:** `superpowers:writing-skills` TDD process
- **Subagent coordination pattern:** `superpowers:dispatching-parallel-agents`
- **Review pattern:** `superpowers:subagent-driven-development` (per-step reviewer variant)
