# Skill Conventions

## File format

Each skill lives in `skills/<skill-name>/SKILL.md`. The file begins with YAML frontmatter:

```markdown
---
name: skill-name
description: One-line description used to decide relevance in future conversations. Be specific.
---

# Title

...content...
```

The `description` field is critical — it is the text shown in the skill list and used by agents to decide whether to invoke the skill. It must be specific enough to trigger on the right scenarios.

## Skill invocation

Skills are invoked by agents using the `Skill` tool (Claude Code) or equivalent. The skill name used in invocations is the `name` frontmatter field, prefixed with the plugin namespace: `superpowers:<name>`.

For example, `superpowers:wish-i-knew` invokes `skills/wish-i-knew/SKILL.md`.

## Writing style

- Skills are instructions to the agent, written in imperative second-person ("Get the timestamp", "Write the file").
- Use `##` for major sections, `###` for sub-sections.
- Code blocks show exact commands and file content.
- The skill should be self-contained — the agent should not need to read other files to follow it.

## Output directories

The wish systems write to subdirectories under `docs/superpowers/`:
- `docs/superpowers/wishiknew/` — wish-i-knew entries
- `docs/superpowers/wishihad/` — wish-i-had entries
- `docs/superpowers/docwishlist/` — doc-wishlist entries

These directories do not need to be pre-created; agents create them when writing the first entry using the Write tool (which creates parent directories automatically in Claude Code).
