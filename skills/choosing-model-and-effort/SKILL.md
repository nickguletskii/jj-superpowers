---
name: choosing-model-and-effort
description: Use when choosing which model or reasoning effort to dispatch a subagent with, when a task failed and you are tempted to retry with a stronger model or higher effort, when a model is unavailable, or when considering an external harness (Codex MCP, gemini, opencode).
---

# Choosing Model and Effort

## Overview

Model sets the ceiling; effort sets how close you get to it, with sharply diminishing returns. More effort can't lift a model past its ceiling, so when a task keeps failing the lever is rarely "same model, more effort."

Pick the cheapest configuration that clears the task's bar. The point of this skill is cheaper, better-targeted dispatch, not reaching for bigger models.

Concrete model ids, classes, and availability live in `models.md`; this file is the decision procedure.

## Dispatch Table (Claude Code)

| Task shape | Model | Effort |
|---|---|---|
| Easy, well-specified, mechanical; named files and APIs | `claude-sonnet-5-5` | low |
| Standard implementation | `claude-sonnet-5-5` or `claude-opus-5-5` | medium |
| Subtle, cross-file, integration, ambiguous failure | `claude-opus-5-5` | medium |
| Design judgment, graph repair, code-quality review | `claude-opus-5-5` | medium |

**Opus starts at `medium`, however hard the task looks.** Raise it to `high` only after Opus at `medium` has hit a wall on this task (see Escalation); `xhigh` and `max` likewise only after the level below hit one. Each raise is one escalation step.

Model and effort are separate levers with different cost curves; treat them separately. A fast-class model that needs repeated retries or far more steps than the task warrants isn't cheaper — move the task up a class rather than raising its effort.

## Escalation

Don't retry the same `(model, effort)` unchanged — change the instructions, context, task shape, or configuration.

| Situation | Action |
|---|---|
| Speculative — "this looks hard, let me start bigger" | Ask the user. |
| Wall — the task actually failed at the chosen model after `N = 3` retries (constant defined in `jj-superpowers:using-superpowers`) | Take one step up without asking. |
| More than one step, or leaving the harness | Ask the user. |

A wall is empirical: the cheap option was tried and failed, not merely doubted.

Escalate class before effort; once at `claude-opus-5-5`, the remaining step is effort. The top effort levels cost the most and buy the least on every model; a stronger class at lower effort usually beats a weaker one at `max`. If medium → high didn't help, higher won't.

Before spending more, re-read the task. A task that fails at `opus[high]` is far more often underspecified than under-powered, and a sharper task file is cheaper than a bigger model.

## Availability

Any model can be unavailable.

- Degrade to the nearest available option and say so. A silent downgrade on a hard task later looks like a genuine failure and gets misdiagnosed.
- Don't substitute upward to a costlier model without permission; unavailability isn't a wall.

## External Harnesses (Codex MCP)

Use Codex as a reviewer, not to do the work. Its value is that a different model family makes different mistakes, catching errors a same-family retry would repeat.

| Use | Gate |
|---|---|
| Ensemble review / second opinion — `jj-superpowers:brainstorming` step 9, `jj-superpowers:hypothesis-driven-improvement` | On by default when available; no permission needed. Skip silently if unavailable. |
| Doing the work — implementation, capability offload | Off-label; ask the user. |

Detection: the codex MCP tool (`mcp__codex__codex`); the `gemini` and `opencode` CLIs if installed. Suggested review configuration: `gpt-6.1-sol` at `high`.

Codex is often cheaper than maxing out Opus, but the gate is about role, not cost — lower price isn't a reason to hand it the implementation.

## Subagents Don't Delegate

The orchestrator owns all delegation. A subagent must not invoke another agent harness through any channel — neither the shell (`claude`, `codex`, `opencode`) nor MCP tools (e.g. `mcp__codex__codex`). Having the tool in your list isn't permission to use it. If a subagent needs another model, role, or broader context, it reports `NEEDS_CONTEXT` or `BLOCKED` and the orchestrator decides.

## Common Mistakes

- Retrying a failure at higher effort on the same model — effort can't lift a ceiling; change class or fix the task.
- Treating sonnet as automatically cheaper — count steps and retries, not price per token.
- Upgrading because the wanted model is unavailable — degrade down and say so.
