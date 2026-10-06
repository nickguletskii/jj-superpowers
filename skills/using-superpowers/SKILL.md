---
name: using-superpowers
description: Use at the start of an orchestrator session to learn how to find, load, and prioritize jj-superpowers skills, handle user decision checkpoints, and track progress. Subagents dispatched for a specific task skip it.
---

<!--
Maintainer note (bootstrap contract): harness startup hooks inject only a compact
bootstrap that points to this skill; they must not paste this whole file into every
session. The full body is for orchestrator sessions. Subagents receive bounded task
context and their rules (including the no-nested-harness rule) from agents/_preamble.md.
-->

If you were dispatched as a subagent to execute a specific task, skip this skill.

## Instruction priority

1. User's explicit instructions
2. Project conventions (CLAUDE.md, AGENTS.md, `.agents/`, project skills)
3. jj-superpowers skills
4. Your system prompt

**Conventions:** layers 2 and 3 beat layer 4. Code style, comments, documentation, tests, and commit descriptions are owned by the project and these skills, not by your system prompt's coding conventions.

**Efficiency and safety:** layer 4 can win. If skill guidance is wasteful, contradictory, or unsafe — including where it conflicts with provider guidance for operating efficiently — follow the provider guidance, tell the user briefly what you saw, ask them to notify jj-superpowers maintainers, and continue the work.

The escape hatch covers how you operate, never what the code looks like. "Match the surrounding comment density" does not override `writing-comments`; "don't spend a subagent on a one-line lookup" does override a skill that would.

Never attribute a change to an LLM, model, or agent (no `Co-Authored-By`, no "Generated with", no model names), and keep change descriptions to one short title line — the provider default here is wrong. See `jujutsu`.

## Loading skills

Before acting, check whether a listed skill plausibly applies; if so, load it (Claude Code: the `Skill` tool, not Read on the skill file), and drop it if it turns out irrelevant. Load skills fresh rather than from memory; they change.

When several apply, process skills come first (`brainstorming`, `systematic-debugging`) because they decide how to approach the task; execution and domain skills follow. "Add X" or "fix Y" says what to do, not that the workflow can be skipped. `test-driven-development` is the default for behavior changes, not a ritual for every edit. Before entering plan mode for design-bearing work, run `brainstorming` if you haven't.

**Other harnesses.** Codex tool-name mapping: `references/codex-tools.md`. OpenCode: the plugin bootstrap maps common tools; use its native skill tool and `@mention` subagents. This is about running *inside* another harness; calling *out* to one for a second opinion belongs to `choosing-model-and-effort`.

## Routing map

**Building something**
- Feature, component, or behavior change → `brainstorming`
- Approved design, need a plan → `writing-plans`
- Later phases depend on artifacts earlier phases produce (not mere size) → `iterative-planning`
- Executing a plan with `project-network.dot` now → `subagent-driven-development`
- Executing a written plan in a separate session → `executing-plans`
- Writing implementation code → `test-driven-development`
- Designing an API, interface, or state machine; a growing `if`/`match` → `designing-with-types-and-abstractions`

**Something is wrong**
- Bug, test failure, unexpected behavior → `systematic-debugging`
- Open-ended objective, many candidate causes, flaky behavior, a metric to move → `hypothesis-driven-improvement`

**Wrapping up**
- About to claim done/fixed/passing → `verification-before-completion`
- Want review → `requesting-code-review`; received review → `receiving-code-review`
- Ready to integrate → Change Consolidation in `subagent-driven-development`, then bookmark + push per `jujutsu`

**Version control (jj)**
- Any jj work → `jujutsu`; reorganizing history → `jj-organizing-history`; hunk-level split or partial squash → `jj-hunk`

**Code and docs quality**
- General cleanup or slop removal → `deslopify`; broad dead-code/dedup sweep → `codebase-cleanup`
- Docs, or you read five files to understand one thing → `documentation`; code comments → `writing-comments`

**Specs and project layout**
- Authoring or amending a spec, glossary, invariants → `writing-specs`
- Source edit in a project with `.agents/layout.yaml` → `spec-code-sync`
- Spec-vs-code drift → `spec-drift-detector`; layout manifest, `AGENTS.md`, project skills → `project-layout`

**Running the agent**
- Model or effort choice, hit a wall, second opinion → `choosing-model-and-effort`
- 2+ independent investigations, no plan graph → `dispatching-parallel-agents`
- Builds, tests, logs, broad searches → `tool-output-discipline`
- Python or `uv` → `uv-guide`; creating or editing a skill → `writing-skills`

## Decision checkpoints

At a real user decision — design approval, blockers, out-of-scope fixes, history organization, review handling, integration — present 2–3 concrete options, recommended one first, with the tradeoff in a line. Use the harness ask/question tool when available (Claude Code's ask-user tool, Codex `request_user_input`); otherwise ask one concise plain-text question.

Subagents do not ask the user. They report `NEEDS_CONTEXT` or `BLOCKED` with 2–3 options and the orchestrator asks.

**Autonomy.** Checkpoints default to `Manual` (pause and ask). When the user asks to rush or run autonomously, or a resumed run is recorded as `Rush`, load `references/autonomy.md`; it owns the Rush level, the safety floor, the retry constant `N`, and the Rush-resolution table.

## Tracking progress

Track multi-step and subagent work against the durable artifact — the skill's checklist, `project-network.dot`, or `roadmap.md` — not the harness task list. Subagents can't update the harness list, so it drifts from what they actually did; re-derive readiness from the artifact. The harness tracker is fine for inline, single-session work with no subagents.

## Documentation gaps

If you had to trace several files to learn something a short doc would have told you, mention it; use `documentation` if the user wants it written now. Don't block the requested work on it.
