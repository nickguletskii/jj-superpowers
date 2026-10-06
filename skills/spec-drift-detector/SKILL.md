---
name: spec-drift-detector
description: Use when checking a change for structural drift between specs, `layout.yaml`, code-as-spec modules, mdbook citations, and tech-debt queues — frontmatter, IDs, orphan references, queues. Invoked on demand ("check for drift", "find orphan references", "review tech-debt queues") or by the orchestrator at the SDD Finish step.
---

# Spec Drift Detector

An on-demand auditor. Walks the project to find divergence between artifacts that should agree. Reports; doesn't fix code/specs/mdbook. The only state it changes is bookkeeping (queue lifecycle, ephemeral retention).

**Subagent-friendly.** Runs as a subagent dispatched by the user or by the orchestrator at the SDD Finish step. Keep its work bounded and its report concise.

**Structural, not conformance.** This skill checks that artifacts agree with each other (frontmatter, indices, IDs, references, citations, queues). It does not judge whether code satisfies a requirement or whether a requirement duplicates the code — a per-spec conformance audit is a separate, on-demand job.

## When to use

- On demand: "check for drift", "find orphan references", "review tech-debt queues".
- At the SDD Finish step, dispatched by the orchestrator over the branch diff.
- Periodically for `--full-audit` maintenance (rare; not per-change).

**Not for:**
- Fixing drift — this skill reports. Routing fixes goes through `writing-specs` (specs/code-as-spec) or the agent (code/mdbook).
- Authoring or amending specs → `writing-specs`.
- Requirement ↔ code conformance — separate on-demand audit.

## Modes

### Default: diff-scoped
Loads only what the current diff touches. Cheap; suitable for per-change runs.

- **Always-load**: `layout.yaml`; for each spec the diff intersects (discovered via `code_map`), its `SPEC.yaml` frontmatter + `requirements:` list; tech-debt entries (per-entry files under the queue directories) filtered to touched paths. When a loaded spec has a `sub_specs:` list, also load those sub-spec `SPEC.yaml` files (frontmatter + requirements list). Sub-spec hits also load the parent (parent rule in `writing-specs` → "Sub-spec authoring").
- **On-demand**: full `SPEC.yaml` prose sections only when investigating a specific suspected drift.

Diff-scoped mode inherits `code_map`'s blind spot for stale entries — see "Conflict rules" in `project-layout/references/manifest-schema.md`; `--full-audit` is the backstop.

### `--full-audit` (opt-in)
Periodic maintenance. Loads more, and is the authoritative reconciler for `code_map` ↔ frontmatter drift.

- **Always-load**: `layout.yaml`, all spec frontmatter (small — just YAML headers), all `SPEC.yaml` files (frontmatter + requirements list), all tech-debt entry files across the queue directories. For each loaded spec with `sub_specs:`, load all sub-spec `SPEC.yaml` files (frontmatter + requirements list).
- **On-demand**: full `SPEC.yaml` prose sections only when investigating.
- **MAY be partitioned** by subsystem on large monorepos — audit one subsystem manifest at a time.
- **Frontmatter walk is the backstop**: scans every spec's frontmatter `owns:`/`code_spec:` to compare against `layout.yaml` indices. Any divergence (paths in frontmatter but missing from `code_map`, vice versa) is reported as a `mismatch`.

Even in `--full-audit`, **never bulk-read SPEC.yaml prose sections** (purpose, actors_and_surfaces, state_and_lifecycle, scaling_assumptions, out_of_scope). Use the structured `requirements:` list in SPEC.yaml and frontmatter grep.

## What it checks

For each category, write findings to the report. Don't act except for the explicit maintenance writes (below).

### 1. Frontmatter ↔ index consistency
- **Diff-scoped**: for each spec loaded via `code_map`, compare its frontmatter `owns:`/`code_spec:` against `layout.yaml`'s corresponding entry. Spec frontmatter is canonical. Report disagreements.
- **`--full-audit`**: walk every spec's frontmatter and compare against `layout.yaml`. Reports paths in frontmatter that `code_map` omits, paths in `code_map` that no frontmatter claims, and `spec_code.modules` ↔ `code_spec:` disagreements.
- Co-ownership and unmapped files are not findings (see "Conflict rules" in `project-layout/references/manifest-schema.md`).

**Sub-spec consistency check (three parts) — runs for any parent spec that is loaded in the current mode:**
1. **List ↔ directories:** for each parent spec with `sub_specs:`, verify every listed leaf name has a corresponding subdirectory with a `SPEC.yaml`. Report any entry with no directory, and any directory with a `SPEC.yaml` that is absent from the parent's `sub_specs:` list. (directory scan applies to the specific parent loaded; does not require walking all parent specs)
2. **`parent:` ↔ directory:** each sub-spec's `parent:` field MUST equal the parent directory name. Report mismatches.
3. **`id` ↔ path:** each sub-spec's `id` MUST equal `{parent}/{leaf-directory-name}`. Report mismatches (severity: `mismatch`).

