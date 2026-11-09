# Task 1: Shared policy

**Purpose:** Land the shared vocabulary that every other task points at. `using-superpowers` gains the governing principle, sorting, and interruption rules. `verification-before-completion` gains batching, cost-justified evidence, and lightweight honest reporting.

**Risk:** this is a shared surface; tasks 02 to 04 refer to its section names. Keep the section headings stable and report them in your summary.

**Reuse:** the spec sections "Governing principle", "Work selection and interruptions" (Sorting and Interruptions), "Implementation and verification batching", and the reporting paragraph of "Risk-based review and completion". The existing batching paragraph in `using-superpowers` ("Batch related edits before checking…") and the "When to verify" section of `verification-before-completion` already say part of this; extend them, don't duplicate them.

**Interfaces and Invariants:**
- `using-superpowers` exposes these headings, which other skills cite:
  - `## Governing principle`: the cost test, plus the statement that safety, explicit requirements, and honest reporting are never traded against cost.
  - `## Sorting work`: the five buckets, the within-bucket order, "never sort by", dependencies and parallel workers, and when to re-sort.
  - `## Interruptions`: bounded read-only triage, when to switch, what to preserve when switching, and that permission to reorder grants no destructive or scope-widening authority.
- `verification-before-completion` exposes:
  - `## When to verify`: batching, the three verify-before triggers (integration, a success claim, a dependent action relying on a proven invariant), and the failure loop.
  - `## Choosing evidence`: cost-justified evidence, the ban on reconstructing prior states for labeling or ceremony, the conditions for a justified historical investigation, and honoring explicit requests.
- Instruction priority, the routing map, decision checkpoints, the delegation boundary, and the bootstrap maintainer comment in `using-superpowers` stay as they are. `tests/bootstrap-context.test.ts` asserts on "Instruction priority".
- The bootstrap is injected separately and must not grow, so do not touch `hooks/`.

**Subtasks:**
- [ ] `using-superpowers`: add the three sections after "Loading skills" and before "Routing map". Rephrase the spec text for agents; keep it tight. Move the existing batching sentences out of "Loading skills" into `verification-before-completion` and leave a one-line pointer.
- [ ] `using-superpowers` routing map: add one line under "Running the agent" pointing new reports and backlog ordering to `## Sorting work` and `## Interruptions`.
- [ ] `verification-before-completion`: keep the opening paragraph's definition of valid output and smallest sufficient check. Rewrite "When to verify" to cover the batching rules and add "Choosing evidence".
- [ ] `verification-before-completion` evidence table: delete the "Requirements met | Plan re-read line by line" and "Agent completed | VCS diff shows the changes" rows. In their place add one sentence: review the behavior that actually changed against the requirements that apply to it, and don't inspect VCS only to distrust an agent's report. Keep the other rows.
- [ ] Add a short reporting paragraph: claim only what was checked, name the commands, and state what remains uncertain.
