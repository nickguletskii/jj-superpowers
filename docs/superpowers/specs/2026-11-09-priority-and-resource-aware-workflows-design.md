# Priority- and resource-aware workflows

## Approved direction

Spend effort where it changes outcomes. Implementation and fixes take priority over process. Verification and review are sized to concrete risk. Compatible work is batched before it is checked. New information changes the plan only when it shows clearly higher impact; the order in which things arrive is not a reason to switch.

This is a Full-tier, Waterfall change to process documentation. It adds no runtime architecture, new skill, scheduling framework, or required tracking artifact. Existing workflow structures (task/verify graphs, role boundaries, approval gates) stay as they are. Only the policy that drives them changes.

## Governing principle

Workflows decide the same few things over and over: whether to interrupt, when to check, how much to review, and what evidence to collect. Every one of these decisions uses the same test:

> Take an action when the impact it protects or the uncertainty it resolves outweighs what it costs in time, compute, contention, and context switching. Use the cheapest action that settles the question.

The order of work is a separate question with a separate goal, set out under Sorting. The sections below apply this test to each of the other decisions. When a case is not covered, apply the test directly. Do not extend the nearest rule by analogy. Some things are never traded off against cost: safety, explicit user or project requirements, and honest reporting.

## Work selection and interruptions

The orchestrator owns the order of work. Priorities and deferred items go in the artifact that already tracks the work (conversation, plan, or graph), not in a second ledger.

### Sorting

One ruleset orders both a collected backlog and reports that arrive mid-session. The goal is to release waiting work as early as possible and to finish everything in the least total time. Every rule here is a default. The agent may depart from one when the context calls for it, and gives a one-sentence reason when it does.

**Buckets (first match wins):**

1. **Explicit priority.** The user or project has prioritized the item. An explicit request for polish puts that polish here.
2. **Critical impact.** An outage, data loss or corruption, or a security exposure. These are urgent even when nothing else is waiting on them.
3. **Blockers.** Current or queued work is waiting on the item. Rank blockers by how much work each one releases.
4. **Substantive work.** Wrong behavior, missing functionality, and other changes that matter to users or to correctness.
5. **Polish.** Wording, cosmetic and stylistic improvements, naming, and refactors made for taste rather than need. Polish comes last unless someone explicitly requests it.

**Within a bucket (suggested order):**

- a. **Root cause before symptoms.** Group symptoms under their suspected cause and fix the cause once, instead of patching each symptom.
- b. **Foundational work first.** Build what other items will depend on (shared interfaces, data shapes, infrastructure, conventions) before the items that consume it, even when nothing is formally waiting yet. This does not apply when:
  - the foundation is speculative, because no planned work needs it;
  - its shape depends on what consumers turn out to need, in which case build a thin end-to-end slice first;
  - a Critical item is waiting.
- c. **Critical path first.** Prefer the item at the head of the longest dependency chain.
- d. **Batch by shared context.** Items that touch the same files, subsystem, or check run together, so their context-switch and verification costs are paid once.
- e. **Higher impact first**, on the shared severity scale in `requesting-code-review`.
- f. **Arrival order**, as a last resort.

**Never sort by** ease, speed, visibility, which component or layer the item touches, who reported it, or how recently it arrived. Cost does not decide order. It matters only when deciding whether an interruption is worth it and when batching.

**Dependencies.** Before starting an item, check whether it waits on unfinished work. If it does, do the prerequisite first or reorder. With parallel workers, start the critical path first, then fill spare capacity with independent items in files nobody else is touching.

**Re-sort** when a triage result arrives, an item finishes, or a new dependency appears. Do not re-sort continuously.

### Interruptions

When a new issue arrives, acknowledge it and keep it, then continue the current work while a bounded triage pass assesses the issue. Triage reports severity, scope, dependencies, and likely cost, and places the issue in the queue using the sorting rules. Triage is read-only. It does not edit files, run expensive checks, or widen scope. Size triage to the issue: group related reports into one pass, settle obvious duplicates and trivial scheduling choices inline, and delegate only when delegating costs less than the interruption it saves.

Switch work in either of these cases:

- the user explicitly redirects; or
- triage shows clearly greater impact after counting the cost of interrupting, or finds something that blocks the current work.

When switching, keep completed work, record a short resume point with the reason for the switch, and leave unrelated useful work running. If the impact is unclear, keep the current priority. Ask the user only when the tradeoff really needs their judgment. Permission to reorder work never authorizes destructive operations or widening scope.

## Implementation and verification batching

Finish a coherent unit of change before checking it: the source change, its callers, and its tests together. Independent changes share one verification point when their dependencies, file ownership, and checks allow it.

Batching postpones verification but never skips it. Verify before any of these:

- integration;
- a claim of success;
- a dependent action that relies on an invariant being proven.

A high-risk boundary or a concrete uncertainty that blocks progress can justify an earlier, narrower check.

When a check fails, read the diagnostics you already have. Fix related causes together, then rerun the smallest check that covers what changed. Do not rerun after every small edit. Widen to a full suite only for affected integration boundaries, explicit requirements, or material risk that remains unresolved. Prefer a single command over several overlapping commands that redo the same work. A single owner runs contended or expensive checks, and others reuse valid results instead of reproducing them.

**Evidence is chosen by cost.** Before any expensive check, rebuild, or historical execution, ask which question it answers and whether something cheaper answers it already. Cheaper evidence includes user-provided output, CI results, logs, and source inspection. Do not reconstruct prior states (earlier revisions, baselines, deliberately failing runs) to label a failure, to satisfy ceremony, or to tidy a report. A costly investigation is justified only by a specific unresolved question that materially affects the fix. Before running it, state the question, the expected cost, and the narrowest way to run it. Reuse isolated caches and workspaces where practical, and never disturb shared work in progress. Explicit requests for such comparisons are always honored.

