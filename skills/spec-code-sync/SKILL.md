---
name: spec-code-sync
description: Use before editing source files in a project with `.agents/layout.yaml` — when planning or executing a code change, or when about to edit a file that may be a code-as-spec module.
---

# Spec ↔ Code Sync

Decides what spec or doc work a code change owes and when, and stops typed-API edits that would silently drift the spec. Authoring specs is `writing-specs`; auditing existing drift is `spec-drift-detector`; bootstrapping the manifest is `project-layout`.

## Preflight

1. Read `.agents/layout.yaml` and check `schema_version`; stop with a clear message if it is unknown.
2. List every file the change will create, modify, or delete.
3. Look each one up in `code_map` and load only the listed specs. A `<parent>/<leaf>` slug also loads the parent (parent rule in `writing-specs`). `excluded_paths` is for `spec-drift-detector`, not this lookup.
4. Grep the touched files for `impl: REQ-` (matches flat and nested IDs). Load any annotated spec, even if `code_map` has no entry for that file.
5. Spec frontmatter is canonical for `owns:` and `code_spec:`. If it disagrees with `code_map` or `spec_code.modules` in a way that changes who owns a touched path, say so ("`layout.yaml` says X belongs to A; A's frontmatter no longer claims it — using frontmatter"), re-resolve ownership from frontmatter, and either fix `layout.yaml` in the same change or leave it for `spec-drift-detector`. This check can't see a `code_map` that simply omits a path; see "Conflict rules" in `project-layout/references/manifest-schema.md`.
6. Grep the tech-debt queue directories for entries mentioning touched paths, and surface them ("code/2026-05-28/142233-replace-adhoc-retry.md (handler.ts:142–178) — consider folding in"). The agent decides whether to fold them in; fold deliberately, since a change doing five things is hard to review and revert.

`code_map` is a hint, not a gate: report "no candidates" for an unmapped path and move on rather than globbing every spec's frontmatter. If a substantial change has no candidate specs at all, ask whether that's expected or a spec is missing. Unmapped paths, co-ownership, and exclusions follow "Conflict rules" in `manifest-schema.md`.

## Classifying a spec-affecting change

The test is mechanical: did the brainstorming design doc name this spec amendment before any code task was written?

- **Yes — design-time intent.** The plan needs a `spec-update` task (`writing-specs`) scheduled before the implementing task.
- **No — post-implementation refinement**, including realizations made mid-implementation. Implement, then immediately write a doc-debt entry at `.agents/tech-debt/docs/<YYYY-MM-DD>/<HHMMSS>-<slug>.md` describing the owed spec change (format in `manifest-schema.md`). This is real debt that persists until resolved through `writing-specs`.

Before routing anything to `writing-specs`, check that the amendment would add something the code can't show — a timing model, edge case, contract, or reason. A change that only alters a signature, enum, or constant owes no spec work; don't invent a requirement that restates it.

## Code-as-spec modules

If a touched path matches `spec_code.modules`, the atomic three-artifact rule applies (`writing-specs` → "Code-as-spec module changes"). If you are about to edit the module without the matching `SPEC.yaml` edits in the same change, stop, route to `writing-specs`, and make the edit as part of that change set. Deferring the spec update "for later" is exactly the drift this check exists to prevent.

## Unrelated issues noticed mid-task

- Fix inline only when it is on-path, trivial (one file, no new abstractions, no behavior change), and covered by this change's verification.
- Otherwise add an entry to the matching queue (`code/`, `tests/`, `perf/`, `docs/`) at `<queue>/<YYYY-MM-DD>/<HHMMSS>-<slug>.md`.
- Don't file issues in external trackers unless the user has allowlisted that kind of item.
- Don't add paths to `excluded_paths` to quiet drift reports; deferred work belongs in the queue.

## Before declaring the change done

Ask: did this change alter a normative requirement the spec doesn't yet reflect? If so, return to `writing-specs`. Otherwise, delete the entry files of queue items you resolved (VCS history is the audit trail).
