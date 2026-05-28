# `AGENTS.md` Template (repo root)

The root `AGENTS.md` is a one-screen pointer, not a documentation site. Target ~15 lines.

```markdown
# Agent Notes

Project layout, conventions, and skill registry live in `.agents/layout.yaml`.
Skills load on their own triggers; this file does not enumerate them.

## Version control
Use jj, not git. See `.jj/`.

## Specs
Normative behavior lives under `docs/agent-specs/`. To author or amend, use the
`writing-specs` skill. Drift checks: `spec-drift-detector`.

## Project-specific skills
Located under `.agents/skills/`. See `layout.yaml` `project_skills.root`.

## Conventions not covered by layout.yaml
- (List 1–3 things only if they truly don't fit the manifest. Otherwise leave blank.)
```

## Rules
- MUST NOT restate `layout.yaml` content.
- MUST NOT list project skills inline; skills carry their own triggers in frontmatter.
- MAY add a "Conventions" section ONLY for items that don't fit any structured field of `layout.yaml`.
- If this file grows past ~30 lines, either fold content into `layout.yaml` or into a project-specific skill.

## When a subsystem grows its own `AGENTS.md`

Add `<subsystem>/AGENTS.md` only when the subsystem has a meaningfully different convention from the root. Inherit; don't restate.

```markdown
# Agent Notes — js/projx_frontend

Inherits root `AGENTS.md`. Overrides below.

## Local layout
See `js/projx_frontend/.agents/layout.yaml` (subsystem manifest).

## Frontend-specific
Use the `projx-frontend` skill for component conventions.
```
