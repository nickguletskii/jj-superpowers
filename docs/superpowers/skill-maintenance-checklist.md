# Skill Maintenance Checklist

Use this checklist during skill-library maintenance passes. It is documentation only, not an executable validation script.

## Missing Skill References

- List current skills: `rg --files skills | rg '/SKILL\.md$' | sort`.
- Check README and docs references against skill directories: `rg -n 'skills/|`[a-z0-9-]+`|[a-z0-9-]+/SKILL\.md' README.md docs/superpowers`.
- Check pseudocode coverage: `rg --files pseudocode | sort`.
- Confirm every user-facing skill reference points to an existing `skills/*/SKILL.md` file or an intentionally external skill.
- Confirm `pseudocode/catalog.tsx` includes active skills that should appear in the visual catalog.

## Platform Wording

- Search generic skills for platform-only terms: `rg -n '\bTask\b|TodoWrite|/sandbox|Claude Code' skills/*/SKILL.md`.
- For each hit, either make the wording platform-neutral or move it under a clearly labeled platform-specific subsection.
- Confirm generic workflow instructions do not present Claude Code-only commands as universal agent behavior.

## Graph Workflow Parity

- Compare graph workflow skills: `rg -n 'project-network\.dot|verify|quality_review' skills/writing-plans skills/subagent-driven-development skills/executing-plans`.
- Compare pseudocode summaries: `rg -n 'project-network\.dot|verify|quality_review' pseudocode/writing-plans.tsx pseudocode/subagent-driven-development.tsx pseudocode/executing-plans.tsx`.
- Confirm all three skills preserve the graph gate order: `task -> spec_review -> verify -> quality_review -> final`.
- Confirm pseudocode does not omit required graph files, verification nodes, or quality-review nodes.

## Generated Files

- Check tracked Python bytecode: `jj file list --no-pager 'glob:**/__pycache__/**'` and `jj file list --no-pager 'glob:**/*.pyc'`.
- Check common generated artifacts before adding broad ignores: `jj file list --no-pager 'glob:**/{dist,build,target,node_modules}/**'`.
- Confirm `.gitignore` includes generated-file patterns such as `__pycache__/` and `*.pyc` when those artifact types appear.
- Remove tracked generated files instead of documenting them as expected source files.

## Frontmatter Trigger Quality

- Review skill descriptions: `rg -n '^description:|When to use|Triggers include' skills/*/SKILL.md`.
- Confirm frontmatter descriptions explain when to invoke the skill, not just what workflow steps it contains.
- Prefer trigger conditions, user intents, and observable task shapes over internal implementation summaries.
