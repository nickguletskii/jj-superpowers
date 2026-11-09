---
name: writing-skills
description: Use when creating new skills, editing existing skills, or verifying skills work before deployment
---

# Writing Skills

## Overview

A skill is tested process documentation. Before shipping a new skill or a meaningful edit, run a few realistic scenarios with and without it and confirm it changes behavior the way you intended. Without a baseline you can't tell whether the skill teaches anything the agent wasn't already doing.

**Official guidance:** [Anthropic skill authoring best practices](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices). Where this library differs:
- Descriptions state triggering conditions only ("Use when..."), never what the skill does or its workflow (see CSO below).
- New skills and meaningful edits get baseline and with-skill subagent runs before shipping (see Testing Skills).
- Cross-reference other skills by `jj-superpowers:<name>`, never by `@` path.
- Skill dirs ship whole: no test logs, scenarios, or packaging files inside (No-Ship Hygiene).

Personal skills live in `~/.claude/skills` (Claude Code) or `~/.agents/skills/` (Codex).

## What is a Skill?

A reusable reference for a proven technique (concrete steps), pattern (way of thinking), or reference (API/tool docs) — not a narrative about how you solved a problem once.

**Create one when** the technique wasn't obvious, applies across projects, and you'd reference it again.

**Don't create one for:**
- One-off solutions, or standard practices documented well elsewhere
- Project-specific conventions — put them in AGENTS.md, or register a project-specific skill under `.agents/skills/<name>/` via `jj-superpowers:project-layout` (which also enforces the anti-keyword-bloat trigger check)
- Mechanical constraints — if regex or validation can enforce it, automate it and save documentation for judgment calls

## File Organization

```
skills/
  skill-name/
    SKILL.md              # Main reference (required)
    supporting-file.*     # Only if needed
```

All skills share one flat namespace. Keep principles, concepts, and short code patterns inline. Use separate files only for heavy reference (100+ lines, e.g. API docs) or reusable tools (e.g. `systematic-debugging/find-polluter.sh`).

### No-Ship Hygiene

The installer symlinks the whole skill directory into every harness, so everything inside ships. A skill dir contains only `SKILL.md` plus the files it references. Keep out pressure-test scenarios and baseline logs, creation/handoff notes, and build/packaging files (`pyproject.toml`, lockfiles).

## SKILL.md Structure

