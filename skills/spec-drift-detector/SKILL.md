---
name: spec-drift-detector
description: Use when checking for structural drift between specs, `layout.yaml`, code-as-spec modules, mdbook citations, and tech-debt queues — on demand ("check for drift", "find orphan references", "review tech-debt queues") or when the orchestrator dispatches it at the SDD Finish step.
---

# Spec Drift Detector

Audits whether artifacts that should agree still do: frontmatter, indices, IDs, references, citations, queues. It reports and does not fix specs, code, mdbook, or `layout.yaml`; the only state it changes is agent bookkeeping (see "Maintenance writes"). It usually runs as a subagent, so keep the work bounded and the report short.

It is structural, not a conformance check: it does not judge whether code satisfies a requirement or whether a requirement duplicates the code. That, and re-authoring requirements to match code, are out of scope — the spec stays canonical until `writing-specs` amends it. Route fixes to `writing-specs` (specs, code-as-spec) or the calling agent (code, mdbook). Don't open external issues or run tests, builds, or linters.

## Modes

**Diff-scoped (default).** Use per change. Load `layout.yaml`; for each spec the diff reaches via `code_map`, its frontmatter and `requirements:` list; listed `sub_specs:` and, for sub-specs, the parent (parent rule in `writing-specs`); and tech-debt entries filtered to touched paths. This mode inherits `code_map`'s blind spot for stale entries ("Conflict rules" in `project-layout/references/manifest-schema.md`); `--full-audit` is the backstop.

**`--full-audit` (opt-in).** Periodic maintenance, not per change. Load `layout.yaml`, every spec's frontmatter and `requirements:` list (including sub-specs), and every tech-debt entry. On a large monorepo you may audit one subsystem manifest at a time. This mode is the authoritative reconciler for `code_map` ↔ frontmatter drift.

In both modes, read `SPEC.yaml` prose sections (purpose, actors_and_surfaces, state_and_lifecycle, …) only while investigating a specific finding; bulk-reading them wastes the context this skill is designed to save.

## Checks

Severity is `mismatch` (definite disagreement) or `suspect` (needs a human look).

### 1. Frontmatter ↔ index

- Spec frontmatter `owns:`/`code_spec:` is canonical. Diff-scoped: compare each loaded spec against its `layout.yaml` entries. Full audit: walk all frontmatter and report paths `code_map` omits, `code_map` paths no frontmatter claims, and `spec_code.modules` ↔ `code_spec:` disagreements.
- Co-ownership and unmapped files are not findings. Don't report code outside every `owns:` as orphaned — except that `spec_code.modules` is exhaustive: a public item in a registered module that no `code_spec:` or REQ-ID references is a `mismatch`.
- For each loaded parent with `sub_specs:`: every listed leaf has a directory with a `SPEC.yaml` and every such directory is listed; each sub-spec's `parent:` equals the parent directory; each `id` equals `{parent}/{leaf}`. Report these as `mismatch` — they indicate an incomplete migration or stale manifest.
- Each REQ-/INV- ID appears in exactly one `SPEC.yaml` (scoped to loaded specs, or corpus-wide in a full audit). A duplicate between parent and child or between siblings is usually a requirement copied but not removed.

### 2. mdbook citations

Find `REQ-`/`INV-` citations in mdbook `.md` files (or the project's `citation_format`). Each must exist in some `requirements:` list. If the text restates a value beside a citation ("Maximum 2 GB (REQ-VID-001)"), compare it with the spec.

### 3. Code-as-spec module hygiene

For each `spec_code.modules` entry: it contains only API surface (implementation bodies are a finding); every public item has RFC 2119-grade docs in the native format (missing docs are a `mismatch`); every ID cited in a doc comment resolves. In diff-scoped mode, check that a public-surface change honors the three-artifact rule (`writing-specs` → "Code-as-spec module changes").

### 4. Orphan references

Diff-scoped: grep only for references to IDs and paths the diff deleted or renamed. Full audit: check every `references:` block. A reference resolves when the capability/plane slug has `<partition>/<slug>/SPEC.yaml` (a `parent/leaf` slug is a two-segment path), the glossary term is in `glossary.md`, the invariant is in `invariants.md`, and each `code_spec:` path and linked mdbook chapter exists. Report every orphan, even if nothing is visibly broken yet.

### 5. Excluded paths

Compare `excluded_paths:` with its history where available; flag it if it has grown substantially or now covers application code.

## Maintenance writes

These two kinds of write are the only ones allowed. Both touch agent infrastructure only, and they run only when explicitly requested or during `--full-audit` — never in a diff-scoped run.

**Queue janitoring.** Queues are directories of write-once entries at `<queue>/<YYYY-MM-DD>/<HHMMSS>-<slug>.md`. Re-check each entry's `locations:`; if the file is gone or the cited code no longer matches, delete the entry (VCS history is the audit trail; there is no `status:` field). Leave live entries untouched. A queue that is still a single `.md` file (schema v1) is reported as "needs migration → project-layout" and skipped.

**Ephemeral retention** (per `layout.yaml`): delete files under `agent_blog.path` and `handoffs.path` older than their `retention`, and `drift-reports/` files older than 30 days unless the project overrides it.

## Report

Write to `docs/agent-specs/drift-reports/<YYYY-MM-DD>/<HHMM>-<scope>.md` (gitignored), one section per category:

```markdown
### F-001 — [mismatch] video-upload references missing plane `audit-log`
**Category**: orphan references
**Spec**: capabilities/video-upload (`references.planes: [audit-log]`)
**Observation**: `planes/audit-log/SPEC.yaml` does not exist (deleted in this diff).
**Suggested route**: writing-specs to drop or retarget the reference.
```

End with counts: `N findings (M mismatch, K suspect), J orphans, P queue entries deleted, R queues needing migration, Q ephemerals pruned`.
