# `.agents/layout.yaml` Schema (v1)

Authoritative schema for the per-project layout manifest. Every skill in the spec ecosystem reads this file first and checks `schema_version`.

```yaml
schema_version: 1                                   # MUST. Skills refuse unrecognized future versions; MAY auto-migrate older.

specs:
  root: docs/agent-specs                            # MUST. Root for all spec content.
  partition:
    capabilities: docs/agent-specs/capabilities/    # vertical, user/dev-visible behavior
    planes:       docs/agent-specs/planes/          # horizontal cross-cuts (auth, observability, etc.)
  glossary:    docs/agent-specs/glossary.md         # shared terms, defined once
  invariants:  docs/agent-specs/invariants.md       # small cross-cutting rules (don't merit a plane)
  id_prefix:        REQ                             # capability IDs: REQ-<SHORT>-NNN
  plane_id_prefix:  INV                             # plane IDs:      INV-<SHORT>-NNN

mdbook:                                             # optional
  root: docs/book
  policy: orthogonal-with-citation
  spec_include: disabled                            # opt-in: enables {{#include}} from specs
  citation_format: "REQ-<ID>"

# Paths skipped by spec-drift-detector during audits (generated code, vendor, build output).
# NOT consulted by spec-code-sync (which surfaces hints, not coverage).
# Use sparingly; drift-detector reports if this list grows without justification.
excluded_paths:
  - "**/*.generated.*"
  - "vendor/**"
  - "target/**"

# Hint index: path → likely-relevant specs. Entries accept multiple paths/globs to share metadata.
# `owns:` (and therefore `code_map`) is a starting hint, not a coverage map. Many files
# (technical/non-product: build glue, config, helpers, test scaffolding) legitimately have
# no entry here. Co-ownership (multiple capabilities sharing a path) is allowed.
# Spec frontmatter `owns:` is canonical; this list MUST agree with the union of frontmatter.
code_map:
  - paths: [js/projx_frontend/**]
    capabilities: [frontend-shell, video-playback]
    planes:       [auth, observability]
  - paths: [rust/projx_inference/**]
    capabilities: [inference-pipeline]
    planes:       [observability, error-model]
  # Sub-spec slug example: <parent>/<leaf> resolves to capabilities/<parent>/<leaf>/SPEC.yaml
  - paths:
      - js/projx_frontend/src/subsystems/chat/streaming/**
    capabilities:
      - chat-workspace/streaming    # sub-spec slug: <parent>/<leaf>
    planes:
      - auth
      - observability

# Code-as-specification modules (typed API surface with RFC2119 docs in native format).
# Spec frontmatter `code_spec:` is canonical; this list MUST agree.
spec_code:
  modules:
    - paths:
        - rust/projx_inference/src/api.rs
        - rust/projx_inference/src/api/**/*.rs
      capability: inference-pipeline
      language: rust
      doc_format: rustdoc
    - paths:
        - js/projx_frontend/src/api/types.ts
        - js/projx_frontend/src/api/dto/*.ts
      capability: frontend-api
      language: typescript
      doc_format: jsdoc

tech_debt:
  root: .agents/tech-debt
  queues:
    docs:  .agents/tech-debt/docs.md                # MUST (everything else MAY)
    code:  .agents/tech-debt/code.md
    tests: .agents/tech-debt/tests.md
    perf:  .agents/tech-debt/perf.md
  external_tracker:                                 # optional
    kind: gitlab                                    # gitlab | github | linear | none
    project: projx/main

agent_blog:                                         # optional, gitignored when on
  enabled: false
  path: .agents/blog/
  format: per-session
  retention: 30d

handoffs:                                           # short notes when work is incomplete
  enabled: true
  path: .agents/handoffs/
  retention: 90d
  committed: false                                  # default; flip per-project if team wants in VCS

project_skills:
  root: .agents/skills                              # project-specific skills (projx-frontend pattern)
```

## Field semantics

- **`schema_version`** — integer. Skills MUST check; refuse unknown future versions; MAY migrate older.
- **`specs.id_prefix` / `plane_id_prefix`** — short uppercase. IDs are stable across renames; deprecation-only retirement (numbers never reused).
- **`excluded_paths`** — globs. Used by `spec-drift-detector` to skip irrelevant areas during audits (generated code, vendor, build output). NOT used by `spec-code-sync` (which surfaces hints, not coverage). Sparing use; growth is audited.
- **`code_map`** — denormalized index. Spec frontmatter `owns:` is canonical (see spec §3.3). `writing-specs` keeps these in sync; `spec-drift-detector` flags drift. Sub-spec slugs (`<parent>/<leaf>`) are valid in `capabilities:` and `planes:` lists. They resolve to `capabilities/<parent>/<leaf>/SPEC.yaml` (or `planes/...`). `code_map` matching is all-matches: a more-specific sub-spec entry and a broader parent catch-all may both match the same path; skills union the matched spec sets.
- **`spec_code.modules`** — same precedence rule: spec frontmatter `code_spec:` is canonical.
- **`tech_debt.queues.docs`** is the only queue required. Others are convenience splits.
- **`handoffs.committed`** — when `true`, handoffs go into version control. Drop the matching `.gitignore` entry in that case.

## Conflict rules

- A given code path MAY appear in multiple capabilities' `owns:` and any number of planes' `owns:` — co-ownership is allowed (a shared component legitimately participates in several capabilities). `owns:` is a hint for spec lookup, not a coverage gate.
- If `code_map` and spec frontmatter disagree, **spec frontmatter wins**; skills update `code_map` to match (or report it as a drift finding if they aren't authorized to write).

## Nested manifests (monorepo)

A subsystem MAY have its own `.agents/layout.yaml` under its root (e.g., `js/projx_frontend/.agents/layout.yaml`). Resolution rule: when a skill operates on a path, it uses the **nearest** ancestor manifest. The root manifest MAY declare known subsystems for navigation:

```yaml
subsystems:
  - path: js/projx_frontend
    layout: js/projx_frontend/.agents/layout.yaml
  - path: rust/projx_inference
    layout: rust/projx_inference/.agents/layout.yaml
```

Each subsystem is its own hub. Skills do not recursively merge manifests; they pick one.
