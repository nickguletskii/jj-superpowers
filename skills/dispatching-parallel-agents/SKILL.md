---
name: dispatching-parallel-agents
description: Use when 2+ unrelated things need investigating at once and subagents are authorized — failing tests across different subsystems, independent code-archaeology questions, map/reduce exploration, or root-cause hypotheses checkable without touching shared files. With a `project-network.dot` plan, use subagent-driven-development instead.
---

# Dispatching Parallel Agents

For ad hoc parallel investigation, not planned implementation. If the user hasn't authorized subagents or platform policy requires explicit permission, ask or work locally.

**Fits:** unrelated failures in different subsystems; archaeology questions over separate areas; map/reduce exploration before a design or cleanup decision; independent hypotheses checkable without shared writes.

**Doesn't fit:** related failures that may share one root cause; work needing shared mutable state, the same files, or the same contended command; exploration where you can't yet name separate domains.

## Pattern

1. Split by file, subsystem, failing test group, or hypothesis, and confirm the domains need no shared writes or runtime state.
2. Dispatch one investigator per domain, all in one response, each with a self-contained prompt.
3. Keep doing useful local work while they run.
4. Read every report, check for contradictions or a shared root cause, inspect any diffs yourself, then run one integrated verification before claiming anything.
5. If the work grows into planned implementation, move to `brainstorming` or `writing-plans`.

Investigators normally report findings rather than edit. Allow edits only when the user asked for them and each agent has a disjoint write scope.

## Prompt contents

- **Scope** — exact files, test group, subsystem, or hypothesis.
- **Goal** — the question or symptom to explain.
- **Constraints** — what they may read, edit, and run; what to leave alone.
- **Evidence** — error output, test names, traces, search terms.
- **Output** — root cause with file:line evidence, recommended fix, files changed, commands run.

Also tell each agent not to invoke another agent harness by any channel — shell (`claude`, `codex`, `opencode`) or MCP (e.g. `mcp__codex__codex`) — and to report `NEEDS_CONTEXT` or `BLOCKED` if it needs more delegation. Ad hoc agents don't carry the shared preamble, so nested sessions otherwise happen just because the tool is available.

```markdown
Investigate failures in `src/agents/agent-tool-abort.test.ts` only.

Goal: do the three abort-related failures come from test timing or production abort behavior?

Constraints: don't edit files; don't investigate batch-completion or tool-approval tests; run only this test file.

Evidence:
- "should abort tool with partial output capture" expects "interrupted at".
- "should properly track pendingToolCount" expects 3 results, gets 0.

Return: root cause with file:line evidence, production vs test fix, commands run.
```

## Common mistakes

- Giving every agent the whole problem instead of one domain.
- Trusting summaries without checking evidence or diffs.
- Several agents running the same contended build or test command when one batched run would do.
