# Skill Pseudocode

This directory mirrors each top-level `skills/*/SKILL.md` entry as TypeScript-flavored pseudocode, now split into one file per skill.

Conventions:
- `workflow(ctx)` models imperative control flow: loops, branching, retries, checkpoints.
- `guardrails` are predicate functions. `true` means the action is allowed or the invariant holds.
- `template` uses JSX-like composition for file formats, prompts, or structured outputs the skill asks the agent to produce.

Files:
- `_shared.tsx` - shared types, helper declarations, and pseudocode stub functions
- `catalog.tsx` - index that imports and re-exports all per-skill files
- `<skill>.tsx` - one pseudocode translation per top-level skill
