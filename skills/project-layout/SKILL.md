---
name: project-layout
description: Use when bootstrapping or auditing a project's agent-discoverable layout — `.agents/layout.yaml`, a short `AGENTS.md`, spec directories, tech-debt queues, project skills (`.agents/skills/<name>/`) — or when a project you're about to work in has no `.agents/layout.yaml`. Triggers on "set up agent layout", "add a project skill", "fix AGENTS.md".
---

# Project Layout

`.agents/layout.yaml` is the per-project hub that the other skills read. Specs, queues, blogs, and project skills all hang off it. Use this skill to create or audit it, to move layout detail out of a long `AGENTS.md`, to register project skills, and to add nested `AGENTS.md` files. Spec authoring belongs to `writing-specs`, drift audits to `spec-drift-detector`, and general docs to `documentation`.

## Bootstrap loop

Assume the project is brownfield. Bootstrapping is a conversation that repeats steps 3–7 until it's done, not a one-shot scaffold.

1. **Scan** (read-only): existing `AGENTS.md`, `docs/`, top-level dirs, language manifests, build system. List the candidate subsystems, meaning anything that looks independent (a service, a top-level crate, a frontend app, a CLI). Step 7 checks coverage against this list.
2. **Propose** a starting `layout.yaml` with `capabilities`, `planes`, `code_map`, and `spec_code`. Name what's obvious and leave the rest to the user. If a subsystem has 5 or more sub-areas with distinct code paths, propose sub-spec directories upfront and confirm them with the user. That's a structural hint for bootstrap time; the 15+ requirement trigger in `writing-specs` applies later, once requirements are being written.
3. **Ask** with the question tool: which mdbook sections are needed (users / developers / operators / contributors, possibly none), spec partition tweaks, glossary seeds, `external_tracker`, whether `agent_blog` is on, and whether handoffs are committed (default no). `references/brownfield-checklist.md` has the full question list.
4. **Refine** `layout.yaml` from the answers. Set `schema_version: 2`. Keep `excluded_paths` short: generated files, vendored code, build output.
5. **Write**:
   - `.agents/layout.yaml` (schema in `references/manifest-schema.md`). Don't invent fields; propose a schema change first if you need one.
   - Root `AGENTS.md`, about 15 lines (`references/agents-md-template.md`). Don't silently overwrite an existing `AGENTS.md` or `.gitignore`.
   - `docs/agent-specs/{capabilities,planes}/`, plus `glossary.md` and `invariants.md` stubs only if the user wants them, plus `SPEC.yaml` stubs for any sub-spec split agreed in step 2.
   - `.agents/tech-debt/{docs,code,tests,perf}/` (just `docs/` if the user wants a minimal setup). There's one directory per queue and one file per entry. Add a `.gitkeep` so the required `docs/` directory is tracked.
   - `.gitignore` additions (`references/gitignore-defaults.md`). Ask before ignoring paths that are currently tracked.
   - The mdbook scaffold, if the user opted in, and the `.agents/scripts/find-references` helper (`references/find-references-script.md`).
6. **Triage existing docs.** Leave unrelated docs alone (LICENSE, diagrams). Hand normative prose to `writing-specs`, and don't auto-convert it. For outdated docs, queue a rewrite at `.agents/tech-debt/docs/<YYYY-MM-DD>/<HHMMSS>-<slug>.md`. Never generate specs from code or prose here: this skill triages and queues, and `writing-specs` authors.

   **Legacy queues.** If the manifest has `schema_version: 1`, or the queues are single `.md` files, convert them with the migration recipe in `references/manifest-schema.md`: split them into per-entry files, drop `status:`/`last_verified:`, delete the old `<queue>.md`, and bump `schema_version` to 2. That recipe is the only migration path, and `spec-drift-detector` sends legacy queues here.

   **Legacy `DOCS.md`.** If a root `DOCS.md` exists, move its doc locations, naming, and diagram format into the `docs:` section of `layout.yaml`, move any remaining prose into `AGENTS.md` or the docs it describes, and delete `DOCS.md`.
7. **Termination.** You're done when both of these hold:
   - Every candidate subsystem is classified as either **capability/plane-bearing** (in `code_map`, has a draft `SPEC.yaml` stub, or has a `tech-debt/docs/` entry deferring the spec) or **infrastructure** (build glue, internal libraries, tooling, test scaffolding). Infrastructure needs no spec or queue entry, but the user has to confirm that classification.
   - The user confirms the overall structure.

   If the user confirms but some subsystems are still unclassified, list them and ask how to classify each one. Don't accept the structure silently.

## Registering project-specific skills

Use this for code-style guides and similar skills (the `projx-frontend` pattern):

1. Confirm the skill is project-level, covering this codebase's libraries, patterns, and anti-patterns, rather than global.
2. Check the triggers. They should be specific enough that the skill loads only when relevant. Qualify generic terms like "React" or "Rust" with a location ("React component in `js/foo/`"). A broad description pulls the skill into every session.
3. Put it at `.agents/skills/<name>/SKILL.md` (per `project_skills.root`).
4. Leave the body content to `writing-skills`. This skill only handles registration and placement.

## Nested AGENTS.md

When a subsystem has its own specs and skills, add a nested `AGENTS.md` (e.g. `js/projx_frontend/AGENTS.md`) that points to its specs and lists its skills. It inherits the root `AGENTS.md` and `layout.yaml`, states only what differs, and stays as short as the root.

## End of a work session

- If `handoffs.enabled` is set and the work is incomplete, blocked, or paused, write `<handoffs.path>/<YYYY-MM-DD>/<HHMM>-<topic>.md` covering what was done, what remains, the blocker, and where to resume.
- If `agent_blog.enabled` is set, write `<agent_blog.path>/<YYYY-MM-DD>/<HHMM>-<topic>.md`, about 10–30 lines on what happened and what you learned.

Skip both when they're disabled. `spec-drift-detector` handles retention.