**Frontmatter:** `name` and `description` are required (see [agentskills.io/specification](https://agentskills.io/specification) for other fields); max 1024 characters total. `name` uses lowercase letters, numbers, and hyphens only.

```markdown
---
name: skill-name-with-hyphens
description: Use when [specific triggering conditions and symptoms]
---

# Skill Name

## Overview          — core principle in 1-2 sentences
## When to Use       — symptoms and use cases; when NOT to use
## Core Pattern      — before/after comparison (techniques/patterns)
## Quick Reference   — table or bullets for scanning
## Implementation    — inline code, or link to a tool/heavy reference
## Common Mistakes   — observed failures + fixes
```

## Claude Search Optimization (CSO)

The description is what an agent reads to decide whether to load the skill. It should answer "should I read this right now?"

### Description = when to use, not what the skill does

Describe triggering conditions only; don't summarize the process. A description that summarizes workflow becomes a shortcut the agent follows *instead of* reading the skill: in testing, a description saying "code review between tasks" led agents to do one review even though the skill's flowchart required two. Removing the summary fixed it.

Start with "Use when...", write in third person (it is injected into the system prompt), and keep it under ~500 characters.

```yaml
# Bad: summarizes workflow — the agent may follow this instead of reading the skill
description: Use when executing plans - dispatches subagent per task with code review between tasks

# Bad: too abstract to trigger on
description: For async testing

# Bad: names a technology the skill isn't specific to
description: Use when tests use setTimeout/sleep and are flaky

# Good: triggering conditions only
description: Use when implementing any feature or bugfix, before writing implementation code

# Good: describes the problem, not language-specific symptoms
description: Use when tests have race conditions, timing dependencies, or pass/fail inconsistently
```

For discipline skills, include the moment just before the rule would be broken (e.g. "before writing implementation code").

### Keywords and naming

Use words an agent would search for: error messages ("ENOTEMPTY"), symptoms ("flaky", "hanging"), synonyms, and tool names.

Name by what you do or the core insight, verb-first; gerunds work well for processes: `condition-based-waiting` over `async-test-helpers`, `root-cause-tracing` over `debugging-techniques`.

### Token efficiency

Skills that load into every conversation cost tokens every time; keep those especially tight. Every skill should be as short as its content allows — check with `wc -w`.

- Point to `--help` instead of documenting every flag.
- Cross-reference another skill instead of restating it.
- Give one example per pattern; don't explain what a strong model already does.

### Cross-referencing

Use the skill name and say whether it's required: `**REQUIRED SUB-SKILL:** Use jj-superpowers:test-driven-development`. Don't write `@skills/.../SKILL.md` — `@` force-loads the file immediately and burns context before it's needed.

## Flowcharts

Use a small inline `dot` flowchart only for non-obvious decision points, loops where an agent might stop too early, or "A vs B" choices. Use tables or lists for reference material, markdown code blocks for code (code in a flowchart can't be copied), and numbered lists for linear steps. Node labels must be semantic, not `step1`.

See `graphviz-conventions.dot` for style rules. To render a skill's flowcharts to SVG for your human partner:

```bash
./render-graphs.ts ../some-skill           # Each diagram separately
./render-graphs.ts ../some-skill --combine # All diagrams in one SVG
```

## Code Examples

One excellent example beats several mediocre ones; a capable reader can port it.

Use the repo's main language; absent a signal, prefer Rust or TypeScript, whose types let the example *show* an invariant.

A good example is complete, runnable, drawn from a real scenario, and commented on *why* — not a template, contrived case, or war story.

## Testing Skills

Full method: `testing-skills-with-subagents.md` in this directory.

Before shipping:
1. Write 2–3 realistic scenarios, including at least one where the skill should **not** fire (or should apply lightly).
2. Run each with a subagent **without** the skill. Record what it actually did.
3. Write or edit the skill to address the failures you observed — not hypothetical ones.
4. Run the same scenarios **with** the skill. Fix what still fails and re-run; confirm the should-not-fire scenario stays light.

Match scenarios to the skill type:

| Skill type | Test with | Success looks like |
|---|---|---|
| Discipline (TDD, verification) | Realistic tasks with competing pressures (time, sunk cost) | Agent follows the practice where it applies and skips it where it doesn't |
| Technique | Application to a new case, edge-case variations | Agent applies the technique correctly |
| Pattern | Recognition, application, counter-examples | Agent knows when and when not to apply it |
| Reference | Retrieval and application, common-use-case gaps | Agent finds and uses the right information |

When an agent finds a gap, fix the wording that caused it. Prefer a clear rule with its reason over piling on prohibitions; heavy-handed emphasis makes current models over-apply rules in cases they shouldn't touch.

## Checklist

Track against this list, not the harness task tracker — testing dispatches subagents, and the harness task list doesn't survive subagent dispatch (see `jj-superpowers:using-superpowers`). When a change edits several skills, batch their scenarios into a few dispatches rather than one per file.

- [ ] Name: letters, numbers, hyphens only
- [ ] Description: "Use when...", third person, triggers/symptoms only, no workflow summary
- [ ] Search keywords present (errors, symptoms, tools)
- [ ] Addresses failures observed in baseline runs
- [ ] One good example, in the repo's language
- [ ] Baseline and with-skill runs on 2–3 scenarios, including one should-not-fire scenario
- [ ] Flowchart only if a decision is non-obvious
- [ ] Supporting files only for tools or heavy reference; nothing unshippable in the dir
