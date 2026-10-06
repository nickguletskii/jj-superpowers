# SPEC.yaml Template

Copy and fill. Delete optional sections you can't fill rather than leaving placeholders.

```yaml
# Required fields
id: <slug>                       # e.g., video-upload — stable, matches directory name
kind: capability                 # capability | plane
status: draft                    # draft | stable | deprecated
owns:                            # path globs; canonical source for layout.yaml code_map
  - <path glob>
code_spec: []                    # optional; modules carrying normative typed API

references:                      # slugs/IDs only — never file paths
  planes: []                     # e.g., [auth, observability]
  capabilities: []               # e.g., [main-backend-api]
  invariants: []                 # e.g., [INV-CONSISTENCY-001]
  glossary: []                   # e.g., [video, presigned-upload]

# Required prose (KYAML | block)
purpose: |
  One paragraph. Why does this exist? Who is the user?

# Optional prose (omit if not applicable)
actors_and_surfaces: |
  Who triggers behavior, through what interface (UI/API/CLI/event).

state_and_lifecycle: |
  State machine, allowed transitions. Omit if just created → exists → deleted.

scaling_assumptions: |
  - Expected entity counts: up to N <unit>.
  - Traffic shape: peak <…>, sustained <…>.
  - Externally observable performance contracts: p99 < X ms at Y QPS.
  (MUST NOT mandate data structures, algorithms, or libraries.)

out_of_scope: |
  - Thing a reader might assume but this spec does not cover.

# Structured requirements (id/summary/level/text all required)
requirements:
  - id: REQ-<SHORT>-001           # capability: REQ-<SHORT>-NNN; plane: INV-<SHORT>-NNN
    summary: <one-line imperative> # e.g., "File size limit"
    level: MUST                    # MUST | MUST NOT | SHOULD | SHOULD NOT | MAY | DEPRECATED
    text: |
      The system MUST <observable behavior>. Conditions: <when this applies>.

# Optional structured failure modes
failure_modes:
  - code: UPLOAD_TOO_LARGE        # stable ID; never reused
    condition: File exceeds size limit
    behavior: |
      413 response with JSON {error, code}. MUST NOT persist partial upload.
```

## Notes on filling

- **`owns:` globs**: unambiguous, but broad enough (directory-level where possible) that file renames don't require updates.
- **REQ summaries**: imperative one-liner — "File size limit", not "Implements file size limit".
- **Retiring**: never reuse a number; set `level: DEPRECATED` and optionally `replaced_by: REQ-<SHORT>-NNN`.
- **Failure mode codes**: adding a code is non-breaking; renaming one is a deprecation.

## Sub-spec template

Same shape as above; these fields differ:

```yaml
id: <parent-slug>/<leaf-name>    # e.g., chat-workspace/streaming
kind: capability                  # matches parent
parent: <parent-slug>
owns:                             # subset of the parent's paths
  - <path glob>
references:
  capabilities: []                # may include siblings: <parent>/<sibling>

requirements:
  - id: REQ-<PARENT_SHORT>-<SUB_SHORT>-001    # new requirements use nested form
    summary: <one-line imperative>
    level: MUST
    text: |
      The system MUST <observable behavior>.
  - id: REQ-<PARENT_SHORT>-001    # migrated requirements keep their ID
    summary: <migrated requirement>
    level: MUST
    text: |
      ...
```

Then update the parent: add the leaf to `sub_specs:`, remove the moved requirements, and narrow its `owns:` to paths no sub-spec claims, if appropriate.
