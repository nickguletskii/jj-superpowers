---
name: documentation
description: Use when writing, placing, or maintaining documentation outside code — mdbook chapters, runbooks, ADRs, module/architecture docs, `DOCS.md` — when code lacking docs is hard to understand, when deciding whether to document something, or when docs are redundant, stale, or duplicate the code.
---

# Living Documentation

Documentation says what code and types cannot. Wrong documentation is worse than none, and documentation that restates the code becomes wrong as soon as the code changes. Code explains *what*; docs explain *why*.

Use plain language and simple sentences. Code comments → `writing-comments`. Invariants the type system can enforce → encode them (`designing-with-types-and-abstractions`).

## Where information goes

| Information | Home |
|---|---|
| What the code does | The code (names, types, structure) |
| Why, non-type invariants, ordering constraints | `writing-comments` placement rule (local → comment; cross-component contract → spec; else module doc/ADR) |
| How to use a module/API; known limitations | Module-level doc comment |
| System architecture / data flow | Module doc with a Mermaid diagram |
| How to run, debug, deploy | Runbook |
| Cross-cutting architectural decisions | ADR |

Otherwise, don't document it. Use diagrams only when they beat a list or table: Mermaid for human-facing docs, Graphviz for plans and skill files.

## Projects with `.agents/layout.yaml`

Each fact has one home, chosen by audience:

| Audience | Lives in | Skill |
|---|---|---|
| Agent | `docs/agent-specs/{capabilities,planes}/<slug>/SPEC.yaml` (RFC 2119, KYAML) | `writing-specs` |
| Downstream dev — typed API guarantees | Code-as-spec modules in `layout.yaml` `spec_code.modules` | `writing-specs` (sole authoring path) |
| End user / dev narrative / operator / contributor | `docs/book/src/{users,developers,operators,contributors}/`, runbooks, ADRs | this skill |
| Layout and conventions | `.agents/layout.yaml` + short `AGENTS.md` | `project-layout` |

mdbook and specs don't overlap. Narrative and tutorials go in mdbook with no spec coupling. For behavior, link to the spec ("See also"). When a specific value has to stay in sync (rare), restate it with a citation such as `(REQ-VID-001)`, which `spec-drift-detector` verifies. Use `{{#include}}` for tight tables like error codes when `spec_include: enabled`. MUST-level detail stays in the spec.

## `DOCS.md`

Check the root `DOCS.md` first (monorepo packages may override it). It sets doc locations, forms, naming, and diagram format. If there isn't one, use these defaults.

## Maintenance

- Link code and docs both ways. Architecture docs and ADRs name the implementing code (`Implemented in src/auth/session.ts`), and code points back only through the anchors `writing-comments` allows. If you can't find the code a doc refers to, treat the doc as suspect.
- When code changes, update or delete the docs it affects. Merge overlapping docs into one. Don't keep outdated docs "for reference" and don't create TODO or template-only doc files.
- Make small, safe doc fixes inline. Offer changes that could affect behavior as a separate change.
- If you spent real effort tracing code that a short doc would have explained, write that doc. Ask the user if the scope is unclear.
