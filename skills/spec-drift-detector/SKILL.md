---
name: spec-drift-detector
description: Use when auditing a project for drift between specs, code, code-as-spec modules, mdbook citations, and tech-debt queues. Runs in two modes — default diff-scoped (loads only specs intersecting the current diff) or `--full-audit` (opt-in, partitionable by subsystem). Reports findings only; the sole authorized state changes are queue janitoring and ephemeral-artifact retention pruning. Recommended in `finishing-a-development-branch` and on demand ("check for drift", "audit specs", "find orphan references").
---

# Spec Drift Detector

An on-demand auditor. Walks the project to find divergence between artifacts that should agree. Reports; doesn't fix code/specs/mdbook. The only state it changes is bookkeeping (queue lifecycle, ephemeral retention).

**Spec reference:** `docs/superpowers/specs/2026-05-28-agent-spec-ecosystem-design.md` §5.3, §10.4.

**Subagent-friendly.** This skill is designed to run as a subagent dispatched by `finishing-a-development-branch` or the user. Keep its work bounded and its report concise.

## When to use

- After implementation + verification on a development branch (called by `finishing-a-development-branch`).
- On demand: "check for drift", "audit specs", "find orphan references", "review tech-debt queues".
- Periodically for `--full-audit` maintenance (rare; not per-change).

**Not for:**
- Fixing drift — this skill reports. Routing fixes goes through `writing-specs` (specs/code-as-spec) or the agent (code/mdbook).
- Authoring or amending specs → `writing-specs`.

## Modes

### Default: diff-scoped
Loads only what the current diff touches. Cheap; suitable for per-change runs.

- **Always-load**: `layout.yaml`; for each spec the diff intersects (discovered via `code_map`), load its `SPEC.yaml` (for requirements index and frontmatter consistency check in section 1); tech-debt entries filtered to touched paths. When a loaded spec has a `sub_specs:` list, also load those sub-spec `SPEC.yaml` files (frontmatter + requirements list; prose only on demand — same rule as today). When a `code_map` hit returns a sub-spec slug (`<parent>/<leaf>`), load the sub-spec `SPEC.yaml` **and** the parent's `SPEC.yaml` (frontmatter + cross-cutting requirements). Parent-level requirements apply across all sub-specs.
- **On-demand**: full `SPEC.yaml` prose sections only when investigating a specific suspected drift.

**Important — diff-scoped mode is NOT a backstop for stale `code_map`.** Diff intersection is computed from `code_map`, not from a full frontmatter walk. If a spec's frontmatter `owns:` lists a path that `code_map` has lost or misroutes, diff-scoped mode will miss it the same way `spec-code-sync`'s precedence check would. `--full-audit` (below) is the only mode that walks spec frontmatter directly and therefore catches `code_map` staleness. Schedule `--full-audit` periodically (weekly, on a maintenance cadence, or before significant integration milestones) for projects where the backstop matters.

**Caveat — helper/shared file edits**: when a diff edits a file with no `owns:` entry (typical for shared helpers or internal libraries used by capability-bearing code), diff-scoped mode loads zero relevant specs and samples nothing. This is usually fine because helper edits typically co-change with caller edits that DO match `owns:`. When the diff edits *only* unmapped files and the change is non-trivial, the agent SHOULD invoke `--expand-importers` (below) instead, or fall back to `--full-audit` for a known-substantial helper change.

### `--expand-importers` (opt-in, layered on diff-scoped)
When invoked, for each touched file with no `owns:` entry, drift-detector greps the codebase for files that import or use it (language-aware: `use`/`import`/`require` statements) and includes the specs that own those importers in the diff-scoped load. Use sparingly — import-graph expansion is more expensive than the base diff-scoped run, and the import grep itself is approximate (heuristic, not a full static-analysis pass).

### `--full-audit` (opt-in)
Periodic maintenance. Loads more, and is the authoritative reconciler for `code_map` ↔ frontmatter drift.

- **Always-load**: `layout.yaml`, all spec frontmatter (small — just YAML headers), all `SPEC.yaml` files (frontmatter + requirements list), all tech-debt queues. For each loaded spec with `sub_specs:`, load all sub-spec `SPEC.yaml` files (frontmatter + requirements list).
- **On-demand**: full `SPEC.yaml` prose sections only when investigating.
- **MAY be partitioned** by subsystem on large monorepos — audit one subsystem manifest at a time.
- **Frontmatter walk is the backstop**: scans every spec's frontmatter `owns:`/`code_spec:` to compare against `layout.yaml` indices. Any divergence (paths in frontmatter but missing from `code_map`, vice versa) is reported as a `mismatch`.

Even in `--full-audit`, **never bulk-read SPEC.yaml prose sections** (purpose, actors_and_surfaces, state_and_lifecycle, scaling_assumptions, out_of_scope). Use the structured `requirements:` list in SPEC.yaml and frontmatter grep.

