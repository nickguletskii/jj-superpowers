# File Structure Context

## Active Skill Files

Each skill lives in `skills/<skill-name>/SKILL.md`. Supporting prompt templates live beside the skill when needed.

Pseudocode summaries live in `pseudocode/<skill-name>.tsx`. They are not executable product code, but they should reflect each skill's current workflow closely enough to catch conceptual drift.

## Current Dirty Worktree

This plan is being written while earlier approved edits are already present in `@`:

- `README.md`
- `skills/brainstorming/SKILL.md`
- `skills/dispatching-parallel-agents/SKILL.md`
- `pseudocode/brainstorming.tsx`
- `pseudocode/dispatching-parallel-agents.tsx`
- `pseudocode/writing-plans.tsx`
- `docs/superpowers/specs/2026-05-07-skill-library-modernization-design.md`

Do not revert those changes. Work with the current file contents.

## Repo Hygiene

The tracked generated file to remove is:

- `skills/dot-to-jj-dag/tests/__pycache__/test_dot_to_jj_dag.cpython-314-pytest-9.0.2.pyc`

The root `.gitignore` currently exists and should be updated to ignore `__pycache__/` and `*.pyc` if those patterns are missing.
