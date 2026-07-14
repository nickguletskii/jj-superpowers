---
name: choosing-model-and-effort
description: Use when choosing which model or reasoning effort to dispatch a subagent with, when a task failed and you are tempted to retry with a stronger model or higher effort (xhigh, max), when a model is unavailable or rationed, or when considering an external harness (Codex MCP, gemini, opencode) for a second opinion or ensemble review.
---

# Choosing Model and Effort

## Overview

**Model sets the ceiling. Effort sets how close you get to it — with sharply diminishing returns.**

More effort cannot lift a model past its ceiling. So when a task keeps failing, the lever is almost never "same model, more effort."

**Pick the cheapest configuration that clears the task's bar.** This skill exists to make dispatch cheaper and better targeted. It is *not* a licence to reach for bigger models.

Concrete models, effort ranges, availability, and the cost/capability data live in `models.md`. This file is the decision procedure and changes rarely; `models.md` carries the volatile facts.

## The Two Axes

- **Axis 1 — model**, chosen by the task's complexity and subtlety.
- **Axis 2 — effort**, chosen by how much headroom you need *within* that model.

These are different levers with different curves. Conflating them is the most common and most expensive mistake this skill exists to prevent.

## Dispatch Table (Claude Code)

| Task shape | Model | Effort |
|---|---|---|
| Easy, well-specified, mechanical; named files and APIs | `claude-sonnet-5` | low |
| Standard implementation | `claude-opus-4.8` | medium |
| Subtle, cross-file, integration, ambiguous failure | `claude-opus-4.8` | high |
| Design judgment, graph repair, code-quality review | `claude-opus-4.8` | high–xhigh |
| Hardest reasoning | `claude-fable-5` | low–high — **provenance rule below** |

**Sonnet's only defensible rung is `low`.** The moment you want Sonnet at `medium`, dispatch `claude-opus-4.8[low]` instead — on *both* benchmarks in `models.md` it is cheaper **and** better. Sonnet is cheap per token but flails: it burns 2–5× the steps, so per-task cost catches up while the score does not.

## The Fable Provenance Rule

**Dispatch `claude-fable-5` only if the orchestrator is already running `claude-fable-5`.**

- **Orchestrator is not Fable → never dispatch Fable.** No matter how hard the task looks. This is not negotiable and no task difficulty overrides it.
- **Orchestrator is Fable →** it may dispatch Fable implementers and verifiers, but **most tasks still go to sonnet/opus.** Fable is rationed — spend it on judgment, not bulk work.

This is a **provenance** rule, not a capability rule. Fable's benchmark strength is irrelevant if you are not permitted to spend it.

## Escalation

**Never retry the same `(model, effort)` unchanged.** Change the instructions, the context, the task shape, or the configuration.

| Situation | Action |
|---|---|
| **Speculative** — "this looks hard, let me start bigger" | **Ask the user.** Not permitted on your own. |
| **Wall** — the task *actually failed* at the chosen model, with `N = 3` retries exhausted (the constant is defined in `jj-superpowers:using-superpowers`) | **Earned.** Take exactly one step up without asking. |
| Anything beyond one step, or leaving the harness | **Ask the user.** |

A wall is **empirical**: the cheap option was *disproven*, not merely doubted. "It looks hard" is not a wall.

**Escalate class before effort.** `opus[max]` costs 2–6× `opus[medium]` and is still only matched by `fable[low]` (see `models.md`). If medium → high did not help, higher will not.

**Check the task before spending anything.** A task that fails at `opus[high]` is far more often *underspecified* than *under-powered*. Re-read it. A sharper task file is cheaper than a bigger model and fixes the actual problem.

## Availability

Models can be unavailable — `claude-fable-5` especially, since it is rationed.

- Wanted model unavailable → **degrade to the nearest available option and say so.**
- **Never substitute silently.** A silent downgrade on a hard task is indistinguishable from a genuine failure later, and you will misdiagnose it.
- **Never substitute upward** to a costlier model without permission — an unavailable model is not a wall.

## External Harnesses (Codex MCP)

**Codex is a reviewer, not a place to do the work.** Its value is that a *different model family makes different mistakes* — it catches errors that a same-family retry would simply repeat. That is a thing no amount of Claude-side escalation can buy.

| Use | Gate |
|---|---|
| **Ensemble review / second opinion** — `jj-superpowers:brainstorming` step 9, `jj-superpowers:hypothesis-driven-improvement` | **Default-on when available.** No permission needed. Skip silently if unavailable. |
| **Doing the work** — implementation, capability offload | **Off-label. Ask the user.** |

Detection: the codex MCP tool (`mcp__codex__codex`); the `gemini` and `opencode` CLIs if installed.

Suggested review configuration: `gpt-5.6-sol[high]` — near-top score at low cost on both benchmarks.

**Codex is often *cheaper* than maxing out Opus.** Do not let that tempt you past the gate. **The gate is about role, not cost.** "It would save money" is not a reason to hand Codex the implementation.

## Subagents Never Delegate

**The orchestrator owns all delegation.**

A subagent must not invoke another agent harness **through any channel** — not the shell (`claude`, `codex`, `gemini`, `opencode`, Copilot CLI) and **not MCP tools** (e.g. `mcp__codex__codex`).

**Having the tool in your list is not permission to use it.** If a subagent needs another model, another role, or broader context, it reports `NEEDS_CONTEXT` or `BLOCKED` and the orchestrator decides.

## Common Mistakes

| Mistake | Reality |
|---|---|
| "It failed — retry at higher effort." | Effort cannot lift a ceiling. Change class, or fix the task. |
| "Sonnet is the cheap one." | Only at `low`. At `medium`+ Opus is cheaper **and** better. Sonnet flails — 2–5× the steps. |
| "This looks hard, start at max." | Speculative escalation. Ask first. |
| "Fable is strongest, so use Fable." | Provenance rule. If you are not Fable, you do not get Fable. |
| "Codex is cheaper, so use it for the work." | Codex is a reviewer. Off-label use asks. The gate is role, not cost. |
| "The MCP tool is in my tool list, so I may call it." | Subagents delegate through **no** channel. |
| "The benchmark says X, so X." | The two benchmarks in `models.md` disagree. Only cross-validated findings are rules. |
| "The model is unavailable, so I'll use a bigger one." | Unavailable is not a wall. Degrade down and say so. |