## What it checks

For each category, write findings to the report. Don't act except for the explicit maintenance writes (below).

### 1. Frontmatter ↔ index consistency
**Mode-scoped**: in diff-scoped mode, this check covers only the specs already loaded (those `code_map` flagged as diff-intersecting). It does NOT discover frontmatter owners that `code_map` has lost — that requires `--full-audit`.

SPEC.yaml replaces the former `requirements.yaml` + `SPEC.md` split. The structured `requirements:` list in SPEC.yaml is used for fast indexing; the frontmatter fields (`owns:`, `code_spec:`, `references:`, etc.) drive the consistency checks below.

- **Diff-scoped**: for each spec loaded via `code_map`, compare its frontmatter `owns:`/`code_spec:` against `layout.yaml`'s corresponding entry. Spec frontmatter is canonical (per §3.3). Report disagreements.
- **`--full-audit`**: walk every spec's frontmatter and compare against `layout.yaml`. Reports paths in frontmatter that `code_map` omits, paths in `code_map` that no frontmatter claims, and `spec_code.modules` ↔ `code_spec:` disagreements.
- Co-ownership across capabilities and planes is allowed (per §3.2). Do NOT flag overlap as a finding. Do flag *requirement-level contradictions* between co-owning specs (e.g., two REQs on the same path that demand incompatible behavior) as `mismatch`.

**Sub-spec consistency check (three parts) — runs for any parent spec that is loaded in the current mode:**
1. **List ↔ directories:** for each parent spec with `sub_specs:`, verify every listed leaf name has a corresponding subdirectory with a `SPEC.yaml`. Report any entry with no directory, and any directory with a `SPEC.yaml` that is absent from the parent's `sub_specs:` list. (directory scan applies to the specific parent loaded; does not require walking all parent specs)
2. **`parent:` ↔ directory:** each sub-spec's `parent:` field MUST equal the parent directory name. Report mismatches.
3. **`id` ↔ path:** each sub-spec's `id` MUST equal `{parent}/{leaf-directory-name}`. Report mismatches (severity: `mismatch`).

**Duplicate REQ-/INV- ID check:** each REQ-/INV- ID MUST appear in exactly one `SPEC.yaml` file. If the same ID appears in a parent and a child, or in two siblings, report as `mismatch`. This catches incomplete migrations where a requirement was copied but not removed from the parent. Runs in both modes, scoped to loaded specs in diff-scoped mode and corpus-wide in `--full-audit`.
- **Do NOT report "orphan code"** (code paths outside any `owns:`). `owns:` is a hint, not a coverage map (per §3.2); many files are technical/non-product (build glue, config, internal infrastructure libraries, shared helper crates/packages, test scaffolding) and are expected to lack spec mapping. The only exception: **`spec_code.modules` paths** are exhaustive — if a public item in a registered code-as-spec module is not referenced by any spec's `code_spec:` or REQ-ID, report that as `mismatch`.

### 2. Requirement ↔ code spot-check
- LLM judgement on small windows; not exhaustive.
- **Default sampling**:
  - 100 % of requirements whose `owns:` intersects the current diff.
  - For `--full-audit`: per-run cap of 30 requirements outside the diff (sample randomly across specs).
- For each sampled requirement, locate the relevant code window and judge: does the code observably satisfy the RFC2119 statement?
- Severity:
  - `mismatch` — clear contradiction.
  - `suspect` — likely conflict, low confidence.
  - `unverified` — couldn't check (couldn't locate code, ambiguous spec, etc.).

### 2b. Code-duplicating requirements (spec slop)
LLM judgement, same sampled requirements as check 2. For each sampled requirement, ask: **does this requirement add intent the owned code can't carry, or does it merely transcribe a signature/enum/constant the reader already sees in the code?** (writing-specs golden rule D.)
- A requirement whose text is a paraphrase of a visible constant, enum, type, or `if` check — adding no timing model, edge case, cross-system contract, or *why* — is `suspect` ("spec duplicates code").
- Do NOT flag a requirement just because a value also appears in code: the question is whether the requirement adds a non-obvious contract/guarantee. "Reject > 2 GiB so clients can rely on rejection independently of S3" adds intent; "max size is 2 GiB" alone duplicates the constant.
- Report as `suspect`; suggested route: `writing-specs` to cut or replace the requirement with the intricacy it was burying. Never auto-edit.

