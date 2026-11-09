# Priority- and Resource-Aware Workflows Implementation Plan

> **Goal:** Ship the policy in `docs/superpowers/specs/2026-11-09-priority-and-resource-aware-workflows-design.md` (sorting, interruptions, batched and cost-justified verification, risk-based review) across the jj-superpowers skills and agents, keeping the existing task/verify graph syntax.

**Project network:** `project-network.dot`

**Graph rationale:** `task_01` lands the shared policy vocabulary that every other edit points at, so it runs first. `task_02` (execution and planning contract) and `task_03` (review and skill authoring) touch disjoint files and fan out in parallel. `task_04` runs after both because it reconciles agent roles and any leftover conflicts against their final wording, regenerates agents, and writes the CHANGELOG and README. `task_05` runs the decision simulations against the finished text. One verify node runs the repository suite once. The cross-file consistency review that the spec requires for the execution contract is the group quality review after `verify_01`, with its scope stated in `verify-01-suite.md`.

**Execution notes:**
- This plan runs under the review contract that exists today, so every task still gets its current implied spec review. The contract it changes applies to later plans.
- At graph start, record the change id the run started from; `task_05` reads the baseline skill text from it.
- The orchestrator runs `task_05` itself, because it dispatches simulation subagents.

## Context Documents
- `context/conventions.md` - how to edit skills in this repo: tone, defining a policy once and pointing at it, generated files, and what not to touch.

## Tasks
1. `task-01-shared-policy.md` - add the governing principle, sorting, and interruption rules to `using-superpowers`; rewrite `verification-before-completion` for batching, cost-justified evidence, and lightweight honest reporting.
2. `task-02-execution-contract.md` - make task-level review risk-selected in `subagent-driven-development`, `executing-plans`, `writing-plans`, and the validation scenarios; move consolidation to the acceptance point; separate local checks from batched ones.
3. `task-03-review-and-authoring.md` - apply risk-based review to `brainstorming`, `requesting-code-review`, the autonomy reference, and `writing-skills` and its testing reference; remove the requirement to run evaluations against historical builds.
4. `task-04-integration.md` - align the agent role definitions and `tool-output-discipline`, fix remaining conflicts found by targeted search, regenerate agents, and update the CHANGELOG and README.
5. `task-05-decision-simulations.md` - run batched baseline and with-policy decision simulations and the validation-scenario walk-through; record the results in this plan directory.

## Verification
1. `verify-01-suite.md` - `node --test tests/*.test.ts` and `git diff --check`, run once; the group review then checks cross-file consistency of the execution contract.
