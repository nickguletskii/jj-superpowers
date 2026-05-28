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

references:                      # ALL cross-references use slugs/IDs — never file paths
  planes: []                     # e.g., [auth, observability]
  capabilities: []               # e.g., [main-backend-api]
  invariants: []                 # e.g., [INV-CONSISTENCY-001]
  glossary: []                   # e.g., [video, presigned-upload]

# Required prose (KYAML | block)
purpose: |
  One paragraph. Why does this exist? Who is the user?

# Optional prose (omit if not applicable)
actors_and_surfaces: |
  Who triggers behavior, through what interface (UI/API/CLI/event). Concise.

state_and_lifecycle: |
  State machine, allowed transitions. Only if non-trivial.

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

  - id: REQ-<SHORT>-002
    summary: <one-line imperative>
    level: SHOULD
    text: |
      The system SHOULD <observable behavior>. Failure handling: <what happens otherwise>.

# Optional structured failure modes
failure_modes:
  - code: UPLOAD_TOO_LARGE        # stable ID; never reused; strip backticks
    condition: File exceeds size limit
    behavior: |
      413 response with JSON {error, code}. MUST NOT persist partial upload.

  - code: UPLOAD_FORMAT_UNSUPPORTED
    condition: MIME type not in allowed set
    behavior: |
      415 response with JSON {error, code}.
```

## Notes on filling

- **Slug**: short kebab-case; matches the directory name.
- **`owns:` globs**: precise enough to be unambiguous, broad enough to not require updates on every file rename. Prefer directory-level when possible.
- **`references:`**: use slugs/IDs only — tooling resolves them to files. Never put a file path here.
- **REQ summaries**: imperative present-tense one-liner. "File size limit", not "Implements file size limit".
- **IDs are stable**: never reuse a number. Retire by setting `level: DEPRECATED` and optionally `replaced_by: REQ-<SHORT>-NNN`.
- **State & Lifecycle**: omit if there's nothing more than "created → exists → deleted".
- **Failure mode codes**: adding new codes is non-breaking; renaming is a deprecation.

## Sub-spec template

Use when creating a new sub-spec inside an existing capability or plane directory.

```yaml
# Required fields
id: <parent-slug>/<leaf-name>    # e.g., chat-workspace/streaming
kind: capability                  # capability | plane — matches parent
parent: <parent-slug>             # e.g., chat-workspace
status: draft
owns:                             # paths specific to this sub-spec (subset of parent's)
  - <path glob>
code_spec: []

references:                       # slugs/IDs only — never file paths
  planes: []
  capabilities: []                # may include sibling sub-spec slugs: <parent>/<sibling>
  invariants: []
  glossary: []

purpose: |
  One paragraph. What does this sub-area do?

# Optional prose — add actors_and_surfaces:, state_and_lifecycle:, scaling_assumptions:, out_of_scope: if applicable (same rules as top-level specs).

requirements:
  - id: REQ-<PARENT_SHORT>-<SUB_SHORT>-001    # new requirements use nested form
    summary: <one-line imperative>
    level: MUST
    text: |
      The system MUST <observable behavior>.

  - id: REQ-<PARENT_SHORT>-001    # migrated requirements keep their stable ID
    summary: <migrated requirement>
    level: MUST
    text: |
      ...

failure_modes: []
```

**After creating the sub-spec,** update the parent's `SPEC.yaml`:
- Add leaf name to `sub_specs:`.
- Remove any requirements moved to this sub-spec from the parent's `requirements:`.
- Narrow `owns:` in parent to paths not claimed by any sub-spec (if appropriate).
