---
name: brainstorming
description: Use before creative or design-bearing work — creating a feature, building a component, adding functionality, or changing behavior. Not needed for mechanical, fully user-specified edits such as renames, one-line fixes, or explicit step-by-step instructions.
---

# Brainstorming Ideas Into Designs

Turn an idea into an approved design through dialogue: understand the context, ask questions one at a time, present the design, get approval.

**When approval is required.** Design-bearing work gets a design and the user's approval before implementation, even when it looks simple — unexamined assumptions in "simple" tasks cause the most rework. For a small task the design is a few sentences. Mechanical, fully user-specified edits (a rename, a one-line fix, explicit instructions) need no design round-trip. The user can also authorize autonomous work.

**Scale the ceremony, not the gate.** Approval applies at every tier; the spec document, API-surface brainstorm, and adversarial review do not. Running Full-tier ceremony on a one-line change is as much a defect as skipping the design.

## Checklist

Track progress against this checklist, not the harness task list (see `using-superpowers`). The table is the single statement of which steps each tier runs.

| Step | Trivial | Small | Full |
|------|---------|-------|------|
| 1 Explore context | light | light | full (+ symbol cache) |
| 2 Clarifying questions | ✅ | ✅ | ✅ |
| 3 Propose 2–3 approaches | skip | if a design choice exists | ✅ |
| 4 API surface & abstractions | skip | skip | ✅ |
| 5 Present design + approval | ✅ (a few sentences) | ✅ | ✅ (sectioned) |
| 6 Triage tier | ✅ | ✅ | ✅ |
| 7 Write design doc | skip | skip | ✅ |
| 8 Spec self-review | skip | skip | ✅ |
| 9 Adversarial spec review | skip | skip | ✅ |
| 10 User reviews written spec | skip | skip | ✅ |
| 11 Transition to implementation | ✅ | ✅ | ✅ |

Steps 7–10 operate on a written spec; Trivial and Small have none, so those steps are skipped outright.

1. **Explore context** — relevant files, docs, skills, rules, dependencies; recent commits only if the user asks. Find existing abstractions and helpers to reuse. If `.agents/layout.yaml` exists, read it, list the capability/plane specs the work likely touches (filter `code_map` by path), and load only the most relevant `SPEC.yaml` files. At Full tier, write a JSONL cache of relevant symbols (files, types, functions) so later stages don't re-explore; at smaller tiers it costs more than it saves.
2. **Clarifying questions** — one per message, aimed at purpose, constraints, scope, success criteria, and backward compatibility. Prefer multiple choice through the harness ask tool. Settle how much testing the work warrants: reach for tests where the type system, compiler, or linter can't enforce an invariant.
3. **Propose 2–3 approaches** — recommendation first, with reasons. Batch choices with an obvious answer into one yes/no confirmation, still showing the alternatives.
4. **API surface and abstractions** — load `designing-with-types-and-abstractions` for how to shape types. This step adds:
   - **Search before building.** Check the codebase, standard library, and dependencies before proposing a new helper or type; record what you reused.
   - **Inventory what exists.** Walk current APIs, data shapes, and boundaries; look for ad hoc branching, duplicated paths, and leaky internals that should become one abstraction.
   - **Design for independent implementation.** A consumer must be usable from its interface alone, with any invariant the types can't carry written down — this is what lets parallel implementers start against a stub.
   - **Normative changes** (projects with agent specs): classify the change. A **new capability or plane** must be authored by `writing-specs` before implementation; if it has 15+ requirements or distinct sub-areas, ask whether to start with sub-specs. A **spec amendment** needs a block in the design doc naming the exact spec file so `writing-plans` schedules the right `spec-update` task:
     ```
     **Spec amendment block:**
     - File: `docs/agent-specs/capabilities/chat-workspace/streaming/SPEC.yaml`
     - IDs changing: REQ-CHAT-STR-001 (new), REQ-CHAT-003 (amended)
     - Nature: <one sentence describing what changes>
     ```
     A **non-normative refactor** needs no spec change.
   - **User-facing interactions** (screen, panel, form, editor, CLI flow, dashboard): load `ui-interaction-design.md` and produce its required core. Normative UI behavior is formalized via `writing-specs`.
5. **Present the design** — sections scaled to complexity (a few sentences up to ~300 words), asking after each whether it reads right. Cover architecture, components, data flow, error handling, testing, and implementation topology (independent units, shared interfaces, sequencing, verification gates, which commands belong to implementation vs verification). User-facing work also covers navigation, layout, key states, and three requirements: errors/warnings surfaced, progress reported for long work, and a UI that never freezes. In existing code, follow established patterns; fold in a targeted improvement where the code actively obstructs the work, but no unrelated refactoring.
6. **Triage tier and planning strategy** — see below.
7. **Write the design doc** to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.
8. **Spec self-review** — see below.
9. **Adversarial review** — see below.
10. **User reviews the written spec** — "Spec written to `<path>`. Please review it and let me know if you want changes before I write the implementation plan." Apply changes and re-run the review loop; proceed once approved.
11. **Transition** — Full/Waterfall → `writing-plans`. Full/Agile → `iterative-planning` (it owns the phase loop). Trivial/Small → the inline or direct-subagent path below, then run the named verification before claiming completion.