### 3. mdbook citations
- Walk mdbook `.md` files for `REQ-`/`INV-` ID citations (or the project's `citation_format` from `layout.yaml`).
- For each citation: verify the ID exists in some `SPEC.yaml` (in the `requirements:` list).
- If mdbook restates a value next to the citation (e.g., "Maximum 2 GB (REQ-VID-001)"), compare against the spec's stated value. Flag mismatches.

### 4. Code-as-spec module hygiene
For each module in `spec_code.modules`:
- Verify the module contains only API surface (signatures, types, enums, constants). Flag implementation bodies in spec-code modules as a finding.
- Verify every public item has RFC2119-grade docs in the native format. Items missing docs → finding (severity: `mismatch`).
- Verify any `REQ-`/`INV-` ID referenced in a doc comment resolves in `SPEC.yaml` (in the `requirements:` list).
- Verify `SPEC.yaml` is updated — requirements list and/or frontmatter — when a code-as-spec module's public surface changes.

### 5. Orphan references (deletion check — §10.4)
**Mode-scoped**:
- **Diff-scoped**: only check references for the IDs/paths that were deleted or renamed in the current diff (targeted grep). Other orphans elsewhere in the corpus are NOT detected in this mode.
- **`--full-audit`**: walk every spec frontmatter `references:` block; check every reference for existence.

In both modes, for each reference that does not resolve:
- For each capability slug in `references.capabilities[]`:
  - If the slug has no `/` (top-level): does `capabilities/<slug>/SPEC.yaml` exist?
  - If the slug has one `/` (sub-spec, `parent/leaf`): does `capabilities/<parent>/<leaf>/SPEC.yaml` exist?
  - Report missing files as orphan references.
- For each plane slug in `references.planes[]`:
  - If the slug has no `/`: does `planes/<slug>/SPEC.yaml` exist?
  - If the slug has one `/` (`parent/leaf`): does `planes/<parent>/<leaf>/SPEC.yaml` exist?
- For each glossary term referenced — does the entry exist in `glossary.md`?
- For each invariant ID referenced — does it exist in `invariants.md`?
- For each `code_spec:` path — does the file exist?
- For each mdbook chapter linked in `references:` — does the file exist?

Report each orphan. Do not auto-fix.

### 6. Excluded-paths sanity
- Read `excluded_paths:`. Compare against version history (where available). If it has grown substantially or now covers application code, flag it.

## Maintenance writes (the explicit exceptions to "reports only")

Two — and only two — categories of state change are authorized. Both touch agent-infrastructure only; never specs, code, or mdbook.

### Queue janitoring
For each tech-debt entry across configured queues:
- Re-check each `locations:` reference. If the file is gone or the code at the cited range no longer matches, mark `status: resolved` or `status: abandoned` with a short note.
- Prune entries whose `status: resolved`/`abandoned` is older than the retention policy (default 30d).
- Update `last_verified:` on entries that remain open and still apply.

### Ephemeral-artifact retention
Per `layout.yaml`:
- Delete files under `agent_blog.path` older than `agent_blog.retention`.
- Delete files under `handoffs.path` older than `handoffs.retention`.
- Delete `drift-reports/` files older than 30d (or project override).

Both maintenance categories run only when explicitly invoked or as part of a `--full-audit`. Diff-scoped runs do NOT prune.

## The report

Write to `docs/agent-specs/drift-reports/<YYYY-MM-DD>/<HHMM>-<scope>.md` (gitignored). Concise; one section per category. Each finding:

```markdown
### F-001 — [mismatch] REQ-VID-014 doesn't match handler.ts:142
**Category**: requirement ↔ code spot-check
**Spec**: capabilities/video-upload (REQ-VID-014: "Reject uploads > 2 GiB")
**Code**: js/projx_frontend/src/upload/handler.ts:142–178
**Observation**: handler enforces 5 GiB limit; spec says 2 GiB.
**Suggested route**: writing-specs to amend spec, OR code change to align with spec — user/agent decides.
```

End the report with a counts summary: `N findings (M mismatch, K suspect, L unverified), J orphans, P queue items janitored, Q ephemerals pruned`.

## What this skill does NOT do

- Edit specs, code, mdbook, or `layout.yaml`.
- Open issues in external trackers.
- Run tests, builds, or linters.
- Re-author requirements based on what the code does (the code may be wrong; the spec is canonical until amended by `writing-specs`).

## Anti-patterns

- **Bulk-reading SPEC.yaml prose sections (purpose, actors_and_surfaces, etc.) to spot-check requirements.** Use the structured `requirements:` list in SPEC.yaml for indexing; load full SPEC.yaml only when investigating a specific finding.
- **Auto-fixing findings.** Report only. Routing to fixes is the agent/user's decision.
- **Running `--full-audit` on every change.** Wastes context and time. Use diff-scoped by default; `--full-audit` is for periodic maintenance.
- **Skipping orphan-reference reporting because "nothing's broken yet".** Orphans rot quietly; flag them when found.
- **Reporting `unverified` without saying why.** "Couldn't check" needs a one-line cause: ambiguous spec, code location unclear, etc.
- **Skipping the parent when a sub-spec is loaded.** Parent-level cross-cutting requirements apply to every sub-spec. Load both.
- **Treating `sub_specs:` list ↔ directories mismatch as a minor finding.** It indicates an incomplete migration or a stale manifest — report as `mismatch`, not `suspect`.
