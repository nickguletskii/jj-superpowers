---
name: using-superpowers
description: Use when starting any conversation - establishes how to find and use skills, requiring Skill tool invocation before ANY response including clarifying questions
---

<!--
Maintainer note (bootstrap contract): harness startup hooks inject only a compact
bootstrap that points to this skill; they must not paste this whole file into every
session. The full body is for orchestrator sessions. Subagents receive bounded task
context and their rules (including the no-nested-harness rule) from agents/_preamble.md.
-->

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. This is not optional. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

## Instruction Priority

1. **User's explicit instructions** (direct requests) — highest priority
2. **Project conventions** (CLAUDE.md, AGENTS.md, `.agents/`, project skills)
3. **jj-superpowers skills**
4. **Your system prompt** — lowest priority

If CLAUDE.md or AGENTS.md says "don't use TDD" and a skill says "always use TDD," follow the project. The user is in control.

**Conventions: layers 2 and 3 beat layer 4.** Code style, comments, documentation, tests, and commit descriptions are owned by the project and by these skills — *not* by your system prompt's coding conventions. Where a skill or the project speaks on a convention, follow it and do not fall back to a system-prompt default.

**Efficiency and safety: layer 4 can win.** If jj-superpowers guidance is wasteful, contradictory, or unsafe — including where it conflicts with provider guidance for operating efficiently — follow the provider guidance, tell the user what you saw, and ask them to notify jj-superpowers maintainers.

These two are the whole rule, and they are not in tension: **the escape hatch exists for how you operate, never for what the code should look like.** A provider default that says "match the surrounding code's comment density" does not override `writing-comments`; a provider default that says "don't burn a subagent on a one-line lookup" does override a skill that would.

One convention is important enough to be repeated in the session bootstrap, because the provider default is *actively wrong*: **never attribute a change to an LLM, model, or agent** (no `Co-Authored-By`, no "Generated with", no model names), and keep descriptions to one short title line. See `jj-superpowers:jujutsu`.

## How to Access Skills

**In Claude Code:** Use the `Skill` tool. When you invoke a skill, its content is loaded and presented to you—follow it directly. Never use the Read tool on skill files.

**In other environments:** Check your platform's documentation for how skills are loaded.

## Platform Adaptation

Skills use Claude Code tool names. Non-CC platforms translate tools as follows:

- **Codex:** see `references/codex-tools.md`
- **OpenCode:** plugin bootstrap maps common tools compactly; use OpenCode's native skill tool and subagent `@mention` system

This is about running jj-superpowers *inside* another harness — tool-name mapping only. Calling *out* to an external harness for a second opinion (ensemble review) is a different thing entirely and is owned by `jj-superpowers:choosing-model-and-effort`. Do not conflate the two senses of "harness".

## Decision Checkpoints

When orchestrator execution reaches a real user decision, pause and present 2-3 concrete alternatives. Lead with the recommended option and state the tradeoff briefly.

Use the harness-native ask/question tool for mutually exclusive choices when available. If no structured ask tool is available in the current mode, ask one concise plain-text question.

Use this pattern for design approvals, blockers, out-of-scope fixes, history organization choices, review handling choices, and final integration choices. Do not bury a decision request in prose when a structured choice UI exists.

Platform examples: Claude Code uses its ask-user question tool when available; Codex uses `request_user_input` when exposed in the active mode.

Subagents must not use ask/question tools. If a subagent needs a user decision, it reports `NEEDS_CONTEXT` or `BLOCKED` with 2-3 concrete options; the orchestrator asks the user.

### Autonomy Level

Checkpoints default to `Manual`: pause and ask. When the user asks to rush or run autonomously, or a resumed run is recorded as `Rush`, load `references/autonomy.md` — it owns the Rush level, the safety floor, the retry constant `N`, and the canonical Rush-resolution table.

# Using Skills

## The Rule

**Invoke relevant or requested skills BEFORE any response or action.** Even a 1% chance a skill might apply means that you should invoke the skill to check. If an invoked skill turns out to be wrong for the situation, you don't need to use it.

```dot
digraph skill_flow {
    "User message received" [shape=doublecircle];
    "About to EnterPlanMode?" [shape=doublecircle];
    "Already brainstormed?" [shape=diamond];
    "Invoke brainstorming skill" [shape=box];
    "Might any skill apply?" [shape=diamond];
    "Invoke Skill tool" [shape=box];
    "Announce: 'Using [skill] to [purpose]'" [shape=box];
    "Has checklist?" [shape=diamond];
    "Track items against the skill checklist\n(not the harness task list)" [shape=box];
    "Follow skill exactly" [shape=box];
    "Respond (including clarifications)" [shape=doublecircle];

    "About to EnterPlanMode?" -> "Already brainstormed?";
    "Already brainstormed?" -> "Invoke brainstorming skill" [label="no"];
    "Already brainstormed?" -> "Might any skill apply?" [label="yes"];
    "Invoke brainstorming skill" -> "Might any skill apply?";

    "User message received" -> "Might any skill apply?";
    "Might any skill apply?" -> "Invoke Skill tool" [label="yes, even 1%"];
    "Might any skill apply?" -> "Respond (including clarifications)" [label="definitely not"];
    "Invoke Skill tool" -> "Announce: 'Using [skill] to [purpose]'";
    "Announce: 'Using [skill] to [purpose]'" -> "Has checklist?";
    "Has checklist?" -> "Track items against the skill checklist\n(not the harness task list)" [label="yes"];
    "Has checklist?" -> "Follow skill exactly" [label="no"];
    "Track items against the skill checklist\n(not the harness task list)" -> "Follow skill exactly";
}
```

