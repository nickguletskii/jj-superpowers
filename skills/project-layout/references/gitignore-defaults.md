# `.gitignore` Defaults

Propose at bootstrap; confirm with user before adding. Never silently overwrite an existing `.gitignore` entry.

```gitignore
# Agent infrastructure (ephemeral) — proposed by project-layout
.agents/blog/                              # only when agent_blog.enabled
.agents/handoffs/                          # only when handoffs.committed: false (default)
docs/agent-specs/drift-reports/            # drift-detector ephemeral output
```

## Rules
- Default to ignoring blogs and drift-reports.
- Default to ignoring handoffs unless `layout.yaml` says `handoffs.committed: true`.
- Specs, glossary, invariants, tech-debt queues, and project skills are committed by default.
- If a path was already tracked, ignoring it requires either `git rm --cached`/`jj forget` or leaving it tracked. Ask the user.

## Anti-additions

Do NOT ignore:
- `.agents/layout.yaml` — core manifest, must be in VCS.
- `.agents/tech-debt/` — shared queue (per-entry files under `<queue>/<date>/`), must be in VCS so other agents/devs see it.
- `.agents/skills/` — project-specific skills, must be in VCS.
- `docs/agent-specs/` (excluding the drift-reports/ subdir) — specs are first-class project artifacts.
