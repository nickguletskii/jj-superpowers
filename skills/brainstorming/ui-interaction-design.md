# Brainstorming User Interactions

Load this when a design includes any user-facing interaction (a screen, panel, CLI flow, form, dashboard, editor, wizard). It turns a vague "build a UI for X" into an explicit, verifiable set of UI design entities. The output feeds the design doc's verification checklist, and any *normative* UI behavior is later formalized with `jj-superpowers:writing-specs` (see its `references/ui-spec-patterns.md`).

## Always-on design principle: minimize friction, forgive mistakes

Assume the user is **forgetful and lazy** — not as an insult, but as a design constraint that produces better UIs for everyone. Bias every flow toward simple and automatic **without dropping functionality**:

- **Autosave over "Save"** — persist continuously; never make losing work possible by forgetting to save.
- **Remember state** — last position, open tabs, filters, selections, window layout, draft input. Returning should feel like never having left.
- **Smart defaults** — pre-fill the most likely value; make the common path zero-decision.
- **Undo over confirm** — prefer a reversible action + undo to a blocking "Are you sure?" dialog. Reserve confirmation for truly destructive, irreversible actions.
- **Surface, don't hide** — keep the next action and current status visible; don't rely on the user remembering a hidden step or a keyboard shortcut.
- **Minimize required steps/decisions** — every click, field, and choice is friction. Cut, default, or automate it.

Then **capture the project's actual persona(s)** too — the generic forgetful/lazy bias is the floor, not a substitute for knowing who really uses this (expertise, frequency of use, device, accessibility needs, environment).

## Three non-negotiable cross-cutting requirements

Every UI design MUST address all three. They are not optional polish; they become checklist items.

1. **Errors and warnings are always surfaced to the UI.** Every failure mode and every warning has a *visible, actionable* place in the UI — never swallowed, never console-only. Say what happened, why, and what the user can do next. Validation, network failure, partial success, permission denied, low-confidence results — all surfaced.
2. **Progress is always reported.** Any operation that can take perceptible time (network, IO, compute, multi-item batch) shows progress: determinate (% / count) when the total is known, indeterminate (spinner/activity) when it isn't. State *what* is happening and *where*. Make long operations cancelable where it makes sense.
3. **The UI never freezes.** Work never blocks the render/UI thread. Offload long or CPU-heavy work (workers, async tasks, background jobs, streaming) so scrolling, typing, and clicking stay responsive throughout. A spinner on a frozen thread is still a frozen UI — responsiveness and progress reporting go together.

## Required core entities

Produce all of these for the agreed UI. Keep each short; a few lines each is enough.

| Entity | What to capture |
|--------|-----------------|
| **User stories** | `As a <persona>, I want <goal>, so that <benefit>.` Each story gets **acceptance criteria** (observable Given/When/Then or a bullet of checks). Stories are the unit the checklist verifies. |
| **User flows** | The ordered steps to accomplish a goal. Number each step and mark it `[auto]` (system does it) or `[user]` (user acts). Include the **happy path and at least the primary error/edge path**. Note a **step budget** (target number of user steps) and drive it down — fewer `[user]` steps is the goal. |
| **Navigation / IA map** | What top-level areas/surfaces exist and how the user moves between them. Where does each flow start and end? What's reachable from where? |
| **Key states per surface** | For each surface enumerate: **empty** (no data yet), **loading**, **partial/streaming**, **error**, **success/populated**. Most UIs ship only the happy state — naming all five up front prevents that. |
| **Error & warning surfacing** | Per cross-cutting requirement 1: list each failure/warning and its visible, actionable UI surface. |
| **Progress & responsiveness** | Per requirements 2 and 3: for each long/async action, how progress is shown and how the UI stays unblocked (+ cancelability). |

## Optional menu — pick what the design needs

Don't force all of these; choose what reduces ambiguity for this UI.

- **Personas** — detailed beyond the forgetful/lazy floor (power user, first-timer, admin).
- **Wireframes / low-fi sketches** — ASCII or described layout when arrangement matters.
- **Keyboard-shortcut map** — bindings for frequent actions (always keep a visible non-keyboard path too).
- **Command-palette actions** — the searchable action list, when a palette is in scope.
- **Component inventory** — which existing design-system components are reused (search first; don't reinvent).
- **Modes / view-states** — distinct interaction modes and how the user knows which is active.
- **Responsive / layout breakpoints** — behavior across sizes/devices.
- **Drag-and-drop / direct-manipulation** interactions.
- **Undo/redo model** — scope, granularity, history depth.

## Navigation & layout paradigms — choose deliberately

Pick the paradigm(s) that fit the task, viewed through the forgetful/lazy lens.

| Paradigm | Fits when | Forgetful/lazy lens |
|----------|-----------|---------------------|
| **Wizard** | Rare or complex setup with a natural order | Keep steps few; allow skip + **resume later**; remember progress; show step N of M |
| **MDI (multiple documents)** | Power users juggling many concurrent docs/workspaces | Heavy — add recents + **restore-session** so nothing is lost on close |
| **Modal** | One focused, blocking decision | Use sparingly; never stack modals; prefer inline + undo over a modal confirm |
| **Tabs** | Parallel views of one context | Persist active tab and per-tab state across visits |
| **Modes** | The same input must do different things | Risky (mode errors) — show a persistent mode indicator; prefer spring-loaded/quasimodes |
| **Command palette** | Keyboard-driven action search & discoverability | Great for power users; pair with **visible affordances** so it's never the only path |
| **Trees** | Genuinely hierarchical content | Remember expansion state; support filter/search; avoid deep nesting |
| **Multi-column / master-detail** | Browse a list, act on a detail | Often the **lowest-friction default** for CRUD — act without losing your place |

## Verification checklist — the hand-off contract

The whole point: the design doc's checklist must let a reviewer/planner confirm the agreed UI was actually built. For the agreed UI, add a verification item for each of:

- **Each agreed user story** → an acceptance check (its acceptance criteria are observably met).
- **Each agreed user flow** → a flow-completion check: the flow completes within its **step budget**, `[auto]` steps stay automatic, and the primary **error path** surfaces correctly.
- **The three cross-cutting requirements** → one check each: every failure/warning has a visible, actionable surface; every long/async action reports progress; no operation blocks/freezes the UI thread.

These become `verify` nodes (Full tier) or the named conversational verification (Trivial/Small). A user story or flow with no corresponding check is a gap — close it before finishing the design.

## Formalizing normative UI behavior

When a UI behavior is *normative* (a guarantee the implementation must hold — a state machine, an interaction contract, an error/progress semantic), it belongs in a spec, not just the design doc. Hand it to `jj-superpowers:writing-specs`, which documents how to express UI states, pages, widgets, transitions, and interactions as observable behavior (its `references/ui-spec-patterns.md`). The design doc captures the *intent and the checklist*; the spec captures the *normative contract*.