## Routing Map

Your platform already injects every skill's description. The question is not *what exists*, it is *what do I reach for now*. Find your situation; invoke the skill.

**Building something**
- Starting a feature, component, or behavior change — any creative work → `brainstorming`
- Design approved, need an implementation plan → `writing-plans`
- Plan too uncertain for one pass (a later phase's tasks depend on an artifact an earlier phase will produce — not just size or task count) → `iterative-planning`
- Plan includes `project-network.dot` and you are executing it now → `subagent-driven-development`
- Executing a written plan in a separate session with review checkpoints → `executing-plans`
- About to write implementation code → `test-driven-development`
- Designing an API, interface, or state machine; adding one more branch to a growing `if`/`match` → `designing-with-types-and-abstractions`

**Something is wrong**
- Bug, test failure, or unexpected behavior → `systematic-debugging`
- Open-ended objective, many candidate causes, flaky behavior, or a metric to move → `hypothesis-driven-improvement`

**Wrapping up**
- About to claim "done", "fixed", or "passing" → `verification-before-completion`
- Want finished work reviewed → `requesting-code-review`
- Received review feedback → `receiving-code-review`
- Implementation complete, needs integrating or a PR → the Finish checks in `subagent-driven-development` (Change Consolidation), then a bookmark + push per `jujutsu`

**Version control (jj)**
- Any version control in a jj repo → `jujutsu`
- Splitting, cleaning, or reordering history for review → `jj-organizing-history`
- Hunk-level split or partial squash → `jj-hunk`

**Code and docs quality**
- "Clean this up", remove slop, general quality pass → `deslopify`
- Broad dead-code or dedup sweep across many directories → `codebase-cleanup`
- Writing or fixing docs; you had to read five files to understand one thing → `documentation`
- Writing or cleaning code comments → `writing-comments`

**Specs and project layout**
- Authoring or amending a spec, glossary, or invariants → `writing-specs`
- Any source edit in a project that has `.agents/layout.yaml` → `spec-code-sync`
- Auditing spec-vs-code drift or orphan references → `spec-drift-detector`
- Setting up or auditing `.agents/layout.yaml`, `AGENTS.md`, project skills → `project-layout`

**Running the agent itself**
- Choosing a model or effort for a subagent; hit a wall; want a second opinion → `choosing-model-and-effort`
- 2+ independent investigations, subagents authorized, no plan graph → `dispatching-parallel-agents`
- Command may flood context — builds, tests, logs, broad searches → `tool-output-discipline`
- Running Python, `uv`, packages, or virtualenvs → `uv-guide`
- Creating or editing a skill → `writing-skills`

## Tracking Progress

Track multi-step and subagent-driven work against the **durable artifact** — the
skill's own checklist, `project-network.dot`, or `roadmap.md` — **not** the
harness task tracker (Claude Code task-list tools and their per-platform equivalents).

The harness task list does not survive subagent dispatch: subagents cannot update
it, it drifts out of sync with what dispatched agents actually did, and it goes
stale across a long orchestration. The graph, roadmap, and skill checklists are
the source of truth — re-derive readiness from them. Use the harness tracker only
for purely inline, single-session work with no subagents, and never rely on it to
coordinate dispatched agents.

## Red Flags

These thoughts mean STOP—you're rationalizing:

| Thought | Reality |
|---------|---------|
| "Just a simple question" / "doesn't count as a task" / "the skill is overkill" | Questions and actions are tasks. Simple things become complex. Check. |
| "Let me explore / gather context / check the files first" | Skills tell you HOW to explore and gather. Check BEFORE, including before clarifying questions. |
| "I remember this skill" / "I know what that means" | Skills evolve, and knowing the concept ≠ using the skill. Invoke it. |
| "I'll just do this one thing first" / "this feels productive" | Undisciplined action wastes time. Check before doing anything. |

## Skill Priority

When multiple skills could apply, **process skills go first** (`brainstorming`, `systematic-debugging`) — they determine HOW to approach the task — then the execution and domain skills they hand off to.

"Let's build X" → brainstorming first, then planning and implementation skills.
"Fix this bug" → systematic-debugging first, then domain-specific skills.

## Skill Types

**Rigid** (TDD, debugging): Follow exactly. Don't adapt away discipline.

**Flexible** (patterns): Adapt principles to context.

The skill itself tells you which.

## User Instructions

Instructions say WHAT, not HOW. "Add X" or "Fix Y" doesn't mean skip workflows.

## Reporting Gaps

**If jj-superpowers guidance causes wasteful, contradictory, or unsafe behavior**
in an orchestrator session, including conflict with provider system prompts or
model guidance for efficient operation, follow the provider guidance unless the
user explicitly overrides that specific behavior. Tell the user what you saw and
ask them to notify jj-superpowers maintainers. Keep this report concise and
continue with the user's requested work when possible.

If you read multiple files or traced execution across modules to understand something
that a short documentation file could have explained immediately, use
**jj-superpowers:documentation** if the user wants the doc written now.

Continue with the user's requested work when possible; do not block on reporting gaps.