**Duplicate REQ-/INV- ID check:** each REQ-/INV- ID MUST appear in exactly one `SPEC.yaml` file. If the same ID appears in a parent and a child, or in two siblings, report as `mismatch`. This catches incomplete migrations where a requirement was copied but not removed from the parent. Runs in both modes, scoped to loaded specs in diff-scoped mode and corpus-wide in `--full-audit`.
- **Do NOT report "orphan code"** (code paths outside any `owns:`). The only exception: **`spec_code.modules` paths** are exhaustive — if a public item in a registered code-as-spec module is not referenced by any spec's `code_spec:` or REQ-ID, report that as `mismatch`.

### 2. mdbook citations
- Walk mdbook `.md` files for `REQ-`/`INV-` ID citations (or the project's `citation_format` from `layout.yaml`).
- For each citation: verify the ID exists in some `SPEC.yaml` (in the `requirements:` list).
- If mdbook restates a value next to the citation (e.g., "Maximum 2 GB (REQ-VID-001)"), compare against the spec's stated value. Flag mismatches.

### 3. Code-as-spec module hygiene
For each module in `spec_code.modules`:
- Verify the module contains only API surface (signatures, types, enums, constants). Flag implementation bodies in spec-code modules as a finding.
- Verify every public item has RFC2119-grade docs in the native format. Items missing docs → finding (severity: `mismatch`).
- Verify any `REQ-`/`INV-` ID referenced in a doc comment resolves in `SPEC.yaml` (in the `requirements:` list).
- In diff-scoped mode, verify a public-surface change in the diff honors the three-artifact rule (`writing-specs` → "Code-as-spec module changes").

### 4. Orphan references (deletion check)
**Mode-scoped**:
- **Diff-scoped**: only check references for the IDs/paths that were deleted or renamed in the current diff (targeted grep). Other orphans elsewhere in the corpus are NOT detected in this mode.
- **`--full-audit`**: walk every spec frontmatter `references:` block; check every reference for existence.

In both modes, check that each reference resolves:
- Each slug in `references.capabilities[]` / `references.planes[]` resolves to `<partition>/<slug>/SPEC.yaml` (a `parent/leaf` slug is just a two-segment path).
- For each glossary term referenced — does the entry exist in `glossary.md`?
- For each invariant ID referenced — does it exist in `invariants.md`?
- For each `code_spec:` path — does the file exist?
- For each mdbook chapter linked in `references:` — does the file exist?

Report each orphan. Do not auto-fix.

### 5. Excluded-paths sanity
- Read `excluded_paths:`. Compare against version history (where available). If it has grown substantially or now covers application code, flag it.

## Maintenance writes (the explicit exceptions to "reports only")

Two — and only two — categories of state change are authorized. Both touch agent-infrastructure only; never specs, code, or mdbook.

### Queue janitoring
Each queue is a directory of per-entry files (`<queue>/<YYYY-MM-DD>/<HHMMSS>-<slug>.md`). For each entry file across configured queues:
- Re-check each `locations:` reference. If the file is gone or the code at the cited range no longer matches, the entry is resolved or abandoned: **delete the entry file** (VCS history is the audit trail — there is no `status:` field or retention sweep for queue entries).
- Leave entries that remain open and still apply untouched (entry files are write-once; janitoring only deletes).
- **Legacy queues**: if a queue is still a single `.md` file (schema v1), do not migrate it; report "needs migration → project-layout" and skip janitoring that queue.

### Ephemeral-artifact retention
Per `layout.yaml`:
- Delete files under `agent_blog.path` older than `agent_blog.retention`.
- Delete files under `handoffs.path` older than `handoffs.retention`.
- Delete `drift-reports/` files older than 30d (or project override).

Both maintenance categories run only when explicitly invoked or as part of a `--full-audit`. Diff-scoped runs do NOT prune.

## The report

Write to `docs/agent-specs/drift-reports/<YYYY-MM-DD>/<HHMM>-<scope>.md` (gitignored). Concise; one section per category. Each finding:

```markdown
### F-001 — [mismatch] video-upload references missing plane `audit-log`
**Category**: orphan references
**Spec**: capabilities/video-upload (`references.planes: [audit-log]`)
**Observation**: `planes/audit-log/SPEC.yaml` does not exist (deleted in this diff).
**Suggested route**: writing-specs to drop or retarget the reference.
```

End the report with a counts summary: `N findings (M mismatch, K suspect), J orphans, P queue entries deleted, R queues needing migration, Q ephemerals pruned`.

## What this skill does NOT do

- Edit specs, code, mdbook, or `layout.yaml`.
- Open issues in external trackers.
- Run tests, builds, or linters.
- Judge requirement ↔ code conformance or re-author requirements based on what the code does (the spec is canonical until amended by `writing-specs`).

## Anti-patterns

- **Bulk-reading SPEC.yaml prose sections (purpose, actors_and_surfaces, etc.).** Use the structured `requirements:` list in SPEC.yaml for indexing; load full SPEC.yaml only when investigating a specific finding.
- **Auto-fixing findings.** Report only. Routing to fixes is the agent/user's decision.
- **Running `--full-audit` on every change.** Wastes context and time. Use diff-scoped by default; `--full-audit` is for periodic maintenance.
- **Skipping orphan-reference reporting because "nothing's broken yet".** Orphans rot quietly; flag them when found.
- **Treating `sub_specs:` list ↔ directories mismatch as a minor finding.** It indicates an incomplete migration or a stale manifest — report as `mismatch`, not `suspect`.