## Risk-based review and completion

Reporting stays honest: claim only what was checked, and state what remains uncertain. Remove ritual that adds cost without adding information: mandatory evidence tables, line-by-line requirement checklists, and re-inspecting work only because the result came from another agent. A review examines the behavior that actually changed, against the requirements that apply to it.

**Review scope follows concrete risk, not task count.** Routine localized changes get self-review by the implementer plus batched targeted verification. Independent review is required for:

- security or data-integrity risk;
- substantial concurrency or architectural change;
- shared or public interfaces that others will build on;
- material uncertainty about correctness;
- an explicit user or project request.

Record the risk and the review scope briefly where the work is already tracked. Do not add a risk form or score.

Guidance on shaping reviews:

- Review a new shared interface before anything starts depending on it.
- Otherwise, prefer one reviewer who covers both requirements and quality over separate passes. Do not repeat reviews of work that has not changed.
- Fold duplication and abstraction concerns into the selected review. Add a specialist only for a concrete concern the existing review cannot cover.
- After fixes, re-review the areas that changed or were affected, not everything.
- A required review, whether risk-triggered or mandated by the user or project, is never skipped silently.

**Completion states stay explicit.** A unit of work is ready for its consumers once it is implemented, self-reviewed for scope and completeness, and recorded. Any review its risk requires must pass first. A producer of a shared interface must also clear interface review before consumers start. A group of work is complete only after verification succeeds and every required review passes. Workflow-specific markers that already select reviews (for example `stub=true`, or an explicitly authored `simplify=true` in an existing plan) keep their meaning. New plans add such markers only for a concrete concern.

**Design work uses the same rule.** Routine documentation and policy edits do not need a standing panel of reviewers. A substantial design gets independent review aimed at its actual risks, with more than one reviewer only when there are distinct material risks to cover. Design approval gates are unchanged. Behavioral evaluations of skills are lightweight simulations against the current tree, not reconstructions of past states.

## Implementation topology

Define the policy once and have consumers refer to it. Restating it in each skill invites drift.

1. **Shared policy (orchestrator-owned, lands first).** Put the governing principle, the sorting rules, and the interruption rules in `skills/using-superpowers/SKILL.md`. Put batching, cost-justified evidence, and honest reporting in `skills/verification-before-completion/SKILL.md`. Everything else uses this vocabulary.
2. **Execution and planning.** Align the plan-writing and plan-execution skills (`writing-plans`, `executing-plans`, `subagent-driven-development`, and their validation scenarios) with the shared policy. Keep the graph syntax and the file-ownership rules. Derive only the reviews that risk requires. Update readiness and completion wording, and fix any example that assumes every task gets independent review. State which checks are local to implementation and which belong to a batched verifier.
3. **Review and skill authoring.** Align `brainstorming`, `requesting-code-review`, `writing-skills` (with its testing reference), and the autonomy reference. Apply the same risk-based selection to manual and autonomous execution. Keep evaluation scenarios, but stop requiring historical execution or a separate evaluation batch per file.
4. **Integration (orchestrator-owned).** Find remaining conflicts by targeted search (agent role instructions, `tool-output-discipline`, other references) and change only text that contradicts the policy. Edit canonical agent sources, and regenerate agents only if generated bodies change. Add a CHANGELOG entry and a short README summary. Do no unrelated cleanup.

Slices 2 and 3 are independent once slice 1 has landed. Neither runs build, lint, or test suites mid-flight. The orchestrator owns integration, regeneration, and the single batched verification pass. Changing how reviews are selected affects the execution contract across several files, so that slice gets one focused independent consistency review. This applies the risk rule above; it is not an exception to it.

## Acceptance and verification

Acceptance tests decisions, not wording. Run paired baseline and with-policy decision simulations against the current skill text. Batch them into a few dispatches, not one per edited file, and keep their results outside shipped skill directories. Each class of decision gets one positive case and one boundary or negative case:

- **Sorting.** In a mixed backlog, polish sorts last and blockers sort ahead of substantive work, whatever the arrival order or apparent ease. An explicitly requested wording fix sorts first. Several symptoms of one cause are fixed through that cause. A shared interface that consumers need is built before them. A speculative foundation that no planned work needs is not.
- **Prioritization and interruption.** Low-impact reports that arrive during blocking work are triaged and queued, and do not displace the blocking work. A report that triage shows to be higher impact preempts the current work, with a preserved resume point and a stated reason. An explicit user redirect switches immediately, without waiting for triage.
- **Batching and evidence cost.** Several compatible fixes that share an expensive check are completed and then checked once together, and the valid output is reused at handoff. Failures already explained by available output are not reclassified by reconstructing prior states. A specific unresolved question that needs historical evidence leads to a justified, narrow investigation.
- **Risk calibration.** A trivial, low-risk edit gets a direct change and a cheap relevant check. A change with data-integrity, concurrency, or shared-interface risk gets independent, risk-focused review and the necessary acceptance checks before integration. Batching never removes that boundary.

Also run the changed readiness, review, and batching decisions through the existing plan-validation scenarios. Include at least one shared-interface producer with consumers, and one set of non-overlapping tasks that share a verifier. Keep semantic acceptance separate from source-text tests.

After all edits, run the repository test suite (`node --test tests/*.test.ts`) once, after regenerating agents if needed. Failures go back to their owners and related fixes are batched. Rerun only the affected checks unless scope requires another full pass. Report scenario outcomes, the exact commands run, and known limits. Simulations show the intended decisions; they do not prove real-world agent compliance.
