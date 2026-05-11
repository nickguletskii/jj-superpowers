# Task 5: Codebase Cleanup Subagent Boundary

**Files:**
- Modify: `skills/codebase-cleanup/SKILL.md`
- Modify: `pseudocode/codebase-cleanup.tsx`

**Purpose:** Make subagent authorization and fallback behavior explicit for `codebase-cleanup`.

**Interfaces and invariants:**
- If the platform supports subagents and the user has authorized them, the existing map/reduce subagent pipeline remains the preferred workflow.
- If subagents are unavailable or unauthorized, the skill must ask for authorization or run reduced local mode.
- Reduced local mode must still include:
  - scope confirmation
  - forgotten-code search
  - evidence-backed findings
  - user-confirmed deletion list
  - deletion review, local if needed
  - handoff to `brainstorming`
- Step 4 discussion remains orchestrator-owned and must not be delegated.

**Subtasks:**
- [ ] Add an early "Subagent Availability" or "Execution Mode" section to `skills/codebase-cleanup/SKILL.md`.
- [ ] Define two modes:
  - **Subagent mode:** existing Step 1-7 map/reduce pipeline.
  - **Reduced local mode:** local versions of scope, forgotten-code search, mapping, analysis, user confirmation, deletion, and synthesis.
- [ ] Update Step 1 so semantic-description exploration and forgotten-code check say "dispatch subagents in subagent mode; otherwise perform local `rg` searches with synonyms and present evidence."
- [ ] Update Steps 2 and 3 so map/analyze can be local when subagents are not available.
- [ ] Update prompt template section to clarify prompt templates are used only in subagent mode.
- [ ] Add key constraints for local mode: do not delete without user confirmation; every dead-code claim still needs search evidence.
- [ ] Update pseudocode to branch on `userAuthorizedSubagents(ctx) && platformSupportsSubagents(ctx)`, while preserving the existing subagent path.

**Task-local checks:**
- Run `rg -n "Subagent|Reduced local|userAuthorizedSubagents|platformSupportsSubagents|forgotten-code|Do not delegate" skills/codebase-cleanup/SKILL.md pseudocode/codebase-cleanup.tsx`.
- Expected: explicit execution-mode boundary exists; forgotten-code and Step 4 constraints remain.
