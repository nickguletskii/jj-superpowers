# Model Reference

Volatile facts: which models exist, which class each belongs to, and which are rationed. **When models change, only this file changes.** The decision procedure lives in `SKILL.md`.

This file deliberately carries no benchmark numbers: published comparisons for the current generation disagree with each other and go stale within weeks. Judge cost and capability from the task outcomes you observe.

## Effort Levels

`low` · `medium` · `high` · `xhigh` · `max` on every model below. Claude models default to `medium`.

## Classes

A **class** is a tier *within a family*, not a parity claim across families.

| Class | Claude Code | Codex (via MCP) |
|---|---|---|
| fast | `claude-haiku-5-5` | `gpt-6.1-luna` medium effort |
| standard | `claude-sonnet-5-5` medium effort | `gpt-6.1-sol` low effort |
| default | `claude-opus-5-5` low effort | `gpt-6.1-sol` low effort |
| frontier | `claude-opus-5-5` at `high`+, only after `medium` hit a wall | `gpt-6.1-sol` |

## Availability

- **Any model may be unavailable at any time.** Degrade to the nearest available option, announce the substitution, never substitute upward without permission.