Under Rush, steps 6 onward resolve per `using-superpowers` `references/autonomy.md`; clarifying questions and design approval are never auto-resolved.

## Triage gate

After design approval, propose a tier with reasoning. Your proposal is the default; the user may veto via the ask tool, but no round-trip is required. Triage sets how much planning ceremony runs, not whether design approval happens.

| Tier | Criteria | Path | Verification |
|------|----------|------|--------------|
| **Trivial** | one obvious file, no new abstraction, one-command verification, no design risk | implement inline, no plan files, no subagents | orchestrator runs the verify command |
| **Small** | local scope, ≤2 implementer dispatches, clear file boundaries, no new architecture or cross-file design risk | 1–2 direct subagent dispatches, no plan files | orchestrator runs the verify command (contended commands: SDD Verification Ownership) |
| **Full** | new architecture or public API, interacting components, cross-file design risk, or benefits from a reviewable spec | spec → plan → `project-network.dot` | `verify` nodes in the graph |

Pick the lightest adequate tier. Design risk forces Full because the `design_review` gate exists only there. Example: fixing a typo'd error string is Trivial — one-sentence design ("change the string in `src/err.rs` to X; verify with `cargo test -p foo`"), approval, edit, verify. No approaches, no spec, no subagents.

**Small-tier dispatch** uses the `sdd-implementer` agent (or its fallback per `subagent-driven-development`), passing the approved design, exact file scope, and verify command in place of a task file. That keeps file-scope enforcement, the contended-command boundary, the no-nested-harness rule, the status protocol, and search-before-building.

**Off-graph spec sync.** Trivial and Small skip `writing-plans`/`executing-plans`, which is where `spec-code-sync` normally runs. In a project with `.agents/layout.yaml`, invoke `spec-code-sync` yourself before any source edit at these tiers.

**Self-escalation.** Unexpected uncertainty mid-flight means re-triaging upward or asking the user. Escalating to Full means writing the spec and graph then; say so.

### Planning strategy (Full only)

Propose right after setting Full, same propose/veto pattern.

| Strategy | Meaning | Step 11 |
|----------|---------|---------|
| **Waterfall** (default) | one `project-network.dot` for the whole project | `writing-plans` |
| **Agile** | brainstorm once, then plan one phase → execute → fold learnings → plan the next | `iterative-planning` |

Propose Agile only for genuine design uncertainty, per the criterion in `iterative-planning`; a large but fully specifiable graph stays Waterfall.

## After the design

**Where the design lives.** Full: the spec file. Trivial/Small: the conversation, with the verify command.

**User-facing work** needs a verification checklist mapping each agreed user story to an acceptance check and each user flow to a flow-completion check (with its step budget), plus one check each for error surfacing, progress reporting, and responsiveness. These become `verify` nodes (Full) or the named verification (Trivial/Small).

**Spec self-review (step 8).** Reread the spec and fix inline:
1. Placeholders — "TBD", "TODO", vague requirements.
2. Contradictions between sections.
3. Requirements readable two ways — pick one.
4. Missing context a new session would need.
5. Topology clear enough for `writing-plans` to build the graph: units, interfaces, sequencing, verification gates.
6. Contended verification commands and output requirements identified.
7. UI (if any): every story and flow has a check; key states, error surfaces, progress, responsiveness specified.

**Adversarial review (step 9).** Run `hypothesis-driven-improvement`'s Simple In-Line Mode over the spec.

- Severity uses the scale in `requesting-code-review`. Critical/Important findings are fixed and re-reviewed. Minors are folded in the same round (cosmetic ones may be dropped) and don't trigger another round; a wrong finding of any severity can be refuted with justification.
- Each round dispatches about 3 read-only reviewers with distinct lenses chosen from: correctness, completeness, ambiguity, API/design soundness, concurrency, parallelism, performance, duplication, extensibility, testability, over/under-engineering. Rotate lenses across rounds.
- Converged = a round with zero Critical/Important. You edit the spec directly.

## Two biases

- **Cut what nobody asked for** — strip speculative features, but never silently drop something the user requested; say what you're cutting and why.
- **Assume a forgetful, lazy user** for anything user-facing: autosave, remembered state, smart defaults, undo over confirm.
