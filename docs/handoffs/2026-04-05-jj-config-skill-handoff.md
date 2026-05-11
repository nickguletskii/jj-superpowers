# Handoff: jj Config Skill

## Goal

Create a new skill for configuring `jj` aliases, revset aliases, template aliases, and related config for the jj-superpowers workflow.

The skill should write config to:

`<PLATFORM_SPECIFIC>/jj/conf.d/jj-superpowers.toml`

## User Intent

- Reduce agent burden around repetitive `jj` command composition.
- Start with a skill that installs workflow-friendly `jj` configuration rather than wrapper scripts.
- Keep the focus on Claude Code and Codex as primary targets.
- Do not spend further effort on branding analysis beyond the already-completed cleanup.

## Relevant Existing Context

### Existing skills to integrate with

- `skills/jujutsu/SKILL.md`
- `skills/jj-agentic-dev/SKILL.md`
- `skills/using-jj-worksets/SKILL.md`
- `skills/jj-hunk/SKILL.md`
- `skills/jj-split-parallel/SKILL.md`

### Existing reference material

- `skills/jujutsu/references/revsets.md`
- JJ config docs the user linked: <https://docs.jj-vcs.dev/latest/config/#aliases>

### Existing platform/path conventions

- Codex docs already use platform-specific install locations under `~/.codex/...`
- No existing skill currently covers `jj` config installation
- No existing repo-wide convention was found for `<PLATFORM_SPECIFIC>/jj/conf.d/jj-superpowers.toml`; this needs to be defined explicitly in the design

## Design Constraints

- This is a **new skill**, so `brainstorming` and `writing-skills` both apply.
- Per `brainstorming`, do not implement the skill before presenting and approving a design.
- Per `writing-skills`, treat this as TDD-for-skills work, not just documentation writing.
- The output path should be parameterized by platform, not hardcoded to one agent.
- The skill should likely be installation-oriented, not a general jj reference duplicate.

## Important Open Question

The main unresolved design decision is:

Which platforms should the skill explicitly support for `<PLATFORM_SPECIFIC>`?

Examples:
- Codex only
- Claude Code and Codex
- Claude Code, Codex, OpenCode, Copilot

The user was asked this, but then redirected to creating this handoff document instead of answering.

## Suggested Next Steps

1. Resume with `brainstorming`.
2. Ask the unresolved platform-scope question.
3. Propose 2-3 approaches for the skill:
   - minimal install skill that writes one TOML file
   - install + verify skill
   - install + opinionated alias set + optional merge behavior
4. Inventory the API/abstraction boundary:
   - skill inputs
   - platform-specific path mapping
   - config sections to manage (`[aliases]`, `[revset-aliases]`, `[template-aliases]`, maybe `[templates]`)
   - overwrite vs merge behavior
5. Present design and get approval.
6. Only then write the skill and any supporting files.

## Candidate Skill Shape

Likely skill name candidates:

- `configuring-jj-for-superpowers`
- `installing-jj-superpowers-config`

The description should be trigger-only, not workflow-summary-heavy.

Probable responsibilities:

- detect platform-specific config root
- create `jj/conf.d` if missing
- write `jj-superpowers.toml`
- optionally verify with `jj config list` or equivalent readback
- document how local overrides should coexist with this file

## Related Completed Work In This Session

A separate worker normalized user-facing `superpowers` vs `jj-superpowers` branding in:

- `.codex/INSTALL.md`
- `.copilot-plugin/INSTALL.md`
- `.opencode/INSTALL.md`
- `docs/README.codex.md`
- `docs/README.opencode.md`
- `docs/testing.md`

That branding work is done and should not be revisited unless it blocks the new skill.
