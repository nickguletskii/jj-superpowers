# Model Reference

Volatile facts: which models exist, which class each belongs to, and which are rationed. **When models change, only this file changes.** The decision procedure lives in `SKILL.md`.

This file deliberately carries no benchmark numbers: published comparisons for the current generation disagree with each other and go stale within weeks. Judge cost and capability from the task outcomes you observe.

## Effort Levels

`low` · `medium` · `high` · `xhigh` · `max` on every model below. Claude models default to `medium`.

## Classes

A **class** is a tier *within a family*, not a parity claim across families.

| Class | Claude Code | Codex (via MCP) |
|---|---|---|
| fast | `claude-sonnet-5-5` | GPT-6.1 Luna |
| standard | `claude-opus-5-5` | GPT-6.1 Terra |
| frontier | `claude-fable-5-1` — **rationed** | GPT-6.1 Sol |

`claude-haiku-4-5` exists but is not a dispatch target for this workflow; use `claude-sonnet-5-5` at `low` for mechanical work.

## Availability

- **`claude-fable-5-1` is rationed** and often unavailable. The provenance rule in `SKILL.md` governs it.
- **Any model may be unavailable at any time.** Degrade to the nearest available option, announce the substitution, never substitute upward without permission.
